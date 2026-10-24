import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowRight, Camera, Clapperboard, Dumbbell, Flame, ImagePlus, Sparkles, TrendingUp, Trophy, Video, X } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import type { TextInputInstance } from "react-native";
import type { PostType } from "../data";
import { ME, POST_CATEGORIES, POST_TYPES } from "../data";
import { PostArt } from "../components/PostArt";
import { Avatar, Badge, Cta, GlassChip, IconBtn, Label, PageHeader, tap } from "../components/ui";
import type { PostDraft } from "../utils";
import { buildPost, parseHashtags } from "../utils";
import { C, DIAG, F, GRAD, NAV_GAP, NAV_HEIGHT } from "../theme";

const TYPE_ICONS: Record<PostType, LucideIcon> = { Video, Photo: Camera, "Gym Edit": Clapperboard, Workout: Dumbbell, Transformation: TrendingUp, PR: Trophy, Motivation: Flame };
const CAPTION_LIMIT = 150;

export function CreateScreen({ onPost, onClose, onToast }: { onPost: (draft: PostDraft) => void; onClose: () => void; onToast: (m: string) => void }) {
  const insets = useSafeAreaInsets();
  const [postType, setPostType] = useState<PostType>("Video");
  const [category, setCategory] = useState("Workout");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [addToTimeline, setAddToTimeline] = useState(false);
  const [hasMedia, setHasMedia] = useState(false);
  const shake = useRef(new Animated.Value(0)).current;
  const [captionError, setCaptionError] = useState(false);
  const captionRef = useRef<TextInputInstance>(null);

  const preview = useMemo(() => buildPost({ postType, category, caption: caption || "Your caption here", hashtags, addToTimeline }), [postType, category, caption, hashtags, addToTimeline]);
  const tags = parseHashtags(hashtags);

  const chooseType = (type: PostType) => {
    tap();
    setPostType(type);
    if (type === "Gym Edit") setCategory("Motivation");
    else if (type === "Workout" || type === "Transformation" || type === "PR" || type === "Motivation") setCategory(type);
  };

  const submit = () => {
    if (!caption.trim()) {
      setCaptionError(true);
      Animated.sequence([-8, 7, -5, 3, 0].map((v) => Animated.timing(shake, { toValue: v, duration: 70, useNativeDriver: true }))).start();
      captionRef.current?.focus();
      onToast("Add a caption before you post.");
      return;
    }
    onPost({ postType, category, caption, hashtags, addToTimeline });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + NAV_GAP + NAV_HEIGHT + 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <PageHeader top={insets.top} kicker="Put your work out there" title="New post" trailing={<IconBtn label="Discard post" onPress={onClose}><X size={20} color={C.white} /></IconBtn>} />

        <View style={s.preview}>
          <View style={[StyleSheet.absoluteFill, !hasMedia && { opacity: 0.35 }]}><PostArt art={preview.art} variant="card" /></View>
          <LinearGradient colors={["rgba(0,0,0,0.35)", "transparent", "transparent", "rgba(0,0,0,0.9)"]} locations={[0, 0.22, 0.58, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <View style={s.previewTop}>
            <Badge tone={preview.badgeTone}>{preview.badge}</Badge>
            {hasMedia ? <GlassChip icon={<Sparkles size={13} color={C.flame} />}>Live preview</GlassChip> : null}
          </View>
          <View style={s.previewCaption}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Avatar username={ME.username} name={ME.name} size={28} ring />
              <Text style={{ color: C.white, fontWeight: "700" }}>@{ME.username}</Text>
            </View>
            <Text style={{ color: C.white, fontSize: 14, lineHeight: 20 }} numberOfLines={2}>{caption || "Your caption shows up here."}</Text>
          </View>
          {hasMedia ? (
            <Pressable accessibilityRole="button" onPress={() => { tap(); setHasMedia(false); onToast("Demo media removed."); }} style={s.remove}>
              <X size={14} color={C.white} /><Text style={s.removeText}>Remove</Text>
            </Pressable>
          ) : (
            <Pressable accessibilityRole="button" accessibilityLabel={`Add ${postType === "Photo" ? "a photo" : "a clip"}`} onPress={() => { tap(); setHasMedia(true); onToast(`${postType} placeholder added.`); }} style={({ pressed }) => [s.drop, pressed && { borderColor: C.flame, transform: [{ scale: 0.97 }] }]}>
              <LinearGradient colors={GRAD} start={DIAG.start} end={DIAG.end} style={s.dropIcon}><ImagePlus size={26} color="#fff" /></LinearGradient>
              <Text style={{ color: C.white, fontSize: 16, fontWeight: "700" }}>Tap to add {postType === "Photo" ? "a photo" : "a clip"}</Text>
              <Text style={{ color: C.ash, fontSize: 12 }}>Demo media · no real upload</Text>
            </Pressable>
          )}
        </View>

        <View style={s.block}>
          <Label style={s.blockLabel}>Post type</Label>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
            {POST_TYPES.map((type) => {
              const Icon = TYPE_ICONS[type];
              const on = postType === type;
              return <Pill key={type} on={on} solid onPress={() => chooseType(type)} icon={<Icon size={15} color={on ? "#fff" : "rgba(255,247,237,0.78)"} />}>{type}</Pill>;
            })}
          </ScrollView>
        </View>

        <View style={s.block}>
          <View style={s.labelRow}>
            <Label>Caption</Label>
            <Text style={[s.counter, caption.length > CAPTION_LIMIT - 20 && { color: C.gold }]}>{caption.length}/{CAPTION_LIMIT}</Text>
          </View>
          <Animated.View style={{ transform: [{ translateX: shake }] }}>
            <TextInput
              ref={captionRef}
              value={caption}
              onChangeText={(t) => { setCaption(t); if (captionError) setCaptionError(false); }}
              maxLength={CAPTION_LIMIT}
              multiline
              placeholder="What did you show up for today?"
              placeholderTextColor="rgba(255,247,237,0.34)"
              style={[s.textarea, captionError && { borderColor: C.hot }]}
              accessibilityLabel="Caption"
            />
          </Animated.View>
        </View>

        <View style={s.block}>
          <Label style={s.blockLabel}>Hashtags</Label>
          <View style={s.hashField}>
            <Text style={{ fontFamily: F.display, fontSize: 22, color: C.flame }}>#</Text>
            <TextInput value={hashtags} onChangeText={setHashtags} placeholder="BenchPR Consistency LegDay" placeholderTextColor="rgba(255,247,237,0.34)" autoCapitalize="none" autoCorrect={false} style={s.hashInput} accessibilityLabel="Hashtags" />
          </View>
          {tags.length ? <View style={s.tagRow}>{tags.map((t) => <Text key={t} style={s.tag}>{t}</Text>)}</View> : null}
        </View>

        <View style={s.block}>
          <Label style={s.blockLabel}>Category</Label>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {POST_CATEGORIES.map((c) => <Pill key={c} on={category === c} onPress={() => { tap(); setCategory(c); }}>{c}</Pill>)}
          </View>
        </View>

        <View style={s.block}>
          <Pressable accessibilityRole="switch" accessibilityState={{ checked: addToTimeline }} onPress={() => { tap(); setAddToTimeline((v) => !v); }} style={[s.toggle, addToTimeline && s.toggleOn]}>
            {addToTimeline ? (
              <LinearGradient colors={GRAD} start={DIAG.start} end={DIAG.end} style={s.toggleIcon}><TrendingUp size={18} color="#fff" /></LinearGradient>
            ) : (
              <View style={[s.toggleIcon, { backgroundColor: "rgba(255,247,237,0.07)" }]}><TrendingUp size={18} color={C.white} /></View>
            )}
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: C.white, fontSize: 15, fontWeight: "700" }}>Add to Progress Timeline</Text>
              <Text style={{ color: C.ash, fontSize: 12.5 }}>Keep the moments that matter.</Text>
            </View>
            <Switch on={addToTimeline} />
          </Pressable>
        </View>

        <View style={s.block}>
          <Cta title="Post to GYMVERSE" onPress={submit} icon={<ArrowRight size={20} color="#fff" strokeWidth={2.6} />} />
          <Text style={s.fine}>Demo only. Your post appears in this session’s feed.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Pill({ on, solid, icon, onPress, children }: { on: boolean; solid?: boolean; icon?: ReactNode; onPress: () => void; children: string }) {
  const content = (
    <>
      {icon}
      <Text style={{ color: on ? "#fff" : "rgba(255,247,237,0.78)", fontSize: 14, fontWeight: "600" }}>{children}</Text>
    </>
  );
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.95 : 1 }] })}>
      {on && solid ? (
        <LinearGradient colors={GRAD} start={DIAG.start} end={DIAG.end} style={s.pill}>{content}</LinearGradient>
      ) : (
        <View style={[s.pill, { backgroundColor: on ? "rgba(255,90,31,0.16)" : "rgba(255,247,237,0.06)", borderWidth: 1.5, borderColor: on ? C.flame : "transparent" }]}>{content}</View>
      )}
    </Pressable>
  );
}

function Switch({ on }: { on: boolean }) {
  return (
    <View style={[s.switch, { backgroundColor: on ? C.flame : "rgba(255,247,237,0.16)" }]}>
      <View style={[s.knob, { transform: [{ translateX: on ? 20 : 0 }] }]} />
    </View>
  );
}

const s = StyleSheet.create({
  preview: { marginHorizontal: 16, aspectRatio: 4 / 5, borderRadius: 28, overflow: "hidden", backgroundColor: "#0b0b0b" },
  previewTop: { position: "absolute", top: 16, left: 16, right: 110, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  previewCaption: { position: "absolute", left: 16, right: 16, bottom: 16, gap: 8 },
  remove: { position: "absolute", top: 14, right: 14, flexDirection: "row", alignItems: "center", gap: 5, height: 32, paddingHorizontal: 12, borderRadius: 16, backgroundColor: "rgba(9,9,9,0.55)" },
  removeText: { fontFamily: F.label, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", color: C.white },
  drop: { position: "absolute", top: "20%", bottom: "32%", left: "13%", right: "13%", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 24, borderWidth: 1.5, borderStyle: "dashed", borderColor: "rgba(255,247,237,0.4)", backgroundColor: "rgba(9,9,9,0.3)" },
  dropIcon: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  block: { paddingHorizontal: 20, paddingTop: 24 },
  blockLabel: { marginBottom: 12 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  counter: { fontFamily: F.label, fontSize: 12, letterSpacing: 1, color: C.ash },
  pill: { flexDirection: "row", alignItems: "center", gap: 7, height: 40, paddingHorizontal: 16, borderRadius: 20 },
  textarea: { minHeight: 96, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, borderRadius: 18, fontSize: 18, lineHeight: 25, color: C.white, backgroundColor: "rgba(255,247,237,0.045)", textAlignVertical: "top", borderWidth: 1.5, borderColor: "transparent" },
  hashField: { flexDirection: "row", alignItems: "center", gap: 8, height: 52, paddingHorizontal: 16, borderRadius: 16, backgroundColor: "rgba(255,247,237,0.045)" },
  hashInput: { flex: 1, height: "100%", fontSize: 16, fontWeight: "600", color: C.white },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, overflow: "hidden", fontSize: 13, fontWeight: "700", color: "#ffb08f", backgroundColor: "rgba(255,90,31,0.12)" },
  toggle: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 20, backgroundColor: "rgba(255,247,237,0.045)", borderWidth: 1, borderColor: "transparent" },
  toggleOn: { backgroundColor: "rgba(255,90,31,0.1)", borderColor: "rgba(255,90,31,0.4)" },
  toggleIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  switch: { width: 50, height: 30, borderRadius: 15, padding: 3 },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#fff" },
  fine: { marginTop: 12, textAlign: "center", fontSize: 12, color: C.ash },
});
