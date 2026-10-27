/**
 * All landing-page copy and form options live here so messaging can be edited,
 * A/B tested and checked by tests without touching layout code.
 * Icons are referenced by key; components map keys to Lucide icons.
 */

export interface Option<V extends string = string> {
  value: V;
  label: string;
}

export interface IconItem {
  icon: string;
  title: string;
  body: string;
}

// ---------------------------------------------------------------------------
// Hero + A/B headline variants
// ---------------------------------------------------------------------------

export interface HeroVariant {
  id: "1" | "2" | "3";
  /** Plain part of the headline. */
  lead: string;
  /** Gradient-highlighted part of the headline. */
  accent: string;
}

/** Variant "1" is the default: it states the emotional benefit in one sentence for cold ad traffic. */
export const HERO_VARIANTS: readonly HeroVariant[] = [
  { id: "1", lead: "Fitness", accent: "without judgment or distraction." },
  { id: "2", lead: "No judgment. No distractions.", accent: "Just progress together." },
  { id: "3", lead: "Your fitness space,", accent: "without the noise." },
];

export const DEFAULT_HERO_VARIANT: HeroVariant = HERO_VARIANTS[0];

export function headlineText(v: HeroVariant): string {
  return `${v.lead} ${v.accent}`;
}

export const HERO = {
  eyebrow: "Early Access Now Open",
  eyebrowGold: "Founding 500",
  subheadline:
    "GYMX is a focused fitness community where beginners, students, lifters, and coaches can share progress, ask questions, and build habits without toxic comparison or random social media noise.",
  primaryCta: "Join the Early Access Waitlist",
  secondaryCta: "Apply to Become a Founding Coach",
  hype: "Help shape the first version of GYMX before launch.",
  chips: ["Free to join", "Beginner-friendly", "Fitness-only feed"],
} as const;

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export const NAV = {
  badge: "Beta Access",
  cta: "Join Waitlist",
  links: [
    { label: "Why GYMX", href: "#why" },
    { label: "Waitlist", href: "#waitlist" },
    { label: "Coaches", href: "#coaches" },
  ],
} as const;

// ---------------------------------------------------------------------------
// Problem
// ---------------------------------------------------------------------------

export const PROBLEM = {
  kicker: "Why GYMX",
  title: "Fitness content is everywhere. Real support is harder to find.",
  points: [
    { icon: "shuffle", title: "Normal social media is distracting.", body: "You open an app for a workout idea and lose an hour to everything else." },
    { icon: "eye", title: "Beginners feel judged.", body: "Posting a first workout or asking a simple question can feel like stepping on stage." },
    { icon: "grid", title: "Gym content is scattered.", body: "Advice, plans, and motivation are spread across a dozen apps, accounts, and group chats." },
    { icon: "crown", title: "Fitness influencers can feel intimidating.", body: "Highlight reels make normal progress look small, even when it is real progress." },
    { icon: "question", title: "People want support but do not know where to find it.", body: "Most people do better with a little accountability, but it is hard to know where to look." },
  ] satisfies readonly IconItem[],
  comparison: {
    traditional: {
      title: "Traditional Social Feeds",
      items: ["Random algorithms", "Toxic comparison", "Highlight reels", "Intimidating comments", "Distraction from goals"],
    },
    gymx: {
      title: "GYMX",
      items: [
        "A feed built for your goals",
        "Supportive fitness-only community",
        "Real progress and small wins",
        "Beginner-friendly Q&A",
        "Less distraction, more direction",
      ],
    },
  },
} as const;

// ---------------------------------------------------------------------------
// What GYMX will be
// ---------------------------------------------------------------------------

export const FEATURES = {
  kicker: "What GYMX will be",
  title: "A fitness community made for real people.",
  items: [
    { icon: "share", title: "Share Progress", body: "Post workouts, wins, questions, and updates without feeling judged." },
    { icon: "question", title: "Ask Questions", body: "Get beginner-friendly support from real people and future verified coaches." },
    { icon: "calendar", title: "Stay Accountable", body: "Join challenges, follow goals, and keep showing up with others." },
    { icon: "users", title: "Find Your People", body: "Connect with people chasing progress too, not just showing off." },
  ] satisfies readonly IconItem[],
} as const;

// ---------------------------------------------------------------------------
// Who it is for
// ---------------------------------------------------------------------------

export const AUDIENCES = {
  kicker: "Who it is for",
  title: "Built for people who want to start, restart, or stay consistent.",
  items: [
    { icon: "sprout", title: "Beginners", body: "New to the gym? Learn, ask, and share without embarrassment." },
    { icon: "graduation", title: "Students", body: "Build habits around school, work, and real life." },
    { icon: "dumbbell", title: "Casual Gym-Goers", body: "Stay consistent without needing to be perfect." },
    { icon: "reset", title: "Inconsistent Lifters", body: "Reset and keep going with a community that helps you show up." },
    { icon: "megaphone", title: "Coaches and Creators", body: "Support users who came here to improve." },
    { icon: "building", title: "Local Gyms", body: "Connect with motivated people in your fitness community." },
  ] satisfies readonly IconItem[],
} as const;

// ---------------------------------------------------------------------------
// Waitlist form
// ---------------------------------------------------------------------------

export const AGE_RANGES = [
  { value: "under_18", label: "Under 18" },
  { value: "18_24", label: "18–24" },
  { value: "25_plus", label: "25+" },
] as const satisfies readonly Option[];

export const FITNESS_LEVELS = [
  { value: "brand_new", label: "Brand new" },
  { value: "beginner", label: "Beginner" },
  { value: "inconsistent", label: "Inconsistent" },
  { value: "consistent", label: "Consistent" },
  { value: "advanced", label: "Advanced" },
] as const satisfies readonly Option[];

export const USER_TYPES = [
  { value: "beginner", label: "Beginner" },
  { value: "student", label: "Student" },
  { value: "casual", label: "Casual gym-goer" },
  { value: "athlete", label: "Athlete" },
  { value: "creator", label: "Fitness creator" },
  { value: "coach", label: "Coach/trainer" },
  { value: "gym_owner", label: "Gym owner" },
] as const satisfies readonly Option[];

export const STRUGGLES = [
  { value: "consistency", label: "Staying consistent" },
  { value: "knowing_what_to_do", label: "Knowing what to do" },
  { value: "gym_anxiety", label: "Gym anxiety" },
  { value: "nutrition", label: "Nutrition" },
  { value: "motivation", label: "Motivation" },
  { value: "community", label: "Finding community" },
  { value: "tracking", label: "Tracking progress" },
  { value: "other", label: "Other" },
] as const satisfies readonly Option[];

export const SOURCES = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube_shorts", label: "YouTube Shorts" },
  { value: "friend", label: "Friend" },
  { value: "flyer_qr", label: "Flyer/QR code" },
  { value: "coach_creator", label: "Coach/creator" },
  { value: "other", label: "Other" },
] as const satisfies readonly Option[];

export const COACH_TYPES = [
  { value: "personal_trainer", label: "Personal trainer" },
  { value: "online_coach", label: "Online coach" },
  { value: "creator", label: "Fitness creator" },
  { value: "gym_owner", label: "Gym owner" },
  { value: "athlete", label: "Athlete" },
  { value: "other", label: "Other" },
] as const satisfies readonly Option[];

export const AUDIENCE_SIZES = [
  { value: "under_1k", label: "Under 1k" },
  { value: "1k_5k", label: "1k–5k" },
  { value: "5k_20k", label: "5k–20k" },
  { value: "20k_50k", label: "20k–50k" },
  { value: "50k_plus", label: "50k+" },
] as const satisfies readonly Option[];

export const WAITLIST = {
  kicker: "Early access",
  title: "Join the early GYMX community.",
  intro: "Early members help shape the first version of GYMX and get first access to beta invites and founding perks.",
  highlights: ["Beta invites as spots open", "Founding member badges", "Invite to the 7-Day Show Up challenge"],
  tabs: {
    member: "I want beta access",
    coach: "I’m a coach / creator",
  },
  tabListLabel: "Choose how you want to join",
  member: {
    fullName: "Full name",
    email: "Email",
    ageRange: "Age range",
    confirmedAge13: "I’m 13 or older.",
    confirmedAge13Hint: "If you’re under 18, please check with a parent or guardian before joining.",
    fitnessLevel: "Fitness level",
    userType: "Which best describes you?",
    struggle: "Biggest fitness struggle",
    betaTester: "I want to beta test GYMX",
    source: "Where did you hear about us?",
    cta: "Join the Early Access Waitlist",
  },
  coach: {
    fullName: "Full name",
    email: "Email",
    handle: "Social handle or website",
    handlePlaceholder: "@yourhandle or yoursite.com",
    coachType: "Coach type",
    audienceSize: "Audience size",
    helpMost: "What would help you most on GYMX?",
    helpMostPlaceholder: "For example: answering beginner questions, running challenges, or meeting new clients.",
    leadBeta: "I’m interested in leading beta Q&As or challenges",
    cta: "Apply to Become a Founding Coach",
  },
  submitting: "Sending…",
  consent: "We’ll use your email to send GYMX early access updates and beta invites.",
  success: {
    title: "You’re on the list.",
    body: "We’ll send early updates, beta invites, and community access as GYMX gets closer to launch.",
    previewNote: "Preview build: this signup was not saved. Signups will be stored once the waitlist is connected before launch.",
    again: "Add another signup",
  },
  submitError: "Something went wrong. Please try again.",
} as const;

// ---------------------------------------------------------------------------
// Founding member perks
// ---------------------------------------------------------------------------

export interface Perk extends IconItem {
  highlight?: boolean;
}

export const PERKS = {
  kicker: "Founding perks",
  title: "Join early. Help shape what GYMX becomes.",
  items: [
    { icon: "badge", title: "Founding Member badge", body: "A profile badge that shows you were here from the start." },
    { icon: "medal", title: "First 500 badge", body: "Reserved for the first 500 people on the list.", highlight: true },
    { icon: "flask", title: "Beta Tester badge", body: "For members who help test early builds." },
    { icon: "megaphone", title: "Founding Coach badge", body: "For early coaches and creators who help build the community." },
    { icon: "flame", title: "Early challenge access", body: "Get into community challenges before public launch." },
    { icon: "vote", title: "Vote on features", body: "Help decide what gets built next." },
    { icon: "key", title: "Private community invite", body: "Join the early members-only community space." },
    { icon: "mic", title: "Early coach Q&As", body: "Bring your questions to early sessions with founding coaches." },
  ] satisfies readonly Perk[],
} as const;

// ---------------------------------------------------------------------------
// Community challenge
// ---------------------------------------------------------------------------

export const CHALLENGE = {
  kicker: "Community challenge",
  title: "The first challenge: 7-Day Show Up.",
  body: "Before the full app launches, we are building a small early community around simple consistency. One fitness action per day. No perfection required.",
  rules: ["One action a day", "Any fitness level", "No perfection required"],
  actionsTitle: "Pick any action, any day",
  actions: [
    { icon: "dumbbell", label: "Gym workout" },
    { icon: "footprints", label: "Walk" },
    { icon: "stretch", label: "Stretch" },
    { icon: "house", label: "Home workout" },
    { icon: "chef", label: "Meal prep" },
    { icon: "camera", label: "Progress photo" },
    { icon: "question", label: "Ask a question" },
  ],
  exampleLabel: "Example week",
  exampleDoneDays: 3,
  cta: "Join the waitlist to get the challenge invite.",
} as const;

// ---------------------------------------------------------------------------
// Founding coach / creator
// ---------------------------------------------------------------------------

export const COACHES = {
  kicker: "For coaches, creators & gyms",
  title: "Coaches and creators: build where fitness lives.",
  body: "GYMX is looking for early coaches, creators, and gyms who want to help build a healthier fitness community from the beginning. Founding coaches may receive early profile access, beta visibility, future lead generation tools, and the chance to support users before launch.",
  listTitle: "Founding coaches may receive",
  list: ["Early profile access", "Beta visibility", "Future lead generation tools", "The chance to support users before launch"],
  note: "Founding Coach is an early-community badge. Coach verification will be a separate process.",
  cta: "Apply to Become a Founding Coach",
} as const;

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export const FOOTER = {
  mission: "Your fitness space, without the noise.",
  socialLabel: "Follow GYMX",
  soon: "Coming soon",
} as const;
