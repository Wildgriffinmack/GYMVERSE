// Phase 7 — premium challenges & GYMX Founders. Run: npm run test:membership
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { describe, it } from "node:test";
import { COACH_FEATURES, CREATOR_FEATURES, FEATURE_LABELS, PRO_FEATURES, hasEntitlement, resolveEntitlements } from "../src/membership/entitlements.ts";
import { MEMBERSHIP_TIERS, TIERS } from "../src/membership/tiers.ts";
import {
  CHALLENGE_FEATURE_INFO,
  PREMIUM_CHALLENGES,
  PREMIUM_CHALLENGE_COPY,
  challengeById,
  milestonesForWeek,
  progressFor,
  resetProgress,
  toggleMilestone,
} from "../src/challenges/premiumChallengeData.ts";
import { FIRST_1000, FOUNDER_BENEFITS, FOUNDER_COMBINATIONS, FOUNDER_COPY } from "../src/founders/foundersData.ts";
import { SPONSORED_CHALLENGES, SPONSOR_COPY, brandById } from "../src/sponsors/sponsorData.ts";
import { DEFAULT_CHALLENGE, validateChallenge } from "../src/coach/coachData.ts";

const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const files = (dir) => readdirSync(new URL(`../${dir}/`, import.meta.url)).map((f) => [f, src(`${dir}/${f}`)]);

describe("free community challenges", () => {
  it("all six free challenges are still defined and rendered", () => {
    const data = src("src/data.ts");
    for (const id of ["consistency", "pushups", "pullup", "transform", "pr-week", "cardio"]) assert.match(data, new RegExp(`id: "${id}"`), id);
    assert.match(src("src/screens/Challenges.tsx"), /CHALLENGES\.map/);
  });
  it("joining behaviour is unchanged and separate from premium demo progress", () => {
    const app = src("App.tsx");
    assert.match(app, /const toggleChallenge = \(id: string\) => \{/);
    assert.match(app, /showToast\(joined\.includes\(id\) \? `Left \$\{c\.title\}\.` : `Joined \$\{c\.title\}\. Day 1 starts now\.`\)/);
    assert.match(app, /<ChallengesScreen joined=\{joined\} onToggle=\{toggleChallenge\}/);
    const m = app.match(/onChange=\{\(ids\) => [^}]*\}\)\)\}/);
    assert.ok(m && /setPremiumProgress/.test(m[0]) && !/setJoined/.test(m[0]), "premium progress never touches joined");
  });
});

describe("premium challenge data", () => {
  it("defines the four required programs with valid durations", () => {
    assert.deepEqual(PREMIUM_CHALLENGES.map((c) => [c.title, c.durationLabel, c.durationDays]), [
      ["30-Day Muscle Builder", "30 days", 30],
      ["12-Week Strength Builder", "12 weeks", 84],
      ["Beginner Gym Confidence Program", "28 days", 28],
      ["Discipline Mode Challenge", "21 days", 21],
    ]);
    for (const c of PREMIUM_CHALLENGES) {
      assert.ok(Math.abs(c.weeks * 7 - c.durationDays) <= 2, `${c.id} weeks match duration`);
      assert.equal(c.weekObjectives.length, c.weeks, c.id);
      assert.ok(c.focus.length === 5 && c.description && c.objective && c.checkIns.length && c.badgeConcept, c.id);
      assert.ok(c.milestones.length >= 3, c.id);
      assert.equal(new Set(c.milestones.map((m) => m.id)).size, c.milestones.length);
      for (const m of c.milestones) assert.ok(m.week >= 1 && m.week <= c.weeks && m.title && m.detail, `${c.id} ${m.id}`);
      assert.equal(c.milestones.at(-1).week, c.weeks, "last milestone in the final week");
    }
  });
  it("uses the required milestone wording", () => {
    assert.deepEqual(challengeById("pc-muscle").milestones.map((m) => m.title), ["Establish your routine", "Build consistency", "Review your training progress", "Complete your challenge"]);
    assert.deepEqual(challengeById("pc-strength").milestones.map((m) => m.title), ["Establish starting performance", "Complete first training block", "Review training progress", "Complete final week and reflect"]);
    assert.deepEqual(challengeById("pc-beginner").milestones.map((m) => m.title), ["Complete first gym session", "Learn three basic exercises", "Finish the second week", "Complete the program"]);
  });
  it("promises no physical results and treats rest as training", () => {
    const text = JSON.stringify(PREMIUM_CHALLENGES);
    assert.doesNotMatch(text, /guarantee|gain \d|lbs? of muscle|add \d+ ?lb|lose weight|burn fat|shred|no rest|every single day|punish|no excuses/i);
    assert.match(PREMIUM_CHALLENGE_COPY.rest, /Rest and recovery days count/);
    assert.match(JSON.stringify(challengeById("pc-discipline")), /rest days/i);
  });
  it("copy has the required title, subtitle and Coming Soon", () => {
    assert.equal(PREMIUM_CHALLENGE_COPY.title, "GYMX PRO CHALLENGES");
    assert.equal(PREMIUM_CHALLENGE_COPY.subtitle, "Build strength. Stay accountable. Earn your progress.");
    assert.match(PREMIUM_CHALLENGE_COPY.pill, /COMING SOON/);
    assert.match(src("src/challenges/PremiumChallengesSection.tsx"), /<ComingSoonPill label="COMING SOON" \/>/);
  });
});

describe("progress model", () => {
  const c = challengeById("pc-muscle");
  it("derives percentage from completed milestones (3 of 4 = 75%)", () => {
    assert.deepEqual(progressFor(c, ["m1", "m2", "m3"]), { done: 3, total: 4, pct: 75, remaining: 1, complete: false });
    assert.deepEqual(progressFor(c, []), { done: 0, total: 4, pct: 0, remaining: 4, complete: false });
    assert.equal(progressFor(challengeById("pc-discipline"), ["d1"]).pct, 33);
    assert.equal(progressFor(c, ["m1", "m1", "zzz"]).done, 1, "duplicates and unknown ids ignored");
  });
  it("toggling a milestone updates progress without mutating input", () => {
    const start = ["m1"];
    const next = toggleMilestone(c, start, "m2");
    assert.deepEqual(next, ["m1", "m2"]);
    assert.deepEqual(start, ["m1"]);
    assert.deepEqual(toggleMilestone(c, next, "m1"), ["m2"]);
    assert.deepEqual(toggleMilestone(c, next, "nope"), next);
  });
  it("reset restores the starting state", () => {
    assert.deepEqual(resetProgress(), []);
    assert.deepEqual(progressFor(c, resetProgress()), progressFor(c, []));
  });
  it("completion only when every milestone is done", () => {
    let ids = [];
    for (const m of c.milestones) {
      assert.equal(progressFor(c, ids).complete, false);
      ids = toggleMilestone(c, ids, m.id);
    }
    assert.equal(progressFor(c, ids).complete, true);
    assert.equal(progressFor(c, ids).pct, 100);
    assert.match(src("src/challenges/PremiumChallengeScreen.tsx"), /\{p\.complete \? \(/);
  });
  it("week selection returns that week's milestones", () => {
    assert.deepEqual(milestonesForWeek(challengeById("pc-strength"), 4).map((m) => m.id), ["s2"]);
    assert.deepEqual(milestonesForWeek(challengeById("pc-strength"), 5), []);
  });
});

describe("membership access", () => {
  it("Free is locked; GYMX Pro, Creator Pro and Coach Pro can use the demos", () => {
    assert.ok(PRO_FEATURES.includes("premium_challenges"));
    assert.equal(hasEntitlement("FREE", "premium_challenges"), false);
    for (const t of ["GYMVERSE_PRO", "CREATOR_PRO", "COACH_PRO"]) assert.equal(hasEntitlement(t, "premium_challenges"), true, t);
    assert.ok(CHALLENGE_FEATURE_INFO.premium_challenges.body);
  });
  it("the interactive parts are gated by the shared ProSection", () => {
    const screen = src("src/challenges/PremiumChallengeScreen.tsx");
    assert.match(screen, /<ProSection feature="premium_challenges"/);
    assert.match(screen, /onOpenPremium/);
    assert.match(src("src/challenges/PremiumChallengesSection.tsx"), /can\("premium_challenges"\)/);
  });
  it("Coach Pro keeps its separate challenge builder", () => {
    assert.deepEqual(validateChallenge(DEFAULT_CHALLENGE), {});
    assert.ok(COACH_FEATURES.includes("premium_coaching_challenge_previews"));
    assert.equal(hasEntitlement("COACH_PRO", "premium_coaching_challenge_previews"), true);
    assert.match(src("src/coach/CoachCommandCenter.tsx"), /<ChallengeSection /);
  });
});

describe("sponsor reuse", () => {
  it("premium programs reference Phase 6 sponsored challenges instead of new sponsor data", () => {
    const linked = PREMIUM_CHALLENGES.filter((c) => c.sponsoredChallengeId);
    assert.equal(linked.length, 3);
    for (const c of linked) assert.ok(SPONSORED_CHALLENGES.some((s) => s.id === c.sponsoredChallengeId), c.id);
    assert.deepEqual(linked.map((c) => brandById(SPONSORED_CHALLENGES.find((s) => s.id === c.sponsoredChallengeId).brandId).name).sort(), ["IRONFORGE APPAREL", "REPLOCK EQUIPMENT", "SUMMIT RECOVERY"]);
    for (const [f, t] of files("src/challenges")) assert.doesNotMatch(t, /SPONSOR_BRANDS\s*[:=]|brandId: "/, `${f} defines no sponsor catalog`);
  });
  it("keeps sponsor labels and the required reward line", () => {
    assert.equal(SPONSOR_COPY.challengeRewards, "Premium challenge rewards may be sponsored by fitness brands.");
    assert.match(src("src/challenges/PremiumChallengesSection.tsx"), /SPONSOR_COPY\.challengeRewards/);
    assert.match(src("src/challenges/PremiumChallengeScreen.tsx"), /<ChallengeSponsorStrip /);
  });
  it("shows each sponsored challenge once on the Challenges screen", () => {
    const ch = src("src/screens/Challenges.tsx");
    assert.doesNotMatch(ch, /SponsoredChallengesSection/);
  });
  it("awards nothing real", () => {
    assert.match(PREMIUM_CHALLENGE_COPY.noReward, /No real badge, reward, prize/);
    assert.ok(PREMIUM_CHALLENGES.every((c) => /concept only/.test(c.badgeConcept)));
    assert.equal(PREMIUM_CHALLENGE_COPY.completeTitle, "CHALLENGE COMPLETE — DEMO");
    assert.doesNotMatch(JSON.stringify(PREMIUM_CHALLENGES), /prize|promo code|discount|\$\d|ship/i);
  });
});

describe("GYMX Founders", () => {
  it("is not a membership tier or an entitlement", () => {
    assert.deepEqual(MEMBERSHIP_TIERS, ["FREE", "GYMVERSE_PRO", "CREATOR_PRO", "COACH_PRO"]);
    assert.ok(!Object.keys(TIERS).some((k) => /founder/i.test(k)));
    assert.ok(!Object.keys(FEATURE_LABELS).some((k) => /founder/i.test(k)));
    assert.doesNotMatch(src("src/membership/entitlements.ts"), /founder/i);
    assert.doesNotMatch(src("src/membership/MembershipContext.tsx"), /founder/i);
    assert.doesNotMatch(src("src/membership/tiers.ts"), /founder/i);
  });
  it("the Founder toggle is separate state that never changes entitlements", () => {
    const app = src("App.tsx");
    assert.match(app, /const \[founderPreview, setFounderPreview\] = useState\(false\)/);
    const toggle = app.match(/<FounderDevToggle[^\n]*/)[0];
    assert.doesNotMatch(toggle, /setDemoTier|resetToFree|membership\./);
    for (const t of MEMBERSHIP_TIERS) assert.deepEqual(resolveEntitlements(t), resolveEntitlements(t), t);
    assert.doesNotMatch(app, /founderPreview[^\n]*can\(|can\([^\n]*founderPreview/);
  });
  it("Founder badge visibility follows only the independent preview flag", () => {
    const profile = src("src/screens/Profile.tsx");
    assert.match(profile, /\{founder \? <View style=\{\{ marginTop: 8 \}\}><FounderBadge \/><\/View> : null\}/);
    assert.match(src("App.tsx"), /founder=\{founderPreview\}/);
    assert.match(profile, /One primary membership badge at a time/, "membership badge logic untouched");
  });
  it("combines with every plan without changing it", () => {
    assert.deepEqual(FOUNDER_COMBINATIONS.map((c) => c.label), ["Free Founder", "GYMX Pro Founder", "Creator Pro Founder", "Coach Pro Founder"]);
    assert.equal(hasEntitlement("FREE", "posting"), true);
    for (const f of CREATOR_FEATURES) assert.equal(hasEntitlement("CREATOR_PRO", f), true, f);
    for (const f of COACH_FEATURES) assert.equal(hasEntitlement("COACH_PRO", f), true, f);
  });
  it("badge is distinct from Verified Coach and membership badges", () => {
    const badge = src("src/founders/FounderBadge.tsx");
    assert.equal(FOUNDER_COPY.badge, "GYMX FOUNDER");
    assert.doesNotMatch(badge, /<Verified|BadgeCheck|<Badge /);
    assert.match(badge, /Shield/);
    for (const t of MEMBERSHIP_TIERS) assert.notEqual(TIERS[t].badge.label, FOUNDER_COPY.badge);
    assert.match(FOUNDER_COPY.notCredential, /isn't identity verification or a coaching credential/);
  });
  it("is a concept with no promises, enrollment or moderation powers", () => {
    assert.equal(FOUNDER_COPY.title, "GYMX FOUNDERS");
    assert.equal(FOUNDER_COPY.tagline, "Built from day one. Remembered forever.");
    assert.equal(FOUNDER_COPY.description, "A recognition concept for the earliest members who help shape the GYMX community.");
    assert.match(FOUNDER_COPY.notFinal, /not decided/);
    assert.match(FOUNDER_COPY.rules, /no moderation powers/);
    assert.equal(FOUNDER_BENEFITS.length, 6);
    assert.doesNotMatch(JSON.stringify([FOUNDER_BENEFITS, FOUNDER_COPY]), /lifetime|guaranteed (?:discount|access)|% off|\$\d|free forever/i);
    assert.equal(FIRST_1000.title, "THE FIRST 1000");
    assert.equal(FIRST_1000.milestones.length, 4);
    assert.match(FIRST_1000.disclaimer, /don't award Founder status/);
  });
});

describe("navigation and integration", () => {
  it("adds routes, Back targets and Android back handling", () => {
    const app = src("App.tsx");
    for (const r of ["premium_challenge", "founders"]) {
      assert.match(app, new RegExp(`case "${r}":`), r);
      assert.match(app, new RegExp(`if \\(screen === "${r}"\\)`), `${r} back`);
    }
    assert.match(app, /if \(from === "premium" && premiumFrom === "founders"\) \{ navigate\("founders"\); return; \}/);
    assert.match(app, /premium_challenge: challengeFrom, founders: foundersFrom/);
  });
  it("Premium, Profile and Challenges link to Founders; Premium keeps its plans", () => {
    const premium = src("src/membership/PremiumScreen.tsx");
    assert.match(premium, /Explore Founders/);
    assert.match(premium, /PREMIUM_PLANS\.map/);
    assert.match(premium, /<SponsorBenefits onDeals=\{onDeals\} \/>/);
    assert.match(src("src/screens/Profile.tsx"), /GYMX Founders/);
    assert.match(src("App.tsx"), /onFounders=\{\(\) => openFounders\("challenges"\)\}/);
  });
  it("introduces no payments, network calls or external services", () => {
    for (const [f, t] of [...files("src/challenges"), ...files("src/founders")]) {
      assert.doesNotMatch(t, /fetch\(|XMLHttpRequest|axios|stripe|revenuecat|checkout|purchase\(|\bsubscribe\b|\$\d|AsyncStorage|Linking\.openURL/i, f);
    }
  });
});
