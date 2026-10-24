/**
 * Sponsored content — DEMONSTRATION DATA (Phase 6).
 *
 * Fictional brands, campaigns, deals and sponsored-challenge examples, plus the pure feed-composition
 * logic. No ad network, auction, targeting, tracking or advertising identifier exists anywhere in the
 * app: placement depends only on the membership's sponsor frequency and the slot number.
 * Pure module (type-only imports) so it can be unit-tested with plain Node.
 */
import type { PremiumFeature } from "../membership/entitlements";

export const SPONSOR_LABEL = "SPONSORED";
export const DEMO_BRAND_LABEL = "FICTIONAL DEMO BRAND";

export const SPONSOR_COPY = {
  disclaimer:
    "Fictional sponsor for demonstration. This brand doesn't exist, isn't a GYMVERSE partner, and nothing can be bought, claimed or ordered here.",
  why: "This is a fictional sponsored post shown as part of the GYMVERSE advertising demo. Your membership determines the approximate number of sponsored posts you see.",
  whyPremium: "Premium memberships reduce repetitive sponsored feed placements while keeping relevant fitness offers available.",
  noTargeting: "It isn't based on your interests, activity, browsing history, location or any advertising identifier.",
  hidden: "Sponsored post hidden for this session. It won't be replaced right away.",
  reportSaved: "Demo report saved on this device only. Nothing was sent to GYMVERSE, Guardian or the brand.",
  reportNote: "Reports on sponsored posts keep the sponsored label so reviewers know it's an ad. In this prototype nothing leaves your device.",
  challengeRewards: "Premium challenge rewards may be sponsored by fitness brands.",
  challengeNote: "Fictional preview. There are no real prizes, winners, eligibility checks or shipping in this prototype, and free challenges stay free.",
  dealsTitle: "GYMVERSE PRO DEALS",
  dealsSubtitle: "Fitness offers worth checking out.",
  dealsDisclaimer: "Fictional prototype offers. No prices, discounts, promo codes, expiry dates or savings claims — and nothing can be bought.",
  seenIsNotEligible: "Seeing sponsored posts never makes you eligible for brand campaigns or partnerships.",
} as const;

// ── Brands & campaigns ──────────────────────────────────────────────────────
export type SponsorCategory = "apparel" | "accessories" | "recovery" | "education" | "gym";
export const SPONSOR_CATEGORIES: { id: SponsorCategory; label: string }[] = [
  { id: "apparel", label: "Gym apparel" },
  { id: "accessories", label: "Training accessories" },
  { id: "recovery", label: "Recovery equipment" },
  { id: "education", label: "Fitness education" },
  { id: "gym", label: "Gym partnerships" },
];
export function sponsorCategoryLabel(id: SponsorCategory): string {
  return SPONSOR_CATEGORIES.find((c) => c.id === id)!.label;
}

export type BrandIcon = "shirt" | "dumbbell" | "waves" | "book" | "building";
export type BrandTone = "ember" | "crimson" | "gold" | "iron";
export interface SponsorBrand {
  id: string;
  name: string;
  initials: string;
  category: SponsorCategory;
  icon: BrandIcon;
  tone: BrandTone;
  fictional: true;
}
export const SPONSOR_BRANDS: SponsorBrand[] = [
  { id: "ironforge", name: "IRONFORGE APPAREL", initials: "IF", category: "apparel", icon: "shirt", tone: "ember", fictional: true },
  { id: "replock", name: "REPLOCK EQUIPMENT", initials: "RL", category: "accessories", icon: "dumbbell", tone: "crimson", fictional: true },
  { id: "summit", name: "SUMMIT RECOVERY", initials: "SR", category: "recovery", icon: "waves", tone: "iron", fictional: true },
  { id: "forgefuel", name: "FORGE FUEL", initials: "FF", category: "education", icon: "book", tone: "gold", fictional: true },
  { id: "basecamp", name: "BASECAMP BARBELL CLUB", initials: "BB", category: "gym", icon: "building", tone: "iron", fictional: true },
];
export function brandById(id: string): SponsorBrand {
  return SPONSOR_BRANDS.find((b) => b.id === id)!;
}

export interface SponsorCampaign {
  id: string;
  brandId: string;
  headline: string;
  description: string;
  cta: string;
  category: SponsorCategory;
  offerPreview: string;
  concept: string;
  exampleOffer: string;
  fictional: true;
}
/** Feed rotation order. Slot k shows SPONSOR_CAMPAIGNS[k % length]. */
export const SPONSOR_CAMPAIGNS: SponsorCampaign[] = [
  {
    id: "c-ironforge", brandId: "ironforge", headline: "BUILT FOR THE WORK", description: "Training apparel designed for the work you put in.", cta: "Explore Apparel", category: "apparel",
    offerPreview: "Example: training collection preview",
    concept: "Training apparel shown in real gym sessions — squats, pulls and conditioning — rather than studio shoots.",
    exampleOffer: "A fictional training-collection showcase for lifters. No prices or discounts in this demo.", fictional: true,
  },
  {
    id: "c-replock", brandId: "replock", headline: "EVERY REP COUNTS", description: "Discover training accessories for your next workout.", cta: "Explore Gear", category: "accessories",
    offerPreview: "Example: accessory essentials preview",
    concept: "Everyday training accessories — straps, bands and chalk bags — presented around common workouts.",
    exampleOffer: "A fictional accessory essentials collection. Nothing can be bought here.", fictional: true,
  },
  {
    id: "c-summit", brandId: "summit", headline: "RECOVER. REBUILD. REPEAT.", description: "Explore recovery accessories for your training routine.", cta: "Explore Recovery", category: "recovery",
    offerPreview: "Example: recovery gear selection",
    concept: "Recovery accessories such as foam rollers and mobility bands as part of a regular routine. No medical or injury claims.",
    exampleOffer: "A fictional recovery-gear selection. Not medical advice and nothing can be ordered.", fictional: true,
  },
  {
    id: "c-forgefuel", brandId: "forgefuel", headline: "FUEL YOUR ROUTINE", description: "Explore general nutrition education and training-friendly meal ideas.", cta: "Explore Fitness Offers", category: "education",
    offerPreview: "Example: meal-idea guides",
    concept: "General nutrition education and simple meal ideas around training days. No supplement or body-change claims.",
    exampleOffer: "A fictional collection of general meal-idea guides. Not personalised or medical advice.", fictional: true,
  },
];
export function campaignById(id: string): SponsorCampaign | undefined {
  return SPONSOR_CAMPAIGNS.find((c) => c.id === id);
}

// ── Feed composition ────────────────────────────────────────────────────────
export interface SponsoredPlacement {
  kind: "sponsored";
  /** Stable id, never shared with organic posts. */
  id: string;
  slot: number;
  /** Number of organic posts shown before this placement. */
  afterOrganic: number;
  campaign: SponsorCampaign;
  brand: SponsorBrand;
}
export type FeedItem<P extends { id: string }> = { kind: "organic"; key: string; post: P } | { kind: "sponsored"; key: string; placement: SponsoredPlacement };

export const SPONSOR_ID_PREFIX = "sponsored:";
export function placementId(campaignId: string, slot: number): string {
  return `${SPONSOR_ID_PREFIX}${campaignId}:${slot}`;
}

/** Deterministic slot plan for a feed of `organicCount` posts (ignores hidden campaigns). */
export function sponsorSlots(organicCount: number, gapAt: (slot: number) => number): { slot: number; afterOrganic: number; campaignId: string }[] {
  const out: { slot: number; afterOrganic: number; campaignId: string }[] = [];
  let pos = 0;
  for (let slot = 0; slot < 1000; slot++) {
    pos += Math.max(1, Math.floor(gapAt(slot)));
    // Never last: an organic post always follows a sponsored one.
    if (pos >= organicCount) break;
    out.push({ slot, afterOrganic: pos, campaignId: SPONSOR_CAMPAIGNS[slot % SPONSOR_CAMPAIGNS.length].id });
  }
  return out;
}

/**
 * Builds the renderable feed. The organic array is never mutated or reordered; sponsored placements
 * are interleaved at deterministic positions. A slot whose campaign is hidden stays empty (no
 * replacement), so hidden campaigns never reappear and hiding everything shows no sponsored posts.
 */
export function composeFeed<P extends { id: string }>(organic: readonly P[], gapAt: ((slot: number) => number) | null, hiddenCampaignIds: readonly string[] = []): FeedItem<P>[] {
  const items: FeedItem<P>[] = [];
  const plan = gapAt ? sponsorSlots(organic.length, gapAt) : [];
  const hidden = new Set(hiddenCampaignIds);
  const byPos = new Map<number, SponsoredPlacement>();
  for (const s of plan) {
    if (hidden.has(s.campaignId)) continue;
    const campaign = campaignById(s.campaignId)!;
    byPos.set(s.afterOrganic, { kind: "sponsored", id: placementId(campaign.id, s.slot), slot: s.slot, afterOrganic: s.afterOrganic, campaign, brand: brandById(campaign.brandId) });
  }
  organic.forEach((post, i) => {
    items.push({ kind: "organic", key: post.id, post });
    const sp = byPos.get(i + 1);
    if (sp) items.push({ kind: "sponsored", key: sp.id, placement: sp });
  });
  return items;
}

export function hideCampaign(hidden: readonly string[], campaignId: string): string[] {
  return !campaignById(campaignId) || hidden.includes(campaignId) ? [...hidden] : [...hidden, campaignId];
}

export function whyAmISeeingThis(isPremium: boolean): string[] {
  return isPremium ? [SPONSOR_COPY.why, SPONSOR_COPY.whyPremium, SPONSOR_COPY.noTargeting] : [SPONSOR_COPY.why, SPONSOR_COPY.noTargeting];
}

// ── Local demo reports ──────────────────────────────────────────────────────
export const REPORT_REASONS = ["Misleading or exaggerated claim", "Unsafe product or advice", "Inappropriate content", "Not clearly labelled as sponsored", "Something else"];
export interface SponsorReport {
  id: string;
  placementId: string;
  campaignId: string;
  brandId: string;
  /** Always true: reports on ads keep their sponsored classification. */
  sponsored: true;
  reason: string;
  /** Local demo only — never submitted anywhere. */
  submitted: false;
}
export function createSponsorReport(p: SponsoredPlacement, reason: string, id: string): SponsorReport | null {
  if (!REPORT_REASONS.includes(reason)) return null;
  return { id, placementId: p.id, campaignId: p.campaign.id, brandId: p.brand.id, sponsored: true, reason, submitted: false };
}

// ── Pro Deals ───────────────────────────────────────────────────────────────
export interface ProDeal {
  id: string;
  brandId: string;
  title: string;
  description: string;
  category: SponsorCategory;
  highlights: string[];
  fictional: true;
}
export const PRO_DEALS: ProDeal[] = [
  { id: "deal-ironforge", brandId: "ironforge", title: "IRONFORGE TRAINING COLLECTION", description: "Explore an example premium apparel collection.", category: "apparel", highlights: ["Example training tops and shorts", "Shown in real gym sessions", "Collection preview only"], fictional: true },
  { id: "deal-replock", brandId: "replock", title: "REPLOCK TRAINING ESSENTIALS", description: "Discover fictional training accessory bundles.", category: "accessories", highlights: ["Lifting straps, bands and chalk bag", "Grouped by common workouts", "Bundle preview only"], fictional: true },
  { id: "deal-replock-home", brandId: "replock", title: "REPLOCK HOME SETUP IDEAS", description: "Example accessory ideas for training at home.", category: "accessories", highlights: ["Small-space training ideas", "Beginner-friendly accessories", "Ideas preview only"], fictional: true },
  { id: "deal-summit", brandId: "summit", title: "SUMMIT RECOVERY PICKS", description: "Browse example recovery gear selections.", category: "recovery", highlights: ["Foam rollers and mobility bands", "Fits into a regular routine", "No medical or injury claims"], fictional: true },
  { id: "deal-forgefuel", brandId: "forgefuel", title: "FORGE FUEL MEAL IDEAS", description: "General nutrition education and training-friendly meal ideas.", category: "education", highlights: ["Simple meal ideas around training", "General education, not personalised advice", "No supplement claims"], fictional: true },
  { id: "deal-basecamp", brandId: "basecamp", title: "BASECAMP PARTNER GYM SPOTLIGHT", description: "A fictional partner-gym spotlight for the community.", category: "gym", highlights: ["Example gym tour and community nights", "Beginner workshops concept", "Spotlight preview only"], fictional: true },
];
export type DealFilter = SponsorCategory | "all";
export function filterDeals(deals: readonly ProDeal[], category: DealFilter, hiddenIds: readonly string[] = []): ProDeal[] {
  return deals.filter((d) => (category === "all" || d.category === category) && !hiddenIds.includes(d.id));
}
export function hideDeal(hidden: readonly string[], id: string): string[] {
  return !PRO_DEALS.some((d) => d.id === id) || hidden.includes(id) ? [...hidden] : [...hidden, id];
}

// ── Sponsored challenge previews ────────────────────────────────────────────
export interface SponsoredChallenge {
  id: string;
  title: string;
  brandId: string;
  duration: string;
  focus: string;
  rewardConcept: string;
  fictional: true;
}
export const SPONSORED_CHALLENGES: SponsoredChallenge[] = [
  { id: "sch-strength", title: "30-DAY STRENGTH CHALLENGE", brandId: "replock", duration: "30 days", focus: "Three progressive strength sessions a week", rewardConcept: "Example concept: a sponsor-themed badge. Not a real prize.", fictional: true },
  { id: "sch-discipline", title: "DISCIPLINE MODE", brandId: "ironforge", duration: "21 days", focus: "Show up on your planned training days", rewardConcept: "Example concept: a profile banner theme. Not a real prize.", fictional: true },
  { id: "sch-beginner", title: "BEGINNER GYM CONFIDENCE", brandId: "summit", duration: "14 days", focus: "Learn gym basics and a simple routine", rewardConcept: "Example concept: a recovery-routine guide. Not a real prize.", fictional: true },
];

// ── Locked explanation ──────────────────────────────────────────────────────
export const SPONSOR_FEATURE_INFO: Partial<Record<PremiumFeature, { title: string; body: string }>> = {
  pro_deals_preview: { title: "Pro Deals", body: "A curated catalog of fitness offers from brands, organised by category. This preview has no prices, codes or savings claims." },
};

// ── Development-only extended feed ──────────────────────────────────────────
export const DEMO_FILLER_COUNT = 60;
export const DEMO_FILLER_PREFIX = "demo-fill-";
/**
 * Placeholder organic posts for the developer "extended demo feed" only, so sponsor frequency can be
 * seen with a realistic feed length. Clearly labelled; never added to the real posts state.
 */
export function demoFillerPosts<P extends { id: string; username: string; name: string; caption: string; hashtags: string[] }>(templates: readonly P[], count = DEMO_FILLER_COUNT): P[] {
  if (!templates.length) return [];
  return Array.from({ length: count }, (_, i) => {
    const t = templates[i % templates.length];
    return { ...t, id: `${DEMO_FILLER_PREFIX}${i + 1}`, username: "gymverse_demo_feed", name: "Demo feed filler", caption: `Extended demo feed · placeholder post ${i + 1} (development only)`, hashtags: ["#DemoFeed"], verified: false, created: false, onTimeline: false, moderation: undefined };
  });
}
