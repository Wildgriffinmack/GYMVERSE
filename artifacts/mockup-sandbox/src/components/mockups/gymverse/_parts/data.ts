import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Brain,
  ChevronsUp,
  Dumbbell,
  Flame,
  Medal,
  PersonStanding,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  Utensils,
  Zap,
} from "lucide-react";

export type Screen = "welcome" | "home" | "explore" | "create" | "challenges" | "profile" | "progress";
export const SCREENS: Screen[] = ["welcome", "home", "explore", "create", "challenges", "profile", "progress"];

export type FeedTab = "For You" | "Motivation" | "Workouts" | "Transformations" | "Beginner" | "PRs";
export const FEED_TABS: FeedTab[] = ["For You", "Motivation", "Workouts", "Transformations", "Beginner", "PRs"];

export type PostType = "Video" | "Photo" | "Gym Edit" | "Workout" | "Transformation" | "PR" | "Motivation";
export const POST_TYPES: PostType[] = ["Video", "Photo", "Gym Edit", "Workout", "Transformation", "PR", "Motivation"];

export const POST_CATEGORIES = ["Workout", "Transformation", "PR", "Motivation", "Beginner", "Nutrition"] as const;
export type PostCategory = (typeof POST_CATEGORIES)[number];

export type PostVisual = "pr" | "routine" | "transformation" | "edit" | "form" | "motivation";
export type BadgeTone = "flame" | "hot" | "gold" | "ash";

export type ArtLine = { label: string; detail: string };

/** Everything the generated "media" needs. No hardcoded copy lives in the art components. */
export type PostArtData = {
  visual: PostVisual;
  headline: string;
  subline?: string;
  stat?: string;
  unit?: string;
  lines?: ArtLine[];
};

export type Post = {
  id: string;
  username: string;
  name: string;
  time: string;
  caption: string;
  hashtags: string[];
  postType: PostType;
  category: string;
  feeds: FeedTab[];
  likes: number;
  comments: number;
  saves: number;
  badge: string;
  badgeTone: BadgeTone;
  audio: string;
  challenge?: string;
  verified?: boolean;
  art: PostArtData;
  created?: boolean;
  onTimeline?: boolean;
};

export type Comment = { id: string; user: string; text: string; time: string; likes: number };

export type TimelineEntry = {
  id: string;
  title: string;
  note: string;
  date: string;
  stats: string[];
  art: PostArtData;
  isNew?: boolean;
};

export type CategoryTile = {
  name: string;
  desc: string;
  count: string;
  icon: LucideIcon;
  tab: FeedTab;
  tone: string;
  size: "hero" | "tall" | "wide" | "base";
};

export type Challenge = {
  id: string;
  title: string;
  desc: string;
  members: string;
  difficulty: string;
  duration: string;
  totalDays: number;
  badge: string;
  badgeTone: BadgeTone;
  tone: string;
  icon: LucideIcon;
};

export const ME = {
  username: "griffinlifts",
  name: "Griffin",
  bio: "Building strength, discipline, and consistency.",
  goal: "Build muscle and stay consistent",
  followers: "1.2K",
  following: "384",
  basePosts: 47,
  streak: 28,
  challengeId: "consistency",
  challengeDay: 13,
};

export const PERSONAL_RECORDS = [
  { lift: "Bench", value: 225, delta: "+45 this year" },
  { lift: "Squat", value: 315, delta: "+40 this year" },
  { lift: "Deadlift", value: 405, delta: "+60 this year" },
];

export const STARTER_POSTS: Post[] = [
  {
    id: "griffin-pr",
    username: "griffinlifts",
    name: "Griffin",
    time: "2h",
    caption: "Day 42. Finally hit 225 on bench. Keep showing up.",
    hashtags: ["#BenchPR", "#GymMotivation", "#Consistency"],
    postType: "Video",
    category: "PR",
    feeds: ["PRs", "Workouts"],
    likes: 2400,
    comments: 184,
    saves: 312,
    badge: "NEW PR",
    badgeTone: "gold",
    audio: "Original audio · griffinlifts",
    challenge: "30-Day Consistency",
    art: { visual: "pr", stat: "225", unit: "LB", headline: "Bench Press", subline: "Day 42 · Personal best" },
  },
  {
    id: "maya-push",
    username: "maya_moves",
    name: "Maya Chen",
    time: "4h",
    caption: "Beginner push day routine — save this for your next workout.",
    hashtags: ["#BeginnerFitness", "#PushDay", "#Workout"],
    postType: "Video",
    category: "Beginner",
    feeds: ["Beginner", "Workouts"],
    likes: 8700,
    comments: 512,
    saves: 2100,
    badge: "WORKOUT",
    badgeTone: "flame",
    audio: "Push Day Mix · GYMVERSE Radio",
    verified: true,
    art: {
      visual: "routine",
      headline: "Push Day",
      subline: "Beginner · 35 min",
      lines: [
        { label: "Dumbbell Press", detail: "3 × 10" },
        { label: "Incline Press", detail: "3 × 12" },
        { label: "Lateral Raise", detail: "3 × 15" },
        { label: "Tricep Dips", detail: "3 × 8" },
      ],
    },
  },
  {
    id: "jay-change",
    username: "iron_jay",
    name: "Jay Bennett",
    time: "6h",
    caption: "6-month transformation. Discipline beats motivation.",
    hashtags: ["#Transformation", "#FitnessJourney", "#NoExcuses"],
    postType: "Photo",
    category: "Transformation",
    feeds: ["Transformations"],
    likes: 14200,
    comments: 903,
    saves: 1800,
    badge: "TRANSFORMATION",
    badgeTone: "flame",
    audio: "Glow Up · iron_jay",
    art: {
      visual: "transformation",
      headline: "6 Months",
      subline: "Same gym. New standard.",
      lines: [
        { label: "Before", detail: "Month 01" },
        { label: "After", detail: "Month 06" },
      ],
    },
  },
  {
    id: "gymeditz-motivation",
    username: "gymeditz",
    name: "Gym Editz",
    time: "8h",
    caption: "When you don’t feel like going… that’s when it matters most.",
    hashtags: ["#GymEdit", "#Motivation", "#LockIn"],
    postType: "Gym Edit",
    category: "Motivation",
    feeds: ["Motivation"],
    likes: 21900,
    comments: 1100,
    saves: 4600,
    badge: "GYM EDIT",
    badgeTone: "hot",
    audio: "Cinematic gym edit · phonk remix",
    challenge: "No Excuses Challenge",
    verified: true,
    art: { visual: "edit", headline: "When you don’t feel like it", subline: "That’s when it matters" },
  },
  {
    id: "elena-form",
    username: "coach_elena",
    name: "Elena Ruiz",
    time: "10h",
    caption: "3 squat form tips every beginner should know.",
    hashtags: ["#SquatTips", "#FormCheck", "#LegDay"],
    postType: "Video",
    category: "Form Tips",
    feeds: ["Workouts", "Beginner"],
    likes: 5600,
    comments: 342,
    saves: 3900,
    badge: "FORM CHECK",
    badgeTone: "flame",
    audio: "Coach notes · coach_elena",
    verified: true,
    art: {
      visual: "form",
      headline: "Better Squats",
      subline: "Coach Elena · Form check",
      lines: [
        { label: "Brace", detail: "Big breath, tight core" },
        { label: "Depth", detail: "Hips below knees" },
        { label: "Drive", detail: "Push the floor away" },
      ],
    },
  },
  {
    id: "noexcuses-daily",
    username: "noexcuses",
    name: "No Excuses Club",
    time: "12h",
    caption: "You do not need motivation. You need consistency.",
    hashtags: ["#Discipline", "#GymMindset", "#Motivation"],
    postType: "Photo",
    category: "Motivation",
    feeds: ["Motivation"],
    likes: 11300,
    comments: 688,
    saves: 2700,
    badge: "MOTIVATION",
    badgeTone: "flame",
    audio: "Late night grind · noexcuses",
    art: { visual: "motivation", headline: "Discipline over mood.", subline: "28-day streak club" },
  },
];

const GENERIC_COMMENTS: Comment[] = [
  { id: "g1", user: "liftwithlee", text: "This is the kind of progress that keeps me going.", time: "1h", likes: 214 },
  { id: "g2", user: "maya_moves", text: "One rep at a time. You earned it.", time: "52m", likes: 98 },
  { id: "g3", user: "deadlift_dani", text: "Saving this for my next session 🔥", time: "31m", likes: 41 },
  { id: "g4", user: "first_pullup", text: "Needed this today. Heading to the gym now.", time: "12m", likes: 17 },
];

const POST_COMMENTS: Record<string, Comment[]> = {
  "griffin-pr": [
    { id: "p1", user: "iron_jay", text: "225 club! Told you it was coming.", time: "1h", likes: 388 },
    { id: "p2", user: "coach_elena", text: "Bar path looked clean. Proud of this one.", time: "48m", likes: 201 },
  ],
  "elena-form": [
    { id: "f1", user: "newbie_nate", text: "The brace cue fixed my lower back pain.", time: "2h", likes: 156 },
  ],
};

export function seedComments(postId: string): Comment[] {
  return [...(POST_COMMENTS[postId] ?? []), ...GENERIC_COMMENTS];
}

export const INITIAL_TIMELINE: TimelineEntry[] = [
  {
    id: "day-1",
    title: "Day 1",
    note: "First day locked in.",
    date: "6 months ago",
    stats: ["Workout #1", "BW 168 lb"],
    art: { visual: "motivation", headline: "Day one. Locked in.", subline: "Griffin · check-in" },
  },
  {
    id: "week-2",
    title: "Week 2",
    note: "Starting to feel stronger.",
    date: "5 months ago",
    stats: ["8 workouts", "12-day streak"],
    art: {
      visual: "routine",
      headline: "Week 02",
      subline: "Upper / lower split",
      lines: [
        { label: "Bench", detail: "3 × 5" },
        { label: "Squat", detail: "3 × 5" },
        { label: "Row", detail: "3 × 8" },
      ],
    },
  },
  {
    id: "month-1",
    title: "Month 1",
    note: "Hit 20 workouts.",
    date: "5 months ago",
    stats: ["20 workouts", "Bench 185"],
    art: { visual: "pr", stat: "20", unit: "SESSIONS", headline: "Month 01", subline: "Habit unlocked" },
  },
  {
    id: "month-3",
    title: "Month 3",
    note: "Bench PR + better consistency.",
    date: "3 months ago",
    stats: ["Bench 205 PR", "92% consistent"],
    art: { visual: "pr", stat: "205", unit: "LB", headline: "Bench PR", subline: "Month 03" },
  },
  {
    id: "month-6",
    title: "Month 6",
    note: "Transformation update.",
    date: "Today",
    stats: ["124 workouts", "Bench 225", "BW 181 lb"],
    art: {
      visual: "transformation",
      headline: "6 Months",
      subline: "Still showing up",
      lines: [
        { label: "Before", detail: "Day 01" },
        { label: "After", detail: "Month 06" },
      ],
    },
  },
];

export const CATEGORIES: CategoryTile[] = [
  { name: "Gym Motivation", desc: "Edits, speeches, and the push you need today.", count: "2.4K posts", icon: Flame, tab: "Motivation", tone: "ember", size: "hero" },
  { name: "Beginner Workouts", desc: "Simple plans. Strong first steps.", count: "1.8K posts", icon: Activity, tab: "Beginner", tone: "gold", size: "tall" },
  { name: "Transformations", desc: "Real journeys, measured in months.", count: "986 posts", icon: TrendingUp, tab: "Transformations", tone: "crimson", size: "base" },
  { name: "Strength Training", desc: "Build a stronger foundation.", count: "1.2K posts", icon: Dumbbell, tab: "Workouts", tone: "iron", size: "base" },
  { name: "Bodybuilding", desc: "Training, symmetry, and the details.", count: "874 posts", icon: Zap, tab: "Workouts", tone: "magma", size: "wide" },
  { name: "Weight Loss", desc: "Small wins add up to big change.", count: "1.1K posts", icon: Target, tab: "Transformations", tone: "sunset", size: "base" },
  { name: "Nutrition", desc: "Fuel your next rep and your recovery.", count: "763 posts", icon: Utensils, tab: "Beginner", tone: "citrus", size: "tall" },
  { name: "Powerlifting", desc: "Squat. Bench. Deadlift. Repeat.", count: "649 posts", icon: Medal, tab: "PRs", tone: "blood", size: "base" },
  { name: "Calisthenics", desc: "Own every inch of your bodyweight.", count: "538 posts", icon: PersonStanding, tab: "Workouts", tone: "smoke", size: "base" },
  { name: "Mental Discipline", desc: "Consistency is a skill you can train.", count: "1.6K posts", icon: Brain, tab: "Motivation", tone: "ash", size: "base" },
];

export const TRENDS: { tag: string; count: string; tab: FeedTab }[] = [
  { tag: "#BenchPR", count: "12.4K", tab: "PRs" },
  { tag: "#GymEdit", count: "31K", tab: "Motivation" },
  { tag: "#LegDay", count: "19K", tab: "Workouts" },
  { tag: "#6MonthChange", count: "8.8K", tab: "Transformations" },
  { tag: "#FirstPullUp", count: "5.3K", tab: "Beginner" },
];

export const CHALLENGES: Challenge[] = [
  { id: "consistency", title: "30-Day Gym Consistency", desc: "Show up for 30 days. Any movement counts.", members: "18.2K", difficulty: "All levels", duration: "30 days", totalDays: 30, badge: "HOT", badgeTone: "hot", tone: "ember", icon: Flame },
  { id: "pushups", title: "100 Pushups a Day", desc: "Break them into sets. Build the habit.", members: "8.7K", difficulty: "Intermediate", duration: "Daily", totalDays: 30, badge: "TRENDING", badgeTone: "flame", tone: "crimson", icon: Dumbbell },
  { id: "pullup", title: "First Pull-Up", desc: "A coached path from dead hang to your first rep.", members: "5.3K", difficulty: "Beginner", duration: "6 weeks", totalDays: 42, badge: "BEGINNER", badgeTone: "gold", tone: "gold", icon: ChevronsUp },
  { id: "transform", title: "12-Week Transformation", desc: "Three months of training, logged your way.", members: "12.9K", difficulty: "All levels", duration: "12 weeks", totalDays: 84, badge: "TRENDING", badgeTone: "flame", tone: "magma", icon: TrendingUp },
  { id: "pr-week", title: "PR Week", desc: "Pick one lift. Set a number. Go earn it.", members: "3.1K", difficulty: "Advanced", duration: "7 days", totalDays: 7, badge: "HARD", badgeTone: "hot", tone: "blood", icon: Trophy },
  { id: "cardio", title: "No Excuses Cardio", desc: "Twenty minutes of movement, five days a week.", members: "6.4K", difficulty: "All levels", duration: "4 weeks", totalDays: 28, badge: "NEW", badgeTone: "ash", tone: "iron", icon: Timer },
];

/** Extra mock tiles so the profile grid feels lived-in. */
export const PROFILE_EXTRA_TILES: { id: string; views: string; art: PostArtData }[] = [
  { id: "x-squat", views: "8.1K", art: { visual: "pr", stat: "315", unit: "LB", headline: "Squat", subline: "Month 05" } },
  { id: "x-dead", views: "12K", art: { visual: "pr", stat: "405", unit: "LB", headline: "Deadlift", subline: "Month 06" } },
  { id: "x-leg", views: "3.4K", art: { visual: "routine", headline: "Leg Day", subline: "Heavy", lines: [{ label: "Squat", detail: "5 × 5" }, { label: "RDL", detail: "3 × 8" }, { label: "Lunges", detail: "3 × 12" }] } },
  { id: "x-mind", views: "5.9K", art: { visual: "motivation", headline: "No days off mentally.", subline: "" } },
  { id: "x-edit", views: "21K", art: { visual: "edit", headline: "Built in silence", subline: "Gym edit" } },
];
