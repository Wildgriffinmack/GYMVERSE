import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Check } from "lucide-react-native";
import { C, F, GRAD } from "../theme";
import type { ChallengeProgress, Milestone } from "./premiumChallengeData";

/** Reusable progress presentation. Everything shown is derived from `progress` (completed milestones). */
export function ChallengeProgressView({ progress, milestones, completedIds, compact }: { progress: ChallengeProgress; milestones: Milestone[]; completedIds: readonly string[]; compact?: boolean }) {
  return (
    <View accessibilityLabel={`${progress.done} of ${progress.total} milestones complete, ${progress.pct} percent`}>
      <View style={s.head}>
        <Text style={[s.pct, compact && { fontSize: 22 }]}>{progress.pct}%</Text>
        <Text style={s.meta}>{progress.done}/{progress.total} milestones · {progress.remaining} remaining</Text>
      </View>
      <View style={s.track}>
        {progress.pct > 0 ? <LinearGradient colors={progress.complete ? [C.gold, C.flame] : GRAD} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ height: "100%", width: `${progress.pct}%`, borderRadius: 5 }} /> : null}
      </View>
      {!compact ? (
        <View style={s.dots}>
          {milestones.map((m) => {
            const on = completedIds.includes(m.id);
            return (
              <View key={m.id} style={s.dotWrap}>
                <View style={[s.dot, on && s.dotOn]}>{on ? <Check size={12} color="#160c02" strokeWidth={3} /> : null}</View>
                <Text style={s.dotLabel}>Wk {m.week}</Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  pct: { fontFamily: F.display, fontSize: 32, color: C.white },
  meta: { flex: 1, fontSize: 12.5, color: C.ash },
  track: { height: 10, marginTop: 6, borderRadius: 5, overflow: "hidden", backgroundColor: "rgba(255,247,237,0.08)" },
  dots: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  dotWrap: { alignItems: "center", gap: 4 },
  dot: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,247,237,0.25)" },
  dotOn: { backgroundColor: C.gold, borderColor: C.gold },
  dotLabel: { fontFamily: F.label, fontSize: 11, letterSpacing: 0.8, color: C.ash },
});
