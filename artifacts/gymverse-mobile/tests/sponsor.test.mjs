// Phase 6 — sponsored content, Pro Deals, sponsored challenges. Run: npm run test:membership
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { describe, it } from "node:test";
import { COACH_FEATURES, CREATOR_FEATURES, PRO_FEATURES, hasEntitlement } from "../src/membership/entitlements.ts";
import { SPONSOR_PROFILES, sponsorGap } from "../src/membership/sponsors.ts";
import { MEMBERSHIP_TIERS, TIERS } from "../src/membership/tiers.ts";
import {
  DEMO_FILLER_PREFIX,
  PRO_DEALS,
  REPORT_REASONS,
  SPONSORED_CHALLENGES,
  SPONSOR_BRANDS,
  SPONSOR_CAMPAIGNS,
  SPONSOR_COPY,
  SPONSOR_FEATURE_INFO,
  SPONSOR_ID_PREFIX,
  SPONSOR_LABEL,
  brandById,
  composeFeed,
  createSponsorReport,
  demoFillerPosts,
  filterDeals,
  hideCampaign,
  hideDeal,
  whyAmISeeingThis,
} from "../src/sponsors/sponsorData.ts";
import { CAMPAIGNS as CREATOR_CAMPAIGNS } from "../src/creator/creatorData.ts";
import { PARTNERSHIPS } from "../src/coach/coachData.ts";

const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const sponsorFiles = readdirSync(new URL("../src/sponsors/", import.meta.url)).map((f) => [f, src(`src/sponsors/${f}`)]);
const gapFor = (tier) => (slot) => sponsorGap(SPONSOR_PROFILES[TIERS[tier].sponsorProfile], slot);
const organic = (n) => Array.from({ length: n }, (_, i) => ({ id: `post-${i + 1}`, likes: i * 3, comments: i, saves: i * 2 }));
const sponsoredOf = (items) => items.filter((i) => i.kind === "sponsored");
const organicOf = (items) => items.filter((i) => i.kind === "organic").map((i) => i.post);
function gapsBetween(items) {
  const out = [];
  let count = 0;
  for (const i of items) {
    if (i.kind === "organic") count++;
    else { out.push(count); count = 0; }
  }
  return out;
}

describe("sponsor frequency", () => {
  it("Free uses 1 per 8–12 organic posts; every premium tier uses 1 per 20–25", () => {
    assert.equal(TIERS.FREE.sponsorProfile, "standard");
    for (const t of ["GYMVERSE_PRO", "CREATOR_PRO", "COACH_PRO"]) assert.equal(TIERS[t].sponsorProfile, "reduced");
    const free = gapsBetween(composeFeed(organic(200), gapFor("FREE")));
    assert.ok(free.length >= 15);
    assert.ok(free.every((g) => g >= 8 && g <= 12), `free gaps ${free}`);
    for (const t of ["GYMVERSE_PRO", "CREATOR_PRO", "COACH_PRO"]) {
      const g = gapsBetween(composeFeed(organic(200), gapFor(t)));
      assert.ok(g.length >= 7 && g.every((x) => x >= 20 && x <= 25), `${t} gaps ${g}`);
    }
  });
  it("switching tiers changes how many sponsored posts appear", () => {
    const free = sponsoredOf(composeFeed(organic(66), gapFor("FREE"))).length;
    const pro = sponsoredOf(composeFeed(organic(66), gapFor("GYMVERSE_PRO"))).length;
    assert.ok(free > pro && pro > 0, `free ${free} pro ${pro}`);
  });
  it("placement is deterministic", () => {
    const a = composeFeed(organic(80), gapFor("FREE")).map((i) => i.key);
    const b = composeFeed(organic(80), gapFor("FREE")).map((i) => i.key);
    assert.deepEqual(a, b);
  });
  it("a too-short feed shows no sponsored post rather than padding it", () => {
    const items = composeFeed(organic(6), gapFor("FREE"));
    assert.equal(sponsoredOf(items).length, 0);
    assert.equal(items.length, 6);
    assert.deepEqual(composeFeed(organic(6), null).map((i) => i.key), organic(6).map((p) => p.id));
  });
});

describe("feed composition", () => {
  const posts = organic(100);
  const snapshot = JSON.stringify(posts);
  const items = composeFeed(posts, gapFor("FREE"));
  it("keeps organic posts in their original order, unchanged and unmutated", () => {
    assert.deepEqual(organicOf(items).map((p) => p.id), posts.map((p) => p.id));
    assert.ok(organicOf(items).every((p, i) => p === posts[i]), "same objects, no copies with altered counts");
    assert.equal(JSON.stringify(posts), snapshot, "input not mutated");
  });
  it("sponsored ids are stable, unique and can't collide with organic ids", () => {
    const ids = sponsoredOf(items).map((i) => i.key);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(ids.every((id) => id.startsWith(SPONSOR_ID_PREFIX)));
    const organicIds = new Set(posts.map((p) => p.id));
    assert.ok(ids.every((id) => !organicIds.has(id)));
    assert.deepEqual(sponsoredOf(composeFeed(posts, gapFor("FREE"))).map((i) => i.key), ids);
  });
  it("never places sponsored posts back to back, first or last", () => {
    for (const t of MEMBERSHIP_TIERS) {
      const list = composeFeed(organic(120), gapFor(t));
      assert.equal(list[0].kind, "organic");
      assert.equal(list.at(-1).kind, "organic");
      for (let i = 1; i < list.length; i++) assert.ok(!(list[i].kind === "sponsored" && list[i - 1].kind === "sponsored"), `${t} at ${i}`);
    }
  });
  it("sponsored items carry an explicit classification and no engagement fields", () => {
    for (const s of sponsoredOf(items)) {
      assert.equal(s.placement.kind, "sponsored");
      assert.equal(s.placement.campaign.fictional, true);
      for (const k of ["likes", "comments", "saves", "username", "post"]) assert.ok(!(k in s.placement), k);
    }
  });
  it("rotates campaigns so no single campaign fills every slot", () => {
    const camp = sponsoredOf(items).map((s) => s.placement.campaign.id);
    assert.equal(new Set(camp).size, SPONSOR_CAMPAIGNS.length);
    for (let i = 1; i < camp.length; i++) assert.notEqual(camp[i], camp[i - 1]);
  });
});

describe("hiding sponsored posts", () => {
  const posts = organic(100);
  const before = composeFeed(posts, gapFor("FREE"));
  const hidden = hideCampaign([], "c-replock");
  const after = composeFeed(posts, gapFor("FREE"), hidden);
  it("hides the campaign and leaves organic posts untouched", () => {
    assert.ok(!sponsoredOf(after).some((s) => s.placement.campaign.id === "c-replock"));
    assert.deepEqual(organicOf(after).map((p) => p.id), posts.map((p) => p.id));
  });
  it("does not immediately replace the hidden slot with another sponsor", () => {
    const removed = sponsoredOf(before).filter((s) => s.placement.campaign.id === "c-replock");
    assert.ok(removed.length > 0);
    assert.equal(sponsoredOf(after).length, sponsoredOf(before).length - removed.length);
    const keep = sponsoredOf(before).filter((s) => s.placement.campaign.id !== "c-replock").map((s) => s.key);
    assert.deepEqual(sponsoredOf(after).map((s) => s.key), keep, "other placements keep their ids and positions");
  });
  it("stays hidden across tier switches (hidden state is independent of the tier)", () => {
    for (const t of MEMBERSHIP_TIERS) assert.ok(!sponsoredOf(composeFeed(posts, gapFor(t), hidden)).some((s) => s.placement.campaign.id === "c-replock"), t);
    const app = src("App.tsx");
    assert.match(app, /const \[hiddenSponsorCampaigns, setHiddenSponsorCampaigns\] = useState<string\[\]>\(\[\]\)/);
    assert.doesNotMatch(src("src/membership/MembershipContext.tsx"), /hiddenSponsor|sponsorSheet/);
  });
  it("hiding everything shows no sponsored posts", () => {
    const all = SPONSOR_CAMPAIGNS.reduce((h, c) => hideCampaign(h, c.id), []);
    assert.equal(sponsoredOf(composeFeed(posts, gapFor("FREE"), all)).length, 0);
    assert.deepEqual(hideCampaign(all, "c-replock"), all, "no duplicates");
    assert.deepEqual(hideCampaign([], "unknown"), []);
  });
});

describe("disclosure, explanations and reports", () => {
  it("labels every sponsored card SPONSORED and every brand as fictional", () => {
    assert.equal(SPONSOR_LABEL, "SPONSORED");
    assert.ok(SPONSOR_BRANDS.every((b) => b.fictional));
    const reel = src("src/sponsors/SponsoredReel.tsx");
    assert.match(reel, /<SponsoredLabel large \/>/);
    assert.match(reel, /<DemoBrandTag \/>/);
    assert.doesNotMatch(reel, /onLike|onSave|onComment|onShare|onFollow|Avatar/, "no member-post affordances or engagement");
  });
  it("campaign catalog matches the spec and has complete detail data", () => {
    assert.deepEqual(SPONSOR_CAMPAIGNS.map((c) => [brandById(c.brandId).name, c.headline, c.cta]), [
      ["IRONFORGE APPAREL", "BUILT FOR THE WORK", "Explore Apparel"],
      ["REPLOCK EQUIPMENT", "EVERY REP COUNTS", "Explore Gear"],
      ["SUMMIT RECOVERY", "RECOVER. REBUILD. REPEAT.", "Explore Recovery"],
      ["FORGE FUEL", "FUEL YOUR ROUTINE", "Explore Fitness Offers"],
    ]);
    for (const c of SPONSOR_CAMPAIGNS) for (const k of ["description", "concept", "exampleOffer", "offerPreview", "category"]) assert.ok(c[k], `${c.id}.${k}`);
  });
  it("makes no prices, savings, medical, supplement or body-change claims", () => {
    const text = JSON.stringify([SPONSOR_CAMPAIGNS, PRO_DEALS, SPONSORED_CHALLENGES]);
    assert.doesNotMatch(text, /\$\d|\d+\s?%|promo code|coupon|\bsave \d|expires|guarantee|muscle growth|burn fat|lose weight|cure|clinically|steroid|sarm/i);
  });
  it("explains why an ad appears without claiming personal targeting", () => {
    const free = whyAmISeeingThis(false);
    const premium = whyAmISeeingThis(true);
    assert.equal(free[0], "This is a fictional sponsored post shown as part of the GYMX advertising demo. Your membership determines the approximate number of sponsored posts you see.");
    assert.ok(premium.includes("Premium memberships reduce repetitive sponsored feed placements while keeping relevant fitness offers available."));
    assert.ok(!free.includes(SPONSOR_COPY.whyPremium));
    assert.match(SPONSOR_COPY.noTargeting, /isn't based on your interests/);
  });
  it("local reports keep the sponsored classification and are never submitted", () => {
    const p = sponsoredOf(composeFeed(organic(30), gapFor("FREE")))[0].placement;
    const r = createSponsorReport(p, REPORT_REASONS[0], "r1");
    assert.deepEqual([r.sponsored, r.submitted, r.placementId, r.campaignId], [true, false, p.id, p.campaign.id]);
    assert.equal(createSponsorReport(p, "made-up reason", "r2"), null);
    assert.match(SPONSOR_COPY.reportSaved, /on this device only\. Nothing was sent/);
  });
});

describe("Pro Deals", () => {
  it("filters by category and hides offers locally", () => {
    assert.equal(filterDeals(PRO_DEALS, "all").length, PRO_DEALS.length);
    assert.deepEqual(filterDeals(PRO_DEALS, "accessories").map((d) => d.id), ["deal-replock", "deal-replock-home"]);
    for (const c of ["apparel", "accessories", "recovery", "education", "gym"]) assert.ok(filterDeals(PRO_DEALS, c).length >= 1, c);
    const hidden = hideDeal([], "deal-replock");
    assert.deepEqual(filterDeals(PRO_DEALS, "accessories", hidden).map((d) => d.id), ["deal-replock-home"]);
    assert.deepEqual(hideDeal(hidden, "deal-replock"), hidden);
    assert.ok(PRO_DEALS.every((d) => d.fictional));
    for (const t of ["IRONFORGE TRAINING COLLECTION", "REPLOCK TRAINING ESSENTIALS", "SUMMIT RECOVERY PICKS"]) assert.ok(PRO_DEALS.some((d) => d.title === t), t);
  });
  it("is gated by the central entitlement: premium tiers yes, Free no", () => {
    assert.ok(PRO_FEATURES.includes("pro_deals_preview"));
    assert.ok(SPONSOR_FEATURE_INFO.pro_deals_preview.body);
    assert.equal(hasEntitlement("FREE", "pro_deals_preview"), false);
    for (const t of ["GYMVERSE_PRO", "CREATOR_PRO", "COACH_PRO"]) assert.equal(hasEntitlement(t, "pro_deals_preview"), true, t);
    assert.match(src("src/sponsors/ProDealsScreen.tsx"), /<ProSection feature="pro_deals_preview"/);
  });
  it("has the required title and subtitle", () => {
    assert.equal(SPONSOR_COPY.dealsTitle, "GYMX PRO DEALS");
    assert.equal(SPONSOR_COPY.dealsSubtitle, "Fitness offers worth checking out.");
  });
});

describe("sponsored challenges", () => {
  it("shows the three fictional examples with sponsor labels and the reward disclaimer", () => {
    assert.deepEqual(SPONSORED_CHALLENGES.map((c) => [c.title, brandById(c.brandId).name]), [
      ["30-DAY STRENGTH CHALLENGE", "REPLOCK EQUIPMENT"],
      ["DISCIPLINE MODE", "IRONFORGE APPAREL"],
      ["BEGINNER GYM CONFIDENCE", "SUMMIT RECOVERY"],
    ]);
    assert.equal(SPONSOR_COPY.challengeRewards, "Premium challenge rewards may be sponsored by fitness brands.");
    assert.ok(SPONSORED_CHALLENGES.every((c) => /Not a real prize/.test(c.rewardConcept)));
    assert.match(src("src/sponsors/SponsoredChallenges.tsx"), /<SponsoredLabel \/>/);
  });
  it("leaves existing free challenges in place", () => {
    const ch = src("src/screens/Challenges.tsx");
    assert.match(ch, /CHALLENGES\.map/);
    // Phase 7 merged sponsored challenges into the premium challenge cards (same Phase 6 sponsor strip);
    // the standalone Phase 6 section still lives on the Pro Deals screen.
    assert.match(ch, /<PremiumChallengesSection /);
    assert.match(src("src/challenges/PremiumChallengesSection.tsx"), /<ChallengeSponsorStrip brandId=\{sponsor\.brandId\} \/>/);
    assert.match(src("src/sponsors/ProDealsScreen.tsx"), /<SponsoredChallengesSection \/>/);
  });
});

describe("Creator and Coach integration", () => {
  it("keeps the three Creator campaigns and three Coach partnerships", () => {
    assert.equal(CREATOR_CAMPAIGNS.length, 3);
    assert.deepEqual(PARTNERSHIPS.map((p) => p.title), ["Featured Coach Challenge Sponsor", "Local Gym Partnership Lead", "Nutrition Coaching Brand Collaboration"]);
  });
  it("seeing sponsored posts never unlocks campaigns or partnerships", () => {
    for (const t of ["FREE", "GYMVERSE_PRO", "COACH_PRO"]) assert.equal(hasEntitlement(t, "brand_campaign_marketplace_preview"), false, t);
    for (const t of ["FREE", "GYMVERSE_PRO", "CREATOR_PRO"]) assert.equal(hasEntitlement(t, "coach_partnership_opportunities"), false, t);
    assert.ok(CREATOR_FEATURES.includes("brand_campaign_marketplace_preview") && COACH_FEATURES.includes("coach_partnership_opportunities"));
    const app = src("App.tsx");
    assert.match(app, /canBrandCampaigns=\{membership\.can\("brand_campaign_marketplace_preview"\)\}/);
    assert.match(app, /canCoachPartnerships=\{membership\.can\("coach_partnership_opportunities"\)\}/);
  });
});

describe("safety, privacy and isolation", () => {
  it("no ad networks, payments, tracking or network calls in src/sponsors", () => {
    for (const [f, t] of sponsorFiles) {
      assert.doesNotMatch(t, /fetch\(|XMLHttpRequest|axios|admob|googleads|facebook|meta ads|advertisingId|getAdvertisingId|expo-tracking|stripe|revenuecat|checkout|purchase\(|Linking\.openURL|AsyncStorage|SecureStore/i, f);
    }
  });
  it("Feed composes sponsors without touching the posts state or membership code", () => {
    const feed = src("src/screens/Feed.tsx");
    assert.match(feed, /composeFeed\(visible, sponsorGapAt, hiddenSponsorCampaigns\)/);
    assert.doesNotMatch(feed, /membership|creator|pinnedOrder/i);
    const app = src("App.tsx");
    assert.doesNotMatch(app, /setPosts\([^)]*DEMO_FILLER/, "demo filler never enters posts state");
    assert.match(app, /__DEV__ && extendedDemoFeed \? \[\.\.\.posts, \.\.\.DEMO_FILLER\] : posts/);
  });
  it("dev filler posts are clearly labelled and distinct", () => {
    const filler = demoFillerPosts([{ id: "a", username: "u", name: "n", caption: "c", hashtags: [] }], 3);
    assert.deepEqual(filler.map((p) => p.id), [`${DEMO_FILLER_PREFIX}1`, `${DEMO_FILLER_PREFIX}2`, `${DEMO_FILLER_PREFIX}3`]);
    assert.ok(filler.every((p) => /development only/.test(p.caption) && p.name === "Demo feed filler"));
  });
  it("Guardian moderation and reporting stay in place and free", () => {
    const app = src("App.tsx");
    assert.match(app, /import \{ moderate \} from "\.\/src\/guardian"/);
    for (const t of MEMBERSHIP_TIERS) for (const f of ["reporting", "blocking", "guardian_safety"]) assert.equal(hasEntitlement(t, f), true, `${t} ${f}`);
  });
  it("developer sponsor controls live inside the existing dev switcher only", () => {
    assert.match(src("src/sponsors/SponsorDevPanel.tsx"), /if \(!__DEV__\) return null;/);
    assert.match(src("App.tsx"), /<DevMembershipSwitcher[\s\S]*?extra=\{[\s\S]*?<SponsorDevPanel/);
  });
  it("Premium links to Pro Deals and never promises zero sponsored posts", () => {
    assert.match(src("src/membership/PremiumScreen.tsx"), /Preview Pro Deals/);
    assert.match(SPONSOR_COPY.whyPremium, /reduce/);
    assert.doesNotMatch(JSON.stringify(SPONSOR_COPY), /ad-free|no ads|no sponsored/i);
  });
});
