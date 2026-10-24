/**
 * Premium challenges — DEMONSTRATION DATA (Phase 7).
 *
 * Coming Soon challenge-program previews. Progress here is local demo state only: it is never mixed
 * with the free community challenges (`joined` in App) and never awards a real badge, prize or reward.
 * Sponsors are referenced from the Phase 6 catalog by id (no second sponsorship model).
 * Pure module (type-only imports) for plain-Node tests.
 */
import type { PremiumFeature } from "../membership/entitlements";

export const PREMIUM_CHALLENGE_COPY = {
  title: "GYMVERSE PRO CHALLENGES",
  subtitle: "Build strength. Stay accountable. Earn your progress.",
  pill: "PRO CHALLENGES · COMING SOON",
  freeNote: "Community challenges above stay free for everyone, always.",
  completeTitle: "CHALLENGE COMPLETE — DEMO",
  noReward: "Demonstration only. No real badge, reward, prize or recognition was awarded, and nothing was saved to your account.",
  rest: "Rest and recovery days count as part of training. Missing a day never resets your progress or costs you anything.",
  safety: "Listen to your body: skip or adjust any session if you're unwell or injured. No body-change or PR results are promised.",
} as const;

export type ChallengeTheme = "muscle" | "strength" | "beginner" | "discipline";
export interface Milestone {
  id: string;
  week: number;
  title: string;
  detail: string;
}
export interface PremiumChallenge {
  id: string;
  title: string;
  durationLabel: string;
  durationDays: number;
  weeks: number;
  description: string;
  objective: string;
  focus: string[];
  theme: ChallengeTheme;
  milestones: Milestone[];
  /** Sample objectives per week (index = week - 1). */
  weekObjectives: string[][];
  checkIns: string[];
  badgeConcept: string;
  /** Phase 6 sponsored-challenge id, if this program has a fictional sponsor. */
  sponsoredChallengeId: string | null;
}

export const PREMIUM_CHALLENGES: PremiumChallenge[] = [
  {
    id: "pc-muscle", title: "30-Day Muscle Builder", durationLabel: "30 days", durationDays: 30, weeks: 4, theme: "muscle",
    description: "A month of structured resistance training with weekly check-ins.",
    objective: "Complete your planned resistance workouts for 30 days.",
    focus: ["Workout consistency", "Structured resistance training", "Weekly progress milestones", "Training-volume tracking", "Completing planned workouts"],
    milestones: [
      { id: "m1", week: 1, title: "Establish your routine", detail: "Pick your training days and complete your first planned sessions." },
      { id: "m2", week: 2, title: "Build consistency", detail: "Complete the week's planned workouts at a comfortable effort." },
      { id: "m3", week: 3, title: "Review your training progress", detail: "Look back at logged sets and volume, and adjust the plan if needed." },
      { id: "m4", week: 4, title: "Complete your challenge", detail: "Finish the final week and reflect on what helped you stay consistent." },
    ],
    weekObjectives: [
      ["3 full-body sessions", "Log every working set", "One full rest day minimum"],
      ["3–4 planned sessions", "Track total weekly volume", "Prioritise sleep"],
      ["Repeat week 2 structure", "Compare volume with week 1", "Adjust weights that felt too hard"],
      ["Complete planned sessions", "Note your favourite exercises", "Plan what comes next"],
    ],
    checkIns: ["Weekly check-in every Sunday", "Optional mid-week note", "Final reflection on day 30"],
    badgeConcept: "Example digital badge: \"30-Day Builder\" (concept only).",
    sponsoredChallengeId: "sch-strength",
  },
  {
    id: "pc-strength", title: "12-Week Strength Builder", durationLabel: "12 weeks", durationDays: 84, weeks: 12, theme: "strength",
    description: "Three training blocks focused on bench press, squat and deadlift.",
    objective: "Train the big three consistently and track your personal records.",
    focus: ["Bench press", "Squat", "Deadlift", "Training consistency", "Personal record progression"],
    milestones: [
      { id: "s1", week: 1, title: "Establish starting performance", detail: "Record comfortable working weights for bench, squat and deadlift." },
      { id: "s2", week: 4, title: "Complete first training block", detail: "Finish the first four-week block as planned, deload included." },
      { id: "s3", week: 8, title: "Review training progress", detail: "Review logged lifts and how the block felt before the final phase." },
      { id: "s4", week: 12, title: "Complete final week and reflect", detail: "Finish the program and reflect on consistency, not just numbers." },
    ],
    weekObjectives: Array.from({ length: 12 }, (_, i) =>
      i === 3 || i === 7 ? ["Deload week: lighter weights", "Focus on technique", "Extra recovery"] : i === 11 ? ["Final week", "Optional PR attempt with a spotter", "Reflect on the program"] : ["Bench, squat and deadlift sessions", "Log top sets", "At least one rest day between heavy sessions"],
    ),
    checkIns: ["Check-in at the end of each block", "Optional weekly lift log review", "Final reflection in week 12"],
    badgeConcept: "Example digital badge: \"Strength Builder · 12 Weeks\" (concept only).",
    sponsoredChallengeId: null,
  },
  {
    id: "pc-beginner", title: "Beginner Gym Confidence Program", durationLabel: "28 days", durationDays: 28, weeks: 4, theme: "beginner",
    description: "A welcoming four-week introduction to the gym and basic exercises.",
    objective: "Feel comfortable in the gym and build a simple routine.",
    focus: ["Gym familiarity", "Learning basic exercises", "Building workout habits", "Confidence with equipment", "Beginner-friendly goals"],
    milestones: [
      { id: "b1", week: 1, title: "Complete first gym session", detail: "Visit the gym, try a short session and get to know the space." },
      { id: "b2", week: 2, title: "Learn three basic exercises", detail: "Practise three beginner movements with light weights." },
      { id: "b3", week: 3, title: "Finish the second week", detail: "Complete two weeks of sessions at your own pace." },
      { id: "b4", week: 4, title: "Complete the program", detail: "Finish the program and celebrate the habit you've built." },
    ],
    weekObjectives: [
      ["One or two short visits", "Find the equipment you'll use", "Ask staff for help if unsure"],
      ["Goblet squat, dumbbell press, cable row", "Light weights, focus on form", "Two sessions"],
      ["Two to three sessions", "Repeat the basics", "Note what feels easier"],
      ["Keep the routine going", "Try one new exercise", "Plan your next month"],
    ],
    checkIns: ["Quick check-in after each session", "Weekly confidence reflection", "Program wrap-up on day 28"],
    badgeConcept: "Example digital badge: \"Gym Confidence\" (concept only).",
    sponsoredChallengeId: "sch-beginner",
  },
  {
    id: "pc-discipline", title: "Discipline Mode Challenge", durationLabel: "21 days", durationDays: 21, weeks: 3, theme: "discipline",
    description: "Three weeks of following a realistic schedule you set yourself.",
    objective: "Show up on your planned days and check in honestly — rest days included.",
    focus: ["Personal accountability", "Following a realistic training schedule", "Daily habit check-ins", "Reflecting on consistency", "Encouraging sustainable routines"],
    milestones: [
      { id: "d1", week: 1, title: "Set a realistic schedule", detail: "Choose training and rest days you can actually keep." },
      { id: "d2", week: 2, title: "Keep your check-ins", detail: "Check in each day, including planned rest days." },
      { id: "d3", week: 3, title: "Reflect and sustain", detail: "Reflect on what worked and keep the routine going." },
    ],
    weekObjectives: [
      ["Plan 3–4 training days", "Plan rest days on purpose", "Daily 10-second check-in"],
      ["Follow the plan", "Rest when planned or when needed", "Note energy and sleep"],
      ["Keep checking in", "Adjust the plan if it was too much", "Write a short reflection"],
    ],
    checkIns: ["Daily habit check-in (rest days count)", "Weekly reflection", "Final review on day 21"],
    badgeConcept: "Example digital badge: \"Discipline Mode\" (concept only).",
    sponsoredChallengeId: "sch-discipline",
  },
];

export function challengeById(id: string): PremiumChallenge | undefined {
  return PREMIUM_CHALLENGES.find((c) => c.id === id);
}

// ── Progress model (derived only from completed milestone ids) ─────────────
export interface ChallengeProgress {
  done: number;
  total: number;
  pct: number;
  remaining: number;
  complete: boolean;
}
export function progressFor(c: PremiumChallenge, completedIds: readonly string[]): ChallengeProgress {
  const ids = new Set(c.milestones.map((m) => m.id));
  const done = new Set(completedIds.filter((id) => ids.has(id))).size;
  const total = c.milestones.length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0, remaining: total - done, complete: total > 0 && done === total };
}
/** Toggles a milestone; unknown ids leave the list unchanged. Never mutates input. */
export function toggleMilestone(c: PremiumChallenge, completedIds: readonly string[], milestoneId: string): string[] {
  if (!c.milestones.some((m) => m.id === milestoneId)) return [...completedIds];
  return completedIds.includes(milestoneId) ? completedIds.filter((id) => id !== milestoneId) : [...completedIds, milestoneId];
}
export function resetProgress(): string[] {
  return [];
}
export function milestonesForWeek(c: PremiumChallenge, week: number): Milestone[] {
  return c.milestones.filter((m) => m.week === week);
}

export type DemoChallengeProgress = Record<string, string[]>;

export const CHALLENGE_FEATURE_INFO: Partial<Record<PremiumFeature, { title: string; body: string }>> = {
  premium_challenges: { title: "GYMVERSE Pro challenges", body: "Structured challenge programs with milestones, progress tracking and completion recaps. Community challenges stay free for everyone." },
};
