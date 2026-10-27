import { DEFAULT_HERO_VARIANT, HERO_VARIANTS } from "./content.ts";
import type { HeroVariant } from "./content.ts";

/** Resolves the `?v=` query parameter to a hero headline variant, falling back to the default. */
export function resolveHeroVariant(param: string | string[] | null | undefined): HeroVariant {
  const raw = (Array.isArray(param) ? param[0] : param)?.trim();
  return HERO_VARIANTS.find((v) => v.id === raw) ?? DEFAULT_HERO_VARIANT;
}
