/**
 * First-touch traffic attribution from UTM parameters and the referrer.
 * Pure functions (no browser globals) so they can be unit tested.
 */

export type Channel =
  | "tiktok"
  | "instagram"
  | "youtube_shorts"
  | "paid"
  | "gym_flyer_qr"
  | "campus"
  | "creator"
  | "referral"
  | "other"
  | "direct";

export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
export type UtmKey = (typeof UTM_KEYS)[number];
export type Utm = Partial<Record<UtmKey, string>>;

export interface Attribution {
  channel: Channel;
  utm: Utm;
  referrerHost: string;
}

const PAID_MEDIUMS = new Set(["cpc", "ppc", "paid", "paid_social", "paidsocial", "paid-social", "ads", "ad", "display", "sponsored"]);
const QR_MEDIUMS = new Set(["qr", "flyer", "print", "poster", "offline"]);

function hostMatches(host: string, domains: readonly string[]): boolean {
  return domains.some((d) => host === d || host.endsWith(`.${d}`));
}

function stripWww(host: string): string {
  return host.toLowerCase().replace(/^www\./, "");
}

export function classifyChannel(utm: Utm, referrerHost: string): Channel {
  const source = utm.utm_source ?? "";
  const medium = utm.utm_medium ?? "";
  const campaign = utm.utm_campaign ?? "";

  if (PAID_MEDIUMS.has(medium)) return "paid";
  if (medium === "creator" || medium === "influencer" || source.startsWith("creator")) return "creator";
  if ([source, medium, campaign].some((v) => v.includes("campus"))) return "campus";
  if (QR_MEDIUMS.has(medium) || /^(gym|flyer|qr|poster)/.test(source)) return "gym_flyer_qr";
  if (source.includes("tiktok") || hostMatches(referrerHost, ["tiktok.com"])) return "tiktok";
  if (source === "ig" || source.includes("instagram") || hostMatches(referrerHost, ["instagram.com"])) return "instagram";
  if (source === "yt" || source.includes("youtube") || source.includes("shorts") || hostMatches(referrerHost, ["youtube.com", "youtu.be"])) {
    return "youtube_shorts";
  }
  if (source) return "other";
  if (referrerHost) return "referral";
  return "direct";
}

export function parseAttribution(search: string, referrer: string, ownHost = ""): Attribution {
  const params = new URLSearchParams(search);
  const utm: Utm = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim().toLowerCase().slice(0, 100);
    if (value) utm[key] = value;
  }
  let referrerHost = "";
  if (referrer) {
    try {
      referrerHost = stripWww(new URL(referrer).hostname);
    } catch {
      referrerHost = "";
    }
  }
  if (referrerHost && ownHost && referrerHost === stripWww(ownHost)) referrerHost = "";
  return { channel: classifyChannel(utm, referrerHost), utm, referrerHost };
}
