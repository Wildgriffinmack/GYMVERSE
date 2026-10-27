/**
 * GYMX Pro progress — DEMONSTRATION DATA (Phase 3).
 *
 * Every number here is fabricated example data for a Coming Soon preview. Nothing is read from
 * a backend, nothing is sent anywhere, and no AI model is involved. Pure module (type-only
 * imports) so the scoring and helpers can be unit-tested with plain Node.
 */
import type { PremiumFeature } from "../membership/entitlements";

export const DEMO_NOTE = "Demo data — example numbers, not your real training.";
export const MEMBER_NOTE = "Fictional example member. Not a real GYMX member's results.";

// ── PR history ──────────────────────────────────────────────────────────────
export type LiftId = "bench" | "squat" | "deadlift";
export const LIFTS: { id: LiftId; name: string; short: string }[] = [
  { id: "bench", name: "Bench press", short: "Bench" },
  { id: "squat", name: "Squat", short: "Squat" },
  { id: "deadlift", name: "Deadlift", short: "Deadlift" },
];
export const PR_MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
/** Monthly best (lb). Final values match the free Personal Records on the profile. */
export const PR_HISTORY: Record<LiftId, number[]> = {
  bench: [185, 195, 200, 205, 215, 220, 225],
  squat: [245, 260, 275, 285, 295, 305, 315],
  deadlift: [315, 335, 350, 365, 380, 395, 405],
};

export function prImprovement(lift: LiftId): number {
  const s = PR_HISTORY[lift];
  return s[s.length - 1] - s[0];
}

export function prImprovementPct(lift: LiftId): number {
  const s = PR_HISTORY[lift];
  return Math.round(((s[s.length - 1] - s[0]) / s[0]) * 100);
}

// ── Consistency & streaks ───────────────────────────────────────────────────
export const WEEKLY_GOAL = 4;
/** Workouts per week for the last 8 weeks, oldest → newest. */
export const WEEKLY_SESSIONS = [4, 3, 4, 4, 3, 4, 3, 4];
export const STREAK = { currentDays: 28, longestDays: 41 };
export const MONTHLY_CONSISTENCY = [
  { month: "May", pct: 64 },
  { month: "Jun", pct: 71 },
  { month: "Jul", pct: 78 },
  { month: "Aug", pct: 74 },
  { month: "Sep", pct: 85 },
  { month: "Oct", pct: 82 },
];

/**
 * Consistency score (0–100), calculated on-device from the demo log:
 *   70% — sessions completed vs. the weekly goal (extra sessions are capped, so they don't inflate it)
 *   30% — share of weeks where the goal was fully met
 */
export function consistencyScore(sessions: number[] = WEEKLY_SESSIONS, goal: number = WEEKLY_GOAL): number {
  if (!sessions.length || goal <= 0) return 0;
  const attendance = sessions.reduce((sum, n) => sum + Math.min(Math.max(n, 0), goal), 0) / (sessions.length * goal);
  const weeksMet = sessions.filter((n) => n >= goal).length / sessions.length;
  return Math.round(100 * (0.7 * attendance + 0.3 * weeksMet));
}

export function consistencyLabel(score: number): string {
  if (score >= 90) return "ELITE CONSISTENCY";
  if (score >= 75) return "STRONG CONSISTENCY";
  if (score >= 60) return "BUILDING CONSISTENCY";
  return "GETTING STARTED";
}

export const CONSISTENCY_EXPLAINER =
  "Calculated from the last 8 weeks: 70% is workouts completed against your weekly goal of 4 (extra sessions are capped), and 30% is how many weeks you fully hit that goal. It rewards showing up steadily. Worked out on this device from demo data — no AI and no server.";

const DAY_PATTERNS: Record<number, number[]> = {
  0: [],
  1: [0],
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 5],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 4, 5],
  7: [0, 1, 2, 3, 4, 5, 6],
};

/** Weeks × 7 days (Mon–Sun) of trained/not-trained, derived from the weekly session counts. */
export function workoutCalendar(sessions: number[] = WEEKLY_SESSIONS): boolean[][] {
  return sessions.map((n) => {
    const days = DAY_PATTERNS[Math.min(7, Math.max(0, n))];
    return Array.from({ length: 7 }, (_, d) => days.includes(d));
  });
}

export function completedWorkouts(sessions: number[] = WEEKLY_SESSIONS): number {
  return sessions.reduce((a, b) => a + b, 0);
}

export function trainingFrequency(sessions: number[] = WEEKLY_SESSIONS): number {
  return Math.round((completedWorkouts(sessions) / sessions.length) * 10) / 10;
}

// ── Volume ──────────────────────────────────────────────────────────────────
/** Total weekly training volume (lb lifted), last 8 weeks, oldest → newest. */
export const WEEKLY_VOLUME_LBS = [31400, 30200, 33800, 35100, 32900, 36800, 34200, 38600];

/** % change of the last 4 weeks vs. the 4 weeks before. */
export function volumeTrendPct(volume: number[] = WEEKLY_VOLUME_LBS): number {
  const half = Math.floor(volume.length / 2);
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const before = sum(volume.slice(0, half));
  const after = sum(volume.slice(half));
  return before ? Math.round(((after - before) / before) * 100) : 0;
}

// ── AI weekly check-in (SCRIPTED) ───────────────────────────────────────────
export const CHECKIN_TITLE = "YOUR WEEK IN GYMX";
export const CHECKIN_BANNER = "AI Weekly Check-In — Coming Soon";
export const CHECKIN_SCRIPT_NOTE = "Scripted demonstration. This report is written in advance — no AI model generated it.";

export interface CheckInWeek {
  id: string;
  label: string;
  range: string;
  workouts: number;
  consistency: number;
  prs: string[];
  trends: { label: string; dir: "up" | "down" | "flat" }[];
  improve: string[];
  feedback: string;
}

export const CHECKIN_WEEKS: CheckInWeek[] = [
  {
    id: "this",
    label: "This week",
    range: "Oct 19 – Oct 25",
    workouts: 4,
    consistency: 82,
    prs: ["Bench press 225 lb (+5 lb)"],
    trends: [
      { label: "Training frequency held at 4 sessions", dir: "flat" },
      { label: "Weekly volume up 13%", dir: "up" },
      { label: "Bench press trending up", dir: "up" },
    ],
    improve: ["Add one short mobility session for your hips", "Leg day volume dipped — keep squats in the rotation"],
    feedback:
      "You completed 4 workouts this week and maintained an 82% consistency score. Your bench press improved, and your training frequency stayed strong.",
  },
  {
    id: "last",
    label: "Last week",
    range: "Oct 12 – Oct 18",
    workouts: 3,
    consistency: 81,
    prs: [],
    trends: [
      { label: "One session short of your goal", dir: "down" },
      { label: "Deadlift volume up 8%", dir: "up" },
    ],
    improve: ["Plan your fourth session before the week starts", "Prioritize sleep the night before heavy days"],
    feedback: "You logged 3 workouts and kept your streak alive. A busy week, but you still showed up — that's what builds consistency.",
  },
  {
    id: "two",
    label: "2 weeks ago",
    range: "Oct 5 – Oct 11",
    workouts: 4,
    consistency: 83,
    prs: ["Squat 315 lb (+10 lb)"],
    trends: [
      { label: "Hit your weekly goal", dir: "up" },
      { label: "Squat strength trending up", dir: "up" },
    ],
    improve: ["Add a back-off set after heavy squats", "Log your rest times to spot fatigue"],
    feedback: "Four sessions and a new squat PR. Your lower body is responding well — keep the same structure next week.",
  },
];

// ── Private progress timeline ───────────────────────────────────────────────
export type PrivateEntryKind = "note" | "milestone" | "photo" | "reflection" | "lift";

export interface PrivateEntry {
  id: string;
  /** ISO date (yyyy-mm-dd). */
  date: string;
  kind: PrivateEntryKind;
  title: string;
  body: string;
  stat?: string;
  /** Always private. Private entries are never converted into feed posts. */
  visibility: "private";
  /** True for notes typed during this session (kept in memory only). */
  session?: boolean;
}

export const PRIVATE_ENTRIES: PrivateEntry[] = [
  { id: "pv-1", date: "2026-10-21", kind: "lift", title: "Bench press PR", body: "225 felt smooth. Paused the last rep on purpose.", stat: "225 lb × 1", visibility: "private" },
  { id: "pv-2", date: "2026-10-14", kind: "reflection", title: "Rough week, still showed up", body: "Work was chaos. Short sessions still count.", visibility: "private" },
  { id: "pv-3", date: "2026-09-30", kind: "photo", title: "Month 6 check-in photo", body: "Private photo placeholder — stays on this device in the demo.", visibility: "private" },
  { id: "pv-4", date: "2026-09-02", kind: "milestone", title: "100 workouts logged", body: "Triple digits. Didn't think I'd stick with it this long.", stat: "100 sessions", visibility: "private" },
  { id: "pv-5", date: "2026-07-18", kind: "lift", title: "Squat 285 for a triple", body: "Depth was better than last month. Knees felt fine.", stat: "285 lb × 3", visibility: "private" },
  { id: "pv-6", date: "2026-05-04", kind: "note", title: "Started tracking sleep", body: "Aiming for 7+ hours before heavy days.", visibility: "private" },
];

const MAX_NOTE = 280;

/** YYYY-MM-DD in the device's local time zone (toISOString would use UTC and can show tomorrow's date in the evening). */
export function localDateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function createPrivateNote(text: string, now: Date = new Date()): PrivateEntry | null {
  const body = text.trim().slice(0, MAX_NOTE);
  if (!body) return null;
  return {
    id: `pv-session-${now.getTime()}`,
    date: localDateKey(now),
    kind: "note",
    title: "Private note",
    body,
    visibility: "private",
    session: true,
  };
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function groupByMonth(entries: PrivateEntry[]): { month: string; entries: PrivateEntry[] }[] {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const groups: { month: string; entries: PrivateEntry[] }[] = [];
  for (const e of sorted) {
    const [y, m] = e.date.split("-");
    const month = `${MONTHS[Number(m) - 1]} ${y}`;
    const last = groups[groups.length - 1];
    if (last && last.month === month) last.entries.push(e);
    else groups.push({ month, entries: [e] });
  }
  return groups;
}

// ── Transformation comparison ───────────────────────────────────────────────
export function sliderFraction(x: number, width: number): number {
  if (!(width > 0)) return 0.5;
  return Math.min(1, Math.max(0, x / width));
}

export const COMPARISON_DEMO = {
  before: { label: "BEFORE", detail: "Day 1" },
  after: { label: "AFTER", detail: "Month 6" },
  caption: "Neutral illustration for demonstration only. Not a real member, and not a promise of any result.",
};

// ── Premium profile customization ───────────────────────────────────────────
export type ProfileStyleId = "standard" | "inferno" | "gold_standard" | "steel";

export interface ProfileStyle {
  id: ProfileStyleId;
  name: string;
  premium: boolean;
  banner: [string, string, string];
  ring: [string, string, string, string, string];
}

/** "standard" reproduces today's free profile exactly; the others are premium previews. */
export const PROFILE_STYLES: Record<ProfileStyleId, ProfileStyle> = {
  standard: { id: "standard", name: "Standard", premium: false, banner: ["#FF5A1F", "#8D1B10", "#1A0805"], ring: ["#FFD166", "#FF5A1F", "#FF2E2E", "#FF5A1F", "#FFD166"] },
  inferno: { id: "inferno", name: "Inferno", premium: true, banner: ["#FF2E2E", "#7A0A0A", "#120303"], ring: ["#FF2E2E", "#FF5A1F", "#FFD166", "#FF5A1F", "#FF2E2E"] },
  gold_standard: { id: "gold_standard", name: "Gold Standard", premium: true, banner: ["#FFD166", "#B8741A", "#1C1204"], ring: ["#FFF7ED", "#FFD166", "#E0A23A", "#FFD166", "#FFF7ED"] },
  steel: { id: "steel", name: "Iron Steel", premium: true, banner: ["#5A5A5A", "#262626", "#0B0B0B"], ring: ["#E5E5E5", "#8A8A8A", "#FF5A1F", "#8A8A8A", "#E5E5E5"] },
};
export const PROFILE_STYLE_IDS = Object.keys(PROFILE_STYLES) as ProfileStyleId[];

export interface ProfileCosmetics {
  style: ProfileStyleId;
  glowRing: boolean;
  showBadge: boolean;
  pinTransformation: boolean;
  /** Only when true (and the demo tier allows it) do cosmetics appear on the real profile, for this session. */
  applied: boolean;
}

export const DEFAULT_COSMETICS: ProfileCosmetics = { style: "inferno", glowRing: true, showBadge: true, pinTransformation: true, applied: false };

// ── Locked-feature explanations ─────────────────────────────────────────────
export const PRO_FEATURE_INFO: Partial<Record<PremiumFeature, { title: string; body: string }>> = {
  advanced_progress_tracking: { title: "Advanced progress tracking", body: "Weekly volume, training frequency and PR improvements in one dashboard." },
  pr_history_charts: { title: "PR history charts", body: "See how your bench, squat and deadlift personal records climb month by month." },
  workout_streak_analytics: { title: "Workout streak analytics", body: "Current and longest streaks, a training calendar and monthly consistency." },
  consistency_score: { title: "Consistency score", body: "One score out of 100 that rewards showing up week after week." },
  transformation_comparison: { title: "Transformation comparison", body: "Drag a slider across two progress photos to compare them side by side." },
  private_progress_timeline: { title: "Private progress timeline", body: "Notes, milestones and photos only you can see. Never posted to the feed." },
  ai_weekly_checkin_preview: { title: "AI weekly check-in", body: "A weekly summary of your workouts, PRs, trends and what to focus on next." },
  premium_profile_customization: { title: "Premium profile customization", body: "Premium banners, a glow ring, a PRO badge and a pinned transformation." },
};
