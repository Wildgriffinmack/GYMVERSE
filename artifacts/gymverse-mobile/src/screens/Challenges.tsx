import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ArrowRight, Check, Users } from "lucide-react-native";
import { CHALLENGES, ME } from "../data";
import { TONES, ToneFill, Glows } from "../components/Tone";
import { Avatar, Badge, IconBtn, Label, PageHeader, ProgressRing, thump } from "../components/ui";
import { Pulse, Rise } from "./Welcome";
import { C, F, NAV_GAP, NAV_HEIGHT } from "../theme";
import { LinearGradient } from "expo-linear-gradient";
import { PremiumChallengesSection } from "../challenges/PremiumChallengesSection";
import type { DemoChallengeProgress } from "../challenges/premiumChallengeData";

const FACES = ["maya_moves", "iron_jay", "coach_elena"];

type Props = {
  joined: string[];
  onToggle: (id: string) => void;
  /** Phase 7 premium previews; omitted → section hidden. Demo progress is separate from `joined`. */
  onExplorePremium?: (id: string) => void;
  onFounders?: () => void;
  premiumProgress?: DemoChallengeProgress;
  /** Challenges is reached from Explore or Profile; shows a Back button when provided. */
  onBack?: () => void;
};

export function ChallengesScreen({ joined, onToggle, onExplorePremium, onFounders, premiumProgress, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const active = CHALLENGES.find((c) => c.id === ME.challengeId)!;
  const pct = Math.round((ME.challengeDay / active.totalDays) * 100);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: insets.bottom + NAV_GAP + NAV_HEIGHT + 24 }} showsVerticalScrollIndicator={false}>
      <PageHeader top={insets.top} kicker="Better together" title="Challenges" leading={onBack ? <IconBtn label="Back" onPress={onBack}><ArrowLeft size={20} color={C.white} /></IconBtn> : undefined} trailing={<View style={s.live}><Pulse /><Text style={s.liveText}>{CHALLENGES.length} live</Text></View>} />

      <View style={s.hero}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#121212" }]} />
        <Glows glows={[{ color: C.flame, cx: "0%", cy: "0%", rx: "80%", ry: "110%", opacity: 0.42 }, { color: C.hot, cx: "100%", cy: "100%", rx: "70%", ry: "90%", opacity: 0.3 }]} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
          <ProgressRing value={pct} size={116} stroke={9}>
            <Text style={{ fontFamily: F.display, fontSize: 30, color: C.white }}>{pct}%</Text>
            <Text style={s.ringSub}>Day {ME.challengeDay}/{active.totalDays}</Text>
          </ProgressRing>
          <View style={{ flex: 1 }}>
            <Label accent>Your active challenge</Label>
            <Text style={s.heroTitle}>{active.title}</Text>
            <Text style={s.heroSub}>{active.totalDays - ME.challengeDay} days to go. Don’t break the chain.</Text>
          </View>
        </View>
        <View style={s.chain} accessibilityLabel={`${ME.challengeDay} of ${active.totalDays} days complete`}>
          {Array.from({ length: active.totalDays }, (_, d) => (
            <View key={d} style={[s.link, d < ME.challengeDay && { backgroundColor: C.flame }, d === ME.challengeDay && { backgroundColor: C.gold }]} />
          ))}
        </View>
      </View>

      <View style={s.sectionLabel}><Label>Trending now</Label><Label accent>Join one today</Label></View>

      <View style={{ paddingHorizontal: 16, gap: 14 }}>
        {CHALLENGES.map((c, i) => {
          const isActive = c.id === ME.challengeId;
          const isJoined = isActive || joined.includes(c.id);
          const day = isActive ? ME.challengeDay : 1;
          const Icon = c.icon;
          return (
            <Rise key={c.id} delay={i * 60}>
              <View style={s.card}>
                <ToneFill tone={TONES[c.tone]} />
                <View style={s.mark}><Icon size={160} color="rgba(255,255,255,0.16)" strokeWidth={1.3} /></View>
                <LinearGradient colors={["rgba(9,9,9,0)", "rgba(9,9,9,0.6)"]} style={StyleSheet.absoluteFill} pointerEvents="none" />
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingRight: 18 }}>
                  <Badge tone={c.badgeTone}>{c.badge}</Badge>
                  <Text style={s.duration}>{c.duration}</Text>
                </View>
                <Text style={s.title}>{c.title}</Text>
                <Text style={s.desc}>{c.desc}</Text>
                <View style={s.meta}>
                  <View style={{ flexDirection: "row" }}>
                    {FACES.map((f, idx) => <View key={f} style={{ marginLeft: idx ? -8 : 0, borderRadius: 14, borderWidth: 2, borderColor: "rgba(9,9,9,0.7)" }}><Avatar username={f} name={f} size={24} /></View>)}
                  </View>
                  <Users size={13} color="rgba(255,247,237,0.85)" />
                  <Text style={s.metaText}>{c.members} joined  ·  {c.difficulty}</Text>
                </View>
                <View style={s.foot}>
                  {isJoined ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <ProgressRing value={Math.max(4, Math.round((day / c.totalDays) * 100))} size={40} stroke={4} />
                      <Text style={s.metaText}><Text style={{ fontWeight: "800", color: C.white }}>Day {day}</Text> of {c.totalDays}</Text>
                    </View>
                  ) : (
                    <Text style={s.hint}>Start when you’re ready</Text>
                  )}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: isJoined }} aria-selected={isJoined}
                    accessibilityLabel={isJoined ? `Joined ${c.title}` : `Join ${c.title}`}
                    onPress={() => { thump(); onToggle(c.id); }}
                    style={({ pressed }) => [s.join, isJoined && s.joined, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}
                  >
                    {isJoined ? <Check size={16} color={C.gold} strokeWidth={3} /> : null}
                    <Text style={[s.joinText, isJoined && { color: C.white }]}>{isJoined ? "Joined" : "Join"}</Text>
                    {!isJoined ? <ArrowRight size={16} color={C.bg} strokeWidth={2.6} /> : null}
                  </Pressable>
                </View>
              </View>
            </Rise>
          );
        })}
      </View>
      {/* Phase 7: premium challenge previews (with Phase 6 sponsor labels) and the Founders concept, below the free challenges, which stay unchanged. */}
      {onExplorePremium ? (
        <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
          <PremiumChallengesSection progress={premiumProgress ?? {}} onExplore={onExplorePremium} onFounders={onFounders} />
        </View>
      ) : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  live: { flexDirection: "row", alignItems: "center", gap: 8, height: 28, paddingHorizontal: 12, borderRadius: 14, backgroundColor: "rgba(255,247,237,0.07)" },
  liveText: { fontFamily: F.label, fontSize: 12, letterSpacing: 1.7, textTransform: "uppercase", color: C.white },
  hero: { marginHorizontal: 16, padding: 18, paddingTop: 20, borderRadius: 24, overflow: "hidden", gap: 16 },
  ringSub: { marginTop: 3, fontFamily: F.label, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: C.ash },
  heroTitle: { marginTop: 6, fontFamily: F.display, fontSize: 27, lineHeight: 30, textTransform: "uppercase", color: C.white },
  heroSub: { marginTop: 8, fontSize: 13, color: C.muted },
  chain: { flexDirection: "row", gap: 3 },
  link: { flex: 1, height: 8, borderRadius: 3, backgroundColor: "rgba(255,247,237,0.1)" },
  sectionLabel: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 },
  card: { overflow: "hidden", padding: 18, paddingBottom: 16, borderRadius: 22, borderTopRightRadius: 38 },
  mark: { position: "absolute", right: -16, bottom: -20, transform: [{ rotate: "-12deg" }] },
  duration: { fontFamily: F.label, fontSize: 13, letterSpacing: 1.8, textTransform: "uppercase", color: "rgba(255,247,237,0.88)" },
  title: { marginTop: 14, fontFamily: F.display, fontSize: 27, lineHeight: 31, textTransform: "uppercase", color: "#fff", textShadowColor: "rgba(0,0,0,0.3)", textShadowRadius: 14 },
  desc: { marginTop: 6, fontSize: 14, lineHeight: 20, color: "rgba(255,247,237,0.86)" },
  meta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 },
  metaText: { fontSize: 12.5, fontWeight: "600", color: "rgba(255,247,237,0.86)" },
  foot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 16 },
  hint: { fontFamily: F.label, fontSize: 12, letterSpacing: 1.7, textTransform: "uppercase", color: "rgba(255,247,237,0.72)" },
  join: { flexDirection: "row", alignItems: "center", gap: 7, height: 44, paddingHorizontal: 20, borderRadius: 14, backgroundColor: C.white, shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  joined: { backgroundColor: "rgba(9,9,9,0.45)", borderWidth: 1.5, borderColor: "rgba(255,247,237,0.35)", elevation: 0, shadowOpacity: 0 },
  joinText: { fontFamily: F.labelHeavy, fontSize: 16, letterSpacing: 1.6, textTransform: "uppercase", color: C.bg },
});
