import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CalendarCheck, Check, Circle, Crown, HeartPulse, Info, RotateCcw, ShieldCheck, Trophy } from "lucide-react-native";
import { Glows } from "../components/Tone";
import { Label, tap, TopBar } from "../components/ui";
import type { PremiumFeature } from "../membership/entitlements";
import { useMembership } from "../membership/MembershipContext";
import { ComingSoonPill } from "../membership/PremiumScreen";
import { LockedFeatureSheet, ProSection } from "../pro/ProGate";
import { ChallengeSponsorStrip } from "../sponsors/SponsoredChallenges";
import { SPONSOR_COPY, brandById } from "../sponsors/sponsorData";
import { C, DIAG, F, NAV_GAP, NAV_HEIGHT } from "../theme";
import { ChallengeProgressView } from "./ChallengeProgressView";
import { THEMES, sponsorFor } from "./PremiumChallengesSection";
import { PREMIUM_CHALLENGE_COPY, challengeById, milestonesForWeek, progressFor, resetProgress, toggleMilestone } from "./premiumChallengeData";

type Props = {
  challengeId: string;
  completedIds: string[];
  onChange: (ids: string[]) => void;
  onBack: () => void;
  onOpenPremium: () => void;
  onToast: (m: string) => void;
};

/** Premium challenge preview. Progress is local demo state, kept apart from free challenge progress. */
export function PremiumChallengeScreen({ challengeId, completedIds, onChange, onBack, onOpenPremium, onToast }: Props) {
  const insets = useSafeAreaInsets();
  const { can, plan } = useMembership();
  const [week, setWeek] = useState(1);
  const [locked, setLocked] = useState<PremiumFeature | null>(null);
  const c = challengeById(challengeId);
  if (!c) return null;
  const unlocked = can("premium_challenges");
  const t = THEMES[c.theme];
  const p = progressFor(c, completedIds);
  const sponsor = sponsorFor(c);
  const weekMilestones = milestonesForWeek(c, week);

  const toggle = (id: string) => {
    const next = toggleMilestone(c, completedIds, id);
    onChange(next);
    if (progressFor(c, next).complete && !p.complete) onToast("Demo challenge complete — no real badge or reward was awarded.");
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + NAV_GAP + NAV_HEIGHT + 28 }} showsVerticalScrollIndicator={false}>
        <TopBar top={insets.top} kicker="Pro challenge · preview" onBack={onBack} />

        <LinearGradient colors={t.colors} locations={[0, 0.55, 1]} start={DIAG.start} end={DIAG.end} style={s.hero}>
          <Glows glows={[{ color: t.accent, cx: "100%", cy: "0%", rx: "70%", ry: "70%", opacity: 0.3 }]} />
          <View style={s.watermark} pointerEvents="none">{t.icon(150, "rgba(255,247,237,0.1)")}</View>
          <View style={s.row}>
            <View style={s.pro}><Text style={s.proText}>PRO</Text></View>
            <ComingSoonPill label="COMING SOON" />
            {unlocked ? <View style={s.demo}><Text style={s.demoText}>DEMO · {plan.displayName.toUpperCase()}</Text></View> : null}
          </View>
          <Text style={s.title}>{c.title}</Text>
          <Text style={s.duration}>{c.durationLabel} · {c.weeks} weeks</Text>
          <Text style={s.heroBody}>{c.objective}</Text>
        </LinearGradient>

        <View style={{ paddingHorizontal: 16 }}>
          <Text style={s.h2}>Overview</Text>
          <Text style={s.body}>{c.description}</Text>
          <View style={{ gap: 6, marginTop: 10 }}>
            {c.focus.map((f) => <View key={f} style={s.row}><Check size={14} color={t.accent} /><Text style={s.body}>{f}</Text></View>)}
          </View>

          <ProSection feature="premium_challenges" title="Program & progress" subtitle="Pick a week, mark demo milestones, watch progress update" onLocked={setLocked} teaserHeight={330}>
            <View style={s.card}>
              <ChallengeProgressView progress={p} milestones={c.milestones} completedIds={completedIds} />
            </View>

            <Label style={{ marginTop: 14, marginBottom: 8 }}>Program structure</Label>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel="Challenge week">
              {Array.from({ length: c.weeks }, (_, i) => i + 1).map((w) => {
                const on = w === week;
                const has = milestonesForWeek(c, w).length > 0;
                return (
                  <Pressable key={w} accessibilityRole="radio" accessibilityState={{ checked: on }} aria-checked={on} accessibilityLabel={`Week ${w}${has ? ", has a milestone" : ""}`} onPress={() => { tap(); setWeek(w); }} style={[s.chip, on && { backgroundColor: t.accent, borderColor: t.accent }]}>
                    <Text style={[s.chipText, on && { color: "#160c02" }]}>Week {w}</Text>
                    {has ? <View style={[s.chipDot, on && { backgroundColor: "#160c02" }]} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={[s.card, { marginTop: 10 }]}>
              <Text style={s.kicker}>Week {week} · sample objectives</Text>
              {c.weekObjectives[week - 1].map((o) => <View key={o} style={[s.row, { marginTop: 6 }]}><Circle size={10} color={t.accent} /><Text style={s.body}>{o}</Text></View>)}
              {weekMilestones.length ? weekMilestones.map((m) => <MilestoneRow key={m.id} title={m.title} detail={m.detail} done={completedIds.includes(m.id)} onToggle={() => toggle(m.id)} />) : <Text style={[s.muted, { marginTop: 10 }]}>No milestone this week — keep training at your own pace.</Text>}
            </View>

            <Label style={{ marginTop: 14, marginBottom: 8 }}>Milestone timeline</Label>
            <View style={s.card}>
              {c.milestones.map((m) => <MilestoneRow key={m.id} title={`Week ${m.week} — ${m.title}`} detail={m.detail} done={completedIds.includes(m.id)} onToggle={() => toggle(m.id)} />)}
            </View>
            <Pressable accessibilityRole="button" disabled={p.done === 0} onPress={() => { tap(); onChange(resetProgress()); setWeek(1); onToast("Demo progress reset."); }} style={[s.reset, p.done === 0 && { opacity: 0.45 }]}>
              <RotateCcw size={15} color={C.white} /><Text style={s.resetText}>Reset demo progress</Text>
            </Pressable>

            {p.complete ? (
              <LinearGradient colors={["#2a1a05", "#141010"]} start={DIAG.start} end={DIAG.end} style={s.complete} accessibilityLiveRegion="polite">
                <Text style={s.completeTitle}>{PREMIUM_CHALLENGE_COPY.completeTitle}</Text>
                <View style={[s.row, { marginTop: 10, gap: 14 }]}>
                  <View style={[s.badge, { borderColor: t.accent }]}>{t.icon(30, t.accent)}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.badgeTitle}>{c.badgeConcept}</Text>
                    <Text style={s.muted}>Consistency summary: {p.done} of {p.total} milestones over {c.durationLabel}.</Text>
                  </View>
                </View>
                <View style={{ gap: 4, marginTop: 10 }}>
                  {c.milestones.map((m) => <View key={m.id} style={s.row}><Check size={13} color={C.gold} /><Text style={s.body}>{m.title}</Text></View>)}
                </View>
                <Text style={[s.body, { marginTop: 10, fontStyle: "italic" }]}>Reflection: what helped you show up, and what would you keep doing next month?</Text>
                <Text style={[s.muted, { marginTop: 10 }]}>{PREMIUM_CHALLENGE_COPY.noReward}</Text>
              </LinearGradient>
            ) : null}
          </ProSection>

          <Text style={s.h2}>Check-in schedule</Text>
          <View style={{ gap: 6 }}>{c.checkIns.map((x) => <View key={x} style={s.row}><CalendarCheck size={14} color={C.gold} /><Text style={s.body}>{x}</Text></View>)}</View>

          <Text style={s.h2}>Badge reward concept</Text>
          <View style={s.row}><Trophy size={15} color={C.gold} /><Text style={[s.body, { flex: 1 }]}>{c.badgeConcept}</Text></View>

          {sponsor ? (
            <View style={[s.card, { marginTop: 18, gap: 8 }]}>
              <ChallengeSponsorStrip brandId={sponsor.brandId} />
              <Text style={s.body}>{SPONSOR_COPY.challengeRewards}</Text>
              <Text style={s.muted}>Fictional sponsor {brandById(sponsor.brandId).name}. {sponsor.rewardConcept}</Text>
            </View>
          ) : null}

          <View style={[s.note, { marginTop: 18 }]}><HeartPulse size={16} color={C.gold} /><Text style={s.noteText}>{PREMIUM_CHALLENGE_COPY.rest} {PREMIUM_CHALLENGE_COPY.safety}</Text></View>
          <View style={[s.note, { marginTop: 8 }]}><ShieldCheck size={16} color={C.gold} /><Text style={s.noteText}>{SPONSOR_COPY.challengeNote}</Text></View>
          {!unlocked ? (
            <Pressable accessibilityRole="button" onPress={() => { tap(); onOpenPremium(); }} style={[s.reset, { borderColor: "rgba(255,209,102,0.5)" }]}><Crown size={15} color={C.gold} /><Text style={[s.resetText, { color: C.gold }]}>See GYMX Premium</Text></Pressable>
          ) : null}
          <View style={[s.note, { marginTop: 8 }]}><Info size={16} color={C.gold} /><Text style={s.noteText}>Preview only: nothing here enrolls you, and community challenges stay free.</Text></View>
        </View>
      </ScrollView>
      <LockedFeatureSheet feature={locked} onClose={() => setLocked(null)} onOpenPremium={onOpenPremium} />
    </View>
  );
}

function MilestoneRow({ title, detail, done, onToggle }: { title: string; detail: string; done: boolean; onToggle: () => void }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: done }} aria-checked={done} accessibilityLabel={`Demo milestone: ${title}`} onPress={() => { tap(); onToggle(); }} style={s.milestone}>
      <View style={[s.check, done && s.checkOn]}>{done ? <Check size={14} color="#160c02" strokeWidth={3} /> : null}</View>
      <View style={{ flex: 1 }}>
        <Text style={[s.mTitle, done && { color: C.gold }]}>{title}</Text>
        <Text style={s.muted}>{detail}</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  hero: { marginHorizontal: 16, padding: 18, gap: 8, borderRadius: 24, overflow: "hidden" },
  watermark: { position: "absolute", right: -16, top: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  pro: { height: 24, paddingHorizontal: 9, borderRadius: 8, justifyContent: "center", backgroundColor: C.gold },
  proText: { fontFamily: F.labelHeavy, fontSize: 12, letterSpacing: 1.4, color: "#1c0f00" },
  demo: { height: 26, paddingHorizontal: 10, borderRadius: 13, justifyContent: "center", backgroundColor: "rgba(9,9,9,0.45)" },
  demoText: { fontFamily: F.labelHeavy, fontSize: 11, letterSpacing: 1.3, color: C.white },
  title: { marginTop: 8, fontFamily: F.display, fontSize: 34, lineHeight: 38, color: C.white },
  duration: { fontFamily: F.labelHeavy, fontSize: 13.5, letterSpacing: 1.3, textTransform: "uppercase", color: "rgba(255,247,237,0.88)" },
  heroBody: { fontSize: 14, lineHeight: 20, color: C.white },
  h2: { marginTop: 22, marginBottom: 8, fontFamily: F.display, fontSize: 22, textTransform: "uppercase", color: C.white },
  body: { fontSize: 14, lineHeight: 20, color: "rgba(255,247,237,0.86)", flexShrink: 1 },
  muted: { fontSize: 12.5, lineHeight: 17, color: C.ash },
  kicker: { fontFamily: F.labelHeavy, fontSize: 12, letterSpacing: 1.3, textTransform: "uppercase", color: C.gold },
  card: { padding: 14, borderRadius: 18, backgroundColor: "#141414" },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, height: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 1, borderColor: "rgba(255,247,237,0.15)", backgroundColor: "rgba(255,247,237,0.05)" },
  chipText: { fontFamily: F.labelHeavy, fontSize: 13, letterSpacing: 0.9, textTransform: "uppercase", color: C.white },
  chipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.gold },
  milestone: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,247,237,0.08)", marginTop: 6 },
  check: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,247,237,0.3)" },
  checkOn: { backgroundColor: C.gold, borderColor: C.gold },
  mTitle: { fontFamily: F.labelHeavy, fontSize: 15, color: C.white },
  reset: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 46, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,247,237,0.18)" },
  resetText: { fontFamily: F.labelHeavy, fontSize: 14, letterSpacing: 1.1, textTransform: "uppercase", color: C.white },
  complete: { marginTop: 14, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,209,102,0.5)" },
  completeTitle: { fontFamily: F.display, fontSize: 24, color: C.gold },
  badge: { width: 62, height: 62, borderRadius: 31, alignItems: "center", justifyContent: "center", borderWidth: 2, backgroundColor: "#141210" },
  badgeTitle: { fontFamily: F.labelHeavy, fontSize: 14.5, color: C.white },
  note: { flexDirection: "row", gap: 8, alignItems: "flex-start", padding: 12, borderRadius: 13, backgroundColor: "rgba(255,209,102,0.07)" },
  noteText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: "rgba(255,247,237,0.82)" },
});
