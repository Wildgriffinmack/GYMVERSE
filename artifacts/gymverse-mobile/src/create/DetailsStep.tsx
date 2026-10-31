import { useState } from "react";
import type { RefObject } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import type { TextInputInstance } from "react-native";
import { Hash, LayoutGrid, Layers, ShieldCheck, SlidersHorizontal, Trophy } from "lucide-react-native";
import { POST_CATEGORIES, TRENDS } from "../data";
import { PostArt } from "../components/PostArt";
import { tap } from "../components/ui";
import { PhotoImage } from "../home/HomePost";
import { guardianEnabled } from "../guardian";
import { buildArt } from "../utils";
import { C, F, GUTTER, LINE, RADIUS, SURFACE, TEXT } from "../theme";
import type { CreateDraft } from "./createDraft";
import { CAPTION_LIMIT, hasHashtag, hashtagSummary, postTypeOf, toggleHashtag } from "./createDraft";
import { Chip, OptionRow } from "./CreateParts";

export type OpenRow = "hashtags" | "category" | "challenge" | "more";
const SUGGESTED_TAGS = TRENDS.map((t) => t.tag);
/** The caption grows with its text between these heights, then scrolls. */
const CAPTION_MIN_H = 80;
const CAPTION_MAX_H = 168;

type Props = {
  draft: CreateDraft;
  bottom: number;
  busy: boolean;
  captionRef: RefObject<TextInputInstance | null>;
  captionError: boolean;
  challenges: { title: string; note: string }[];
  open: OpenRow | null;
  onOpen: (row: OpenRow | null) => void;
  onCaption: (text: string) => void;
  onHashtags: (raw: string) => void;
  onCategory: (category: string) => void;
  onChallenge: (title: string | null) => void;
  onTimeline: (on: boolean) => void;
};

/** Stage 3 — caption first; everything else is one tap away and collapsed by default. */
export function DetailsStep(p: Props) {
  const { draft, open } = p;
  const [captionH, setCaptionH] = useState(0);
  const toggle = (row: OpenRow) => p.onOpen(open === row ? null : row);
  const nearLimit = draft.caption.length >= CAPTION_LIMIT - 30;
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: p.bottom + 32 }} showsVerticalScrollIndicator={false}>
        <View style={s.composer}>
          <Thumb draft={draft} />
          <View style={{ flex: 1 }}>
            <TextInput
              ref={p.captionRef}
              value={draft.caption}
              onChangeText={p.onCaption}
              placeholder="Write a caption…"
              placeholderTextColor={TEXT.disabled}
              multiline
              maxLength={CAPTION_LIMIT}
              editable={!p.busy}
              onContentSizeChange={(e) => setCaptionH(e.nativeEvent.contentSize.height)}
              style={[s.caption, { height: Math.max(CAPTION_MIN_H, Math.min(captionH, CAPTION_MAX_H)) }]}
              accessibilityLabel="Caption"
            />
            {p.captionError ? (
              <Text style={s.error} accessibilityLiveRegion="polite">Add a caption before you post.</Text>
            ) : nearLimit ? (
              <Text style={[s.counter, draft.caption.length >= CAPTION_LIMIT && { color: C.gold }]}>{draft.caption.length}/{CAPTION_LIMIT}</Text>
            ) : null}
          </View>
        </View>

        <View style={s.rows}>
          <OptionRow icon={Hash} title="Hashtags" value={hashtagSummary(draft.hashtags)} open={open === "hashtags"} onToggle={() => toggle("hashtags")}>
            <View style={s.tagField}>
              <TextInput
                value={draft.hashtags}
                onChangeText={p.onHashtags}
                placeholder="#LegDay #Consistency"
                placeholderTextColor={TEXT.disabled}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                style={s.tagInput}
                accessibilityLabel="Hashtags"
              />
            </View>
            <Text style={s.subLabel}>Trending</Text>
            <View style={s.chips}>
              {SUGGESTED_TAGS.map((t) => <Chip key={t} role="checkbox" label={t} on={hasHashtag(draft.hashtags, t)} onPress={() => p.onHashtags(toggleHashtag(draft.hashtags, t))} />)}
            </View>
          </OptionRow>

          <OptionRow icon={LayoutGrid} title="Category" value={draft.category} open={open === "category"} onToggle={() => toggle("category")}>
            <View style={s.chips} accessibilityRole="radiogroup" accessibilityLabel="Category">
              {POST_CATEGORIES.map((c) => <Chip key={c} label={c} on={draft.category === c} onPress={() => p.onCategory(c)} />)}
            </View>
          </OptionRow>

          {p.challenges.length ? (
            <OptionRow icon={Trophy} title="Challenge" value={draft.challenge ?? "None"} open={open === "challenge"} onToggle={() => toggle("challenge")}>
              <View accessibilityRole="radiogroup" accessibilityLabel="Challenge">
                <RadioRow label="None" on={draft.challenge === null} onPress={() => p.onChallenge(null)} />
                {p.challenges.map((c) => <RadioRow key={c.title} label={c.title} note={c.note} on={draft.challenge === c.title} onPress={() => p.onChallenge(c.title)} />)}
              </View>
            </OptionRow>
          ) : null}

          <OptionRow icon={SlidersHorizontal} title="More options" value={draft.addToTimeline ? "Timeline on" : undefined} open={open === "more"} onToggle={() => toggle("more")}>
            <View style={s.switchRow}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.switchTitle}>Add to Progress Timeline</Text>
                <Text style={s.switchSub}>Keep this moment on your timeline.</Text>
              </View>
              <Switch
                value={draft.addToTimeline}
                onValueChange={(v) => { tap(); p.onTimeline(v); }}
                trackColor={{ false: "rgba(255,247,237,0.16)", true: C.flame }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="rgba(255,247,237,0.16)"
                accessibilityLabel="Add to Progress Timeline"
              />
            </View>
          </OptionRow>
        </View>

        <View style={s.footer}>
          <ShieldCheck size={14} color={TEXT.tertiary} style={{ marginTop: 1 }} />
          <Text style={s.footerText}>
            Photos stay on this device. Your post shows in this session's feed only.{guardianEnabled ? " GYMX Guardian checks your caption first." : ""}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Thumb({ draft }: { draft: CreateDraft }) {
  if (draft.mode === "photo" && draft.photos[0]) {
    return (
      <View style={s.thumb}>
        <PhotoImage id={draft.photos[0]} style={s.thumbFill} />
        {draft.photos.length > 1 ? (
          <View style={s.thumbBadge}>
            <Layers size={11} color="#fff" strokeWidth={2.4} />
            <Text style={s.thumbBadgeText}>{draft.photos.length}</Text>
          </View>
        ) : null}
      </View>
    );
  }
  if (draft.mode === "pr") {
    return (
      <View style={[s.thumb, s.thumbPr]} accessible accessibilityLabel={`Personal record, ${draft.pr.weight} pounds`}>
        <Text style={s.thumbPrValue} numberOfLines={1} adjustsFontSizeToFit>{draft.pr.weight}</Text>
        <Text style={s.thumbPrUnit}>LB</Text>
      </View>
    );
  }
  return <View style={s.thumb}><PostArt art={buildArt(postTypeOf(draft), draft.category, draft.caption)} variant="thumb" /></View>;
}

function RadioRow({ label, note, on, onPress }: { label: string; note?: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={note ? `${label}, ${note}` : label}
      accessibilityState={{ checked: on }} aria-checked={on}
      onPress={() => { tap(); onPress(); }}
      style={({ pressed }) => [s.radioRow, pressed && { opacity: 0.7 }]}
    >
      <View style={[s.radio, on && s.radioOn]}>{on ? <View style={s.radioDot} /> : null}</View>
      <View style={{ flex: 1 }}>
        <Text style={s.radioLabel} numberOfLines={1}>{label}</Text>
        {note ? <Text style={s.radioNote}>{note}</Text> : null}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  composer: { flexDirection: "row", gap: 14, paddingHorizontal: GUTTER, paddingTop: 16, paddingBottom: 18 },
  thumb: { width: 64, height: 80, borderRadius: RADIUS.sm, overflow: "hidden", backgroundColor: "#0b0b0b" },
  thumbFill: { width: 64, height: 80 },
  thumbBadge: { position: "absolute", top: 5, right: 5, flexDirection: "row", alignItems: "center", gap: 3, height: 20, paddingHorizontal: 6, borderRadius: 10, backgroundColor: "rgba(9,9,9,0.66)" },
  thumbBadgeText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  thumbPr: { alignItems: "center", justifyContent: "center", paddingHorizontal: 6, backgroundColor: SURFACE.raised },
  thumbPrValue: { fontFamily: F.display, fontSize: 26, lineHeight: 32, color: TEXT.primary },
  thumbPrUnit: { fontFamily: F.label, fontSize: 11, letterSpacing: 1.2, color: C.flame },
  caption: { paddingTop: 0, paddingBottom: 0, fontSize: 16, lineHeight: 22, color: TEXT.primary, textAlignVertical: "top" },
  error: { marginTop: 2, fontSize: 13, fontWeight: "600", color: "#FF6B5A" },
  counter: { marginTop: 2, alignSelf: "flex-end", fontSize: 12, color: TEXT.tertiary, fontVariant: ["tabular-nums"] },
  rows: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: LINE.hairline },
  tagField: { height: 46, paddingHorizontal: 14, borderRadius: RADIUS.md, justifyContent: "center", backgroundColor: SURFACE.fill },
  tagInput: { flex: 1, height: "100%", fontSize: 15, fontWeight: "600", color: TEXT.primary },
  subLabel: { marginTop: 14, marginBottom: 10, fontSize: 12.5, fontWeight: "600", color: TEXT.tertiary },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  radioRow: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 48 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: TEXT.tertiary, alignItems: "center", justifyContent: "center" },
  radioOn: { borderColor: C.flame },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.flame },
  radioLabel: { fontSize: 15, fontWeight: "500", color: TEXT.primary },
  radioNote: { marginTop: 1, fontSize: 12.5, color: TEXT.tertiary },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  switchTitle: { fontSize: 15, fontWeight: "600", color: TEXT.primary },
  switchSub: { fontSize: 13, color: TEXT.tertiary },
  footer: { flexDirection: "row", gap: 8, paddingHorizontal: GUTTER, paddingTop: 22 },
  footerText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: TEXT.tertiary },
});
