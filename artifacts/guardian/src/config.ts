import { randomBytes } from "node:crypto";
import type { LogLevel } from "./log.ts";

export interface GuardianConfig {
  host: string;
  port: number;
  adminToken: string;
  adminTokenGenerated: boolean;
  /** Optional second credential that may reveal private (DM) content. Unset = never revealable. */
  trustSafetyToken: string | null;
  /** Admin API and dashboard are loopback-only unless explicitly allowed (e.g. behind an authenticated proxy). */
  adminAllowRemote: boolean;
  trustProxy: boolean;
  corsOrigins: string[];
  rateLimitPerMinute: number;
  bodyLimitBytes: number;
  model: {
    provider: "none" | "ollama";
    name: string;
    ollamaUrl: string;
    think: boolean | "low" | "medium" | "high";
    timeoutMs: number;
    concurrency: number;
    maxWaiting: number;
    screenAll: boolean;
  };
  lexiconPath: string | null;
  demoData: boolean;
  logLevel: LogLevel;
}

export class ConfigError extends Error {
  override name = "ConfigError";
}

type Env = Record<string, string | undefined>;

function int(env: Env, key: string, fallback: number, min: number, max: number): number {
  const raw = env[key];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) throw new ConfigError(`${key} must be an integer between ${min} and ${max}`);
  return n;
}

function bool(env: Env, key: string, fallback: boolean): boolean {
  const raw = env[key]?.trim().toLowerCase();
  if (!raw) return fallback;
  if (["1", "true", "yes", "on"].includes(raw)) return true;
  if (["0", "false", "no", "off"].includes(raw)) return false;
  throw new ConfigError(`${key} must be true or false`);
}

function token(env: Env, key: string): string | null {
  const v = env[key]?.trim();
  if (!v) return null;
  if (v.length < 24) throw new ConfigError(`${key} must be at least 24 characters`);
  return v;
}

export function loadConfig(env: Env = process.env, overrides: { lan?: boolean; port?: number } = {}): GuardianConfig {
  const provider = (env.GUARDIAN_MODEL_PROVIDER ?? "none").trim().toLowerCase();
  if (provider !== "none" && provider !== "ollama") throw new ConfigError("GUARDIAN_MODEL_PROVIDER must be none or ollama");
  const model = (env.GUARDIAN_MODEL ?? "").trim();
  if (provider !== "none" && !model) throw new ConfigError("GUARDIAN_MODEL is required when a model provider is enabled (e.g. qwen3:4b)");
  const thinkRaw = (env.GUARDIAN_MODEL_THINK ?? "false").trim().toLowerCase();
  const think = thinkRaw === "true" ? true : thinkRaw === "false" ? false : thinkRaw;
  if (think !== true && think !== false && think !== "low" && think !== "medium" && think !== "high") throw new ConfigError("GUARDIAN_MODEL_THINK must be false, true, low, medium or high");

  const adminToken = token(env, "GUARDIAN_ADMIN_TOKEN");
  const trustSafetyToken = token(env, "GUARDIAN_TRUST_SAFETY_TOKEN");
  if (adminToken && trustSafetyToken && adminToken === trustSafetyToken) throw new ConfigError("GUARDIAN_TRUST_SAFETY_TOKEN must differ from GUARDIAN_ADMIN_TOKEN");
  const logLevel = (env.GUARDIAN_LOG_LEVEL ?? "info") as LogLevel;
  if (!["debug", "info", "warn", "error"].includes(logLevel)) throw new ConfigError("GUARDIAN_LOG_LEVEL must be debug, info, warn or error");

  return {
    host: overrides.lan ? "0.0.0.0" : (env.GUARDIAN_HOST?.trim() || "127.0.0.1"),
    port: overrides.port ?? int(env, "GUARDIAN_PORT", 8787, 0, 65535),
    adminToken: adminToken ?? randomBytes(24).toString("base64url"),
    adminTokenGenerated: !adminToken,
    trustSafetyToken,
    adminAllowRemote: bool(env, "GUARDIAN_ADMIN_ALLOW_REMOTE", false),
    trustProxy: bool(env, "GUARDIAN_TRUST_PROXY", false),
    corsOrigins: (env.GUARDIAN_CORS_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    rateLimitPerMinute: int(env, "GUARDIAN_RATE_LIMIT_PER_MIN", 60, 1, 100000),
    bodyLimitBytes: int(env, "GUARDIAN_BODY_LIMIT_BYTES", 32 * 1024, 1024, 1024 * 1024),
    model: {
      provider,
      name: model,
      ollamaUrl: env.OLLAMA_URL?.trim() || "http://127.0.0.1:11434",
      think,
      timeoutMs: int(env, "GUARDIAN_MODEL_TIMEOUT_MS", 15000, 500, 600000),
      concurrency: int(env, "GUARDIAN_MODEL_CONCURRENCY", 2, 1, 64),
      maxWaiting: int(env, "GUARDIAN_MODEL_MAX_WAITING", 32, 0, 10000),
      screenAll: bool(env, "GUARDIAN_MODEL_SCREEN_ALL", false),
    },
    lexiconPath: env.GUARDIAN_LEXICON_PATH?.trim() || null,
    demoData: bool(env, "GUARDIAN_DEMO_DATA", true),
    logLevel,
  };
}
