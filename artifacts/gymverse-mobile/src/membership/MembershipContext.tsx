import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { FeatureId, PremiumFeature } from "./entitlements";
import { hasEntitlement, resolveEntitlements } from "./entitlements";
import type { OpportunityKind, SponsorProfile } from "./sponsors";
import { SPONSOR_OPPORTUNITIES, SPONSOR_PROFILES } from "./sponsors";
import type { MembershipTier, TierBadge, TierDefinition } from "./tiers";
import { TIERS } from "./tiers";

/**
 * Mock membership state — DEMONSTRATION ONLY.
 * There are no subscription records, receipts or purchases. The tier is a local, in-memory
 * value that resets on reload and can only be changed by the developer switcher.
 */
export interface MembershipState {
  tier: MembershipTier;
  plan: TierDefinition;
  badge: TierBadge;
  isPremium: boolean;
  /** Always "demo": nothing here is backed by a real subscription. */
  source: "demo";
  entitlements: PremiumFeature[];
  sponsor: SponsorProfile;
  opportunities: readonly OpportunityKind[];
  can: (feature: FeatureId) => boolean;
  setDemoTier: (tier: MembershipTier) => void;
  resetToFree: () => void;
}

const MembershipContext = createContext<MembershipState | null>(null);

export function MembershipProvider({ children, initialTier = "FREE" }: { children: ReactNode; initialTier?: MembershipTier }) {
  const [tier, setTier] = useState<MembershipTier>(initialTier);
  const setDemoTier = useCallback((next: MembershipTier) => setTier(next), []);
  const resetToFree = useCallback(() => setTier("FREE"), []);

  const value = useMemo<MembershipState>(() => {
    const plan = TIERS[tier];
    return {
      tier,
      plan,
      badge: plan.badge,
      isPremium: plan.isPremium,
      source: "demo",
      entitlements: resolveEntitlements(tier),
      sponsor: SPONSOR_PROFILES[plan.sponsorProfile],
      opportunities: SPONSOR_OPPORTUNITIES[tier],
      can: (feature) => hasEntitlement(tier, feature),
      setDemoTier,
      resetToFree,
    };
  }, [tier, setDemoTier, resetToFree]);

  return <MembershipContext.Provider value={value}>{children}</MembershipContext.Provider>;
}

export function useMembership(): MembershipState {
  const ctx = useContext(MembershipContext);
  if (!ctx) throw new Error("useMembership must be used inside <MembershipProvider>");
  return ctx;
}
