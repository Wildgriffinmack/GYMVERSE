/**
 * Create flow model — PURE (type-only imports) so it runs under plain Node tests.
 *
 * Three stages: select media → preview & adjust → post details. Everything maps onto the existing
 * PostDraft → buildPost pipeline. There is no media upload: library photos stay on the device and are
 * shown in this session's feed only; clips are generated demo art until video upload exists.
 */
import type { Post, PostMedia, PostType } from "../data";
import type { PostDraft } from "../utils";

export type CreateStage = "select" | "preview" | "details";
export const CREATE_STAGES: CreateStage[] = ["select", "preview", "details"];

export type CreateMode = "photo" | "clip" | "pr";
export const CREATE_MODES: { id: CreateMode; label: string }[] = [
  { id: "photo", label: "Photo" },
  { id: "clip", label: "Clip" },
  { id: "pr", label: "PR" },
];

/** Short-form post types. Each style renders the existing generated demo art. */
export type ClipType = Exclude<PostType, "Photo" | "PR">;
export const CLIP_STYLES: { type: ClipType; label: string; category: string }[] = [
  { type: "Video", label: "Form check", category: "Beginner" },
  { type: "Workout", label: "Workout", category: "Workout" },
  { type: "Gym Edit", label: "Gym edit", category: "Motivation" },
  { type: "Transformation", label: "Transformation", category: "Transformation" },
  { type: "Motivation", label: "Motivation", category: "Motivation" },
];

export const MAX_PHOTOS = 6;
export const CAPTION_LIMIT = 150;
export const CAPTION_REQUIRED = "Add a caption before you post.";

export type CropId = "landscape" | "square" | "portrait";
export const CROPS: { id: CropId; label: string; name: string; ratio: number }[] = [
  { id: "landscape", label: "3:2", name: "Landscape", ratio: 3 / 2 },
  { id: "square", label: "1:1", name: "Square", ratio: 1 },
  { id: "portrait", label: "4:5", name: "Portrait", ratio: 4 / 5 },
];
export const cropRatio = (id: CropId) => CROPS.find((c) => c.id === id)!.ratio;

/** Closest supported crop for a photo's natural size (landscape when unknown). */
export function cropFor(width?: number, height?: number): CropId {
  if (!width || !height) return "landscape";
  const r = width / height;
  return r < 0.9 ? "portrait" : r <= 1.15 ? "square" : "landscape";
}

/** Single-select replaces; multi-select toggles in tap order and caps at MAX_PHOTOS. */
export function toggleSelection(current: string[], id: string, multi: boolean): string[] {
  if (!multi) return [id];
  if (current.includes(id)) return current.filter((x) => x !== id);
  return current.length >= MAX_PHOTOS ? current : [...current, id];
}

export const PR_LIFTS = [
  { id: "Bench", name: "Bench Press" },
  { id: "Squat", name: "Back Squat" },
  { id: "Deadlift", name: "Deadlift" },
] as const;
export type PrLift = (typeof PR_LIFTS)[number]["id"];
export const PR_REPS = [1, 3, 5] as const;
export type PrReps = (typeof PR_REPS)[number];
export const PR_MAX_LB = 1500;
export const PR_STEP_LB = 5;

export type PrEntry = { lift: PrLift; weight: string; reps: PrReps };
/** Current one-rep bests in lb, keyed by lift (profile records plus PRs posted this session). */
export type PrBests = Partial<Record<PrLift, number>>;
export type PrCheck = { ok: true; value: number; delta: number | null } | { ok: false; reason: string; value: number | null };

/** Digits only, no leading zeros, at most four characters. */
export const sanitizeWeight = (raw: string) => raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 4);

/** Moves to the next 5 lb mark in the pressed direction (232 → 235 or 230). */
export function stepWeight(weight: string, direction: 1 | -1): string {
  const v = Number(weight) || 0;
  const next = direction > 0 ? Math.floor(v / PR_STEP_LB) * PR_STEP_LB + PR_STEP_LB : Math.ceil(v / PR_STEP_LB) * PR_STEP_LB - PR_STEP_LB;
  return String(Math.max(PR_STEP_LB, Math.min(PR_MAX_LB, next)));
}

/** A one-rep entry must beat the current best; multi-rep entries are shown as rep maxes. */
export function checkPr(entry: PrEntry, bests: PrBests): PrCheck {
  const value = Number(entry.weight);
  if (!entry.weight.trim() || !Number.isInteger(value) || value <= 0) return { ok: false, reason: "Enter the weight you lifted.", value: null };
  if (value > PR_MAX_LB) return { ok: false, reason: `Enter a weight up to ${PR_MAX_LB} lb.`, value };
  const best = entry.reps === 1 ? bests[entry.lift] : undefined;
  if (best !== undefined && value <= best) return { ok: false, reason: `Beat your best of ${best} lb to share a new PR.`, value };
  return { ok: true, value, delta: best !== undefined ? value - best : null };
}

const ONE_REP = "1 rep";

/** Home "personal record" media, in the same shape as the existing PR posts. */
export function milestoneFor(entry: PrEntry, bests: PrBests): Extract<PostMedia, { kind: "milestone" }> | null {
  const check = checkPr(entry, bests);
  if (!check.ok) return null;
  const lift = PR_LIFTS.find((l) => l.id === entry.lift)!;
  return {
    kind: "milestone",
    lift: lift.name,
    value: String(check.value),
    unit: "LB",
    detail: entry.reps === 1 ? ONE_REP : `${entry.reps} reps`,
    delta: check.delta !== null ? `+${check.delta} LB` : "",
    deltaLabel: check.delta !== null ? "vs. previous PR" : `${entry.reps}-rep max`,
  };
}

/** One-rep bests: the profile's records, raised by any one-rep PR the user has posted this session. */
export function sessionBests(records: readonly { lift: string; value: number }[], posts: readonly Pick<Post, "created" | "media">[]): PrBests {
  const bests: PrBests = {};
  for (const r of records) {
    const lift = PR_LIFTS.find((l) => l.id === r.lift);
    if (lift) bests[lift.id] = r.value;
  }
  for (const { created, media } of posts) {
    if (!created || media?.kind !== "milestone" || media.detail !== ONE_REP) continue;
    const name = media.lift;
    const lift = PR_LIFTS.find((l) => l.name === name);
    const value = Number(media.value);
    if (lift && value > (bests[lift.id] ?? 0)) bests[lift.id] = value;
  }
  return bests;
}

export type CreateDraft = {
  mode: CreateMode;
  /** Selected photo ids in carousel order (sample ids or session library ids). */
  photos: string[];
  crop: CropId;
  cropTouched: boolean;
  clip: ClipType | null;
  pr: PrEntry;
  caption: string;
  hashtags: string;
  category: string;
  categoryTouched: boolean;
  /** Challenge title the post is tagged with. */
  challenge: string | null;
  addToTimeline: boolean;
};

export function initialDraft(bests: PrBests = {}): CreateDraft {
  const best = bests.Bench;
  return {
    mode: "photo",
    photos: [],
    crop: "landscape",
    cropTouched: false,
    clip: null,
    pr: { lift: "Bench", weight: best ? String(best + PR_STEP_LB) : "", reps: 1 },
    caption: "",
    hashtags: "",
    category: "Workout",
    categoryTouched: false,
    challenge: null,
    addToTimeline: false,
  };
}

export function postTypeOf(d: Pick<CreateDraft, "mode" | "clip">): PostType {
  return d.mode === "photo" ? "Photo" : d.mode === "pr" ? "PR" : d.clip ?? "Video";
}

export function defaultCategory(d: Pick<CreateDraft, "mode" | "clip">): string {
  if (d.mode === "pr") return "PR";
  if (d.mode === "clip") return CLIP_STYLES.find((c) => c.type === d.clip)?.category ?? "Workout";
  return "Workout";
}

/** Applies a media change; the category follows the media until the user picks one. */
export function withMedia(d: CreateDraft, patch: Partial<Pick<CreateDraft, "mode" | "photos" | "clip" | "pr" | "crop">>): CreateDraft {
  const next = { ...d, ...patch };
  return next.categoryTouched ? next : { ...next, category: defaultCategory(next) };
}

export function hasMedia(d: CreateDraft, bests: PrBests): boolean {
  if (d.mode === "photo") return d.photos.length > 0;
  if (d.mode === "clip") return d.clip !== null;
  return checkPr(d.pr, bests).ok;
}

export function isDirty(d: CreateDraft, initial: CreateDraft): boolean {
  return (
    d.photos.length > 0 ||
    d.clip !== null ||
    d.caption.trim() !== "" ||
    d.hashtags.trim() !== "" ||
    d.challenge !== null ||
    d.addToTimeline ||
    d.pr.lift !== initial.pr.lift ||
    d.pr.weight !== initial.pr.weight ||
    d.pr.reps !== initial.pr.reps
  );
}

/** Why the post can't be shared yet, or null when it's ready. */
export function shareProblem(d: CreateDraft, bests: PrBests): string | null {
  if (!hasMedia(d, bests)) return d.mode === "pr" ? "Finish your PR details first." : "Choose media first.";
  if (!d.caption.trim()) return CAPTION_REQUIRED;
  if (d.caption.length > CAPTION_LIMIT) return `Keep captions under ${CAPTION_LIMIT} characters.`;
  return null;
}

/** Maps the draft onto the app's existing PostDraft. Clips keep the generated-art format (no `media`). */
export function toPostDraft(d: CreateDraft, bests: PrBests): PostDraft {
  const base: PostDraft = {
    postType: postTypeOf(d),
    category: d.category,
    caption: d.caption,
    hashtags: d.hashtags,
    addToTimeline: d.addToTimeline,
    ...(d.challenge ? { challenge: d.challenge } : {}),
  };
  if (d.mode === "photo" && d.photos.length) {
    return { ...base, media: { kind: "photos", layout: d.photos.length > 1 ? "carousel" : "single", photos: [...d.photos], aspect: cropRatio(d.crop) } };
  }
  if (d.mode === "pr") {
    const media = milestoneFor(d.pr, bests);
    return media ? { ...base, media } : base;
  }
  return base;
}

const normalizeTag = (t: string) => t.replace(/^#+/, "").trim();

/** Hashtags in the raw field, as "#Tag" (deduped, case-insensitive). */
export function hashtagList(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[\s,]+/)) {
    const tag = normalizeTag(part);
    if (!tag || seen.has(tag.toLowerCase())) continue;
    seen.add(tag.toLowerCase());
    out.push(`#${tag}`);
  }
  return out;
}

export function hasHashtag(raw: string, tag: string): boolean {
  const t = normalizeTag(tag).toLowerCase();
  return hashtagList(raw).some((x) => x.slice(1).toLowerCase() === t);
}

/** Adds or removes one suggested tag, keeping the rest of the field as typed. */
export function toggleHashtag(raw: string, tag: string): string {
  const t = normalizeTag(tag).toLowerCase();
  const list = hashtagList(raw);
  const next = hasHashtag(raw, tag) ? list.filter((x) => x.slice(1).toLowerCase() !== t) : [...list, `#${normalizeTag(tag)}`];
  return next.join(" ");
}

export function hashtagSummary(raw: string): string {
  const list = hashtagList(raw);
  if (!list.length) return "Add";
  return list.length > 2 ? `${list.slice(0, 2).join(" ")} +${list.length - 2}` : list.join(" ");
}
