import { useMemo, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { ScrollViewInstance } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Check, CopyPlus, Film, ImagePlus, Images, Info, Minus, Plus } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { PostArt } from "../components/PostArt";
import { tap } from "../components/ui";
import { Milestone, PhotoImage } from "../home/HomePost";
import { PHOTOS, photoFor } from "../home/photos";
import { buildArt } from "../utils";
import { C, F, GUTTER, RADIUS, SURFACE, TEXT, TINT, TYPE } from "../theme";
import type { ClipType, CreateDraft, CreateMode, PrBests, PrEntry } from "./createDraft";
import { CLIP_STYLES, MAX_PHOTOS, PR_LIFTS, PR_REPS, checkPr, milestoneFor, sanitizeWeight, stepWeight } from "./createDraft";
import { ClipFrame, ModeSwitch, Segmented } from "./CreateParts";

const SAMPLE_IDS = Object.keys(PHOTOS);
const COLS = 4;
const GAP = 2;

type Props = {
  draft: CreateDraft;
  bests: PrBests;
  width: number;
  previewHeight: number;
  bottom: number;
  keyboardOpen: boolean;
  multi: boolean;
  focus: string | null;
  libraryIds: string[];
  onMode: (m: CreateMode) => void;
  onToggleMulti: () => void;
  onTapPhoto: (id: string) => void;
  onOpenLibrary: () => void;
  onClip: (t: ClipType) => void;
  onPr: (patch: Partial<PrEntry>) => void;
};

/** Stage 1 — choose what to post. The selection is the hero; controls stay small. */
export function SelectStep(p: Props) {
  const { draft, width, previewHeight } = p;
  const height = draft.mode === "pr" ? Math.min(previewHeight, 210) : previewHeight;
  return (
    <View style={{ flex: 1 }}>
      <View style={[s.preview, { height }]}>
        {draft.mode === "photo" ? (
          <PhotoPreview focus={p.focus} count={draft.photos.length} width={width} height={height} />
        ) : draft.mode === "clip" ? (
          <ClipPreview clip={draft.clip} height={height} />
        ) : (
          <PrPreview pr={draft.pr} bests={p.bests} />
        )}
      </View>
      {draft.mode === "photo" ? (
        <PhotoGrid {...p} />
      ) : draft.mode === "clip" ? (
        <ClipGrid width={width} selected={draft.clip} onPick={p.onClip} bottom={p.bottom} />
      ) : (
        <PrForm pr={draft.pr} bests={p.bests} onChange={p.onPr} bottom={p.bottom} />
      )}
      {p.keyboardOpen ? null : <ModeSwitch mode={draft.mode} onChange={p.onMode} bottom={p.bottom + 12} />}
    </View>
  );
}

function Empty({ icon: Icon, title, sub }: { icon: LucideIcon; title: string; sub: string }) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}><Icon size={24} color={TEXT.secondary} strokeWidth={1.8} /></View>
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptySub}>{sub}</Text>
    </View>
  );
}

function PhotoPreview({ focus, count, width, height }: { focus: string | null; count: number; width: number; height: number }) {
  if (!focus) return <Empty icon={ImagePlus} title="Select a photo" sub="From your library or the samples below" />;
  return (
    <>
      <PhotoImage id={focus} style={{ width, height, backgroundColor: "transparent" }} fit="contain" />
      {count > 1 ? <View style={s.countChip}><Text style={s.countText}>{count} selected</Text></View> : null}
    </>
  );
}

function ClipPreview({ clip, height }: { clip: ClipType | null; height: number }) {
  const style = CLIP_STYLES.find((c) => c.type === clip);
  if (!style) return <Empty icon={Film} title="Pick a clip style" sub="Demo clips until video upload is ready" />;
  return <ClipFrame art={buildArt(style.type, style.category, "")} width={Math.round(((height - 28) * 9) / 16)} />;
}

function PrPreview({ pr, bests }: { pr: PrEntry; bests: PrBests }) {
  const lift = PR_LIFTS.find((l) => l.id === pr.lift)!;
  const m = milestoneFor(pr, bests) ?? { kind: "milestone" as const, lift: lift.name, value: pr.weight || "0", unit: "LB", detail: pr.reps === 1 ? "1 rep" : `${pr.reps} reps`, delta: "", deltaLabel: pr.weight ? "Not a new PR yet" : "" };
  return <View style={s.prPreview}><Milestone m={m} /></View>;
}

function PhotoGrid({ width, draft, multi, focus, libraryIds, onTapPhoto, onOpenLibrary, onToggleMulti, bottom }: Props) {
  const tile = Math.floor((width - GAP * (COLS - 1)) / COLS);
  const ids = [...libraryIds, ...SAMPLE_IDS];
  return (
    <View style={{ flex: 1 }}>
      <View style={s.toolbar}>
        <Text style={s.toolbarTitle}>{libraryIds.length ? "Your photos & samples" : "Sample photos"}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Select multiple photos"
          accessibilityState={{ selected: multi }} aria-selected={multi}
          hitSlop={6}
          onPress={() => { tap(); onToggleMulti(); }}
          style={({ pressed }) => [s.multiBtn, multi && s.multiBtnOn, pressed && { opacity: 0.7 }]}
        >
          <CopyPlus size={15} color={multi ? C.flame : TEXT.secondary} strokeWidth={2.1} />
          <Text style={[s.multiText, multi && { color: C.flame }]}>{multi ? `${draft.photos.length} of ${MAX_PHOTOS}` : "Select multiple"}</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: bottom + 76 }} showsVerticalScrollIndicator={false}>
        <View style={[s.grid, { gap: GAP }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Open photo library" onPress={() => { tap(); onOpenLibrary(); }} style={({ pressed }) => [s.libTile, { width: tile, height: tile }, pressed && { backgroundColor: SURFACE.fillPressed }]}>
            <Images size={24} color={TEXT.primary} strokeWidth={1.8} />
            <Text style={s.libText}>Library</Text>
          </Pressable>
          {ids.map((id) => (
            <PhotoTile key={id} id={id} size={tile} order={draft.photos.indexOf(id)} multi={multi} focused={focus === id} onPress={() => onTapPhoto(id)} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function PhotoTile({ id, size, order, multi, focused, onPress }: { id: string; size: number; order: number; multi: boolean; focused: boolean; onPress: () => void }) {
  const selected = order >= 0;
  const alt = photoFor(id)?.alt ?? "Photo";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={selected ? `${alt}, selected${multi ? ` ${order + 1}` : ""}` : alt}
      accessibilityState={{ selected }} aria-selected={selected}
      onPress={() => { tap(); onPress(); }}
      style={{ width: size, height: size }}
    >
      <PhotoImage id={id} style={{ width: size, height: size }} />
      {focused ? <View style={s.tileDim} pointerEvents="none" /> : null}
      {!multi && selected ? <View style={s.tileRing} pointerEvents="none" /> : null}
      {multi ? (
        <View style={[s.badge, selected && s.badgeOn]} pointerEvents="none">
          {selected ? <Text style={s.badgeText}>{order + 1}</Text> : null}
        </View>
      ) : null}
    </Pressable>
  );
}

function ClipGrid({ width, selected, onPick, bottom }: { width: number; selected: ClipType | null; onPick: (t: ClipType) => void; bottom: number }) {
  const gap = 8;
  const w = Math.floor((width - GUTTER * 2 - gap * 2) / 3);
  const arts = useMemo(() => CLIP_STYLES.map((c) => buildArt(c.type, c.category, "")), []);
  return (
    <View style={{ flex: 1 }}>
      <View style={s.toolbar}><Text style={s.toolbarTitle}>Demo clip styles</Text></View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: bottom + 76 }} showsVerticalScrollIndicator={false}>
        <View style={s.note}>
          <Info size={14} color={TEXT.tertiary} style={{ marginTop: 2 }} />
          <Text style={s.noteText}>Video upload isn't available yet. Pick a style to post a demo clip.</Text>
        </View>
        <View style={[s.grid, { gap }]} accessibilityRole="radiogroup" accessibilityLabel="Clip style">
          {CLIP_STYLES.map((c, i) => {
            const on = c.type === selected;
            return (
              <Pressable
                key={c.type}
                accessibilityRole="radio"
                accessibilityLabel={`${c.label} clip style`}
                accessibilityState={{ checked: on }} aria-checked={on}
                onPress={() => { tap(); onPick(c.type); }}
                style={({ pressed }) => [s.clipTile, { width: w, height: Math.round(w * 1.25) }, pressed && { opacity: 0.85 }]}
              >
                <PostArt art={arts[i]} variant="thumb" />
                <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.78)"]} locations={[0.45, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
                <Text style={s.clipLabel} numberOfLines={1}>{c.label}</Text>
                {on ? <View style={s.clipRing} pointerEvents="none" /> : null}
                {on ? <View style={s.clipCheck} pointerEvents="none"><Check size={13} color="#fff" strokeWidth={3} /></View> : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function StepBtn({ icon: Icon, label, onPress }: { icon: LucideIcon; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => { tap(); onPress(); }} style={({ pressed }) => [s.stepBtn, pressed && { backgroundColor: SURFACE.fillPressed }]}>
      <Icon size={20} color={TEXT.primary} strokeWidth={2.2} />
    </Pressable>
  );
}

/** Personal-record entry: lift, weight and reps. A 1-rep entry must beat the profile's current best. */
function PrForm({ pr, bests, onChange, bottom }: { pr: PrEntry; bests: PrBests; onChange: (patch: Partial<PrEntry>) => void; bottom: number }) {
  const scroll = useRef<ScrollViewInstance>(null);
  const weightY = useRef(0);
  const check = checkPr(pr, bests);
  const best = pr.reps === 1 ? bests[pr.lift] : undefined;
  const hint = check.ok ? (check.delta !== null ? `+${check.delta} lb over your best of ${best} lb` : `Shared as a ${pr.reps}-rep max`) : check.reason;
  return (
    <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: GUTTER, paddingTop: 18, paddingBottom: bottom + 84, gap: 24 }} showsVerticalScrollIndicator={false}>
      <View style={{ gap: 10 }}>
        <Text style={s.fieldLabel}>Lift</Text>
        <Segmented label="Lift" options={PR_LIFTS.map((l) => ({ id: l.id, label: l.id, a11y: l.name }))} value={pr.lift} onChange={(lift) => onChange({ lift })} />
      </View>
      <View style={{ gap: 10 }} onLayout={(e) => { weightY.current = e.nativeEvent.layout.y; }}>
        <Text style={s.fieldLabel}>Weight</Text>
        <View style={s.weightRow}>
          <StepBtn icon={Minus} label="5 pounds less" onPress={() => onChange({ weight: stepWeight(pr.weight, -1) })} />
          <View style={s.weightBox}>
            <TextInput
              value={pr.weight}
              onChangeText={(t) => onChange({ weight: sanitizeWeight(t) })}
              keyboardType="number-pad"
              inputMode="numeric"
              maxLength={4}
              selectTextOnFocus
              placeholder="0"
              placeholderTextColor={TEXT.disabled}
              style={s.weightInput}
              accessibilityLabel="PR weight in pounds"
              onFocus={() => scroll.current?.scrollTo({ y: Math.max(0, weightY.current - 12), animated: true })}
            />
            <Text style={s.weightUnit}>lb</Text>
          </View>
          <StepBtn icon={Plus} label="5 pounds more" onPress={() => onChange({ weight: stepWeight(pr.weight, 1) })} />
        </View>
        <Text style={[s.prHint, check.ok && check.delta !== null && { color: C.flame }]} accessibilityLiveRegion="polite">{hint}</Text>
      </View>
      <View style={{ gap: 10 }}>
        <Text style={s.fieldLabel}>Reps</Text>
        <Segmented label="Reps" options={PR_REPS.map((r) => ({ id: r, label: r === 1 ? "1 rep" : `${r} reps` }))} value={pr.reps} onChange={(reps) => onChange({ reps })} />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  preview: { alignItems: "center", justifyContent: "center", overflow: "hidden", backgroundColor: "#0e0e0e" },
  empty: { alignItems: "center", gap: 6, paddingHorizontal: 32 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 6, backgroundColor: SURFACE.fill },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: TEXT.primary },
  emptySub: { fontSize: 13.5, textAlign: "center", color: TEXT.tertiary },
  countChip: { position: "absolute", left: 12, bottom: 12, height: 26, paddingHorizontal: 10, borderRadius: 13, justifyContent: "center", backgroundColor: "rgba(9,9,9,0.66)" },
  countText: { fontSize: 12.5, fontWeight: "600", color: TEXT.primary },
  toolbar: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: GUTTER, paddingRight: 12 },
  toolbarTitle: { fontSize: 15.5, fontWeight: "700", color: TEXT.primary },
  multiBtn: { flexDirection: "row", alignItems: "center", gap: 6, height: 34, paddingHorizontal: 12, borderRadius: 17, backgroundColor: SURFACE.fill },
  multiBtnOn: { backgroundColor: TINT.flame },
  multiText: { fontSize: 13, fontWeight: "600", color: TEXT.secondary },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  libTile: { alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: SURFACE.raised },
  libText: { fontSize: 12.5, fontWeight: "600", color: TEXT.primary },
  tileDim: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(9,9,9,0.38)" },
  tileRing: { ...StyleSheet.absoluteFill, borderWidth: 2, borderColor: C.flame },
  badge: { position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.9)", backgroundColor: "rgba(0,0,0,0.25)" },
  badgeOn: { borderColor: C.flame, backgroundColor: C.flame },
  badgeText: { fontSize: 12, fontWeight: "800", color: "#fff" },
  note: { flexDirection: "row", gap: 8, marginBottom: 14 },
  noteText: { flex: 1, fontSize: 13, lineHeight: 18, color: TEXT.tertiary },
  clipTile: { borderRadius: RADIUS.sm, overflow: "hidden", justifyContent: "flex-end", backgroundColor: "#0b0b0b" },
  clipLabel: { margin: 8, fontSize: 12.5, fontWeight: "700", color: "#fff" },
  clipRing: { ...StyleSheet.absoluteFill, borderRadius: RADIUS.sm, borderWidth: 2, borderColor: C.flame },
  clipCheck: { position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: C.flame },
  prPreview: { alignSelf: "stretch", paddingHorizontal: 8 },
  fieldLabel: TYPE.eyebrow,
  weightRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  weightBox: { flex: 1, flexDirection: "row", alignItems: "baseline", justifyContent: "center", height: 64, borderRadius: RADIUS.md, backgroundColor: SURFACE.raised },
  weightInput: { width: 104, paddingVertical: 0, textAlign: "right", fontFamily: F.display, fontSize: 40, lineHeight: 52, color: TEXT.primary },
  weightUnit: { width: 44, marginLeft: 6, fontFamily: F.label, fontSize: 18, letterSpacing: 1, textTransform: "uppercase", color: TEXT.tertiary },
  stepBtn: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: SURFACE.fill },
  prHint: { fontSize: 13.5, lineHeight: 18, color: TEXT.secondary },
});
