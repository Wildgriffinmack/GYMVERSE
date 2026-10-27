import { AGE_RANGES, AUDIENCE_SIZES, COACH_TYPES, FITNESS_LEVELS, SOURCES, STRUGGLES, USER_TYPES } from "./content.ts";
import type { Option } from "./content.ts";

export type AgeRange = (typeof AGE_RANGES)[number]["value"];
export type FitnessLevel = (typeof FITNESS_LEVELS)[number]["value"];
export type UserType = (typeof USER_TYPES)[number]["value"];
export type Struggle = (typeof STRUGGLES)[number]["value"];
export type Source = (typeof SOURCES)[number]["value"];
export type CoachType = (typeof COACH_TYPES)[number]["value"];
export type AudienceSize = (typeof AUDIENCE_SIZES)[number]["value"];

export interface MemberFormValues {
  fullName: string;
  email: string;
  ageRange: AgeRange | "";
  /** Only required (and only shown) when ageRange is "under_18". */
  confirmedAge13: boolean;
  fitnessLevel: FitnessLevel | "";
  userType: UserType | "";
  struggle: Struggle | "";
  betaTester: boolean;
  source: Source | "";
}

export interface CoachFormValues {
  fullName: string;
  email: string;
  handle: string;
  coachType: CoachType | "";
  audienceSize: AudienceSize | "";
  helpMost: string;
  leadBeta: boolean;
}

export const EMPTY_MEMBER: MemberFormValues = {
  fullName: "",
  email: "",
  ageRange: "",
  confirmedAge13: false,
  fitnessLevel: "",
  userType: "",
  struggle: "",
  betaTester: false,
  source: "",
};

export const EMPTY_COACH: CoachFormValues = {
  fullName: "",
  email: "",
  handle: "",
  coachType: "",
  audienceSize: "",
  helpMost: "",
  leadBeta: false,
};

/** Render order; used to move focus to the first invalid field. */
export const MEMBER_FIELDS = [
  "fullName",
  "email",
  "ageRange",
  "confirmedAge13",
  "fitnessLevel",
  "userType",
  "struggle",
  "betaTester",
  "source",
] as const satisfies readonly (keyof MemberFormValues)[];

export const COACH_FIELDS = [
  "fullName",
  "email",
  "handle",
  "coachType",
  "audienceSize",
  "helpMost",
  "leadBeta",
] as const satisfies readonly (keyof CoachFormValues)[];

export const LIMITS = { name: 80, email: 254, handle: 120, helpMost: 500 } as const;

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmail(raw: string): boolean {
  const email = normalizeEmail(raw);
  return email.length <= LIMITS.email && EMAIL_RE.test(email);
}

function isOneOf(options: readonly Option[], value: string): boolean {
  return options.some((o) => o.value === value);
}

function nameError(raw: string): string | undefined {
  const name = raw.trim();
  if (!name) return "Add your name so we know who’s joining.";
  if (name.length < 2) return "Your name should be at least 2 characters.";
  if (name.length > LIMITS.name) return `Keep your name under ${LIMITS.name} characters.`;
  return undefined;
}

function emailError(raw: string): string | undefined {
  if (!raw.trim()) return "Add your email so we can send your invite.";
  if (!isValidEmail(raw)) return "That email doesn’t look right. Try name@example.com.";
  return undefined;
}

export function validateMember(f: MemberFormValues): FieldErrors<MemberFormValues> {
  const errors: FieldErrors<MemberFormValues> = {};
  const name = nameError(f.fullName);
  if (name) errors.fullName = name;
  const email = emailError(f.email);
  if (email) errors.email = email;
  if (!isOneOf(AGE_RANGES, f.ageRange)) errors.ageRange = "Pick your age range.";
  else if (f.ageRange === "under_18" && !f.confirmedAge13) errors.confirmedAge13 = "Please confirm you’re 13 or older to join.";
  if (!isOneOf(FITNESS_LEVELS, f.fitnessLevel)) errors.fitnessLevel = "Pick the level closest to where you are right now.";
  if (!isOneOf(USER_TYPES, f.userType)) errors.userType = "Pick the one that fits best.";
  if (!isOneOf(STRUGGLES, f.struggle)) errors.struggle = "Pick one. There’s no wrong answer.";
  if (f.source && !isOneOf(SOURCES, f.source)) errors.source = "Pick an option from the list.";
  return errors;
}

export function validateCoach(f: CoachFormValues): FieldErrors<CoachFormValues> {
  const errors: FieldErrors<CoachFormValues> = {};
  const name = nameError(f.fullName);
  if (name) errors.fullName = name;
  const email = emailError(f.email);
  if (email) errors.email = email;
  const handle = f.handle.trim();
  if (!handle) errors.handle = "Add a social handle or website so we can see your work.";
  else if (handle.length < 2) errors.handle = "That handle looks too short.";
  else if (handle.length > LIMITS.handle) errors.handle = `Keep this under ${LIMITS.handle} characters.`;
  if (!isOneOf(COACH_TYPES, f.coachType)) errors.coachType = "Pick the option that fits best.";
  if (!isOneOf(AUDIENCE_SIZES, f.audienceSize)) errors.audienceSize = "Pick your approximate audience size.";
  const help = f.helpMost.trim();
  if (help.length < 3) errors.helpMost = "Tell us a little about what would help you most.";
  else if (help.length > LIMITS.helpMost) errors.helpMost = `Keep this under ${LIMITS.helpMost} characters.`;
  return errors;
}

// ---------------------------------------------------------------------------
// Submissions
// ---------------------------------------------------------------------------

export interface SubmissionContext {
  heroVariant: string;
  channel: string;
  utm: Record<string, string>;
  referrerHost: string;
}

export interface MemberSubmission {
  kind: "member";
  fullName: string;
  email: string;
  ageRange: AgeRange;
  /** null when the age range is 18+. */
  confirmedAge13: boolean | null;
  fitnessLevel: FitnessLevel;
  userType: UserType;
  struggle: Struggle;
  betaTester: boolean;
  source: Source | null;
  context: SubmissionContext;
  submittedAt: string;
}

export interface CoachSubmission {
  kind: "coach";
  fullName: string;
  email: string;
  handle: string;
  coachType: CoachType;
  audienceSize: AudienceSize;
  helpMost: string;
  leadBeta: boolean;
  context: SubmissionContext;
  submittedAt: string;
}

export type WaitlistSubmission = MemberSubmission | CoachSubmission;

export type Prepared<S, V> = { ok: true; submission: S } | { ok: false; errors: FieldErrors<V> };

export function prepareMember(f: MemberFormValues, context: SubmissionContext, now: Date = new Date()): Prepared<MemberSubmission, MemberFormValues> {
  const errors = validateMember(f);
  if (Object.keys(errors).length) return { ok: false, errors };
  const ageRange = f.ageRange as AgeRange;
  return {
    ok: true,
    submission: {
      kind: "member",
      fullName: f.fullName.trim(),
      email: normalizeEmail(f.email),
      ageRange,
      confirmedAge13: ageRange === "under_18" ? true : null,
      fitnessLevel: f.fitnessLevel as FitnessLevel,
      userType: f.userType as UserType,
      struggle: f.struggle as Struggle,
      betaTester: f.betaTester,
      source: f.source || null,
      context,
      submittedAt: now.toISOString(),
    },
  };
}

export function prepareCoach(f: CoachFormValues, context: SubmissionContext, now: Date = new Date()): Prepared<CoachSubmission, CoachFormValues> {
  const errors = validateCoach(f);
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    submission: {
      kind: "coach",
      fullName: f.fullName.trim(),
      email: normalizeEmail(f.email),
      handle: f.handle.trim(),
      coachType: f.coachType as CoachType,
      audienceSize: f.audienceSize as AudienceSize,
      helpMost: f.helpMost.trim(),
      leadBeta: f.leadBeta,
      context,
      submittedAt: now.toISOString(),
    },
  };
}

/** Analytics-safe summary of a submission: never includes name, email, handle or free text. */
export function analyticsPropsFor(s: WaitlistSubmission): Record<string, string | boolean> {
  if (s.kind === "member") {
    return {
      age_range: s.ageRange,
      fitness_level: s.fitnessLevel,
      user_type: s.userType,
      struggle: s.struggle,
      beta_tester: s.betaTester,
      heard_from: s.source ?? "not_answered",
    };
  }
  return { coach_type: s.coachType, audience_size: s.audienceSize, lead_beta: s.leadBeta };
}
