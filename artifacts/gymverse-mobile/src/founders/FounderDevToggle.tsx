import { StyleSheet, Switch, Text, View } from "react-native";
import { tap } from "../components/ui";
import { C, F } from "../theme";
import { FounderBadge } from "./FounderBadge";

/** DEVELOPER TOOL — Founder preview flag. Independent of the membership tier and of entitlements. */
export function FounderDevToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  if (!__DEV__) return null;
  return (
    <View style={s.box}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={s.title}>Founder preview</Text>
          <FounderBadge />
        </View>
        <Switch value={value} onValueChange={(v) => { tap(); onChange(v); }} trackColor={{ true: C.gold, false: "rgba(255,247,237,0.2)" }} thumbColor="#fff" accessibilityLabel="Founder preview" />
      </View>
      <Text style={s.hint}>Separate from the demo membership above: switching tiers never grants or removes it, and it unlocks no premium features. Resets when the app restarts.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  box: { marginTop: 6, padding: 14, borderRadius: 18, backgroundColor: "rgba(255,209,102,0.06)", borderWidth: 1, borderColor: "rgba(255,209,102,0.35)" },
  title: { fontFamily: F.display, fontSize: 18, textTransform: "uppercase", color: C.white },
  hint: { marginTop: 8, fontSize: 12, lineHeight: 17, color: C.ash },
});
