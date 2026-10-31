import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { Info, Pencil, RectangleHorizontal, RectangleVertical, RefreshCw, Square, Trash } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { ME } from "../data";
import { Avatar, Button, Label } from "../components/ui";
import { Milestone, PhotoImage } from "../home/HomePost";
import { buildArt } from "../utils";
import { GUTTER, TEXT } from "../theme";
import type { CreateDraft, CropId, PrBests } from "./createDraft";
import { CLIP_STYLES, CROPS, cropRatio, milestoneFor } from "./createDraft";
import { ClipFrame, Segmented, ThirdsGuide } from "./CreateParts";

const CROP_ICONS: Record<CropId, LucideIcon> = { landscape: RectangleHorizontal, square: Square, portrait: RectangleVertical };

type Area = { w: number; h: number };
type Props = {
  draft: CreateDraft;
  bests: PrBests;
  bottom: number;
  onCrop: (crop: CropId) => void;
  onReplace: () => void;
  onRemove: (index: number) => void;
  onEditMedia: () => void;
};

/** Stage 2 — the media centred in the free space, its real controls in the thumb zone below. */
export function PreviewStep(p: Props) {
  const [area, setArea] = useState<Area>({ w: 0, h: 0 });
  const [page, setPage] = useState(0);
  const count = p.draft.photos.length;
  const current = Math.min(page, Math.max(0, count - 1));
  const onArea = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - area.w) > 1 || Math.abs(height - area.h) > 1) setArea({ w: width, h: height });
  };
  return (
    <View style={{ flex: 1 }}>
      <View style={s.area} onLayout={onArea}>
        {area.h > 0 ? (
          p.draft.mode === "photo" ? <PhotoFrame draft={p.draft} area={area} page={current} onPage={setPage} /> :
          p.draft.mode === "clip" ? <ClipStage draft={p.draft} area={area} /> :
          <PrStage draft={p.draft} bests={p.bests} />
        ) : null}
      </View>
      <View style={[s.controls, { paddingBottom: p.bottom + 16 }]}>
        {p.draft.mode === "photo" ? (
          <>
            <Segmented label="Crop" options={CROPS.map((c) => ({ id: c.id, label: c.label, icon: CROP_ICONS[c.id], a11y: `${c.name} crop, ${c.label}` }))} value={p.draft.crop} onChange={p.onCrop} />
            <Text style={s.hint}>Center crop. Your post appears in the feed exactly like this.</Text>
            <View style={s.actions}>
              <Button title="Replace" icon={RefreshCw} size="sm" onPress={p.onReplace} />
              <Button title={count > 1 ? "Remove this photo" : "Remove"} icon={Trash} size="sm" onPress={() => { p.onRemove(current); setPage(0); }} />
            </View>
          </>
        ) : p.draft.mode === "clip" ? (
          <>
            <View style={s.noteRow}>
              <Info size={14} color={TEXT.tertiary} style={{ marginTop: 2 }} />
              <Text style={[s.hint, { flex: 1 }]}>Demo clip. Video upload and playback aren't available yet.</Text>
            </View>
            <View style={s.actions}><Button title="Change style" icon={Pencil} size="sm" onPress={p.onEditMedia} /></View>
          </>
        ) : (
          <View style={s.actions}><Button title="Edit PR" icon={Pencil} size="sm" onPress={p.onEditMedia} /></View>
        )}
      </View>
    </View>
  );
}

function PhotoFrame({ draft, area, page, onPage }: { draft: CreateDraft; area: Area; page: number; onPage: (i: number) => void }) {
  const ratio = cropRatio(draft.crop);
  const w = Math.min(area.w, Math.floor(area.h * ratio));
  const h = Math.round(w / ratio);
  const count = draft.photos.length;
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.max(0, Math.min(count - 1, Math.round(e.nativeEvent.contentOffset.x / w)));
    if (i !== page) onPage(i);
  };
  return (
    <View style={{ width: w, height: h }}>
      {/* Remount when photos change so the pager never rests on a page that no longer exists. */}
      <ScrollView key={draft.photos.join("|")} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={32} accessibilityLabel={`Photo ${page + 1} of ${count}`}>
        {draft.photos.map((id) => <PhotoImage key={id} id={id} style={{ width: w, height: h }} />)}
      </ScrollView>
      <ThirdsGuide />
      {count > 1 ? <View style={s.counter} pointerEvents="none"><Text style={s.counterText}>{page + 1}/{count}</Text></View> : null}
    </View>
  );
}

function ClipStage({ draft, area }: { draft: CreateDraft; area: Area }) {
  const style = CLIP_STYLES.find((c) => c.type === draft.clip) ?? CLIP_STYLES[0];
  const width = Math.round(Math.min(area.w - 96, ((area.h - 32) * 9) / 16));
  return <ClipFrame art={buildArt(style.type, draft.category, draft.caption)} width={width} />;
}

function PrStage({ draft, bests }: { draft: CreateDraft; bests: PrBests }) {
  const m = milestoneFor(draft.pr, bests);
  return (
    <View style={{ alignSelf: "stretch" }}>
      <Label style={{ paddingHorizontal: GUTTER, marginBottom: 14 }}>Feed preview</Label>
      <View style={s.feedHead}>
        <Avatar username={ME.username} name={ME.name} size={36} />
        <View>
          <Text style={s.feedName}>{ME.name}</Text>
          <Text style={s.feedTime}>Just now</Text>
        </View>
      </View>
      {m ? <Milestone m={m} /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  area: { flex: 1, alignItems: "center", justifyContent: "center" },
  counter: { position: "absolute", top: 12, right: 12, height: 26, paddingHorizontal: 10, borderRadius: 13, justifyContent: "center", backgroundColor: "rgba(9,9,9,0.66)" },
  counterText: { fontSize: 12.5, fontWeight: "600", color: TEXT.primary, fontVariant: ["tabular-nums"] },
  controls: { paddingHorizontal: GUTTER, paddingTop: 12, gap: 12 },
  hint: { fontSize: 13, lineHeight: 18, color: TEXT.tertiary },
  actions: { flexDirection: "row", gap: 10 },
  noteRow: { flexDirection: "row", gap: 8 },
  feedHead: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, marginBottom: 12 },
  feedName: { fontSize: 13.5, fontWeight: "600", color: TEXT.primary },
  feedTime: { fontSize: 12, color: TEXT.tertiary },
});
