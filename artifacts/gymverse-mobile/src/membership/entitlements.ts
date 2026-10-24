/**
 * Centralized feature entitlements — PROTOTYPE.
 *
 * - FREE_FEATURES are never gated: social, community and safety tools stay free for everyone.
 * - Each tier lists its own features and which tiers it inherits from, so the hierarchy can change
 *   by editing TIER_INHERITS without touching screens.
 * Pure data + functions (type-only imports) so it can be unit-tested with plain Node.
 */
import type { MembershipTier } from "./tiers";

/** Core features that must remain free on every tier. Listed so they can never be gated by mistake. */
export const FREE_FEATURES = [
  "feed",
  "posting",
  "comments",
  "likes_saves_shares",
  "follows",
  "explore",
  "challenges",
  "progress_timeline",
  "personal_records",
  "profile",
  "reporting",
  "blocking",
  "guardian_safety",
] as const;

export const PRO_FEATURES = [
  "advanced_progress_tracking",
  "private_progress_timeline",
  "ai_weekly_checkin_preview",
  "premium_challenges",
  "premium_profile_customization",
  "pr_history_charts",
  "workout_streak_analytics",
  "consistency_score",
  "transformation_comparison",
  "reduced_sponsored_feed",
  "pro_deals_preview",
] as const;

export const CREATOR_FEATURES = [
  "creator_analytics",
  "audience_insights",
  "post_performance_dashboard",
  "scheduled_posts_preview",
  "pinned_posts",
  "creator_profile_customization",
  "brand_campaign_marketplace_preview",
  "advanced_comment_filters",
] as const;

export const COACH_FEATURES = [
  "coach_business_dashboard",
  "client_inquiry_previews",
  "booking_form_preview",
  "lead_management_preview",
  "testimonials",
  "coaching_service_links",
  "premium_coaching_challenge_previews",
  "coach_partnership_opportunities",
  "coaching_program_previews",
  "transformation_showcase",
  "coach_profile_customization",
] as const;

export type FreeFeature = (typeof FREE_FEATURES)[number];
export type PremiumFeature = (typeof PRO_FEATURES)[number] | (typeof CREATOR_FEATURES)[number] | (typeof COACH_FEATURES)[number];
export type FeatureId = FreeFeature | PremiumFeature;

/** Features granted directly by each tier (excluding inherited ones). */
export const TIER_FEATURES: Record<MembershipTier, readonly PremiumFeature[]> = {
  FREE: [],
  GYMVERSE_PRO: PRO_FEATURES,
  CREATOR_PRO: CREATOR_FEATURES,
  COACH_PRO: COACH_FEATURES,
};

/** Inheritance. Prototype rule: Creator Pro and Coach Pro include all common GYMVERSE Pro benefits. */
export const TIER_INHERITS: Record<MembershipTier, readonly MembershipTier[]> = {
  FREE: [],
  GYMVERSE_PRO: [],
  CREATOR_PRO: ["GYMVERSE_PRO"],
  COACH_PRO: ["GYMVERSE_PRO"],
};

export const FEATURE_LABELS: Record<FeatureId, string> = {
  feed: "Home feed",
  posting: "Posting",
  comments: "Comments",
  likes_saves_shares: "Likes, saves and shares",
  follows: "Follows",
  explore: "Explore",
  challenges: "Challenges",
  progress_timeline: "Progress timeline",
  personal_records: "Personal records",
  profile: "Profile",
  reporting: "Reporting",
  blocking: "Blocking",
  guardian_safety: "Guardian safety tools",
  advanced_progress_tracking: "Advanced progress tracking",
  private_progress_timeline: "Private progress timeline",
  ai_weekly_checkin_preview: "AI weekly check-in (preview)",
  premium_challenges: "Premium challenges",
  premium_profile_customization: "Premium profile customization",
  pr_history_charts: "PR history charts",
  workout_streak_analytics: "Workout streak analytics",
  consistency_score: "Consistency score",
  transformation_comparison: "Transformation comparison",
  reduced_sponsored_feed: "Fewer sponsored posts",
  pro_deals_preview: "Pro Deals (preview)",
  creator_analytics: "Creator analytics",
  audience_insights: "Audience insights",
  post_performance_dashboard: "Post performance dashboard",
  scheduled_posts_preview: "Scheduled posts (preview)",
  pinned_posts: "Pinned posts",
  creator_profile_customization: "Creator profile customization",
  brand_campaign_marketplace_preview: "Brand campaign marketplace (preview)",
  advanced_comment_filters: "Advanced comment filters (preview)",
  coach_business_dashboard: "Coach business dashboard",
  client_inquiry_previews: "Client inquiries (preview)",
  booking_form_preview: "Booking form (preview)",
  lead_management_preview: "Lead management (preview)",
  testimonials: "Testimonials",
  coaching_service_links: "Coaching service links",
  premium_coaching_challenge_previews: "Premium coaching challenges (preview)",
  coach_partnership_opportunities: "Coach partnership opportunities",
  coaching_program_previews: "Coaching programs (preview)",
  transformation_showcase: "Transformation showcase (preview)",
  coach_profile_customization: "Coach profile customization",
};

const FREE_SET: ReadonlySet<string> = new Set(FREE_FEATURES);

export function isFreeFeature(feature: FeatureId): feature is FreeFeature {
  return FREE_SET.has(feature);
}

/** All premium features a tier has, including inherited ones. Cycle-safe. */
export function resolveEntitlements(tier: MembershipTier): PremiumFeature[] {
  const seen = new Set<MembershipTier>();
  const out = new Set<PremiumFeature>();
  const visit = (t: MembershipTier) => {
    if (seen.has(t)) return;
    seen.add(t);
    for (const parent of TIER_INHERITS[t]) visit(parent);
    for (const f of TIER_FEATURES[t]) out.add(f);
  };
  visit(tier);
  return [...out];
}

/** The single access check every screen should use. Free features are always allowed. */
export function hasEntitlement(tier: MembershipTier, feature: FeatureId): boolean {
  if (isFreeFeature(feature)) return true;
  return resolveEntitlements(tier).includes(feature);
}
