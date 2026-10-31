import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Dumbbell, Flame, Play, Target, Trophy } from "lucide-react-native";
import type { TimelineEntry } from "../data";
import { ME } from "../data";
import { PostArt } from "../components/PostArt";
import { Badge, GradText, IconBtn, Label, PageHeader, tap } from "../components/ui";
import { Rise } from "./Welcome";
import { AdvancedProgressPromo } from "../pro/ProgressPromo";
import { C, F, NAV_GAP, NAV_HEIGHT, RADIUS, SURFACE } from "../theme";

const SUMMARY = [
  { Icon: Dumbbell, value: "124", label: "Workouts" },
  { Icon: Flame, value: String(ME.streak), label: "Day streak" },
  { Icon: Trophy, value: "+45", label: "Bench PR (lb)", gold: true },
  { Icon: Target, value: "92%", label: "Consistency" },
];

export function ProgressScreen({ timeline, onBack, onAdvanced }: { timeline: TimelineEntry[]; onBack: () => void; onAdvanced?: () => void }) {
  const insets = useSafeAreaInsets();
  const grow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(grow, { toValue: 1, duration: 1200, delay: 200, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [grow]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: insets.bottom + NAV_GAP + NAV_HEIGHT + 24 }} showsVerticalScrollIndicator={false}>
      <PageHeader top={insets.top} kicker={`@${ME.username}`} title="Progress" leading={<IconBtn label="Back to profile" onPress={onBack}><ArrowLeft size={20} color={C.white} /></IconBtn>} />

      <View style={{ paddingHorizontal: 20 }}>
        <Label accent>The work adds up</Label>
        <Text style={s.title}>6 months of</Text>
        <GradText style={s.title}>progress.</GradText>
        <View style={s.track} accessibilityRole="progressbar" accessibilityLabel="6 of 6 months">
          <Animated.View style={{ height: "100%", width: grow.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }}>
            <LinearGradient colors={[C.gold, C.flame, C.hot]} locations={[0, 0.55, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[StyleSheet.absoluteFill, { borderRadius: 5 }]} />
          </Animated.View>
        </View>
        <View style={s.ends}>
          <Text style={s.end}>Day 1</Text>
          <Text style={s.end}>Today</Text>
        </View>
      </View>

      <View style={s.summary}>
        {SUMMARY.map(({ Icon, value, label, gold }) => (
          <View key={label} style={s.chip}>
            <View style={[s.chipIcon, gold && { backgroundColor: "rgba(255,209,102,0.14)" }]}><Icon size={18} color={gold ? C.gold : C.flame} /></View>
            <View>
              <Text style={[s.chipValue, gold && { color: C.gold }]}>{value}</Text>
              <Text style={s.chipLabel}>{label}</Text>
            </View>
          </View>
        ))}
      </View>

      {onAdvanced ? <AdvancedProgressPromo onPress={onAdvanced} /> : null}

      <View style={s.timeline}>
        <LinearGradient colors={[C.hot, C.flame, C.gold]} style={s.line} />
        {timeline.map((entry, i) => {
          const latest = i === timeline.length - 1;
          return (
            <Rise key={entry.id} delay={i * 70} style={{ paddingBottom: 32 }}>
              <View style={[s.node, latest && s.nodeLatest]} />
              <View style={s.head}>
                <Text style={[s.entryTitle, latest && { color: C.gold }]}>{entry.title}</Text>
                {entry.isNew ? <Badge tone="gold">New</Badge> : null}
                <Text style={s.date}>{entry.date}</Text>
              </View>
              <Text style={s.note}>{entry.note}</Text>
              <View style={s.media}>
                <PostArt art={entry.art} variant="card" />
                <LinearGradient colors={["transparent", "rgba(0,0,0,0.75)"]} locations={[0.55, 1]} style={StyleSheet.absoluteFill} />
                <Text style={s.mediaLabel}>{ME.name} · {entry.title}</Text>
                <View style={s.play}><Play size={14} color={C.white} fill={C.white} style={{ marginLeft: 2 }} /></View>
              </View>
              <View style={s.stats}>
                {entry.stats.map((stat, j) => <Text key={stat} style={[s.stat, j === 0 && { color: C.gold, backgroundColor: "rgba(255,209,102,0.12)" }]}>{stat}</Text>)}
              </View>
            </Rise>
          );
        })}
      </View>

      <Pressable accessibilityRole="button" onPress={() => { tap(); onBack(); }} style={({ pressed }) => [s.back, { opacity: pressed ? 0.6 : 1 }]}>
        <ArrowLeft size={15} color={C.muted} />
        <Text style={s.backText}>Back to profile</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  title: { fontFamily: F.display, fontSize: 40, lineHeight: 44, textTransform: "uppercase", color: C.white },
  track: { height: 8, marginTop: 20, borderRadius: 4, overflow: "hidden", backgroundColor: "rgba(255,247,237,0.08)" },
  ends: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  end: { fontFamily: F.label, fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: C.ash },
  summary: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16, paddingTop: 24 },
  chip: { width: "48.5%", flexGrow: 1, flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: RADIUS.lg - 2, backgroundColor: SURFACE.raised },
  chipIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,90,31,0.14)" },
  chipValue: { fontFamily: F.display, fontSize: 26, lineHeight: 30, color: C.white },
  chipLabel: { fontFamily: F.label, fontSize: 11, letterSpacing: 1.3, textTransform: "uppercase", color: C.ash },
  timeline: { marginTop: 30, marginLeft: 20, marginRight: 16, paddingLeft: 30 },
  line: { position: "absolute", top: 10, bottom: 40, left: 7, width: 2, borderRadius: 1 },
  node: { position: "absolute", top: 8, left: -30, width: 16, height: 16, borderRadius: 8, backgroundColor: C.bg, borderWidth: 3, borderColor: C.flame, shadowColor: C.flame, shadowOpacity: 0.9, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  nodeLatest: { backgroundColor: C.gold, borderColor: "rgba(255,209,102,0.45)", shadowColor: C.gold },
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  entryTitle: { fontFamily: F.display, fontSize: 27, lineHeight: 31, textTransform: "uppercase", color: C.white },
  date: { marginLeft: "auto", fontFamily: F.label, fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: C.ash },
  note: { marginTop: 4, marginBottom: 12, fontSize: 15, color: "rgba(255,247,237,0.88)" },
  media: { aspectRatio: 16 / 10, borderRadius: 20, overflow: "hidden", backgroundColor: "#0b0b0b" },
  mediaLabel: { position: "absolute", left: 14, bottom: 12, fontFamily: F.label, fontSize: 12, letterSpacing: 1.9, textTransform: "uppercase", color: C.white },
  play: { position: "absolute", right: 12, bottom: 9, width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(9,9,9,0.5)", borderWidth: 1, borderColor: "rgba(255,247,237,0.3)" },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  stat: { height: 28, lineHeight: 28, paddingHorizontal: 12, borderRadius: 14, overflow: "hidden", fontFamily: F.label, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", color: C.white, backgroundColor: "rgba(255,90,31,0.12)" },
  back: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 12 },
  backText: { fontFamily: F.label, fontSize: 14, letterSpacing: 2.5, textTransform: "uppercase", color: C.muted },
});
