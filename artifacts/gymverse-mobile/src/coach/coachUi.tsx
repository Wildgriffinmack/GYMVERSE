import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import type { KeyboardTypeOptions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { IconBtn, tap } from "../components/ui";
import { C, DIAG, F } from "../theme";
import type { LeadStatus } from "./coachData";
import { statusLabel } from "./coachData";

/** Coach Pro identity: gold (#FFD166) and warm white on the dark Iron Inferno base. */
export const GOLD = C.gold;
export const GRAD_COACH = ["#FFF7ED", "#FFD166"] as const;
export const INK = "#1c1407";

export const STATUS_COLORS: Record<LeadStatus, { bg: string; fg: string; border: string }> = {
  new: { bg: "rgba(255,209,102,0.16)", fg: C.gold, border: "rgba(255,209,102,0.5)" },
  contacted: { bg: "rgba(255,247,237,0.1)", fg: C.white, border: "rgba(255,247,237,0.3)" },
  consultation: { bg: "rgba(255,90,31,0.16)", fg: "#FF8A5C", border: "rgba(255,90,31,0.5)" },
  active: { bg: "rgba(110,214,140,0.15)", fg: "#7ED99A", border: "rgba(110,214,140,0.45)" },
  closed: { bg: "rgba(163,163,163,0.12)", fg: C.ash, border: "rgba(163,163,163,0.3)" },
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  const c = STATUS_COLORS[status];
  return (
    <View style={[cs.status, { backgroundColor: c.bg, borderColor: c.border }]}>
      <View style={[cs.statusDot, { backgroundColor: c.fg }]} />
      <Text style={[cs.statusText, { color: c.fg }]}>{statusLabel(status)}</Text>
    </View>
  );
}

export function Card({ children, gold, style }: { children: ReactNode; gold?: boolean; style?: object }) {
  return <View style={[cs.card, gold && cs.cardGold, style]}>{children}</View>;
}

export function Chip({ on, label, onPress, count, role = "radio" }: { on: boolean; label: string; onPress: () => void; count?: number; role?: "radio" | "button" }) {
  return (
    <Pressable accessibilityRole={role} accessibilityState={role === "radio" ? { checked: on } : { selected: on }} aria-checked={role === "radio" ? on : undefined} aria-selected={role === "radio" ? undefined : on} accessibilityLabel={count === undefined ? label : `${label}, ${count}`} onPress={() => { tap(); onPress(); }} style={[cs.chip, on && cs.chipOn]}>
      <Text style={[cs.chipText, on && { color: INK }]}>{label}</Text>
      {count !== undefined ? <Text style={[cs.chipCount, on && { color: INK }]}>{count}</Text> : null}
    </Pressable>
  );
}

export function ToggleRow({ label, value, onChange, hint }: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <View style={cs.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={cs.toggleLabel}>{label}</Text>
        {hint ? <Text style={cs.hint}>{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={(v) => { tap(); onChange(v); }} trackColor={{ true: C.gold, false: "rgba(255,247,237,0.2)" }} thumbColor="#fff" accessibilityLabel={label} />
    </View>
  );
}

export function GoldButton({ label, icon, onPress, disabled }: { label: string; icon?: ReactNode; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} aria-disabled={!!disabled} disabled={disabled} onPress={() => { tap(); onPress(); }} style={({ pressed }) => [{ opacity: disabled ? 0.45 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
      <LinearGradient colors={GRAD_COACH} start={DIAG.start} end={DIAG.end} style={cs.goldBtn}>
        {icon}
        <Text style={cs.goldBtnText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function GhostButton({ label, icon, onPress, small, a11y }: { label: string; icon?: ReactNode; onPress: () => void; small?: boolean; a11y?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y ?? label} onPress={() => { tap(); onPress(); }} style={({ pressed }) => [cs.ghost, small && cs.ghostSmall, { opacity: pressed ? 0.75 : 1 }]}>
      {icon}
      <Text style={[cs.ghostText, small && { fontSize: 12.5 }]}>{label}</Text>
    </Pressable>
  );
}

export function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return <Text style={cs.fieldLabel}>{children}{required ? <Text style={{ color: C.gold }}> *</Text> : null}</Text>;
}

export function FieldError({ message }: { message?: string }) {
  return message ? <Text style={cs.error} accessibilityLiveRegion="polite">{message}</Text> : null;
}

export function Field({ label, value, onChange, placeholder, error, required, multiline, max, a11y, keyboardType }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; error?: string; required?: boolean; multiline?: boolean; max?: number; a11y?: string; keyboardType?: KeyboardTypeOptions }) {
  return (
    <View style={{ marginTop: 12 }}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,247,237,0.35)"
        multiline={multiline}
        maxLength={max ? max + 20 : undefined}
        keyboardType={keyboardType}
        accessibilityLabel={a11y ?? label}
        style={[cs.input, multiline && { height: 84, textAlignVertical: "top", paddingTop: 10 }, error && cs.inputError]}
      />
      {max ? <Text style={[cs.counter, value.length > max && { color: "#FF8A7A" }]}>{value.length}/{max}</Text> : null}
      <FieldError message={error} />
    </View>
  );
}

export function DemoTag({ label }: { label: string }) {
  return <View style={cs.demoTag}><Text style={cs.demoTagText}>{label}</Text></View>;
}

/** Bottom sheet used by every Coach Command Center detail view. */
export function CoachSheet({ visible, onClose, closeLabel, tag, children, footer }: { visible: boolean; onClose: () => void; closeLabel: string; tag: string; children: ReactNode; footer?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={cs.backdrop} onPress={onClose} accessibilityLabel={closeLabel} />
      {visible ? (
        <View style={[cs.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={cs.handle} />
          <View style={cs.sheetHead}>
            <DemoTag label={tag} />
            <IconBtn label={closeLabel} onPress={onClose} size={34}><X size={18} color={C.white} /></IconBtn>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 8 }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
          {footer ? <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>{footer}</View> : null}
        </View>
      ) : null}
    </Modal>
  );
}

export const cs = StyleSheet.create({
  card: { padding: 14, borderRadius: 18, backgroundColor: "#131210", borderWidth: StyleSheet.hairlineWidth, borderColor: "transparent" },
  cardGold: { borderColor: "rgba(255,209,102,0.5)", backgroundColor: "#19150c" },
  status: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", height: 24, paddingHorizontal: 9, borderRadius: 12, borderWidth: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: F.labelHeavy, fontSize: 11.5, letterSpacing: 1, textTransform: "uppercase" },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 36, paddingHorizontal: 13, borderRadius: 18, backgroundColor: "rgba(255,247,237,0.06)" },
  chipOn: { backgroundColor: C.gold },
  chipText: { fontFamily: F.labelHeavy, fontSize: 13, letterSpacing: 0.9, textTransform: "uppercase", color: "rgba(255,247,237,0.78)" },
  chipCount: { fontFamily: F.labelHeavy, fontSize: 12, color: C.ash },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,247,237,0.08)" },
  toggleLabel: { fontSize: 14.5, color: C.white },
  hint: { marginTop: 2, fontSize: 12, color: C.ash },
  goldBtn: { height: 50, borderRadius: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16 },
  goldBtnText: { fontFamily: F.labelHeavy, fontSize: 15.5, letterSpacing: 1.2, textTransform: "uppercase", color: INK },
  ghost: { height: 46, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 14, backgroundColor: "rgba(255,247,237,0.07)" },
  ghostSmall: { height: 36, borderRadius: 11, paddingHorizontal: 11 },
  ghostText: { fontFamily: F.labelHeavy, fontSize: 14, letterSpacing: 1, textTransform: "uppercase", color: C.white },
  fieldLabel: { fontFamily: F.label, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,247,237,0.75)", marginBottom: 6 },
  input: { minHeight: 46, borderRadius: 13, paddingHorizontal: 13, fontSize: 15, color: C.white, backgroundColor: "rgba(255,247,237,0.06)", borderWidth: 1, borderColor: "transparent" },
  inputError: { borderColor: "#FF6B5A" },
  counter: { alignSelf: "flex-end", marginTop: 3, fontSize: 11, color: C.ash },
  error: { marginTop: 5, fontSize: 12.5, color: "#FF8A7A" },
  demoTag: { alignSelf: "flex-start", minHeight: 24, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7, justifyContent: "center", backgroundColor: "rgba(255,209,102,0.13)" },
  demoTagText: { fontFamily: F.labelHeavy, fontSize: 10.5, letterSpacing: 1.3, color: C.gold },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.62)" },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "88%", paddingTop: 8, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: "#161512" },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,247,237,0.25)", marginBottom: 8 },
  sheetHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 8 },
  sheetTitle: { fontFamily: F.display, fontSize: 26, lineHeight: 30, textTransform: "uppercase", color: C.white },
  h3: { fontFamily: F.labelHeavy, fontSize: 17, letterSpacing: 0.6, color: C.white },
  body: { fontSize: 14, lineHeight: 20, color: "rgba(255,247,237,0.86)" },
  muted: { fontSize: 12, lineHeight: 17, color: C.ash },
  kicker: { fontFamily: F.labelHeavy, fontSize: 11.5, letterSpacing: 1.4, textTransform: "uppercase", color: C.gold },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  note: { flexDirection: "row", gap: 8, alignItems: "flex-start", padding: 11, borderRadius: 13, backgroundColor: "rgba(255,209,102,0.07)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,209,102,0.3)" },
  noteText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: "rgba(255,247,237,0.82)" },
  iconBox: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,209,102,0.12)" },
});
