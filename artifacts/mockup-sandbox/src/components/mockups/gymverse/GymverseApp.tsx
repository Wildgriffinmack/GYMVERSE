import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Check } from "lucide-react";
import type { Comment, FeedTab, Post, Screen, TimelineEntry } from "./_parts/data";
import { CHALLENGES, INITIAL_TIMELINE, ME, SCREENS, STARTER_POSTS, seedComments } from "./_parts/data";
import type { PostDraft } from "./_parts/utils";
import { buildPost, timelineEntryFrom } from "./_parts/utils";
import { BottomNav } from "./_parts/ui";
import { WelcomeScreen } from "./_parts/WelcomeScreen";
import { FeedScreen } from "./_parts/FeedScreen";
import { ExploreScreen } from "./_parts/ExploreScreen";
import { CreateScreen } from "./_parts/CreateScreen";
import { ChallengesScreen } from "./_parts/ChallengesScreen";
import { ProfileScreen } from "./_parts/ProfileScreen";
import { ProgressScreen } from "./_parts/ProgressScreen";
import { CommentsSheet } from "./_parts/CommentsSheet";
import "./gymverse.css";

/** `?screen=explore` (or any screen name) opens the prototype directly on that screen. */
function initialScreen(): Screen {
  const requested = new URLSearchParams(window.location.search).get("screen");
  return SCREENS.find((screen) => screen === requested) ?? "welcome";
}

const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);

export function GymverseApp() {
  const [screen, setScreen] = useState<Screen>(initialScreen);
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
  const toastTimer = useRef<number | undefined>(undefined);

  const showToast = useCallback((text: string) => {
    window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text });
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  }, []);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const navigate = useCallback((next: Screen) => {
    setScreen(next);
    setCommentPostId(null);
  }, []);

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

  const likePost = (id: string, forceOn = false) => {
    setLikedIds((current) => (forceOn ? (current.includes(id) ? current : [...current, id]) : toggleIn(current, id)));
  };
  const savePost = (id: string) => {
    showToast(savedIds.includes(id) ? "Removed from saved." : "Saved to your training board.");
    setSavedIds((current) => toggleIn(current, id));
  };
  const followUser = (username: string) => {
    showToast(followed.includes(username) ? `Unfollowed @${username}.` : `Following @${username}.`);
    setFollowed((current) => toggleIn(current, username));
  };
  const sharePost = (post: Post) => showToast(`Link to @${post.username}’s post copied.`);

  const toggleChallenge = (id: string) => {
    const challenge = CHALLENGES.find((c) => c.id === id);
    if (!challenge) return;
    if (id === ME.challengeId) {
      showToast(`You’re on day ${ME.challengeDay}. Keep it going.`);
      return;
    }
    showToast(joined.includes(id) ? `Left ${challenge.title}.` : `Joined ${challenge.title}. Day 1 starts now.`);
    setJoined((current) => toggleIn(current, id));
  };

  const addComment = (postId: string, text: string) => {
    const comment: Comment = { id: `c-${Date.now()}`, user: ME.username, text, time: "now", likes: 0 };
    setAddedComments((current) => ({ ...current, [postId]: [comment, ...(current[postId] ?? [])] }));
    setPosts((current) => current.map((post) => (post.id === postId ? { ...post, comments: post.comments + 1 } : post)));
  };

  const createPost = (draft: PostDraft) => {
    const post = buildPost(draft);
    setPosts((current) => [post, ...current]);
    if (draft.addToTimeline) setTimeline((current) => [...current, timelineEntryFrom(post)]);
    setActiveTab("For You");
    navigate("home");
    showToast(draft.addToTimeline ? "Posted — and added to your Progress Timeline." : "Post added to your GYMVERSE feed.");
  };

  const commentPost = posts.find((post) => post.id === commentPostId);
  const myPosts = posts.filter((post) => post.username === ME.username);
  const savedPosts = posts.filter((post) => savedIds.includes(post.id));

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
      content = (
        <ProfileScreen
          myPosts={myPosts}
          savedPosts={savedPosts}
          onOpenPost={openPost}
          onTimeline={() => navigate("progress")}
          onChallenges={() => navigate("challenges")}
          onToast={showToast}
        />
      );
      break;
    case "progress":
      content = <ProgressScreen timeline={timeline} onBack={() => navigate("profile")} />;
      break;
  }

  return (
    <div className="gv-root">
      <main className="gv-phone">
        <div key={screen} className={`gv-screen is-${screen}`}>{content}</div>
        {screen !== "welcome" && <BottomNav active={screen} onNavigate={navigate} />}
        {commentPost && (
          <CommentsSheet
            post={commentPost}
            comments={[...(addedComments[commentPost.id] ?? []), ...seedComments(commentPost.id)]}
            onAdd={(text) => addComment(commentPost.id, text)}
            onClose={() => setCommentPostId(null)}
          />
        )}
        {toast && (
          <div key={toast.id} className={`gv-toast ${commentPost ? "is-top" : ""}`} role="status">
            <span className="gv-toast-icon"><Check size={15} strokeWidth={3} /></span>
            {toast.text}
          </div>
        )}
      </main>
    </div>
  );
}

export default GymverseApp;
