// Membership foundation tests (Phase 1). Run: npm run test:membership
// Plain Node (no test framework dependency); Node 24 loads the TypeScript config directly.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { describe, it } from "node:test";
import {
  COACH_FEATURES,
  CREATOR_FEATURES,
  FREE_FEATURES,
  PRO_FEATURES,
  TIER_INHERITS,
  hasEntitlement,
  resolveEntitlements,
} from "../src/membership/entitlements.ts";
import { SPONSOR_OPPORTUNITIES, SPONSOR_PROFILES, sponsorGap } from "../src/membership/sponsors.ts";
import { MEMBERSHIP_TIERS, TIERS } from "../src/membership/tiers.ts";
import { PLAN_COMPARISON, PREMIUM_COPY, PREMIUM_PLANS } from "../src/membership/premiumContent.ts";

describe("membership tiers", () => {
  it("defines exactly the four tiers", () => {
    assert.deepEqual(MEMBERSHIP_TIERS, ["FREE", "GYMVERSE_PRO", "CREATOR_PRO", "COACH_PRO"]);
  });

  it("marks every paid tier Coming Soon and only Free as included", () => {
    for (const id of MEMBERSHIP_TIERS) {
      const t = TIERS[id];
      if (id === "FREE") {
        assert.equal(t.availability, "included");
        assert.equal(t.isPremium, false);
      } else {
        assert.equal(t.availability, "coming_soon");
        assert.equal(t.availabilityLabel, "Coming Soon");
        assert.equal(t.isPremium, true);
      }
      for (const key of ["displayName", "tagline", "description", "styleId", "sponsorProfile"]) assert.ok(t[key], `${id}.${key}`);
      assert.ok(t.badge);
    }
  });

  it("has no price, currency or billing fields anywhere in the membership config", () => {
    const forbiddenKey = /price|cost|amount|currency|billing|trial|discount|sku|product_?id/i;
    const walk = (value, path) => {
      if (value && typeof value === "object") {
        for (const [k, v] of Object.entries(value)) {
          assert.ok(!forbiddenKey.test(k), `forbidden key ${path}.${k}`);
          walk(v, `${path}.${k}`);
        }
      }
    };
    walk(TIERS, "TIERS");
    const dir = new URL("../src/membership/", import.meta.url);
    for (const file of readdirSync(dir)) {
      const src = readFileSync(new URL(file, dir), "utf8");
      assert.ok(!/\$\s?\d|\d\s?(?:usd|dollars)|\/\s?(?:mo|month|yr|year)\b/i.test(src), `${file} must not contain prices`);
      assert.ok(!/stripe|revenuecat|in-?app purchase|purchaseAsync|checkout\(/i.test(src), `${file} must not reference payments`);
    }
  });
});

describe("entitlements", () => {
  it("Free has no premium entitlements but every free feature", () => {
    assert.deepEqual(resolveEntitlements("FREE"), []);
    for (const f of FREE_FEATURES) assert.equal(hasEntitlement("FREE", f), true, f);
    for (const f of PRO_FEATURES) assert.equal(hasEntitlement("FREE", f), false, f);
  });

  it("keeps social, community and safety tools free on every tier", () => {
    for (const tier of MEMBERSHIP_TIERS) for (const f of FREE_FEATURES) assert.equal(hasEntitlement(tier, f), true, `${tier}:${f}`);
    for (const required of ["posting", "comments", "follows", "challenges", "reporting", "blocking", "guardian_safety"]) assert.ok(FREE_FEATURES.includes(required), required);
  });

  it("GYMVERSE Pro has exactly the Pro features", () => {
    assert.deepEqual(new Set(resolveEntitlements("GYMVERSE_PRO")), new Set(PRO_FEATURES));
    assert.equal(hasEntitlement("GYMVERSE_PRO", "creator_analytics"), false);
    assert.equal(hasEntitlement("GYMVERSE_PRO", "coach_business_dashboard"), false);
  });

  it("Creator Pro inherits Pro and adds creator features only", () => {
    const got = new Set(resolveEntitlements("CREATOR_PRO"));
    assert.deepEqual(got, new Set([...PRO_FEATURES, ...CREATOR_FEATURES]));
    assert.equal(hasEntitlement("CREATOR_PRO", "testimonials"), false);
  });

  it("Coach Pro inherits Pro and adds coach features only", () => {
    const got = new Set(resolveEntitlements("COACH_PRO"));
    assert.deepEqual(got, new Set([...PRO_FEATURES, ...COACH_FEATURES]));
    assert.equal(hasEntitlement("COACH_PRO", "pinned_posts"), false);
  });

  it("feature lists match the Phase 1 specification counts", () => {
    assert.equal(PRO_FEATURES.length, 11); // Phase 6 added pro_deals_preview
    assert.equal(CREATOR_FEATURES.length, 8); // Phase 4 added advanced_comment_filters
    assert.equal(COACH_FEATURES.length, 11); // Phase 5 added programs, transformation showcase, coach profile
    const all = [...FREE_FEATURES, ...PRO_FEATURES, ...CREATOR_FEATURES, ...COACH_FEATURES];
    assert.equal(new Set(all).size, all.length, "feature ids must be unique");
  });

  it("inheritance is configurable (hierarchy changes take effect without code changes)", () => {
    const saved = TIER_INHERITS.COACH_PRO;
    try {
      TIER_INHERITS.COACH_PRO = ["CREATOR_PRO"];
      assert.equal(hasEntitlement("COACH_PRO", "pinned_posts"), true);
      assert.equal(hasEntitlement("COACH_PRO", "pr_history_charts"), true);
    } finally {
      TIER_INHERITS.COACH_PRO = saved;
    }
  });

  it("survives an accidental inheritance cycle", () => {
    const savedPro = TIER_INHERITS.GYMVERSE_PRO;
    try {
      TIER_INHERITS.GYMVERSE_PRO = ["CREATOR_PRO"];
      assert.ok(resolveEntitlements("CREATOR_PRO").length > 0);
    } finally {
      TIER_INHERITS.GYMVERSE_PRO = savedPro;
    }
  });
});

describe("sponsor configuration", () => {
  it("uses ~1 per 8–12 organic posts on Free and ~1 per 20–25 on premium tiers", () => {
    assert.deepEqual([SPONSOR_PROFILES.standard.minOrganic, SPONSOR_PROFILES.standard.maxOrganic], [8, 12]);
    assert.deepEqual([SPONSOR_PROFILES.reduced.minOrganic, SPONSOR_PROFILES.reduced.maxOrganic], [20, 25]);
    assert.equal(TIERS.FREE.sponsorProfile, "standard");
    for (const t of ["GYMVERSE_PRO", "CREATOR_PRO", "COACH_PRO"]) assert.equal(TIERS[t].sponsorProfile, "reduced");
  });

  it("keeps the reduced-sponsor entitlement consistent with the sponsor profile", () => {
    for (const t of MEMBERSHIP_TIERS) assert.equal(hasEntitlement(t, "reduced_sponsored_feed"), TIERS[t].sponsorProfile === "reduced", t);
  });

  it("exposes brand campaigns only to Creator Pro and partnerships only to Coach Pro", () => {
    assert.deepEqual(SPONSOR_OPPORTUNITIES.CREATOR_PRO, ["brand_campaigns"]);
    assert.deepEqual(SPONSOR_OPPORTUNITIES.COACH_PRO, ["coaching_partnerships"]);
    assert.deepEqual(SPONSOR_OPPORTUNITIES.FREE, []);
    assert.deepEqual(SPONSOR_OPPORTUNITIES.GYMVERSE_PRO, []);
  });

  it("sponsorGap stays within range and is deterministic", () => {
    for (const p of Object.values(SPONSOR_PROFILES)) {
      for (let seed = 0; seed < 500; seed++) {
        const g = sponsorGap(p, seed);
        assert.ok(g >= p.minOrganic && g <= p.maxOrganic, `${p.id} seed ${seed} -> ${g}`);
        assert.equal(g, sponsorGap(p, seed));
      }
    }
  });
});

describe("Phase 2: Premium Coming Soon content", () => {
  it("uses the required headings and banner", () => {
    assert.equal(PREMIUM_COPY.heading, "UNLOCK YOUR GYMVERSE POTENTIAL");
    assert.equal(PREMIUM_COPY.subtitle, "More tools. More progress. More opportunities.");
    assert.equal(PREMIUM_COPY.banner, "MEMBERSHIPS COMING SOON");
    assert.equal(PREMIUM_COPY.inDevelopment, "Coming Soon — Features in Development");
    assert.equal(PREMIUM_COPY.comparisonTitle, "Which plan is right for you?");
    assert.equal(PREMIUM_COPY.comparisonSummary, "Creator Pro helps you grow attention. Coach Pro helps you turn attention into clients.");
    assert.equal(PREMIUM_COPY.comparisonGuide, "If you mainly post content, choose Creator Pro. If you sell coaching or training services, choose Coach Pro.");
    assert.equal(PREMIUM_COPY.sponsorHeadline, "Fewer interruptions. Better fitness offers.");
    assert.equal(PREMIUM_COPY.sponsorBody, "GYMVERSE Pro reduces repetitive sponsored posts while still showing relevant fitness deals, challenge sponsors, and brand opportunities that support the community.");
  });

  it("shows the three plans, in order, each Coming Soon with the exact copy", () => {
    assert.deepEqual(PREMIUM_PLANS.map((p) => [p.name, p.availability, p.ctaLabel, p.tagline]), [
      ["GYMVERSE PRO", "COMING SOON", "Explore GYMVERSE Pro", "Train harder. Track deeper. Stay consistent."],
      ["CREATOR PRO", "COMING SOON", "Explore Creator Pro", "Grow your fitness audience."],
      ["COACH PRO", "COMING SOON", "Explore Coach Pro", "Turn your content into clients."],
    ]);
    assert.deepEqual(PREMIUM_PLANS.map((p) => p.theme), ["gold", "ember", "coach"]);
  });

  it("lists the specified features for each plan", () => {
    const titles = (id) => PREMIUM_PLANS.find((p) => p.id === id).features.map((f) => f.title);
    assert.deepEqual(titles("GYMVERSE_PRO"), ["Advanced progress tracking", "PR history charts", "Workout streak analytics", "Consistency score", "Private progress timeline", "Transformation comparison", "Premium challenges", "Premium profile customization", "Reduced sponsored feed frequency"]);
    assert.deepEqual(titles("CREATOR_PRO"), ["Creator analytics", "Audience insights", "Post performance tracking", "Scheduled content preview", "Pinned posts", "Creator profile tools", "Brand campaign opportunities", "Reduced sponsored feed frequency"]);
    assert.deepEqual(titles("COACH_PRO"), ["Lead dashboard", "Client inquiry tools", "Booking/contact form previews", "Transformation showcase", "Testimonials", "Coaching service links", "Coaching challenge tools", "Coach partnership opportunities", "Reduced sponsored feed frequency"]);
  });

  it("only advertises features the plan's entitlements actually grant", () => {
    for (const plan of PREMIUM_PLANS) for (const f of plan.features) assert.equal(hasEntitlement(plan.id, f.entitlement), true, `${plan.id}: ${f.title} -> ${f.entitlement}`);
  });

  it("keeps the comparison table as specified", () => {
    assert.deepEqual(PLAN_COMPARISON.map((r) => [r.name, r.goal, r.bestFor, r.mainTools]), [
      ["GYMVERSE Pro", "Improve fitness progress", "Everyday lifters", "Progress tracking, PR charts, premium challenges"],
      ["Creator Pro", "Grow an audience organically", "Fitness creators", "Analytics, content strategy, brand campaign previews"],
      ["Coach Pro", "Attract and manage potential clients", "Trainers and fitness businesses", "Leads, inquiries, booking, testimonials"],
    ]);
  });

  it("makes no forbidden promises", () => {
    const all = JSON.stringify({ PREMIUM_COPY, PREMIUM_PLANS, PLAN_COMPARISON }).toLowerCase();
    for (const bad of ["ad-free", "no ads", "no sponsored", "eliminat", "guaranteed followers", "guaranteed views", "boosted reach", "verified coach", "certified by gymverse"]) assert.ok(!all.includes(bad), bad);
    const creator = PREMIUM_PLANS.find((p) => p.id === "CREATOR_PRO");
    assert.match(creator.note, /does not boost/i);
    assert.match(creator.note, /guarantee followers or views/i);
    const coach = PREMIUM_PLANS.find((p) => p.id === "COACH_PRO");
    assert.match(coach.note, /does not verify coaching credentials/i);
    assert.match(PREMIUM_COPY.sponsorFootnote, /still appear/i);
  });

  it("has no purchase, billing or pricing interactions in the Premium UI", () => {
    const src = readFileSync(new URL("../src/membership/PremiumScreen.tsx", import.meta.url), "utf8");
    for (const bad of [/\bbuy\b/i, /subscribe/i, /purchase\(/i, /checkout/i, /start (?:free )?trial/i, /per month|per year|monthly|yearly|annual/i, /setDemoTier|useMembership/]) assert.ok(!bad.test(src), String(bad));
  });
});
