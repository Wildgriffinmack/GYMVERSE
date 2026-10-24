import type { BadgeTone, FeedTab, Post, PostArtData, PostType, PostVisual, TimelineEntry } from "./data";
import { ME } from "./data";

export function formatCount(value: number): string {
  if (value < 1000) return value.toLocaleString();
  if (value < 10000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${Math.round(value / 1000)}K`;
}

export function initialsOf(name: string): string {
  return name
    .replace(/[^a-zA-Z ]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Stable gradient choice per user so avatars stay consistent everywhere. */
export function avatarTone(username: string): number {
  let hash = 0;
  for (const char of username) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % 5;
}

export function categoryToFeed(category: string): FeedTab {
  if (category === "PR") return "PRs";
  if (category === "Motivation") return "Motivation";
  if (category === "Transformation") return "Transformations";
  if (category === "Beginner" || category === "Nutrition") return "Beginner";
  if (category === "Workout") return "Workouts";
  return "For You";
}

export function getPostVisual(type: PostType, category: string): PostVisual {
  if (type === "PR" || category === "PR") return "pr";
  if (type === "Transformation" || category === "Transformation") return "transformation";
  if (type === "Gym Edit") return "edit";
  if (type === "Motivation" || category === "Motivation") return "motivation";
  if (type === "Workout" || category === "Workout") return "routine";
  return type === "Photo" ? "motivation" : "form";
}

function badgeFor(type: PostType, category: string): { badge: string; badgeTone: BadgeTone } {
  if (type === "PR" || category === "PR") return { badge: "NEW PR", badgeTone: "gold" };
  if (type === "Gym Edit") return { badge: "GYM EDIT", badgeTone: "hot" };
  if (type === "Transformation" || category === "Transformation") return { badge: "TRANSFORMATION", badgeTone: "flame" };
  if (type === "Workout" || category === "Workout") return { badge: "WORKOUT", badgeTone: "flame" };
  if (type === "Motivation" || category === "Motivation") return { badge: "MOTIVATION", badgeTone: "flame" };
  return { badge: category.toUpperCase(), badgeTone: "ash" };
}

function shortLine(text: string, maxWords: number, fallback: string): string {
  const words = text.replace(/[#@]\S+/g, "").split(/\s+/).filter(Boolean);
  if (!words.length) return fallback;
  return words.slice(0, maxWords).join(" ") + (words.length > maxWords ? "…" : "");
}

/** Builds media art from what the user typed, so previews never show another creator's copy. */
export function buildArt(type: PostType, category: string, caption: string): PostArtData {
  const visual = getPostVisual(type, category);
  const text = caption.trim();
  switch (visual) {
    case "pr": {
      const number = text.match(/\d{2,4}/)?.[0];
      return { visual, stat: number ?? "PR", unit: number ? "LB" : "", headline: "New personal best", subline: `@${ME.username} · Just now` };
    }
    case "routine":
      return {
        visual,
        headline: shortLine(text, 3, "Today’s session"),
        subline: `${category} · @${ME.username}`,
        lines: [
          { label: "Warm-up", detail: "10 min" },
          { label: "Main lift", detail: "5 × 5" },
          { label: "Finisher", detail: "AMRAP" },
        ],
      };
    case "transformation":
      return {
        visual,
        headline: "Progress update",
        subline: shortLine(text, 5, "Still showing up"),
        lines: [
          { label: "Before", detail: "Day 01" },
          { label: "After", detail: "Today" },
        ],
      };
    case "edit":
      return { visual, headline: shortLine(text, 6, "Lock in today"), subline: `@${ME.username} · Gym edit` };
    case "form":
      return {
        visual,
        headline: shortLine(text, 3, "Form check"),
        subline: `@${ME.username} · ${category}`,
        lines: [
          { label: "Setup", detail: "" },
          { label: "Tempo", detail: "" },
          { label: "Lockout", detail: "" },
        ],
      };
    default:
      return { visual: "motivation", headline: shortLine(text, 4, "Keep showing up."), subline: `@${ME.username}` };
  }
}

export type PostDraft = {
  postType: PostType;
  category: string;
  caption: string;
  hashtags: string;
  addToTimeline: boolean;
};

export function parseHashtags(raw: string): string[] {
  const tags = raw
    .split(/[\s,]+/)
    .map((tag) => tag.replace(/^#+/, ""))
    .filter(Boolean)
    .map((tag) => `#${tag}`);
  return [...new Set(tags)];
}

export function buildPost(draft: PostDraft): Post {
  const feed = categoryToFeed(draft.category);
  return {
    id: `local-${Date.now()}`,
    username: ME.username,
    name: ME.name,
    time: "now",
    caption: draft.caption.trim(),
    hashtags: parseHashtags(draft.hashtags),
    postType: draft.postType,
    category: draft.category,
    feeds: feed === "For You" ? [] : [feed],
    likes: 0,
    comments: 0,
    saves: 0,
    audio: `Original audio · ${ME.username}`,
    art: buildArt(draft.postType, draft.category, draft.caption),
    created: true,
    onTimeline: draft.addToTimeline,
    ...badgeFor(draft.postType, draft.category),
  };
}

export function timelineEntryFrom(post: Post): TimelineEntry {
  return {
    id: `tl-${post.id}`,
    title: "New entry",
    note: post.caption,
    date: "Just now",
    stats: [...new Set([post.postType, post.category])],
    art: post.art,
    isNew: true,
  };
}
