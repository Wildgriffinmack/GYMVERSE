import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Animated, BackHandler, Easing, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Anton_400Regular } from "@expo-google-fonts/anton/400Regular";
import { BarlowCondensed_600SemiBold } from "@expo-google-fonts/barlow-condensed/600SemiBold";
import { BarlowCondensed_700Bold } from "@expo-google-fonts/barlow-condensed/700Bold";
import { BarlowCondensed_800ExtraBold } from "@expo-google-fonts/barlow-condensed/800ExtraBold";
import type { Comment, FeedTab, Post, Screen, TimelineEntry } from "./src/data";
import { CHALLENGES, INITIAL_TIMELINE, ME, STARTER_POSTS, seedComments } from "./src/data";
import type { PostDraft } from "./src/utils";
import { buildPost, timelineEntryFrom } from "./src/utils";
import { BottomNav, Toast } from "./src/components/ui";
import { WelcomeScreen } from "./src/screens/Welcome";
import { FeedScreen } from "./src/screens/Feed";
import { ExploreScreen } from "./src/screens/Explore";
import { CreateScreen } from "./src/screens/Create";
import { ChallengesScreen } from "./src/screens/Challenges";
import { ProfileScreen } from "./src/screens/Profile";
import { ProgressScreen } from "./src/screens/Progress";
import { CommentsSheet } from "./src/screens/CommentsSheet";
import { C, NAV_GAP, NAV_HEIGHT } from "./src/theme";

const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export default function App() {
  const [fontsLoaded] = useFonts({ Anton_400Regular, BarlowCondensed_600SemiBold, BarlowCondensed_700Bold, BarlowCondensed_800ExtraBold });
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: C.bg }}>{fontsLoaded ? <Gymverse /> : null}</View>
    </SafeAreaProvider>
  );
}

function Gymverse() {
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState<Screen>("welcome");
  const [activeTab, setActiveTab] = useState<FeedTab>("For You");
  const [posts, setPosts] = useState<Post[]>(STARTER_POSTS);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [followed, setFollowed] = useState<string[]>([]);
  const [joined, setJoined] = useState<string[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>(INITIAL_TIMELINE);
  const [addedComments, setAddedComments] = useState<Record<string, Comment[]>>({});
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [focusPostId, setFocusPostId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = useCallback((text: string) => {
    clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text });
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const navigate = useCallback((next: Screen) => {
    setScreen(next);
    setCommentPostId(null);
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (commentPostId) { setCommentPostId(null); return true; }
      if (screen === "progress") { navigate("profile"); return true; }
      if (screen !== "home" && screen !== "welcome") { navigate("home"); return true; }
      return false;
    });
    return () => sub.remove();
  }, [screen, commentPostId, navigate]);

  const openFeed = (tab: FeedTab, label?: string) => {
    setActiveTab(tab);
    navigate("home");
    if (label) showToast(`Showing ${label}`);
  };
  const openPost = (id: string) => {
    setActiveTab("For You");
    setFocusPostId(id);
    navigate("home");
  };
  const clearFocus = useCallback(() => setFocusPostId(null), []);

  const likePost = (id: string, forceOn = false) => setLikedIds((cur) => (forceOn ? (cur.includes(id) ? cur : [...cur, id]) : toggleIn(cur, id)));
  const savePost = (id: string) => {
    showToast(savedIds.includes(id) ? "Removed from saved." : "Saved to your training board.");
    setSavedIds((cur) => toggleIn(cur, id));
  };
  const followUser = (username: string) => {
    showToast(followed.includes(username) ? `Unfollowed @${username}.` : `Following @${username}.`);
    setFollowed((cur) => toggleIn(cur, username));
  };
  const sharePost = (post: Post) => showToast(`Link to @${post.username}’s post copied.`);
  const toggleChallenge = (id: string) => {
    const c = CHALLENGES.find((x) => x.id === id);
    if (!c) return;
    if (id === ME.challengeId) { showToast(`You’re on day ${ME.challengeDay}. Keep it going.`); return; }
    showToast(joined.includes(id) ? `Left ${c.title}.` : `Joined ${c.title}. Day 1 starts now.`);
    setJoined((cur) => toggleIn(cur, id));
  };
  const addComment = (postId: string, text: string) => {
    const comment: Comment = { id: `c-${Date.now()}`, user: ME.username, text, time: "now", likes: 0 };
    setAddedComments((cur) => ({ ...cur, [postId]: [comment, ...(cur[postId] ?? [])] }));
    setPosts((cur) => cur.map((p) => (p.id === postId ? { ...p, comments: p.comments + 1 } : p)));
  };
  const createPost = (draft: PostDraft) => {
    const post = buildPost(draft);
    setPosts((cur) => [post, ...cur]);
    if (draft.addToTimeline) setTimeline((cur) => [...cur, timelineEntryFrom(post)]);
    setActiveTab("For You");
    navigate("home");
    showToast(draft.addToTimeline ? "Posted — and added to your Progress Timeline." : "Post added to your GYMVERSE feed.");
  };

  const commentPost = posts.find((p) => p.id === commentPostId) ?? null;
  const myPosts = posts.filter((p) => p.username === ME.username);
  const savedPosts = posts.filter((p) => savedIds.includes(p.id));

  let content: ReactNode;
  switch (screen) {
    case "welcome":
      content = <WelcomeScreen onEnter={() => navigate("home")} />;
      break;
    case "home":
      content = (
        <FeedScreen
          tab={activeTab}
          onTab={setActiveTab}
          posts={posts}
          likedIds={likedIds}
          savedIds={savedIds}
          followed={followed}
          focusPostId={focusPostId}
          onFocusHandled={clearFocus}
          onLike={likePost}
          onSave={savePost}
          onFollow={followUser}
          onComment={setCommentPostId}
          onShare={sharePost}
          onToast={showToast}
        />
      );
      break;
    case "explore":
      content = <ExploreScreen onOpenFeed={openFeed} />;
      break;
    case "create":
      content = <CreateScreen onPost={createPost} onClose={() => navigate("home")} onToast={showToast} />;
      break;
    case "challenges":
      content = <ChallengesScreen joined={joined} onToggle={toggleChallenge} />;
      break;
    case "profile":
      content = <ProfileScreen myPosts={myPosts} savedPosts={savedPosts} onOpenPost={openPost} onTimeline={() => navigate("progress")} onChallenges={() => navigate("challenges")} onToast={showToast} />;
      break;
    case "progress":
      content = <ProgressScreen timeline={timeline} onBack={() => navigate("profile")} />;
      break;
  }

  return (
    <View style={{ flex: 1 }}>
      <ScreenTransition key={screen}>{content}</ScreenTransition>
      {screen !== "welcome" ? <BottomNav active={screen} onNavigate={navigate} bottom={insets.bottom} /> : null}
      <CommentsSheet
        post={commentPost}
        comments={commentPost ? [...(addedComments[commentPost.id] ?? []), ...seedComments(commentPost.id)] : []}
        onAdd={(text) => commentPost && addComment(commentPost.id, text)}
        onClose={() => setCommentPostId(null)}
      />
      {toast ? <Toast key={toast.id} text={toast.text} bottom={insets.bottom + NAV_GAP + NAV_HEIGHT + 14} /> : null}
    </View>
  );
}

function ScreenTransition({ children }: { children: ReactNode }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [a]);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }, { scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] }) }] }]}>
      {children}
    </Animated.View>
  );
}
