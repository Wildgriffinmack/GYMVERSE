/**
 * GYMX membership tiers — PROTOTYPE CONFIGURATION ONLY.
 *
 * No tier can be purchased. There are deliberately no price, currency, trial or billing
 * fields: pricing is undecided and nothing here may imply a real subscription.
 * Pure data (type-only imports) so it can be unit-tested with plain Node.
 */
import type { SponsorProfileId } from "./sponsors";

export type MembershipTier = "FREE" | "GYMVERSE_PRO" | "CREATOR_PRO" | "COACH_PRO";

export const MEMBERSHIP_TIERS: MembershipTier[] = ["FREE", "GYMVERSE_PRO", "CREATOR_PRO", "COACH_PRO"];

/** "included" = the free plan everyone has. Paid concepts are "coming_soon" and cannot be bought. */
export type Availability = "included" | "coming_soon";

export interface TierBadge {
  /** Short text shown on badges. Null for Free (no badge). */
  label: string | null;
  /** lucide-react-native icon name, resolved by UI code. */
  icon: string | null;
  /** Visual tone that maps onto existing Iron Inferno badge tones. */
  tone: "flame" | "gold" | "hot" | "ash";
}

export interface TierDefinition {
  id: MembershipTier;
  displayName: string;
  availability: Availability;
  /** User-facing status text. Always "Coming Soon" for paid concepts. */
  availabilityLabel: string;
  tagline: string;
  description: string;
  badge: TierBadge;
  /** Styling identifier for future theming (gradients, rings, accents). */
  styleId: "tier-free" | "tier-pro" | "tier-creator" | "tier-coach";
  /** Key into SPONSOR_PROFILES (feed sponsor frequency). */
  sponsorProfile: SponsorProfileId;
  isPremium: boolean;
}

export const TIERS: Record<MembershipTier, TierDefinition> = {
  FREE: {
    id: "FREE",
    displayName: "GYMX",
    availability: "included",
    availabilityLabel: "Your plan",
    tagline: "Your gym feed. Nothing else.",
    description: "The full GYMX community: posting, comments, follows, challenges, progress timeline and every safety tool. Always free.",
    badge: { label: null, icon: null, tone: "ash" },
    styleId: "tier-free",
    sponsorProfile: "standard",
    isPremium: false,
  },
  GYMVERSE_PRO: {
    id: "GYMVERSE_PRO",
    displayName: "GYMX Pro",
    availability: "coming_soon",
    availabilityLabel: "Coming Soon",
    tagline: "Train harder. Track deeper. Stay consistent.",
    description: "Deeper progress tracking, PR history charts, streak analytics, a private timeline, premium challenges and fewer sponsored posts.",
    badge: { label: "PRO", icon: "Zap", tone: "gold" },
    styleId: "tier-pro",
    sponsorProfile: "reduced",
    isPremium: true,
  },
  CREATOR_PRO: {
    id: "CREATOR_PRO",
    displayName: "Creator Pro",
    availability: "coming_soon",
    availabilityLabel: "Coming Soon",
    tagline: "Grow your fitness audience.",
    description: "Everything in GYMX Pro, plus creator analytics, audience insights, post performance, scheduled and pinned posts, and brand campaigns.",
    badge: { label: "CREATOR PRO", icon: "Sparkles", tone: "flame" },
    styleId: "tier-creator",
    sponsorProfile: "reduced",
    isPremium: true,
  },
  COACH_PRO: {
    id: "COACH_PRO",
    displayName: "Coach Pro",
    availability: "coming_soon",
    availabilityLabel: "Coming Soon",
    tagline: "Turn your content into clients.",
    description: "Everything in GYMX Pro, plus a coach business dashboard, client inquiries, booking and lead previews, testimonials and partnerships.",
    badge: { label: "COACH PRO", icon: "Medal", tone: "ash" },
    styleId: "tier-coach",
    sponsorProfile: "reduced",
    isPremium: true,
  },
};
