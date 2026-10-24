// Phase 8 — regression tests for defects found during the final QA pass. Run: npm run test:membership
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { consistencyScore, createPrivateNote, groupByMonth, localDateKey } from "../src/pro/proData.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const src = (p) => readFileSync(join(root, p), "utf8");
function tsxFiles(dir) {
  const out = [];
  for (const f of readdirSync(join(root, dir))) {
    const p = join(dir, f);
    if (statSync(join(root, p)).isDirectory()) out.push(...tsxFiles(p));
    else if (p.endsWith(".tsx")) out.push(p);
  }
  return out;
}

describe("private notes use the local calendar date", () => {
  it("an evening note keeps today's local date (was UTC → tomorrow in the Americas)", () => {
    // Local-time constructor: 9:30 PM on Oct 23 wherever the tests run.
    const evening = new Date(2026, 9, 23, 21, 30);
    assert.equal(localDateKey(evening), "2026-10-23");
    assert.equal(createPrivateNote("late session", evening).date, "2026-10-23");
    const earlyMorning = new Date(2026, 9, 24, 0, 15);
    assert.equal(createPrivateNote("early session", earlyMorning).date, "2026-10-24");
  });
  it("pads months and days and still groups by month", () => {
    assert.equal(localDateKey(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
    const groups = groupByMonth([createPrivateNote("a", new Date(2026, 9, 31, 22, 0))]);
    assert.equal(groups[0].month, "October 2026");
  });
  it("App no longer derives private-note dates from toISOString", () => {
    assert.doesNotMatch(src("src/pro/proData.ts"), /toISOString\(\)\.slice\(0, 10\)/);
  });
});

describe("copy consistency", () => {
  it("the Pro promo calls the 0–100 metric a 'consistency score' (not the free timeline's consistency %)", () => {
    const promo = src("src/pro/ProgressPromo.tsx");
    assert.match(promo, /consistency score \{consistencyScore\(\)\}\/100/);
    assert.equal(consistencyScore(), 82);
  });
});

describe("accessibility state is exposed on every platform", () => {
  const files = [...tsxFiles("src"), "App.tsx"];
  it("every accessibilityState selected/checked/disabled/expanded has a matching aria-* prop", () => {
    const missing = [];
    for (const f of files) {
      const text = src(f);
      for (const m of text.matchAll(/accessibilityState=\{\{ ([^{}]*?) \}\}/g)) {
        const tag = text.slice(m.index, m.index + 600).split(/>\s*\n|\/>/)[0];
        for (const pair of m[1].split(/,\s*/)) {
          const key = pair.split(":")[0].trim();
          if (["selected", "checked", "disabled", "expanded"].includes(key) && !new RegExp(`aria-${key}=`).test(tag)) missing.push(`${f}: ${key}`);
        }
      }
    }
    assert.deepEqual(missing, []);
  });
  it("the before/after slider exposes its value to web screen readers too", () => {
    const slider = src("src/pro/CompareSlider.tsx");
    for (const a of ["aria-valuemin", "aria-valuemax", "aria-valuenow", "aria-valuetext"]) assert.match(slider, new RegExp(`${a}=`), a);
  });
});

describe("React keys stay unique when data repeats", () => {
  it("line-chart axis labels are keyed by position (the 7-day follower series repeats a weekday)", async () => {
    const { followerSeries } = await import("../src/creator/creatorData.ts");
    const labels = followerSeries("7d").map((p) => p.label);
    assert.equal(labels.length, 8);
    assert.notEqual(new Set(labels).size, labels.length, "fixture really does repeat a label");
    const charts = src("src/pro/Charts.tsx");
    assert.doesNotMatch(charts, /<SvgText key=\{l\}/);
    assert.match(charts, /<SvgText key=\{`\$\{l\}-\$\{i\}`\}/);
  });
  it("profile link chips are keyed by link id, not the editable label, and blank labels are skipped", () => {
    const app = src("App.tsx");
    assert.match(app, /filter\(\(l\) => l\.visible && l\.label\.trim\(\)\)\.map\(\(l\) => \(\{ id: l\.id, label: l\.label\.trim\(\) \}\)\)/);
    const profile = src("src/screens/Profile.tsx");
    assert.match(profile, /links: \{ id: string; label: string \}\[\] \| null;/);
    assert.match(profile, /creator\.links\.map\(\(l\) => <View key=\{l\.id\}/);
  });
  it("booking client chips are de-duplicated (two inquiries can share a name)", async () => {
    const { EXAMPLE_INQUIRY, DEFAULT_COACH_STATE, leadFromInquiry } = await import("../src/coach/coachData.ts");
    const a = leadFromInquiry(EXAMPLE_INQUIRY, "a");
    const b = leadFromInquiry(EXAMPLE_INQUIRY, "b");
    const leads = [b, a, ...DEFAULT_COACH_STATE.leads];
    const names = ["Demo client", ...leads.filter((l) => l.status !== "closed").slice(0, 3).map((l) => l.name)];
    assert.notEqual(new Set(names).size, names.length, "without de-duplication the chip keys collide");
    assert.match(src("src/coach/CoachBooking.tsx"), /const clients = \[\.\.\.new Set\(\["Demo client", \.\.\.state\.leads/);
  });
});