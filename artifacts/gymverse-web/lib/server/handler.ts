import { UTM_KEYS } from "../attribution.ts";
import type { Channel } from "../attribution.ts";
import { EMPTY_COACH, EMPTY_MEMBER, prepareCoach, prepareMember } from "../waitlist.ts";
import type { CoachFormValues, MemberFormValues, SubmissionContext, WaitlistSubmission } from "../waitlist.ts";
import { DEFAULT_CONFIRMATION_FROM, DEFAULT_NOTIFY_FROM, DEFAULT_NOTIFY_TO, buildConfirmationEmail, buildTeamNotification, confirmationsEnabled, describeMailError, getMailer } from "./email.ts";
import type { ConnectFn, WaitlistEnv } from "./env.ts";
import { RATE_LIMIT_WINDOW_MS, consumeRateLimit, countSignups, ensureSchema, hashClientKey, insertSignup, recordConfirmation, recordNotification } from "./store.ts";

export const MAX_BODY_BYTES = 8 * 1024;
/** Hidden field real visitors never fill in; bots that do are silently dropped. */
export const HONEYPOT_FIELD = "website";

const CHANNELS: readonly Channel[] = ["tiktok", "instagram", "youtube_shorts", "paid", "gym_flyer_qr", "campus", "creator", "referral", "other", "direct"];

export type ApiError = "invalid" | "rate_limited" | "unavailable" | "forbidden" | "unsupported" | "too_large" | "server_error";
export type ApiResponseBody = { ok: true } | { ok: false; error: ApiError; fields?: string[] };

type WaitUntil = (promise: Promise<unknown>) => void;
interface HandlerOptions {
  now?: () => Date;
  newId?: () => string;
  fetchImpl?: typeof fetch;
  /** `connect` from `cloudflare:sockets`; needed only for the Gmail SMTP provider. */
  connect?: ConnectFn;
}

function json(body: ApiResponseBody, status: number, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers } });
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

/** Copies only known fields with the right primitive types; validation happens in prepareMember/prepareCoach. */
function pick<T extends object>(template: T, input: unknown): T {
  const out = { ...template } as Record<string, unknown>;
  if (!isRecord(input)) return out as T;
  for (const [key, empty] of Object.entries(template)) {
    const v = input[key];
    if (typeof empty === "boolean" && typeof v === "boolean") out[key] = v;
    else if (typeof empty === "string" && typeof v === "string") out[key] = v.slice(0, 600);
  }
  return out as T;
}

/** Client-supplied attribution, reduced to safe, bounded values. */
export function sanitizeContext(input: unknown): SubmissionContext {
  const c = isRecord(input) ? input : {};
  const heroVariant = ["1", "2", "3"].includes(c.heroVariant as string) ? (c.heroVariant as string) : "1";
  const channel = CHANNELS.includes(c.channel as Channel) ? (c.channel as string) : "direct";
  const utm: Record<string, string> = {};
  if (isRecord(c.utm)) for (const k of UTM_KEYS) { const v = str(c.utm[k], 100).trim().toLowerCase(); if (v) utm[k] = v; }
  const host = str(c.referrerHost, 253).trim().toLowerCase();
  return { heroVariant, channel, utm, referrerHost: /^[a-z0-9.-]+$/.test(host) ? host : "" };
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

/** POST /api/waitlist. Never returns stored data; duplicates get the same response as new signups. */
export async function handleWaitlistPost(request: Request, env: WaitlistEnv, waitUntil: WaitUntil, opts: HandlerOptions = {}): Promise<Response> {
  const now = opts.now?.() ?? new Date();
  try {
    if (!sameOrigin(request)) return json({ ok: false, error: "forbidden" }, 403);
    if (!(request.headers.get("Content-Type") ?? "").toLowerCase().startsWith("application/json")) return json({ ok: false, error: "unsupported" }, 415);
    if (Number(request.headers.get("Content-Length") ?? 0) > MAX_BODY_BYTES) return json({ ok: false, error: "too_large" }, 413);
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return json({ ok: false, error: "too_large" }, 413);

    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return json({ ok: false, error: "invalid" }, 400);
    }
    if (!isRecord(body) || (body.kind !== "member" && body.kind !== "coach")) return json({ ok: false, error: "invalid" }, 400);
    if (str(body[HONEYPOT_FIELD], 200).trim()) return json({ ok: true }, 200);

    const db = env.DB;
    if (!db) {
      console.error(JSON.stringify({ event: "waitlist_db_missing" }));
      return json({ ok: false, error: "unavailable" }, 503);
    }
    await ensureSchema(db);

    const ip = request.headers.get("CF-Connecting-IP") ?? "local";
    const key = await hashClientKey(ip, env.WAITLIST_HASH_SALT ?? "gymx-waitlist");
    if (!(await consumeRateLimit(db, key, now.getTime()))) {
      return json({ ok: false, error: "rate_limited" }, 429, { "Retry-After": String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)) });
    }

    const context = sanitizeContext(body.context);
    const prepared =
      body.kind === "member"
        ? prepareMember(pick<MemberFormValues>(EMPTY_MEMBER, body.values), context, now)
        : prepareCoach(pick<CoachFormValues>(EMPTY_COACH, body.values), context, now);
    if (!prepared.ok) return json({ ok: false, error: "invalid", fields: Object.keys(prepared.errors) }, 400);

    const id = opts.newId?.() ?? crypto.randomUUID();
    const inserted = await insertSignup(db, prepared.submission, id);
    if (inserted.created) waitUntil(afterSignup(env, prepared.submission, id, opts.fetchImpl, opts.connect));
    return json({ ok: true }, 200);
  } catch (e) {
    console.error(JSON.stringify({ event: "waitlist_error", message: (e as Error)?.message?.slice(0, 200) ?? "unknown" }));
    return json({ ok: false, error: "server_error" }, 500);
  }
}

/** Runs after the response: team notification, then optional confirmation. Failures never touch the saved signup. */
export async function afterSignup(env: WaitlistEnv, s: WaitlistSubmission, id: string, fetchImpl?: typeof fetch, connect?: ConnectFn): Promise<void> {
  const db = env.DB!;
  const at = new Date().toISOString();
  const mailer = getMailer(env, fetchImpl, connect);
  if (!mailer) {
    await recordNotification(db, id, { status: "skipped", error: "no email provider configured" }, at);
    console.warn(JSON.stringify({ event: "waitlist_notify_skipped", id, reason: "no email provider configured" }));
    return;
  }

  try {
    const totals = await countSignups(db).catch(() => null);
    const message = buildTeamNotification({ kind: s.kind, email: s.email, createdAt: s.submittedAt, totals }, env.NOTIFY_TO?.trim() || DEFAULT_NOTIFY_TO, env.NOTIFY_FROM?.trim() || DEFAULT_NOTIFY_FROM);
    await mailer.send(message, `${id}:team`);
    await recordNotification(db, id, { status: "sent" }, at);
  } catch (e) {
    const error = describeMailError(e);
    console.error(JSON.stringify({ event: "waitlist_notify_failed", id, provider: mailer.provider, error }));
    await recordNotification(db, id, { status: "failed", error }, at).catch(() => {});
  }

  if (!confirmationsEnabled(env)) return;
  try {
    await mailer.send(buildConfirmationEmail(s.email, env.CONFIRMATION_FROM?.trim() || DEFAULT_CONFIRMATION_FROM), `${id}:confirmation`);
    await recordConfirmation(db, id, "sent");
  } catch (e) {
    console.error(JSON.stringify({ event: "waitlist_confirmation_failed", id, provider: mailer.provider, error: describeMailError(e) }));
    await recordConfirmation(db, id, "failed").catch(() => {});
  }
}
