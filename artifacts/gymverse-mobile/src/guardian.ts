import Constants from "expo-constants";
import type { ContentType, ModerationDecision } from "../../guardian/src/contract";

/**
 * GYMVERSE Guardian client.
 *
 * Configure with EXPO_PUBLIC_GUARDIAN_URL (in .env.local):
 *   - unset / "off": Guardian disabled, app behaves exactly as before
 *   - "auto":        use the computer that serves the Expo bundle (same Wi-Fi), port EXPO_PUBLIC_GUARDIAN_PORT (8787)
 *   - a URL:         e.g. http://192.168.68.84:8787 or a future https://guardian.example.com
 * Only the URL lives in the app. Inference and moderator tools stay on the server.
 */
const RAW_URL = (process.env.EXPO_PUBLIC_GUARDIAN_URL ?? "").trim();
const PORT = (process.env.EXPO_PUBLIC_GUARDIAN_PORT ?? "").trim() || "8787";
const TIMEOUT_MS = 8000;

export const guardianEnabled = RAW_URL !== "" && RAW_URL.toLowerCase() !== "off";

function resolveBaseUrl(): { url: string | null; problem?: string } {
  if (RAW_URL.toLowerCase() !== "auto") return { url: RAW_URL.replace(/\/+$/, "") };
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  if (!host) return { url: null, problem: "could not detect the development computer" };
  if (/\.(exp\.direct|on\.expo\.app|ngrok\S*)$/i.test(host)) {
    return { url: null, problem: "Expo tunnel mode can't reach Guardian automatically; set EXPO_PUBLIC_GUARDIAN_URL" };
  }
  return { url: `http://${host}:${PORT}` };
}

function pending(content_type: ContentType, reason: string): ModerationDecision {
  return {
    decision_id: `local-${Date.now()}`,
    content_type,
    status: "needs_review",
    risk_score: 0.5,
    categories: ["needs_human_review"],
    labels: [],
    reason,
    source: "client_fallback",
    requires_human_review: true,
    retryable: true,
    findings: [],
    policy_version: "client",
  };
}

function isDecision(v: unknown): v is ModerationDecision {
  const o = v as Partial<ModerationDecision> | null;
  return !!o && (o.status === "approved" || o.status === "needs_review" || o.status === "rejected") && typeof o.reason === "string";
}

/**
 * Asks Guardian about a piece of content. Returns null when Guardian is disabled.
 * When Guardian is enabled but unreachable, content is held as "needs review" — never silently approved.
 */
export async function moderate(content_type: ContentType, text: string, authorId?: string): Promise<ModerationDecision | null> {
  if (!guardianEnabled) return null;
  const { url, problem } = resolveBaseUrl();
  if (!url) return pending(content_type, `Guardian unavailable (${problem}). Held for review.`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${url}/v1/moderate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content_type, text, author_id: authorId }),
      signal: controller.signal,
    });
    if (res.status === 429) return pending(content_type, "Guardian is busy. Held for review.");
    const body: unknown = await res.json().catch(() => null);
    if (!res.ok || !isDecision(body)) return pending(content_type, "Guardian could not check this right now. Held for review.");
    return body;
  } catch {
    return pending(content_type, "Guardian is unreachable. Held for review.");
  } finally {
    clearTimeout(timer);
  }
}
