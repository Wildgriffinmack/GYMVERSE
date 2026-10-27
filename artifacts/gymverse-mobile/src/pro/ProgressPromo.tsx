import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronRight, Lock, TrendingUp } from "lucide-react-native";
import { Glows } from "../components/Tone";
import { tap } from "../components/ui";
import { useMembership } from "../membership/MembershipContext";
import { C, DIAG, F } from "../theme";
import { consistencyScore } from "./proData";

/** Entry card on the free Progress Timeline that leads to the Pro Advanced Progress preview. */
export function AdvancedProgressPromo({ onPress }: { onPress: () => void }) {
  const { can } = useMembership();
  const unlocked = can("advanced_progress_tracking");
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Advanced progress, GYMX Pro, coming soon" onPress={() => { tap(); onPress(); }} style={({ pressed }) => [{ marginHorizontal: 16, marginTop: 16, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <LinearGradient colors={["rgba(255,209,102,0.75)", "rgba(255,90,31,0.4)", "rgba(255,247,237,0.06)"]} start={DIAG.start} end={DIAG.end} style={s.border}>
        <View style={s.card}>
          <Glows glows={[{ color: C.gold, cx: "100%", cy: "0%", rx: "70%", ry: "80%", opacity: 0.18 }]} />
          <View style={s.icon}><TrendingUp size={20} color="#1c0f00" /></View>
          <View style={{ flex: 1, gap: 3 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={s.pro}>{unlocked ? null : <Lock size={10} color="#1c0f00" strokeWidth={3} />}<Text style={s.proText}>PRO</Text></View>
              <Text style={s.soon}>Coming Soon</Text>
            </View>
            <Text style={s.title}>Advanced progress</Text>
            <Text style={s.sub}>PR charts · streaks · consistency score {consistencyScore()}/100 · check-ins</Text>
          </View>
          <ChevronRight size={20} color={C.gold} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const s = StyleSheet.create({
  border: { borderRadius: 20, padding: 1.2 },
  card: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 19, overflow: "hidden", backgroundColor: "#141414" },
  icon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: C.gold },
  pro: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, height: 20, borderRadius: 6, backgroundColor: C.gold },
  proText: { fontFamily: F.labelHeavy, fontSize: 11, letterSpacing: 1.2, color: "#1c0f00" },
  soon: { fontFamily: F.label, fontSize: 12, letterSpacing: 1.3, textTransform: "uppercase", color: C.gold },
  title: { fontFamily: F.labelHeavy, fontSize: 18, letterSpacing: 0.8, textTransform: "uppercase", color: C.white },
  sub: { fontSize: 12.5, color: C.ash },
});
