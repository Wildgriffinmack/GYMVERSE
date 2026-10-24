import { createHash, timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";

export type Role = "moderator" | "trust_safety";

function digest(s: string): Buffer {
  return createHash("sha256").update(s).digest();
}

function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(digest(a), digest(b));
}

/** Resolves the caller's role from a Bearer token. Trust & Safety implies moderator rights. */
export function authenticate(req: IncomingMessage, adminToken: string, trustSafetyToken: string | null): Role | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const presented = header.slice(7).trim();
  if (!presented) return null;
  if (trustSafetyToken && safeEqual(presented, trustSafetyToken)) return "trust_safety";
  if (safeEqual(presented, adminToken)) return "moderator";
  return null;
}

export function isLoopback(address: string | undefined): boolean {
  if (!address) return false;
  return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1" || address.startsWith("127.");
}

/** Client address; X-Forwarded-For is honored only when explicitly configured. */
export function clientAddress(req: IncomingMessage, trustProxy: boolean): string {
  if (trustProxy) {
    const fwd = req.headers["x-forwarded-for"];
    const first = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.socket.remoteAddress ?? "unknown";
}
