import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Award, Camera, Crown, Dumbbell, Flag, Flame, Lock, MessageSquareQuote, Minus, NotebookPen, Sparkles, Target, TrendingUp } from "lucide-react-native";
import { Glows } from "../components/Tone";
import { IconBtn, Label, PageHeader, ProgressRing, tap } from "../components/ui";
import type { PremiumFeature } from "../membership/entitlements";
import { useMembership } from "../membership/MembershipContext";
import { ComingSoonPill } from "../membership/PremiumScreen";
import { C, DIAG, F, GRAD, GRAD_GOLD, NAV_GAP, NAV_HEIGHT } from "../theme";
import { BarChart, Heatmap, LineChart } from "./Charts";
import { CompareSlider } from "./CompareSlider";
import { LockedFeatureSheet, ProSection } from "./ProGate";
import type { LiftId, PrivateEntry, PrivateEntryKind } from "./proData";
import {
  CHECKIN_BANNER,
  CHECKIN_SCRIPT_NOTE,
  CHECKIN_TITLE,
  CHECKIN_WEEKS,
  COMPARISON_DEMO,
  CONSISTENCY_EXPLAINER,
  DEMO_NOTE,
  LIFTS,
  MONTHLY_CONSISTENCY,
  PRIVATE_ENTRIES,
  PR_HISTORY,
  PR_MONTHS,
  STREAK,
  WEEKLY_GOAL,
  WEEKLY_SESSIONS,
  WEEKLY_VOLUME_LBS,
  completedWorkouts,
  consistencyLabel,
  consistencyScore,
  createPrivateNote,
  groupByMonth,
  prImprovement,
  prImprovementPct,
  trainingFrequency,
  volumeTrendPct,
  workoutCalendar,
} from "./proData";

type Tab = "dashboard" | "compare" | "private" | "checkin";
const TABS: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "compare", label: "Compare" },
  { id: "private", label: "Private" },
  { id: "checkin", label: "Check-in" },
];

type Props = {
  onBack: () => void;
  onOpenPremium: () => void;
  privateNotes: PrivateEntry[];
  onAddPrivateNote: (entry: PrivateEntry) => void;
};

/** GYMVERSE Pro advanced progress preview. All content is demo data; everything is Coming Soon. */
export function AdvancedProgressScreen({ onBack, onOpenPremium, privateNotes, onAddPrivateNote }: Props) {
  const insets = useSafeAreaInsets();
  const membership = useMembership();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [locked, setLocked] = useState<PremiumFeature | null>(null);
  const anyUnlocked = membership.can("advanced_progress_tracking");

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + NAV_GAP + NAV_HEIGHT + 28 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" stickyHeaderIndices={[2]}>
        <PageHeader top={insets.top} kicker="GYMVERSE Pro" title="Advanced" leading={<IconBtn label="Back" onPress={onBack}><ArrowLeft size={20} color={C.white} /></IconBtn>} />

        <View style={s.intro}>
          <Glows glows={[{ color: C.gold, cx: "100%", cy: "0%", rx: "70%", ry: "80%", opacity: 0.18 }]} />
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <ComingSoonPill />
            <View style={s.demoPill}><Text style={s.demoPillText}>DEMO DATA</Text></View>
          </View>
          <Text style={s.introText}>
            {anyUnlocked
              ? `Previewing as ${membership.plan.displayName} (developer demo). These features are still in development — nothing here is a real membership.`
              : "A preview of advanced progress tools coming with GYMVERSE Pro. Your progress timeline and personal records stay free."}
          </Text>
          {!anyUnlocked ? (
            <Pressable accessibilityRole="button" onPress={() => { tap(); onOpenPremium(); }} style={s.introLink}>
              <Crown size={15} color={C.gold} />
              <Text style={s.introLinkText}>See GYMVERSE Premium</Text>
              <ArrowRight size={15} color={C.gold} />
            </Pressable>
          ) : null}
        </View>

        <View style={s.tabsWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
            {TABS.map((t) => {
              const on = tab === t.id;
              return (
                <Pressable key={t.id} accessibilityRole="tab" accessibilityState={{ selected: on }} aria-selected={on} onPress={() => { tap(); setTab(t.id); }} style={[s.tab, on && s.tabOn]}>
                  <Text style={[s.tabText, on && { color: "#1c0f00" }]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {tab === "dashboard" ? <Dashboard onLocked={setLocked} /> : null}
          {tab === "compare" ? <Compare onLocked={setLocked} /> : null}
          {tab === "private" ? <PrivateTimeline onLocked={setLocked} notes={privateNotes} onAdd={onAddPrivateNote} /> : null}
          {tab === "checkin" ? <CheckIn onLocked={setLocked} /> : null}
          <Text style={s.footnote}>{DEMO_NOTE} Calculated on this device; nothing is uploaded.</Text>
        </View>
      </ScrollView>
      <LockedFeatureSheet feature={locked} onClose={() => setLocked(null)} onOpenPremium={onOpenPremium} />
    </View>
  );
}

// ── Dashboard ───────────────────────────────────────────────────────────────
function Dashboard({ onLocked }: { onLocked: (f: PremiumFeature) => void }) {
  const [lift, setLift] = useState<LiftId>("bench");
  const [point, setPoint] = useState(PR_MONTHS.length - 1);
  const [explain, setExplain] = useState(false);
  const score = consistencyScore();
  const series = PR_HISTORY[lift];
  const calendar = useMemo(() => workoutCalendar(), []);

  return (
    <>
      <ProSection feature="consistency_score" title="Consistency score" subtitle="Last 8 weeks" onLocked={onLocked} teaserHeight={180}>
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <ProgressRing value={score} size={112} stroke={9}>
              <Text style={s.scoreValue}>{score}</Text>
              <Text style={s.scoreOf}>/100</Text>
            </ProgressRing>
            <View style={{ flex: 1 }}>
              <Text style={s.scoreLabel}>{consistencyLabel(score)}</Text>
              <Text style={s.muted}>{completedWorkouts()} of {WEEKLY_SESSIONS.length * WEEKLY_GOAL} planned workouts · goal {WEEKLY_GOAL}/week</Text>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: explain }} aria-expanded={explain} onPress={() => { tap(); setExplain((v) => !v); }} style={{ marginTop: 8 }}>
                <Text style={s.link}>{explain ? "Hide how it's calculated" : "How is this calculated?"}</Text>
              </Pressable>
            </View>
          </View>
          {explain ? <Text style={[s.muted, { marginTop: 12 }]}>{CONSISTENCY_EXPLAINER}</Text> : null}
        </Card>
      </ProSection>

      <ProSection feature="pr_history_charts" title="PR history" subtitle="Monthly best, last 7 months" onLocked={onLocked}>
        <Card>
          <View style={s.segment} accessibilityRole="tablist">
            {LIFTS.map((l) => {
              const on = l.id === lift;
              return (
                <Pressable key={l.id} accessibilityRole="tab" accessibilityState={{ selected: on }} aria-selected={on} onPress={() => { tap(); setLift(l.id); setPoint(PR_MONTHS.length - 1); }} style={[s.segBtn, on && s.segBtnOn]}>
                  <Text style={[s.segText, on && { color: C.white }]}>{l.short}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={s.prHead}>
            <View>
              <Text style={s.prBig}>{series[point]}<Text style={s.prUnit}> LB</Text></Text>
              <Text style={s.muted}>{LIFTS.find((l) => l.id === lift)!.name} · {PR_MONTHS[point]}</Text>
            </View>
            <View style={s.gain}>
              <TrendingUp size={14} color={C.gold} />
              <Text style={s.gainText}>+{prImprovement(lift)} lb · +{prImprovementPct(lift)}%</Text>
            </View>
          </View>
          <LineChart values={series} labels={PR_MONTHS} unit=" lb" selected={point} onSelect={setPoint} />
          <Text style={[s.muted, { marginTop: 6 }]}>Tap a month to see that PR.</Text>
        </Card>
      </ProSection>

      <ProSection feature="workout_streak_analytics" title="Streak analytics" onLocked={onLocked}>
        <Card>
          <View style={s.statRow}>
            <Stat icon={<Flame size={16} color={C.flame} />} value={`${STREAK.currentDays}`} label="Current streak (days)" />
            <Stat icon={<Award size={16} color={C.gold} />} value={`${STREAK.longestDays}`} label="Longest streak (days)" gold />
          </View>
          <View style={s.statRow}>
            <Stat icon={<Target size={16} color={C.flame} />} value={`${WEEKLY_SESSIONS[WEEKLY_SESSIONS.length - 1]}/${WEEKLY_GOAL}`} label="This week" />
            <Stat icon={<Dumbbell size={16} color={C.flame} />} value={`${completedWorkouts()}`} label="Workout days (8 wks)" />
          </View>
          <Label style={{ marginTop: 16, marginBottom: 10 }}>Training calendar · last 8 weeks</Label>
          <Heatmap weeks={calendar} />
          <Label style={{ marginTop: 18, marginBottom: 8 }}>Monthly consistency</Label>
          <BarChart values={MONTHLY_CONSISTENCY.map((m) => m.pct)} labels={MONTHLY_CONSISTENCY.map((m) => m.month)} height={130} format={(v) => `${v}%`} />
        </Card>
      </ProSection>

      <ProSection feature="advanced_progress_tracking" title="Advanced metrics" onLocked={onLocked}>
        <Card>
          <View style={s.statRow}>
            <Stat icon={<TrendingUp size={16} color={C.gold} />} value={`${volumeTrendPct() >= 0 ? "+" : ""}${volumeTrendPct()}%`} label="Volume, last 4 wks" gold />
            <Stat icon={<Dumbbell size={16} color={C.flame} />} value={`${trainingFrequency()}`} label="Workouts / week" />
          </View>
          <Label style={{ marginTop: 16, marginBottom: 8 }}>Weekly volume (lb lifted)</Label>
          <BarChart values={WEEKLY_VOLUME_LBS} labels={WEEKLY_VOLUME_LBS.map((_, i) => `W${i + 1}`)} format={(v) => `${(v / 1000).toFixed(1)}k`} />
          <Label style={{ marginTop: 16, marginBottom: 10 }}>PR improvements · 7 months</Label>
          {LIFTS.map((l) => (
            <View key={l.id} style={s.prImproveRow}>
              <Text style={s.prImproveName}>{l.name}</Text>
              <View style={s.prImproveTrack}>
                <LinearGradient colors={GRAD} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ height: "100%", width: `${Math.min(100, prImprovementPct(l.id) * 3)}%`, borderRadius: 4 }} />
              </View>
              <Text style={s.prImproveValue}>+{prImprovement(l.id)} lb</Text>
            </View>
          ))}
          <Label style={{ marginTop: 16, marginBottom: 8 }}>Consistency trend · weekly sessions</Label>
          <BarChart values={WEEKLY_SESSIONS} labels={WEEKLY_SESSIONS.map((_, i) => `W${i + 1}`)} height={110} format={(v) => `${v}`} />
        </Card>
      </ProSection>
    </>
  );
}

// ── Transformation comparison ───────────────────────────────────────────────
function Compare({ onLocked }: { onLocked: (f: PremiumFeature) => void }) {
  return (
    <ProSection feature="transformation_comparison" title="Transformation comparison" subtitle="Drag the handle to compare two check-ins" onLocked={onLocked} teaserHeight={300}>
      <CompareSlider />
      <View style={s.compareMeta}>
        <View style={s.compareChip}><Text style={s.compareChipLabel}>{COMPARISON_DEMO.before.label}</Text><Text style={s.compareChipValue}>{COMPARISON_DEMO.before.detail} · 168 lb</Text></View>
        <View style={s.compareChip}><Text style={[s.compareChipLabel, { color: C.flame }]}>{COMPARISON_DEMO.after.label}</Text><Text style={s.compareChipValue}>{COMPARISON_DEMO.after.detail} · 181 lb</Text></View>
      </View>
      <Text style={[s.muted, { marginTop: 10 }]}>{COMPARISON_DEMO.caption}</Text>
      <Text style={[s.muted, { marginTop: 6 }]}>When this launches, you'll pick any two of your own private check-in photos to compare.</Text>
    </ProSection>
  );
}

// ── Private timeline ────────────────────────────────────────────────────────
const KIND_ICON: Record<PrivateEntryKind, typeof Flag> = { note: NotebookPen, milestone: Flag, photo: Camera, reflection: MessageSquareQuote, lift: Dumbbell };

function PrivateTimeline({ onLocked, notes, onAdd }: { onLocked: (f: PremiumFeature) => void; notes: PrivateEntry[]; onAdd: (e: PrivateEntry) => void }) {
  const [draft, setDraft] = useState("");
  const groups = useMemo(() => groupByMonth([...notes, ...PRIVATE_ENTRIES]), [notes]);
  const save = () => {
    const entry = createPrivateNote(draft);
    if (!entry) return;
    tap();
    onAdd(entry);
    setDraft("");
  };
  return (
    <ProSection feature="private_progress_timeline" title="Private timeline" subtitle="Only you can see these entries" onLocked={onLocked} teaserHeight={260}>
      <View style={s.privacyBanner}>
        <Lock size={16} color={C.gold} />
        <Text style={s.privacyText}>Private entries are never posted to the Home Feed. In this demo, notes you add stay in memory on this device and disappear when the app reloads. Photos are placeholders — nothing is uploaded.</Text>
      </View>
      <Card style={{ marginTop: 12 }}>
        <Label style={{ marginBottom: 8 }}>Add a private note</Label>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          maxLength={280}
          multiline
          placeholder="How did training feel today?"
          placeholderTextColor="rgba(255,247,237,0.34)"
          style={s.noteInput}
          accessibilityLabel="Private note"
        />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
          <Text style={s.muted}>{draft.length}/280 · private</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Save private note" disabled={!draft.trim()} onPress={save} style={({ pressed }) => ({ opacity: draft.trim() ? (pressed ? 0.8 : 1) : 0.4 })}>
            <LinearGradient colors={GRAD_GOLD} start={DIAG.start} end={DIAG.end} style={s.saveBtn}>
              <Lock size={14} color="#1c0f00" />
              <Text style={s.saveText}>Save privately</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </Card>
      {groups.map((g) => (
        <View key={g.month} style={{ marginTop: 18 }}>
          <Label>{g.month}</Label>
          {g.entries.map((e) => {
            const Icon = KIND_ICON[e.kind];
            return (
              <View key={e.id} style={s.entry}>
                <View style={s.entryIcon}><Icon size={16} color={e.kind === "milestone" || e.kind === "lift" ? C.gold : C.flame} /></View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <Text style={s.entryTitle}>{e.title}</Text>
                    {e.session ? <Text style={s.sessionTag}>This session</Text> : null}
                  </View>
                  <Text style={s.entryBody}>{e.body}</Text>
                  {e.kind === "photo" ? (
                    <View style={s.photoStub}><Camera size={18} color={C.ash} /><Text style={s.muted}>Private photo · placeholder</Text></View>
                  ) : null}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 }}>
                    <Text style={s.entryDate}>{e.date}</Text>
                    {e.stat ? <Text style={s.entryStat}>{e.stat}</Text> : null}
                    <View style={s.privateTag}><Lock size={10} color={C.ash} /><Text style={s.privateTagText}>Private</Text></View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </ProSection>
  );
}

// ── AI weekly check-in (scripted) ───────────────────────────────────────────
function CheckIn({ onLocked }: { onLocked: (f: PremiumFeature) => void }) {
  const [weekId, setWeekId] = useState(CHECKIN_WEEKS[0].id);
  const week = CHECKIN_WEEKS.find((w) => w.id === weekId)!;
  const TrendIcon = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus } as const;
  return (
    <ProSection feature="ai_weekly_checkin_preview" title="Weekly check-in" onLocked={onLocked} teaserHeight={300}>
      <View style={s.checkBanner}>
        <Sparkles size={16} color={C.gold} />
        <Text style={s.checkBannerText}>{CHECKIN_BANNER}</Text>
      </View>
      <View style={[s.segment, { marginTop: 12 }]} accessibilityRole="tablist">
        {CHECKIN_WEEKS.map((w) => {
          const on = w.id === weekId;
          return (
            <Pressable key={w.id} accessibilityRole="tab" accessibilityState={{ selected: on }} aria-selected={on} onPress={() => { tap(); setWeekId(w.id); }} style={[s.segBtn, on && s.segBtnOn]}>
              <Text style={[s.segText, on && { color: C.white }]}>{w.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <LinearGradient colors={["#2a0f07", "#141414"]} start={DIAG.start} end={DIAG.end} style={s.report}>
        <Glows glows={[{ color: C.flame, cx: "100%", cy: "0%", rx: "70%", ry: "60%", opacity: 0.3 }]} />
        <Label accent>{week.range}</Label>
        <Text style={s.reportTitle}>{CHECKIN_TITLE}</Text>
        <View style={[s.statRow, { marginTop: 14 }]}>
          <Stat icon={<Dumbbell size={16} color={C.flame} />} value={`${week.workouts}`} label="Workouts" />
          <Stat icon={<Target size={16} color={C.gold} />} value={`${week.consistency}%`} label="Consistency" gold />
          <Stat icon={<Award size={16} color={C.gold} />} value={`${week.prs.length}`} label="New PRs" />
        </View>
        <View style={s.quote}>
          <MessageSquareQuote size={18} color={C.gold} />
          <Text style={s.quoteText}>{week.feedback}</Text>
        </View>
        {week.prs.length ? (
          <>
            <Label style={{ marginTop: 14, marginBottom: 6 }}>Personal records</Label>
            {week.prs.map((p) => <Text key={p} style={s.bullet}>🏆  {p}</Text>)}
          </>
        ) : null}
        <Label style={{ marginTop: 14, marginBottom: 6 }}>Trends</Label>
        {week.trends.map((t) => {
          const Icon = TrendIcon[t.dir];
          return (
            <View key={t.label} style={s.trendRow}>
              <Icon size={15} color={t.dir === "down" ? C.hot : t.dir === "up" ? C.gold : C.ash} />
              <Text style={s.bullet}>{t.label}</Text>
            </View>
          );
        })}
        <Label style={{ marginTop: 14, marginBottom: 6 }}>Focus next week</Label>
        {week.improve.map((i) => <Text key={i} style={s.bullet}>→  {i}</Text>)}
      </LinearGradient>
      <Text style={[s.muted, { marginTop: 10 }]}>{CHECKIN_SCRIPT_NOTE}</Text>
    </ProSection>
  );
}

// ── Small building blocks ───────────────────────────────────────────────────
function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[s.card, style]}>{children}</View>;
}

function Stat({ icon, value, label, gold }: { icon: ReactNode; value: string; label: string; gold?: boolean }) {
  return (
    <View style={s.stat}>
      {icon}
      <Text style={[s.statValue, gold && { color: C.gold }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  intro: { marginHorizontal: 16, padding: 16, borderRadius: 22, overflow: "hidden", backgroundColor: "#131313", gap: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,209,102,0.3)" },
  demoPill: { height: 26, paddingHorizontal: 10, borderRadius: 13, justifyContent: "center", backgroundColor: "rgba(255,247,237,0.08)" },
  demoPillText: { fontFamily: F.labelHeavy, fontSize: 12, letterSpacing: 1.6, color: C.ash },
  introText: { fontSize: 13.5, lineHeight: 19, color: "rgba(255,247,237,0.85)" },
  introLink: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  introLinkText: { fontFamily: F.labelHeavy, fontSize: 14, letterSpacing: 1.2, textTransform: "uppercase", color: C.gold },
  tabsWrap: { backgroundColor: "rgba(9,9,9,0.96)", paddingVertical: 12 },
  tabs: { paddingHorizontal: 16, gap: 8 },
  tab: { height: 36, paddingHorizontal: 16, borderRadius: 18, justifyContent: "center", backgroundColor: "rgba(255,247,237,0.06)" },
  tabOn: { backgroundColor: C.gold },
  tabText: { fontFamily: F.labelHeavy, fontSize: 14, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,247,237,0.75)" },
  card: { padding: 16, borderRadius: 20, backgroundColor: "#141414", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,247,237,0.08)" },
  scoreValue: { fontFamily: F.display, fontSize: 34, lineHeight: 38, color: C.white },
  scoreOf: { fontFamily: F.label, fontSize: 12, color: C.ash },
  scoreLabel: { fontFamily: F.labelHeavy, fontSize: 18, letterSpacing: 1, color: C.gold },
  muted: { fontSize: 12.5, lineHeight: 18, color: C.ash },
  link: { fontFamily: F.labelHeavy, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", color: C.flame },
  segment: { flexDirection: "row", padding: 4, borderRadius: 14, backgroundColor: "rgba(255,247,237,0.05)" },
  segBtn: { flex: 1, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  segBtnOn: { backgroundColor: C.flame },
  segText: { fontFamily: F.labelHeavy, fontSize: 13, letterSpacing: 1.1, textTransform: "uppercase", color: C.ash },
  prHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 14, marginBottom: 4 },
  prBig: { fontFamily: F.display, fontSize: 40, lineHeight: 44, color: C.white },
  prUnit: { fontFamily: F.label, fontSize: 14, color: C.gold },
  gain: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: "rgba(255,209,102,0.12)" },
  gainText: { fontFamily: F.labelHeavy, fontSize: 13, color: C.gold },
  statRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  stat: { flex: 1, padding: 12, borderRadius: 16, backgroundColor: "rgba(255,247,237,0.04)", gap: 4 },
  statValue: { fontFamily: F.display, fontSize: 26, lineHeight: 30, color: C.white },
  statLabel: { fontFamily: F.label, fontSize: 11, letterSpacing: 1.1, textTransform: "uppercase", color: C.ash },
  prImproveRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  prImproveName: { width: 92, fontSize: 13, color: C.white },
  prImproveTrack: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden", backgroundColor: "rgba(255,247,237,0.07)" },
  prImproveValue: { width: 56, textAlign: "right", fontFamily: F.labelHeavy, fontSize: 13, color: C.gold },
  compareMeta: { flexDirection: "row", gap: 10, marginTop: 10 },
  compareChip: { flex: 1, padding: 10, borderRadius: 14, backgroundColor: "rgba(255,247,237,0.04)" },
  compareChipLabel: { fontFamily: F.labelHeavy, fontSize: 11, letterSpacing: 1.4, color: C.ash },
  compareChipValue: { marginTop: 2, fontSize: 13, color: C.white },
  privacyBanner: { flexDirection: "row", gap: 10, padding: 12, borderRadius: 16, backgroundColor: "rgba(255,209,102,0.08)", borderWidth: 1, borderColor: "rgba(255,209,102,0.3)" },
  privacyText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: "rgba(255,247,237,0.85)" },
  noteInput: { minHeight: 70, padding: 12, borderRadius: 14, fontSize: 15, lineHeight: 21, color: C.white, backgroundColor: "rgba(255,247,237,0.05)", textAlignVertical: "top" },
  saveBtn: { flexDirection: "row", alignItems: "center", gap: 6, height: 38, paddingHorizontal: 14, borderRadius: 12 },
  saveText: { fontFamily: F.labelHeavy, fontSize: 13, letterSpacing: 1.1, textTransform: "uppercase", color: "#1c0f00" },
  entry: { flexDirection: "row", gap: 12, marginTop: 10, padding: 14, borderRadius: 18, backgroundColor: "#141414" },
  entryIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,90,31,0.12)" },
  entryTitle: { fontSize: 15, fontWeight: "700", color: C.white },
  entryBody: { marginTop: 3, fontSize: 13.5, lineHeight: 19, color: "rgba(255,247,237,0.82)" },
  entryDate: { fontFamily: F.label, fontSize: 12, letterSpacing: 1, color: C.ash },
  entryStat: { fontFamily: F.labelHeavy, fontSize: 12, color: C.gold },
  privateTag: { flexDirection: "row", alignItems: "center", gap: 4, marginLeft: "auto" },
  privateTagText: { fontFamily: F.label, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: C.ash },
  sessionTag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, overflow: "hidden", fontFamily: F.label, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#1c0f00", backgroundColor: C.gold },
  photoStub: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, height: 64, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(255,247,237,0.2)" },
  checkBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 14, backgroundColor: "rgba(255,209,102,0.1)", borderWidth: 1, borderColor: "rgba(255,209,102,0.35)" },
  checkBannerText: { fontFamily: F.labelHeavy, fontSize: 14, letterSpacing: 0.8, color: C.gold },
  report: { marginTop: 12, padding: 18, borderRadius: 22, overflow: "hidden" },
  reportTitle: { marginTop: 4, fontFamily: F.display, fontSize: 30, lineHeight: 34, color: C.white },
  quote: { flexDirection: "row", gap: 10, marginTop: 14, padding: 14, borderRadius: 16, backgroundColor: "rgba(9,9,9,0.45)" },
  quoteText: { flex: 1, fontSize: 15, lineHeight: 22, color: C.white, fontWeight: "600" },
  trendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  bullet: { fontSize: 14, lineHeight: 22, color: "rgba(255,247,237,0.88)" },
  footnote: { marginTop: 24, textAlign: "center", fontSize: 12, lineHeight: 17, color: C.ash },
});
