/**
 * Home Feed demo content — fictional people and placeholder photos (no real users, no backend).
 * Kept free of React Native imports so it can be unit tested in Node.
 */
import type { Post } from "../data";

export type Story = { username: string; name: string; label: string };

/** Accounts the demo user follows on first launch (the Following tab and story row). */
export const INITIAL_FOLLOWING: string[] = ["alex.morgan", "marcus.t", "jordan.r", "sam.k", "chris.p", "taylor.fit"];

export const STORIES: Story[] = [
  { username: "alex.morgan", name: "Alex Morgan", label: "Alex" },
  { username: "jordan.r", name: "Jordan R.", label: "Jordan" },
  { username: "sam.k", name: "Sam K.", label: "Sam" },
  { username: "chris.p", name: "Chris P.", label: "Chris" },
  { username: "taylor.fit", name: "Taylor", label: "Taylor" },
];

const base = { hashtags: [] as string[], audio: "", saves: 0 };

export const HOME_POSTS: Post[] = [
  {
    ...base,
    id: "home-alex-carousel",
    username: "alex.morgan",
    name: "Alex Morgan",
    time: "2h",
    caption: "6 months of consistency. Feeling stronger every week 💪",
    postType: "Photo",
    category: "Transformation",
    feeds: ["Transformations"],
    likes: 248,
    comments: 14,
    saves: 31,
    badge: "PHOTO",
    badgeTone: "ash",
    art: { visual: "transformation", headline: "6 Months", subline: "Alex Morgan", lines: [{ label: "Before", detail: "Month 01" }, { label: "After", detail: "Month 06" }] },
    media: { kind: "photos", layout: "carousel", photos: ["gym-rig", "gym-machines", "gym-cardio"] },
  },
  {
    ...base,
    id: "home-marcus-pr",
    username: "marcus.t",
    name: "Marcus T.",
    time: "4h",
    caption: "Finally broke through the plateau. Next stop: 365!",
    postType: "PR",
    category: "PR",
    feeds: ["PRs"],
    likes: 86,
    comments: 12,
    saves: 9,
    badge: "NEW PR",
    badgeTone: "gold",
    art: { visual: "pr", stat: "315", unit: "LB", headline: "Back Squat", subline: "+10 LB personal record" },
    media: { kind: "milestone", lift: "Barbell Back Squat", value: "315", unit: "LB", detail: "1 rep", delta: "+10 LB", deltaLabel: "vs. previous PR" },
  },
  {
    ...base,
    id: "home-jordan-gallery",
    username: "jordan.r",
    name: "Jordan R.",
    time: "6h",
    caption: "Another leg day in the books. Showed up and got it done.",
    postType: "Workout",
    category: "Workout",
    feeds: ["Workouts"],
    likes: 52,
    comments: 8,
    saves: 4,
    badge: "WORKOUT",
    badgeTone: "flame",
    art: { visual: "routine", headline: "Leg Day", subline: "Jordan R.", lines: [{ label: "Squat", detail: "5 × 5" }, { label: "RDL", detail: "3 × 8" }, { label: "Lunges", detail: "3 × 12" }] },
    media: { kind: "photos", layout: "gallery", photos: ["dumbbells-plates", "dumbbell-rack", "deadlift-grip", "dumbbells-pair", "dumbbells-floor"] },
  },
  {
    ...base,
    id: "home-sam-photo",
    username: "sam.k",
    name: "Sam K.",
    time: "7h",
    caption: "6 a.m. and the gym is all mine. Early sessions just hit different.",
    postType: "Photo",
    category: "Motivation",
    feeds: ["Motivation"],
    likes: 131,
    comments: 9,
    saves: 6,
    badge: "PHOTO",
    badgeTone: "ash",
    art: { visual: "motivation", headline: "Early sessions hit different.", subline: "Sam K." },
    media: { kind: "photos", layout: "single", photos: ["gym-floor"] },
  },
  {
    ...base,
    id: "home-chris-pr",
    username: "chris.p",
    name: "Chris P.",
    time: "9h",
    caption: "Bench is moving again. Small jumps add up.",
    postType: "PR",
    category: "PR",
    feeds: ["PRs"],
    likes: 74,
    comments: 6,
    saves: 3,
    badge: "NEW PR",
    badgeTone: "gold",
    art: { visual: "pr", stat: "245", unit: "LB", headline: "Bench Press", subline: "+15 LB personal record" },
    media: { kind: "milestone", lift: "Bench Press", value: "245", unit: "LB", detail: "3 reps", delta: "+15 LB", deltaLabel: "vs. previous PR" },
  },
  {
    ...base,
    id: "home-taylor-photo",
    username: "taylor.fit",
    name: "Taylor",
    time: "11h",
    caption: "Platform day. Cleans felt fast and the form finally clicked.",
    postType: "Photo",
    category: "Workout",
    feeds: ["Workouts"],
    likes: 97,
    comments: 5,
    saves: 7,
    badge: "PHOTO",
    badgeTone: "ash",
    art: { visual: "motivation", headline: "Platform day.", subline: "Taylor" },
    media: { kind: "photos", layout: "single", photos: ["lifting-platforms"] },
  },
];

/** Home order: the first three Home posts, then clips and Home posts alternate; remaining clips follow. */
export function mergeHomePosts(clips: Post[], home: Post[] = HOME_POSTS): Post[] {
  const out = home.slice(0, 3);
  const rest = home.slice(3);
  let c = 0;
  for (const post of rest) {
    if (c < clips.length) out.push(clips[c++]);
    out.push(post);
  }
  return [...out, ...clips.slice(c)];
}
