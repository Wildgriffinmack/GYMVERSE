/**
 * Site-wide settings to fill in before launch. Empty hrefs render as
 * "coming soon" placeholders instead of dead links.
 */

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3100";

export interface SiteLink {
  label: string;
  href: string;
  icon?: string;
}

export const SOCIAL_LINKS: readonly SiteLink[] = [
  { label: "TikTok", href: "", icon: "music" },
  { label: "Instagram", href: "", icon: "camera" },
  { label: "YouTube Shorts", href: "", icon: "play" },
  { label: "Discord", href: "", icon: "chat" },
];

export const LEGAL_LINKS: readonly SiteLink[] = [
  { label: "Community Guidelines", href: "" },
  { label: "Contact", href: "" },
  { label: "Privacy", href: "" },
  { label: "Terms", href: "" },
];
