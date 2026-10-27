// Phase 3 — GYMX Pro progress demonstrations. Run: npm run test:membership
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { describe, it } from "node:test";
import { PRO_FEATURES, hasEntitlement } from "../src/membership/entitlements.ts";
import {
  CHECKIN_BANNER,
  CHECKIN_SCRIPT_NOTE,
  CHECKIN_TITLE,
  CHECKIN_WEEKS,
  DEFAULT_COSMETICS,
  LIFTS,
  PRIVATE_ENTRIES,
  PROFILE_STYLES,
  PRO_FEATURE_INFO,
  PR_HISTORY,
  PR_MONTHS,
  WEEKLY_SESSIONS,
  completedWorkouts,
  consistencyLabel,
  consistencyScore,
  createPrivateNote,
  groupByMonth,
  prImprovement,
  sliderFraction,
  trainingFrequency,
  workoutCalendar,
} from "../src/pro/proData.ts";

const proDir = new URL("../src/pro/", import.meta.url);
const proSources = readdirSync(proDir).map((f) => [f, readFileSync(new URL(f, proDir), "utf8")]);

describe("consistency score", () => {
  it("scores the demo log 82/100 — STRONG CONSISTENCY", () => {
    assert.equal(consistencyScore(), 82);
    assert.equal(`${consistencyScore()}/100 — ${consistencyLabel(consistencyScore())}`, "82/100 — STRONG CONSISTENCY");
  });
  it("is 100 for a perfect log, 0 for an empty one, and caps extra sessions", () => {
    assert.equal(consistencyScore([4, 4, 4, 4]), 100);
    assert.equal(consistencyScore([0, 0, 0, 0]), 0);
    assert.equal(consistencyScore([]), 0);
    assert.equal(consistencyScore([7, 7, 0, 0]), consistencyScore([4, 4, 0, 0]));
  });
  it("labels score bands", () => {
    assert.equal(consistencyLabel(95), "ELITE CONSISTENCY");
    assert.equal(consistencyLabel(75), "STRONG CONSISTENCY");
    assert.equal(consistencyLabel(60), "BUILDING CONSISTENCY");
    assert.equal(consistencyLabel(10), "GETTING STARTED");
  });
});

describe("PR history and streak data", () => {
  it("ends at the free profile's personal records (225 / 315 / 405)", () => {
    assert.deepEqual(LIFTS.map((l) => PR_HISTORY[l.id].at(-1)), [225, 315, 405]);
  });
  it("has one value per month and never goes backwards", () => {
    for (const l of LIFTS) {
      const s = PR_HISTORY[l.id];
      assert.equal(s.length, PR_MONTHS.length);
      for (let i = 1; i < s.length; i++) assert.ok(s[i] >= s[i - 1], `${l.id} month ${i}`);
    }
    assert.deepEqual(LIFTS.map((l) => prImprovement(l.id)), [40, 70, 90]);
  });
  it("derives the training calendar from the weekly session counts", () => {
    const cal = workoutCalendar();
    assert.equal(cal.length, WEEKLY_SESSIONS.length);
    cal.forEach((week, i) => assert.equal(week.filter(Boolean).length, WEEKLY_SESSIONS[i]));
    assert.equal(completedWorkouts(), 29);
    assert.equal(trainingFrequency(), 3.6);
  });
});

describe("AI weekly check-in (scripted)", () => {
  it("uses the required title, banner and example feedback", () => {
    assert.equal(CHECKIN_TITLE, "YOUR WEEK IN GYMX");
    assert.equal(CHECKIN_BANNER, "AI Weekly Check-In — Coming Soon");
    assert.equal(
      CHECKIN_WEEKS[0].feedback,
      "You completed 4 workouts this week and maintained an 82% consistency score. Your bench press improved, and your training frequency stayed strong.",
    );
    assert.equal(CHECKIN_WEEKS[0].workouts, 4);
    assert.equal(CHECKIN_WEEKS[0].consistency, consistencyScore());
  });
  it("discloses that it is scripted, not AI-generated", () => {
    assert.match(CHECKIN_SCRIPT_NOTE, /scripted/i);
    assert.match(CHECKIN_SCRIPT_NOTE, /no AI model generated it/i);
  });
  it("has workouts, consistency, PRs, trends, focus areas and feedback for every week", () => {
    for (const w of CHECKIN_WEEKS) {
      assert.ok(w.workouts >= 0 && w.consistency > 0 && w.trends.length && w.improve.length && w.feedback);
    }
  });
});

describe("private progress timeline", () => {
  it("creates session-only private notes and rejects empty ones", () => {
    // Local noon (Phase 8): note dates follow the device's local calendar day, so build the date in local time.
    const n = createPrivateNote("  Felt strong today  ", new Date(2026, 9, 23, 12, 0));
    assert.equal(n.body, "Felt strong today");
    assert.equal(n.visibility, "private");
    assert.equal(n.session, true);
    assert.equal(n.date, "2026-10-23");
    assert.equal(createPrivateNote("   "), null);
    assert.equal(createPrivateNote("x".repeat(500)).body.length, 280);
  });
  it("marks every demo entry private and groups newest month first", () => {
    assert.ok(PRIVATE_ENTRIES.every((e) => e.visibility === "private"));
    const groups = groupByMonth(PRIVATE_ENTRIES);
    assert.equal(groups[0].month, "October 2026");
    assert.equal(groups.at(-1).month, "May 2026");
    assert.equal(groups.reduce((n, g) => n + g.entries.length, 0), PRIVATE_ENTRIES.length);
  });
  it("never routes private notes into the public feed", () => {
    const app = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
    const handler = app.slice(app.indexOf("onAddPrivateNote"), app.indexOf("onAddPrivateNote") + 220);
    assert.match(handler, /setPrivateNotes/);
    assert.doesNotMatch(handler, /setPosts|buildPost|moderate\(/);
  });
});

describe("transformation comparison", () => {
  it("clamps the slider position to 0..1", () => {
    assert.equal(sliderFraction(50, 200), 0.25);
    assert.equal(sliderFraction(-30, 200), 0);
    assert.equal(sliderFraction(500, 200), 1);
    assert.equal(sliderFraction(10, 0), 0.5);
  });
});

describe("premium profile customization", () => {
  it("keeps the standard style identical to today's free profile", () => {
    assert.deepEqual(PROFILE_STYLES.standard.banner, ["#FF5A1F", "#8D1B10", "#1A0805"]);
    assert.equal(PROFILE_STYLES.standard.premium, false);
    assert.ok(Object.values(PROFILE_STYLES).filter((s) => s.premium).length >= 3);
  });
  it("does not change the real profile until explicitly applied", () => {
    assert.equal(DEFAULT_COSMETICS.applied, false);
  });
});

describe("entitlement gating", () => {
  it("every Phase 3 feature is a Pro entitlement: locked on Free, unlocked on all premium tiers", () => {
    const features = Object.keys(PRO_FEATURE_INFO);
    assert.equal(features.length, 8);
    for (const f of features) {
      assert.ok(PRO_FEATURES.includes(f), f);
      assert.equal(hasEntitlement("FREE", f), false, `FREE ${f}`);
      for (const t of ["GYMVERSE_PRO", "CREATOR_PRO", "COACH_PRO"]) assert.equal(hasEntitlement(t, f), true, `${t} ${f}`);
    }
  });
  it("keeps the basic timeline and personal records free", () => {
    for (const t of ["FREE", "GYMVERSE_PRO"]) {
      assert.equal(hasEntitlement(t, "progress_timeline"), true);
      assert.equal(hasEntitlement(t, "personal_records"), true);
    }
  });
});

describe("Phase 3 source guarantees", () => {
  for (const [file, src] of proSources) {
    it(`${file}: no external AI, network, payments or prices`, () => {
      assert.doesNotMatch(src, /openai|anthropic|chatgpt|claude|gemini|api[_-]?key|\bfetch\(|axios|XMLHttpRequest/i);
      assert.doesNotMatch(src, /stripe|revenuecat|purchase\(|checkout|subscribe\b/i);
      assert.doesNotMatch(src, /\$\s?\d|\bper month\b|\/mo\b|\bmonthly price|\byearly\b/i);
    });
  }
  it("labels Coming Soon on every gated surface", () => {
    const all = proSources.map(([, s]) => s).join("\n");
    for (const needle of ["DEMO · COMING SOON", "GYMX Pro · Coming Soon", "Coming Soon"]) assert.ok(all.includes(needle), needle);
  });
});
