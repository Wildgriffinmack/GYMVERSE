/**
 * Creator Pro — DEMONSTRATION DATA (Phase 4).
 *
 * Fictional, fixed data for a Coming Soon preview. Nothing is collected from the GYMX feed,
 * nothing is tracked, and nothing here changes how posts are ranked. Every aggregate on the
 * Creator Studio screen is derived from DEMO_POSTS below, so totals, charts, categories and
 * post-level figures always agree. Pure module (type-only imports) for plain-Node tests.
 */
import type { PostArtData } from "../data";
import type { PremiumFeature } from "../membership/entitlements";

export const STUDIO_COPY = {
  title: "CREATOR STUDIO",
  subtitle: "Understand your content. Grow your community.",
  tagline: "Grow your fitness audience.",
  supporting: "Create smarter. Understand your audience. Grow organically.",
  pill: "CREATOR PRO · COMING SOON",
  demoNote: "Demo data — fictional example numbers, not collected from the GYMX feed.",
  organicNote: "Creator Pro never boosts your posts. Feed reach stays organic: no paid ranking and no guaranteed followers, views, likes, saves or shares.",
  erFormula: "Engagement rate = (likes + comments + saves + shares) ÷ views. Period totals count posts published in that period.",
  schedulingBanner: "Scheduling Preview — Coming Soon",
  marketplace: "Discover potential opportunities to collaborate with fitness brands.",
  campaignTag: "DEMO OPPORTUNITY · NOT A LIVE CAMPAIGN",
  campaignDisclaimer:
    "Fictional example for demonstration. There is no real brand, application, contract, payment or sponsorship, and GYMX has no partnership with any brand shown. No sponsorship is guaranteed.",
  badgeCreatorPro: "CREATOR PRO",
  badgeIdentity: "CONTENT CREATOR",
  badgeNote: "Badges show a demo membership and a creator identity. They are not professional verification and say nothing about audience size.",
} as const;

/** Fixed "today" for the demo calendar so dates are deterministic. */
export const DEMO_TODAY = Date.UTC(2026, 9, 23);
const DAY_MS = 86400000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function dateLabel(daysFromToday: number): string {
  const d = new Date(DEMO_TODAY + daysFromToday * DAY_MS);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}
export function weekdayLabel(daysFromToday: number): string {
  return WEEKDAYS[new Date(DEMO_TODAY + daysFromToday * DAY_MS).getUTCDay()];
}

// ── Periods ─────────────────────────────────────────────────────────────────
export type PeriodId = "7d" | "30d" | "90d";
export const PERIODS: { id: PeriodId; label: string; days: number }[] = [
  { id: "7d", label: "7 Days", days: 7 },
  { id: "30d", label: "30 Days", days: 30 },
  { id: "90d", label: "90 Days", days: 90 },
];
const DAYS: Record<PeriodId, number> = { "7d": 7, "30d": 30, "90d": 90 };

// ── Categories & posts ──────────────────────────────────────────────────────
export type ContentCategory = "gym_edit" | "transformation" | "tutorial" | "motivation" | "strength";
export const CONTENT_CATEGORIES: { id: ContentCategory; label: string }[] = [
  { id: "gym_edit", label: "Gym edits" },
  { id: "transformation", label: "Transformation posts" },
  { id: "tutorial", label: "Workout tutorials" },
  { id: "motivation", label: "Motivation content" },
  { id: "strength", label: "Strength training clips" },
];

export interface Metrics {
  views: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
}

export interface CreatorPost extends Metrics {
  id: string;
  title: string;
  category: ContentCategory;
  /** Days before DEMO_TODAY the post was published (0 = today). */
  daysAgo: number;
  art: PostArtData;
}

const edit = (headline: string): PostArtData => ({ visual: "edit", headline, subline: "Gym edit" });
const pr = (stat: string, headline: string): PostArtData => ({ visual: "pr", stat, unit: "LB", headline, subline: "PR" });
const routine = (headline: string, lines: [string, string][]): PostArtData => ({ visual: "routine", headline, subline: "Tutorial", lines: lines.map(([label, detail]) => ({ label, detail })) });
const change = (headline: string, after: string): PostArtData => ({ visual: "transformation", headline, subline: "Transformation", lines: [{ label: "Before", detail: "Day 01" }, { label: "After", detail: after }] });
const quote = (headline: string): PostArtData => ({ visual: "motivation", headline, subline: "" });

/** Fictional creator posts. The 30-day window sums to 48,250 views · 6,420 likes · 1,180 saves · 740 shares. */
export const DEMO_POSTS: CreatorPost[] = [
  { id: "cp1", title: "LEG DAY MOTIVATION", category: "gym_edit", daysAgo: 3, views: 12400, likes: 1780, comments: 96, saves: 210, shares: 260, art: edit("Leg day doesn't skip you") },
  { id: "cp2", title: "PUSH DAY ROUTINE", category: "tutorial", daysAgo: 6, views: 9850, likes: 1240, comments: 84, saves: 330, shares: 190, art: routine("Push Day", [["Bench", "4 × 6"], ["Incline DB", "3 × 10"], ["Dips", "3 × 8"]]) },
  { id: "cp3", title: "BENCH 225 PR", category: "strength", daysAgo: 9, views: 6200, likes: 960, comments: 71, saves: 90, shares: 60, art: pr("225", "Bench Press") },
  { id: "cp4", title: "6-MONTH TRANSFORMATION", category: "transformation", daysAgo: 14, views: 11300, likes: 1520, comments: 112, saves: 420, shares: 150, art: change("6 Months", "Month 06") },
  { id: "cp5", title: "DISCIPLINE OVER MOOD", category: "motivation", daysAgo: 21, views: 5100, likes: 610, comments: 28, saves: 85, shares: 55, art: quote("Discipline over mood.") },
  { id: "cp6", title: "SQUAT FORM CUES", category: "tutorial", daysAgo: 27, views: 3400, likes: 310, comments: 19, saves: 45, shares: 25, art: routine("Squat Cues", [["Brace", "Breathe in"], ["Depth", "Below knee"], ["Drive", "Through floor"]]) },
  { id: "cp7", title: "DEADLIFT 405 PR", category: "strength", daysAgo: 34, views: 8900, likes: 1310, comments: 88, saves: 120, shares: 95, art: pr("405", "Deadlift") },
  { id: "cp8", title: "LATE NIGHT GRIND EDIT", category: "gym_edit", daysAgo: 41, views: 10200, likes: 1350, comments: 70, saves: 140, shares: 210, art: edit("Built in silence") },
  { id: "cp9", title: "PULL DAY BASICS", category: "tutorial", daysAgo: 52, views: 6700, likes: 720, comments: 45, saves: 260, shares: 130, art: routine("Pull Day", [["Rows", "4 × 8"], ["Pulldown", "3 × 10"], ["Curls", "3 × 12"]]) },
  { id: "cp10", title: "3-MONTH CHECK-IN", category: "transformation", daysAgo: 63, views: 7400, likes: 980, comments: 77, saves: 290, shares: 90, art: change("3 Months", "Month 03") },
  { id: "cp11", title: "NO DAYS OFF MENTALLY", category: "motivation", daysAgo: 75, views: 4300, likes: 520, comments: 22, saves: 70, shares: 60, art: quote("No days off mentally.") },
  { id: "cp12", title: "SQUAT 315 PR", category: "strength", daysAgo: 86, views: 5600, likes: 790, comments: 54, saves: 60, shares: 40, art: pr("315", "Squat") },
];

export function categoryLabel(id: ContentCategory): string {
  return CONTENT_CATEGORIES.find((c) => c.id === id)!.label;
}

export function postsInPeriod(period: PeriodId): CreatorPost[] {
  return DEMO_POSTS.filter((p) => p.daysAgo < DAYS[period]);
}

export function engagements(m: Metrics): number {
  return m.likes + m.comments + m.saves + m.shares;
}

/** Percent with one decimal. See STUDIO_COPY.erFormula. */
export function engagementRate(m: Metrics): number {
  return m.views > 0 ? Math.round((engagements(m) / m.views) * 1000) / 10 : 0;
}

export function sumMetrics(posts: Metrics[]): Metrics {
  return posts.reduce<Metrics>((t, p) => ({ views: t.views + p.views, likes: t.likes + p.likes, comments: t.comments + p.comments, saves: t.saves + p.saves, shares: t.shares + p.shares }), { views: 0, likes: 0, comments: 0, saves: 0, shares: 0 });
}

// ── Followers & visits (account level) ──────────────────────────────────────
export const FOLLOWERS_NOW = 1200;
export const PROFILE_VISITS: Record<PeriodId, number> = { "7d": 560, "30d": 2140, "90d": 5980 };

/** Followers gained on a given day (0 = today). Totals: 84 in 7 days, 328 in 30, 590 in 90. */
export function dailyGain(daysAgo: number): number {
  if (daysAgo < 0 || daysAgo >= 90) return 0;
  if (daysAgo < 7) return 12;
  if (daysAgo < 21) return 11;
  if (daysAgo < 30) return 10;
  if (daysAgo < 52) return 5;
  return 4;
}

/** Follower count at the start of a day `daysAgo` days back. */
export function followersAt(daysAgo: number): number {
  let n = FOLLOWERS_NOW;
  for (let d = 0; d < daysAgo; d++) n -= dailyGain(d);
  return n;
}

export function followerGrowth(period: PeriodId): { start: number; current: number; gained: number; pct: number } {
  const start = followersAt(DAYS[period]);
  const gained = FOLLOWERS_NOW - start;
  return { start, current: FOLLOWERS_NOW, gained, pct: Math.round((gained / start) * 1000) / 10 };
}

export function followerSeries(period: PeriodId): { label: string; value: number }[] {
  const days = DAYS[period];
  const step = period === "7d" ? 1 : period === "30d" ? 5 : 15;
  const out: { label: string; value: number }[] = [];
  for (let d = days; d >= 0; d -= step) out.push({ label: period === "7d" ? weekdayLabel(-d) : dateLabel(-d), value: followersAt(d) });
  return out;
}

export interface PeriodTotals extends Metrics {
  posts: number;
  engagementRate: number;
  newFollowers: number;
  followerGrowthPct: number;
  profileVisits: number;
}

export function periodTotals(period: PeriodId): PeriodTotals {
  const posts = postsInPeriod(period);
  const m = sumMetrics(posts);
  const growth = followerGrowth(period);
  return { ...m, posts: posts.length, engagementRate: engagementRate(m), newFollowers: growth.gained, followerGrowthPct: growth.pct, profileVisits: PROFILE_VISITS[period] };
}

/** Views grouped by publish date, oldest → newest. Bars sum to the period's total views. */
export function viewsChart(period: PeriodId): { label: string; views: number }[] {
  const { size, count } = period === "7d" ? { size: 1, count: 7 } : period === "30d" ? { size: 6, count: 5 } : { size: 15, count: 6 };
  const out: { label: string; views: number }[] = [];
  for (let b = count - 1; b >= 0; b--) {
    const from = b * size;
    const to = from + size - 1;
    const views = DEMO_POSTS.filter((p) => p.daysAgo >= from && p.daysAgo <= to).reduce((s, p) => s + p.views, 0);
    out.push({ label: size === 1 ? weekdayLabel(-from) : dateLabel(-to), views });
  }
  return out;
}

export interface CategoryStats extends Metrics {
  id: ContentCategory;
  label: string;
  posts: number;
  engagementRate: number;
}

export function categoryBreakdown(period: PeriodId): CategoryStats[] {
  const posts = postsInPeriod(period);
  return CONTENT_CATEGORIES.map((c) => {
    const inCat = posts.filter((p) => p.category === c.id);
    const m = sumMetrics(inCat);
    return { id: c.id, label: c.label, posts: inCat.length, ...m, engagementRate: engagementRate(m) };
  });
}

export function topPosts(period: PeriodId, n = 3): CreatorPost[] {
  return [...postsInPeriod(period)].sort((a, b) => b.views - a.views).slice(0, n);
}

export function strongestSignal(p: Metrics): string {
  const rates = [
    { k: "saves", r: p.saves / p.views, text: "Strong saves — people want to come back to it" },
    { k: "shares", r: p.shares / p.views, text: "Shared often — it travels beyond your followers" },
    { k: "likes", r: p.likes / p.views, text: "High like rate — instant reaction" },
  ];
  const baseline = { saves: 0.025, shares: 0.015, likes: 0.12 } as Record<string, number>;
  return rates.sort((a, b) => b.r / baseline[b.k] - a.r / baseline[a.k])[0].text;
}

// ── Audience activity (fictional) ───────────────────────────────────────────
export const AUDIENCE_DAYS = [
  { day: "Monday", short: "Mon", level: 72 },
  { day: "Tuesday", short: "Tue", level: 91 },
  { day: "Wednesday", short: "Wed", level: 78 },
  { day: "Thursday", short: "Thu", level: 86 },
  { day: "Friday", short: "Fri", level: 58 },
  { day: "Saturday", short: "Sat", level: 49 },
  { day: "Sunday", short: "Sun", level: 64 },
];
export const TIME_WINDOWS = [
  { id: "early", label: "6–8 AM", level: 54, suggest: "7:00 AM" },
  { id: "midday", label: "11 AM–1 PM", level: 41, suggest: "12:00 PM" },
  { id: "afternoon", label: "3–5 PM", level: 47, suggest: "4:00 PM" },
  { id: "evening", label: "6–8 PM", level: 92, suggest: "6:30 PM" },
  { id: "night", label: "9–11 PM", level: 61, suggest: "9:30 PM" },
];

export function mostActiveDays(n = 2): string[] {
  return [...AUDIENCE_DAYS].sort((a, b) => b.level - a.level).slice(0, n).map((d) => d.day);
}
export function suggestedWindows(n = 2): (typeof TIME_WINDOWS)[number][] {
  return [...TIME_WINDOWS].sort((a, b) => b.level - a.level).slice(0, n);
}
export function bestPostingTime(): { day: string; time: string; label: string } {
  const day = mostActiveDays(1)[0];
  const time = suggestedWindows(1)[0].suggest;
  return { day, time, label: `${day} · ${time}` };
}
export const BEST_TIME_COPY = {
  title: "BEST TIME TO POST",
  support: "Your demo audience is most active during evening workout hours.",
  disclaimer: "Based on fictional demo activity patterns. It doesn't predict real reach or guarantee engagement, and no real behavior tracking or location data is used.",
};

// ── Scheduling preview ──────────────────────────────────────────────────────
export const SCHEDULE_TIMES = ["6:30 AM", "12:00 PM", "6:30 PM", "8:00 PM"];
export const DRAFTS: { id: string; title: string; category: ContentCategory; art: PostArtData }[] = [
  { id: "d1", title: "GLUTE DAY BURNOUT", category: "tutorial", art: routine("Glute Day", [["Hip thrust", "4 × 10"], ["RDL", "3 × 8"], ["Kickback", "3 × 15"]]) },
  { id: "d2", title: "MONTH 7 CHECK-IN", category: "transformation", art: change("7 Months", "Month 07") },
  { id: "d3", title: "5 AM CLUB EDIT", category: "gym_edit", art: edit("5 AM. Locked in.") },
];

export interface ScheduledItem {
  id: string;
  draftId: string;
  /** Days after DEMO_TODAY (1–14). */
  dayOffset: number;
  time: string;
}

export function upcomingDays(n = 7): { offset: number; label: string }[] {
  return Array.from({ length: n }, (_, i) => ({ offset: i + 1, label: `${weekdayLabel(i + 1)}, ${dateLabel(i + 1)}` }));
}

function validItem(item: Pick<ScheduledItem, "draftId" | "dayOffset" | "time">): boolean {
  return DRAFTS.some((d) => d.id === item.draftId) && Number.isInteger(item.dayOffset) && item.dayOffset >= 1 && item.dayOffset <= 14 && SCHEDULE_TIMES.includes(item.time);
}

export function sortSchedule(list: ScheduledItem[]): ScheduledItem[] {
  return [...list].sort((a, b) => a.dayOffset - b.dayOffset || SCHEDULE_TIMES.indexOf(a.time) - SCHEDULE_TIMES.indexOf(b.time));
}
export function addScheduled(list: ScheduledItem[], item: ScheduledItem): ScheduledItem[] {
  return validItem(item) ? sortSchedule([...list, item]) : list;
}
export function updateScheduled(list: ScheduledItem[], id: string, patch: Partial<Omit<ScheduledItem, "id">>): ScheduledItem[] {
  return sortSchedule(list.map((it) => (it.id === id && validItem({ ...it, ...patch }) ? { ...it, ...patch } : it)));
}
export function removeScheduled(list: ScheduledItem[], id: string): ScheduledItem[] {
  return list.filter((it) => it.id !== id);
}
export function scheduleLabel(item: ScheduledItem): string {
  return `${weekdayLabel(item.dayOffset)}, ${dateLabel(item.dayOffset)} · ${item.time}`;
}

// ── Pinned posts (mock creator profile only) ────────────────────────────────
/** Returns a new array with the pinned post first. Never mutates input; never used for the Home Feed. */
export function pinnedOrder<T extends { id: string }>(posts: T[], pinnedId: string | null): T[] {
  const pinned = posts.find((p) => p.id === pinnedId);
  return pinned ? [pinned, ...posts.filter((p) => p.id !== pinnedId)] : [...posts];
}

// ── Link hub (non-navigating placeholders) ──────────────────────────────────
export type LinkKind = "youtube" | "instagram" | "programs" | "portfolio";
export interface CreatorLink {
  id: string;
  kind: LinkKind;
  label: string;
  placeholder: string;
  visible: boolean;
}
export const DEFAULT_LINKS: CreatorLink[] = [
  { id: "l1", kind: "youtube", label: "YouTube", placeholder: "@yourchannel · placeholder", visible: true },
  { id: "l2", kind: "instagram", label: "Instagram", placeholder: "@yourhandle · placeholder", visible: true },
  { id: "l3", kind: "programs", label: "Workout programs", placeholder: "Program page · placeholder", visible: true },
  { id: "l4", kind: "portfolio", label: "Creator portfolio", placeholder: "Portfolio · placeholder", visible: false },
];

// ── Comment filters (convenience only; Guardian & reporting stay free) ──────
export interface CommentFilters {
  spam: boolean;
  promo: boolean;
  holdKeywords: boolean;
  keywords: string[];
}
export const DEFAULT_FILTERS: CommentFilters = { spam: true, promo: true, holdKeywords: true, keywords: ["natty police", "fake"] };
export const SAMPLE_COMMENTS = [
  { id: "c1", user: "liftwithlee", text: "That last rep was clean, great bar path!" },
  { id: "c2", user: "bot_4821", text: "🔥🔥🔥🔥🔥🔥🔥🔥" },
  { id: "c3", user: "promo_gains", text: "Check my page for cheap pre-workout, link in bio!" },
  { id: "c4", user: "skeptic99", text: "Natty police here, this is fake" },
  { id: "c5", user: "maya_moves", text: "Saving this for leg day tomorrow 🙌" },
  { id: "c6", user: "follow4follow", text: "f4f? follow back and I'll follow you" },
  { id: "c7", user: "bot_4822", text: "nice nice nice nice nice" },
];
export const FILTER_SAFETY_NOTE =
  "Guardian moderation, reporting and blocking stay free for everyone and keep running whatever these settings are. These filters only add convenience for busy comment sections.";

export function isRepetitiveSpam(text: string): boolean {
  return /(\p{Extended_Pictographic})\1{4,}/u.test(text) || /(.)\1{7,}/u.test(text) || /\b(\w+)(?:\W+\1\b){3,}/i.test(text);
}
export function isPromotional(text: string): boolean {
  return /link in bio|check (?:out )?my page|promo code|discount code|\bf4f\b|follow (?:4|for) follow|follow back|dm me for/i.test(text);
}

export type CommentOutcome = "shown" | "hidden" | "held";
export function applyCommentFilters<T extends { text: string }>(comments: T[], f: CommentFilters): (T & { outcome: CommentOutcome; reason?: string })[] {
  return comments.map((c) => {
    if (f.spam && isRepetitiveSpam(c.text)) return { ...c, outcome: "hidden", reason: "Repetitive spam" };
    if (f.promo && isPromotional(c.text)) return { ...c, outcome: "hidden", reason: "Promotional" };
    const kw = f.holdKeywords ? f.keywords.find((k) => k && c.text.toLowerCase().includes(k.toLowerCase())) : undefined;
    if (kw) return { ...c, outcome: "held", reason: `Keyword: ${kw}` };
    return { ...c, outcome: "shown" };
  });
}

// ── Brand campaigns (fictional) ─────────────────────────────────────────────
export interface Campaign {
  id: string;
  brandLabel: string;
  title: string;
  description: string;
  contentStyle: string;
  eligibility: string;
  details: string[];
  fictional: true;
  tone: "ember" | "crimson" | "gold";
}
export const CAMPAIGNS: Campaign[] = [
  {
    id: "camp1",
    brandLabel: "Fictional gym apparel brand",
    title: "Gym Apparel — Leg Day Creators",
    description: "A fictional gym apparel campaign looking for creators who regularly post leg day content.",
    contentStyle: "Leg day workouts, training clips and gym edits wearing everyday training gear.",
    eligibility: "Example: creators who post leg day content at least twice a month.",
    details: ["Short-form leg day videos or edits", "Honest, real training — no staged results", "Clear #ad disclosure would be required on any real campaign"],
    fictional: true,
    tone: "ember",
  },
  {
    id: "camp2",
    brandLabel: "Fictional fitness brand",
    title: "Transformation Story Campaign",
    description: "A fictional fitness brand campaign interested in authentic transformation storytelling.",
    contentStyle: "Long-term progress stories: training habits, setbacks and what kept you consistent.",
    eligibility: "Example: creators sharing their own progress over several months.",
    details: ["Your own story, told your way", "No before/after promises or claims about products causing results", "Clear #ad disclosure would be required on any real campaign"],
    fictional: true,
    tone: "crimson",
  },
  {
    id: "camp3",
    brandLabel: "Fictional local gym",
    title: "College Lifter Gym Campaign",
    description: "A fictional local gym campaign focused on college fitness creators.",
    contentStyle: "Campus-friendly training content, beginner tips and gym-buddy workouts.",
    eligibility: "Example: college-age creators who train regularly and post beginner-friendly content.",
    details: ["Beginner-friendly routines and gym etiquette", "Community-focused content", "Clear #ad disclosure would be required on any real campaign"],
    fictional: true,
    tone: "gold",
  },
];

// ── Creator profile cosmetics (separate from Phase 3 Profile Studio) ────────
export type CreatorAccentId = "ember" | "crimson" | "sunset";
export const CREATOR_ACCENTS: Record<CreatorAccentId, { name: string; banner: [string, string, string] }> = {
  ember: { name: "Ember", banner: ["#FF5A1F", "#B3260F", "#1A0805"] },
  crimson: { name: "Crimson", banner: ["#FF2E2E", "#6E0B12", "#120303"] },
  sunset: { name: "Sunset", banner: ["#FFB347", "#FF5A1F", "#2A0806"] },
};

export interface CreatorProfileSettings {
  accent: CreatorAccentId;
  showIdentity: boolean;
  showStats: boolean;
  showLinks: boolean;
  showPinned: boolean;
  /** Only when true (and the demo tier allows it) does the creator look appear on the real profile, this session only. */
  applied: boolean;
}

export interface CreatorDemoState {
  schedule: ScheduledItem[];
  pinnedPostId: string | null;
  links: CreatorLink[];
  filters: CommentFilters;
  profile: CreatorProfileSettings;
}

export const DEFAULT_CREATOR_STATE: CreatorDemoState = {
  schedule: [{ id: "s-demo", draftId: "d1", dayOffset: 2, time: "6:30 PM" }],
  pinnedPostId: "cp4",
  links: DEFAULT_LINKS,
  filters: DEFAULT_FILTERS,
  profile: { accent: "ember", showIdentity: true, showStats: true, showLinks: true, showPinned: true, applied: false },
};

// ── Locked explanations ─────────────────────────────────────────────────────
export const CREATOR_FEATURE_INFO: Partial<Record<PremiumFeature, { title: string; body: string }>> = {
  creator_analytics: { title: "Creator analytics", body: "Views, likes, saves, shares, follower growth and engagement for your account across 7, 30 and 90 days." },
  post_performance_dashboard: { title: "Content performance", body: "See which kinds of fitness content your audience responds to, and how each post performed." },
  audience_insights: { title: "Audience insights", body: "Follower growth, when your audience is active and suggested posting windows." },
  scheduled_posts_preview: { title: "Scheduled posts", body: "Plan posts for specific days and times ahead of time." },
  pinned_posts: { title: "Pinned posts", body: "Keep a chosen post at the top of your profile. It doesn't change feed ranking." },
  creator_profile_customization: { title: "Creator profile tools", body: "Creator badge, accent banner, link hub and a creator stats strip on your profile." },
  advanced_comment_filters: { title: "Advanced comment filters", body: "Hide repetitive spam and promo comments, and hold keywords for review. Core safety tools stay free." },
  brand_campaign_marketplace_preview: { title: "Brand campaign opportunities", body: "Discover potential opportunities to collaborate with fitness brands. No sponsorship is guaranteed." },
};
