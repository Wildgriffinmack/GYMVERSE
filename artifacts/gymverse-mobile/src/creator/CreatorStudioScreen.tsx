import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Briefcase,
  CalendarClock,
  Camera,
  Check,
  Clapperboard,
  Clock,
  Crown,
  Dumbbell,
  Eye,
  EyeOff,
  Globe,
  Heart,
  Hourglass,
  Link2,
  ListFilter,
  Megaphone,
  MessageSquare,
  MousePointerClick,
  Pencil,
  Percent,
  Pin,
  Play,
  Plus,
  Share2,
  ShieldCheck,
  Trash,
  TrendingUp,
  UserPlus,
  Video,
  X,
} from "lucide-react-native";
import { PostArt } from "../components/PostArt";
import { Glows } from "../components/Tone";
import { Avatar, Badge, IconBtn, Label, PageHeader, tap } from "../components/ui";
import { ME } from "../data";
import { formatCount } from "../utils";
import type { PremiumFeature } from "../membership/entitlements";
import { useMembership } from "../membership/MembershipContext";
import { ComingSoonPill } from "../membership/PremiumScreen";
import { BarChart, LineChart } from "../pro/Charts";
import { LockedFeatureSheet, ProSection } from "../pro/ProGate";
import { C, DIAG, F, GRAD, NAV_GAP, NAV_HEIGHT } from "../theme";
import type { Campaign, ContentCategory, CreatorDemoState, CreatorLink, CreatorPost, LinkKind, PeriodId, ScheduledItem } from "./creatorData";
import {
  AUDIENCE_DAYS,
  BEST_TIME_COPY,
  CAMPAIGNS,
  CREATOR_ACCENTS,
  DEMO_POSTS,
  DRAFTS,
  FILTER_SAFETY_NOTE,
  PERIODS,
  SAMPLE_COMMENTS,
  SCHEDULE_TIMES,
  STUDIO_COPY,
  TIME_WINDOWS,
  addScheduled,
  applyCommentFilters,
  bestPostingTime,
  categoryBreakdown,
  categoryLabel,
  dateLabel,
  engagementRate,
  followerGrowth,
  followerSeries,
  mostActiveDays,
  periodTotals,
  pinnedOrder,
  removeScheduled,
  scheduleLabel,
  strongestSignal,
  suggestedWindows,
  topPosts,
  updateScheduled,
  upcomingDays,
  viewsChart,
} from "./creatorData";

type Tab = "overview" | "content" | "audience" | "tools" | "profile" | "brands";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "content", label: "Content" },
  { id: "audience", label: "Audience" },
  { id: "tools", label: "Tools" },
  { id: "profile", label: "Profile" },
  { id: "brands", label: "Brands" },
];

type Props = {
  onBack: () => void;
  onOpenPremium: () => void;
  onToast: (m: string) => void;
  state: CreatorDemoState;
  onChange: (patch: Partial<CreatorDemoState>) => void;
};

/** Creator Pro "Creator Studio" preview. Fictional demo data only; nothing here affects the Home Feed. */
export function CreatorStudioScreen({ onBack, onOpenPremium, onToast, state, onChange }: Props) {
  const insets = useSafeAreaInsets();
  const membership = useMembership();
  const [tab, setTab] = useState<Tab>("overview");
  const [period, setPeriod] = useState<PeriodId>("30d");
  const [locked, setLocked] = useState<PremiumFeature | null>(null);
  const [postDetail, setPostDetail] = useState<CreatorPost | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const unlocked = membership.can("creator_analytics");
  const showPeriods = tab === "overview" || tab === "content" || tab === "audience";

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + NAV_GAP + NAV_HEIGHT + 28 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" stickyHeaderIndices={[2]}>
        <PageHeader top={insets.top} kicker="Creator Pro" title="Studio" leading={<IconBtn label="Back" onPress={onBack}><ArrowLeft size={20} color={C.white} /></IconBtn>} />

        <LinearGradient colors={["#3a0d06", "#170707", "#0d0d0d"]} start={DIAG.start} end={DIAG.end} style={s.hero}>
          <Glows glows={[{ color: C.hot, cx: "100%", cy: "0%", rx: "80%", ry: "90%", opacity: 0.35 }, { color: C.flame, cx: "0%", cy: "100%", rx: "70%", ry: "70%", opacity: 0.25 }]} />
          <View style={s.heroTop}>
            <View style={s.rec}><View style={s.recDot} /><Text style={s.recText}>STUDIO</Text></View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Video size={18} color="rgba(255,247,237,0.7)" />
              <Camera size={18} color="rgba(255,247,237,0.7)" />
            </View>
          </View>
          <Text style={s.heroTitle}>{STUDIO_COPY.title}</Text>
          <Text style={s.heroSub}>{STUDIO_COPY.subtitle}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <ComingSoonPill label={STUDIO_COPY.pill} />
            {unlocked ? <View style={s.demoTag}><Text style={s.demoTagText}>DEMO · {membership.plan.displayName.toUpperCase()}</Text></View> : null}
          </View>
          <Text style={s.heroNote}>{STUDIO_COPY.organicNote}</Text>
          {!unlocked ? (
            <Pressable accessibilityRole="button" onPress={() => { tap(); onOpenPremium(); }} style={s.heroLink}>
              <Crown size={15} color={C.gold} />
              <Text style={s.heroLinkText}>See GYMVERSE Premium</Text>
              <ArrowRight size={15} color={C.gold} />
            </Pressable>
          ) : null}
        </LinearGradient>

        <View style={s.stickyBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
            {TABS.map((t) => {
              const on = t.id === tab;
              return (
                <Pressable key={t.id} accessibilityRole="tab" accessibilityState={{ selected: on }} aria-selected={on} onPress={() => { tap(); setTab(t.id); }} style={s.tabBtn}>
                  {on ? <LinearGradient colors={GRAD} start={DIAG.start} end={DIAG.end} style={[StyleSheet.absoluteFill, { borderRadius: 18 }]} /> : null}
                  <Text style={[s.tabText, on && { color: "#fff" }]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {showPeriods ? (
            <View style={s.periods} accessibilityRole="tablist" accessibilityLabel="Time period">
              {PERIODS.map((p) => {
                const on = p.id === period;
                return (
                  <Pressable key={p.id} accessibilityRole="tab" accessibilityState={{ selected: on }} aria-selected={on} onPress={() => { tap(); setPeriod(p.id); }} style={[s.periodBtn, on && s.periodOn]}>
                    <Text style={[s.periodText, on && { color: C.white }]}>{p.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {tab === "overview" ? <Overview period={period} onLocked={setLocked} /> : null}
          {tab === "content" ? <Content period={period} onLocked={setLocked} onOpenPost={setPostDetail} /> : null}
          {tab === "audience" ? <Audience period={period} onLocked={setLocked} /> : null}
          {tab === "tools" ? <Tools state={state} onChange={onChange} onLocked={setLocked} onToast={onToast} /> : null}
          {tab === "profile" ? <CreatorProfile state={state} onChange={onChange} onLocked={setLocked} /> : null}
          {tab === "brands" ? <Brands onLocked={setLocked} onOpen={setCampaign} /> : null}
          <Text style={s.footnote}>{STUDIO_COPY.demoNote}</Text>
        </View>
      </ScrollView>
      <LockedFeatureSheet feature={locked} onClose={() => setLocked(null)} onOpenPremium={onOpenPremium} />
      <PostDetailSheet post={postDetail} period={period} onClose={() => setPostDetail(null)} />
      <CampaignSheet campaign={campaign} onClose={() => setCampaign(null)} />
    </View>
  );
}

// ── Overview ────────────────────────────────────────────────────────────────
function Overview({ period, onLocked }: { period: PeriodId; onLocked: (f: PremiumFeature) => void }) {
  const t = periodTotals(period);
  const chart = viewsChart(period);
  const label = PERIODS.find((p) => p.id === period)!.label.toLowerCase();
  const cards: { icon: ReactNode; label: string; value: string; hot?: boolean }[] = [
    { icon: <Eye size={16} color={C.flame} />, label: "Total views", value: t.views.toLocaleString("en-US"), hot: true },
    { icon: <Heart size={16} color={C.hot} />, label: "Likes", value: t.likes.toLocaleString("en-US") },
    { icon: <Bookmark size={16} color={C.gold} />, label: "Saves", value: t.saves.toLocaleString("en-US") },
    { icon: <Share2 size={16} color={C.flame} />, label: "Shares", value: t.shares.toLocaleString("en-US") },
    { icon: <UserPlus size={16} color={C.flame} />, label: "New followers", value: `+${t.newFollowers}` },
    { icon: <MousePointerClick size={16} color={C.flame} />, label: "Profile visits", value: t.profileVisits.toLocaleString("en-US") },
    { icon: <Percent size={16} color={C.gold} />, label: "Engagement rate", value: `${t.engagementRate}%`, hot: true },
    { icon: <TrendingUp size={16} color={C.gold} />, label: "Follower growth", value: `+${t.followerGrowthPct}%` },
  ];
  return (
    <ProSection plan="creator" feature="creator_analytics" title="Analytics overview" subtitle={`Last ${label} · ${t.posts} posts`} onLocked={onLocked} teaserHeight={320}>
      <View style={s.grid}>
        {cards.map((c) => (
          <View key={c.label} style={[s.statCard, c.hot && s.statHot]}>
            <View style={s.statIcon}>{c.icon}</View>
            <Text style={s.statValue}>{c.value}</Text>
            <Text style={s.statLabel}>{c.label}</Text>
          </View>
        ))}
      </View>
      <View style={[s.card, { marginTop: 12 }]}>
        <Label style={{ marginBottom: 8 }}>Views by publish date</Label>
        <BarChart values={chart.map((b) => b.views)} labels={chart.map((b) => b.label)} format={(v) => formatCount(v)} />
        <Text style={s.muted}>Bars add up to {t.views.toLocaleString("en-US")} views.</Text>
      </View>
      <Text style={[s.muted, { marginTop: 10 }]}>{STUDIO_COPY.erFormula}</Text>
    </ProSection>
  );
}

// ── Content performance ─────────────────────────────────────────────────────
function Content({ period, onLocked, onOpenPost }: { period: PeriodId; onLocked: (f: PremiumFeature) => void; onOpenPost: (p: CreatorPost) => void }) {
  const [cat, setCat] = useState<ContentCategory>("gym_edit");
  const rows = categoryBreakdown(period);
  const maxViews = Math.max(1, ...rows.map((r) => r.views));
  const sel = rows.find((r) => r.id === cat)!;
  const top = topPosts(period);
  return (
    <>
      <ProSection plan="creator" feature="post_performance_dashboard" title="Content performance" subtitle="Which fitness content lands with your audience" onLocked={onLocked} teaserHeight={300}>
        <View style={s.card}>
          {rows.map((r) => {
            const on = r.id === cat;
            return (
              <Pressable key={r.id} accessibilityRole="button" accessibilityState={{ selected: on }} aria-selected={on} accessibilityLabel={`${r.label}: ${r.views} views`} onPress={() => { tap(); setCat(r.id); }} style={[s.catRow, on && s.catRowOn]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={[s.catName, on && { color: C.white }]}>{r.label}</Text>
                  <Text style={[s.catViews, on && { color: C.gold }]}>{formatCount(r.views)}</Text>
                </View>
                <View style={s.catTrack}>
                  {r.views > 0 ? <LinearGradient colors={on ? [C.gold, C.flame] : ["rgba(255,90,31,0.5)", "rgba(255,46,46,0.5)"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ height: "100%", width: `${(r.views / maxViews) * 100}%`, borderRadius: 4 }} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
        <LinearGradient colors={["rgba(255,90,31,0.16)", "rgba(255,46,46,0.05)"]} start={DIAG.start} end={DIAG.end} style={[s.card, { marginTop: 12 }]}>
          <Label accent>{sel.label}</Label>
          <Text style={s.catTitle}>{sel.posts} {sel.posts === 1 ? "post" : "posts"} · {sel.engagementRate}% engagement</Text>
          <View style={s.metricRow}>
            <Metric icon={<Eye size={14} color={C.flame} />} value={formatCount(sel.views)} label="Views" />
            <Metric icon={<Heart size={14} color={C.hot} />} value={formatCount(sel.likes)} label="Likes" />
            <Metric icon={<Bookmark size={14} color={C.gold} />} value={formatCount(sel.saves)} label="Saves" />
            <Metric icon={<Share2 size={14} color={C.flame} />} value={formatCount(sel.shares)} label="Shares" />
          </View>
          {sel.posts === 0 ? <Text style={s.muted}>No demo posts in this category for this period.</Text> : null}
        </LinearGradient>
      </ProSection>

      <ProSection plan="creator" feature="post_performance_dashboard" title="Top-performing posts" subtitle="Hypothetical demo posts · tap for details" onLocked={onLocked} teaserHeight={240}>
        <View style={{ gap: 10 }}>
          {top.map((p, i) => (
            <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={`${p.title}, ${p.views} views. Open details`} onPress={() => { tap(); onOpenPost(p); }} style={({ pressed }) => [s.postCard, { opacity: pressed ? 0.85 : 1 }]}>
              <View style={s.thumb}><PostArt art={p.art} variant="thumb" /><Text style={s.rank}>#{i + 1}</Text></View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={s.postTitle} numberOfLines={1}>{p.title}</Text>
                <Text style={s.postCat}>{categoryLabel(p.category)} · {dateLabel(-p.daysAgo)}</Text>
                <View style={s.inlineStats}>
                  <InlineStat icon={<Eye size={12} color={C.ash} />} value={formatCount(p.views)} />
                  <InlineStat icon={<Heart size={12} color={C.ash} />} value={formatCount(p.likes)} />
                  <InlineStat icon={<Bookmark size={12} color={C.ash} />} value={formatCount(p.saves)} />
                  <InlineStat icon={<Share2 size={12} color={C.ash} />} value={formatCount(p.shares)} />
                </View>
                <View style={s.erBar}>
                  <LinearGradient colors={GRAD} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ height: "100%", width: `${Math.min(100, engagementRate(p) * 4)}%`, borderRadius: 3 }} />
                </View>
              </View>
              <Text style={s.erValue}>{engagementRate(p)}%</Text>
            </Pressable>
          ))}
        </View>
      </ProSection>
    </>
  );
}

function PostDetailSheet({ post, period, onClose }: { post: CreatorPost | null; period: PeriodId; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const totals = periodTotals(period);
  return (
    <Modal visible={!!post} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Close post details" />
      {post ? (
        <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={s.handle} />
          <View style={s.sheetHead}>
            <View style={s.demoTag}><Text style={s.demoTagText}>HYPOTHETICAL DEMO POST</Text></View>
            <IconBtn label="Close post details" onPress={onClose} size={34}><X size={18} color={C.white} /></IconBtn>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 8 }}>
            <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
              <View style={[s.thumb, { width: 84, height: 112 }]}><PostArt art={post.art} variant="thumb" /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.sheetTitle}>{post.title}</Text>
                <Text style={s.postCat}>{categoryLabel(post.category)} · Published {dateLabel(-post.daysAgo)}</Text>
              </View>
            </View>
            <View style={[s.grid, { marginTop: 16 }]}>
              {[
                ["Views", post.views],
                ["Likes", post.likes],
                ["Comments", post.comments],
                ["Saves", post.saves],
                ["Shares", post.shares],
              ].map(([l, v]) => (
                <View key={l as string} style={s.statCard}>
                  <Text style={s.statValue}>{(v as number).toLocaleString("en-US")}</Text>
                  <Text style={s.statLabel}>{l as string}</Text>
                </View>
              ))}
              <View style={[s.statCard, s.statHot]}>
                <Text style={s.statValue}>{engagementRate(post)}%</Text>
                <Text style={s.statLabel}>Engagement rate</Text>
              </View>
            </View>
            <View style={[s.card, { marginTop: 12, gap: 8 }]}>
              <Text style={s.detailLine}><Text style={{ color: C.gold }}>●</Text>  {strongestSignal(post)}</Text>
              {post.daysAgo < (period === "7d" ? 7 : period === "30d" ? 30 : 90) ? (
                <Text style={s.detailLine}><Text style={{ color: C.flame }}>●</Text>  {Math.round((post.views / totals.views) * 100)}% of views from posts published in the selected period</Text>
              ) : (
                <Text style={s.detailLine}><Text style={{ color: C.ash }}>●</Text>  Published outside the selected period</Text>
              )}
              <Text style={s.detailLine}><Text style={{ color: C.flame }}>●</Text>  {(post.likes + post.comments + post.saves + post.shares).toLocaleString("en-US")} total engagements</Text>
            </View>
            <Text style={[s.muted, { marginTop: 10 }]}>This is a fictional example post with made-up numbers. It is not one of your real posts and no real post was changed.</Text>
          </ScrollView>
        </View>
      ) : null}
    </Modal>
  );
}

// ── Audience ────────────────────────────────────────────────────────────────
function Audience({ period, onLocked }: { period: PeriodId; onLocked: (f: PremiumFeature) => void }) {
  const growth = followerGrowth(period);
  const series = followerSeries(period);
  const [point, setPoint] = useState(series.length - 1);
  const sel = Math.min(point, series.length - 1);
  const best = bestPostingTime();
  const active = mostActiveDays(2);
  const windows = suggestedWindows(2);
  const bestDayIndex = AUDIENCE_DAYS.findIndex((d) => d.day === best.day);
  return (
    <ProSection plan="creator" feature="audience_insights" title="Audience insights" subtitle="Follower growth and when your demo audience is active" onLocked={onLocked} teaserHeight={300}>
      <View style={s.card}>
        <Label style={{ marginBottom: 10 }}>Follower growth</Label>
        <View style={s.metricRow}>
          <Metric value={growth.start.toLocaleString("en-US")} label="Start" />
          <Metric value={growth.current.toLocaleString("en-US")} label="Now" />
          <Metric value={`+${growth.gained}`} label="Gained" accent />
          <Metric value={`+${growth.pct}%`} label="Growth" accent />
        </View>
        <LineChart key={period} values={series.map((p) => p.value)} labels={series.map((p) => p.label)} selected={sel} onSelect={setPoint} height={170} />
        <Text style={s.muted}>Tap a point to see followers on that date.</Text>
      </View>

      <View style={[s.card, { marginTop: 12 }]}>
        <Label style={{ marginBottom: 8 }}>Audience activity · demo week</Label>
        <BarChart values={AUDIENCE_DAYS.map((d) => d.level)} labels={AUDIENCE_DAYS.map((d) => d.short)} highlight={bestDayIndex} height={130} />
        <Text style={s.detailLine}>Most active days: <Text style={{ color: C.white, fontWeight: "700" }}>{active.join(" & ")}</Text></Text>
        <Label style={{ marginTop: 14, marginBottom: 8 }}>Suggested publishing windows</Label>
        {TIME_WINDOWS.map((w) => {
          const top = windows.some((x) => x.id === w.id);
          return (
            <View key={w.id} style={s.windowRow}>
              <Text style={[s.windowLabel, top && { color: C.white }]}>{w.label}</Text>
              <View style={s.catTrack}>
                <View style={{ height: "100%", width: `${w.level}%`, borderRadius: 4, backgroundColor: top ? C.flame : "rgba(255,247,237,0.18)" }} />
              </View>
            </View>
          );
        })}
      </View>

      <LinearGradient colors={["#FF5A1F", "#FF2E2E", "#5c0c0c"]} start={DIAG.start} end={DIAG.end} style={s.bestCard}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Clock size={16} color="#fff" />
          <Text style={s.bestKicker}>{BEST_TIME_COPY.title}</Text>
        </View>
        <Text style={s.bestTime}>{best.label}</Text>
        <Text style={s.bestSupport}>{BEST_TIME_COPY.support}</Text>
        <Text style={s.bestDisclaimer}>{BEST_TIME_COPY.disclaimer}</Text>
      </LinearGradient>
    </ProSection>
  );
}

// ── Creator tools ───────────────────────────────────────────────────────────
type ToolId = "schedule" | "pin" | "links" | "comments";
const TOOLS: { id: ToolId; label: string; icon: typeof CalendarClock }[] = [
  { id: "schedule", label: "Schedule", icon: CalendarClock },
  { id: "pin", label: "Pin", icon: Pin },
  { id: "links", label: "Links", icon: Link2 },
  { id: "comments", label: "Comments", icon: ListFilter },
];

function Tools({ state, onChange, onLocked, onToast }: { state: CreatorDemoState; onChange: (p: Partial<CreatorDemoState>) => void; onLocked: (f: PremiumFeature) => void; onToast: (m: string) => void }) {
  const [tool, setTool] = useState<ToolId>("schedule");
  return (
    <View style={{ marginTop: 22 }}>
      <Text style={s.sectionTitle}>Creator tools</Text>
      <View style={s.toolTabs}>
        {TOOLS.map((t) => {
          const on = t.id === tool;
          const Icon = t.icon;
          return (
            <Pressable key={t.id} accessibilityRole="tab" accessibilityState={{ selected: on }} aria-selected={on} onPress={() => { tap(); setTool(t.id); }} style={[s.toolTab, on && s.toolTabOn]}>
              <Icon size={16} color={on ? C.white : C.ash} />
              <Text style={[s.toolTabText, on && { color: C.white }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {tool === "schedule" ? <Schedule state={state} onChange={onChange} onLocked={onLocked} onToast={onToast} /> : null}
      {tool === "pin" ? <PinTool state={state} onChange={onChange} onLocked={onLocked} /> : null}
      {tool === "links" ? <LinkHub state={state} onChange={onChange} onLocked={onLocked} onToast={onToast} /> : null}
      {tool === "comments" ? <CommentFiltersTool state={state} onChange={onChange} onLocked={onLocked} /> : null}
    </View>
  );
}

function Schedule({ state, onChange, onLocked, onToast }: { state: CreatorDemoState; onChange: (p: Partial<CreatorDemoState>) => void; onLocked: (f: PremiumFeature) => void; onToast: (m: string) => void }) {
  const days = useMemo(() => upcomingDays(7), []);
  const [draftId, setDraftId] = useState(DRAFTS[0].id);
  const [day, setDay] = useState(1);
  const [time, setTime] = useState(SCHEDULE_TIMES[2]);
  const [editing, setEditing] = useState<string | null>(null);

  const submit = () => {
    tap();
    if (editing) {
      onChange({ schedule: updateScheduled(state.schedule, editing, { draftId, dayOffset: day, time }) });
      setEditing(null);
      onToast("Preview schedule updated. Nothing will be posted.");
    } else {
      const item: ScheduledItem = { id: `s-${Date.now()}`, draftId, dayOffset: day, time };
      onChange({ schedule: addScheduled(state.schedule, item) });
      onToast("Added to the preview schedule. Nothing will be posted.");
    }
  };
  const edit = (it: ScheduledItem) => { tap(); setEditing(it.id); setDraftId(it.draftId); setDay(it.dayOffset); setTime(it.time); };

  return (
    <ProSection plan="creator" feature="scheduled_posts_preview" title="Scheduled posts" onLocked={onLocked} teaserHeight={280}>
      <View style={s.banner}><CalendarClock size={16} color={C.gold} /><Text style={s.bannerText}>{STUDIO_COPY.schedulingBanner}</Text></View>
      <View style={[s.card, { marginTop: 12 }]}>
        <Label style={{ marginBottom: 8 }}>1 · Choose a demo post</Label>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {DRAFTS.map((d) => {
            const on = d.id === draftId;
            return (
              <Pressable key={d.id} accessibilityRole="radio" accessibilityState={{ checked: on }} aria-checked={on} accessibilityLabel={d.title} onPress={() => { tap(); setDraftId(d.id); }} style={[s.draft, on && s.draftOn]}>
                <View style={s.draftArt}><PostArt art={d.art} variant="thumb" /></View>
                <Text style={[s.draftTitle, on && { color: C.white }]} numberOfLines={2}>{d.title}</Text>
              </Pressable>
            );
          })}
        </View>
        <Label style={{ marginTop: 14, marginBottom: 8 }}>2 · Pick a day</Label>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {days.map((d) => (
            <Chip key={d.offset} on={day === d.offset} label={d.label} onPress={() => setDay(d.offset)} />
          ))}
        </ScrollView>
        <Label style={{ marginTop: 14, marginBottom: 8 }}>3 · Pick a time</Label>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {SCHEDULE_TIMES.map((t) => <Chip key={t} on={time === t} label={t} onPress={() => setTime(t)} />)}
        </View>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
          <Pressable accessibilityRole="button" onPress={submit} style={({ pressed }) => [{ flex: 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
            <LinearGradient colors={GRAD} start={DIAG.start} end={DIAG.end} style={s.primaryBtn}>
              {editing ? <Check size={16} color="#fff" /> : <Plus size={16} color="#fff" />}
              <Text style={s.primaryText}>{editing ? "Update item" : "Add to preview"}</Text>
            </LinearGradient>
          </Pressable>
          {editing ? (
            <Pressable accessibilityRole="button" onPress={() => { tap(); setEditing(null); }} style={s.ghostBtn}><Text style={s.ghostText}>Cancel</Text></Pressable>
          ) : null}
        </View>
      </View>
      <Label style={{ marginTop: 16, marginBottom: 8 }}>Preview schedule · {state.schedule.length}</Label>
      {state.schedule.length ? (
        state.schedule.map((it) => {
          const d = DRAFTS.find((x) => x.id === it.draftId)!;
          return (
            <View key={it.id} style={[s.schedRow, editing === it.id && { borderColor: C.flame }]}>
              <View style={s.schedArt}><PostArt art={d.art} variant="thumb" /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.postTitle} numberOfLines={1}>{d.title}</Text>
                <Text style={s.postCat}>{scheduleLabel(it)}</Text>
              </View>
              <IconBtn label={`Edit ${d.title}`} onPress={() => edit(it)} size={34}><Pencil size={15} color={C.white} /></IconBtn>
              <IconBtn label={`Remove ${d.title}`} onPress={() => { onChange({ schedule: removeScheduled(state.schedule, it.id) }); if (editing === it.id) setEditing(null); }} size={34}><Trash size={15} color={C.hot} /></IconBtn>
            </View>
          );
        })
      ) : (
        <Text style={s.muted}>Nothing scheduled in the preview.</Text>
      )}
      <Text style={[s.muted, { marginTop: 8 }]}>Preview only: nothing is published and no background tasks are created.</Text>
    </ProSection>
  );
}

function PinTool({ state, onChange, onLocked }: { state: CreatorDemoState; onChange: (p: Partial<CreatorDemoState>) => void; onLocked: (f: PremiumFeature) => void }) {
  const choices = DEMO_POSTS.slice(0, 6);
  const ordered = pinnedOrder(choices, state.pinnedPostId);
  return (
    <ProSection plan="creator" feature="pinned_posts" title="Pinned posts" onLocked={onLocked} teaserHeight={280}>
      <Text style={s.muted}>Choose a demo post to pin to the top of a mock creator profile.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 10 }}>
        {choices.map((p) => (
          <Chip key={p.id} on={state.pinnedPostId === p.id} label={p.title} onPress={() => onChange({ pinnedPostId: p.id })} />
        ))}
        <Chip on={state.pinnedPostId === null} label="No pin" onPress={() => onChange({ pinnedPostId: null })} />
      </ScrollView>
      <View style={s.card}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Avatar username={ME.username} name={ME.name} size={34} />
          <View style={{ flex: 1 }}>
            <Text style={s.postTitle}>@{ME.username}</Text>
            <Text style={s.postCat}>Mock creator profile</Text>
          </View>
        </View>
        <View style={s.mockGrid}>
          {ordered.map((p, i) => (
            <View key={p.id} style={s.mockTile}>
              <PostArt art={p.art} variant="thumb" />
              {i === 0 && state.pinnedPostId ? <View style={s.pinTag}><Pin size={11} color="#1c0f00" /><Text style={s.pinTagText}>Pinned</Text></View> : null}
            </View>
          ))}
        </View>
      </View>
      <Text style={[s.muted, { marginTop: 8 }]}>Pinning only changes your profile grid. It doesn't change Home Feed order or reach. (Separate from Profile Studio's pinned transformation.)</Text>
    </ProSection>
  );
}

const LINK_ICONS: Record<LinkKind, typeof Play> = { youtube: Play, instagram: Camera, programs: Dumbbell, portfolio: Briefcase };

function LinkHub({ state, onChange, onLocked, onToast }: { state: CreatorDemoState; onChange: (p: Partial<CreatorDemoState>) => void; onLocked: (f: PremiumFeature) => void; onToast: (m: string) => void }) {
  const setLink = (id: string, patch: Partial<CreatorLink>) => onChange({ links: state.links.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  return (
    <ProSection plan="creator" feature="creator_profile_customization" title="Link hub" onLocked={onLocked} teaserHeight={280}>
      <Text style={s.muted}>Edit labels and choose which links show on your creator profile. Links are placeholders and never open in the demo.</Text>
      <View style={{ gap: 10, marginTop: 10 }}>
        {state.links.map((l) => {
          const Icon = LINK_ICONS[l.kind];
          return (
            <View key={l.id} style={[s.linkRow, !l.visible && { opacity: 0.55 }]}>
              <Pressable accessibilityRole="button" accessibilityLabel={`Preview ${l.label} link`} onPress={() => { tap(); onToast("Preview only — links don't open in this demo."); }} style={s.linkIcon}>
                <Icon size={17} color={C.flame} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <TextInput value={l.label} onChangeText={(v) => setLink(l.id, { label: v.slice(0, 28) })} style={s.linkInput} accessibilityLabel={`${l.kind} link label`} placeholderTextColor={C.ash} />
                <Text style={s.postCat}>{l.placeholder}</Text>
              </View>
              <Switch value={l.visible} onValueChange={(v) => { tap(); setLink(l.id, { visible: v }); }} trackColor={{ true: C.flame, false: "rgba(255,247,237,0.2)" }} thumbColor="#fff" accessibilityLabel={`Show ${l.label}`} />
            </View>
          );
        })}
      </View>
    </ProSection>
  );
}

function CommentFiltersTool({ state, onChange, onLocked }: { state: CreatorDemoState; onChange: (p: Partial<CreatorDemoState>) => void; onLocked: (f: PremiumFeature) => void }) {
  const [kw, setKw] = useState("");
  const f = state.filters;
  const set = (patch: Partial<typeof f>) => onChange({ filters: { ...f, ...patch } });
  const results = applyCommentFilters(SAMPLE_COMMENTS, f);
  const addKw = () => {
    const k = kw.trim().toLowerCase().slice(0, 24);
    if (!k || f.keywords.includes(k)) return;
    tap();
    set({ keywords: [...f.keywords, k] });
    setKw("");
  };
  return (
    <ProSection plan="creator" feature="advanced_comment_filters" title="Advanced comment filters" onLocked={onLocked} teaserHeight={300}>
      <View style={s.safety}><ShieldCheck size={16} color={C.gold} /><Text style={s.safetyText}>{FILTER_SAFETY_NOTE}</Text></View>
      <View style={[s.card, { marginTop: 12, gap: 4 }]}>
        <ToggleRow label="Hide repetitive spam" value={f.spam} onChange={(v) => set({ spam: v })} />
        <ToggleRow label="Hide promotional comments" value={f.promo} onChange={(v) => set({ promo: v })} />
        <ToggleRow label="Hold keyword matches for review" value={f.holdKeywords} onChange={(v) => set({ holdKeywords: v })} />
        <Label style={{ marginTop: 10, marginBottom: 8 }}>Keyword filters</Label>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {f.keywords.map((k) => (
            <Pressable key={k} accessibilityRole="button" accessibilityLabel={`Remove keyword ${k}`} onPress={() => { tap(); set({ keywords: f.keywords.filter((x) => x !== k) }); }} style={s.kwChip}>
              <Text style={s.kwText}>{k}</Text>
              <X size={12} color={C.ash} />
            </Pressable>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
          <TextInput value={kw} onChangeText={setKw} onSubmitEditing={addKw} placeholder="Add a keyword" placeholderTextColor="rgba(255,247,237,0.34)" style={s.kwInput} accessibilityLabel="New keyword" autoCapitalize="none" />
          <IconBtn label="Add keyword" onPress={addKw}><Plus size={18} color={C.white} /></IconBtn>
        </View>
      </View>
      <Label style={{ marginTop: 16, marginBottom: 8 }}>Live preview · sample comments</Label>
      {results.map((c) => (
        <View key={c.id} style={[s.commentRow, c.outcome !== "shown" && { opacity: 0.6 }]}>
          <MessageSquare size={14} color={C.ash} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={s.commentUser}>@{c.user}</Text>
            <Text style={s.commentText}>{c.text}</Text>
          </View>
          <View style={[s.outcome, c.outcome === "hidden" ? s.outHidden : c.outcome === "held" ? s.outHeld : s.outShown]}>
            {c.outcome === "hidden" ? <EyeOff size={11} color={C.white} /> : c.outcome === "held" ? <Hourglass size={11} color="#1c0f00" /> : <Eye size={11} color={C.white} />}
            <Text style={[s.outText, c.outcome === "held" && { color: "#1c0f00" }]}>{c.outcome === "shown" ? "Shown" : c.reason}</Text>
          </View>
        </View>
      ))}
    </ProSection>
  );
}

// ── Creator profile ─────────────────────────────────────────────────────────
function CreatorProfile({ state, onChange, onLocked }: { state: CreatorDemoState; onChange: (p: Partial<CreatorDemoState>) => void; onLocked: (f: PremiumFeature) => void }) {
  const p = state.profile;
  const set = (patch: Partial<typeof p>) => onChange({ profile: { ...p, ...patch } });
  const accent = CREATOR_ACCENTS[p.accent];
  const t30 = periodTotals("30d");
  const pinned = DEMO_POSTS.find((x) => x.id === state.pinnedPostId) ?? null;
  const links = state.links.filter((l) => l.visible);
  return (
    <ProSection plan="creator" feature="creator_profile_customization" title="Creator profile" subtitle="Preview a creator look for your profile" onLocked={onLocked} teaserHeight={300}>
      <View style={s.previewCard} pointerEvents="none">
        <LinearGradient colors={accent.banner} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ height: 80 }} />
        <View style={{ alignItems: "center", marginTop: -34, paddingHorizontal: 14, paddingBottom: 14 }}>
          <View style={{ padding: 3, borderRadius: 40, backgroundColor: C.flame }}><View style={{ padding: 2, borderRadius: 40, backgroundColor: C.bg }}><Avatar username={ME.username} name={ME.name} size={60} /></View></View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
            <Text style={s.previewName}>{ME.name}</Text>
            <Badge tone="flame">{STUDIO_COPY.badgeCreatorPro}</Badge>
          </View>
          {p.showIdentity ? <View style={s.identity}><Clapperboard size={11} color={C.flame} /><Text style={s.identityText}>{STUDIO_COPY.badgeIdentity}</Text></View> : null}
          {p.showStats ? (
            <View style={[s.metricRow, { marginTop: 12, alignSelf: "stretch" }]}>
              <Metric value={formatCount(t30.views)} label="Views · 30d" />
              <Metric value={`${t30.engagementRate}%`} label="Engagement" accent />
              <Metric value={`+${t30.newFollowers}`} label="Followers" />
            </View>
          ) : null}
          {p.showLinks && links.length ? (
            <View style={s.linkChips}>{links.map((l) => <View key={l.id} style={s.linkChip}><Globe size={11} color={C.ash} /><Text style={s.linkChipText}>{l.label}</Text></View>)}</View>
          ) : null}
          {p.showPinned && pinned ? (
            <View style={s.pinnedRow}>
              <View style={{ width: 54, height: 70, borderRadius: 10, overflow: "hidden" }}><PostArt art={pinned.art} variant="thumb" /></View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><Pin size={11} color={C.flame} /><Text style={s.pinnedKicker}>Pinned post</Text></View>
                <Text style={s.postTitle} numberOfLines={1}>{pinned.title}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>
      <Text style={[s.muted, { marginTop: 8 }]}>{STUDIO_COPY.badgeNote}</Text>
      <Label style={{ marginTop: 16, marginBottom: 8 }}>Creator accent</Label>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {(Object.keys(CREATOR_ACCENTS) as (keyof typeof CREATOR_ACCENTS)[]).map((id) => {
          const on = p.accent === id;
          return (
            <Pressable key={id} accessibilityRole="radio" accessibilityState={{ checked: on }} aria-checked={on} accessibilityLabel={`${CREATOR_ACCENTS[id].name} accent`} onPress={() => { tap(); set({ accent: id }); }} style={[s.accentChip, on && s.accentOn]}>
              <LinearGradient colors={CREATOR_ACCENTS[id].banner} start={DIAG.start} end={DIAG.end} style={s.swatch}>{on ? <Check size={13} color="#fff" strokeWidth={3} /> : null}</LinearGradient>
              <Text style={[s.accentName, on && { color: C.white }]}>{CREATOR_ACCENTS[id].name}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={[s.card, { marginTop: 12, gap: 4 }]}>
        <ToggleRow label={`"${STUDIO_COPY.badgeIdentity}" label`} value={p.showIdentity} onChange={(v) => set({ showIdentity: v })} />
        <ToggleRow label="Creator stats strip" value={p.showStats} onChange={(v) => set({ showStats: v })} />
        <ToggleRow label="Link hub" value={p.showLinks} onChange={(v) => set({ showLinks: v })} />
        <ToggleRow label="Pinned post" value={p.showPinned} onChange={(v) => set({ showPinned: v })} />
      </View>
      <View style={s.applyRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.toggleLabel}>Show on my profile</Text>
          <Text style={s.muted}>This session only. Doesn't change Profile Studio settings.</Text>
        </View>
        <Switch value={p.applied} onValueChange={(v) => { tap(); set({ applied: v }); }} trackColor={{ true: C.flame, false: "rgba(255,247,237,0.2)" }} thumbColor="#fff" accessibilityLabel="Show creator look on my profile" />
      </View>
    </ProSection>
  );
}

// ── Brands ──────────────────────────────────────────────────────────────────
const CAMPAIGN_TONES: Record<Campaign["tone"], readonly [string, string]> = { ember: ["#3a1206", "#141414"], crimson: ["#3a0a0e", "#141414"], gold: ["#33240a", "#141414"] };

function Brands({ onLocked, onOpen }: { onLocked: (f: PremiumFeature) => void; onOpen: (c: Campaign) => void }) {
  return (
    <ProSection plan="creator" feature="brand_campaign_marketplace_preview" title="Brand campaign opportunities" subtitle={STUDIO_COPY.marketplace} onLocked={onLocked} teaserHeight={320}>
      <View style={{ gap: 12 }}>
        {CAMPAIGNS.map((c) => (
          <LinearGradient key={c.id} colors={CAMPAIGN_TONES[c.tone]} start={DIAG.start} end={DIAG.end} style={s.campaign}>
            <View style={s.demoOpp}><Text style={s.demoOppText}>{STUDIO_COPY.campaignTag}</Text></View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 }}>
              <Megaphone size={14} color={C.flame} />
              <Text style={s.brandLabel}>{c.brandLabel}</Text>
            </View>
            <Text style={s.campaignTitle}>{c.title}</Text>
            <Text style={s.campaignDesc}>{c.description}</Text>
            <View style={{ gap: 4, marginTop: 8 }}>
              <Text style={s.campaignMeta}><Text style={s.campaignMetaKey}>Content style  </Text>{c.contentStyle}</Text>
              <Text style={s.campaignMeta}><Text style={s.campaignMetaKey}>Eligibility  </Text>{c.eligibility}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Explore opportunity: ${c.title}`} onPress={() => { tap(); onOpen(c); }} style={({ pressed }) => [s.exploreBtn, { opacity: pressed ? 0.8 : 1 }]}>
              <Text style={s.exploreText}>Explore Opportunity</Text>
              <ArrowRight size={15} color={C.white} />
            </Pressable>
          </LinearGradient>
        ))}
      </View>
    </ProSection>
  );
}

function CampaignSheet({ campaign, onClose }: { campaign: Campaign | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={!!campaign} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="Close campaign preview" />
      {campaign ? (
        <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={s.handle} />
          <View style={s.sheetHead}>
            <View style={s.demoOpp}><Text style={s.demoOppText}>{STUDIO_COPY.campaignTag}</Text></View>
            <IconBtn label="Close campaign preview" onPress={onClose} size={34}><X size={18} color={C.white} /></IconBtn>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 8 }}>
            <Text style={s.brandLabel}>{campaign.brandLabel}</Text>
            <Text style={[s.sheetTitle, { marginTop: 4 }]}>{campaign.title}</Text>
            <Text style={s.campaignDesc}>{campaign.description}</Text>
            <Label style={{ marginTop: 16, marginBottom: 6 }}>Desired content style</Label>
            <Text style={s.detailLine}>{campaign.contentStyle}</Text>
            <Label style={{ marginTop: 14, marginBottom: 6 }}>Mock eligibility</Label>
            <Text style={s.detailLine}>{campaign.eligibility}</Text>
            <Label style={{ marginTop: 14, marginBottom: 6 }}>What a campaign like this might look for</Label>
            {campaign.details.map((d) => <Text key={d} style={s.detailLine}>→  {d}</Text>)}
            <View style={[s.safety, { marginTop: 16 }]}><ShieldCheck size={16} color={C.gold} /><Text style={s.safetyText}>{STUDIO_COPY.campaignDisclaimer}</Text></View>
          </ScrollView>
          <Pressable accessibilityRole="button" onPress={() => { tap(); onClose(); }} style={[s.ghostBtn, { marginHorizontal: 16, marginTop: 8, height: 48 }]}>
            <ArrowLeft size={15} color={C.white} />
            <Text style={s.ghostText}>Back to opportunities</Text>
          </Pressable>
        </View>
      ) : null}
    </Modal>
  );
}

// ── Small building blocks ───────────────────────────────────────────────────
function Metric({ icon, value, label, accent }: { icon?: ReactNode; value: string; label: string; accent?: boolean }) {
  return (
    <View style={{ flex: 1, alignItems: "flex-start", gap: 2 }}>
      {icon}
      <Text style={[s.metricValue, accent && { color: C.gold }]}>{value}</Text>
      <Text style={s.metricLabel}>{label}</Text>
    </View>
  );
}

function InlineStat({ icon, value }: { icon: ReactNode; value: string }) {
  return <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>{icon}<Text style={s.inlineText}>{value}</Text></View>;
}

function Chip({ on, label, onPress }: { on: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: on }} aria-checked={on} onPress={() => { tap(); onPress(); }} style={[s.chip, on && s.chipOn]}>
      <Text style={[s.chipText, on && { color: C.white }]}>{label}</Text>
    </Pressable>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={s.toggleRow}>
      <Text style={[s.toggleLabel, { flex: 1 }]}>{label}</Text>
      <Switch value={value} onValueChange={(v) => { tap(); onChange(v); }} trackColor={{ true: C.flame, false: "rgba(255,247,237,0.2)" }} thumbColor="#fff" accessibilityLabel={label} />
    </View>
  );
}

const s = StyleSheet.create({
  hero: { marginHorizontal: 16, padding: 18, borderRadius: 24, overflow: "hidden", gap: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,90,31,0.35)" },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rec: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 9, height: 24, borderRadius: 7, backgroundColor: "rgba(9,9,9,0.5)" },
  recDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.hot },
  recText: { fontFamily: F.labelHeavy, fontSize: 11, letterSpacing: 1.6, color: C.white },
  heroTitle: { fontFamily: F.display, fontSize: 36, lineHeight: 40, color: C.white },
  heroSub: { fontSize: 15, fontWeight: "600", color: "rgba(255,247,237,0.9)" },
  heroNote: { fontSize: 12, lineHeight: 17, color: "rgba(255,247,237,0.72)" },
  heroLink: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  heroLinkText: { fontFamily: F.labelHeavy, fontSize: 14, letterSpacing: 1.2, textTransform: "uppercase", color: C.gold },
  demoTag: { height: 26, paddingHorizontal: 10, borderRadius: 13, justifyContent: "center", backgroundColor: "rgba(255,247,237,0.1)" },
  demoTagText: { fontFamily: F.labelHeavy, fontSize: 11, letterSpacing: 1.4, color: C.white },
  stickyBar: { backgroundColor: "rgba(9,9,9,0.97)", paddingVertical: 10, gap: 8 },
  tabs: { paddingHorizontal: 16, gap: 8 },
  tabBtn: { height: 36, paddingHorizontal: 15, borderRadius: 18, justifyContent: "center", overflow: "hidden", backgroundColor: "rgba(255,247,237,0.06)" },
  tabText: { fontFamily: F.labelHeavy, fontSize: 14, letterSpacing: 1.1, textTransform: "uppercase", color: "rgba(255,247,237,0.72)" },
  periods: { flexDirection: "row", marginHorizontal: 16, padding: 3, borderRadius: 12, backgroundColor: "rgba(255,247,237,0.05)" },
  periodBtn: { flex: 1, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  periodOn: { backgroundColor: "rgba(255,90,31,0.28)", borderWidth: 1, borderColor: C.flame },
  periodText: { fontFamily: F.labelHeavy, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", color: C.ash },
  sectionTitle: { fontFamily: F.display, fontSize: 24, lineHeight: 28, textTransform: "uppercase", color: C.white },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "48%", flexGrow: 1, padding: 12, borderRadius: 16, backgroundColor: "#141414", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,247,237,0.08)", gap: 3 },
  statHot: { borderColor: "rgba(255,90,31,0.5)", backgroundColor: "#1a0f0b" },
  statIcon: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,90,31,0.12)", marginBottom: 4 },
  statValue: { fontFamily: F.display, fontSize: 24, lineHeight: 28, color: C.white },
  statLabel: { fontFamily: F.label, fontSize: 11, letterSpacing: 1.1, textTransform: "uppercase", color: C.ash },
  card: { padding: 14, borderRadius: 20, backgroundColor: "#141414", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,247,237,0.08)" },
  muted: { fontSize: 12, lineHeight: 17, color: C.ash, marginTop: 4 },
  catRow: { paddingVertical: 8, paddingHorizontal: 8, borderRadius: 12, gap: 6 },
  catRowOn: { backgroundColor: "rgba(255,90,31,0.1)" },
  catName: { fontSize: 13.5, color: "rgba(255,247,237,0.78)" },
  catViews: { fontFamily: F.labelHeavy, fontSize: 13, color: C.ash },
  catTrack: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden", backgroundColor: "rgba(255,247,237,0.06)" },
  catTitle: { marginTop: 4, fontFamily: F.labelHeavy, fontSize: 18, letterSpacing: 0.6, color: C.white },
  metricRow: { flexDirection: "row", gap: 8, marginTop: 10, marginBottom: 6 },
  metricValue: { fontFamily: F.display, fontSize: 20, lineHeight: 24, color: C.white },
  metricLabel: { fontFamily: F.label, fontSize: 10.5, letterSpacing: 1, textTransform: "uppercase", color: C.ash },
  postCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 18, backgroundColor: "#141414", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,247,237,0.08)" },
  thumb: { width: 66, height: 88, borderRadius: 12, overflow: "hidden" },
  rank: { position: "absolute", top: 4, left: 4, paddingHorizontal: 5, borderRadius: 5, overflow: "hidden", fontFamily: F.labelHeavy, fontSize: 11, color: "#fff", backgroundColor: C.flame },
  postTitle: { fontFamily: F.labelHeavy, fontSize: 15, letterSpacing: 0.6, color: C.white },
  postCat: { fontSize: 12, color: C.ash },
  inlineStats: { flexDirection: "row", gap: 10 },
  inlineText: { fontSize: 11.5, color: "rgba(255,247,237,0.8)" },
  erBar: { height: 5, borderRadius: 3, overflow: "hidden", backgroundColor: "rgba(255,247,237,0.07)" },
  erValue: { fontFamily: F.display, fontSize: 18, color: C.gold },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "90%", borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: "#141414", borderTopWidth: 1.5, borderColor: "rgba(255,90,31,0.5)" },
  handle: { alignSelf: "center", width: 42, height: 4, borderRadius: 2, marginTop: 10, backgroundColor: "rgba(255,247,237,0.22)" },
  sheetHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8 },
  sheetTitle: { fontFamily: F.display, fontSize: 26, lineHeight: 30, color: C.white, textTransform: "uppercase" },
  detailLine: { fontSize: 13.5, lineHeight: 20, color: "rgba(255,247,237,0.86)" },
  windowRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  windowLabel: { width: 84, fontFamily: F.label, fontSize: 12, letterSpacing: 0.8, color: C.ash },
  bestCard: { marginTop: 12, padding: 18, borderRadius: 22, gap: 6 },
  bestKicker: { fontFamily: F.labelHeavy, fontSize: 13, letterSpacing: 1.8, color: "#fff" },
  bestTime: { fontFamily: F.display, fontSize: 34, lineHeight: 38, color: "#fff" },
  bestSupport: { fontSize: 14, lineHeight: 20, fontWeight: "600", color: "#fff" },
  bestDisclaimer: { fontSize: 11.5, lineHeight: 16, color: "rgba(255,255,255,0.8)" },
  toolTabs: { flexDirection: "row", gap: 6, marginTop: 10, marginBottom: 2 },
  toolTab: { flex: 1, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", gap: 3, backgroundColor: "rgba(255,247,237,0.05)" },
  toolTabOn: { backgroundColor: "rgba(255,90,31,0.22)", borderWidth: 1, borderColor: C.flame },
  toolTabText: { fontFamily: F.labelHeavy, fontSize: 11.5, letterSpacing: 1, textTransform: "uppercase", color: C.ash },
  banner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 14, backgroundColor: "rgba(255,209,102,0.1)", borderWidth: 1, borderColor: "rgba(255,209,102,0.35)" },
  bannerText: { fontFamily: F.labelHeavy, fontSize: 14, letterSpacing: 0.8, color: C.gold },
  draft: { flex: 1, padding: 6, borderRadius: 14, backgroundColor: "rgba(255,247,237,0.04)", borderWidth: 1.5, borderColor: "transparent", gap: 6 },
  draftOn: { borderColor: C.flame, backgroundColor: "rgba(255,90,31,0.1)" },
  draftArt: { height: 74, borderRadius: 10, overflow: "hidden" },
  draftTitle: { fontFamily: F.labelHeavy, fontSize: 11.5, letterSpacing: 0.6, color: C.ash },
  chip: { height: 36, paddingHorizontal: 13, borderRadius: 18, justifyContent: "center", backgroundColor: "rgba(255,247,237,0.06)", borderWidth: 1.5, borderColor: "transparent" },
  chipOn: { borderColor: C.flame, backgroundColor: "rgba(255,90,31,0.16)" },
  chipText: { fontSize: 13, fontWeight: "600", color: "rgba(255,247,237,0.78)" },
  primaryBtn: { height: 48, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  primaryText: { fontFamily: F.labelHeavy, fontSize: 15, letterSpacing: 1.2, textTransform: "uppercase", color: "#fff" },
  ghostBtn: { height: 48, paddingHorizontal: 16, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderWidth: 1, borderColor: "rgba(255,247,237,0.2)" },
  ghostText: { fontFamily: F.labelHeavy, fontSize: 14, letterSpacing: 1.2, textTransform: "uppercase", color: C.white },
  schedRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 8, marginBottom: 8, borderRadius: 16, backgroundColor: "#141414", borderWidth: 1, borderColor: "transparent" },
  schedArt: { width: 44, height: 56, borderRadius: 9, overflow: "hidden" },
  mockGrid: { flexDirection: "row", flexWrap: "wrap", gap: 3 },
  mockTile: { width: "32.3%", aspectRatio: 3 / 4, borderRadius: 6, overflow: "hidden" },
  pinTag: { position: "absolute", top: 5, left: 5, flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: C.gold },
  pinTagText: { fontFamily: F.labelHeavy, fontSize: 10, letterSpacing: 0.8, color: "#1c0f00" },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, backgroundColor: "#141414" },
  linkIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,90,31,0.12)" },
  linkInput: { fontSize: 15, fontWeight: "700", color: C.white, paddingVertical: 2 },
  safety: { flexDirection: "row", gap: 10, padding: 12, borderRadius: 14, backgroundColor: "rgba(255,209,102,0.08)", borderWidth: 1, borderColor: "rgba(255,209,102,0.3)" },
  safetyText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: "rgba(255,247,237,0.86)" },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  toggleLabel: { fontSize: 14, fontWeight: "600", color: C.white },
  kwChip: { flexDirection: "row", alignItems: "center", gap: 5, height: 30, paddingHorizontal: 10, borderRadius: 15, backgroundColor: "rgba(255,247,237,0.08)" },
  kwText: { fontSize: 12.5, color: C.white },
  kwInput: { flex: 1, height: 40, paddingHorizontal: 12, borderRadius: 12, fontSize: 14, color: C.white, backgroundColor: "rgba(255,247,237,0.06)" },
  commentRow: { flexDirection: "row", gap: 10, padding: 10, marginBottom: 6, borderRadius: 14, backgroundColor: "#141414" },
  commentUser: { fontSize: 12, fontWeight: "700", color: C.ash },
  commentText: { fontSize: 13.5, color: C.white },
  outcome: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingHorizontal: 8, height: 22, borderRadius: 7, maxWidth: 120 },
  outShown: { backgroundColor: "rgba(255,247,237,0.1)" },
  outHidden: { backgroundColor: "rgba(255,46,46,0.35)" },
  outHeld: { backgroundColor: C.gold },
  outText: { fontFamily: F.label, fontSize: 11, letterSpacing: 0.6, color: C.white },
  previewCard: { borderRadius: 22, overflow: "hidden", backgroundColor: "#0e0e0e", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,90,31,0.35)" },
  previewName: { fontFamily: F.display, fontSize: 24, textTransform: "uppercase", color: C.white },
  identity: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, backgroundColor: "rgba(255,90,31,0.12)" },
  identityText: { fontFamily: F.labelHeavy, fontSize: 11, letterSpacing: 1.4, color: C.flame },
  linkChips: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 10 },
  linkChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, height: 26, borderRadius: 13, backgroundColor: "rgba(255,247,237,0.07)" },
  linkChipText: { fontSize: 12, color: C.white },
  pinnedRow: { flexDirection: "row", alignItems: "center", gap: 10, alignSelf: "stretch", marginTop: 12, padding: 8, borderRadius: 14, backgroundColor: "rgba(255,90,31,0.08)" },
  pinnedKicker: { fontFamily: F.labelHeavy, fontSize: 10.5, letterSpacing: 1.2, textTransform: "uppercase", color: C.flame },
  accentChip: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, padding: 8, borderRadius: 14, backgroundColor: "rgba(255,247,237,0.04)", borderWidth: 1.5, borderColor: "transparent" },
  accentOn: { borderColor: C.flame },
  swatch: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  accentName: { fontSize: 13, fontWeight: "600", color: "rgba(255,247,237,0.78)" },
  applyRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12, padding: 12, borderRadius: 16, backgroundColor: "rgba(255,90,31,0.08)", borderWidth: 1, borderColor: "rgba(255,90,31,0.35)" },
  campaign: { padding: 16, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,247,237,0.1)" },
  demoOpp: { alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7, backgroundColor: "rgba(255,247,237,0.1)", borderWidth: 1, borderColor: "rgba(255,247,237,0.25)" },
  demoOppText: { fontFamily: F.labelHeavy, fontSize: 10.5, letterSpacing: 1.2, color: C.white },
  brandLabel: { fontFamily: F.label, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: C.ash },
  campaignTitle: { marginTop: 6, fontFamily: F.display, fontSize: 22, lineHeight: 26, color: C.white, textTransform: "uppercase" },
  campaignDesc: { marginTop: 6, fontSize: 13.5, lineHeight: 19, color: "rgba(255,247,237,0.86)" },
  campaignMeta: { fontSize: 12.5, lineHeight: 18, color: "rgba(255,247,237,0.78)" },
  campaignMetaKey: { fontFamily: F.labelHeavy, fontSize: 11, letterSpacing: 1, color: C.flame },
  exploreBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, height: 44, marginTop: 14, borderRadius: 13, borderWidth: 1, borderColor: C.flame, backgroundColor: "rgba(255,90,31,0.12)" },
  exploreText: { fontFamily: F.labelHeavy, fontSize: 14, letterSpacing: 1.2, textTransform: "uppercase", color: C.white },
  footnote: { marginTop: 24, textAlign: "center", fontSize: 12, lineHeight: 17, color: C.ash },
});
