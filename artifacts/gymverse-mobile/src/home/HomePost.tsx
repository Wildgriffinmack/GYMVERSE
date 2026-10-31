import { memo, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ImageStyle, NativeScrollEvent, NativeSyntheticEvent, StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ellipsis, Flame, Play, ShieldAlert, SquarePlay, Trophy } from "lucide-react-native";
import type { Post, PostMedia } from "../data";
import { PostArt } from "../components/PostArt";
import { CommentIcon, FlexIcon, SaveIcon, ShareIcon } from "../components/GymIcons";
import { Avatar, Verified, tap, thump } from "../components/ui";
import { formatCount } from "../utils";
import { C, F, TEXT } from "../theme";
import { galleryTiles, timeAgo } from "./homeFeed";
import { photoFor } from "./photos";

/** Full-bleed photo proportions: 3:2 gives gym photos presence without dominating the feed. */
export const PHOTO_ASPECT = 3 / 2;
const CLIP_ASPECT = 16 / 9;
const GALLERY_ASPECT = 1.53;
const SIDE = 12;

export type HomePostHandlers = {
  onLike: (id: string, forceOn?: boolean) => void;
  onSave: (id: string) => void;
  onComment: (id: string) => void;
  onShare: (post: Post) => void;
  onMore: (post: Post) => void;
  onOpenClip: (id: string) => void;
  onOpenPhotos: (photos: string[], index: number) => void;
};

type Props = HomePostHandlers & { post: Post; liked: boolean; saved: boolean; width: number };

export const HomePost = memo(function HomePost({ post, liked, saved, width, ...h }: Props) {
  const media = post.media;
  const likeOn = () => { thump(); h.onLike(post.id, true); };
  return (
    <View style={s.post}>
      <PostHeader post={post} onMore={() => { tap(); h.onMore(post); }} />
      {media?.kind === "photos" && media.layout === "gallery" ? (
        <Gallery photos={media.photos} width={width} onOpen={(i) => { tap(); h.onOpenPhotos(media.photos, i); }} />
      ) : media?.kind === "photos" ? (
        <Photos photos={media.photos} aspect={media.aspect} width={width} onDoubleTap={likeOn} />
      ) : media?.kind === "milestone" ? (
        <Milestone m={media} />
      ) : (
        <ClipPreview post={post} width={width} onPress={() => { tap(); h.onOpenClip(post.id); }} />
      )}
      <ActionBar post={post} liked={liked} saved={saved} {...h} />
      {post.caption ? (
        <Text style={s.caption} numberOfLines={3}>
          <Text style={s.captionName}>{post.name}</Text>
          {"  "}
          {post.caption}
        </Text>
      ) : null}
    </View>
  );
});

function PostHeader({ post, onMore }: { post: Post; onMore: () => void }) {
  return (
    <View style={s.head}>
      <Avatar username={post.username} name={post.name} size={36} />
      <View style={s.headText}>
        <View style={s.nameRow}>
          <Text style={s.name} numberOfLines={1}>{post.name}</Text>
          {post.verified ? <Verified size={14} /> : null}
        </View>
        <View style={s.meta}>
          <View style={s.when}>
            <Text style={s.time} numberOfLines={1}>{timeAgo(post.time)}</Text>
            {post.challenge ? (
              <View style={s.challenge}>
                <Flame size={11} color={C.flame} />
                <Text style={s.challengeText} numberOfLines={1} accessibilityLabel={`Challenge: ${post.challenge}`}>{post.challenge}</Text>
              </View>
            ) : null}
          </View>
          {post.moderation === "in_review" ? (
            <View style={s.review}>
              <ShieldAlert size={11} color={C.gold} />
              <Text style={s.reviewText}>In review · only you</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`More options for ${post.name}’s post`} hitSlop={10} onPress={onMore} style={({ pressed }) => [s.more, { opacity: pressed ? 0.5 : 1 }]}>
        <Ellipsis size={22} color={C.white} />
      </Pressable>
    </View>
  );
}

export function PhotoImage({ id, style, fit = "cover" }: { id: string; style: StyleProp<ImageStyle>; fit?: "cover" | "contain" }) {
  const photo = photoFor(id);
  if (!photo) return <View style={[style as StyleProp<ViewStyle>, s.photoFallback]} />;
  return <Image source={photo.source} style={[s.photoFallback, style]} resizeMode={fit} accessibilityLabel={photo.alt} fadeDuration={120} />;
}

/** Single photo or swipeable carousel with a "1/3" counter. Double-tap likes. */
function Photos({ photos, aspect = PHOTO_ASPECT, width, onDoubleTap }: { photos: string[]; aspect?: number; width: number; onDoubleTap: () => void }) {
  const [index, setIndex] = useState(0);
  const lastTap = useRef(0);
  const height = Math.round(width / aspect);
  const onTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      lastTap.current = 0;
      onDoubleTap();
    } else lastTap.current = now;
  };
  const frame = { width, height };
  if (photos.length === 1) {
    return (
      <Pressable onPress={onTap} accessibilityHint="Double-tap to like">
        <PhotoImage id={photos[0]} style={frame} />
      </Pressable>
    );
  }
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(Math.max(0, Math.min(photos.length - 1, next)));
  };
  return (
    <View style={frame}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={32} accessibilityLabel={`Photo ${index + 1} of ${photos.length}`}>
        {photos.map((id) => (
          <Pressable key={id} onPress={onTap} accessibilityHint="Double-tap to like">
            <PhotoImage id={id} style={frame} />
          </Pressable>
        ))}
      </ScrollView>
      <View style={s.counter} pointerEvents="none">
        <Text style={s.counterText}>{index + 1}/{photos.length}</Text>
      </View>
    </View>
  );
}

/** Up to three rounded tiles; the last shows "+N" when there are more photos. */
function Gallery({ photos, width, onOpen }: { photos: string[]; width: number; onOpen: (index: number) => void }) {
  const gap = 6;
  const tileW = (width - SIDE * 2 - gap * 2) / 3;
  const tileH = Math.round(tileW / GALLERY_ASPECT);
  const { shown, extra } = galleryTiles(photos);
  return (
    <View style={[s.gallery, { gap }]}>
      {shown.map((id, i) => {
        const last = i === shown.length - 1 && extra > 0;
        return (
          <Pressable
            key={id}
            accessibilityRole="imagebutton"
            accessibilityLabel={last ? `Open photo ${i + 1} of ${photos.length}, ${extra} more` : `Open photo ${i + 1} of ${photos.length}`}
            onPress={() => onOpen(i)}
            style={({ pressed }) => [s.tile, { width: tileW, height: tileH, opacity: pressed ? 0.85 : 1 }]}
          >
            <PhotoImage id={id} style={{ width: tileW, height: tileH }} />
            {last ? (
              <View style={s.moreTile}>
                <Text style={s.moreTileText}>+{extra}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Personal-record post: Inferno accent rule, display numerals, no card. Also used by the Create preview. */
export function Milestone({ m }: { m: Extract<PostMedia, { kind: "milestone" }> }) {
  return (
    <View style={s.ms} accessible accessibilityLabel={`New personal record: ${m.value} ${m.unit}, ${m.lift}, ${m.detail}. ${m.delta} ${m.deltaLabel}.`}>
      <LinearGradient colors={[C.gold, C.flame, C.hot]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={s.msBar} />
      <View style={s.msTitleRow}>
        <Trophy size={14} color={C.flame} strokeWidth={2.4} />
        <Text style={s.msTitle}>New personal record</Text>
      </View>
      <View style={s.msValueRow}>
        <Text style={s.msValue}>
          {m.value}
          <Text style={s.msUnit}> {m.unit}</Text>
        </Text>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={s.msDelta}>{m.delta}</Text>
          <Text style={s.msDeltaLabel}>{m.deltaLabel}</Text>
        </View>
      </View>
      <Text style={s.msDetail}>{m.lift} · {m.detail}</Text>
    </View>
  );
}

/** Compact preview of a short-form clip; opens the Clips viewer. */
function ClipPreview({ post, width, onPress }: { post: Post; width: number; onPress: () => void }) {
  const w = width - SIDE * 2;
  const h = Math.round(w / CLIP_ASPECT);
  const isVideo = post.postType !== "Photo";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Watch in Clips: ${post.caption}`}
      onPress={onPress}
      style={({ pressed }) => [s.clip, { width: w, height: h, opacity: pressed ? 0.88 : 1 }]}
    >
      <PostArt art={post.art} variant="thumb" />
      {isVideo ? (
        <View style={s.play} pointerEvents="none">
          <Play size={20} color="#fff" fill="#fff" style={{ marginLeft: 3 }} />
        </View>
      ) : null}
      <View style={s.clipTag} pointerEvents="none">
        <SquarePlay size={13} color="#fff" />
        <Text style={s.clipTagText}>Clips · {post.category}</Text>
      </View>
    </Pressable>
  );
}

function ActionBar({ post, liked, saved, onLike, onComment, onShare, onSave }: HomePostHandlers & { post: Post; liked: boolean; saved: boolean }) {
  return (
    <View style={s.actions}>
      <Action label={liked ? "Unlike" : "Like"} count={formatCount(post.likes + (liked ? 1 : 0))} toggle active={liked} onPress={() => { thump(); onLike(post.id); }}>
        <FlexIcon active={liked} />
      </Action>
      <Action label="Open comments" count={formatCount(post.comments)} onPress={() => { tap(); onComment(post.id); }}>
        <CommentIcon />
      </Action>
      <Action label="Share" onPress={() => { tap(); onShare(post); }}>
        <ShareIcon />
      </Action>
      <View style={{ flex: 1 }} />
      <Action label={saved ? "Remove from saved" : "Save"} toggle active={saved} onPress={() => { tap(); onSave(post.id); }}>
        <SaveIcon active={saved} size={25} />
      </Action>
    </View>
  );
}

function Action({ label, count, toggle = false, active = false, onPress, children }: { label: string; count?: string; toggle?: boolean; active?: boolean; onPress: () => void; children: ReactNode }) {
  const pop = useRef(new Animated.Value(1)).current;
  const prev = useRef(active);
  useEffect(() => {
    if (active && !prev.current) {
      Animated.sequence([Animated.timing(pop, { toValue: 1.25, duration: 120, useNativeDriver: true }), Animated.spring(pop, { toValue: 1, friction: 4, useNativeDriver: true })]).start();
    }
    prev.current = active;
  }, [active, pop]);
  const a11y = count ? `${label}, ${count}` : label;
  const body = (
    <>
      <Animated.View style={{ transform: [{ scale: pop }] }}>{children}</Animated.View>
      {count ? <Text style={[s.count, active && { color: C.flame }]}>{count}</Text> : null}
    </>
  );
  const style = ({ pressed }: { pressed: boolean }) => [s.action, { opacity: pressed ? 0.6 : 1 }];
  return toggle ? (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y} accessibilityState={{ selected: active }} aria-selected={active} hitSlop={6} onPress={onPress} style={style}>
      {body}
    </Pressable>
  ) : (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y} hitSlop={6} onPress={onPress} style={style}>
      {body}
    </Pressable>
  );
}

/** Grid thumbnail for any post: first photo for photo posts, generated art otherwise. Explicit size so web renders `cover` correctly. */
export function PostThumb({ post }: { post: Post }) {
  const first = post.media?.kind === "photos" ? post.media.photos[0] : undefined;
  return first ? <PhotoImage id={first} style={s.fill} /> : <PostArt art={post.art} variant="thumb" />;
}

const s = StyleSheet.create({
  post: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,247,237,0.09)" },
  photoFallback: { backgroundColor: "#141414" },
  fill: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" },
  head: { flexDirection: "row", alignItems: "center", paddingHorizontal: SIDE, paddingTop: 9, paddingBottom: 7 },
  headText: { flex: 1, marginLeft: 10, gap: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  name: { flexShrink: 1, color: C.white, fontSize: 13.5, fontWeight: "600" },
  /** Time + challenge stay on one line (the challenge truncates); the review badge wraps below when there's no room. */
  meta: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 5, rowGap: 2 },
  when: { flexDirection: "row", alignItems: "center", gap: 5, flexShrink: 1, minWidth: 0 },
  time: { flexShrink: 0, color: "rgba(255,247,237,0.5)", fontSize: 12 },
  challenge: { flexDirection: "row", alignItems: "center", gap: 3, flexShrink: 1, minWidth: 0 },
  challengeText: { flexShrink: 1, color: "rgba(255,247,237,0.72)", fontSize: 12, fontWeight: "600" },
  review: { flexDirection: "row", alignItems: "center", gap: 3, flexShrink: 0 },
  reviewText: { color: C.gold, fontSize: 11.5, fontWeight: "600" },
  more: { width: 32, height: 32, alignItems: "flex-end", justifyContent: "center" },
  counter: { position: "absolute", top: 10, right: 10, paddingHorizontal: 9, height: 24, borderRadius: 12, justifyContent: "center", backgroundColor: "rgba(9,9,9,0.62)" },
  counterText: { color: C.white, fontSize: 12, fontWeight: "600", fontVariant: ["tabular-nums"] },
  gallery: { flexDirection: "row", paddingHorizontal: SIDE },
  tile: { borderRadius: 6, overflow: "hidden", backgroundColor: "#141414" },
  moreTile: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(9,9,9,0.42)" },
  moreTileText: { color: C.white, fontSize: 22, fontWeight: "700" },
  ms: { marginHorizontal: SIDE + 1, marginVertical: 4, paddingLeft: 18, paddingVertical: 2 },
  msBar: { position: "absolute", left: 0, top: 2, bottom: 2, width: 3, borderRadius: 2 },
  msTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  msTitle: { fontFamily: F.labelHeavy, color: C.flame, fontSize: 13, letterSpacing: 1.3, textTransform: "uppercase" },
  msValueRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 4 },
  msValue: { fontFamily: F.display, color: C.white, fontSize: 46, lineHeight: 52, letterSpacing: 0.3 },
  msUnit: { fontFamily: F.label, color: TEXT.tertiary, fontSize: 20, letterSpacing: 1 },
  msDelta: { fontFamily: F.labelHeavy, color: C.flame, fontSize: 20, letterSpacing: 0.5 },
  msDeltaLabel: { color: TEXT.tertiary, fontSize: 12, marginTop: 1, marginBottom: 6 },
  msDetail: { color: TEXT.secondary, fontSize: 13, marginTop: 2 },
  clip: { marginHorizontal: SIDE, borderRadius: 8, overflow: "hidden", backgroundColor: "#0b0b0b" },
  play: { position: "absolute", alignSelf: "center", top: "50%", marginTop: -24, width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(9,9,9,0.55)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,247,237,0.3)" },
  clipTag: { position: "absolute", left: 8, bottom: 8, flexDirection: "row", alignItems: "center", gap: 5, height: 24, paddingHorizontal: 8, borderRadius: 7, backgroundColor: "rgba(9,9,9,0.62)" },
  clipTagText: { color: C.white, fontSize: 12, fontWeight: "600" },
  actions: { flexDirection: "row", alignItems: "center", gap: 22, paddingHorizontal: SIDE, paddingTop: 8, paddingBottom: 5 },
  action: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 32 },
  count: { color: C.white, fontSize: 12.5, fontWeight: "500", fontVariant: ["tabular-nums"] },
  caption: { paddingHorizontal: SIDE + 1, paddingBottom: 12, color: "rgba(255,247,237,0.8)", fontSize: 13, lineHeight: 18 },
  captionName: { color: C.white, fontWeight: "700" },
});
