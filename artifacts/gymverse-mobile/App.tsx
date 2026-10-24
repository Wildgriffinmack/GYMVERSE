import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { moderate } from "./src/guardian";
import { DevMembershipSwitcher, MembershipProvider, PlanDetailSheet, PremiumScreen, useMembership } from "./src/membership";
import { AdvancedProgressScreen, DEFAULT_COSMETICS, PROFILE_STYLES, ProfileStudio } from "./src/pro";
import type { PrivateEntry, ProfileCosmetics } from "./src/pro";
import type { CoachLook, CreatorLook, ProfileLook } from "./src/screens/Profile";
import { CREATOR_ACCENTS, CreatorStudioScreen, DEFAULT_CREATOR_STATE, DEMO_POSTS, STUDIO_COPY, periodTotals } from "./src/creator";
import type { CreatorDemoState } from "./src/creator";
import { COACH_BANNER, COACH_COPY, CoachCommandCenter, DEFAULT_COACH_STATE, PROGRAMS, SERVICES, SHOWCASES, TESTIMONIALS } from "./src/coach";
import type { CoachDemoState } from "./src/coach";
import { ProDealsScreen, SPONSOR_CAMPAIGNS, SPONSOR_COPY, SponsorDevPanel, SponsorSheets, brandById, createSponsorReport, demoFillerPosts, hideCampaign, hideDeal, placementId } from "./src/sponsors";
import type { SponsorReport, SponsorSheetState, SponsoredPlacement } from "./src/sponsors";
import { SPONSOR_PROFILES, sponsorGap } from "./src/membership";
import { PremiumChallengeScreen } from "./src/challenges";
import type { DemoChallengeProgress } from "./src/challenges";
import { FounderDevToggle, FoundersScreen } from "./src/founders";
import type { PremiumPlanId } from "./src/membership";
import { C, NAV_GAP, NAV_HEIGHT } from "./src/theme";

/** Development-only placeholder posts for the extended sponsor demo feed (never part of `posts`). */
const DEMO_FILLER = demoFillerPosts(STARTER_POSTS);

const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export default function App() {
  const [fontsLoaded] = useFonts({ Anton_400Regular, BarlowCondensed_600SemiBold, BarlowCondensed_700Bold, BarlowCondensed_800ExtraBold });
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <MembershipProvider>{fontsLoaded ? <Gymverse /> : null}</MembershipProvider>
      </View>
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
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [planDetail, setPlanDetail] = useState<PremiumPlanId | null>(null);
  const membership = useMembership();
  /** Where Back returns to from Premium / Advanced Progress. */
  const [premiumFrom, setPremiumFrom] = useState<Screen>("profile");
  const [proFrom, setProFrom] = useState<Screen>("progress");
  /** Private progress notes: session memory only, never added to posts. */
  const [privateNotes, setPrivateNotes] = useState<PrivateEntry[]>([]);
  const [cosmetics, setCosmetics] = useState<ProfileCosmetics>(DEFAULT_COSMETICS);
  const [studioOpen, setStudioOpen] = useState(false);
  const [creatorFrom, setCreatorFrom] = useState<Screen>("profile");
  /** Creator Studio demo state (schedule, pins, links, filters, creator look). Session memory only; never touches posts. */
  const [creatorState, setCreatorState] = useState<CreatorDemoState>(DEFAULT_CREATOR_STATE);
  const [coachFrom, setCoachFrom] = useState<Screen>("profile");
  /** Coach Command Center demo state (fictional leads, bookings, services, showcase, coach look). Session memory only. */
  const [coachState, setCoachState] = useState<CoachDemoState>(DEFAULT_COACH_STATE);
  /** Sponsor demo state — session memory only, separate from posts and from membership (tier switches keep it). */
  const [hiddenSponsorCampaigns, setHiddenSponsorCampaigns] = useState<string[]>([]);
  const [sponsorReports, setSponsorReports] = useState<SponsorReport[]>([]);
  const [sponsorSheet, setSponsorSheet] = useState<SponsorSheetState>(null);
  const [extendedDemoFeed, setExtendedDemoFeed] = useState(false);
  const [hiddenDeals, setHiddenDeals] = useState<string[]>([]);
  const [dealsFrom, setDealsFrom] = useState<Screen>("premium");
  /** Phase 7 — premium challenge demo progress (separate from free `joined`) and the independent Founder preview flag. */
  const [premiumProgress, setPremiumProgress] = useState<DemoChallengeProgress>({});
  const [premiumChallengeId, setPremiumChallengeId] = useState<string>("pc-muscle");
  const [challengeFrom, setChallengeFrom] = useState<Screen>("challenges");
  const [founderPreview, setFounderPreview] = useState(false);
  const [foundersFrom, setFoundersFrom] = useState<Screen>("profile");
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
    setPlanDetail(null);
    setStudioOpen(false);
    setSponsorSheet(null);
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (commentPostId) { setCommentPostId(null); return true; }
      if (sponsorSheet) { setSponsorSheet(null); return true; }
      if (screen === "progress") { navigate("profile"); return true; }
      if (screen === "premium") { navigate(premiumFrom); return true; }
      if (screen === "pro_progress") { navigate(proFrom); return true; }
      if (screen === "creator_studio") { navigate(creatorFrom); return true; }
      if (screen === "coach_center") { navigate(coachFrom); return true; }
      if (screen === "pro_deals") { navigate(dealsFrom); return true; }
      if (screen === "premium_challenge") { navigate(challengeFrom); return true; }
      if (screen === "founders") { navigate(foundersFrom); return true; }
      if (screen !== "home" && screen !== "welcome") { navigate("home"); return true; }
      return false;
    });
    return () => sub.remove();
  }, [screen, commentPostId, sponsorSheet, navigate, premiumFrom, proFrom, creatorFrom, coachFrom, dealsFrom, challengeFrom, foundersFrom]);

  /** Where each preview screen's Back button goes. */
  const backTargets: Partial<Record<Screen, Screen>> = { creator_studio: creatorFrom, pro_progress: proFrom, coach_center: coachFrom, pro_deals: dealsFrom, premium_challenge: challengeFrom, founders: foundersFrom };
  // Returning to a screen we just came from re-uses its original Back target, so Back never ping-pongs between two screens.
  const openPremium = (from: Screen) => {
    if (backTargets[from] === "premium") { navigate("premium"); return; }
    setPremiumFrom(from === "premium" ? "profile" : from);
    navigate("premium");
  };
  const openAdvanced = (from: Screen) => {
    if (from === "premium" && premiumFrom === "pro_progress") { navigate("pro_progress"); return; }
    setProFrom(from === "pro_progress" ? "progress" : from);
    navigate("pro_progress");
  };
  const openCreator = (from: Screen) => {
    if (from === "premium" && premiumFrom === "creator_studio") { navigate("creator_studio"); return; }
    setCreatorFrom(from === "creator_studio" ? "profile" : from);
    navigate("creator_studio");
  };
  const openCoach = (from: Screen) => {
    if (from === "premium" && premiumFrom === "coach_center") { navigate("coach_center"); return; }
    setCoachFrom(from === "coach_center" ? "profile" : from);
    navigate("coach_center");
  };
  const openDeals = (from: Screen) => {
    if (from === "premium" && premiumFrom === "pro_deals") { navigate("pro_deals"); return; }
    setDealsFrom(from === "pro_deals" ? "home" : from);
    navigate("pro_deals");
  };
  const openPremiumChallenge = (id: string, from: Screen) => {
    setPremiumChallengeId(id);
    setChallengeFrom(from === "premium_challenge" ? "challenges" : from);
    navigate("premium_challenge");
  };
  const openFounders = (from: Screen) => {
    if (from === "premium" && premiumFrom === "founders") { navigate("founders"); return; }
    setFoundersFrom(from === "founders" ? "profile" : from);
    navigate("founders");
  };
  const sponsorProfile = SPONSOR_PROFILES[membership.plan.sponsorProfile];
  /** Gap before each sponsored slot, from the central Phase 1 frequency config. Stable per profile so the feed doesn't recompose on unrelated renders. */
  const sponsorGapAt = useMemo(() => (slot: number) => sponsorGap(sponsorProfile, slot), [sponsorProfile]);
  const feedPosts = useMemo(() => (__DEV__ && extendedDemoFeed ? [...posts, ...DEMO_FILLER] : posts), [posts, extendedDemoFeed]);
  const openSponsorExplore = useCallback((p: SponsoredPlacement) => setSponsorSheet({ mode: "detail", placement: p }), []);
  const openSponsorOptions = useCallback((p: SponsoredPlacement) => setSponsorSheet({ mode: "options", placement: p }), []);
  const hideSponsored = (p: SponsoredPlacement) => {
    setHiddenSponsorCampaigns((cur) => hideCampaign(cur, p.campaign.id));
    setSponsorSheet(null);
    showToast(SPONSOR_COPY.hidden);
  };
  const reportSponsored = (p: SponsoredPlacement, reason: string) => {
    const report = createSponsorReport(p, reason, `sr-${Date.now()}`);
    if (report) setSponsorReports((cur) => [...cur, report]);
  };
  /** Coach look renders only while the demo tier has coach profile tools and the user chose to show it. */
  const coachLook: CoachLook | null = (() => {
    const p = coachState.profile;
    if (!p.applied || !membership.can("coach_profile_customization")) return null;
    const svc = SERVICES.find((x) => x.id === coachState.services.featuredId && coachState.services.visible[x.id]);
    const t = TESTIMONIALS.find((x) => x.id === coachState.pinnedTestimonialId);
    const sc = SHOWCASES.find((x) => x.id === coachState.showcaseId);
    return {
      banner: COACH_BANNER,
      badge: COACH_COPY.badgeCoachPro,
      specialty: p.specialty,
      verificationPreview: p.showVerificationPreview ? COACH_COPY.verificationPreview : null,
      featuredService: p.showService && svc ? svc.name : null,
      inquiryButton: p.showInquiryButton,
      testimonial: p.showTestimonial && t ? { text: t.text, alias: t.alias } : null,
      programs: p.showPrograms ? PROGRAMS.length : null,
      transformation: p.showTransformation && sc ? sc.title : null,
    };
  })();
  /** Creator look renders only while the demo tier has creator profile tools and the user chose to show it. */
  const creatorLook: CreatorLook | null = (() => {
    const p = creatorState.profile;
    if (!p.applied || !membership.can("creator_profile_customization")) return null;
    const t30 = periodTotals("30d");
    const pinned = p.showPinned ? DEMO_POSTS.find((x) => x.id === creatorState.pinnedPostId) ?? null : null;
    // Keyed by link id (labels are user-editable and may repeat); blank labels are left off the profile.
    const links = creatorState.links.filter((l) => l.visible && l.label.trim()).map((l) => ({ id: l.id, label: l.label.trim() }));
    return {
      banner: CREATOR_ACCENTS[p.accent].banner,
      identityLabel: p.showIdentity ? STUDIO_COPY.badgeIdentity : null,
      badge: STUDIO_COPY.badgeCreatorPro,
      stats: p.showStats ? [{ label: "Views · 30d", value: t30.views.toLocaleString("en-US") }, { label: "Engagement", value: `${t30.engagementRate}%` }, { label: "New followers", value: `+${t30.newFollowers}` }] : null,
      links: p.showLinks && links.length ? links : null,
      pinned: pinned ? { title: pinned.title, art: pinned.art } : null,
    };
  })();
  /** Premium cosmetics render only while the demo tier allows them and the user chose "Show on my profile". */
  const profileLook: ProfileLook | null =
    cosmetics.applied && membership.can("premium_profile_customization")
      ? {
          banner: PROFILE_STYLES[cosmetics.style].banner,
          ring: cosmetics.glowRing ? PROFILE_STYLES[cosmetics.style].ring : PROFILE_STYLES.standard.ring,
          badge: cosmetics.showBadge && membership.badge.label ? { label: membership.badge.label, tone: membership.badge.tone } : null,
          pinned: cosmetics.pinTransformation,
        }
      : null;

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
  const addComment = async (postId: string, text: string): Promise<boolean> => {
    const decision = await moderate("comment", text, ME.username);
    if (decision?.status === "rejected") {
      showToast(`Guardian blocked this comment. ${decision.reason}`);
      return false;
    }
    const inReview = decision?.status === "needs_review";
    const comment: Comment = { id: `c-${Date.now()}`, user: ME.username, text, time: "now", likes: 0, ...(inReview ? { pending: true } : {}) };
    setAddedComments((cur) => ({ ...cur, [postId]: [comment, ...(cur[postId] ?? [])] }));
    if (!inReview) setPosts((cur) => cur.map((p) => (p.id === postId ? { ...p, comments: p.comments + 1 } : p)));
    if (inReview) showToast("Comment sent to Guardian review. Only you can see it for now.");
    return true;
  };
  /** Resolves to null when posted, or to Guardian's reason when the post was blocked. */
  const createPost = async (draft: PostDraft): Promise<string | null> => {
    const decision = await moderate("post", [draft.caption, draft.hashtags].filter(Boolean).join("\n"), ME.username);
    if (decision?.status === "rejected") return decision.reason;
    const inReview = decision?.status === "needs_review";
    const post: Post = { ...buildPost(draft), ...(inReview ? { moderation: "in_review" as const } : {}) };
    setPosts((cur) => [post, ...cur]);
    if (draft.addToTimeline && !inReview) setTimeline((cur) => [...cur, timelineEntryFrom(post)]);
    setActiveTab("For You");
    navigate("home");
    showToast(
      inReview
        ? "Posted for review. Guardian is checking it — only you can see it for now."
        : draft.addToTimeline
          ? "Posted — and added to your Progress Timeline."
          : "Post added to your GYMVERSE feed.",
    );
    return null;
  };

  const commentPost = feedPosts.find((p) => p.id === commentPostId) ?? null;
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
          posts={feedPosts}
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
          sponsorGapAt={sponsorGapAt}
          hiddenSponsorCampaigns={hiddenSponsorCampaigns}
          onSponsorExplore={openSponsorExplore}
          onSponsorOptions={openSponsorOptions}
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
      content = <ChallengesScreen joined={joined} onToggle={toggleChallenge} onExplorePremium={(id) => openPremiumChallenge(id, "challenges")} onFounders={() => openFounders("challenges")} premiumProgress={premiumProgress} />;
      break;
    case "premium_challenge":
      content = (
        <PremiumChallengeScreen
          challengeId={premiumChallengeId}
          completedIds={premiumProgress[premiumChallengeId] ?? []}
          onChange={(ids) => setPremiumProgress((cur) => ({ ...cur, [premiumChallengeId]: ids }))}
          onBack={() => navigate(challengeFrom)}
          onOpenPremium={() => openPremium("premium_challenge")}
          onToast={showToast}
        />
      );
      break;
    case "founders":
      content = <FoundersScreen onBack={() => navigate(foundersFrom)} founderPreview={founderPreview} />;
      break;
    case "profile":
      content = <ProfileScreen myPosts={myPosts} savedPosts={savedPosts} onOpenPost={openPost} onTimeline={() => navigate("progress")} onChallenges={() => navigate("challenges")} onToast={showToast} onDevTools={__DEV__ ? () => setDevToolsOpen(true) : undefined} onPremium={() => openPremium("profile")} onStudio={() => setStudioOpen(true)} look={profileLook} onCreatorStudio={() => openCreator("profile")} creator={creatorLook} onCoachCenter={() => openCoach("profile")} coach={coachLook} onFounders={() => openFounders("profile")} founder={founderPreview} />;
      break;
    case "premium":
      content = <PremiumScreen onBack={() => navigate(premiumFrom)} onExplore={setPlanDetail} onDeals={() => openDeals("premium")} onFounders={() => openFounders("premium")} />;
      break;
    case "pro_deals":
      content = (
        <ProDealsScreen
          onBack={() => navigate(dealsFrom)}
          onOpenPremium={() => openPremium("pro_deals")}
          onToast={showToast}
          hiddenDeals={hiddenDeals}
          onHideDeal={(id) => setHiddenDeals((cur) => hideDeal(cur, id))}
          onRestoreDeals={() => setHiddenDeals([])}
        />
      );
      break;
    case "progress":
      content = <ProgressScreen timeline={timeline} onBack={() => navigate("profile")} onAdvanced={() => openAdvanced("progress")} />;
      break;
    case "creator_studio":
      content = (
        <CreatorStudioScreen
          onBack={() => navigate(creatorFrom)}
          onOpenPremium={() => openPremium("creator_studio")}
          onToast={showToast}
          state={creatorState}
          onChange={(patch) => setCreatorState((cur) => ({ ...cur, ...patch }))}
        />
      );
      break;
    case "coach_center":
      content = (
        <CoachCommandCenter
          onBack={() => navigate(coachFrom)}
          onOpenPremium={() => openPremium("coach_center")}
          onToast={showToast}
          state={coachState}
          onChange={(patch) => setCoachState((cur) => ({ ...cur, ...patch }))}
        />
      );
      break;
    case "pro_progress":
      content = (
        <AdvancedProgressScreen
          onBack={() => navigate(proFrom)}
          onOpenPremium={() => openPremium("pro_progress")}
          privateNotes={privateNotes}
          onAddPrivateNote={(entry) => { setPrivateNotes((cur) => [entry, ...cur]); showToast("Saved privately. Not shared to your feed."); }}
        />
      );
      break;
  }

  return (
    <View style={{ flex: 1 }}>
      <ScreenTransition key={screen}>{content}</ScreenTransition>
      {screen !== "welcome" ? <BottomNav active={screen} onNavigate={navigate} bottom={insets.bottom} /> : null}
      <CommentsSheet
        post={commentPost}
        comments={commentPost ? [...(addedComments[commentPost.id] ?? []), ...seedComments(commentPost.id)] : []}
        onAdd={(text) => (commentPost ? addComment(commentPost.id, text) : Promise.resolve(false))}
        onClose={() => setCommentPostId(null)}
      />
      {toast ? <Toast key={toast.id} text={toast.text} bottom={insets.bottom + NAV_GAP + NAV_HEIGHT + 14} /> : null}
      {__DEV__ ? (
        <DevMembershipSwitcher
          visible={devToolsOpen}
          onClose={() => setDevToolsOpen(false)}
          extra={
            <>
            <FounderDevToggle value={founderPreview} onChange={(v) => { setFounderPreview(v); showToast(v ? "Founder preview on (demo). Membership unchanged." : "Founder preview off."); }} />
            <SponsorDevPanel
              frequency={sponsorProfile.description}
              gapAt={sponsorGapAt}
              organicCount={feedPosts.length}
              extendedFeed={extendedDemoFeed}
              onExtendedFeed={setExtendedDemoFeed}
              hiddenCampaignIds={hiddenSponsorCampaigns}
              onResetHidden={() => { setHiddenSponsorCampaigns([]); showToast("Hidden sponsors reset."); }}
              reportCount={sponsorReports.length}
              onPreviewCampaign={(id) => {
                const c = SPONSOR_CAMPAIGNS.find((x) => x.id === id)!;
                setDevToolsOpen(false);
                setSponsorSheet({ mode: "detail", placement: { kind: "sponsored", id: placementId(c.id, -1), slot: -1, afterOrganic: 0, campaign: c, brand: brandById(c.brandId) } });
              }}
            />
            </>
          }
        />
      ) : null}
      <SponsorSheets
        state={sponsorSheet}
        onState={setSponsorSheet}
        isPremium={membership.plan.isPremium}
        frequency={sponsorProfile.description}
        canBrandCampaigns={membership.can("brand_campaign_marketplace_preview")}
        canCoachPartnerships={membership.can("coach_partnership_opportunities")}
        canProDeals={membership.can("pro_deals_preview")}
        onHide={hideSponsored}
        onReport={reportSponsored}
        onOpenDeals={() => openDeals(screen)}
        onOpenCreator={() => openCreator(screen)}
        onOpenCoach={() => openCoach(screen)}
      />
      <PlanDetailSheet planId={screen === "premium" ? planDetail : null} onClose={() => setPlanDetail(null)} onPreview={(plan) => (plan === "CREATOR_PRO" ? openCreator("premium") : plan === "COACH_PRO" ? openCoach("premium") : openAdvanced("premium"))} />
      <ProfileStudio visible={studioOpen && screen === "profile"} value={cosmetics} onChange={setCosmetics} onClose={() => setStudioOpen(false)} onOpenPremium={() => openPremium("profile")} />
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
