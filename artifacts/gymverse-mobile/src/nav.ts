import type { Screen } from "./data";

/** Bottom navigation tabs, left to right. Pure data so tests can check it without React Native. */
export const NAV_TABS: { screen: Screen; label: string }[] = [
  { screen: "home", label: "Home" },
  { screen: "explore", label: "Explore" },
  { screen: "create", label: "Create" },
  { screen: "clips", label: "Clips" },
  { screen: "profile", label: "Profile" },
];

const EXPLORE_AREA: Screen[] = ["explore", "challenges", "premium_challenge"];
const PROFILE_AREA: Screen[] = ["profile", "progress", "premium", "pro_progress", "creator_studio", "coach_center", "pro_deals", "founders"];

/** Which tab is highlighted for a screen (Challenges now lives under Explore and Profile). */
export function navTabFor(screen: Screen): Screen | null {
  if (EXPLORE_AREA.includes(screen)) return "explore";
  if (PROFILE_AREA.includes(screen)) return "profile";
  return NAV_TABS.some((t) => t.screen === screen) ? screen : null;
}
