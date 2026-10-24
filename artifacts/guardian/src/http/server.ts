import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import type { ContentType, ModeratorActionType, ReviewStatus, Severity } from "../contract.ts";
import type { GuardianConfig } from "../config.ts";
import type { Guardian } from "../guardian.ts";
import type { Logger } from "../log.ts";
import type { BoundedQueue } from "../model/queue.ts";
import { CATEGORIES, POLICY_VERSION } from "../policy/categories.ts";
import { ConflictError, NotFoundError } from "../review/store.ts";
import type { ReviewStore } from "../review/store.ts";
import { authenticate, clientAddress, isLoopback } from "./auth.ts";
import type { Role } from "./auth.ts";
import { RateLimiter } from "./rateLimit.ts";
import { ValidationError, parseModerationRequest } from "./validate.ts";

export interface ServerDeps {
  config: GuardianConfig;
  guardian: Guardian;
  store: ReviewStore;
  queue: BoundedQueue;
  log: Logger;
  modelHealth: () => Promise<{ ok: boolean; detail: string } | null>;
}

class HttpError extends Error {
  readonly status: number;
  readonly headers: Record<string, string>;
  constructor(status: number, message: string, headers: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.headers = headers;
  }
}

const ADMIN_DIR = fileURLToPath(new URL("../../admin/", import.meta.url));
const STATIC: Record<string, { file: string; type: string }> = {
  "/admin": { file: "index.html", type: "text/html; charset=utf-8" },
  "/admin/": { file: "index.html", type: "text/html; charset=utf-8" },
  "/admin/app.js": { file: "app.js", type: "text/javascript; charset=utf-8" },
  "/admin/app.css": { file: "app.css", type: "text/css; charset=utf-8" },
};
const ADMIN_CSP = "default-src 'none'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
const STATUSES = new Set<ReviewStatus | "all">(["pending", "approved", "rejected", "edit_requested", "all"]);
const SEVERITIES = new Set<Severity>(["info", "low", "medium", "high", "critical"]);
const ACTIONS = new Set<ModeratorActionType>(["approve", "reject", "request_edit"]);

export function createGuardianServer(deps: ServerDeps): Server {
  const { config, log } = deps;
  const publicLimiter = new RateLimiter(config.rateLimitPerMinute);
  const adminLimiter = new RateLimiter(Math.max(300, config.rateLimitPerMinute));

  return createServer(async (req, res) => {
    const requestId = randomUUID();
    const started = performance.now();
    const url = new URL(req.url ?? "/", "http://guardian.local");
    const ip = clientAddress(req, config.trustProxy);
    res.setHeader("x-request-id", requestId);
    res.setHeader("x-content-type-options", "nosniff");
    res.setHeader("referrer-policy", "no-referrer");
    applyCors(req, res, config.corsOrigins);
    try {
      if (req.method === "OPTIONS") return send(res, 204, null);
      await route(req, res, url, ip, deps, publicLimiter, adminLimiter);
    } catch (error) {
      const status = error instanceof HttpError ? error.status : error instanceof ValidationError ? 400 : error instanceof NotFoundError ? 404 : error instanceof ConflictError ? 409 : 500;
      if (status === 500) log.error("http.error", { request_id: requestId, error: (error as Error).name });
      const headers = error instanceof HttpError ? error.headers : {};
      for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
      sendJson(res, status, { error: status === 500 ? "internal error" : (error as Error).message, ...(error instanceof ValidationError ? { field: error.field } : {}) });
    } finally {
      log.debug("http.request", { request_id: requestId, method: req.method, path: url.pathname, status: res.statusCode, ms: Math.round(performance.now() - started) });
    }
  });
}

async function route(req: IncomingMessage, res: ServerResponse, url: URL, ip: string, deps: ServerDeps, publicLimiter: RateLimiter, adminLimiter: RateLimiter): Promise<void> {
  const { config, guardian, store, queue } = deps;
  const path = url.pathname;
  const method = req.method ?? "GET";

  if (path === "/healthz") return sendJson(res, 200, { ok: true });
  if (path === "/readyz") {
    const model = await deps.modelHealth();
    return sendJson(res, 200, { ok: true, policy_version: POLICY_VERSION, model: model ? { ...guardian.modelInfo, ...model } : { provider: "none", ok: false, detail: "rules-only mode" }, queue: queue.stats(), review: store.counts() });
  }

  if (path === "/v1/moderate" || path === "/v1/reports") {
    if (method !== "POST") throw new HttpError(405, "method not allowed", { allow: "POST" });
    limit(publicLimiter, ip);
    const body = await readJson(req, config.bodyLimitBytes);
    const request =
      path === "/v1/reports"
        ? parseModerationRequest({ ...asObject(body), content_type: "user_report" }, { allowReport: true })
        : parseModerationRequest(body, { allowReport: false });
    const decision = await guardian.moderate(request);
    return sendJson(res, 200, decision);
  }

  if (path === "/v1/policy" && method === "GET") {
    return sendJson(res, 200, { policy_version: POLICY_VERSION, categories: CATEGORIES });
  }

  if (path in STATIC || path.startsWith("/v1/review")) {
    if (!config.adminAllowRemote && !isLoopback(ip)) throw new HttpError(403, "moderator access is only available from this machine");
    limit(adminLimiter, ip);
    if (path in STATIC) return serveStatic(res, STATIC[path]);
    const role = authenticate(req, config.adminToken, config.trustSafetyToken);
    if (!role) throw new HttpError(401, "moderator token required", { "www-authenticate": 'Bearer realm="guardian"' });
    return adminRoute(req, res, url, method, role, store, config);
  }

  throw new HttpError(404, "not found");
}

async function adminRoute(req: IncomingMessage, res: ServerResponse, url: URL, method: string, role: Role, store: ReviewStore, config: GuardianConfig): Promise<void> {
  const path = url.pathname;
  const actor = role === "trust_safety" ? "trust-safety" : "moderator";

  if (path === "/v1/review/queue" && method === "GET") {
    const status = (url.searchParams.get("status") ?? "pending") as ReviewStatus | "all";
    const contentType = url.searchParams.get("content_type") as ContentType | null;
    const severity = url.searchParams.get("severity") as Severity | null;
    if (!STATUSES.has(status)) throw new ValidationError("status", "invalid status");
    if (severity && !SEVERITIES.has(severity)) throw new ValidationError("severity", "invalid severity");
    return sendJson(res, 200, { items: store.list({ status, content_type: contentType ?? undefined, severity: severity ?? undefined }), counts: store.counts(), role });
  }
  if (path === "/v1/review/history" && method === "GET") {
    const lim = Math.min(500, Math.max(1, Number(url.searchParams.get("limit") ?? 100) || 100));
    return sendJson(res, 200, { entries: store.history(lim, (url.searchParams.get("content_type") as ContentType | null) ?? undefined) });
  }

  const m = /^\/v1\/review\/items\/(rv_[A-Za-z0-9-]{1,32})(?:\/(actions|reveal))?$/.exec(path);
  if (!m) throw new HttpError(404, "not found");
  const [, id, sub] = m;
  if (!sub && method === "GET") return sendJson(res, 200, store.get(id));
  if (sub === "actions" && method === "POST") {
    const body = asObject(await readJson(req, config.bodyLimitBytes));
    const action = body.action as ModeratorActionType;
    if (!ACTIONS.has(action)) throw new ValidationError("action", "action must be approve, reject or request_edit");
    const note = typeof body.note === "string" ? body.note.slice(0, 500) : undefined;
    return sendJson(res, 200, store.act(id, action, actor, note));
  }
  if (sub === "reveal" && method === "POST") {
    if (role !== "trust_safety") throw new HttpError(403, "revealing private messages requires the Trust & Safety token");
    const body = asObject(await readJson(req, config.bodyLimitBytes));
    const note = typeof body.note === "string" ? body.note.slice(0, 500) : undefined;
    return sendJson(res, 200, store.reveal(id, actor, note));
  }
  throw new HttpError(405, "method not allowed");
}

function limit(limiter: RateLimiter, ip: string): void {
  const retry = limiter.take(ip);
  if (retry) throw new HttpError(429, "too many requests", { "retry-after": String(retry) });
}

function asObject(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new ValidationError("body", "expected a JSON object");
  return v as Record<string, unknown>;
}

async function readJson(req: IncomingMessage, limitBytes: number): Promise<unknown> {
  const type = req.headers["content-type"] ?? "";
  if (!type.toLowerCase().startsWith("application/json")) throw new HttpError(415, "content-type must be application/json");
  const declared = Number(req.headers["content-length"] ?? 0);
  if (declared > limitBytes) throw new HttpError(413, "request body too large");
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > limitBytes) throw new HttpError(413, "request body too large");
    chunks.push(chunk as Buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "invalid JSON");
  }
}

async function serveStatic(res: ServerResponse, entry: { file: string; type: string }): Promise<void> {
  const body = await readFile(ADMIN_DIR + entry.file);
  res.setHeader("content-security-policy", ADMIN_CSP);
  res.setHeader("x-frame-options", "DENY");
  res.setHeader("cache-control", "no-store");
  res.writeHead(200, { "content-type": entry.type });
  res.end(body);
}

function applyCors(req: IncomingMessage, res: ServerResponse, allowed: string[]): void {
  const origin = req.headers.origin;
  if (!origin || !allowed.includes(origin)) return;
  res.setHeader("access-control-allow-origin", origin);
  res.setHeader("vary", "Origin");
  res.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type, authorization");
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.setHeader("cache-control", "no-store");
  send(res, status, JSON.stringify(body), "application/json; charset=utf-8");
}

function send(res: ServerResponse, status: number, body: string | null, type?: string): void {
  if (type) res.setHeader("content-type", type);
  res.writeHead(status);
  res.end(body ?? undefined);
}
