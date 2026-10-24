import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight, Dumbbell, Flame, Lock, Shield, Sprout, Target, Trophy } from "lucide-react-native";
import { tap } from "../components/ui";
import { useMembership } from "../membership/MembershipContext";
import { ComingSoonPill } from "../membership/PremiumScreen";
import { ChallengeSponsorStrip } from "../sponsors/SponsoredChallenges";
import { SPONSORED_CHALLENGES, SPONSOR_COPY } from "../sponsors/sponsorData";
import { C, DIAG, F } from "../theme";
import type { ChallengeTheme, DemoChallengeProgress, PremiumChallenge } from "./premiumChallengeData";
import { PREMIUM_CHALLENGES, PREMIUM_CHALLENGE_COPY, progressFor } from "./premiumChallengeData";
import { FIRST_1000 } from "../founders/foundersData";

export const THEMES: Record<ChallengeTheme, { colors: [string, string, string]; accent: string; icon: (size: number, color: string) => ReactNode }> = {
  muscle: { colors: ["#FF5A1F", "#9E1610", "#170505"], accent: C.flame, icon: (sz, c) => <Dumbbell size={sz} color={c} /> },
  strength: { colors: ["#55606C", "#22262B", "#0b0b0c"], accent: C.gold, icon: (sz, c) => <Trophy size={sz} color={c} /> },
  beginner: { colors: ["#FFB347", "#D9621B", "#2a1206"], accent: "#FFB347", icon: (sz, c) => <Sprout size={sz} color={c} /> },
  discipline: { colors: ["#2b2b2b", "#160808", "#000000"], accent: "#FF5A1F", icon: (sz, c) => <Flame size={sz} color={c} /> },
};

/** The Phase 6 sponsored-challenge entry linked to a premium program (reused, not duplicated). */
export function sponsorFor(c: PremiumChallenge) {
  return c.sponsoredChallengeId ? SPONSORED_CHALLENGES.find((s) => s.id === c.sponsoredChallengeId) ?? null : null;
}

export function PremiumChallengeCard({ challenge, completedIds, onExplore }: { challenge: PremiumChallenge; completedIds: string[]; onExplore: () => void }) {
  const { can } = useMembership();
  const unlocked = can("premium_challenges");
  const t = THEMES[challenge.theme];
  const sponsor = sponsorFor(challenge);
  const p = progressFor(challenge, completedIds);
  return (
    <View style={s.card}>
      <LinearGradient colors={t.colors} locations={[0, 0.55, 1]} start={DIAG.start} end={DIAG.end} style={s.cover}>
        <View style={s.watermark} pointerEvents="none">{t.icon(110, "rgba(255,247,237,0.1)")}</View>
        <View style={s.coverTop}>
          <View style={s.pro}>{unlocked ? null : <Lock size={10} color="#1c0f00" strokeWidth={3} />}<Text style={s.proText}>PRO</Text></View>
          <ComingSoonPill label="COMING SOON" />
        </View>
        <Text style={s.title}>{challenge.title}</Text>
        <Text style={s.duration}>{challenge.durationLabel}</Text>
      </LinearGradient>
      <View style={s.body}>
        <Text style={s.desc}>{challenge.description}</Text>
        <View style={s.row}><Target size={14} color={t.accent} /><Text style={s.objective} numberOfLines={2}>{challenge.objective}</Text></View>
        {sponsor ? <ChallengeSponsorStrip brandId={sponsor.brandId} /> : null}
        {unlocked && p.done > 0 ? <Text style={s.progress}>{p.complete ? "Demo complete" : `Demo progress · ${p.pct}%`}</Text> : null}
        <Pressable accessibilityRole="button" accessibilityLabel={`Explore challenge: ${challenge.title}`} onPress={() => { tap(); onExplore(); }} style={({ pressed }) => [s.btn, { borderColor: t.accent, opacity: pressed ? 0.8 : 1 }]}>
          <Text style={s.btnText}>Explore Challenge</Text>
          <ArrowRight size={16} color={C.white} />
        </Pressable>
      </View>
    </View>
  );
}

/** Challenges-screen section: premium previews, the sponsor disclosure and the Founders challenge concept. */
export function PremiumChallengesSection({ progress, onExplore, onFounders }: { progress: DemoChallengeProgress; onExplore: (id: string) => void; onFounders?: () => void }) {
  return (
    <View style={{ gap: 12 }}>
      <View>
        <Text style={s.sectionKicker}>Coming soon</Text>
        <Text style={s.sectionTitle}>{PREMIUM_CHALLENGE_COPY.title}</Text>
        <Text style={s.sectionSub}>{PREMIUM_CHALLENGE_COPY.subtitle}</Text>
        <View style={{ marginTop: 8 }}><ComingSoonPill label={PREMIUM_CHALLENGE_COPY.pill} /></View>
      </View>
      <Text style={s.note}>{PREMIUM_CHALLENGE_COPY.freeNote} {SPONSOR_COPY.challengeRewards}</Text>
      {PREMIUM_CHALLENGES.map((c) => <PremiumChallengeCard key={c.id} challenge={c} completedIds={progress[c.id] ?? []} onExplore={() => onExplore(c.id)} />)}
      <Text style={s.muted}>{SPONSOR_COPY.challengeNote}</Text>
      {onFounders ? (
        <Pressable accessibilityRole="button" accessibilityLabel="The First 1000, founding-community challenge concept. Explore Founders" onPress={() => { tap(); onFounders(); }} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
          <LinearGradient colors={["#1b1508", "#120d08"]} start={DIAG.start} end={DIAG.end} style={s.founders}>
            <View style={s.row}><Shield size={16} color={C.gold} /><Text style={[s.sectionKicker, { color: C.gold }]}>Founders concept</Text></View>
            <Text style={[s.title, { fontSize: 26, lineHeight: 30 }]}>{FIRST_1000.title}</Text>
            <Text style={s.desc}>{FIRST_1000.tagline}</Text>
            <View style={s.row}><Text style={[s.btnText, { color: C.gold }]}>Explore Founders</Text><ArrowRight size={15} color={C.gold} /></View>
          </LinearGradient>
        </Pressable>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 22, overflow: "hidden", backgroundColor: "#141414", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,247,237,0.12)" },
  cover: { height: 150, padding: 14, justifyContent: "flex-end", overflow: "hidden" },
  watermark: { position: "absolute", right: -10, top: 8 },
  coverTop: { position: "absolute", top: 12, left: 14, right: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pro: { flexDirection: "row", alignItems: "center", gap: 4, height: 24, paddingHorizontal: 9, borderRadius: 8, backgroundColor: C.gold },
  proText: { fontFamily: F.labelHeavy, fontSize: 12, letterSpacing: 1.4, color: "#1c0f00" },
  title: { fontFamily: F.display, fontSize: 28, lineHeight: 32, color: C.white },
  duration: { fontFamily: F.labelHeavy, fontSize: 13, letterSpacing: 1.3, textTransform: "uppercase", color: "rgba(255,247,237,0.85)" },
  body: { padding: 14, gap: 10 },
  desc: { fontSize: 14, lineHeight: 20, color: "rgba(255,247,237,0.86)" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  objective: { flex: 1, fontSize: 13, color: C.white },
  progress: { fontFamily: F.labelHeavy, fontSize: 12.5, letterSpacing: 1, textTransform: "uppercase", color: C.gold },
  btn: { height: 46, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5 },
  btnText: { fontFamily: F.labelHeavy, fontSize: 14.5, letterSpacing: 1.1, textTransform: "uppercase", color: C.white },
  sectionKicker: { fontFamily: F.labelHeavy, fontSize: 12, letterSpacing: 1.6, textTransform: "uppercase", color: C.flame },
  sectionTitle: { marginTop: 2, fontFamily: F.display, fontSize: 28, lineHeight: 32, color: C.white },
  sectionSub: { marginTop: 2, fontSize: 14, color: "rgba(255,247,237,0.85)" },
  note: { fontSize: 13, lineHeight: 19, color: "rgba(255,247,237,0.8)" },
  muted: { fontSize: 12, lineHeight: 17, color: C.ash },
  founders: { padding: 16, gap: 6, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,209,102,0.4)" },
});
