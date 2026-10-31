import type { ReactNode } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronDown, ChevronLeft, Film, X } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import type { PostArtData } from "../data";
import { PostArt } from "../components/PostArt";
import { tap, thump } from "../components/ui";
import { C, DIAG, F, GRAD, GUTTER, LINE, RADIUS, SURFACE, TEXT, TINT } from "../theme";
import type { CreateMode, CreateStage } from "./createDraft";
import { CREATE_MODES, CREATE_STAGES } from "./createDraft";

/** Header row + step bar, above the safe-area inset. */
export const HEADER_H = 62;

type HeaderAction = { kind: "next"; enabled: boolean; onPress: () => void } | { kind: "share"; busy: boolean; onPress: () => void };

/** Close/back · centred title · one primary action, with a three-step progress bar underneath. */
export function StepHeader({ top, stage, title, onBack, action }: { top: number; stage: CreateStage; title: string; onBack: () => void; action: HeaderAction }) {
  const index = CREATE_STAGES.indexOf(stage);
  const first = index === 0;
  const BackIcon = first ? X : ChevronLeft;
  return (
    <View style={{ paddingTop: top }}>
      <View style={s.headerRow}>
        <View style={s.titleWrap} pointerEvents="none">
          <Text style={s.title} accessibilityRole="header">{title}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={first ? "Close" : "Back"} hitSlop={8} onPress={() => { tap(); onBack(); }} style={({ pressed }) => [s.headerBtn, pressed && { opacity: 0.5 }]}>
          <BackIcon size={first ? 24 : 28} color={TEXT.primary} strokeWidth={2} />
        </Pressable>
        {action.kind === "next" ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next"
            accessibilityState={{ disabled: !action.enabled }} aria-disabled={!action.enabled}
            disabled={!action.enabled}
            hitSlop={8}
            onPress={() => { tap(); action.onPress(); }}
            style={({ pressed }) => [s.textBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={[s.nextText, !action.enabled && { color: TEXT.disabled }]}>Next</Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={action.busy ? "Sharing post" : "Share post"}
            accessibilityState={{ disabled: action.busy }} aria-disabled={action.busy}
            disabled={action.busy}
            hitSlop={6}
            onPress={() => { thump(); action.onPress(); }}
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.96 : 1 }] }]}
          >
            <LinearGradient colors={GRAD} start={DIAG.start} end={DIAG.end} style={s.sharePill}>
              {action.busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.shareText}>Share</Text>}
            </LinearGradient>
          </Pressable>
        )}
      </View>
      <View style={s.steps} accessible accessibilityLabel={`Step ${index + 1} of ${CREATE_STAGES.length}`}>
        {CREATE_STAGES.map((st, i) => <View key={st} style={[s.step, i <= index && s.stepOn]} />)}
      </View>
    </View>
  );
}

/** Floating PHOTO · CLIP · PR switch at the bottom of the select step. */
export function ModeSwitch({ mode, onChange, bottom }: { mode: CreateMode; onChange: (m: CreateMode) => void; bottom: number }) {
  return (
    <View style={[s.modeWrap, { bottom }]} pointerEvents="box-none">
      <View style={s.modeBar} accessibilityRole="tablist">
        {CREATE_MODES.map((m) => {
          const on = m.id === mode;
          return (
            <Pressable
              key={m.id}
              accessibilityRole="tab"
              accessibilityLabel={`${m.label} post`}
              accessibilityState={{ selected: on }} aria-selected={on}
              onPress={() => { if (!on) { tap(); onChange(m.id); } }}
              style={[s.modeBtn, on && s.modeBtnOn]}
            >
              <Text style={[s.modeText, on && s.modeTextOn]}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Row that expands its options inline. Only the open row shows its controls. */
export function OptionRow({ icon: Icon, title, value, open, onToggle, children }: { icon: LucideIcon; title: string; value?: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <View style={s.opt}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={value ? `${title}, ${value}` : title}
        accessibilityState={{ expanded: open }} aria-expanded={open}
        onPress={() => { tap(); onToggle(); }}
        style={({ pressed }) => [s.optRow, pressed && { backgroundColor: SURFACE.fill }]}
      >
        <Icon size={20} color={open ? C.flame : TEXT.secondary} strokeWidth={1.9} />
        <Text style={s.optTitle}>{title}</Text>
        {value ? <Text style={s.optValue} numberOfLines={1}>{value}</Text> : <View style={{ flex: 1 }} />}
        <ChevronDown size={18} color={TEXT.tertiary} style={open ? { transform: [{ rotate: "180deg" }] } : undefined} />
      </Pressable>
      {open ? <View style={s.optBody}>{children}</View> : null}
    </View>
  );
}

/** Selectable pill. `radio` for one-of-many, `checkbox` for toggles. */
export function Chip({ label, on, onPress, role = "radio", a11yLabel }: { label: string; on: boolean; onPress: () => void; role?: "radio" | "checkbox"; a11yLabel?: string }) {
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={a11yLabel ?? label}
      accessibilityState={{ checked: on }} aria-checked={on}
      hitSlop={4}
      onPress={() => { tap(); onPress(); }}
      style={({ pressed }) => [s.chip, on && s.chipOn, pressed && { opacity: 0.75 }]}
    >
      <Text style={[s.chipText, on && s.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

/** Equal-width segmented control (radio semantics). */
export function Segmented<T extends string | number>({ options, value, onChange, label }: { options: { id: T; label: string; icon?: LucideIcon; a11y?: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <View style={s.seg} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((o) => {
        const on = o.id === value;
        const Icon = o.icon;
        return (
          <Pressable
            key={String(o.id)}
            accessibilityRole="radio"
            accessibilityLabel={o.a11y ?? o.label}
            accessibilityState={{ checked: on }} aria-checked={on}
            onPress={() => { if (!on) { tap(); onChange(o.id); } }}
            style={[s.segBtn, on && s.segBtnOn]}
          >
            {Icon ? <Icon size={16} color={on ? C.flame : TEXT.secondary} strokeWidth={2.1} /> : null}
            <Text style={[s.segText, on && s.segTextOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Rule-of-thirds guides over a crop preview. */
export function ThirdsGuide() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[s.vLine, { left: "33.33%" }]} />
      <View style={[s.vLine, { left: "66.66%" }]} />
      <View style={[s.hLine, { top: "33.33%" }]} />
      <View style={[s.hLine, { top: "66.66%" }]} />
    </View>
  );
}

/** Vertical frame for a generated demo clip, clearly tagged as a demo. */
export function ClipFrame({ art, width }: { art: PostArtData; width: number }) {
  return (
    <View style={[s.clipFrame, { width, height: Math.round((width * 16) / 9) }]}>
      <PostArt art={art} variant="card" />
      <View style={s.demoTag}>
        <Film size={11} color={TEXT.primary} strokeWidth={2.4} />
        <Text style={s.demoTagText}>Demo clip</Text>
      </View>
    </View>
  );
}

/** Confirms leaving the flow when the draft has changes. */
export function DiscardSheet({ visible, bottom, onDiscard, onKeep }: { visible: boolean; bottom: number; onDiscard: () => void; onKeep: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onKeep} statusBarTranslucent>
      <Pressable style={s.backdrop} onPress={onKeep} accessibilityRole="button" accessibilityLabel="Keep editing" />
      <View style={[s.sheet, { paddingBottom: Math.max(bottom, 12) }]}>
        <View style={s.handle} />
        <Text style={s.sheetTitle} accessibilityRole="header">Discard this post?</Text>
        <Text style={s.sheetBody}>Your media choice and caption won't be saved.</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Discard post" onPress={() => { thump(); onDiscard(); }} style={({ pressed }) => [s.sheetRow, s.sheetRowFirst, pressed && { backgroundColor: SURFACE.fill }]}>
          <Text style={[s.sheetRowText, { color: C.hot }]}>Discard</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Keep editing" onPress={() => { tap(); onKeep(); }} style={({ pressed }) => [s.sheetRow, pressed && { backgroundColor: SURFACE.fill }]}>
          <Text style={s.sheetRowText}>Keep editing</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  headerRow: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8 },
  titleWrap: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 17, fontWeight: "700", color: TEXT.primary },
  headerBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  textBtn: { minWidth: 44, height: 44, paddingHorizontal: 10, alignItems: "center", justifyContent: "center" },
  nextText: { fontSize: 16, fontWeight: "700", color: C.flame },
  sharePill: { minWidth: 82, height: 36, marginRight: 8, paddingHorizontal: 18, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  shareText: { fontSize: 15.5, fontWeight: "700", color: "#fff" },
  steps: { flexDirection: "row", gap: 4, height: 10, paddingHorizontal: GUTTER, paddingBottom: 7, alignItems: "flex-end" },
  step: { flex: 1, height: 2.5, borderRadius: 2, backgroundColor: LINE.strong },
  stepOn: { backgroundColor: C.flame },
  modeWrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  modeBar: { flexDirection: "row", padding: 4, borderRadius: RADIUS.pill, backgroundColor: "rgba(26,26,26,0.94)", borderWidth: StyleSheet.hairlineWidth, borderColor: LINE.strong },
  modeBtn: { minWidth: 76, height: 38, paddingHorizontal: 16, borderRadius: RADIUS.pill, alignItems: "center", justifyContent: "center" },
  modeBtnOn: { backgroundColor: "rgba(255,247,237,0.12)" },
  modeText: { fontFamily: F.labelHeavy, fontSize: 14, letterSpacing: 1.4, textTransform: "uppercase", color: TEXT.tertiary },
  modeTextOn: { color: TEXT.primary },
  opt: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: LINE.hairline },
  optRow: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 56, paddingHorizontal: GUTTER },
  optTitle: { fontSize: 15.5, fontWeight: "500", color: TEXT.primary },
  optValue: { flex: 1, textAlign: "right", fontSize: 14, color: TEXT.tertiary },
  optBody: { paddingHorizontal: GUTTER, paddingBottom: 18 },
  chip: { height: 36, paddingHorizontal: 14, borderRadius: 18, justifyContent: "center", backgroundColor: SURFACE.fill },
  chipOn: { backgroundColor: TINT.flame },
  chipText: { fontSize: 14, fontWeight: "600", color: TEXT.secondary },
  chipTextOn: { color: C.flame },
  seg: { flexDirection: "row", padding: 3, borderRadius: RADIUS.md, backgroundColor: SURFACE.fill },
  segBtn: { flex: 1, height: 40, flexDirection: "row", gap: 6, borderRadius: RADIUS.sm, alignItems: "center", justifyContent: "center" },
  segBtnOn: { backgroundColor: TINT.flame },
  segText: { fontFamily: F.labelHeavy, fontSize: 14.5, letterSpacing: 0.8, color: TEXT.secondary },
  segTextOn: { color: C.flame },
  vLine: { position: "absolute", top: 0, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.32)" },
  hLine: { position: "absolute", left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.32)" },
  clipFrame: { borderRadius: RADIUS.md, overflow: "hidden", backgroundColor: "#0b0b0b" },
  demoTag: { position: "absolute", top: 10, left: 10, flexDirection: "row", alignItems: "center", gap: 5, height: 24, paddingHorizontal: 9, borderRadius: 12, backgroundColor: "rgba(9,9,9,0.62)" },
  demoTagText: { fontFamily: F.labelHeavy, fontSize: 11.5, letterSpacing: 1.1, textTransform: "uppercase", color: TEXT.primary },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: SURFACE.scrim },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, paddingTop: 10, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, backgroundColor: SURFACE.sheet },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginBottom: 14, backgroundColor: "rgba(255,247,237,0.2)" },
  sheetTitle: { paddingHorizontal: GUTTER, fontSize: 17, fontWeight: "700", color: TEXT.primary },
  sheetBody: { paddingHorizontal: GUTTER, marginTop: 4, marginBottom: 14, fontSize: 14, lineHeight: 20, color: TEXT.secondary },
  sheetRow: { minHeight: 54, alignItems: "center", justifyContent: "center" },
  sheetRowFirst: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: LINE.hairline },
  sheetRowText: { fontSize: 16, fontWeight: "600", color: TEXT.primary },
});
