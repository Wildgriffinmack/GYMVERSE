import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Animated, Easing, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ListViewToken } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell, Bookmark, Flame, Heart, MessageCircle, Music2, Play, Send, ShieldAlert, TrendingUp } from "lucide-react-native";
import type { FeedTab, Post } from "../data";
import { FEED_TABS, ME } from "../data";
import { PostArt } from "../components/PostArt";
import { Avatar, Badge, GlassChip, IconBtn, Verified, Wordmark, tap, thump } from "../components/ui";
import { formatCount } from "../utils";
import { C, DIAG, F, GRAD, NAV_GAP, NAV_HEIGHT } from "../theme";
import type { FeedItem, SponsoredPlacement } from "../sponsors/sponsorData";
import { composeFeed } from "../sponsors/sponsorData";
import { SponsoredReel } from "../sponsors/SponsoredReel";

export type FeedProps = {
  tab: FeedTab;
  onTab: (tab: FeedTab) => void;
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
  onToast: (message: string) => void;
  /** Deterministic organic gap before each sponsored slot; null shows no sponsored posts. */
  sponsorGapAt?: ((slot: number) => number) | null;
  hiddenSponsorCampaigns?: string[];
  onSponsorExplore?: (p: SponsoredPlacement) => void;
  onSponsorOptions?: (p: SponsoredPlacement) => void;
};

const NO_HIDDEN: string[] = [];
const noop = () => {};

export function FeedScreen(props: FeedProps) {
  const { tab, onTab, posts, focusPostId, onFocusHandled, sponsorGapAt = null, hiddenSponsorCampaigns = NO_HIDDEN } = props;
  const insets = useSafeAreaInsets();
  const [height, setHeight] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const list = useRef<FlatList<FeedItem<Post>>>(null);
  const visible = useMemo(() => (tab === "For You" ? posts : posts.filter((p) => p.feeds.includes(tab))), [tab, posts]);
  // Organic order is preserved; sponsored items are interleaved into a separate render list.
  const items = useMemo(() => composeFeed(visible, sponsorGapAt, hiddenSponsorCampaigns), [visible, sponsorGapAt, hiddenSponsorCampaigns]);

  useEffect(() => {
    if (!focusPostId || !height) return;
    const index = items.findIndex((i) => i.kind === "organic" && i.post.id === focusPostId);
    if (index >= 0) requestAnimationFrame(() => list.current?.scrollToOffset({ offset: index * height, animated: false }));
    onFocusHandled();
  }, [focusPostId, height, items, onFocusHandled]);

  const onViewable = useRef(({ viewableItems }: { viewableItems: ListViewToken[] }) => {
    const first = viewableItems.find((v) => v.isViewable);
    if (first) setActiveId((first.item as FeedItem<Post>).key);
  }).current;

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }} onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
      {height > 0 && items.length > 0 ? (
        <FlatList
          key={tab}
          ref={list}
          data={items}
          keyExtractor={(i) => i.key}
          renderItem={({ item }) =>
            item.kind === "sponsored" ? (
              <SponsoredReel placement={item.placement} height={height} onExplore={props.onSponsorExplore ?? noop} onOptions={props.onSponsorOptions ?? noop} />
            ) : (
              <Reel post={item.post} height={height} active={item.key === (activeId ?? items[0]?.key)} {...props} />
            )
          }
          pagingEnabled
          snapToInterval={height}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          windowSize={3}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
        />
      ) : null}
      {height > 0 && items.length === 0 ? (
        <View style={s.empty}>
          <Flame size={34} color={C.flame} />
          <Text style={s.emptyTitle}>Nothing here yet</Text>
          <Text style={{ color: C.ash }}>Be the first to post in {tab}.</Text>
        </View>
      ) : null}

      <View style={[s.top, { paddingTop: insets.top + 6 }]} pointerEvents="box-none">
        <LinearGradient colors={["rgba(9,9,9,0.85)", "rgba(9,9,9,0.45)", "rgba(9,9,9,0)"]} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <View style={s.bar}>
          <Wordmark size={22} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable accessibilityRole="button" accessibilityLabel={`${ME.streak}-day streak`} onPress={() => { tap(); props.onToast(`${ME.streak}-day streak. Don’t break the chain.`); }} style={s.streak}>
              <Flame size={16} color={C.flame} fill={C.flame} />
              <Text style={s.streakText}>{ME.streak}</Text>
            </Pressable>
            <IconBtn label="Notifications" onPress={() => props.onToast("You’re all caught up.")}>
              <Bell size={19} color={C.white} />
              <View style={s.dot} />
            </IconBtn>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
          {FEED_TABS.map((item) => {
            const on = tab === item;
            return (
              <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: on }} aria-selected={on} onPress={() => { tap(); onTab(item); }} style={s.tab}>
                <Text style={[s.tabText, on && { color: C.white }]}>{item}</Text>
                {on ? <LinearGradient colors={GRAD} start={DIAG.start} end={DIAG.end} style={s.tabLine} /> : <View style={[s.tabLine, { backgroundColor: "transparent", shadowOpacity: 0 }]} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

function Reel({ post, height, active, likedIds, savedIds, followed, onLike, onSave, onFollow, onComment, onShare }: FeedProps & { post: Post; height: number; active: boolean }) {
  const insets = useSafeAreaInsets();
  const isVideo = post.postType !== "Photo";
  const [userPlaying, setUserPlaying] = useState(false);
  const playing = active && userPlaying;
  const [burst, setBurst] = useState(0);
  const lastTap = useRef(0);
  const single = useRef<ReturnType<typeof setTimeout> | null>(null);
  const liked = likedIds.includes(post.id);
  const saved = savedIds.includes(post.id);
  const isFollowing = followed.includes(post.username);
  const isMine = post.username === ME.username;
  const navSpace = insets.bottom + NAV_GAP + NAV_HEIGHT;

  useEffect(() => {
    if (!active) setUserPlaying(false);
  }, [active]);
  useEffect(() => () => { if (single.current) clearTimeout(single.current); }, []);

  const onMediaPress = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      if (single.current) clearTimeout(single.current);
      lastTap.current = 0;
      thump();
      onLike(post.id, true);
      setBurst((b) => b + 1);
      return;
    }
    lastTap.current = now;
    single.current = setTimeout(() => { if (isVideo) setUserPlaying((p) => !p); }, 280);
  }, [isVideo, onLike, post.id]);

  return (
    <View style={{ height, overflow: "hidden", backgroundColor: "#000" }}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onMediaPress} accessibilityLabel={isVideo ? (playing ? "Pause video" : "Play video") : "Double-tap to like"}>
        <PostArt art={post.art} variant="reel" />
        <LinearGradient colors={["rgba(0,0,0,0.5)", "rgba(0,0,0,0)", "rgba(0,0,0,0)", "rgba(0,0,0,0.6)", "rgba(0,0,0,0.94)"]} locations={[0, 0.2, 0.58, 0.74, 1]} style={StyleSheet.absoluteFill} />
      </Pressable>
      {isVideo ? <PlayButton visible={!playing} top={height * 0.6} /> : null}
      {burst > 0 ? <HeartBurst key={burst} top={height * 0.42} /> : null}

      <View style={[s.badges, { top: insets.top + 100 }]} pointerEvents="none">
        <Badge tone={post.badgeTone}>{post.badge}</Badge>
        {post.challenge ? <GlassChip icon={<Flame size={13} color={C.flame} />}>{post.challenge}</GlassChip> : null}
        {post.created ? <GlassChip icon={<TrendingUp size={13} color={C.flame} />}>{post.onTimeline ? "Added to timeline" : "Just posted"}</GlassChip> : null}
        {post.moderation === "in_review" ? <GlassChip icon={<ShieldAlert size={13} color={C.gold} />}>In review · only you</GlassChip> : null}
      </View>

      <View style={[s.info, { bottom: navSpace + 22 }]} pointerEvents="box-none">
        <View style={s.author}>
          <Avatar username={post.username} name={post.name} size={38} ring />
          <View style={{ flexShrink: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={s.authorName} numberOfLines={1}>@{post.username}</Text>
              {post.verified ? <Verified /> : null}
            </View>
            <Text style={s.authorMeta}>{post.name} · {post.time}</Text>
          </View>
          {!isMine ? (
            <Pressable accessibilityRole="button" accessibilityState={{ selected: isFollowing }} aria-selected={isFollowing} onPress={() => { tap(); onFollow(post.username); }} style={({ pressed }) => [s.follow, isFollowing && s.following, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
              <Text style={[s.followText, isFollowing && { color: C.muted }]}>{isFollowing ? "Following" : "Follow"}</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={s.caption} numberOfLines={2}>{post.caption}</Text>
        {post.hashtags.length ? (
          <Text style={s.hashtags} numberOfLines={1}>
            {post.hashtags.map((tag) => <Text key={tag}><Text style={{ color: C.flame }}>#</Text>{tag.slice(1)}{"   "}</Text>)}
          </Text>
        ) : null}
        <View style={s.audioRow}>
          <Music2 size={14} color={C.white} />
          <Marquee text={`${post.audio}  ·  `} running={playing} />
          <View style={s.catChip}><Text style={s.catText}>{post.category}</Text></View>
        </View>
      </View>

      <View style={[s.rail, { bottom: navSpace + 20 }]}>
        <RailButton label={formatCount(post.likes + (liked ? 1 : 0))} a11y={liked ? "Unlike" : "Like"} active={liked} onPress={() => { thump(); onLike(post.id); }}>
          <Heart size={28} color={liked ? C.hot : C.white} fill={liked ? C.hot : "transparent"} />
        </RailButton>
        <RailButton label={formatCount(post.comments)} a11y="Open comments" onPress={() => { tap(); onComment(post.id); }}>
          <MessageCircle size={27} color={C.white} />
        </RailButton>
        <RailButton label={formatCount(post.saves + (saved ? 1 : 0))} a11y={saved ? "Remove from saved" : "Save"} active={saved} onPress={() => { tap(); onSave(post.id); }}>
          <Bookmark size={26} color={saved ? C.gold : C.white} fill={saved ? C.gold : "transparent"} />
        </RailButton>
        <RailButton label="Share" a11y="Share" onPress={() => { tap(); onShare(post); }}>
          <Send size={25} color={C.white} />
        </RailButton>
        <Disc spinning={playing}><Avatar username={post.username} name={post.name} size={24} /></Disc>
      </View>

      {isVideo ? <ProgressLine running={playing} bottom={navSpace + 10} /> : null}
    </View>
  );
}

function RailButton({ label, a11y, active = false, onPress, children }: { label: string; a11y: string; active?: boolean; onPress: () => void; children: ReactNode }) {
  const pop = useRef(new Animated.Value(1)).current;
  const prev = useRef(active);
  useEffect(() => {
    if (active && !prev.current) {
      Animated.sequence([Animated.timing(pop, { toValue: 1.35, duration: 140, useNativeDriver: true }), Animated.spring(pop, { toValue: 1, friction: 4, useNativeDriver: true })]).start();
    }
    prev.current = active;
  }, [active, pop]);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${a11y}, ${label}`} accessibilityState={{ selected: active }} aria-selected={active} onPress={onPress} style={({ pressed }) => ({ alignItems: "center", gap: 3, transform: [{ scale: pressed ? 0.88 : 1 }] })}>
      <Animated.View style={[s.railIcon, { transform: [{ scale: pop }] }]}>{children}</Animated.View>
      <Text style={s.railCount}>{label}</Text>
    </Pressable>
  );
}

function PlayButton({ visible, top }: { visible: boolean; top: number }) {
  const v = useRef(new Animated.Value(visible ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: visible ? 1 : 0, duration: 260, useNativeDriver: true }).start();
  }, [visible, v]);
  return (
    <Animated.View pointerEvents="none" style={[s.play, { top: top - 29, opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1.4, 1] }) }] }]}>
      <Play size={28} color={C.white} fill={C.white} style={{ marginLeft: 4 }} />
    </Animated.View>
  );
}

function HeartBurst({ top }: { top: number }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 850, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [a]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: top - 58,
        alignSelf: "center",
        opacity: a.interpolate({ inputRange: [0, 0.2, 0.75, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { translateY: a.interpolate({ inputRange: [0, 0.75, 1], outputRange: [0, -8, -70] }) },
          { scale: a.interpolate({ inputRange: [0, 0.22, 0.4, 1], outputRange: [0.3, 1.15, 0.95, 1.2] }) },
          { rotate: "-8deg" },
        ],
      }}
    >
      <Heart size={116} color={C.hot} fill={C.hot} strokeWidth={0} />
    </Animated.View>
  );
}

function Disc({ spinning, children }: { spinning: boolean; children: ReactNode }) {
  const r = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!spinning) return;
    const loop = Animated.loop(Animated.timing(r, { toValue: 1, duration: 5000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [spinning, r]);
  return (
    <Animated.View style={[s.disc, { transform: [{ rotate: r.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] }]}>{children}</Animated.View>
  );
}

function ProgressLine({ running, bottom }: { running: boolean; bottom: number }) {
  const p = useRef(new Animated.Value(0.18)).current;
  useEffect(() => {
    if (!running) return;
    const loop = Animated.loop(Animated.sequence([Animated.timing(p, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: false }), Animated.timing(p, { toValue: 0, duration: 0, useNativeDriver: false })]));
    loop.start();
    return () => loop.stop();
  }, [running, p]);
  return (
    <View style={[s.progress, { bottom }]} pointerEvents="none">
      <Animated.View style={{ height: "100%", width: p.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }}>
        <LinearGradient colors={GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}

function Marquee({ text, running }: { text: string; running: boolean }) {
  const [w, setW] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!running || !w) return;
    const loop = Animated.loop(Animated.timing(x, { toValue: -w, duration: w * 28, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => { loop.stop(); };
  }, [running, w, x]);
  return (
    <View style={{ flex: 1, overflow: "hidden" }}>
      <Animated.View style={{ flexDirection: "row", transform: [{ translateX: x }] }}>
        <Text style={s.audio} numberOfLines={1} onLayout={(e) => setW(e.nativeEvent.layout.width)}>{text}</Text>
        <Text style={s.audio} numberOfLines={1}>{text}</Text>
      </Animated.View>
    </View>
  );
}

const shadow = { textShadowColor: "rgba(0,0,0,0.7)", textShadowRadius: 10, textShadowOffset: { width: 0, height: 1 } };

const s = StyleSheet.create({
  empty: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyTitle: { fontFamily: F.display, fontSize: 26, color: C.white, textTransform: "uppercase" },
  top: { position: "absolute", top: 0, left: 0, right: 0, paddingBottom: 6 },
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: 18, paddingRight: 14, paddingVertical: 4 },
  streak: { flexDirection: "row", alignItems: "center", gap: 5, height: 34, paddingLeft: 10, paddingRight: 12, borderRadius: 17, backgroundColor: "rgba(255,90,31,0.16)", borderWidth: 1, borderColor: "rgba(255,90,31,0.4)" },
  streakText: { fontFamily: F.label, fontSize: 16, color: C.white },
  dot: { position: "absolute", top: 9, right: 10, width: 7, height: 7, borderRadius: 4, backgroundColor: C.hot, borderWidth: 1.5, borderColor: C.bg },
  tabs: { paddingHorizontal: 18, gap: 22, paddingTop: 8 },
  tab: { alignItems: "center", gap: 7 },
  tabText: { fontFamily: F.label, fontSize: 17, letterSpacing: 0.8, textTransform: "uppercase", color: "rgba(255,247,237,0.55)", ...shadow },
  tabLine: { height: 3, width: "80%", borderRadius: 2, shadowColor: C.flame, shadowOpacity: 0.95, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  badges: { position: "absolute", left: 16, right: 80, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  info: { position: "absolute", left: 16, right: 82, gap: 8 },
  author: { flexDirection: "row", alignItems: "center", gap: 10 },
  authorName: { color: C.white, fontSize: 15, fontWeight: "700", ...shadow },
  authorMeta: { color: C.muted, fontSize: 12 },
  follow: { height: 30, paddingHorizontal: 14, marginLeft: 4, borderRadius: 10, borderWidth: 1.5, borderColor: "rgba(255,247,237,0.85)", justifyContent: "center" },
  following: { borderColor: "transparent", backgroundColor: "rgba(255,247,237,0.14)" },
  followText: { fontFamily: F.labelHeavy, fontSize: 13, letterSpacing: 1.3, textTransform: "uppercase", color: "#fff" },
  caption: { color: C.white, fontSize: 15, lineHeight: 21, fontWeight: "500", ...shadow },
  hashtags: { color: C.white, fontSize: 14, fontWeight: "700" },
  audioRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  audio: { color: C.white, fontSize: 13 },
  catChip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7, backgroundColor: "rgba(255,247,237,0.14)" },
  catText: { fontFamily: F.label, fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: C.white },
  rail: { position: "absolute", right: 10, alignItems: "center", gap: 14 },
  railIcon: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(9,9,9,0.3)" },
  railCount: { fontFamily: F.label, fontSize: 13, color: C.white, ...shadow },
  disc: { width: 44, height: 44, borderRadius: 22, marginTop: 4, alignItems: "center", justifyContent: "center", backgroundColor: "#141414", borderWidth: 6, borderColor: "#0b0b0b" },
  play: { position: "absolute", alignSelf: "center", width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(9,9,9,0.35)", borderWidth: 1.5, borderColor: "rgba(255,247,237,0.35)" },
  progress: { position: "absolute", left: 16, right: 16, height: 2.5, borderRadius: 2, overflow: "hidden", backgroundColor: "rgba(255,247,237,0.18)" },
});
