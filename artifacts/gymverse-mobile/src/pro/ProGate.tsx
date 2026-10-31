import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Crown, Lock, X } from "lucide-react-native";
import { Button, IconBtn, IconMark, Tag, tap } from "../components/ui";
import type { Tone } from "../components/ui";
import type { PremiumFeature } from "../membership/entitlements";
import { useMembership } from "../membership/MembershipContext";
import { ComingSoonPill } from "../membership/PremiumScreen";
import { C, GUTTER, RADIUS, SURFACE, TEXT, TYPE } from "../theme";
import { PRO_FEATURE_INFO } from "./proData";
import { CREATOR_FEATURE_INFO } from "../creator/creatorData";
import { COACH_FEATURE_INFO } from "../coach/coachData";
import { SPONSOR_FEATURE_INFO } from "../sponsors/sponsorData";
import { CHALLENGE_FEATURE_INFO } from "../challenges/premiumChallengeData";

/** Which membership a locked section belongs to (controls lock copy only; access always comes from entitlements). */
export type GatePlan = "pro" | "creator" | "coach";
const PLAN_LOCK: Record<GatePlan, { title: string; chip: string; sheetBadge: string; tone: Tone }> = {
  pro: { title: "GYMX Pro · Coming Soon", chip: "PRO", sheetBadge: "GYMX PRO", tone: "gold" },
  creator: { title: "Creator Pro · Coming Soon", chip: "CREATOR", sheetBadge: "CREATOR PRO", tone: "flame" },
  coach: { title: "Coach Pro · Coming Soon", chip: "COACH", sheetBadge: "COACH PRO", tone: "bone" },
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
          <Text style={s.title} accessibilityRole="header">{title}</Text>
          {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
        </View>
        {unlocked ? <ComingSoonPill label="DEMO · COMING SOON" /> : <ProLockBadge label={PLAN_LOCK[plan].chip} />}
      </View>
      {unlocked ? (
        children
      ) : (
        <View style={{ height: teaserHeight, borderRadius: RADIUS.lg, overflow: "hidden" }}>
          {/* Dimmed, inert preview: hidden from touch and from screen readers. */}
          <View pointerEvents="none" style={{ opacity: 0.3 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{children}</View>
          <LinearGradient colors={["rgba(9,9,9,0)", "rgba(9,9,9,0.82)", "#090909"]} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <View style={s.lockCard} pointerEvents="none">
            <IconMark icon={Lock} tone={PLAN_LOCK[plan].tone} />
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
  const tone = (Object.values(PLAN_LOCK).find((p) => p.chip === label)?.tone ?? "gold") as Tone;
  return (
    <View accessibilityLabel={`${label} feature, locked`}>
      <Tag tone={tone} icon={Lock}>{label}</Tag>
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
  const lock = proInfo ? PLAN_LOCK.pro : creatorInfo ? PLAN_LOCK.creator : PLAN_LOCK.coach;
  return (
    <Modal visible={!!feature} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Close" />
      {info ? (
        <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 4 }]}>
          <View style={s.handle} />
          <View style={s.sheetHead}>
            <Tag tone={lock.tone} icon={Lock}>{lock.sheetBadge}</Tag>
            <IconBtn label="Close" onPress={onClose} size={34}><X size={18} color={C.white} /></IconBtn>
          </View>
          <Text style={s.sheetTitle}>{info.title}</Text>
          <Text style={s.sheetBody}>{info.body}</Text>
          <View style={{ marginTop: 16 }}><ComingSoonPill label="COMING SOON" /></View>
          <Text style={s.sheetNote}>Memberships aren't available yet. Posting, comments, follows, your progress timeline, personal records and every safety feature stay free.</Text>
          <Button title="See GYMX Premium" onPress={() => { onClose(); onOpenPremium(); }} variant="gold" size="lg" icon={Crown} style={{ marginTop: 20 }} />
          <Button title="Not now" onPress={onClose} variant="ghost" tone="bone" style={{ marginTop: 2 }} />
        </View>
      ) : null}
    </Modal>
  );
}

const s = StyleSheet.create({
  section: { marginTop: 32 },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
  title: { ...TYPE.section, fontSize: 22, lineHeight: 26 },
  subtitle: { marginTop: 3, fontSize: 13, lineHeight: 18, color: TEXT.tertiary },
  lockCard: { position: "absolute", left: 12, right: 12, bottom: 12, flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: RADIUS.md + 2, backgroundColor: "rgba(24,24,24,0.96)" },
  lockTitle: { ...TYPE.tag, fontSize: 13.5, letterSpacing: 1, color: TEXT.primary },
  lockBody: { marginTop: 2, fontSize: 12.5, color: TEXT.secondary },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: SURFACE.scrim },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: GUTTER, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, backgroundColor: SURFACE.sheet },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginTop: 10, marginBottom: 12, backgroundColor: "rgba(255,247,237,0.2)" },
  sheetHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sheetTitle: { ...TYPE.title, fontSize: 28, lineHeight: 32, marginTop: 14 },
  sheetBody: { marginTop: 8, fontSize: 15, lineHeight: 22, color: TEXT.secondary },
  sheetNote: { marginTop: 12, fontSize: 12.5, lineHeight: 18, color: TEXT.tertiary },
});
