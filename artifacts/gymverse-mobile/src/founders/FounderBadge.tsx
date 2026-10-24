import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Flame, Shield } from "lucide-react-native";
import { C, F } from "../theme";
import { FOUNDER_COPY } from "./foundersData";

const GOLD_EDGE = ["#FFE6A3", "#C9962E", "#FF7A2F"] as const;

/** Shield + flame emblem. Intentionally unlike the check-mark Verified icon. */
function Emblem({ size }: { size: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Shield size={size} color={C.gold} fill="#1a1208" strokeWidth={1.8} />
      <View style={{ position: "absolute", top: size * 0.24 }}>
        <Flame size={size * 0.46} color="#FF7A2F" fill="#FF7A2F" />
      </View>
    </View>
  );
}

/** Compact secondary marker for profiles. Never replaces the membership badge. */
export function FounderBadge() {
  return (
    <LinearGradient colors={GOLD_EDGE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.edge} accessibilityLabel={`${FOUNDER_COPY.badge} recognition preview`}>
      <View style={s.pill}>
        <Emblem size={15} />
        <Text style={s.pillText}>{FOUNDER_COPY.badge}</Text>
      </View>
    </LinearGradient>
  );
}

/** Large legacy medallion for the Founders preview. */
export function FounderMedallion({ size = 132 }: { size?: number }) {
  return (
    <View style={{ alignItems: "center", gap: 10 }} accessibilityLabel={`${FOUNDER_COPY.badge} badge design preview`}>
      <LinearGradient colors={GOLD_EDGE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: size, height: size, borderRadius: size / 2, padding: 3 }}>
        <View style={[s.medal, { borderRadius: size / 2 }]}>
          <Emblem size={size * 0.44} />
          <Text style={[s.medalText, { fontSize: size * 0.11 }]}>FOUNDER</Text>
          <Text style={[s.medalSub, { fontSize: size * 0.056 }]}>GYMVERSE · DAY ONE</Text>
        </View>
      </LinearGradient>
      <FounderBadge />
    </View>
  );
}

const s = StyleSheet.create({
  edge: { borderRadius: 9, padding: 1.2, alignSelf: "flex-start" },
  pill: { flexDirection: "row", alignItems: "center", gap: 5, height: 24, paddingHorizontal: 8, borderRadius: 8, backgroundColor: "#121110" },
  pillText: { fontFamily: F.labelHeavy, fontSize: 11.5, letterSpacing: 1.4, color: C.gold },
  medal: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2, paddingHorizontal: 12, backgroundColor: "#141210" },
  medalText: { fontFamily: F.display, letterSpacing: 2, color: C.gold, marginTop: 4 },
  medalSub: { fontFamily: F.labelHeavy, letterSpacing: 1.6, color: "rgba(255,247,237,0.65)" },
});
