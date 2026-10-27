/**
 * GYMX Premium — Coming Soon content (Phase 2).
 *
 * Informational copy only. There are intentionally no prices, billing periods, discounts or
 * purchase actions. Every listed feature links to a Phase 1 entitlement so copy and access
 * rules cannot drift apart (enforced by tests/membership.test.mjs).
 */
import type { FeatureId } from "./entitlements";
import type { MembershipTier } from "./tiers";

export type PremiumPlanId = Exclude<MembershipTier, "FREE">;

export interface PlanFeature {
  title: string;
  detail: string;
  entitlement: FeatureId;
}

export interface PremiumPlan {
  id: PremiumPlanId;
  name: string;
  availability: "COMING SOON";
  tagline: string;
  audience: string;
  ctaLabel: string;
  /** Visual theme: gold (Pro), ember (Creator), coach (gold/white). */
  theme: "gold" | "ember" | "coach";
  icon: "Zap" | "Sparkles" | "Briefcase";
  features: PlanFeature[];
  /** Honest limits shown on the card and in the detail sheet. */
  note?: string;
}

export const PREMIUM_COPY = {
  kicker: "GYMX Premium",
  heading: "UNLOCK YOUR GYMX POTENTIAL",
  subtitle: "More tools. More progress. More opportunities.",
  banner: "MEMBERSHIPS COMING SOON",
  freeNote: "Posting, comments, challenges, progress tracking and every safety tool stay free for everyone.",
  inDevelopment: "Coming Soon — Features in Development",
  previewNote: "This is an early preview. Plans, features and availability may change before launch. Nothing can be purchased yet.",
  comparisonTitle: "Which plan is right for you?",
  comparisonSummary: "Creator Pro helps you grow attention. Coach Pro helps you turn attention into clients.",
  comparisonGuide: "If you mainly post content, choose Creator Pro. If you sell coaching or training services, choose Coach Pro.",
  sponsorHeadline: "Fewer interruptions. Better fitness offers.",
  sponsorBody:
    "GYMX Pro reduces repetitive sponsored posts while still showing relevant fitness deals, challenge sponsors, and brand opportunities that support the community.",
  sponsorFootnote: "Sponsored posts still appear on every plan, just less often on premium plans.",
} as const;

const REDUCED_SPONSORS: PlanFeature = {
  title: "Reduced sponsored feed frequency",
  detail: "See sponsored posts less often. Relevant fitness deals and challenge sponsors still appear.",
  entitlement: "reduced_sponsored_feed",
};

export const PREMIUM_PLANS: PremiumPlan[] = [
  {
    id: "GYMVERSE_PRO",
    name: "GYMX PRO",
    availability: "COMING SOON",
    tagline: "Train harder. Track deeper. Stay consistent.",
    audience: "Everyday lifters, beginners, and serious fitness enthusiasts.",
    ctaLabel: "Explore GYMX Pro",
    theme: "gold",
    icon: "Zap",
    features: [
      { title: "Advanced progress tracking", detail: "Volume, frequency and bodyweight trends across every lift you log.", entitlement: "advanced_progress_tracking" },
      { title: "PR history charts", detail: "See every personal record on a timeline for bench, squat, deadlift and more.", entitlement: "pr_history_charts" },
      { title: "Workout streak analytics", detail: "Understand your streaks, best training days and when you tend to slip.", entitlement: "workout_streak_analytics" },
      { title: "Consistency score", detail: "One simple score that rewards showing up week after week.", entitlement: "consistency_score" },
      { title: "Private progress timeline", detail: "Keep check-ins visible only to you until you're ready to share.", entitlement: "private_progress_timeline" },
      { title: "Transformation comparison", detail: "Side-by-side progress photos and stats from any two dates.", entitlement: "transformation_comparison" },
      { title: "Premium challenges", detail: "Structured multi-week challenges with extra milestones.", entitlement: "premium_challenges" },
      { title: "Premium profile customization", detail: "Extra profile themes, cover styles and highlight options.", entitlement: "premium_profile_customization" },
      REDUCED_SPONSORS,
    ],
  },
  {
    id: "CREATOR_PRO",
    name: "CREATOR PRO",
    availability: "COMING SOON",
    tagline: "Grow your fitness audience.",
    audience: "Gym creators, influencers, athletes, transformation pages, and frequent posters.",
    ctaLabel: "Explore Creator Pro",
    theme: "ember",
    icon: "Sparkles",
    features: [
      { title: "Creator analytics", detail: "Reach, saves, shares and follower growth for your account.", entitlement: "creator_analytics" },
      { title: "Audience insights", detail: "Which goals and lanes your followers care about most.", entitlement: "audience_insights" },
      { title: "Post performance tracking", detail: "Compare how each post performs over its first days.", entitlement: "post_performance_dashboard" },
      { title: "Scheduled content preview", detail: "Plan posts ahead of time (preview).", entitlement: "scheduled_posts_preview" },
      { title: "Pinned posts", detail: "Keep your best work at the top of your profile.", entitlement: "pinned_posts" },
      { title: "Creator profile tools", detail: "Creator layouts, featured series and link sections.", entitlement: "creator_profile_customization" },
      { title: "Brand campaign opportunities", detail: "Browse fitness brand campaigns you can apply to (preview).", entitlement: "brand_campaign_marketplace_preview" },
      REDUCED_SPONSORS,
    ],
    note: "Creator Pro does not buy reach. It does not boost your posts in the feed or guarantee followers or views. Growth still comes from great content.",
  },
  {
    id: "COACH_PRO",
    name: "COACH PRO",
    availability: "COMING SOON",
    tagline: "Turn your content into clients.",
    audience: "Personal trainers, online coaches, gym owners, strength coaches, and fitness businesses.",
    ctaLabel: "Explore Coach Pro",
    theme: "coach",
    icon: "Briefcase",
    features: [
      { title: "Lead dashboard", detail: "See and organize people interested in your coaching.", entitlement: "lead_management_preview" },
      { title: "Client inquiry tools", detail: "Receive structured coaching inquiries from your profile.", entitlement: "client_inquiry_previews" },
      { title: "Booking/contact form previews", detail: "A simple form so prospects can request a session or call.", entitlement: "booking_form_preview" },
      { title: "Transformation showcase", detail: "Present client progress with their consent.", entitlement: "transformation_comparison" },
      { title: "Testimonials", detail: "Collect and display reviews from your clients.", entitlement: "testimonials" },
      { title: "Coaching service links", detail: "Link your programs and services from your profile.", entitlement: "coaching_service_links" },
      { title: "Coaching challenge tools", detail: "Run challenges for your community and clients.", entitlement: "premium_coaching_challenge_previews" },
      { title: "Coach partnership opportunities", detail: "Discover gyms and brands looking for coaches (preview).", entitlement: "coach_partnership_opportunities" },
      REDUCED_SPONSORS,
    ],
    note: "Coach Pro does not verify coaching credentials or certifications. Any credential verification will be a separate process.",
  },
];

export interface ComparisonRow {
  plan: PremiumPlanId;
  name: string;
  goal: string;
  bestFor: string;
  mainTools: string;
}

export const PLAN_COMPARISON: ComparisonRow[] = [
  { plan: "GYMVERSE_PRO", name: "GYMX Pro", goal: "Improve fitness progress", bestFor: "Everyday lifters", mainTools: "Progress tracking, PR charts, premium challenges" },
  { plan: "CREATOR_PRO", name: "Creator Pro", goal: "Grow an audience organically", bestFor: "Fitness creators", mainTools: "Analytics, content strategy, brand campaign previews" },
  { plan: "COACH_PRO", name: "Coach Pro", goal: "Attract and manage potential clients", bestFor: "Trainers and fitness businesses", mainTools: "Leads, inquiries, booking, testimonials" },
];
