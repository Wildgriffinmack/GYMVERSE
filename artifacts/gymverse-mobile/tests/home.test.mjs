// GYMX Home Feed: content model, Following/For You, Clips separation, navigation and icon wiring.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { HOME_POSTS, INITIAL_FOLLOWING, STORIES, mergeHomePosts } from "../src/home/homeData.ts";
import { HOME_TABS, clipPosts, galleryTiles, homePosts, isClip, timeAgo } from "../src/home/homeFeed.ts";
import { NAV_TABS, navTabFor } from "../src/nav.ts";

const src = (rel) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
const clip = (id, extra = {}) => ({ id, username: `u_${id}`, name: id, caption: id, created: false, ...extra });
const CLIPS = ["c1", "c2", "c3", "c4", "c5", "c6"].map((id) => clip(id));

describe("Home content model", () => {
  it("covers photo, carousel, gallery and personal-record posts", () => {
    const kinds = HOME_POSTS.map((p) => (p.media.kind === "photos" ? p.media.layout : p.media.kind));
    for (const k of ["single", "carousel", "gallery", "milestone"]) assert.ok(kinds.includes(k), k);
  });
  it("every Home post has the fields the existing like/comment/save logic needs", () => {
    for (const p of HOME_POSTS) {
      for (const key of ["id", "username", "name", "time", "caption", "likes", "comments", "saves", "art"]) assert.ok(p[key] !== undefined, `${p.id}.${key}`);
      assert.ok(p.media, p.id);
    }
    assert.equal(new Set(HOME_POSTS.map((p) => p.id)).size, HOME_POSTS.length);
  });
  it("milestones carry the metrics the PR layout shows", () => {
    const m = HOME_POSTS.find((p) => p.id === "home-marcus-pr").media;
    assert.deepEqual(m, { kind: "milestone", lift: "Barbell Back Squat", value: "315", unit: "LB", detail: "1 rep", delta: "+10 LB", deltaLabel: "vs. previous PR" });
  });
  it("every referenced photo exists on disk, is registered and credited", () => {
    const registry = src("src/home/photos.ts");
    const credits = src("assets/demo-photos/CREDITS.md");
    for (const p of HOME_POSTS) {
      if (p.media.kind !== "photos") continue;
      for (const id of p.media.photos) {
        assert.ok(existsSync(new URL(`../assets/demo-photos/${id}.jpg`, import.meta.url)), `${id}.jpg missing`);
        assert.match(registry, new RegExp(`"${id}": \\{ source: require\\("\\.\\./\\.\\./assets/demo-photos/${id}\\.jpg"\\)`), `${id} not registered`);
        assert.match(credits, new RegExp(`\`${id}\\.jpg\` \\| .+ \\| (CC0|Public domain)`), `${id} not credited`);
      }
    }
  });
  it("demo content follows the brand voice (no 'no excuses' in new Home copy)", () => {
    for (const p of HOME_POSTS) assert.doesNotMatch(p.caption, /no excuses|beach body|you failed/i, p.id);
  });
});

describe("Following / For You", () => {
  const posts = mergeHomePosts(CLIPS);
  it("defaults to the mockup's first three posts on top", () => {
    assert.deepEqual(posts.slice(0, 3).map((p) => p.id), ["home-alex-carousel", "home-marcus-pr", "home-jordan-gallery"]);
  });
  it("merging keeps every clip, in order, and every Home post", () => {
    assert.equal(posts.length, CLIPS.length + HOME_POSTS.length);
    assert.deepEqual(clipPosts(posts).map((p) => p.id), CLIPS.map((p) => p.id));
    assert.deepEqual(posts.filter((p) => !isClip(p)).map((p) => p.id), HOME_POSTS.map((p) => p.id));
  });
  it("Following shows followed accounts plus what you just posted", () => {
    const mine = { ...clip("mine"), username: "griffinlifts", created: true };
    const following = homePosts([mine, ...posts], "Following", INITIAL_FOLLOWING);
    assert.equal(following[0].id, "mine");
    assert.ok(following.slice(1).every((p) => INITIAL_FOLLOWING.includes(p.username)));
    assert.equal(following.length, 1 + HOME_POSTS.length);
  });
  it("For You shows everything; unfollowing removes posts from Following", () => {
    assert.equal(homePosts(posts, "For You", []).length, posts.length);
    const without = homePosts(posts, "Following", INITIAL_FOLLOWING.filter((u) => u !== "alex.morgan"));
    assert.ok(!without.some((p) => p.username === "alex.morgan"));
  });
  it("tabs and stories match the design", () => {
    assert.deepEqual(HOME_TABS, ["Following", "For You"]);
    assert.deepEqual(STORIES.map((s) => s.label), ["Alex", "Jordan", "Sam", "Chris", "Taylor"]);
    for (const s of STORIES) assert.ok(INITIAL_FOLLOWING.includes(s.username), s.username);
  });
  it("formats times and gallery overflow", () => {
    assert.equal(timeAgo("2h"), "2h ago");
    assert.equal(timeAgo("now"), "Just now");
    assert.equal(timeAgo("Yesterday"), "Yesterday");
    assert.deepEqual(galleryTiles(["a", "b", "c", "d", "e"]), { shown: ["a", "b", "c"], extra: 2 });
    assert.deepEqual(galleryTiles(["a", "b"]), { shown: ["a", "b"], extra: 0 });
  });
});

describe("navigation", () => {
  it("bottom nav is Home, Explore, Create, Clips, Profile", () => {
    assert.deepEqual(NAV_TABS.map((t) => t.label), ["Home", "Explore", "Create", "Clips", "Profile"]);
  });
  it("Challenges sits under Explore; profile tools under Profile", () => {
    assert.equal(navTabFor("challenges"), "explore");
    assert.equal(navTabFor("premium_challenge"), "explore");
    for (const s of ["premium", "progress", "founders", "creator_studio", "coach_center", "pro_deals", "pro_progress"]) assert.equal(navTabFor(s), "profile", s);
    assert.equal(navTabFor("clips"), "clips");
    assert.equal(navTabFor("welcome"), null);
  });
  it("App: Home is the new feed, Clips is the existing reels viewer with clips only", () => {
    const app = src("App.tsx");
    assert.match(app, /case "home":\s*content = \(\s*<HomeFeedScreen/);
    assert.match(app, /case "clips":\s*content = \(\s*<FeedScreen[\s\S]*?posts=\{clipFeed\}/);
    assert.match(app, /const clipFeed = useMemo\(\(\) => clipPosts\(feedPosts\), \[feedPosts\]\)/);
    assert.match(app, /onEnter=\{\(\) => navigate\("home"\)\}/, "Home stays the default after Welcome");
    assert.match(app, /const openFeed = [\s\S]*?navigate\("clips"\)/, "Explore lanes open Clips");
    assert.match(app, /useState<string\[\]>\(INITIAL_FOLLOWING\)/);
  });
  it("Challenges stays reachable from Explore and Profile with a Back target", () => {
    const app = src("App.tsx");
    assert.match(app, /<ExploreScreen onOpenFeed=\{openFeed\} onChallenges=\{\(\) => openChallenges\("explore"\)\} \/>/);
    assert.match(app, /onChallenges=\{\(\) => openChallenges\("profile"\)\}/);
    assert.match(app, /if \(screen === "challenges"\) \{ navigate\(challengesFrom\); return true; \}/);
    assert.match(src("src/screens/Challenges.tsx"), /leading=\{onBack \?/);
  });
});

describe("Home Feed UI", () => {
  const post = src("src/home/HomePost.tsx");
  const screen = src("src/home/HomeFeedScreen.tsx");
  it("uses the custom gym icons for like, comment, share and save", () => {
    for (const icon of ["FlexIcon", "CommentIcon", "ShareIcon", "SaveIcon"]) assert.match(post, new RegExp(`<${icon}`), icon);
    const icons = src("src/components/GymIcons.tsx");
    for (const name of ["FlexIcon", "CommentIcon", "ShareIcon", "SaveIcon", "HomeIcon"]) assert.match(icons, new RegExp(`export function ${name}\\(`), name);
    assert.doesNotMatch(post, /<(Heart|MessageCircle|Bookmark)\b/, "no generic social icons");
  });
  it("interactions go through the app's existing handlers", () => {
    for (const call of ["onLike(post.id)", "onComment(post.id)", "onShare(post)", "onSave(post.id)"]) assert.ok(post.includes(call), call);
    assert.match(screen, /onLike: \(id, forceOn\) => latest\.current\.onLike\(id, forceOn\)/);
  });
  it("keeps the Inferno palette (no lime green) and the GYMX wordmark", () => {
    for (const f of [post, screen, src("src/components/GymIcons.tsx")]) assert.doesNotMatch(f, /#(B8F0|C8F0|A3E6|84CC16|BEF264)/i, "lime colour leaked in");
    assert.match(screen, /<Wordmark size=\{30\} tone="accent" \/>/);
    assert.match(src("src/components/ui.tsx"), /tone === "accent"\) return <Text[^>]*>GYMX<\/Text>/);
  });
  it("respects safe areas and leaves room for the docked nav", () => {
    assert.match(screen, /paddingTop: insets\.top \+ 6/);
    assert.match(screen, /paddingBottom: insets\.bottom \+ NAV_HEIGHT \+ 16/);
  });
  it("placeholder photos are clearly marked as development-only", () => {
    assert.match(src("src/home/photos.ts"), /DEVELOPMENT PLACEHOLDER PHOTOS/);
  });
});
