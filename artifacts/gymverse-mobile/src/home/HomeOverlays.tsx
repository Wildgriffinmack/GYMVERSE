import { useState } from "react";
import { FlatList, Image, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SquarePlay, UserMinus, UserPlus, X } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import type { Post } from "../data";
import { ShareIcon } from "../components/GymIcons";
import { IconBtn, tap } from "../components/ui";
import { C, LINE, RADIUS, SURFACE } from "../theme";
import { isClip } from "./homeFeed";
import { photoFor } from "./photos";

/** "…" menu for a Home post: follow/unfollow, watch in Clips, share. Uses the app's existing actions. */
export function PostMenu({ post, following, isMine, onClose, onFollow, onShare, onOpenClip }: {
  post: Post | null;
  following: boolean;
  isMine: boolean;
  onClose: () => void;
  onFollow: (username: string) => void;
  onShare: (post: Post) => void;
  onOpenClip: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const run = (fn: () => void) => () => { tap(); onClose(); fn(); };
  return (
    <Modal visible={!!post} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Close menu" />
      {post ? (
        <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={s.handle} />
          {!isMine ? <Row Icon={following ? UserMinus : UserPlus} label={following ? `Unfollow ${post.name}` : `Follow ${post.name}`} onPress={run(() => onFollow(post.username))} /> : null}
          {isClip(post) ? <Row Icon={SquarePlay} label="Watch in Clips" onPress={run(() => onOpenClip(post.id))} /> : null}
          <Row label="Share" icon={<ShareIcon size={22} />} onPress={run(() => onShare(post))} />
          <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [s.cancel, { opacity: pressed ? 0.6 : 1 }]}>
            <Text style={s.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      ) : null}
    </Modal>
  );
}

function Row({ Icon, icon, label, onPress }: { Icon?: LucideIcon; icon?: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.row, pressed && { backgroundColor: "rgba(255,247,237,0.05)" }]}>
      {Icon ? <Icon size={21} color={C.white} /> : icon}
      <Text style={s.rowText}>{label}</Text>
    </Pressable>
  );
}

/** Full-screen, swipeable photo viewer opened from a gallery post. */
export function PhotoViewer({ photos, index, onClose }: { photos: string[] | null; index: number; onClose: () => void }) {
  return (
    <Modal visible={!!photos} animationType="fade" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      {photos ? <ViewerBody key={`${photos.join("|")}:${index}`} photos={photos} index={index} onClose={onClose} /> : null}
    </Modal>
  );
}

function ViewerBody({ photos, index, onClose }: { photos: string[]; index: number; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(index);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setCurrent(Math.max(0, Math.min(photos.length - 1, Math.round(e.nativeEvent.contentOffset.x / width))));
  return (
    <View style={s.viewer}>
      <FlatList
        data={photos}
        keyExtractor={(id) => id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={index}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onScroll={onScroll}
        scrollEventThrottle={32}
        renderItem={({ item }) => {
          const photo = photoFor(item);
          return (
            <View style={{ width, height, justifyContent: "center" }}>
              {photo ? <Image source={photo.source} accessibilityLabel={photo.alt} resizeMode="contain" style={{ width, height: height * 0.78 }} /> : null}
            </View>
          );
        }}
      />
      <View style={[s.viewerTop, { paddingTop: insets.top + 8 }]}>
        <Text style={s.viewerCount} accessibilityLiveRegion="polite">{current + 1} / {photos.length}</Text>
        <IconBtn label="Close photos" onPress={onClose}><X size={20} color={C.white} /></IconBtn>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: SURFACE.scrim },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, paddingTop: 10, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, backgroundColor: SURFACE.sheet },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginBottom: 8, backgroundColor: "rgba(255,247,237,0.2)" },
  row: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 54, paddingHorizontal: 22 },
  rowText: { color: C.white, fontSize: 15.5, fontWeight: "500" },
  cancel: { minHeight: 52, marginTop: 4, alignItems: "center", justifyContent: "center", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: LINE.hairline },
  cancelText: { color: C.ash, fontSize: 15, fontWeight: "600" },
  viewer: { flex: 1, backgroundColor: "#000" },
  viewerTop: { position: "absolute", left: 0, right: 0, top: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  viewerCount: { color: C.white, fontSize: 14, fontWeight: "600", fontVariant: ["tabular-nums"] },
});
