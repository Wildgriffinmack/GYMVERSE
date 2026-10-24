/**
 * GYMVERSE Founders — RECOGNITION CONCEPT (Phase 7).
 *
 * Founder recognition is deliberately NOT a membership tier and NOT an entitlement. It is a
 * separate, session-only preview flag. It grants no features, no premium access, no moderation
 * authority and no exemption from community rules. Nothing here enrolls anyone or decides eligibility.
 * Pure module for plain-Node tests.
 */
export const FOUNDER_COPY = {
  title: "GYMVERSE FOUNDERS",
  tagline: "Built from day one. Remembered forever.",
  description: "A recognition concept for the earliest members who help shape the GYMVERSE community.",
  pill: "CONCEPT · NOT FINALIZED",
  badge: "GYMVERSE FOUNDER",
  separation: "Founder recognition is separate from memberships. It isn't bought, and it never comes with a paid plan.",
  notFinal: "Founder eligibility, timing and benefits are not decided. Nobody is being enrolled and no spots are being assigned.",
  rules: "Founders follow the same community guidelines and Guardian moderation as everyone else. Recognition grants no moderation powers.",
  notCredential: "The Founder badge recognises early community participation. It isn't identity verification or a coaching credential.",
  profileNote: "Founder preview · this session only",
} as const;

export const FOUNDER_BENEFITS: { title: string; body: string }[] = [
  { title: "Exclusive Founder badge", body: "A legacy badge shown beside your membership badge." },
  { title: "Founder profile cosmetic", body: "A subtle gold-and-ember profile frame concept." },
  { title: "Early-member recognition", body: "A place in the founding community story." },
  { title: "Founding-community challenges", body: "Community challenges celebrating early participation." },
  { title: "Early feature feedback", body: "Chances to share feedback on features before they launch." },
  { title: "Possible founding-member offers", body: "Something may be offered in the future — nothing is promised." },
];

/** How Founder recognition combines with each plan (it never changes the plan's features). */
export const FOUNDER_COMBINATIONS = [
  { label: "Free Founder", detail: "All free features, plus Founder recognition." },
  { label: "GYMVERSE Pro Founder", detail: "GYMVERSE Pro tools, plus Founder recognition." },
  { label: "Creator Pro Founder", detail: "Creator Pro tools, plus Founder recognition." },
  { label: "Coach Pro Founder", detail: "Coach Pro tools, plus Founder recognition." },
];

export const FIRST_1000 = {
  title: "THE FIRST 1000",
  tagline: "The first community. The foundation of GYMVERSE.",
  concept: "A future recognition challenge celebrating early participation and community contributions.",
  milestones: ["Join the founding community", "Complete a first workout challenge", "Encourage another community member", "Share constructive product feedback"],
  disclaimer: "Concept only. These example milestones don't award Founder status, and no spots are being assigned.",
} as const;
