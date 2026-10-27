import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ScrollViewInstance } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Crown,
  Eye,
  Handshake,
  Inbox,
  Lightbulb,
  MessageSquare,
  MousePointerClick,
  Percent,
  Sparkles,
  UserCheck,
  UserPlus,
} from "lucide-react-native";
import { Glows } from "../components/Tone";
import { IconBtn, Label, PageHeader, tap } from "../components/ui";
import type { PremiumFeature } from "../membership/entitlements";
import { useMembership } from "../membership/MembershipContext";
import { ComingSoonPill } from "../membership/PremiumScreen";
import { BarChart } from "../pro/Charts";
import { LockedFeatureSheet, ProSection } from "../pro/ProGate";
import { C, DIAG, F, NAV_GAP, NAV_HEIGHT } from "../theme";
import type { CoachDemoState, CoachService, Partnership, PeriodId, Program } from "./coachData";
import { COACH_COPY, PERIODS, RATE_FORMULAS, VISIT_WINDOWS, businessInsights, coachTotals, funnel, inquiriesChart, inquirySources } from "./coachData";
import { BookingSection, InquirySection } from "./CoachBooking";
import { LeadDetailSheet, LeadsSection } from "./CoachLeads";
import { CoachProfileSection, PartnershipSheet, PartnershipsSection, ResultsSection } from "./CoachResults";
import { ChallengeSection, ProgramSheet, ProgramsSection, ServiceSheet, ServicesSection } from "./CoachServices";
import { Card, INK, cs } from "./coachUi";

type Tab = "overview" | "leads" | "inquiry" | "services" | "results" | "partners" | "profile";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "leads", label: "Leads" },
  { id: "inquiry", label: "Inquiry & Booking" },
  { id: "services", label: "Services & Programs" },
  { id: "results", label: "Client Results" },
  { id: "partners", label: "Partnerships" },
  { id: "profile", label: "Profile" },
];
type ServiceTab = "services" | "programs" | "challenges";

type Props = {
  onBack: () => void;
  onOpenPremium: () => void;
  onToast: (m: string) => void;
  state: CoachDemoState;
  onChange: (patch: Partial<CoachDemoState>) => void;
};

/** Coach Pro "Coach Command Center" preview. Fictional demo data and local state only. */
export function CoachCommandCenter({ onBack, onOpenPremium, onToast, state, onChange }: Props) {
  const insets = useSafeAreaInsets();
  const membership = useMembership();
  const scroll = useRef<ScrollViewInstance>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [svcTab, setSvcTab] = useState<ServiceTab>("services");
  const [period, setPeriod] = useState<PeriodId>("30d");
  const [locked, setLocked] = useState<PremiumFeature | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [service, setService] = useState<CoachService | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [partnership, setPartnership] = useState<Partnership | null>(null);
  const unlocked = membership.can("coach_business_dashboard");
  const goTab = (t: Tab) => { setTab(t); scroll.current?.scrollTo({ y: 0, animated: false }); };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView ref={scroll} contentContainerStyle={{ paddingBottom: insets.bottom + NAV_GAP + NAV_HEIGHT + 28 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" stickyHeaderIndices={[2]}>
        <PageHeader top={insets.top} kicker="Coach Pro" title="Command Center" leading={<IconBtn label="Back" onPress={onBack}><ArrowLeft size={20} color={C.white} /></IconBtn>} />

        <LinearGradient colors={["#221a0a", "#14110b", "#0d0d0d"]} start={DIAG.start} end={DIAG.end} style={s.hero}>
          <Glows glows={[{ color: C.gold, cx: "100%", cy: "0%", rx: "80%", ry: "90%", opacity: 0.22 }, { color: "#FFF7ED", cx: "0%", cy: "100%", rx: "70%", ry: "70%", opacity: 0.08 }]} />
          <View style={s.heroTop}>
            <View style={s.tag}><ClipboardList size={13} color={INK} /><Text style={s.tagText}>COACH</Text></View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <CalendarDays size={18} color="rgba(255,247,237,0.7)" />
              <Handshake size={18} color="rgba(255,247,237,0.7)" />
            </View>
          </View>
          <Text style={s.heroTitle}>{COACH_COPY.title}</Text>
          <Text style={s.heroSub}>{COACH_COPY.subtitle}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <ComingSoonPill label={COACH_COPY.pill} />
            {unlocked ? <View style={s.demoTag}><Text style={s.demoTagText}>DEMO · {membership.plan.displayName.toUpperCase()}</Text></View> : null}
          </View>
          <Text style={s.distinction}>{COACH_COPY.distinction}</Text>
          <Text style={s.heroNote}>{COACH_COPY.noGuarantee}</Text>
          {!unlocked ? (
            <Pressable accessibilityRole="button" onPress={() => { tap(); onOpenPremium(); }} style={s.heroLink}>
              <Crown size={15} color={C.gold} />
              <Text style={s.heroLinkText}>See GYMX Premium</Text>
              <ArrowRight size={15} color={C.gold} />
            </Pressable>
          ) : null}
        </LinearGradient>

        <View style={s.stickyBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
            {TABS.map((t) => {
              const on = t.id === tab;
              return (
                <Pressable key={t.id} accessibilityRole="tab" accessibilityState={{ selected: on }} aria-selected={on} onPress={() => { tap(); goTab(t.id); }} style={[s.tabBtn, on && s.tabOn]}>
                  <Text style={[s.tabText, on && { color: INK }]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {tab === "overview" ? (
            <View style={s.periods} accessibilityRole="tablist" accessibilityLabel="Time period">
              {PERIODS.map((p) => {
                const on = p.id === period;
                return (
                  <Pressable key={p.id} accessibilityRole="tab" accessibilityState={{ selected: on }} aria-selected={on} onPress={() => { tap(); setPeriod(p.id); }} style={[s.periodBtn, on && s.periodOn]}>
                    <Text style={[s.periodText, on && { color: C.white }]}>{p.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          {tab === "services" ? (
            <View style={s.periods} accessibilityRole="tablist" accessibilityLabel="Services and programs">
              {(["services", "programs", "challenges"] as const).map((id) => {
                const on = id === svcTab;
                return (
                  <Pressable key={id} accessibilityRole="tab" accessibilityState={{ selected: on }} aria-selected={on} onPress={() => { tap(); setSvcTab(id); }} style={[s.periodBtn, on && s.periodOn]}>
                    <Text style={[s.periodText, on && { color: C.white }]}>{id === "services" ? "Services" : id === "programs" ? "Programs" : "Challenges"}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {tab === "overview" ? <Overview period={period} onLocked={setLocked} /> : null}
          {tab === "leads" ? <LeadsSection state={state} onLocked={setLocked} onOpenLead={setLeadId} /> : null}
          {tab === "inquiry" ? (
            <>
              <InquirySection state={state} onChange={onChange} onLocked={setLocked} onToast={onToast} onGoLeads={() => goTab("leads")} />
              <BookingSection state={state} onChange={onChange} onLocked={setLocked} onToast={onToast} />
            </>
          ) : null}
          {tab === "services" && svcTab === "services" ? <ServicesSection state={state} onChange={onChange} onLocked={setLocked} onOpenService={setService} /> : null}
          {tab === "services" && svcTab === "programs" ? <ProgramsSection onLocked={setLocked} onOpen={setProgram} /> : null}
          {tab === "services" && svcTab === "challenges" ? <ChallengeSection state={state} onChange={onChange} onLocked={setLocked} /> : null}
          {tab === "results" ? <ResultsSection state={state} onChange={onChange} onLocked={setLocked} onToast={onToast} /> : null}
          {tab === "partners" ? <PartnershipsSection onLocked={setLocked} onOpen={setPartnership} /> : null}
          {tab === "profile" ? <CoachProfileSection state={state} onChange={onChange} onLocked={setLocked} onToast={onToast} /> : null}
          <Text style={s.footnote}>{COACH_COPY.demoNote}</Text>
        </View>
      </ScrollView>
      <LockedFeatureSheet feature={locked} onClose={() => setLocked(null)} onOpenPremium={onOpenPremium} />
      <LeadDetailSheet leadId={leadId} state={state} onChange={onChange} onClose={() => setLeadId(null)} onToast={onToast} />
      <ServiceSheet service={service} onClose={() => setService(null)} />
      <ProgramSheet program={program} onClose={() => setProgram(null)} />
      <PartnershipSheet partnership={partnership} onClose={() => setPartnership(null)} />
    </View>
  );
}

// ── Overview ────────────────────────────────────────────────────────────────
function Overview({ period, onLocked }: { period: PeriodId; onLocked: (f: PremiumFeature) => void }) {
  const t = coachTotals(period);
  const chart = inquiriesChart(period);
  const stages = funnel(period);
  const sources = inquirySources(period);
  const maxSource = Math.max(1, ...sources.map((x) => x.value));
  const label = PERIODS.find((p) => p.id === period)!.label.toLowerCase();
  const n = (v: number) => v.toLocaleString("en-US");
  const cards: { icon: ReactNode; label: string; value: string; key?: boolean }[] = [
    { icon: <MousePointerClick size={16} color={C.gold} />, label: "Profile visits", value: n(t.profileVisits) },
    { icon: <Inbox size={16} color={C.gold} />, label: "Client inquiries", value: n(t.inquiries), key: true },
    { icon: <UserPlus size={16} color={C.gold} />, label: "New leads", value: n(t.newLeads) },
    { icon: <UserCheck size={16} color={C.gold} />, label: "Qualified leads", value: n(t.qualifiedLeads) },
    { icon: <CalendarDays size={16} color={C.gold} />, label: "Booking requests", value: n(t.bookingRequests) },
    { icon: <CalendarCheck size={16} color={C.gold} />, label: "Consultations scheduled", value: n(t.consultations), key: true },
    { icon: <MessageSquare size={16} color={C.gold} />, label: "Active conversations (mock)", value: n(t.activeConversations) },
    { icon: <Percent size={16} color={C.gold} />, label: "Lead conversion rate", value: `${t.leadConversionRate}%`, key: true },
    { icon: <Eye size={16} color={C.gold} />, label: "Coaching services viewed", value: n(t.servicesViewed) },
    { icon: <Sparkles size={16} color={C.gold} />, label: "Potential client interest", value: n(t.potentialInterest) },
  ];
  const rateValues = [t.profileToInquiryRate, t.qualificationRate, t.leadConversionRate, t.consultationRate];
  return (
    <>
      <ProSection plan="coach" feature="coach_business_dashboard" title="Business overview" subtitle={`Last ${label} · fictional demo coach`} onLocked={onLocked} teaserHeight={320}>
        <View style={s.grid}>
          {cards.map((c) => (
            <View key={c.label} style={[s.statCard, c.key && s.statKey]}>
              <View style={s.statIcon}>{c.icon}</View>
              <Text style={s.statValue}>{c.value}</Text>
              <Text style={s.statLabel}>{c.label}</Text>
            </View>
          ))}
        </View>
        <Text style={[cs.muted, { marginTop: 8 }]}>Potential client interest = visitors who opened the inquiry form after viewing a service.</Text>

        <Card style={{ marginTop: 12 }}>
          <Label style={{ marginBottom: 8 }}>Inquiries by day received</Label>
          <BarChart values={chart.map((b) => b.value)} labels={chart.map((b) => b.label)} format={(v) => String(v)} />
          <Text style={cs.muted}>Bars add up to {t.inquiries} inquiries.</Text>
        </Card>

        <Card style={{ marginTop: 12 }}>
          <Label style={{ marginBottom: 10 }}>Client funnel</Label>
          {stages.map((st, i) => (
            <View key={st.label} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={s.funnelLabel}>{st.label}</Text>
                <Text style={s.funnelValue}>{n(st.value)}</Text>
              </View>
              <View style={s.track}>
                <View style={[s.fill, { width: `${Math.max(2, (st.value / stages[0].value) * 100)}%`, opacity: 1 - i * 0.06 }]} />
              </View>
            </View>
          ))}
          <Text style={cs.muted}>Each stage is a subset of the stage above it.</Text>
        </Card>

        <Card gold style={{ marginTop: 12 }}>
          <Label style={{ marginBottom: 8 }}>Conversion rates & formulas</Label>
          {RATE_FORMULAS.map((r, i) => (
            <View key={r.label} style={s.rateRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.rateLabel}>{r.label}</Text>
                <Text style={cs.muted}>{r.formula}</Text>
              </View>
              <Text style={s.rateValue}>{rateValues[i]}%</Text>
            </View>
          ))}
        </Card>
      </ProSection>

      <ProSection plan="coach" feature="coach_business_dashboard" title="Business insights" subtitle="Demonstrations based on fictional data" onLocked={onLocked} teaserHeight={240}>
        <Card>
          <Label style={{ marginBottom: 8 }}>Where inquiries come from</Label>
          {sources.map((x) => (
            <View key={x.id} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={s.funnelLabel}>{x.label}</Text>
                <Text style={s.funnelValue}>{x.value}</Text>
              </View>
              <View style={s.track}><View style={[s.fill, { width: `${(x.value / maxSource) * 100}%` }]} /></View>
            </View>
          ))}
          <Label style={{ marginTop: 6, marginBottom: 8 }}>Profile visits by time · demo week</Label>
          <View style={s.windows}>
            {VISIT_WINDOWS.map((w) => (
              <View key={w.label} style={{ flex: 1, alignItems: "center", gap: 4 }}>
                <View style={s.windowTrack}><View style={[s.windowFill, { height: `${w.level}%` }]} /></View>
                <Text style={s.windowLabel} numberOfLines={2}>{w.label}</Text>
              </View>
            ))}
          </View>
        </Card>
        <View style={{ gap: 8, marginTop: 12 }}>
          {businessInsights(period).map((text) => (
            <View key={text} style={cs.note}><Lightbulb size={16} color={C.gold} /><Text style={cs.noteText}>{text}</Text></View>
          ))}
        </View>
        <Text style={[cs.muted, { marginTop: 8 }]}>Not real recommendations. No real user behaviour is tracked, and nothing here predicts leads, clients or income.</Text>
      </ProSection>
    </>
  );
}

const s = StyleSheet.create({
  hero: { marginHorizontal: 16, padding: 18, borderRadius: 24, overflow: "hidden", gap: 10, borderWidth: 1, borderColor: "rgba(255,209,102,0.35)" },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tag: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, height: 24, borderRadius: 7, backgroundColor: C.gold },
  tagText: { fontFamily: F.labelHeavy, fontSize: 11, letterSpacing: 1.6, color: INK },
  heroTitle: { fontFamily: F.display, fontSize: 34, lineHeight: 38, color: C.white },
  heroSub: { fontSize: 15, fontWeight: "600", color: "rgba(255,247,237,0.9)" },
  distinction: { fontFamily: F.labelHeavy, fontSize: 14, letterSpacing: 0.4, lineHeight: 19, color: C.gold },
  heroNote: { fontSize: 12, lineHeight: 17, color: "rgba(255,247,237,0.72)" },
  heroLink: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  heroLinkText: { fontFamily: F.labelHeavy, fontSize: 14, letterSpacing: 1.2, textTransform: "uppercase", color: C.gold },
  demoTag: { height: 26, paddingHorizontal: 10, borderRadius: 13, justifyContent: "center", backgroundColor: "rgba(255,247,237,0.1)" },
  demoTagText: { fontFamily: F.labelHeavy, fontSize: 11, letterSpacing: 1.4, color: C.white },
  stickyBar: { backgroundColor: "rgba(9,9,9,0.97)", paddingVertical: 10, gap: 8 },
  tabs: { paddingHorizontal: 16, gap: 8 },
  tabBtn: { height: 36, paddingHorizontal: 14, borderRadius: 18, justifyContent: "center", backgroundColor: "rgba(255,247,237,0.06)", borderWidth: 1, borderColor: "rgba(255,247,237,0.08)" },
  tabOn: { backgroundColor: C.gold, borderColor: C.gold },
  tabText: { fontFamily: F.labelHeavy, fontSize: 14, letterSpacing: 1, textTransform: "uppercase", color: "rgba(255,247,237,0.72)" },
  periods: { flexDirection: "row", marginHorizontal: 16, padding: 3, borderRadius: 12, backgroundColor: "rgba(255,247,237,0.05)" },
  periodBtn: { flex: 1, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  periodOn: { backgroundColor: "rgba(255,209,102,0.18)", borderWidth: 1, borderColor: C.gold },
  periodText: { fontFamily: F.labelHeavy, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", color: C.ash },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "48%", flexGrow: 1, padding: 12, borderRadius: 16, backgroundColor: "#131210", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,247,237,0.1)", gap: 3 },
  statKey: { borderColor: "rgba(255,209,102,0.5)", backgroundColor: "#17140c" },
  statIcon: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,209,102,0.12)", marginBottom: 4 },
  statValue: { fontFamily: F.display, fontSize: 24, lineHeight: 28, color: C.white },
  statLabel: { fontFamily: F.label, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: C.ash },
  funnelLabel: { fontSize: 13, color: "rgba(255,247,237,0.82)" },
  funnelValue: { fontFamily: F.labelHeavy, fontSize: 14, color: C.white },
  track: { height: 8, marginTop: 4, borderRadius: 4, overflow: "hidden", backgroundColor: "rgba(255,247,237,0.06)" },
  fill: { height: "100%", borderRadius: 4, backgroundColor: C.gold },
  rateRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,247,237,0.08)" },
  rateLabel: { fontFamily: F.labelHeavy, fontSize: 14.5, color: C.white },
  rateValue: { fontFamily: F.display, fontSize: 22, color: C.gold },
  windows: { flexDirection: "row", gap: 6 },
  windowTrack: { width: "100%", height: 70, borderRadius: 8, justifyContent: "flex-end", overflow: "hidden", backgroundColor: "rgba(255,247,237,0.05)" },
  windowFill: { width: "100%", borderRadius: 8, backgroundColor: C.gold },
  windowLabel: { fontSize: 10, textAlign: "center", color: C.ash },
  footnote: { marginTop: 22, fontSize: 12, lineHeight: 17, textAlign: "center", color: C.ash },
});
