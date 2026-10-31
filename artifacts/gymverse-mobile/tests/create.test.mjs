// Create flow (Round 2): three-stage model, PR rules, mapping onto the existing PostDraft, and honesty guarantees.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { describe, it } from "node:test";
import {
  CAPTION_LIMIT,
  CAPTION_REQUIRED,
  CLIP_STYLES,
  CREATE_MODES,
  CREATE_STAGES,
  CROPS,
  MAX_PHOTOS,
  checkPr,
  cropFor,
  hasHashtag,
  hasMedia,
  hashtagList,
  hashtagSummary,
  initialDraft,
  isDirty,
  milestoneFor,
  sanitizeWeight,
  sessionBests,
  shareProblem,
  stepWeight,
  toPostDraft,
  toggleHashtag,
  toggleSelection,
  withMedia,
} from "../src/create/createDraft.ts";
import { HOME_POSTS } from "../src/home/homeData.ts";

const src = (rel) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
const BESTS = { Bench: 225, Squat: 315, Deadlift: 405 };
const draft = (patch = {}) => ({ ...initialDraft(BESTS), ...patch });

describe("stages, modes and post types", () => {
  it("is a three-stage flow with Photo, Clip and PR modes", () => {
    assert.deepEqual(CREATE_STAGES, ["select", "preview", "details"]);
    assert.deepEqual(CREATE_MODES.map((m) => m.id), ["photo", "clip", "pr"]);
  });
  it("keeps every existing post type reachable", () => {
    const clipTypes = CLIP_STYLES.map((c) => c.type).sort();
    assert.deepEqual(clipTypes, ["Gym Edit", "Motivation", "Transformation", "Video", "Workout"]);
    assert.equal(toPostDraft(draft({ mode: "photo", photos: ["gym-rig"] }), BESTS).postType, "Photo");
    assert.equal(toPostDraft(draft({ mode: "pr" }), BESTS).postType, "PR");
    for (const c of CLIP_STYLES) assert.equal(toPostDraft(draft({ mode: "clip", clip: c.type }), BESTS).postType, c.type);
  });
});

describe("photo selection and crop", () => {
  it("single-select replaces; multi-select toggles in order and caps", () => {
    assert.deepEqual(toggleSelection(["a"], "b", false), ["b"]);
    assert.deepEqual(toggleSelection(["a"], "b", true), ["a", "b"]);
    assert.deepEqual(toggleSelection(["a", "b"], "a", true), ["b"]);
    const full = Array.from({ length: MAX_PHOTOS }, (_, i) => `p${i}`);
    assert.deepEqual(toggleSelection(full, "extra", true), full);
  });
  it("picks the closest crop for a photo's shape", () => {
    assert.equal(cropFor(3000, 4000), "portrait");
    assert.equal(cropFor(1000, 1000), "square");
    assert.equal(cropFor(4000, 3000), "landscape");
    assert.equal(cropFor(), "landscape");
    assert.deepEqual(CROPS.map((c) => c.label), ["3:2", "1:1", "4:5"]);
  });
  it("publishes real photo media with the chosen crop (single and carousel)", () => {
    const one = toPostDraft(draft({ photos: ["gym-rig"], crop: "portrait" }), BESTS);
    assert.deepEqual(one.media, { kind: "photos", layout: "single", photos: ["gym-rig"], aspect: 4 / 5 });
    const many = toPostDraft(draft({ photos: ["gym-rig", "dumbbell-rack"] }), BESTS);
    assert.equal(many.media.layout, "carousel");
    assert.equal(many.media.aspect, 3 / 2);
  });
});

describe("personal records", () => {
  it("a one-rep PR must beat the current best", () => {
    assert.equal(checkPr({ lift: "Bench", weight: "225", reps: 1 }, BESTS).ok, false);
    assert.match(checkPr({ lift: "Bench", weight: "220", reps: 1 }, BESTS).reason, /Beat your best of 225 lb/);
    assert.deepEqual(checkPr({ lift: "Bench", weight: "235", reps: 1 }, BESTS), { ok: true, value: 235, delta: 10 });
  });
  it("multi-rep maxes aren't compared with one-rep bests", () => {
    assert.deepEqual(checkPr({ lift: "Squat", weight: "275", reps: 5 }, BESTS), { ok: true, value: 275, delta: null });
  });
  it("rejects empty, zero and out-of-range weights", () => {
    for (const weight of ["", "0", "1501"]) assert.equal(checkPr({ lift: "Deadlift", weight, reps: 3 }, BESTS).ok, false, weight);
  });
  it("builds Home PR media in the same shape as existing PR posts", () => {
    const m = milestoneFor({ lift: "Squat", weight: "325", reps: 1 }, BESTS);
    assert.deepEqual(m, { kind: "milestone", lift: "Back Squat", value: "325", unit: "LB", detail: "1 rep", delta: "+10 LB", deltaLabel: "vs. previous PR" });
    const existing = HOME_POSTS.find((p) => p.media?.kind === "milestone").media;
    assert.deepEqual(Object.keys(m).sort(), Object.keys(existing).sort());
    assert.equal(milestoneFor({ lift: "Bench", weight: "200", reps: 1 }, BESTS), null);
    assert.equal(milestoneFor({ lift: "Bench", weight: "205", reps: 3 }, BESTS).deltaLabel, "3-rep max");
  });
  it("sanitizes typed weights and steps to the next 5 lb mark", () => {
    assert.equal(sanitizeWeight("0a2 3,5"), "235");
    assert.equal(sanitizeWeight("123456"), "1234");
    assert.equal(stepWeight("230", 1), "235");
    assert.equal(stepWeight("230", -1), "225");
    assert.equal(stepWeight("232", -1), "230", "doesn't skip the nearest mark going down");
    assert.equal(stepWeight("233", 1), "235", "doesn't skip the nearest mark going up");
    assert.equal(stepWeight("", -1), "5");
    assert.equal(stepWeight("1500", 1), "1500");
  });
  it("prefills one plate above the bench best so the default is a real PR", () => {
    assert.equal(initialDraft(BESTS).pr.weight, "230");
    assert.equal(initialDraft({}).pr.weight, "");
  });
  it("a PR posted this session raises the bar for the next one", () => {
    const records = [{ lift: "Bench", value: 225 }, { lift: "Squat", value: 315 }, { lift: "Deadlift", value: 405 }];
    assert.deepEqual(sessionBests(records, []), BESTS);
    const posted = (entry, created = true) => ({ created, media: milestoneFor(entry, BESTS) });
    const bests = sessionBests(records, [
      posted({ lift: "Bench", weight: "235", reps: 1 }),
      posted({ lift: "Bench", weight: "230", reps: 1 }),
      posted({ lift: "Squat", weight: "330", reps: 5 }),
      posted({ lift: "Deadlift", weight: "500", reps: 1 }, false),
      { created: true },
    ]);
    assert.deepEqual(bests, { Bench: 235, Squat: 315, Deadlift: 405 }, "only your own one-rep PRs count");
    assert.equal(initialDraft(bests).pr.weight, "240");
    assert.match(checkPr({ lift: "Bench", weight: "230", reps: 1 }, bests).reason, /Beat your best of 235 lb/);
  });
});

describe("draft rules", () => {
  it("category follows the media until the user picks one", () => {
    let d = withMedia(draft(), { mode: "clip", clip: "Gym Edit" });
    assert.equal(d.category, "Motivation");
    d = withMedia(d, { mode: "pr" });
    assert.equal(d.category, "PR");
    d = withMedia({ ...d, category: "Nutrition", categoryTouched: true }, { mode: "photo" });
    assert.equal(d.category, "Nutrition");
  });
  it("Next needs media; Share needs media and a caption", () => {
    assert.equal(hasMedia(draft(), BESTS), false);
    assert.equal(shareProblem(draft(), BESTS), "Choose media first.");
    assert.equal(shareProblem(draft({ photos: ["gym-rig"] }), BESTS), CAPTION_REQUIRED);
    assert.equal(shareProblem(draft({ photos: ["gym-rig"], caption: "   " }), BESTS), CAPTION_REQUIRED);
    assert.equal(shareProblem(draft({ photos: ["gym-rig"], caption: "Leg day" }), BESTS), null);
    assert.equal(shareProblem(draft({ mode: "pr", pr: { lift: "Bench", weight: "100", reps: 1 } }), BESTS), "Finish your PR details first.");
    assert.equal(CAPTION_REQUIRED, "Add a caption before you post.", "keeps the existing validation copy");
  });
  it("only real edits make the draft dirty (the PR prefill doesn't)", () => {
    const initial = initialDraft(BESTS);
    assert.equal(isDirty(initial, initial), false);
    assert.equal(isDirty({ ...initial, mode: "pr" }, initial), false);
    for (const patch of [{ photos: ["x"] }, { clip: "Workout" }, { caption: "hi" }, { hashtags: "#a" }, { challenge: "PR Week" }, { addToTimeline: true }, { pr: { ...initial.pr, weight: "240" } }]) {
      assert.equal(isDirty({ ...initial, ...patch }, initial), true, JSON.stringify(patch));
    }
  });
  it("maps onto the existing PostDraft without losing captions, hashtags, timeline or challenge", () => {
    const out = toPostDraft(draft({ mode: "clip", clip: "Workout", caption: "Push day", hashtags: "#PushDay", addToTimeline: true, challenge: "30-Day Gym Consistency" }), BESTS);
    assert.deepEqual(out, { postType: "Workout", category: "Workout", caption: "Push day", hashtags: "#PushDay", addToTimeline: true, challenge: "30-Day Gym Consistency" });
    assert.equal("media" in out, false, "clips keep the generated-art format");
    assert.equal("challenge" in toPostDraft(draft({ photos: ["gym-rig"] }), BESTS), false);
    assert.equal(CAPTION_LIMIT, 150);
  });
});

describe("hashtags", () => {
  it("toggles suggestions without disturbing typed tags", () => {
    assert.equal(toggleHashtag("", "#LegDay"), "#LegDay");
    assert.equal(toggleHashtag("#LegDay Consistency", "#BenchPR"), "#LegDay #Consistency #BenchPR");
    assert.equal(toggleHashtag("#legday #Consistency", "#LegDay"), "#Consistency");
    assert.equal(hasHashtag("legday", "#LegDay"), true);
  });
  it("dedupes case-insensitively and summarizes", () => {
    assert.deepEqual(hashtagList("#A a, b ##c"), ["#A", "#b", "#c"]);
    assert.equal(hashtagSummary(""), "Add");
    assert.equal(hashtagSummary("#a #b #c #d"), "#a #b +2");
  });
});

describe("integration and honesty", () => {
  const files = readdirSync(new URL("../src/create/", import.meta.url)).map((f) => [f, src(`src/create/${f}`)]);
  const create = src("src/screens/Create.tsx");
  const all = [create, ...files.map(([, t]) => t)].join("\n");
  it("publishes only through the existing onPost pipeline", () => {
    assert.match(create, /await onPost\(toPostDraft\(draft, bests\)\)/);
    assert.doesNotMatch(all, /setPosts|buildPost\(|moderate\(/);
    assert.match(src("App.tsx"), /<CreateScreen onPost=\{createPost\}/);
    assert.match(src("src/utils.ts"), /\.\.\.\(media \? \{ media \} : \{\}\)/);
    assert.match(src("src/utils.ts"), /\.\.\.\(draft\.challenge \? \{ challenge: draft\.challenge \} : \{\}\)/);
  });
  it("uses the real system photo picker, photos only, and keeps photos on the device", () => {
    assert.match(create, /launchImageLibraryAsync\(\{ mediaTypes: \["images"\]/);
    assert.match(src("src/home/photos.ts"), /never uploaded/);
    assert.doesNotMatch(all, /\bupload(ed|ing)\b/i, "no upload success claims");
  });
  it("labels demo clips honestly and offers no fake playback or editing controls", () => {
    assert.match(all, /Demo clip/);
    assert.match(all, /Video upload (and playback )?(isn't|aren't) available yet/);
    assert.doesNotMatch(all, /Play video|Pause video|Filters|Adjust brightness|Trim/);
  });
  it("feed renders the chosen crop, library photos and the challenge tag", () => {
    assert.match(src("src/home/HomePost.tsx"), /aspect=\{media\.aspect\}/);
    assert.match(src("src/home/HomePost.tsx"), /const photo = photoFor\(id\)/);
    assert.match(src("src/home/HomePost.tsx"), /\{post\.challenge \? \(/, "photo and PR posts live on Home, so Home shows their challenge");
  });
  it("PR bests come from App and include this session's posts", () => {
    assert.match(src("App.tsx"), /const prBests = useMemo\(\(\) => sessionBests\(PERSONAL_RECORDS, posts\), \[posts\]\);/);
    assert.match(src("App.tsx"), /bests=\{prBests\}/);
  });
  it("Android back steps back through Create before leaving it, and the tab bar hides in the flow", () => {
    const app = src("App.tsx");
    assert.match(app, /if \(screen === "create" && createBack\.current\?\.\(\)\) return true;/);
    assert.match(app, /screen !== "welcome" && screen !== "create" \? <BottomNav/);
    assert.match(create, /backHandlerRef\.current = handleBack/);
    assert.match(create, /Keyboard\.dismiss\(\); setDiscardOpen\(true\);/, "the discard sheet never opens under the keyboard");
  });
  it("every pressable control in the flow declares a role", () => {
    for (const [f, text] of [["Create.tsx", create], ...files]) {
      const pressables = (text.match(/<Pressable\b/g) ?? []).length;
      const roles = (text.match(/accessibilityRole=/g) ?? []).length;
      assert.ok(roles >= pressables, `${f}: ${pressables} pressables, ${roles} roles`);
    }
  });
});
