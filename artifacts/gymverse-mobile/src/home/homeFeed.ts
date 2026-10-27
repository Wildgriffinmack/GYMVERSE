/** Pure Home Feed selectors (no React Native imports). */
import type { Post } from "../data";

export type HomeTab = "Following" | "For You";
export const HOME_TABS: HomeTab[] = ["Following", "For You"];

/** Posts without native Home media are short-form clips. */
export const isClip = (post: Post): boolean => !post.media;

/** The Clips tab shows only clips, in their original order. */
export function clipPosts(posts: Post[]): Post[] {
  return posts.filter(isClip);
}

/** Following = people you follow plus anything you just posted; For You = everything. */
export function homePosts(posts: Post[], tab: HomeTab, followed: string[]): Post[] {
  if (tab === "For You") return posts;
  const set = new Set(followed);
  return posts.filter((p) => p.created || set.has(p.username));
}

/** "2h" → "2h ago"; "now" → "Just now". */
export function timeAgo(time: string): string {
  if (time === "now") return "Just now";
  return /^\d+[smhdw]$/.test(time) ? `${time} ago` : time;
}

/** Gallery shows up to `max` tiles; the last one carries a "+N" for the rest. */
export function galleryTiles<T>(photos: T[], max = 3): { shown: T[]; extra: number } {
  return { shown: photos.slice(0, max), extra: Math.max(0, photos.length - max) };
}
