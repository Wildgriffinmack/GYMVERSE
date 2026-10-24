/** Iron Inferno palette and type scale shared by every screen. */
export const C = {
  bg: "#090909",
  iron: "#1A1A1A",
  flame: "#FF5A1F",
  hot: "#FF2E2E",
  white: "#FFF7ED",
  ash: "#A3A3A3",
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

export const F = {
  display: "Anton_400Regular",
  label: "BarlowCondensed_700Bold",
  labelSemi: "BarlowCondensed_600SemiBold",
  labelHeavy: "BarlowCondensed_800ExtraBold",
} as const;

/** Bottom space reserved for the floating nav bar (excluding the safe-area inset). */
export const NAV_HEIGHT = 66;
export const NAV_GAP = 12;
