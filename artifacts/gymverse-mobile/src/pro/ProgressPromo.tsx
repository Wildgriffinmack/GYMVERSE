import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronRight, Lock, TrendingUp } from "lucide-react-native";
import { Glows } from "../components/Tone";
import { IconMark, Tag, tap } from "../components/ui";
import { useMembership } from "../membership/MembershipContext";
import { C, F, RADIUS, SURFACE, TEXT } from "../theme";
import { consistencyScore } from "./proData";

/** Entry card on the free Progress Timeline that leads to the Pro Advanced Progress preview. */
export function AdvancedProgressPromo({ onPress }: { onPress: () => void }) {
  const { can } = useMembership();
  const unlocked = can("advanced_progress_tracking");
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Advanced progress, GYMX Pro, coming soon" onPress={() => { tap(); onPress(); }} style={({ pressed }) => [s.card, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <Glows glows={[{ color: C.gold, cx: "100%", cy: "0%", rx: "70%", ry: "80%", opacity: 0.1 }]} />
      <IconMark icon={TrendingUp} tone="gold" solid size={42} />
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Tag tone="gold" icon={unlocked ? undefined : Lock}>PRO</Tag>
          <Text style={s.soon}>Coming Soon</Text>
        </View>
        <Text style={s.title}>Advanced progress</Text>
        <Text style={s.sub}>PR charts · streaks · consistency score {consistencyScore()}/100 · check-ins</Text>
      </View>
      <ChevronRight size={20} color={TEXT.tertiary} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 14, marginHorizontal: 16, marginTop: 16, padding: 14, borderRadius: RADIUS.lg, overflow: "hidden", backgroundColor: SURFACE.raised },
  soon: { fontFamily: F.label, fontSize: 12, letterSpacing: 1.3, textTransform: "uppercase", color: C.gold },
  title: { marginTop: 2, fontSize: 15.5, lineHeight: 20, fontWeight: "600", color: TEXT.primary },
  sub: { fontSize: 12.5, lineHeight: 17, color: TEXT.tertiary },
});
