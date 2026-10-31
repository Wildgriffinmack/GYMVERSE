/**
 * GYMX design system — "Iron Inferno".
 *
 * One source of truth for colour, type, spacing, shape, elevation and motion. Screens should compose
 * these tokens instead of hard-coding values, so every surface reads as one product.
 *
 * Gradient policy: the Inferno gradient (GRAD) is reserved for brand moments — the primary call to
 * action, the X of the wordmark, active indicators and achievements (PRs, streaks). Never use it for
 * borders or decorative boxes. Gold (GRAD_GOLD) signals premium / membership.
 */
import type { TextStyle } from "react-native";

/** Iron Inferno palette. */
export const C = {
  bg: "#090909",
  iron: "#1A1A1A",
  flame: "#FF5A1F",
  hot: "#FF2E2E",
  white: "#FFF7ED",
  /** Warm neutral so greys sit with the cream white (7.9:1 on bg). */
  ash: "#A8A29A",
  gold: "#FFD166",
  muted: "rgba(255,247,237,0.64)",
  soft: "rgba(255,247,237,0.06)",
  line: "rgba(255,247,237,0.08)",
} as const;

export const GRAD = ["#FF5A1F", "#FF2E2E"] as const;
export const GRAD_GOLD = ["#FFD166", "#FF5A1F"] as const;
export const GRAD_PR = ["#FFF7ED", "#FFD166", "#FF5A1F"] as const;
/** 135deg, matching `linear-gradient(135deg, ...)` from the web prototype. */
export const DIAG = { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } } as const;

/**
 * Surfaces, from the page up. On a near-black UI, elevation comes from slightly lighter surfaces —
 * not from borders or glows.
 */
export const SURFACE = {
  page: C.bg,
  /** Cards and grouped lists sitting on the page. */
  raised: "#131313",
  /** Bottom sheets and menus. */
  sheet: "#161616",
  /** Quiet fills for inputs, chips and secondary buttons. */
  fill: "rgba(255,247,237,0.06)",
  fillPressed: "rgba(255,247,237,0.1)",
  /** Scrim behind modals. */
  scrim: "rgba(0,0,0,0.6)",
} as const;

/** Text hierarchy. All levels pass WCAG AA (4.5:1) on `SURFACE.page` and `SURFACE.raised`. */
export const TEXT = {
  primary: C.white,
  secondary: "rgba(255,247,237,0.76)",
  tertiary: C.ash,
  disabled: "rgba(255,247,237,0.32)",
  onAccent: "#FFFFFF",
  onGold: "#1C0F00",
} as const;

/** Divider weights. Prefer whitespace; use a hairline only where content needs separating. */
export const LINE = {
  hairline: "rgba(255,247,237,0.08)",
  strong: "rgba(255,247,237,0.14)",
} as const;

/** Tinted fills for tags, icon marks and tinted buttons. */
export const TINT = {
  flame: "rgba(255,90,31,0.14)",
  gold: "rgba(255,209,102,0.13)",
  bone: "rgba(255,247,237,0.1)",
} as const;

export const F = {
  display: "Anton_400Regular",
  label: "BarlowCondensed_700Bold",
  labelSemi: "BarlowCondensed_600SemiBold",
  labelHeavy: "BarlowCondensed_800ExtraBold",
} as const;

/** Type scale. Anton for headlines and numbers, Barlow Condensed for labels/buttons, system for reading text. */
export const TYPE = {
  /** Screen hero headline. */
  hero: { fontFamily: F.display, fontSize: 40, lineHeight: 44, textTransform: "uppercase", color: TEXT.primary },
  /** Page title in the screen header. */
  title: { fontFamily: F.display, fontSize: 32, lineHeight: 36, textTransform: "uppercase", color: TEXT.primary },
  /** Section headline. */
  section: { fontFamily: F.display, fontSize: 24, lineHeight: 28, textTransform: "uppercase", color: TEXT.primary },
  /** Large numbers (stats, PRs). */
  metric: { fontFamily: F.display, fontSize: 28, lineHeight: 32, color: TEXT.primary },
  /** Row / card titles. */
  heading: { fontSize: 16, lineHeight: 21, fontWeight: "700", color: TEXT.primary },
  body: { fontSize: 15, lineHeight: 21, color: TEXT.primary },
  bodySmall: { fontSize: 13, lineHeight: 18, color: TEXT.secondary },
  caption: { fontSize: 12, lineHeight: 16, color: TEXT.tertiary },
  /** Uppercase eyebrow / kicker. */
  eyebrow: { fontFamily: F.label, fontSize: 12, lineHeight: 16, letterSpacing: 1.6, textTransform: "uppercase", color: TEXT.tertiary },
  /** Button and tag text. */
  button: { fontFamily: F.labelHeavy, fontSize: 16, letterSpacing: 1.2, textTransform: "uppercase" },
  tag: { fontFamily: F.labelHeavy, fontSize: 11.5, letterSpacing: 1.2, textTransform: "uppercase" },
} as const satisfies Record<string, TextStyle>;

/** 4-pt spacing scale. */
export const SPACE = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 40 } as const;
/** Horizontal page margin for scrolling screens. */
export const GUTTER = 20;

/** Corner radii. Chips < buttons < cards < sheets. */
export const RADIUS = { xs: 6, sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;

/** Icon sizes (lucide default stroke 2; 1.8 for large outline glyphs). */
export const ICON = { sm: 16, md: 20, lg: 24 } as const;

/** Minimum touch target (Apple HIG 44pt; Material 48dp is met with hitSlop). */
export const HIT = 44;

/** Shadows only for things that float above the page (toasts, sheets, the primary CTA). */
export const ELEVATION = {
  floating: { shadowColor: "#000", shadowOpacity: 0.55, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 18 },
  cta: { shadowColor: C.hot, shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
} as const;

/** Motion durations (ms). Pair with Easing.out(Easing.cubic); presses scale to `pressScale`. */
export const MOTION = { fast: 140, base: 240, slow: 380, pressScale: 0.97 } as const;

/** Height of the docked bottom nav above the safe-area inset. */
export const NAV_HEIGHT = 56;
/** The nav is docked to the bottom edge, so there is no floating gap. */
export const NAV_GAP = 0;
