import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ArrowRight, Briefcase, Check, Clock, Info, Sparkles, X, Zap } from "lucide-react-native";
import { Glows } from "../components/Tone";
import { GradText, IconBtn, Label, PageHeader, tap } from "../components/ui";
import { Rise } from "../screens/Welcome";
import { C, DIAG, F, GRAD, GRAD_GOLD, NAV_GAP, NAV_HEIGHT } from "../theme";
import type { PremiumPlan, PremiumPlanId } from "./premiumContent";
import { FounderBadge } from "../founders/FounderBadge";
import { FOUNDER_COPY } from "../founders/foundersData";
import { PLAN_COMPARISON, PREMIUM_COPY, PREMIUM_PLANS } from "./premiumContent";

type Theme = { border: readonly [string, string, ...string[]]; accent: string; button: readonly [string, string]; buttonInk: string; glow: string };
const THEMES: Record<PremiumPlan["theme"], Theme> = {
  gold: { border: ["#FFD166", "#FF5A1F", "rgba(255,209,102,0.15)"], accent: C.gold, button: GRAD_GOLD, buttonInk: "#1c0f00", glow: C.gold },
  ember: { border: ["#FF5A1F", "#FF2E2E", "rgba(255,46,46,0.15)"], accent: C.flame, button: GRAD, buttonInk: "#fff", glow: C.hot },
  coach: { border: ["#FFF7ED", "#FFD166", "rgba(255,247,237,0.12)"], accent: C.white, button: ["#FFF7ED", "#F3E6D3"], buttonInk: "#111", glow: C.gold },
};
const ICONS = { Zap, Sparkles, Briefcase } as const;
const PREVIEW_COUNT = 5;
/** Plans with an interactive demo screen. */
const PREVIEW_LABELS: Partial<Record<PremiumPlanId, string>> = { GYMVERSE_PRO: "Preview Pro progress tools", CREATOR_PRO: "Preview Creator Studio", COACH_PRO: "Preview Coach Command Center" };

/** GYMVERSE Premium discovery screen. Informational only: every plan is Coming Soon and nothing can be purchased. */
export function PremiumScreen({ onBack, onExplore, onDeals, onFounders }: { onBack: () => void; onExplore: (plan: PremiumPlanId) => void; onDeals?: () => void; onFounders?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: insets.bottom + NAV_GAP + NAV_HEIGHT + 28 }} showsVerticalScrollIndicator={false}>
      <PageHeader
        top={insets.top}
        kicker={PREMIUM_COPY.kicker}
        title="Premium"
        leading={<IconBtn label="Back to profile" onPress={onBack}><ArrowLeft size={20} color={C.white} /></IconBtn>}
      />

      <View style={s.hero}>
        <Glows glows={[{ color: C.flame, cx: "0%", cy: "0%", rx: "90%", ry: "80%", opacity: 0.35 }, { color: C.gold, cx: "100%", cy: "100%", rx: "80%", ry: "70%", opacity: 0.22 }]} />
        <Rise delay={40}><ComingSoonPill label={PREMIUM_COPY.banner} large /></Rise>
        <Rise delay={110}>
          <Text style={s.heading}>UNLOCK YOUR</Text>
          <GradText style={s.heading}>GYMVERSE POTENTIAL</GradText>
        </Rise>
        <Rise delay={170}><Text style={s.subtitle}>{PREMIUM_COPY.subtitle}</Text></Rise>
        <Rise delay={230} style={s.freeNote}>
          <Check size={15} color={C.gold} strokeWidth={3} />
          <Text style={s.freeNoteText}>{PREMIUM_COPY.freeNote}</Text>
        </Rise>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 16, marginTop: 22 }}>
        {PREMIUM_PLANS.map((plan, i) => (
          <Rise key={plan.id} delay={280 + i * 80}>
            <PlanCard plan={plan} onExplore={() => onExplore(plan.id)} />
          </Rise>
        ))}
      </View>

      <Comparison />
      <SponsorBenefits onDeals={onDeals} />
      {onFounders ? <FoundersTeaser onFounders={onFounders} /> : null}

      <View style={s.footer}>
        <Info size={14} color={C.ash} />
        <Text style={s.footerText}>{PREMIUM_COPY.previewNote}</Text>
      </View>
    </ScrollView>
  );
}

export function ComingSoonPill({ label = "COMING SOON", large = false }: { label?: string; large?: boolean }) {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }), Animated.timing(pulse, { toValue: 0.4, duration: 900, useNativeDriver: true })]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <View style={[s.pill, large && s.pillLarge]} accessibilityRole="text" accessibilityLabel={label}>
      <Animated.View style={[s.pillDot, { opacity: pulse }]} />
      <Text style={[s.pillText, large && { fontSize: 13 }]}>{label}</Text>
    </View>
  );
}

function PlanCard({ plan, onExplore }: { plan: PremiumPlan; onExplore: () => void }) {
  const t = THEMES[plan.theme];
  const Icon = ICONS[plan.icon];
  const extra = plan.features.length - PREVIEW_COUNT;
  return (
    <LinearGradient colors={t.border} start={DIAG.start} end={DIAG.end} style={s.cardBorder}>
      <View style={s.card}>
        <Glows glows={[{ color: t.glow, cx: "100%", cy: "0%", rx: "70%", ry: "45%", opacity: 0.16 }]} />
        <View style={s.cardTop}>
          <LinearGradient colors={t.button} start={DIAG.start} end={DIAG.end} style={s.cardIcon}><Icon size={20} color={t.buttonInk} /></LinearGradient>
          <ComingSoonPill />
        </View>
        <Text style={s.planName}>{plan.name}</Text>
        <Text style={[s.tagline, { color: t.accent }]}>{plan.tagline}</Text>
        <Label style={{ marginTop: 12 }}>Built for</Label>
        <Text style={s.audience}>{plan.audience}</Text>
        <View style={s.features}>
          {plan.features.slice(0, PREVIEW_COUNT).map((f) => (
            <View key={f.title} style={s.featureRow}>
              <View style={[s.check, { borderColor: t.accent }]}><Check size={11} color={t.accent} strokeWidth={3.2} /></View>
              <Text style={s.featureText}>{f.title}</Text>
            </View>
          ))}
          {extra > 0 ? <Text style={s.more}>+ {extra} more in the full overview</Text> : null}
        </View>
        {plan.note ? <Text style={s.note}>{plan.note}</Text> : null}
        <Pressable accessibilityRole="button" accessibilityLabel={plan.ctaLabel} onPress={() => { tap(); onExplore(); }} style={({ pressed }) => [{ marginTop: 16, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
          <LinearGradient colors={t.button} start={DIAG.start} end={DIAG.end} style={s.cta}>
            <Text style={[s.ctaText, { color: t.buttonInk }]}>{plan.ctaLabel}</Text>
            <ArrowRight size={18} color={t.buttonInk} strokeWidth={2.6} />
          </LinearGradient>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

function Comparison() {
  return (
    <View style={s.section}>
      <Label accent>Compare</Label>
      <Text style={s.sectionTitle}>{PREMIUM_COPY.comparisonTitle}</Text>
      <View style={{ gap: 10, marginTop: 14 }}>
        {PLAN_COMPARISON.map((row) => {
          const plan = PREMIUM_PLANS.find((p) => p.id === row.plan)!;
          const accent = THEMES[plan.theme].accent;
          return (
            <View key={row.plan} style={[s.compareCard, { borderLeftColor: accent }]}>
              <Text style={[s.compareName, { color: accent }]}>{row.name}</Text>
              <CompareLine label="Goal" value={row.goal} />
              <CompareLine label="Best for" value={row.bestFor} />
              <CompareLine label="Main tools" value={row.mainTools} />
            </View>
          );
        })}
      </View>
      <LinearGradient colors={["rgba(255,90,31,0.16)", "rgba(255,209,102,0.08)"]} start={DIAG.start} end={DIAG.end} style={s.summary}>
        <Text style={s.summaryText}>{PREMIUM_COPY.comparisonSummary}</Text>
        <Text style={s.guideText}>{PREMIUM_COPY.comparisonGuide}</Text>
      </LinearGradient>
    </View>
  );
}

function CompareLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.compareLine}>
      <Text style={s.compareLabel}>{label}</Text>
      <Text style={s.compareValue}>{value}</Text>
    </View>
  );
}

/** Founders is a recognition concept, kept visually and logically apart from the paid plans above. */
function FoundersTeaser({ onFounders }: { onFounders: () => void }) {
  return (
    <View style={s.section}>
      <LinearGradient colors={["#1b1508", "#100d09", "#0b0b0b"]} start={DIAG.start} end={DIAG.end} style={s.founders}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <FounderBadge />
          <Text style={s.foundersPill}>{FOUNDER_COPY.pill}</Text>
        </View>
        <Text style={s.foundersTitle}>{FOUNDER_COPY.title}</Text>
        <Text style={s.foundersTag}>{FOUNDER_COPY.tagline}</Text>
        <Text style={s.sponsorBody}>{FOUNDER_COPY.description}</Text>
        <Text style={s.sponsorFoot}>{FOUNDER_COPY.separation} {FOUNDER_COPY.notFinal}</Text>
        <Pressable accessibilityRole="button" onPress={() => { tap(); onFounders(); }} style={({ pressed }) => [s.dealsBtn, { opacity: pressed ? 0.75 : 1 }]}>
          <Text style={s.dealsBtnText}>Explore Founders</Text>
          <ArrowRight size={15} color={C.gold} />
        </Pressable>
      </LinearGradient>
    </View>
  );
}

function SponsorBenefits({ onDeals }: { onDeals?: () => void }) {
  return (
    <View style={s.section}>
      <View style={s.sponsorCard}>
        <Glows glows={[{ color: C.gold, cx: "0%", cy: "0%", rx: "70%", ry: "70%", opacity: 0.18 }]} />
        <Label accent>Sponsored content</Label>
        <Text style={s.sponsorHeadline}>{PREMIUM_COPY.sponsorHeadline}</Text>
        <Text style={s.sponsorBody}>{PREMIUM_COPY.sponsorBody}</Text>
        <Text style={s.sponsorFoot}>{PREMIUM_COPY.sponsorFootnote}</Text>
        {onDeals ? (
          <Pressable accessibilityRole="button" onPress={() => { tap(); onDeals(); }} style={({ pressed }) => [s.dealsBtn, { opacity: pressed ? 0.75 : 1 }]}>
            <Sparkles size={15} color={C.gold} />
            <Text style={s.dealsBtnText}>Preview Pro Deals</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/** Informational plan overview. No payment flow or membership change happens here. */
export function PlanDetailSheet({ planId, onClose, onPreview }: { planId: PremiumPlanId | null; onClose: () => void; onPreview?: (plan: PremiumPlanId) => void }) {
  const insets = useSafeAreaInsets();
  const plan = PREMIUM_PLANS.find((p) => p.id === planId) ?? null;
  return (
    <Modal visible={!!plan} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Back to Premium" />
      {plan ? <DetailBody plan={plan} onClose={onClose} onPreview={onPreview} bottom={insets.bottom} /> : null}
    </Modal>
  );
}

function DetailBody({ plan, onClose, onPreview, bottom }: { plan: PremiumPlan; onClose: () => void; onPreview?: (plan: PremiumPlanId) => void; bottom: number }) {
  const t = THEMES[plan.theme];
  const Icon = ICONS[plan.icon];
  return (
    <View style={[s.sheet, { paddingBottom: Math.max(bottom, 14) }]}>
      <View style={s.handle} />
      <View style={s.sheetHead}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to Premium" onPress={() => { tap(); onClose(); }} hitSlop={8} style={s.backLink}>
          <ArrowLeft size={16} color={C.ash} />
          <Text style={s.backLinkText}>Premium</Text>
        </Pressable>
        <IconBtn label="Close plan overview" onPress={onClose} size={34}><X size={18} color={C.white} /></IconBtn>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <LinearGradient colors={t.button} start={DIAG.start} end={DIAG.end} style={s.cardIcon}><Icon size={20} color={t.buttonInk} /></LinearGradient>
          <ComingSoonPill />
        </View>
        <Text style={[s.planName, { marginTop: 12 }]}>{plan.name}</Text>
        <Text style={[s.tagline, { color: t.accent }]}>{plan.tagline}</Text>
        <Text style={[s.audience, { marginTop: 8 }]}>{plan.audience}</Text>

        <View style={s.devBanner}>
          <Clock size={16} color={C.gold} />
          <Text style={s.devBannerText}>{PREMIUM_COPY.inDevelopment}</Text>
        </View>

        <Label style={{ marginTop: 18, marginBottom: 10 }}>What's planned</Label>
        <View style={{ gap: 12 }}>
          {plan.features.map((f) => (
            <View key={f.title} style={s.detailRow}>
              <View style={[s.check, { borderColor: t.accent, marginTop: 2 }]}><Check size={11} color={t.accent} strokeWidth={3.2} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.detailTitle}>{f.title}</Text>
                <Text style={s.detailText}>{f.detail}</Text>
              </View>
            </View>
          ))}
        </View>
        {plan.note ? <InfoBox>{plan.note}</InfoBox> : null}
        <InfoBox>{PREMIUM_COPY.sponsorFootnote}</InfoBox>
        <InfoBox>{PREMIUM_COPY.previewNote}</InfoBox>
      </ScrollView>
      {PREVIEW_LABELS[plan.id] && onPreview ? (
        <Pressable accessibilityRole="button" onPress={() => { tap(); onPreview(plan.id); }} style={({ pressed }) => [{ marginHorizontal: 16, marginTop: 8, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
          <LinearGradient colors={plan.id === "CREATOR_PRO" ? GRAD : plan.id === "COACH_PRO" ? ["#FFF7ED", "#FFD166"] : GRAD_GOLD} start={DIAG.start} end={DIAG.end} style={s.previewBtn}>
            <Sparkles size={16} color={plan.id === "CREATOR_PRO" ? "#fff" : "#1c0f00"} />
            <Text style={[s.previewBtnText, plan.id === "CREATOR_PRO" && { color: "#fff" }]}>{PREVIEW_LABELS[plan.id]}</Text>
          </LinearGradient>
        </Pressable>
      ) : null}
      <Pressable accessibilityRole="button" onPress={() => { tap(); onClose(); }} style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.75 : 1 }]}>
        <ArrowLeft size={16} color={C.white} />
        <Text style={s.backBtnText}>Back to Premium</Text>
      </Pressable>
    </View>
  );
}

function InfoBox({ children }: { children: ReactNode }) {
  return (
    <View style={s.infoBox}>
      <Info size={14} color={C.ash} style={{ marginTop: 2 }} />
      <Text style={s.infoText}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  hero: { marginHorizontal: 16, padding: 20, paddingTop: 22, borderRadius: 28, overflow: "hidden", backgroundColor: "#121212", gap: 12 },
  heading: { fontFamily: F.display, fontSize: 38, lineHeight: 42, color: C.white, textTransform: "uppercase" },
  subtitle: { fontSize: 16, fontWeight: "600", color: "rgba(255,247,237,0.88)" },
  freeNote: { flexDirection: "row", gap: 8, alignItems: "flex-start", marginTop: 4, padding: 12, borderRadius: 14, backgroundColor: "rgba(255,209,102,0.08)" },
  freeNoteText: { flex: 1, fontSize: 13, lineHeight: 18, color: "rgba(255,247,237,0.85)" },
  pill: { flexDirection: "row", alignItems: "center", gap: 7, alignSelf: "flex-start", height: 26, paddingHorizontal: 11, borderRadius: 13, backgroundColor: "rgba(255,209,102,0.12)", borderWidth: 1, borderColor: "rgba(255,209,102,0.45)" },
  pillLarge: { height: 32, paddingHorizontal: 14, borderRadius: 16 },
  pillDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.gold },
  pillText: { fontFamily: F.labelHeavy, fontSize: 12, letterSpacing: 1.6, color: C.gold },
  cardBorder: { borderRadius: 26, padding: 1.5 },
  card: { borderRadius: 25, padding: 18, overflow: "hidden", backgroundColor: "#131313" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  planName: { marginTop: 14, fontFamily: F.display, fontSize: 32, lineHeight: 36, color: C.white },
  tagline: { marginTop: 2, fontSize: 15, fontWeight: "700" },
  audience: { marginTop: 4, fontSize: 13.5, lineHeight: 19, color: "rgba(255,247,237,0.8)" },
  features: { marginTop: 14, gap: 9 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  check: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  featureText: { flex: 1, fontSize: 14, color: C.white },
  more: { marginLeft: 30, fontSize: 12.5, color: C.ash },
  note: { marginTop: 12, fontSize: 12, lineHeight: 17, color: C.ash, fontStyle: "italic" },
  cta: { height: 52, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  ctaText: { fontFamily: F.labelHeavy, fontSize: 17, letterSpacing: 1.4, textTransform: "uppercase" },
  section: { paddingHorizontal: 16, marginTop: 30 },
  sectionTitle: { marginTop: 6, fontFamily: F.display, fontSize: 30, lineHeight: 34, color: C.white, textTransform: "uppercase" },
  compareCard: { padding: 14, borderRadius: 18, backgroundColor: "rgba(255,247,237,0.04)", borderLeftWidth: 3, gap: 6 },
  compareName: { fontFamily: F.display, fontSize: 20, textTransform: "uppercase" },
  compareLine: { flexDirection: "row", gap: 10 },
  compareLabel: { width: 82, fontFamily: F.label, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: C.ash, paddingTop: 1 },
  compareValue: { flex: 1, fontSize: 14, lineHeight: 19, color: C.white },
  summary: { marginTop: 14, padding: 16, borderRadius: 18, gap: 8 },
  summaryText: { fontFamily: F.labelHeavy, fontSize: 18, lineHeight: 22, letterSpacing: 0.4, color: C.white },
  guideText: { fontSize: 13.5, lineHeight: 19, color: "rgba(255,247,237,0.85)" },
  sponsorCard: { padding: 18, borderRadius: 22, overflow: "hidden", backgroundColor: "#131313", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,209,102,0.3)" },
  sponsorHeadline: { marginTop: 6, fontFamily: F.display, fontSize: 26, lineHeight: 30, color: C.white, textTransform: "uppercase" },
  sponsorBody: { marginTop: 8, fontSize: 14, lineHeight: 20, color: "rgba(255,247,237,0.88)" },
  sponsorFoot: { marginTop: 10, fontSize: 12, color: C.ash },
  dealsBtn: { marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 46, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,209,102,0.55)" },
  dealsBtnText: { fontFamily: F.labelHeavy, fontSize: 14.5, letterSpacing: 1.2, textTransform: "uppercase", color: C.gold },
  founders: { padding: 18, borderRadius: 24, overflow: "hidden", gap: 6, borderWidth: 1, borderColor: "rgba(255,209,102,0.4)" },
  foundersPill: { fontFamily: F.labelHeavy, fontSize: 11, letterSpacing: 1.3, color: C.ash },
  foundersTitle: { marginTop: 8, fontFamily: F.display, fontSize: 26, lineHeight: 30, color: C.white },
  foundersTag: { fontFamily: F.labelHeavy, fontSize: 15, letterSpacing: 0.5, color: C.gold },
  footer: { flexDirection: "row", gap: 8, marginHorizontal: 20, marginTop: 24 },
  footerText: { flex: 1, fontSize: 12, lineHeight: 17, color: C.ash },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "90%", borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: "#141414", borderTopWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,247,237,0.14)" },
  handle: { alignSelf: "center", width: 42, height: 4, borderRadius: 2, marginTop: 10, backgroundColor: "rgba(255,247,237,0.22)" },
  sheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 8 },
  backLink: { flexDirection: "row", alignItems: "center", gap: 6 },
  backLinkText: { fontFamily: F.label, fontSize: 14, letterSpacing: 1.4, textTransform: "uppercase", color: C.ash },
  devBanner: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16, padding: 12, borderRadius: 14, backgroundColor: "rgba(255,209,102,0.1)", borderWidth: 1, borderColor: "rgba(255,209,102,0.35)" },
  devBannerText: { flex: 1, fontFamily: F.labelHeavy, fontSize: 14, letterSpacing: 0.8, color: C.gold },
  detailRow: { flexDirection: "row", gap: 10 },
  detailTitle: { fontSize: 15, fontWeight: "700", color: C.white },
  detailText: { marginTop: 2, fontSize: 13, lineHeight: 18, color: "rgba(255,247,237,0.75)" },
  infoBox: { flexDirection: "row", gap: 8, marginTop: 14, padding: 12, borderRadius: 14, backgroundColor: "rgba(255,247,237,0.04)" },
  infoText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: C.ash },
  backBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, marginHorizontal: 16, marginTop: 8, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,247,237,0.2)" },
  previewBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 14 },
  previewBtnText: { fontFamily: F.labelHeavy, fontSize: 15, letterSpacing: 1.3, textTransform: "uppercase", color: "#1c0f00" },
  backBtnText: { fontFamily: F.label, fontSize: 15, letterSpacing: 1.5, textTransform: "uppercase", color: C.white },
});
