import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ArrowRight, Briefcase, Check, Clock, Info, Layers, Minus, Sparkles, X, Zap } from "lucide-react-native";
import { Glows } from "../components/Tone";
import { Button, GradText, IconBtn, Label, SectionHeader, TopBar, useReducedMotion } from "../components/ui";
import type { Tone } from "../components/ui";
import { Rise } from "../screens/Welcome";
import { C, DIAG, F, GRAD, GRAD_GOLD, GUTTER, LINE, NAV_GAP, NAV_HEIGHT, RADIUS, SURFACE, TEXT, TINT, TYPE } from "../theme";
import type { PlanFeature, PremiumPlan, PremiumPlanId } from "./premiumContent";
import { FounderBadge } from "../founders/FounderBadge";
import { FOUNDER_COPY } from "../founders/foundersData";
import { TIER_INHERITS, hasEntitlement } from "./entitlements";
import { TIERS } from "./tiers";
import { PLAN_COMPARISON, PREMIUM_COPY, PREMIUM_PLANS } from "./premiumContent";

/** Each plan's identity: gold (GYMX Pro), Inferno (Creator Pro), bone (Coach Pro). */
type PlanLook = { tone: Tone; accent: string; mark: readonly [string, string]; markInk: string };
const LOOKS: Record<PremiumPlan["theme"], PlanLook> = {
  gold: { tone: "gold", accent: C.gold, mark: GRAD_GOLD, markInk: TEXT.onGold },
  ember: { tone: "flame", accent: C.flame, mark: GRAD, markInk: "#fff" },
  coach: { tone: "bone", accent: "#EADFCF", mark: ["#FFF7ED", "#E2D3BD"], markInk: "#1c1407" },
};
const ICONS = { Zap, Sparkles, Briefcase } as const;
const PREVIEW_COUNT = 4;
/** Plans with an interactive demo screen. */
const PREVIEW_LABELS: Partial<Record<PremiumPlanId, string>> = { GYMVERSE_PRO: "Preview Pro progress tools", CREATOR_PRO: "Preview Creator Studio", COACH_PRO: "Preview Coach Command Center" };
const SHORT_NAMES: Record<PremiumPlanId, string> = { GYMVERSE_PRO: "Pro", CREATOR_PRO: "Creator", COACH_PRO: "Coach" };
const lookOf = (id: PremiumPlanId) => LOOKS[PREMIUM_PLANS.find((p) => p.id === id)!.theme];
/** Creator Pro and Coach Pro build on GYMX Pro (read from the entitlement hierarchy, never hard-coded). */
const includesPro = (id: PremiumPlanId) => TIER_INHERITS[id].includes("GYMVERSE_PRO");

/** GYMX Premium discovery screen. Informational only: every plan is Coming Soon and nothing can be purchased. */
export function PremiumScreen({ onBack, onExplore, onDeals, onFounders }: { onBack: () => void; onExplore: (plan: PremiumPlanId) => void; onDeals?: () => void; onFounders?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: insets.bottom + NAV_GAP + NAV_HEIGHT + 32 }} showsVerticalScrollIndicator={false}>
      <View style={s.heroGlow} pointerEvents="none">
        <Glows glows={[{ color: C.flame, cx: "0%", cy: "0%", rx: "90%", ry: "70%", opacity: 0.2 }, { color: C.gold, cx: "100%", cy: "20%", rx: "70%", ry: "55%", opacity: 0.08 }]} />
      </View>

      <TopBar top={insets.top} kicker={PREMIUM_COPY.kicker} onBack={onBack} backLabel="Back to profile" />

      <View style={s.hero}>
        <Rise delay={40}><ComingSoonPill label={PREMIUM_COPY.banner} large /></Rise>
        <Rise delay={100} style={{ marginTop: 18 }}>
          <Text style={s.heading} accessibilityRole="header">UNLOCK YOUR</Text>
          <GradText style={s.heading}>GYMX POTENTIAL</GradText>
        </Rise>
        <Rise delay={160}><Text style={s.subtitle}>{PREMIUM_COPY.subtitle}</Text></Rise>
        <Rise delay={220} style={s.freeNote}>
          <Check size={16} color={C.gold} strokeWidth={2.8} style={{ marginTop: 2 }} />
          <Text style={s.freeNoteText}>{PREMIUM_COPY.freeNote}</Text>
        </Rise>
      </View>

      <View style={s.plans}>
        {PREMIUM_PLANS.map((plan, i) => (
          <Rise key={plan.id} delay={260 + i * 70}>
            <PlanCard plan={plan} onExplore={() => onExplore(plan.id)} />
          </Rise>
        ))}
      </View>

      <Comparison />
      <SponsorBenefits onDeals={onDeals} />
      {onFounders ? <FoundersTeaser onFounders={onFounders} /> : null}

      <View style={s.footer}>
        <Info size={14} color={TEXT.tertiary} style={{ marginTop: 1 }} />
        <Text style={s.footerText}>{PREMIUM_COPY.previewNote}</Text>
      </View>
    </ScrollView>
  );
}

/** Availability tag. Paid plans have no price yet, so this sits where a price would. */
export function ComingSoonPill({ label = "COMING SOON", large = false }: { label?: string; large?: boolean }) {
  const pulse = useRef(new Animated.Value(0.4)).current;
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) { pulse.setValue(1); return; }
    const loop = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }), Animated.timing(pulse, { toValue: 0.4, duration: 900, useNativeDriver: true })]));
    loop.start();
    return () => loop.stop();
  }, [pulse, reduced]);
  return (
    <View style={[s.pill, large && s.pillLarge]} accessibilityRole="text" accessibilityLabel={label}>
      <Animated.View style={[s.pillDot, { opacity: pulse }]} />
      <Text style={[s.pillText, large && { fontSize: 13 }]}>{label}</Text>
    </View>
  );
}

function PlanMark({ plan, size = 40 }: { plan: PremiumPlan; size?: number }) {
  const look = LOOKS[plan.theme];
  const Icon = ICONS[plan.icon];
  return (
    <LinearGradient colors={look.mark} start={DIAG.start} end={DIAG.end} style={{ width: size, height: size, borderRadius: Math.round(size * 0.3), alignItems: "center", justifyContent: "center" }}>
      <Icon size={Math.round(size * 0.48)} color={look.markInk} strokeWidth={2.2} />
    </LinearGradient>
  );
}

function IncludesPro({ accent }: { accent: string }) {
  return (
    <View style={s.includes}>
      <Layers size={14} color={accent} strokeWidth={2.3} />
      <Text style={s.includesText}>Includes everything in {TIERS.GYMVERSE_PRO.displayName}</Text>
    </View>
  );
}

function PlanCard({ plan, onExplore }: { plan: PremiumPlan; onExplore: () => void }) {
  const look = LOOKS[plan.theme];
  const extra = plan.features.length - PREVIEW_COUNT;
  return (
    <View style={s.card}>
      <Glows glows={[{ color: look.accent, cx: "100%", cy: "0%", rx: "80%", ry: "38%", opacity: 0.09 }]} />
      <LinearGradient colors={[look.accent, "rgba(0,0,0,0)"]} start={{ x: 0, y: 0.5 }} end={{ x: 0.85, y: 0.5 }} style={s.cardEdge} pointerEvents="none" />
      <View style={s.cardTop}>
        <PlanMark plan={plan} />
        <ComingSoonPill />
      </View>
      <Text style={s.planName} accessibilityRole="header">{plan.name}</Text>
      <Text style={[s.tagline, { color: look.accent }]}>{plan.tagline}</Text>
      <View style={s.spec}>
        <Text style={s.specLabel}>Built for</Text>
        <Text style={s.specValue}>{plan.audience}</Text>
      </View>
      <View style={s.rule} />
      {includesPro(plan.id) ? <IncludesPro accent={look.accent} /> : null}
      <View style={s.features}>
        {plan.features.slice(0, PREVIEW_COUNT).map((f) => (
          <View key={f.title} style={s.featureRow}>
            <Check size={16} color={look.accent} strokeWidth={2.8} />
            <Text style={s.featureText}>{f.title}</Text>
          </View>
        ))}
      </View>
      {extra > 0 ? <Text style={s.more}>+ {extra} more in the full overview</Text> : null}
      {plan.note ? <View style={{ marginTop: 14 }}><Fine>{plan.note}</Fine></View> : null}
      <Button title={plan.ctaLabel} onPress={onExplore} variant="tinted" tone={look.tone} trailingIcon={ArrowRight} style={{ marginTop: 18 }} />
    </View>
  );
}

/** Capability matrix: rows reuse each plan's feature copy; ticks come from the entitlement config. */
const MATRIX: { group: string; plan: PremiumPlanId; titles: string[] }[] = [
  { group: "Progress & training", plan: "GYMVERSE_PRO", titles: ["Advanced progress tracking", "PR history charts", "Premium challenges", "Reduced sponsored feed frequency"] },
  { group: "Creator tools", plan: "CREATOR_PRO", titles: ["Creator analytics", "Scheduled content preview", "Brand campaign opportunities"] },
  { group: "Coach tools", plan: "COACH_PRO", titles: ["Lead dashboard", "Booking/contact form previews", "Testimonials"] },
];
const MATRIX_ROWS = MATRIX.map((g) => {
  const plan = PREMIUM_PLANS.find((p) => p.id === g.plan)!;
  return { group: g.group, features: g.titles.map((t) => plan.features.find((f) => f.title === t)).filter((f): f is PlanFeature => !!f) };
});
const COL = 58;

function Comparison() {
  return (
    <View style={s.section}>
      <SectionHeader eyebrow="Compare" accent title={PREMIUM_COPY.comparisonTitle} />
      <View style={s.matrixHead} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={{ flex: 1 }} />
        {PREMIUM_PLANS.map((p) => <Text key={p.id} style={[s.colHead, { color: LOOKS[p.theme].accent }]}>{SHORT_NAMES[p.id]}</Text>)}
      </View>
      {MATRIX_ROWS.map((g) => (
        <View key={g.group}>
          <Label style={s.matrixGroup}>{g.group}</Label>
          {g.features.map((f) => {
            const included = PREMIUM_PLANS.filter((p) => hasEntitlement(p.id, f.entitlement));
            return (
              <View key={f.title} style={s.matrixRow} accessible accessibilityLabel={`${f.title}: ${included.map((p) => p.name).join(", ")}`}>
                <Text style={s.matrixLabel}>{f.title}</Text>
                {PREMIUM_PLANS.map((p) => (
                  <View key={p.id} style={s.cell}>
                    {included.includes(p) ? <Check size={17} color={LOOKS[p.theme].accent} strokeWidth={2.8} /> : <Minus size={14} color={TEXT.disabled} />}
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      ))}

      <Label style={{ marginTop: 32, marginBottom: 6 }}>Who each plan is for</Label>
      {PLAN_COMPARISON.map((row) => (
        <View key={row.plan} style={s.guideRow}>
          <View style={[s.guideBar, { backgroundColor: lookOf(row.plan).accent }]} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={[s.guideName, { color: lookOf(row.plan).accent }]}>{row.name}</Text>
            <Text style={s.guideGoal}>{row.goal}</Text>
            <Text style={s.guideMeta}>Best for {row.bestFor.toLowerCase()} · {row.mainTools}</Text>
          </View>
        </View>
      ))}

      <View style={s.summary}>
        <LinearGradient colors={GRAD} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={s.summaryBar} />
        <View style={{ flex: 1, gap: 8 }}>
          <Text style={s.summaryText}>{PREMIUM_COPY.comparisonSummary}</Text>
          <Text style={s.body}>{PREMIUM_COPY.comparisonGuide}</Text>
        </View>
      </View>
    </View>
  );
}

function SponsorBenefits({ onDeals }: { onDeals?: () => void }) {
  return (
    <View style={s.section}>
      <SectionHeader eyebrow="Sponsored content" accent title={PREMIUM_COPY.sponsorHeadline} />
      <Text style={s.body}>{PREMIUM_COPY.sponsorBody}</Text>
      <Text style={[s.fineText, { marginTop: 10 }]}>{PREMIUM_COPY.sponsorFootnote}</Text>
      {onDeals ? <Button title="Preview Pro Deals" onPress={onDeals} variant="tinted" tone="gold" icon={Sparkles} style={{ marginTop: 18, alignSelf: "flex-start" }} /> : null}
    </View>
  );
}

/** Founders is a recognition concept, kept visually and logically apart from the paid plans above. */
function FoundersTeaser({ onFounders }: { onFounders: () => void }) {
  return (
    <View style={s.section}>
      <View style={s.founders}>
        <LinearGradient colors={["rgba(255,209,102,0.1)", "rgba(255,209,102,0)"]} start={{ x: 0, y: 0 }} end={{ x: 0.7, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <FounderBadge />
          <Text style={s.foundersPill}>{FOUNDER_COPY.pill}</Text>
        </View>
        <Text style={s.foundersTitle}>{FOUNDER_COPY.title}</Text>
        <Text style={s.foundersTag}>{FOUNDER_COPY.tagline}</Text>
        <Text style={[s.body, { marginTop: 8 }]}>{FOUNDER_COPY.description}</Text>
        <Text style={[s.fineText, { marginTop: 10 }]}>{FOUNDER_COPY.separation} {FOUNDER_COPY.notFinal}</Text>
        <Button title="Explore Founders" onPress={onFounders} variant="tinted" tone="gold" trailingIcon={ArrowRight} style={{ marginTop: 18 }} />
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
  const look = LOOKS[plan.theme];
  const preview = PREVIEW_LABELS[plan.id];
  return (
    <View style={[s.sheet, { paddingBottom: Math.max(bottom, 16) }]}>
      <View style={s.handle} />
      <View style={s.sheetHead}>
        <PlanMark plan={plan} size={36} />
        <ComingSoonPill />
        <View style={{ flex: 1 }} />
        <IconBtn label="Close plan overview" onPress={onClose} size={34}><X size={18} color={C.white} /></IconBtn>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        <Text style={s.sheetTitle} accessibilityRole="header">{plan.name}</Text>
        <Text style={[s.tagline, { color: look.accent }]}>{plan.tagline}</Text>
        <Text style={[s.bodySecondary, { marginTop: 8 }]}>{plan.audience}</Text>
        <View style={s.devRow}>
          <Clock size={15} color={C.gold} strokeWidth={2.3} />
          <Text style={s.devText}>{PREMIUM_COPY.inDevelopment}</Text>
        </View>

        <View style={s.rule} />
        {includesPro(plan.id) ? <IncludesPro accent={look.accent} /> : null}
        <Label style={{ marginBottom: 14 }}>What's planned</Label>
        <View style={{ gap: 16 }}>
          {plan.features.map((f) => (
            <View key={f.title} style={s.detailRow}>
              <Check size={16} color={look.accent} strokeWidth={2.8} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.detailTitle}>{f.title}</Text>
                <Text style={s.detailText}>{f.detail}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={s.rule} />
        <Label style={{ marginBottom: 12 }}>Good to know</Label>
        <View style={{ gap: 10 }}>
          {plan.note ? <Fine>{plan.note}</Fine> : null}
          <Fine>{PREMIUM_COPY.sponsorFootnote}</Fine>
          <Fine>{PREMIUM_COPY.previewNote}</Fine>
        </View>
      </ScrollView>
      <View style={s.sheetActions}>
        {preview && onPreview ? <Button title={preview} onPress={() => onPreview(plan.id)} variant="solid" tone={look.tone} size="lg" icon={Sparkles} /> : null}
        <Button title="Back to Premium" onPress={onClose} variant="ghost" tone="bone" icon={ArrowLeft} />
      </View>
    </View>
  );
}

function Fine({ children }: { children: ReactNode }) {
  return (
    <View style={s.fineRow}>
      <Info size={13} color={TEXT.tertiary} style={{ marginTop: 2 }} />
      <Text style={s.fineText}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  heroGlow: { position: "absolute", top: 0, left: 0, right: 0, height: 480 },
  hero: { paddingHorizontal: GUTTER, paddingTop: 12 },
  heading: { ...TYPE.hero },
  subtitle: { marginTop: 12, fontSize: 17, lineHeight: 23, fontWeight: "600", color: TEXT.secondary },
  freeNote: { flexDirection: "row", gap: 10, marginTop: 18 },
  freeNoteText: { flex: 1, fontSize: 13.5, lineHeight: 19, color: TEXT.tertiary },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", height: 24, paddingHorizontal: 9, borderRadius: RADIUS.xs, backgroundColor: TINT.gold },
  pillLarge: { height: 30, paddingHorizontal: 12, borderRadius: RADIUS.sm },
  pillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.gold },
  pillText: { ...TYPE.tag, fontSize: 12, letterSpacing: 1.4, color: C.gold },
  plans: { paddingHorizontal: 16, gap: 14, marginTop: 32 },
  card: { borderRadius: 24, padding: 20, overflow: "hidden", backgroundColor: SURFACE.raised },
  cardEdge: { position: "absolute", top: 0, left: 0, right: 0, height: 1.5, opacity: 0.75 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  planName: { ...TYPE.title, marginTop: 16 },
  tagline: { marginTop: 4, fontSize: 15, lineHeight: 20, fontWeight: "700" },
  spec: { flexDirection: "row", gap: 12, marginTop: 12 },
  specLabel: { ...TYPE.eyebrow, width: 66, paddingTop: 2 },
  specValue: { flex: 1, fontSize: 13.5, lineHeight: 19, color: TEXT.secondary },
  rule: { height: StyleSheet.hairlineWidth, marginVertical: 18, backgroundColor: LINE.hairline },
  includes: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  includesText: { fontSize: 13.5, fontWeight: "600", color: TEXT.primary },
  features: { gap: 11 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureText: { flex: 1, fontSize: 15, lineHeight: 20, color: TEXT.primary },
  more: { marginTop: 12, marginLeft: 28, fontSize: 13, color: TEXT.tertiary },
  section: { paddingHorizontal: GUTTER, marginTop: 48 },
  matrixHead: { flexDirection: "row", alignItems: "flex-end", paddingBottom: 4 },
  colHead: { width: COL, textAlign: "center", fontFamily: F.labelHeavy, fontSize: 12.5, letterSpacing: 1.1, textTransform: "uppercase" },
  matrixGroup: { marginTop: 18, marginBottom: 2 },
  matrixRow: { flexDirection: "row", alignItems: "center", minHeight: 46, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: LINE.hairline },
  matrixLabel: { flex: 1, paddingVertical: 10, paddingRight: 8, fontSize: 14, lineHeight: 19, color: TEXT.primary },
  cell: { width: COL, alignItems: "center", justifyContent: "center" },
  guideRow: { flexDirection: "row", gap: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: LINE.hairline },
  guideBar: { width: 3, borderRadius: 2 },
  guideName: { fontFamily: F.labelHeavy, fontSize: 15, letterSpacing: 1, textTransform: "uppercase" },
  guideGoal: { fontSize: 15, lineHeight: 20, fontWeight: "600", color: TEXT.primary },
  guideMeta: { fontSize: 13, lineHeight: 18, color: TEXT.tertiary },
  summary: { flexDirection: "row", gap: 16, marginTop: 28 },
  summaryBar: { width: 3, borderRadius: 2 },
  summaryText: { fontFamily: F.labelHeavy, fontSize: 19, lineHeight: 23, letterSpacing: 0.3, color: TEXT.primary },
  body: { fontSize: 15, lineHeight: 22, color: TEXT.secondary },
  bodySecondary: { fontSize: 14, lineHeight: 20, color: TEXT.secondary },
  founders: { padding: 20, borderRadius: 24, overflow: "hidden", backgroundColor: SURFACE.raised },
  foundersPill: { ...TYPE.tag, color: TEXT.tertiary },
  foundersTitle: { ...TYPE.section, fontSize: 26, lineHeight: 30, marginTop: 16 },
  foundersTag: { marginTop: 4, fontFamily: F.labelHeavy, fontSize: 16, letterSpacing: 0.4, color: C.gold },
  footer: { flexDirection: "row", gap: 8, marginHorizontal: GUTTER, marginTop: 40 },
  footerText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: TEXT.tertiary },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: SURFACE.scrim },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "90%", borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, backgroundColor: SURFACE.sheet },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginTop: 10, backgroundColor: "rgba(255,247,237,0.2)" },
  sheetHead: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: GUTTER, paddingTop: 10, paddingBottom: 6 },
  sheetTitle: { ...TYPE.title, marginTop: 10 },
  devRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 },
  devText: { flex: 1, fontFamily: F.labelHeavy, fontSize: 14, letterSpacing: 0.6, color: C.gold },
  detailRow: { flexDirection: "row", gap: 12 },
  detailTitle: { fontSize: 15, lineHeight: 20, fontWeight: "700", color: TEXT.primary },
  detailText: { marginTop: 2, fontSize: 13.5, lineHeight: 19, color: TEXT.secondary },
  fineRow: { flexDirection: "row", gap: 8 },
  fineText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: TEXT.tertiary },
  sheetActions: { gap: 2, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: LINE.hairline },
});
