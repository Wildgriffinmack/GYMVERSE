import type { WaitlistSubmission } from "../waitlist.ts";
import type { D1Database } from "./env.ts";
import { SCHEMA_STATEMENTS } from "./schema.ts";

export const SIGNUP_SOURCE = "gymx.life website";

/** Rate limit: at most RATE_LIMIT_MAX submissions per hashed IP per RATE_LIMIT_WINDOW_MS. */
export const RATE_LIMIT_MAX = 5;
export const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

let schemaReady: WeakSet<D1Database> = new WeakSet();

/** Applies the schema once per database binding per isolate (IF NOT EXISTS, so it is safe to repeat). */
export async function ensureSchema(db: D1Database): Promise<void> {
  if (schemaReady.has(db)) return;
  await db.batch(SCHEMA_STATEMENTS.map((sql) => db.prepare(sql)));
  schemaReady.add(db);
}

/** Test helper: forget which databases already have the schema. */
export function resetSchemaCache(): void {
  schemaReady = new WeakSet();
}

const flag = (v: boolean | null | undefined) => (v === null || v === undefined ? null : v ? 1 : 0);

export type InsertResult = { created: true; id: string } | { created: false };

/**
 * Inserts a signup. The UNIQUE (kind, email) constraint makes duplicates a no-op,
 * so concurrent double-submits can never create two rows.
 */
export async function insertSignup(db: D1Database, s: WaitlistSubmission, id: string): Promise<InsertResult> {
  const member = s.kind === "member" ? s : null;
  const coach = s.kind === "coach" ? s : null;
  const result = await db
    .prepare(
      `INSERT INTO waitlist_signups (
        id, kind, email, full_name, source, created_at,
        age_range, confirmed_age_13, fitness_level, user_type, struggle, beta_tester, heard_from,
        handle, coach_type, audience_size, help_most, lead_beta,
        channel, hero_variant, utm, referrer_host
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (kind, email) DO NOTHING`,
    )
    .bind(
      id,
      s.kind,
      s.email,
      s.fullName,
      SIGNUP_SOURCE,
      s.submittedAt,
      member?.ageRange ?? null,
      flag(member?.confirmedAge13),
      member?.fitnessLevel ?? null,
      member?.userType ?? null,
      member?.struggle ?? null,
      flag(member?.betaTester),
      member?.source ?? null,
      coach?.handle ?? null,
      coach?.coachType ?? null,
      coach?.audienceSize ?? null,
      coach?.helpMost ?? null,
      flag(coach?.leadBeta),
      s.context.channel,
      s.context.heroVariant,
      Object.keys(s.context.utm).length ? JSON.stringify(s.context.utm) : null,
      s.context.referrerHost || null,
    )
    .run();
  return (result.meta?.changes ?? 0) > 0 ? { created: true, id } : { created: false };
}

export async function countSignups(db: D1Database): Promise<{ members: number; coaches: number }> {
  const row = await db
    .prepare(
      `SELECT
        SUM(CASE WHEN kind = 'member' THEN 1 ELSE 0 END) AS members,
        SUM(CASE WHEN kind = 'coach' THEN 1 ELSE 0 END) AS coaches
      FROM waitlist_signups`,
    )
    .first<{ members: number | null; coaches: number | null }>();
  return { members: Number(row?.members ?? 0), coaches: Number(row?.coaches ?? 0) };
}

export type NotifyOutcome = { status: "sent" } | { status: "failed"; error: string } | { status: "skipped"; error: string };

export async function recordNotification(db: D1Database, id: string, outcome: NotifyOutcome, at: string): Promise<void> {
  await db
    .prepare(
      `UPDATE waitlist_signups
       SET notify_status = ?, notify_attempts = notify_attempts + ?, notify_error = ?, notified_at = ?
       WHERE id = ?`,
    )
    .bind(outcome.status, outcome.status === "skipped" ? 0 : 1, outcome.status === "sent" ? null : outcome.error, outcome.status === "sent" ? at : null, id)
    .run();
}

export async function recordConfirmation(db: D1Database, id: string, status: "sent" | "failed" | "disabled"): Promise<void> {
  await db.prepare(`UPDATE waitlist_signups SET confirmation_status = ? WHERE id = ?`).bind(status, id).run();
}

/** SHA-256 of salt + client IP, so raw IP addresses are never stored. */
export async function hashClientKey(ip: string, salt: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}|${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Fixed-window counter in D1. Returns true when the request is allowed. */
export async function consumeRateLimit(db: D1Database, key: string, nowMs: number): Promise<boolean> {
  const window = Math.floor(nowMs / RATE_LIMIT_WINDOW_MS);
  const row = await db
    .prepare(
      `INSERT INTO waitlist_rate_limits (key, window_start, count) VALUES (?1, ?2, 1)
       ON CONFLICT (key) DO UPDATE SET
         count = CASE WHEN window_start = ?2 THEN count + 1 ELSE 1 END,
         window_start = ?2
       RETURNING count`,
    )
    .bind(key, window)
    .first<{ count: number }>();
  const count = Number(row?.count ?? 1);
  // Opportunistic cleanup of old windows (cheap; the table only holds recent visitors).
  if (count === 1) await db.prepare(`DELETE FROM waitlist_rate_limits WHERE window_start < ?`).bind(window - 6).run();
  return count <= RATE_LIMIT_MAX;
}
