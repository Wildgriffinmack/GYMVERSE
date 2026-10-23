import { useMemo, useState } from "react";
import type { ComponentType, FormEvent, ReactNode } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  Bookmark,
  Camera,
  Check,
  ChevronRight,
  Compass,
  Dumbbell,
  Flame,
  Footprints,
  Heart,
  House,
  ImagePlus,
  Medal,
  MessageCircle,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  Send,
  Share2,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  UserRound,
  Utensils,
  Zap,
} from "lucide-react";
import "./gymverse.css";

type Screen = "welcome" | "home" | "explore" | "create" | "profile" | "progress" | "challenges";
type FeedTab = "For You" | "Motivation" | "Workouts" | "Transformations" | "Beginner" | "PRs";

type Post = {
  id: string;
  username: string;
  name: string;
  caption: string;
  category: string;
  feed: FeedTab;
  likes: number;
  comments: number;
  art: string;
  artLine: string;
  created?: boolean;
};

type TimelineEntry = { title: string; note: string; date?: string };

const feedTabs: FeedTab[] = ["For You", "Motivation", "Workouts", "Transformations", "Beginner", "PRs"];

const starterPosts: Post[] = [
  {
    id: "griffin-pr",
    username: "griffinlifts",
    name: "Griffin Cole",
    caption: "Day 42. Finally hit 225 on bench. Keep showing up.",
    category: "PERSONAL RECORD",
    feed: "PRs",
    likes: 284,
    comments: 32,
    art: "lime",
    artLine: "225 LB / BENCH",
  },
  {
    id: "maya-push",
    username: "maya_moves",
    name: "Maya Chen",
    caption: "Beginner push day routine — save this for your next workout.",
    category: "BEGINNER WORKOUT",
    feed: "Beginner",
    likes: 913,
    comments: 48,
    art: "",
    artLine: "PUSH DAY / 01",
  },
  {
    id: "jay-change",
    username: "iron_jay",
    name: "Jay Bennett",
    caption: "6-month transformation. Discipline beats motivation.",
    category: "TRANSFORMATION",
    feed: "Transformations",
    likes: 2400,
    comments: 186,
    art: "orange",
    artLine: "6 MONTHS / IN",
  },
  {
    id: "elena-form",
    username: "coach_elena",
    name: "Elena Ruiz",
    caption: "3 squat form tips every beginner should know.",
    category: "FORM CHECK",
    feed: "Workouts",
    likes: 641,
    comments: 58,
    art: "lime",
    artLine: "SQUAT / BETTER",
  },
  {
    id: "noexcuses-daily",
    username: "noexcuses",
    name: "No Excuses Club",
    caption: "You do not need motivation. You need consistency.",
    category: "DAILY REMINDER",
    feed: "Motivation",
    likes: 1800,
    comments: 91,
    art: "red",
    artLine: "SHOW UP / AGAIN",
  },
];

const interests = [
  "Build Muscle",
  "Lose Weight",
  "Get Motivated",
  "Learn Workouts",
  "Track Progress",
  "Find Gym Community",
];

const categories: {
  name: string;
  desc: string;
  count: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  tab: FeedTab;
}[] = [
  { name: "Gym Motivation", desc: "A little push for the days you need it.", count: "2.4k posts", icon: Flame, tab: "Motivation" },
  { name: "Beginner Workouts", desc: "Simple plans. Strong first steps.", count: "1.8k posts", icon: Activity, tab: "Beginner" },
  { name: "Transformations", desc: "Real journeys, measured in months.", count: "986 posts", icon: TrendingUp, tab: "Transformations" },
  { name: "Strength Training", desc: "Build a stronger foundation.", count: "1.2k posts", icon: Dumbbell, tab: "Workouts" },
  { name: "Bodybuilding", desc: "Training, symmetry, and the details.", count: "874 posts", icon: Zap, tab: "Workouts" },
  { name: "Weight Loss", desc: "Small wins add up to big change.", count: "1.1k posts", icon: Target, tab: "Transformations" },
  { name: "Nutrition", desc: "Fuel your next rep and recovery.", count: "763 posts", icon: Utensils, tab: "Beginner" },
  { name: "Powerlifting", desc: "Squat. Bench. Deadlift. Repeat.", count: "649 posts", icon: Medal, tab: "PRs" },
  { name: "Calisthenics", desc: "Own every inch of your bodyweight.", count: "538 posts", icon: Footprints, tab: "Workouts" },
  { name: "Mental Discipline", desc: "Consistency is a skill you can train.", count: "1.6k posts", icon: Sparkles, tab: "Motivation" },
];

const initialTimeline: TimelineEntry[] = [
  { title: "Day 1", note: "First day locked in.", date: "6 months ago" },
  { title: "Week 2", note: "Starting to feel stronger.", date: "5 months ago" },
  { title: "Month 1", note: "Hit 20 workouts.", date: "5 months ago" },
  { title: "Month 3", note: "Bench PR + better consistency.", date: "3 months ago" },
  { title: "Month 6", note: "Transformation update.", date: "Today" },
];

const challenges = [
  { id: "consistency", title: "30-Day Gym Consistency Challenge", members: "18.2k", difficulty: "ALL LEVELS", desc: "Show up for 30 days. Any movement counts.", progress: 43, icon: Flame },
  { id: "pushups", title: "100 Pushups a Day Challenge", members: "8.7k", difficulty: "INTERMEDIATE", desc: "Break them into sets. Build the habit.", progress: 0, icon: Dumbbell },
  { id: "pullup", title: "First Pull-Up Challenge", members: "5.3k", difficulty: "BEGINNER", desc: "A coached path from hang to your first rep.", progress: 0, icon: Target },
  { id: "transform", title: "12-Week Transformation Challenge", members: "12.9k", difficulty: "ALL LEVELS", desc: "Three months of training, logged your way.", progress: 0, icon: TrendingUp },
  { id: "pr-week", title: "PR Week Challenge", members: "3.1k", difficulty: "ADVANCED", desc: "Pick one lift. Set a number. Go earn it.", progress: 0, icon: Trophy },
  { id: "cardio", title: "No Excuses Cardio Challenge", members: "6.4k", difficulty: "ALL LEVELS", desc: "Twenty minutes of movement, five days a week.", progress: 0, icon: Timer },
];

const postCategories = ["Workout", "Transformation", "PR", "Motivation", "Beginner", "Nutrition"];
function Wordmark({ small = false }: { small?: boolean }) {
  return <div className="gv-wordmark" style={small ? { fontSize: 18 } : undefined}>GYM<span>VERSE</span></div>;
}

function Topbar({ title, back, onBack, action }: { title?: string; back?: boolean; onBack?: () => void; action?: () => void }) {
  return (
    <div className="gv-topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {back && <button className="gv-icon-button" aria-label="Back to profile" onClick={onBack}><ArrowLeft size={17} /></button>}
        {title ? <div className="gv-title">{title}</div> : <Wordmark small />}
      </div>
      {!back && (
        <button className="gv-icon-button" aria-label={title === "Explore" ? "Search categories" : "Notifications"} onClick={action}>
          {title === "Explore" ? <Search size={17} /> : <Bell size={17} />}
        </button>
      )}
    </div>
  );
}

function BottomNav({ active, onNavigate }: { active: Screen; onNavigate: (screen: Screen) => void }) {
  return (
    <nav className="gv-bottom-nav" aria-label="Main navigation">
      <button className={`gv-nav-item ${active === "home" ? "active" : ""}`} onClick={() => onNavigate("home")}><House size={19} /><span>Home</span></button>
      <button className={`gv-nav-item ${active === "explore" ? "active" : ""}`} onClick={() => onNavigate("explore")}><Compass size={19} /><span>Explore</span></button>
      <button className="gv-nav-create" aria-label="Create post" onClick={() => onNavigate("create")}><Plus size={24} strokeWidth={2.5} /></button>
      <button className={`gv-nav-item ${active === "challenges" ? "active" : ""}`} onClick={() => onNavigate("challenges")}><Trophy size={19} /><span>Challenges</span></button>
      <button className={`gv-nav-item ${active === "profile" || active === "progress" ? "active" : ""}`} onClick={() => onNavigate("profile")}><UserRound size={19} /><span>Profile</span></button>
    </nav>
  );
}

function PostCard({
  post,
  liked,
  saved,
  followed,
  onLike,
  onSave,
  onFollow,
  onComment,
  onShare,
}: {
  post: Post;
  liked: boolean;
  saved: boolean;
  followed: boolean;
  onLike: () => void;
  onSave: () => void;
  onFollow: () => void;
  onComment: () => void;
  onShare: () => void;
}) {
  const initials = post.name.split(" ").map((part) => part[0]).slice(0, 2).join("");
  return (
    <article className="gv-panel gv-post gv-enter">
      <div className="gv-post-head">
        <div className="gv-avatar">{initials}</div>
        <div className="gv-user-info">
          <div className="gv-user">@{post.username}</div>
          <div className="gv-meta">{post.category} · {post.created ? "just now" : "2h ago"}</div>
        </div>
        {post.username !== "griffinlifts" && <button className="gv-follow" onClick={onFollow}>{followed ? "Following" : "Follow +"}</button>}
        <button className="gv-icon-button" style={{ width: 31, height: 31, border: 0 }} aria-label={`More from ${post.username}`} onClick={onShare}><MoreHorizontal size={18} /></button>
      </div>
      <div className={`gv-art ${post.art}`}>
        <div className="gv-art-label"><span className="gv-art-overline">GYMVERSE / FIELD NOTES</span>{post.artLine}</div>
        <div className="gv-art-play"><Play size={15} fill="white" /></div>
      </div>
      <div className="gv-post-caption">{post.caption}</div>
      <div className="gv-post-actions">
        <button className={`gv-action ${liked ? "active" : ""}`} onClick={onLike} aria-label={liked ? "Unlike post" : "Like post"}><Heart size={17} fill={liked ? "currentColor" : "none"} />{post.likes + (liked ? 1 : 0)}</button>
        <button className="gv-action" onClick={onComment} aria-label="Open comments"><MessageCircle size={17} />{post.comments}</button>
        <button className={`gv-action ${saved ? "active" : ""}`} onClick={onSave} aria-label={saved ? "Remove saved post" : "Save post"}><Bookmark size={17} fill={saved ? "currentColor" : "none"} /></button>
        <button className="gv-action" onClick={onShare} aria-label="Share post"><Share2 size={17} /></button>
      </div>
    </article>
  );
}

export function GymverseApp() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [activeTab, setActiveTab] = useState<FeedTab>("For You");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["Build Muscle", "Track Progress"]);
  const [posts, setPosts] = useState<Post[]>(starterPosts);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  const [joinedChallenges, setJoinedChallenges] = useState<string[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>(initialTimeline);
  const [toast, setToast] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtag, setHashtag] = useState("");
  const [postCategory, setPostCategory] = useState("Workout");
  const [addToTimeline, setAddToTimeline] = useState(false);
  const [demoMedia, setDemoMedia] = useState(false);
  const [commentPost, setCommentPost] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2300);
  };
  const navigate = (next: Screen) => {
    setScreen(next);
    setCommentPost(null);
    setToast("");
  };
  const visiblePosts = useMemo(() => activeTab === "For You" ? posts : posts.filter((post) => post.feed === activeTab), [activeTab, posts]);
  const setToggle = (list: string[], setter: (value: string[]) => void, id: string) => {
    setter(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  };
  const toggleInterest = (interest: string) => {
    setSelectedInterests((current) => current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest]);
  };
  const categoryToFeed = (category: string): FeedTab => {
    if (category === "PR" || category === "Powerlifting") return "PRs";
    if (category === "Motivation" || category === "Gym Motivation" || category === "Mental Discipline") return "Motivation";
    if (category === "Transformation" || category === "Transformations" || category === "Weight Loss") return "Transformations";
    if (category === "Beginner" || category === "Beginner Workouts" || category === "Nutrition") return "Beginner";
    if (category === "Workout" || category === "Strength Training" || category === "Bodybuilding" || category === "Calisthenics") return "Workouts";
    return "For You";
  };
  const openCategory = (category: string) => {
    setActiveTab(categoryToFeed(category));
    navigate("home");
  };
  const submitPost = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!caption.trim()) {
      showToast("Add a caption before posting.");
      return;
    }
    const mappedFeed = categoryToFeed(postCategory);
    const newPost: Post = {
      id: `local-${Date.now()}`,
      username: "griffinlifts",
      name: "Griffin Cole",
      caption: `${caption.trim()}${hashtag.trim() ? `  ${hashtag.trim().startsWith("#") ? hashtag.trim() : `#${hashtag.trim()}`}` : ""}`,
      category: postCategory.toUpperCase(),
      feed: mappedFeed,
      likes: 0,
      comments: 0,
      art: "lime",
      artLine: demoMedia ? "NEW CLIP / 01" : "TRAINING / LOG",
      created: true,
    };
    setPosts((current) => [newPost, ...current]);
    if (addToTimeline) setTimeline((current) => [...current, { title: "New session", note: caption.trim(), date: "Just now" }]);
    setCaption("");
    setHashtag("");
    setDemoMedia(false);
    setAddToTimeline(false);
    setActiveTab("For You");
    navigate("home");
    showToast("Post added to demo feed.");
  };

  const renderWelcome = () => (
    <div className="gv-welcome gv-enter">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Wordmark />
        <span className="gv-tag"><span style={{ width: 6, height: 6, borderRadius: 9, background: "#39FF88" }} /> YOUR FITNESS SPACE</span>
      </div>
      <div className="gv-welcome-art" />
      <div className="gv-welcome-content">
        <div className="gv-kicker" style={{ color: "#39FF88" }}>TRAIN TOGETHER / GET BETTER</div>
        <h1 className="gv-welcome-logo" style={{ margin: "17px 0 0" }}>GYM<br /><span>VERSE</span></h1>
        <p className="gv-welcome-tagline">Your gym feed. Nothing else.</p>
        <p className="gv-welcome-copy">Workouts, transformations, PRs, challenges, and motivation — all in one fitness-only community.</p>
        <div className="gv-chip-wrap">
          {interests.map((interest) => <button key={interest} className={`gv-interest ${selectedInterests.includes(interest) ? "selected" : ""}`} onClick={() => toggleInterest(interest)}>{selectedInterests.includes(interest) && <Check size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />}{interest}</button>)}
        </div>
      </div>
      <div className="gv-welcome-actions">
        <button className="gv-button" onClick={() => { navigate("home"); showToast("Your training community is ready."); }}>Get Started <ArrowRight size={17} /></button>
        <button className="gv-button secondary" onClick={() => navigate("home")}>Explore Demo <Compass size={16} /></button>
        <div style={{ textAlign: "center", color: "#59625c", fontSize: 10, marginTop: 2 }}>NO PRESSURE. JUST PROGRESS.</div>
      </div>
    </div>
  );

  const renderHome = () => (
    <>
      <Topbar action={() => showToast("You’re all caught up.")} />
      <div className="gv-scroll">
        <section className="gv-section" style={{ paddingTop: 18 }}>
          <div className="gv-section-head">
            <div><div className="gv-kicker">MONDAY · LET'S GET AFTER IT</div><h1 className="gv-headline" style={{ marginTop: 5 }}>Your next rep<br />starts here.</h1></div>
            <button className="gv-icon-button" aria-label="Open profile" onClick={() => navigate("profile")}><div className="gv-avatar" style={{ width: 33, height: 33, fontSize: 10 }}>GC</div></button>
          </div>
          <div className="gv-streak-card">
            <div style={{ width: 39, height: 39, borderRadius: 13, display: "grid", placeItems: "center", background: "rgba(57,255,136,.12)", color: "#39FF88" }}><Flame size={21} /></div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 700 }}>28-day streak</div><div className="gv-meta">Your consistency is showing.</div></div>
            <div className="gv-streak-number">28<span style={{ font: "600 11px DM Sans", color: "#9CA3A0", marginLeft: 4 }}>DAYS</span></div>
          </div>
        </section>
        <div style={{ marginTop: 22 }}>
          <div className="gv-tabs">
            {feedTabs.map((tab) => <button key={tab} className={`gv-tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>{tab}</button>)}
          </div>
        </div>
        {visiblePosts.length ? visiblePosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            liked={likedIds.includes(post.id)}
            saved={savedIds.includes(post.id)}
            followed={followedUsers.includes(post.username)}
            onLike={() => setToggle(likedIds, setLikedIds, post.id)}
            onSave={() => { setToggle(savedIds, setSavedIds, post.id); showToast(savedIds.includes(post.id) ? "Removed from saved posts." : "Saved to your training board."); }}
            onFollow={() => { setToggle(followedUsers, setFollowedUsers, post.username); showToast(followedUsers.includes(post.username) ? `Unfollowed @${post.username}.` : `Following @${post.username}.`); }}
            onComment={() => setCommentPost(post.id)}
            onShare={() => showToast("Post link copied to your demo clipboard.")}
          />
        )) : <div className="gv-empty gv-panel" style={{ margin: 18 }}>No posts in this lane yet. Try another feed.</div>}
        {commentPost && <div className="gv-panel gv-enter" style={{ margin: "12px 16px", padding: 15 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><b style={{ fontSize: 13 }}>Community comments</b><button className="gv-icon-button" style={{ width: 30, height: 30 }} aria-label="Close comments" onClick={() => setCommentPost(null)}>×</button></div>
          <p className="gv-body" style={{ margin: "11px 0" }}>“This is the kind of progress that keeps me going.” <span style={{ color: "#39FF88" }}>@liftwithlee</span></p>
          <p className="gv-body" style={{ margin: 0 }}>“One rep at a time. You earned it.” <span style={{ color: "#39FF88" }}>@maya_moves</span></p>
          <button className="gv-action" style={{ marginTop: 10, color: "#39FF88" }} onClick={() => showToast("Comment added to the demo conversation.")}><Send size={14} /> Add a comment</button>
        </div>}
        <div style={{ height: 20 }} />
      </div>
    </>
  );

  const renderExplore = () => (
    <>
      <Topbar title="Explore" action={() => showToast("Category search is ready to explore.")} />
      <div className="gv-scroll">
        <section className="gv-section" style={{ paddingTop: 20 }}>
          <div className="gv-kicker">FIND YOUR LANE</div>
          <div className="gv-section-head" style={{ marginTop: 6 }}><h1 className="gv-headline">Built around<br />your next goal.</h1><span className="gv-tag"><Sparkles size={12} /> 10 LANES</span></div>
          <p className="gv-body" style={{ margin: "0 0 18px" }}>Follow what moves you. Every corner is all fitness, all the time.</p>
          <div className="gv-category-grid">
            {categories.map(({ name, desc, count, icon: Icon }) => (
              <button key={name} className="gv-panel gv-category" onClick={() => openCategory(name)}>
                <div className="gv-category-icon"><Icon size={18} /></div>
                <div className="gv-category-name">{name}</div>
                <div className="gv-category-desc">{desc}</div>
                <div className="gv-category-count">{count}</div>
              </button>
            ))}
          </div>
        </section>
        <div style={{ height: 20 }} />
      </div>
    </>
  );

  const renderCreate = () => (
    <>
      <Topbar title="Create Post" action={() => showToast("Your draft stays right here on this device.")} />
      <div className="gv-scroll">
        <form className="gv-section" style={{ paddingTop: 19 }} onSubmit={submitPost}>
          <div className="gv-kicker">PUT YOUR WORK OUT THERE</div>
          <h1 className="gv-headline" style={{ margin: "5px 0 8px" }}>Progress looks<br />good on you.</h1>
          <p className="gv-body" style={{ margin: "0 0 18px" }}>Share a rep, a routine, or the day you almost skipped.</p>
          <button type="button" className="gv-upload" onClick={() => { setDemoMedia((value) => !value); showToast(demoMedia ? "Demo media removed." : "Demo training clip selected."); }}>
            <div style={{ display: "flex", gap: 10, color: "#39FF88" }}><ImagePlus size={23} /><Camera size={22} /></div>
            <strong>{demoMedia ? "Demo training clip selected" : "Add a photo or video"}</strong>
            <span style={{ fontSize: 11, marginTop: 5 }}>{demoMedia ? "Tap to remove · no upload needed" : "Choose a placeholder for this demo"}</span>
          </button>
          <div className="gv-field"><label htmlFor="gv-caption">CAPTION</label><textarea id="gv-caption" className="gv-textarea" value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="What did you show up for today?" /></div>
          <div className="gv-field"><label htmlFor="gv-category">CATEGORY</label><select id="gv-category" className="gv-select" value={postCategory} onChange={(event) => setPostCategory(event.target.value)}>{postCategories.map((category) => <option key={category}>{category}</option>)}</select></div>
          <div className="gv-field"><label htmlFor="gv-hashtag">HASHTAG</label><input id="gv-hashtag" className="gv-input" value={hashtag} onChange={(event) => setHashtag(event.target.value)} placeholder="#showup" /></div>
          <div className="gv-toggle-row">
            <div><div style={{ fontSize: 12, fontWeight: 700 }}>Add to Progress Timeline</div><div className="gv-meta">Keep the moments that matter.</div></div>
            <button type="button" className={`gv-switch ${addToTimeline ? "on" : ""}`} aria-label="Toggle add to progress timeline" aria-pressed={addToTimeline} onClick={() => setAddToTimeline((value) => !value)}><span /></button>
          </div>
          <button className="gv-button" style={{ width: "100%", marginTop: 20, minHeight: 49 }} type="submit">Post to GYMVERSE <ArrowRight size={17} /></button>
          <div style={{ color: "#626a65", fontSize: 10, textAlign: "center", marginTop: 11 }}>Your post is saved locally in this demo.</div>
        </form>
      </div>
    </>
  );

  const renderProfile = () => (
    <>
      <Topbar action={() => showToast("Profile settings are not part of this demo.")} />
      <div className="gv-scroll">
        <div className="gv-profile-cover" />
        <section className="gv-profile-main">
          <div className="gv-profile-id">
            <div className="gv-avatar">GC</div>
            <div style={{ flex: 1, paddingBottom: 4 }}><div className="gv-title" style={{ fontSize: 24 }}>Griffin Cole</div><div className="gv-meta">@griffinlifts</div></div>
            <button className="gv-button secondary small" onClick={() => showToast("Profile link copied to your demo clipboard.")}>Share <Share2 size={13} /></button>
          </div>
          <p className="gv-body" style={{ margin: "13px 0 4px", color: "#d1d7d3" }}>Building strength, discipline, and consistency.</p>
          <div className="gv-tag"><Target size={12} /> GOAL: BUILD MUSCLE &amp; STAY CONSISTENT</div>
          <div className="gv-stat-grid">
            <div className="gv-panel gv-stat"><b>1.2K</b><span>Followers</span></div>
            <div className="gv-panel gv-stat"><b>384</b><span>Following</span></div>
            <div className="gv-panel gv-stat"><b>{47 + posts.filter((post) => post.created).length}</b><span>Posts</span></div>
          </div>
          <div className="gv-streak-card" style={{ marginTop: 11, padding: 12 }}>
            <Flame size={18} color="#39FF88" />
            <div style={{ flex: 1 }}><div style={{ fontSize: 11, fontWeight: 700 }}>28-Day Streak</div><div className="gv-meta">Current challenge · 30-Day Consistency</div></div>
            <ChevronRight size={17} color="#9CA3A0" />
          </div>
          <div className="gv-section-head" style={{ margin: "21px 0 10px" }}><h2 className="gv-title" style={{ fontSize: 20 }}>Personal Records</h2><span className="gv-kicker">UPDATED TODAY</span></div>
          <div className="gv-pr-row">
            <div className="gv-panel gv-pr"><span>Bench</span><b>225 <small style={{ font: "600 9px DM Sans", color: "#9CA3A0" }}>LB</small></b></div>
            <div className="gv-panel gv-pr"><span>Squat</span><b>315 <small style={{ font: "600 9px DM Sans", color: "#9CA3A0" }}>LB</small></b></div>
            <div className="gv-panel gv-pr"><span>Deadlift</span><b>405 <small style={{ font: "600 9px DM Sans", color: "#9CA3A0" }}>LB</small></b></div>
          </div>
          <button className="gv-button secondary" style={{ width: "100%", marginTop: 12, justifyContent: "space-between" }} onClick={() => navigate("progress")}><span style={{ display: "flex", alignItems: "center", gap: 9 }}><BarChart3 size={17} color="#39FF88" /> View Progress Timeline</span><ArrowRight size={16} /></button>
          <div className="gv-section-head" style={{ margin: "22px 0 12px" }}><h2 className="gv-title" style={{ fontSize: 20 }}>Training Log</h2><button className="gv-action" onClick={() => navigate("create")} style={{ color: "#39FF88" }}>Add post <Plus size={14} /></button></div>
        </section>
        <div className="gv-grid" style={{ padding: "0 18px 16px" }}>
          {["Bench 225", "Push day", "6 months", "Squat form", "No excuses", "Leg day"].map((label) => <button key={label} className="gv-grid-tile" onClick={() => showToast(`${label} · training log post`)}><span>{label}</span><Play size={12} style={{ position: "absolute", right: 8, top: 8 }} /></button>)}
        </div>
      </div>
    </>
  );

  const renderProgress = () => (
    <>
      <Topbar title="Progress Timeline" back onBack={() => navigate("profile")} />
      <div className="gv-scroll">
        <section className="gv-section" style={{ paddingTop: 21 }}>
          <div className="gv-kicker">THE WORK ADDS UP</div>
          <div className="gv-section-head" style={{ marginTop: 6 }}><h1 className="gv-headline">Six months<br />of progress.</h1><span style={{ color: "#39FF88" }}><TrendingUp size={27} /></span></div>
          <p className="gv-body" style={{ margin: "0 0 17px" }}>Not a highlight reel. A record of showing up.</p>
          <div className="gv-panel" style={{ padding: 15 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 10 }}><span style={{ color: "#aeb6b1" }}>CONSISTENCY JOURNEY</span><b style={{ color: "#39FF88" }}>6 / 6 MONTHS</b></div>
            <div className="gv-progress" style={{ height: 8, margin: 0 }}><span style={{ width: "100%" }} /></div>
            <div className="gv-stat-grid" style={{ marginTop: 12 }}>
              <div><b style={{ font: "700 20px Barlow Condensed" }}>124</b><div className="gv-meta">Workouts</div></div>
              <div><b style={{ font: "700 20px Barlow Condensed" }}>+45 LB</b><div className="gv-meta">Bench PR</div></div>
              <div><b style={{ font: "700 20px Barlow Condensed" }}>28 DAYS</b><div className="gv-meta">Current streak</div></div>
            </div>
          </div>
          <div style={{ height: 18 }} />
          <div className="gv-timeline">
            {timeline.map((entry, index) => (
              <article key={`${entry.title}-${index}`} className="gv-panel gv-timeline-item gv-enter">
                <div className="gv-section-head" style={{ margin: "0 0 7px" }}><div className="gv-title" style={{ fontSize: 19 }}>{entry.title}</div><span className="gv-meta">{entry.date || "Logged"}</span></div>
                <div className="gv-body" style={{ color: "#d9dfdb" }}>{entry.note}</div>
                <div className={`gv-art ${index % 2 === 0 ? "lime" : "orange"}`} style={{ height: 102, borderRadius: 12, marginTop: 12, padding: 10 }}>
                  <div className="gv-art-label" style={{ fontSize: 18 }}><span className="gv-art-overline">GRIFFIN / CHECK-IN</span>{index === 0 ? "STARTED HERE" : "STILL SHOWING UP"}</div>
                </div>
              </article>
            ))}
          </div>
          <button className="gv-button secondary" style={{ width: "100%", marginTop: 3 }} onClick={() => navigate("profile")}><ArrowLeft size={16} /> Back to Profile</button>
        </section>
        <div style={{ height: 20 }} />
      </div>
    </>
  );

  const renderChallenges = () => (
    <>
      <Topbar title="Challenges" action={() => showToast("Challenge search coming up next.")} />
      <div className="gv-scroll">
        <section className="gv-section" style={{ paddingTop: 21 }}>
          <div className="gv-kicker">BETTER TOGETHER</div>
          <div className="gv-section-head" style={{ marginTop: 6 }}><h1 className="gv-headline">Pick a goal.<br />Make it real.</h1><span className="gv-tag"><Trophy size={12} /> 06 ACTIVE</span></div>
          <p className="gv-body" style={{ margin: "0 0 17px" }}>Small commitments. A whole community behind you.</p>
          <div className="gv-panel" style={{ padding: 13, display: "flex", gap: 11, alignItems: "center", marginBottom: 15 }}>
            <div style={{ width: 37, height: 37, display: "grid", placeItems: "center", borderRadius: 12, background: "rgba(57,255,136,.1)", color: "#39FF88" }}><Flame size={19} /></div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 11, fontWeight: 700 }}>Your consistency challenge</div><div className="gv-meta">Day 13 of 30 · keep the streak alive</div><div className="gv-progress"><span style={{ width: "43%" }} /></div></div>
            <div style={{ color: "#39FF88", font: "700 17px Barlow Condensed" }}>43%</div>
          </div>
          {challenges.map(({ id, title, members, difficulty, desc, progress, icon: Icon }) => {
            const joined = joinedChallenges.includes(id) || id === "consistency";
            return (
              <article key={id} className="gv-panel gv-challenge gv-enter">
                <div className="gv-challenge-top">
                  <div className="gv-challenge-icon"><Icon size={18} /></div>
                  <div style={{ flex: 1 }}>
                    <div className="gv-title" style={{ fontSize: 18, lineHeight: 1.08 }}>{title}</div>
                    <div className="gv-challenge-meta"><span className="gv-difficulty">{difficulty}</span><span className="gv-meta" style={{ alignSelf: "center" }}>{members} members</span></div>
                  </div>
                </div>
                <p className="gv-body" style={{ margin: "12px 0 0" }}>{desc}</p>
                {(joined || progress > 0) && <div className="gv-progress"><span style={{ width: `${progress || 4}%` }} /></div>}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 13 }}>
                  <span className="gv-meta">{joined ? (id === "consistency" ? "DAY 13 OF 30" : "YOU'RE IN") : "START WHEN YOU'RE READY"}</span>
                  <button className={`gv-button small ${joined ? "secondary" : ""}`} onClick={() => { if (id === "consistency") { showToast("You’re already on day 13. Keep it going."); return; } setToggle(joinedChallenges, setJoinedChallenges, id); showToast(joined ? "Challenge left." : `Joined ${title}.`); }}>{joined ? <><Check size={13} /> Joined</> : <>Join <ArrowRight size={13} /></>}</button>
                </div>
              </article>
            );
          })}
        </section>
        <div style={{ height: 20 }} />
      </div>
    </>
  );

  let content: ReactNode;
  if (screen === "welcome") content = renderWelcome();
  else if (screen === "home") content = renderHome();
  else if (screen === "explore") content = renderExplore();
  else if (screen === "create") content = renderCreate();
  else if (screen === "profile") content = renderProfile();
  else if (screen === "progress") content = renderProgress();
  else content = renderChallenges();

  return (
    <div className="gv-root">
      <main className="gv-phone">
        {content}
        {screen !== "welcome" && <BottomNav active={screen} onNavigate={navigate} />}
        {toast && <div className="gv-toast" role="status">{toast}</div>}
      </main>
    </div>
  );
}

export default GymverseApp;
