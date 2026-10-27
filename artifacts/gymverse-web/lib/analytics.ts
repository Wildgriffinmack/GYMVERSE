/**
 * Privacy-light event tracking. Events are pushed to `window.dataLayer` (the format
 * Google Tag Manager / GA4 read) and re-dispatched as a `gv:analytics` DOM event.
 * No third-party scripts are loaded and nothing is stored on the device.
 * Never pass names, emails, handles or free text into `track`.
 */
import { parseAttribution } from "./attribution.ts";
import type { Attribution } from "./attribution.ts";
import { resolveHeroVariant } from "./variants.ts";
import type { SubmissionContext } from "./waitlist.ts";

export type AnalyticsEvent =
  | "page_view"
  | "cta_click"
  | "waitlist_tab_select"
  | "form_start"
  | "form_submit_error"
  | "waitlist_signup"
  | "coach_application";

export type EventProps = Record<string, string | number | boolean | null | undefined>;

export const ANALYTICS_EVENT = "gv:analytics";

interface AnalyticsContext {
  heroVariant: string;
  attribution: Attribution;
}

const DEFAULT_VARIANT_ID = "1";

let context: AnalyticsContext | null = null;

export function initAnalytics(heroVariant: string): AnalyticsContext {
  context = {
    heroVariant,
    attribution: parseAttribution(window.location.search, document.referrer, window.location.hostname),
  };
  return context;
}

export function getAnalyticsContext(): AnalyticsContext {
  if (context) return context;
  if (typeof window === "undefined") {
    return { heroVariant: DEFAULT_VARIANT_ID, attribution: { channel: "direct", utm: {}, referrerHost: "" } };
  }
  return initAnalytics(resolveHeroVariant(new URLSearchParams(window.location.search).get("v")).id);
}

export function submissionContext(): SubmissionContext {
  const { heroVariant, attribution } = getAnalyticsContext();
  return { heroVariant, channel: attribution.channel, utm: { ...attribution.utm }, referrerHost: attribution.referrerHost };
}

export function track(event: AnalyticsEvent, props: EventProps = {}): void {
  if (typeof window === "undefined") return;
  const { heroVariant, attribution } = getAnalyticsContext();
  const payload: Record<string, unknown> = { event, hero_variant: heroVariant, channel: attribution.channel, ...attribution.utm };
  if (attribution.referrerHost) payload.referrer_host = attribution.referrerHost;
  for (const [key, value] of Object.entries(props)) if (value !== undefined) payload[key] = value;

  const w = window as unknown as { dataLayer?: unknown[] };
  (w.dataLayer ??= []).push(payload);
  window.dispatchEvent(new CustomEvent(ANALYTICS_EVENT, { detail: payload }));
  if (process.env.NODE_ENV !== "production") console.debug("[GYMX analytics]", payload);
}
