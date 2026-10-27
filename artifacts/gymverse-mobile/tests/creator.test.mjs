// Phase 4 — Creator Pro demonstrations. Run: npm run test:membership
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { describe, it } from "node:test";
import { CREATOR_FEATURES, PRO_FEATURES, hasEntitlement } from "../src/membership/entitlements.ts";
import {
  CAMPAIGNS,
  CREATOR_FEATURE_INFO,
  DEFAULT_CREATOR_STATE,
  DEFAULT_FILTERS,
  DEMO_POSTS,
  SAMPLE_COMMENTS,
  STUDIO_COPY,
  addScheduled,
  applyCommentFilters,
  bestPostingTime,
  categoryBreakdown,
  engagementRate,
  followerGrowth,
  mostActiveDays,
  periodTotals,
  pinnedOrder,
  postsInPeriod,
  removeScheduled,
  sumMetrics,
  topPosts,
  updateScheduled,
  viewsChart,
} from "../src/creator/creatorData.ts";

const PERIODS = ["7d", "30d", "90d"];
const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

describe("creator entitlements", () => {
  it("only Creator Pro unlocks all 8 creator features", () => {
    assert.equal(CREATOR_FEATURES.length, 8);
    for (const f of CREATOR_FEATURES) {
      assert.equal(hasEntitlement("CREATOR_PRO", f), true, f);
      for (const tier of ["FREE", "GYMVERSE_PRO", "COACH_PRO"]) assert.equal(hasEntitlement(tier, f), false, `${tier} ${f}`);
    }
  });
  it("Creator Pro still inherits GYMX Pro benefits", () => {
    for (const f of PRO_FEATURES) assert.equal(hasEntitlement("CREATOR_PRO", f), true, f);
  });
  it("every creator feature has a locked explanation", () => {
    for (const f of CREATOR_FEATURES) assert.ok(CREATOR_FEATURE_INFO[f]?.body, f);
  });
});

describe("analytics consistency", () => {
  it("30-day totals match the documented demo numbers", () => {
    const t = periodTotals("30d");
    assert.deepEqual([t.views, t.likes, t.saves, t.shares, t.comments], [48250, 6420, 1180, 740, 410]);
    assert.equal(t.engagementRate, 18.1);
    assert.equal(t.newFollowers, 328);
    assert.equal(t.profileVisits, 2140);
  });
  it("engagement rate follows (likes + comments + saves + shares) / views", () => {
    assert.equal(engagementRate({ views: 1000, likes: 50, comments: 10, saves: 20, shares: 6 }), 8.6);
    assert.equal(engagementRate({ views: 0, likes: 5, comments: 0, saves: 0, shares: 0 }), 0);
  });
  it("changing the period changes the numbers", () => {
    const views = PERIODS.map((p) => periodTotals(p).views);
    assert.deepEqual(views, [22250, 48250, 91350]);
    assert.deepEqual(PERIODS.map((p) => followerGrowth(p).gained), [84, 328, 590]);
  });
  for (const p of PERIODS) {
    it(`${p}: chart bars and categories sum to the period totals`, () => {
      const t = periodTotals(p);
      assert.equal(viewsChart(p).reduce((s, b) => s + b.views, 0), t.views);
      const cats = categoryBreakdown(p);
      assert.deepEqual(sumMetrics(cats), sumMetrics(postsInPeriod(p)));
      assert.equal(cats.reduce((s, c) => s + c.posts, 0), t.posts);
    });
  }
  it("top posts are the highest-viewed posts in the period", () => {
    assert.deepEqual(topPosts("30d").map((p) => p.title), ["LEG DAY MOTIVATION", "6-MONTH TRANSFORMATION", "PUSH DAY ROUTINE"]);
    for (const p of PERIODS) {
      const top = topPosts(p);
      const max = Math.max(...postsInPeriod(p).map((x) => x.views));
      assert.equal(top[0].views, max);
    }
  });
  it("best posting time comes from the demo activity data", () => {
    assert.equal(bestPostingTime().label, "Tuesday · 6:30 PM");
    assert.deepEqual(mostActiveDays(), ["Tuesday", "Thursday"]);
  });
});

describe("creator tools", () => {
  const base = DEFAULT_CREATOR_STATE.schedule;
  it("schedule add / update / remove", () => {
    const added = addScheduled(base, { id: "s1", draftId: "d2", dayOffset: 1, time: "6:30 AM" });
    assert.equal(added.length, 2);
    assert.equal(added[0].id, "s1", "sorted by day");
    const moved = updateScheduled(added, "s1", { dayOffset: 5 });
    assert.equal(moved.at(-1).id, "s1");
    assert.equal(removeScheduled(moved, "s1").length, 1);
    assert.equal(base.length, 1, "input not mutated");
  });
  it("invalid schedule input leaves the list unchanged", () => {
    assert.equal(addScheduled(base, { id: "x", draftId: "nope", dayOffset: 2, time: "6:30 PM" }), base);
    assert.equal(addScheduled(base, { id: "x", draftId: "d1", dayOffset: 30, time: "6:30 PM" }), base);
    assert.equal(addScheduled(base, { id: "x", draftId: "d1", dayOffset: 2, time: "3:13 AM" }), base);
    assert.deepEqual(updateScheduled(base, "s-demo", { dayOffset: 0 }), base);
  });
  it("pinnedOrder puts the pin first without mutating input", () => {
    const copy = DEMO_POSTS.map((p) => p.id);
    const out = pinnedOrder(DEMO_POSTS, "cp4");
    assert.equal(out[0].id, "cp4");
    assert.equal(out.length, DEMO_POSTS.length);
    assert.deepEqual(DEMO_POSTS.map((p) => p.id), copy);
    assert.deepEqual(pinnedOrder(DEMO_POSTS, null).map((p) => p.id), copy);
  });
  it("comment filters hide spam/promo and hold keywords", () => {
    const out = applyCommentFilters(SAMPLE_COMMENTS, DEFAULT_FILTERS).map((c) => c.outcome);
    assert.deepEqual(out, ["shown", "hidden", "hidden", "held", "shown", "hidden", "hidden"]);
    const off = applyCommentFilters(SAMPLE_COMMENTS, { spam: false, promo: false, holdKeywords: false, keywords: [] });
    assert.ok(off.every((c) => c.outcome === "shown"));
  });
});

describe("campaigns and honesty", () => {
  it("every campaign is fictional and tagged", () => {
    assert.equal(CAMPAIGNS.length, 3);
    assert.ok(CAMPAIGNS.every((c) => c.fictional === true));
    assert.equal(STUDIO_COPY.campaignTag, "DEMO OPPORTUNITY · NOT A LIVE CAMPAIGN");
    assert.match(STUDIO_COPY.campaignDisclaimer, /No sponsorship is guaranteed/);
  });
  it("copy never promises boosted reach", () => {
    assert.match(STUDIO_COPY.organicNote, /never boosts/);
  });
  it("Home Feed ranking is untouched by membership or creator code", () => {
    const feed = src("src/screens/Feed.tsx");
    assert.doesNotMatch(feed, /membership|creator|pinnedOrder/i);
  });
  it("no payment, network or price code in src/creator", () => {
    for (const f of readdirSync(new URL("../src/creator/", import.meta.url))) {
      const text = src(`src/creator/${f}`);
      assert.doesNotMatch(text, /fetch\(|XMLHttpRequest|stripe|revenuecat|checkout|purchase\(|\bsubscribe\b|\$\d/i, f);
    }
  });
  it("creator demo state lives apart from feed posts in App", () => {
    const app = src("App.tsx");
    assert.match(app, /label: "Engagement", value: `\$\{t30\.engagementRate\}%`/, "profile strip shows the real engagement value");
    const m = app.match(/onChange=\{\(patch\) => [^}]*\}\)\)\}/);
    assert.ok(m, "creator onChange handler found");
    assert.match(m[0], /setCreatorState/);
    assert.doesNotMatch(m[0], /setPosts/);
  });
});
