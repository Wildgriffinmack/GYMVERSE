import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { Animated, Easing, Image, Keyboard, Platform, StyleSheet, View, useWindowDimensions } from "react-native";
import type { TextInputInstance } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import type { Challenge } from "../data";
import { ME, PERSONAL_RECORDS } from "../data";
import { useReducedMotion } from "../components/ui";
import { addLibraryPhoto, photoFor } from "../home/photos";
import type { PostDraft } from "../utils";
import { C, MOTION } from "../theme";
import type { ClipType, CreateDraft, CreateMode, CreateStage, CropId, PrBests, PrEntry } from "../create/createDraft";
import { CAPTION_REQUIRED, CREATE_STAGES, MAX_PHOTOS, cropFor, hasMedia, initialDraft, isDirty, sessionBests, shareProblem, toPostDraft, toggleSelection, withMedia } from "../create/createDraft";
import { DiscardSheet, HEADER_H, StepHeader } from "../create/CreateParts";
import { SelectStep } from "../create/SelectStep";
import { PreviewStep } from "../create/PreviewStep";
import { DetailsStep } from "../create/DetailsStep";
import type { OpenRow } from "../create/DetailsStep";

const TITLES: Record<CreateStage, string> = { select: "New post", preview: "Preview", details: "New post" };
const PROFILE_BESTS = sessionBests(PERSONAL_RECORDS, []);

/** Natural size of a sample or library photo, when it can be known. */
function sizeOf(id: string): { width?: number; height?: number } {
  const photo = photoFor(id);
  if (photo?.width && photo.height) return photo;
  if (typeof photo?.source === "number") {
    const asset = Image.resolveAssetSource?.(photo.source);
    if (asset) return { width: asset.width, height: asset.height };
  }
  return {};
}

/**
 * Create flow: Select media → Preview → Details. `onPost` resolves to null when posted, or to
 * Guardian's reason when the post was blocked (the draft is kept so it can be edited).
 */
export function CreateScreen({ onPost, onClose, onToast, challenges = [], bests = PROFILE_BESTS, backHandlerRef }: {
  onPost: (draft: PostDraft) => Promise<string | null>;
  onClose: () => void;
  onToast: (m: string) => void;
  /** Challenges the post can be tagged with (the active one and any joined). */
  challenges?: Pick<Challenge, "id" | "title">[];
  /** One-rep bests a new PR has to beat (includes PRs posted earlier this session). */
  bests?: PrBests;
  /** App-level Android back hook: returns true when Create handled the press. */
  backHandlerRef?: RefObject<(() => boolean) | null>;
}) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const [initial] = useState(() => initialDraft(bests));
  const [draft, setDraft] = useState<CreateDraft>(initial);
  const [stage, setStage] = useState<CreateStage>("select");
  const [multi, setMulti] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  const [libraryIds, setLibraryIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [captionError, setCaptionError] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [openRow, setOpenRow] = useState<OpenRow | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const captionRef = useRef<TextInputInstance>(null);
  const enter = useRef(new Animated.Value(1)).current;
  const direction = useRef(1);
  const mounted = useRef(false);

  const bodyHeight = height - insets.top - HEADER_H - insets.bottom;
  const previewHeight = Math.round(Math.min(width, bodyHeight * 0.5));
  const challengeOptions = useMemo(() => challenges.map((c) => ({ title: c.title, note: c.id === ME.challengeId ? `Active · day ${ME.challengeDay}` : "Joined" })), [challenges]);

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () => setKeyboardOpen(true));
    const hide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setKeyboardOpen(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // Each step slides in from the side it came from; skipped on first open and with Reduce Motion.
  useEffect(() => {
    if (!mounted.current || reduced) { mounted.current = true; enter.setValue(1); return; }
    enter.setValue(0);
    const a = Animated.timing(enter, { toValue: 1, duration: MOTION.base, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [stage, reduced, enter]);

  const go = useCallback((next: CreateStage) => {
    direction.current = CREATE_STAGES.indexOf(next) >= CREATE_STAGES.indexOf(stage) ? 1 : -1;
    Keyboard.dismiss();
    setStage(next);
  }, [stage]);

  /** Step back, or ask before discarding changes. False means Create can close. */
  const handleBack = useCallback((): boolean => {
    if (discardOpen) { setDiscardOpen(false); return true; }
    if (busy) return true;
    if (stage === "details") { go("preview"); return true; }
    if (stage === "preview") { go("select"); return true; }
    // Dismiss first: on iOS a number pad would otherwise sit on top of the sheet.
    if (isDirty(draft, initial)) { Keyboard.dismiss(); setDiscardOpen(true); return true; }
    return false;
  }, [discardOpen, busy, stage, draft, initial, go]);

  useEffect(() => {
    if (!backHandlerRef) return;
    backHandlerRef.current = handleBack;
    return () => { backHandlerRef.current = null; };
  }, [backHandlerRef, handleBack]);

  /** The crop follows the first photo's shape until the user picks one. */
  const autoCrop = (d: CreateDraft, photos: string[]): CropId => {
    if (d.cropTouched || !photos.length) return d.crop;
    const size = sizeOf(photos[0]);
    return cropFor(size.width, size.height);
  };

  const tapPhoto = (id: string) => {
    const photos = toggleSelection(draft.photos, id, multi);
    if (multi && !draft.photos.includes(id) && photos.length === draft.photos.length) onToast(`You can add up to ${MAX_PHOTOS} photos.`);
    setDraft((d) => withMedia(d, { photos, crop: autoCrop(d, photos) }));
    setFocus(photos.includes(id) ? id : photos[photos.length - 1] ?? null);
  };

  const toggleMulti = () => {
    if (multi && draft.photos.length > 1) {
      const keep = focus && draft.photos.includes(focus) ? focus : draft.photos[draft.photos.length - 1];
      setDraft((d) => withMedia(d, { photos: [keep], crop: autoCrop(d, [keep]) }));
      setFocus(keep);
    }
    setMulti(!multi);
  };

  /** System photo picker (photos only). Picked images stay on the device for this session. */
  const openLibrary = async () => {
    const room = multi ? MAX_PHOTOS - draft.photos.length : 1;
    if (room <= 0) { onToast(`You can add up to ${MAX_PHOTOS} photos.`); return; }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: multi, selectionLimit: room, quality: 0.9 });
      if (result.canceled || !result.assets.length) return;
      const ids = result.assets.slice(0, room).map((a) => addLibraryPhoto(a.uri, a.width, a.height));
      const photos = multi ? [...draft.photos, ...ids] : [ids[0]];
      setLibraryIds((cur) => [...ids, ...cur]);
      setDraft((d) => withMedia(d, { mode: "photo", photos, crop: autoCrop(d, photos) }));
      setFocus(ids[ids.length - 1]);
    } catch {
      onToast("Couldn't open your photo library.");
    }
  };

  const removePhoto = (index: number) => {
    const photos = draft.photos.filter((_, i) => i !== index);
    setDraft((d) => withMedia(d, { photos }));
    setFocus(photos[photos.length - 1] ?? null);
    if (!photos.length) go("select");
  };

  const share = async () => {
    if (busy) return;
    const problem = shareProblem(draft, bests);
    if (problem) {
      // A missing caption is explained inline next to the field; other problems use a toast.
      if (problem === CAPTION_REQUIRED) { setCaptionError(true); captionRef.current?.focus(); } else onToast(problem);
      return;
    }
    Keyboard.dismiss();
    setBusy(true);
    const blocked = await onPost(toPostDraft(draft, bests));
    // On success the app leaves Create; only a Guardian block returns here.
    if (blocked) {
      setBusy(false);
      onToast(`Guardian blocked this post. ${blocked}`);
    }
  };

  const ready = hasMedia(draft, bests);
  const slide = enter.interpolate({ inputRange: [0, 1], outputRange: [direction.current * 28, 0] });

  return (
    <View style={s.screen}>
      <StepHeader
        top={insets.top}
        stage={stage}
        title={TITLES[stage]}
        onBack={() => { if (!handleBack()) onClose(); }}
        action={stage === "details" ? { kind: "share", busy, onPress: share } : { kind: "next", enabled: ready, onPress: () => go(stage === "select" ? "preview" : "details") }}
      />
      <Animated.View style={[s.body, { opacity: enter.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }), transform: [{ translateX: slide }] }]}>
        {stage === "select" ? (
          <SelectStep
            draft={draft}
            bests={bests}
            width={width}
            previewHeight={previewHeight}
            bottom={insets.bottom}
            keyboardOpen={keyboardOpen}
            multi={multi}
            focus={focus}
            libraryIds={libraryIds}
            onMode={(mode: CreateMode) => setDraft((d) => withMedia(d, { mode }))}
            onToggleMulti={toggleMulti}
            onTapPhoto={tapPhoto}
            onOpenLibrary={openLibrary}
            onClip={(clip: ClipType) => setDraft((d) => withMedia(d, { clip }))}
            onPr={(patch: Partial<PrEntry>) => setDraft((d) => withMedia(d, { pr: { ...d.pr, ...patch } }))}
          />
        ) : stage === "preview" ? (
          <PreviewStep
            draft={draft}
            bests={bests}
            bottom={insets.bottom}
            onCrop={(crop) => setDraft((d) => ({ ...d, crop, cropTouched: true }))}
            onReplace={() => go("select")}
            onRemove={removePhoto}
            onEditMedia={() => go("select")}
          />
        ) : (
          <DetailsStep
            draft={draft}
            bottom={insets.bottom}
            busy={busy}
            captionRef={captionRef}
            captionError={captionError}
            challenges={challengeOptions}
            open={openRow}
            onOpen={setOpenRow}
            onCaption={(caption) => { setDraft((d) => ({ ...d, caption })); if (captionError && caption.trim()) setCaptionError(false); }}
            onHashtags={(hashtags) => setDraft((d) => ({ ...d, hashtags }))}
            onCategory={(category) => setDraft((d) => ({ ...d, category, categoryTouched: true }))}
            onChallenge={(challenge) => setDraft((d) => ({ ...d, challenge }))}
            onTimeline={(addToTimeline) => setDraft((d) => ({ ...d, addToTimeline }))}
          />
        )}
      </Animated.View>
      <DiscardSheet visible={discardOpen} bottom={insets.bottom} onDiscard={() => { setDiscardOpen(false); onClose(); }} onKeep={() => setDiscardOpen(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  body: { flex: 1 },
});
