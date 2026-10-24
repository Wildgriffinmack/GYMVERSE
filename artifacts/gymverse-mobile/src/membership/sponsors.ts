/**
 * Sponsored-content frequency configuration (prototype).
 *
 * Frequencies are approximate demonstration values: one sponsored post per N organic posts,
 * where N is picked deterministically in [minOrganic, maxOrganic]. The Home Feed uses these via
 * `composeFeed` in src/sponsors/sponsorData.ts (Phase 6).
 */
import type { MembershipTier } from "./tiers";

export type SponsorProfileId = "standard" | "reduced";

export interface SponsorProfile {
  id: SponsorProfileId;
  /** Organic posts shown between sponsored posts (inclusive range). */
  minOrganic: number;
  maxOrganic: number;
  description: string;
}

export const SPONSOR_PROFILES: Record<SponsorProfileId, SponsorProfile> = {
  standard: { id: "standard", minOrganic: 8, maxOrganic: 12, description: "About 1 sponsored post per 8–12 organic posts" },
  reduced: { id: "reduced", minOrganic: 20, maxOrganic: 25, description: "About 1 sponsored post per 20–25 organic posts" },
};

/** Opportunity types per tier (rendered in Creator Studio and the Coach Command Center). */
export type OpportunityKind = "brand_campaigns" | "coaching_partnerships";

export const SPONSOR_OPPORTUNITIES: Record<MembershipTier, readonly OpportunityKind[]> = {
  FREE: [],
  GYMVERSE_PRO: [],
  CREATOR_PRO: ["brand_campaigns"],
  COACH_PRO: ["coaching_partnerships"],
};

/**
 * Deterministic gap for a given feed slot, so the feed renders the same layout each time.
 */
export function sponsorGap(profile: SponsorProfile, seed: number): number {
  const span = profile.maxOrganic - profile.minOrganic + 1;
  const n = Math.imul(seed ^ 0x9e3779b9, 2654435761) >>> 0;
  return profile.minOrganic + (n % span);
}
