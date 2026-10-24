import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, RotateCcw, Wrench, X } from "lucide-react-native";
import { Badge, IconBtn, Label, tap } from "../components/ui";
import { C, F } from "../theme";
import { FEATURE_LABELS } from "./entitlements";
import { useMembership } from "./MembershipContext";
import { SPONSOR_OPPORTUNITIES, SPONSOR_PROFILES } from "./sponsors";
import { MEMBERSHIP_TIERS, TIERS } from "./tiers";

/**
 * DEVELOPER TOOL — membership switcher for testing gated UI.
 * Only reachable in development builds (__DEV__). It changes local demo state only:
 * no purchase, checkout, receipt or subscription is simulated.
 */
export function DevMembershipSwitcher({ visible, onClose, extra }: { visible: boolean; onClose: () => void; extra?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const m = useMembership();
  if (!__DEV__) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Close developer tools" />
      <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={s.head}>
          <View style={s.devTag}>
            <Wrench size={13} color="#160c02" />
            <Text style={s.devTagText}>Developer tool</Text>
          </View>
          <IconBtn label="Close developer tools" onPress={onClose} size={34}><X size={18} color={C.white} /></IconBtn>
        </View>
        <Text style={s.title}>Demo membership</Text>
        <Text style={s.warn}>Testing only. Switching tiers changes local demo state. No purchase, checkout or subscription is created, and nothing is saved.</Text>

        <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 10, paddingVertical: 14 }}>
          {MEMBERSHIP_TIERS.map((id) => {
            const t = TIERS[id];
            const on = m.tier === id;
            return (
              <Pressable
                key={id}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }} aria-checked={on}
                accessibilityLabel={`Use ${t.displayName} demo state`}
                onPress={() => { tap(); m.setDemoTier(id); }}
                style={[s.row, on && s.rowOn]}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <Text style={s.rowTitle}>{t.displayName}</Text>
                    {t.badge.label ? <Badge tone={t.badge.tone}>{t.badge.label}</Badge> : null}
                    <Text style={[s.status, t.availability === "coming_soon" && { color: C.gold }]}>{t.availabilityLabel}</Text>
                  </View>
                  <Text style={s.rowSub}>{t.tagline}</Text>
                  <Text style={s.meta}>{SPONSOR_PROFILES[t.sponsorProfile].description}{SPONSOR_OPPORTUNITIES[id].length ? ` · ${SPONSOR_OPPORTUNITIES[id].join(", ").replace(/_/g, " ")}` : ""}</Text>
                </View>
                <View style={[s.radio, on && s.radioOn]}>{on ? <Check size={14} color="#fff" strokeWidth={3} /> : null}</View>
              </Pressable>
            );
          })}
          {extra}
        </ScrollView>

        <Label>{m.entitlements.length ? `${m.entitlements.length} premium entitlements active (demo)` : "Free plan: all social, community and safety tools"}</Label>
        {m.entitlements.length ? (
          <Text style={s.features} numberOfLines={4}>{m.entitlements.map((f) => FEATURE_LABELS[f]).join(" · ")}</Text>
        ) : null}

        <Pressable accessibilityRole="button" onPress={() => { tap(); m.resetToFree(); }} style={({ pressed }) => [s.reset, { opacity: pressed ? 0.7 : 1 }]}>
          <RotateCcw size={15} color={C.white} />
          <Text style={s.resetText}>Reset to Free</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "86%", paddingHorizontal: 18, paddingTop: 14, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: "#141414", borderTopWidth: 2, borderColor: C.gold },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  devTag: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: C.gold },
  devTagText: { fontFamily: F.labelHeavy, fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: "#160c02" },
  title: { marginTop: 10, fontFamily: F.display, fontSize: 30, textTransform: "uppercase", color: C.white },
  warn: { marginTop: 4, fontSize: 13, lineHeight: 18, color: C.ash },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 18, backgroundColor: "rgba(255,247,237,0.045)", borderWidth: 1.5, borderColor: "transparent" },
  rowOn: { borderColor: C.flame, backgroundColor: "rgba(255,90,31,0.1)" },
  rowTitle: { fontFamily: F.display, fontSize: 20, textTransform: "uppercase", color: C.white },
  rowSub: { fontSize: 13, color: "rgba(255,247,237,0.85)" },
  status: { fontFamily: F.label, fontSize: 12, letterSpacing: 1.3, textTransform: "uppercase", color: C.ash },
  meta: { fontSize: 11.5, color: C.ash },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: "rgba(255,247,237,0.3)", alignItems: "center", justifyContent: "center" },
  radioOn: { backgroundColor: C.flame, borderColor: C.flame },
  features: { marginTop: 6, fontSize: 12.5, lineHeight: 18, color: "rgba(255,247,237,0.8)" },
  reset: { marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 46, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,247,237,0.2)" },
  resetText: { fontFamily: F.label, fontSize: 15, letterSpacing: 1.5, textTransform: "uppercase", color: C.white },
});
