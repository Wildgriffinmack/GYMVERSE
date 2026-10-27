import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell, Plus, Send } from "lucide-react-native";
import type { Post } from "../data";
import { ME } from "../data";
import { Avatar, Wordmark, tap } from "../components/ui";
import { C, DIAG, GRAD, NAV_HEIGHT } from "../theme";
import { HomePost } from "./HomePost";
import type { HomePostHandlers } from "./HomePost";
import { PhotoViewer, PostMenu } from "./HomeOverlays";
import { HOME_TABS, homePosts } from "./homeFeed";
import type { HomeTab } from "./homeFeed";
import { STORIES } from "./homeData";

export type HomeFeedProps = {
  tab: HomeTab;
  onTab: (tab: HomeTab) => void;
  posts: Post[];
  likedIds: string[];
  savedIds: string[];
  followed: string[];
  focusPostId: string | null;
  onFocusHandled: () => void;
  onLike: (id: string, forceOn?: boolean) => void;
  onSave: (id: string) => void;
  onFollow: (username: string) => void;
  onComment: (id: string) => void;
  onShare: (post: Post) => void;
  onOpenClip: (id: string) => void;
  onToast: (message: string) => void;
};

type Row = { kind: "tabs" } | { kind: "empty" } | { kind: "post"; post: Post };
const TABS_ROW: Row = { kind: "tabs" };
const EMPTY_ROW: Row = { kind: "empty" };
const TABS_HEIGHT = 36;

/** GYMX Home Feed: stories, Following / For You, and photo, PR and clip posts. */
export function HomeFeedScreen(props: HomeFeedProps) {
  const { tab, onTab, posts, likedIds, savedIds, followed, focusPostId, onFocusHandled, onToast } = props;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const list = useRef<FlatList<Row>>(null);
  const offset = useRef(0);
  const [storiesH, setStoriesH] = useState(0);
  const [menuPost, setMenuPost] = useState<Post | null>(null);
  const [viewer, setViewer] = useState<{ photos: string[]; index: number } | null>(null);

  // Stable handlers so memoised posts only re-render when their own data changes.
  const latest = useRef(props);
  latest.current = props;
  const handlers = useMemo<HomePostHandlers>(
    () => ({
      onLike: (id, forceOn) => latest.current.onLike(id, forceOn),
      onSave: (id) => latest.current.onSave(id),
      onComment: (id) => latest.current.onComment(id),
      onShare: (post) => latest.current.onShare(post),
      onOpenClip: (id) => latest.current.onOpenClip(id),
      onMore: (post) => setMenuPost(post),
      onOpenPhotos: (photos, index) => setViewer({ photos, index }),
    }),
    [],
  );

  const visible = useMemo(() => homePosts(posts, tab, followed), [posts, tab, followed]);
  const rows = useMemo<Row[]>(() => [TABS_ROW, ...(visible.length ? visible.map((post) => ({ kind: "post" as const, post })) : [EMPTY_ROW])], [visible]);

  const selectTab = (next: HomeTab) => {
    if (next === tab) return;
    tap();
    // Keep the tabs pinned at the top when switching instead of landing mid-list.
    if (offset.current > storiesH) list.current?.scrollToOffset({ offset: storiesH, animated: false });
    onTab(next);
  };

  useEffect(() => {
    if (!focusPostId) return;
    const index = rows.findIndex((r) => r.kind === "post" && r.post.id === focusPostId);
    if (index >= 0) requestAnimationFrame(() => list.current?.scrollToIndex({ index, viewOffset: TABS_HEIGHT, animated: false }));
    onFocusHandled();
  }, [focusPostId, rows, onFocusHandled]);

  const onScrollToIndexFailed = useCallback((info: { index: number; averageItemLength: number }) => {
    list.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
    setTimeout(() => list.current?.scrollToIndex({ index: info.index, viewOffset: TABS_HEIGHT, animated: false }), 120);
  }, []);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => { offset.current = e.nativeEvent.contentOffset.y; };

  const renderItem = ({ item }: { item: Row }) => {
    if (item.kind === "tabs") return <HomeTabs tab={tab} onSelect={selectTab} />;
    if (item.kind === "empty") {
      return (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>Your Following feed is quiet</Text>
          <Text style={s.emptyText}>Follow lifters from For You and their posts will show up here.</Text>
        </View>
      );
    }
    return <HomePost post={item.post} liked={likedIds.includes(item.post.id)} saved={savedIds.includes(item.post.id)} width={width} {...handlers} />;
  };

  const story = (label: string) => () => { tap(); onToast(`${label} — stories are coming soon.`); };

  return (
    <View style={s.screen}>
      <View style={[s.top, { paddingTop: insets.top + 6 }]}>
        <Wordmark size={30} tone="accent" />
        <View style={s.topIcons}>
          <Pressable accessibilityRole="button" accessibilityLabel="Notifications" hitSlop={8} onPress={() => { tap(); onToast("You’re all caught up."); }} style={({ pressed }) => [s.topBtn, { opacity: pressed ? 0.5 : 1 }]}>
            <Bell size={24} color={C.white} strokeWidth={1.8} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Messages" hitSlop={8} onPress={() => { tap(); onToast("Messages are coming soon."); }} style={({ pressed }) => [s.topBtn, { opacity: pressed ? 0.5 : 1 }]}>
            <Send size={23} color={C.white} strokeWidth={1.8} />
          </Pressable>
        </View>
      </View>

      <FlatList
        ref={list}
        data={rows}
        keyExtractor={(r) => (r.kind === "post" ? r.post.id : r.kind)}
        renderItem={renderItem}
        extraData={`${likedIds.join()}|${savedIds.join()}|${width}|${tab}`}
        ListHeaderComponent={
          <View onLayout={(e) => setStoriesH(e.nativeEvent.layout.height)}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.stories}>
              <StoryBubble own username={ME.username} name={ME.name} label="Your Story" onPress={story("Your story")} />
              {STORIES.map((st) => <StoryBubble key={st.username} username={st.username} name={st.name} label={st.label} onPress={story(`${st.label}’s story`)} />)}
            </ScrollView>
          </View>
        }
        stickyHeaderIndices={[1]}
        onScroll={onScroll}
        scrollEventThrottle={64}
        onScrollToIndexFailed={onScrollToIndexFailed}
        contentContainerStyle={{ paddingBottom: insets.bottom + NAV_HEIGHT + 16 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        maxToRenderPerBatch={4}
        windowSize={7}
      />

      <PostMenu
        post={menuPost}
        following={!!menuPost && followed.includes(menuPost.username)}
        isMine={menuPost?.username === ME.username}
        onClose={() => setMenuPost(null)}
        onFollow={props.onFollow}
        onShare={props.onShare}
        onOpenClip={props.onOpenClip}
      />
      <PhotoViewer photos={viewer?.photos ?? null} index={viewer?.index ?? 0} onClose={() => setViewer(null)} />
    </View>
  );
}

function StoryBubble({ username, name, label, own = false, onPress }: { username: string; name: string; label: string; own?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={own ? "Your story, add to your story" : `${label}’s story`} onPress={onPress} style={({ pressed }) => [s.story, { opacity: pressed ? 0.7 : 1 }]}>
      {own ? (
        <View style={s.ownRing}>
          <Avatar username={username} name={name} size={AVATAR} />
          <View style={s.plus}><Plus size={11} color="#fff" strokeWidth={3.2} /></View>
        </View>
      ) : (
        <LinearGradient colors={GRAD} start={DIAG.start} end={DIAG.end} style={s.ring}>
          <View style={s.ringGap}><Avatar username={username} name={name} size={AVATAR} /></View>
        </LinearGradient>
      )}
      <Text style={s.storyLabel} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

function HomeTabs({ tab, onSelect }: { tab: HomeTab; onSelect: (tab: HomeTab) => void }) {
  return (
    <View style={s.tabsBar}>
      {HOME_TABS.map((t) => {
        const on = t === tab;
        return (
          <Pressable key={t} accessibilityRole="tab" accessibilityLabel={t} accessibilityState={{ selected: on }} aria-selected={on} onPress={() => onSelect(t)} style={s.tab}>
            <Text style={[s.tabText, on && s.tabTextOn]}>{t}</Text>
            <View style={[s.tabLine, on && { backgroundColor: C.flame }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const RING = 50;
const AVATAR = 42;

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingBottom: 6, backgroundColor: C.bg },
  topIcons: { flexDirection: "row", alignItems: "center", gap: 14 },
  topBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  stories: { paddingHorizontal: 10, paddingTop: 6, paddingBottom: 6, gap: 4 },
  story: { width: 60, alignItems: "center", gap: 4 },
  ring: { width: RING, height: RING, borderRadius: RING / 2, alignItems: "center", justifyContent: "center" },
  ringGap: { width: RING - 4, height: RING - 4, borderRadius: (RING - 4) / 2, alignItems: "center", justifyContent: "center", backgroundColor: C.bg },
  ownRing: { width: RING, height: RING, borderRadius: RING / 2, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(255,247,237,0.22)" },
  plus: { position: "absolute", right: -2, bottom: -2, width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: C.flame, borderWidth: 2, borderColor: C.bg },
  storyLabel: { maxWidth: 60, color: "rgba(255,247,237,0.78)", fontSize: 10.5 },
  tabsBar: { height: TABS_HEIGHT, flexDirection: "row", justifyContent: "center", gap: 6, backgroundColor: C.bg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,247,237,0.09)" },
  tab: { width: 92, alignItems: "center", justifyContent: "flex-end" },
  tabText: { color: C.ash, fontSize: 13, fontWeight: "600", marginBottom: 8 },
  tabTextOn: { color: C.white },
  tabLine: { alignSelf: "stretch", height: 2, borderRadius: 1, backgroundColor: "transparent" },
  empty: { paddingHorizontal: 32, paddingVertical: 48, alignItems: "center", gap: 6 },
  emptyTitle: { color: C.white, fontSize: 16, fontWeight: "700" },
  emptyText: { color: C.ash, fontSize: 14, textAlign: "center", lineHeight: 20 },
});
