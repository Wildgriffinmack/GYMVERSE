import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Crown, Lock, X } from "lucide-react-native";
import { Badge, IconBtn, tap } from "../components/ui";
import type { PremiumFeature } from "../membership/entitlements";
import { useMembership } from "../membership/MembershipContext";
import { ComingSoonPill } from "../membership/PremiumScreen";
import { C, DIAG, F, GRAD_GOLD } from "../theme";
import { PRO_FEATURE_INFO } from "./proData";
import { CREATOR_FEATURE_INFO } from "../creator/creatorData";
import { COACH_FEATURE_INFO } from "../coach/coachData";
import { SPONSOR_FEATURE_INFO } from "../sponsors/sponsorData";
import { CHALLENGE_FEATURE_INFO } from "../challenges/premiumChallengeData";

/** Which membership a locked section belongs to (controls lock copy only; access always comes from entitlements). */
export type GatePlan = "pro" | "creator" | "coach";
const PLAN_LOCK: Record<GatePlan, { title: string; chip: string; sheetBadge: string }> = {
  pro: { title: "GYMVERSE Pro · Coming Soon", chip: "PRO", sheetBadge: "GYMVERSE PRO" },
  creator: { title: "Creator Pro · Coming Soon", chip: "CREATOR", sheetBadge: "CREATOR PRO" },
  coach: { title: "Coach Pro · Coming Soon", chip: "COACH", sheetBadge: "COACH PRO" },
};

/**
 * Wraps a Pro demo section. Unlocked tiers (via the developer switcher) get the interactive demo,
 * still labelled Coming Soon. Free users see a dimmed, non-interactive teaser with a lock; tapping
 * it opens a short explanation with a link to the Premium screen. No purchase path exists.
 */
export function ProSection({ feature, title, subtitle, onLocked, children, teaserHeight = 210, plan = "pro" }: { feature: PremiumFeature; title: string; subtitle?: string; onLocked: (f: PremiumFeature) => void; children: ReactNode; teaserHeight?: number; plan?: GatePlan }) {
  const { can } = useMembership();
  const unlocked = can(feature);
  return (
    <View style={s.section}>
      <View style={s.head}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{title}</Text>
          {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
        </View>
        {unlocked ? <ComingSoonPill label="DEMO · COMING SOON" /> : <ProLockBadge label={PLAN_LOCK[plan].chip} />}
      </View>
      {unlocked ? (
        children
      ) : (
        <View style={{ height: teaserHeight, borderRadius: 20, overflow: "hidden" }}>
          {/* Dimmed, inert preview: hidden from touch and from screen readers. */}
          <View pointerEvents="none" style={{ opacity: 0.32 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{children}</View>
          <LinearGradient colors={["rgba(9,9,9,0)", "rgba(9,9,9,0.85)", "#090909"]} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <View style={s.lockCard} pointerEvents="none">
            <View style={s.lockIcon}><Lock size={18} color="#1c0f00" /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.lockTitle}>{PLAN_LOCK[plan].title}</Text>
              <Text style={s.lockBody}>Tap to see what this feature will do.</Text>
            </View>
          </View>
          <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel={`${title}. ${PLAN_LOCK[plan].sheetBadge} feature, coming soon. Learn more`} onPress={() => { tap(); onLocked(feature); }} />
        </View>
      )}
    </View>
  );
}

export function ProLockBadge({ label = "PRO" }: { label?: string }) {
  return (
    <View style={s.proLock} accessibilityLabel={`${label} feature, locked`}>
      <Lock size={11} color="#1c0f00" strokeWidth={3} />
      <Text style={s.proLockText}>{label}</Text>
    </View>
  );
}

/** Concise explanation for a locked feature. The only action leads to the existing Premium screen. */
export function LockedFeatureSheet({ feature, onClose, onOpenPremium }: { feature: PremiumFeature | null; onClose: () => void; onOpenPremium: () => void }) {
  const insets = useSafeAreaInsets();
  const proInfo = feature ? (PRO_FEATURE_INFO[feature] ?? SPONSOR_FEATURE_INFO[feature] ?? CHALLENGE_FEATURE_INFO[feature]) : undefined;
  const creatorInfo = feature ? CREATOR_FEATURE_INFO[feature] : undefined;
  const coachInfo = feature ? COACH_FEATURE_INFO[feature] : undefined;
  const info = proInfo ?? creatorInfo ?? coachInfo ?? null;
  const badge = proInfo ? PLAN_LOCK.pro.sheetBadge : creatorInfo ? PLAN_LOCK.creator.sheetBadge : PLAN_LOCK.coach.sheetBadge;
  return (
    <Modal visible={!!feature} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Close" />
      {info ? (
        <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 4 }]}>
          <View style={s.sheetHead}>
            <Badge tone={badge === "CREATOR PRO" ? "flame" : badge === "COACH PRO" ? "ash" : "gold"}>{badge}</Badge>
            <IconBtn label="Close" onPress={onClose} size={34}><X size={18} color={C.white} /></IconBtn>
          </View>
          <Text style={s.sheetTitle}>{info.title}</Text>
          <Text style={s.sheetBody}>{info.body}</Text>
          <View style={{ marginTop: 14 }}><ComingSoonPill label="COMING SOON" /></View>
          <Text style={s.sheetNote}>Memberships aren't available yet. Posting, comments, follows, your progress timeline, personal records and every safety feature stay free.</Text>
          <Pressable accessibilityRole="button" onPress={() => { tap(); onClose(); onOpenPremium(); }} style={({ pressed }) => [{ marginTop: 18, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
            <LinearGradient colors={GRAD_GOLD} start={DIAG.start} end={DIAG.end} style={s.sheetCta}>
              <Crown size={18} color="#1c0f00" />
              <Text style={s.sheetCtaText}>See GYMVERSE Premium</Text>
            </LinearGradient>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => { tap(); onClose(); }} style={s.notNow}><Text style={s.notNowText}>Not now</Text></Pressable>
        </View>
      ) : null}
    </Modal>
  );
}

const s = StyleSheet.create({
  section: { marginTop: 22 },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  title: { fontFamily: F.display, fontSize: 24, lineHeight: 28, textTransform: "uppercase", color: C.white },
  subtitle: { marginTop: 2, fontSize: 13, color: C.ash },
  proLock: { flexDirection: "row", alignItems: "center", gap: 4, height: 24, paddingHorizontal: 9, borderRadius: 8, backgroundColor: C.gold },
  proLockText: { fontFamily: F.labelHeavy, fontSize: 12, letterSpacing: 1.4, color: "#1c0f00" },
  lockCard: { position: "absolute", left: 14, right: 14, bottom: 14, flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, backgroundColor: "rgba(20,20,20,0.95)", borderWidth: 1, borderColor: "rgba(255,209,102,0.4)" },
  lockIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: C.gold },
  lockTitle: { fontFamily: F.labelHeavy, fontSize: 14, letterSpacing: 1, textTransform: "uppercase", color: C.gold },
  lockBody: { marginTop: 2, fontSize: 12.5, color: "rgba(255,247,237,0.8)" },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 16, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: "#141414", borderTopWidth: 1.5, borderColor: "rgba(255,209,102,0.5)" },
  sheetHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sheetTitle: { marginTop: 12, fontFamily: F.display, fontSize: 28, lineHeight: 32, textTransform: "uppercase", color: C.white },
  sheetBody: { marginTop: 6, fontSize: 15, lineHeight: 21, color: "rgba(255,247,237,0.88)" },
  sheetNote: { marginTop: 12, fontSize: 12.5, lineHeight: 18, color: C.ash },
  sheetCta: { height: 52, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  sheetCtaText: { fontFamily: F.labelHeavy, fontSize: 16, letterSpacing: 1.3, textTransform: "uppercase", color: "#1c0f00" },
  notNow: { alignItems: "center", padding: 12, marginTop: 4 },
  notNowText: { fontFamily: F.label, fontSize: 14, letterSpacing: 1.5, textTransform: "uppercase", color: C.ash },
});
