import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Text as SvgText } from "react-native-svg";
import { BarChart3, Bookmark, Briefcase, Clapperboard, ClipboardList, Crown, Flame, Grid3x3, MessageSquare, Palette, Pin, Play, Settings, Share2, Shield, ShieldAlert, Target, Video } from "lucide-react-native";
import type { BadgeTone, Post, PostArtData } from "../data";
import { CHALLENGES, ME, PERSONAL_RECORDS, PROFILE_EXTRA_TILES } from "../data";
import { PostArt } from "../components/PostArt";
import { PostThumb } from "../home/HomePost";
import { Glows } from "../components/Tone";
import { Avatar, Badge, GradText, IconBtn, IconMark, Label, ListGroup, ListRow, ProgressRing, Tag, Verified, tap, useReducedMotion } from "../components/ui";
import { PINNED_ART } from "../pro/ProfileStudio";
import { FounderBadge } from "../founders/FounderBadge";
import { formatCount } from "../utils";
import { C, DIAG, F, GRAD, GRAD_GOLD, GRAD_PR, GUTTER, LINE, NAV_GAP, NAV_HEIGHT, RADIUS, SURFACE, TEXT, TINT, TYPE } from "../theme";

type Props = {
  myPosts: Post[];
  savedPosts: Post[];
  onOpenPost: (id: string) => void;
  onTimeline: () => void;
  onChallenges: () => void;
  onToast: (m: string) => void;
  /** Development builds only: long-press Settings to open developer tools. */
  onDevTools?: () => void;
  /** Opens the GYMX Premium (Coming Soon) screen. */
  onPremium?: () => void;
  /** Opens Profile Studio (premium customization preview). */
  onStudio?: () => void;
  /** Session-only premium cosmetics; null renders the standard free profile. */
  look?: ProfileLook | null;
  /** Opens Creator Studio (Creator Pro tools preview). */
  onCreatorStudio?: () => void;
  /** Session-only creator look from Creator Studio; independent of Profile Studio. */
  creator?: CreatorLook | null;
  /** Opens the Coach Command Center (Coach Pro tools preview). */
  onCoachCenter?: () => void;
  /** Session-only coach look from the Command Center; independent of Profile Studio and the creator look. */
  coach?: CoachLook | null;
  /** Opens the GYMX Founders recognition concept. */
  onFounders?: () => void;
  /** Founder recognition preview (developer toggle). Independent of membership; never a primary badge. */
  founder?: boolean;
};

export interface CoachLook {
  banner: [string, string, string];
  badge: string;
  specialty: string;
  /** Concept chip text — always "VERIFICATION PREVIEW — NOT VERIFIED". Never real verification. */
  verificationPreview: string | null;
  featuredService: string | null;
  inquiryButton: boolean;
  testimonial: { text: string; alias: string } | null;
  programs: number | null;
  transformation: string | null;
}

export interface CreatorLook {
  banner: [string, string, string];
  identityLabel: string | null;
  badge: string | null;
  stats: { label: string; value: string }[] | null;
  links: { id: string; label: string }[] | null;
  pinned: { title: string; art: PostArtData } | null;
}

export interface ProfileLook {
  banner: [string, string, string];
  ring: [string, string, string, string, string];
  badge: { label: string; tone: BadgeTone } | null;
  pinned: boolean;
}

export function ProfileScreen({ myPosts, savedPosts, onOpenPost, onTimeline, onChallenges, onToast, onDevTools, onPremium, onStudio, look, onCreatorStudio, creator, onCoachCenter, coach, onFounders, founder }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<"posts" | "saved">("posts");
  const challenge = CHALLENGES.find((c) => c.id === ME.challengeId)!;
  const created = myPosts.filter((p) => p.created).length;
  const pct = Math.round((ME.challengeDay / challenge.totalDays) * 100);
  const coverH = 176 + insets.top;
  const tileW = (width - 4) / 3;
  const hasPremiumTools = !!(onPremium || onStudio || onCreatorStudio || onCoachCenter);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: insets.bottom + NAV_GAP + NAV_HEIGHT + 24 }} showsVerticalScrollIndicator={false} stickyHeaderIndices={[4]}>
      <View style={{ height: coverH, overflow: "hidden" }}>
        <LinearGradient colors={look?.banner ?? creator?.banner ?? coach?.banner ?? ["#FF5A1F", "#8D1B10", "#1A0805"]} locations={[0, 0.58, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
        <Glows glows={[{ color: C.gold, cx: "88%", cy: "0%", rx: "70%", ry: "90%", opacity: 0.45 }, { color: C.hot, cx: "0%", cy: "100%", rx: "90%", ry: "100%", opacity: 0.5 }]} />
        <Svg style={{ position: "absolute", left: -6, bottom: -18 }} width={width + 40} height={170}>
          <SvgText x="0" y="150" fontFamily={F.display} fontSize="160" fill="none" stroke="rgba(255,247,237,0.2)" strokeWidth="1.5">{ME.name.toUpperCase()}</SvgText>
        </Svg>
        <LinearGradient colors={["rgba(9,9,9,0)", C.bg]} locations={[0.3, 1]} style={StyleSheet.absoluteFill} />
        <View style={[s.coverActions, { top: insets.top + 10 }]}>
          <IconBtn label="Share profile" onPress={() => onToast("Profile link copied.")} style={s.coverBtn}><Share2 size={18} color={C.white} /></IconBtn>
          <IconBtn label="Settings" onPress={() => onToast("Settings aren’t part of this demo.")} onLongPress={onDevTools} style={s.coverBtn}><Settings size={18} color={C.white} /></IconBtn>
        </View>
      </View>

      <View style={s.identity}>
        <GlowRing colors={look?.ring}>
          <Avatar username={ME.username} name={ME.name} size={92} />
        </GlowRing>
        <View style={s.nameRow}>
          <Text style={s.name} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{ME.name}</Text>
          {/* The generic check mark is hidden under the coach look so it can't read as coaching certification. */}
          {coach ? null : <Verified size={20} />}
          {/* One primary membership badge at a time. */}
          {look?.badge ? <Badge tone={look.badge.tone}>{look.badge.label}</Badge> : creator?.badge ? <Badge tone="flame">{creator.badge}</Badge> : coach?.badge ? <Badge tone="ash">{coach.badge}</Badge> : null}
        </View>
        <Text style={s.handle}>@{ME.username}</Text>
        {creator?.identityLabel ? (
          <View style={s.creatorIdentity}><Clapperboard size={11} color={C.flame} /><Text style={s.creatorIdentityText}>{creator.identityLabel}</Text></View>
        ) : null}
        {coach ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 8 }}>
            <View style={s.coachSpecialty}><Briefcase size={11} color={C.gold} /><Text style={s.coachSpecialtyText}>{coach.specialty}</Text></View>
            {coach.verificationPreview ? (
              <View style={s.coachVerify} accessibilityLabel={coach.verificationPreview}><ShieldAlert size={11} color={C.ash} /><Text style={s.coachVerifyText}>{coach.verificationPreview}</Text></View>
            ) : null}
          </View>
        ) : null}
        {founder ? <View style={{ marginTop: 8 }}><FounderBadge /></View> : null}
        <Text style={s.bio}>{ME.bio}</Text>
        <View style={s.goal}>
          <Target size={14} color={C.flame} />
          <Text style={s.goalText}>Goal · {ME.goal}</Text>
        </View>
        <View style={s.stats}>
          <Stat label="Followers" value={ME.followers} />
          <Stat label="Following" value={ME.following} divider />
          <Stat label="Posts" value={String(ME.basePosts + created)} divider />
          <Stat label="Day streak" value={String(ME.streak)} divider streak />
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 32 }}>
        <View style={s.sectionRow}><Label>Personal records</Label><Label accent>LB</Label></View>
        <View style={s.prs}>
          {PERSONAL_RECORDS.map((pr, i) => (
            <View key={pr.lift} style={[s.pr, i > 0 && s.prDivider]} accessible accessibilityLabel={`${pr.lift} personal record ${pr.value} pounds, ${pr.delta}`}>
              <Label>{pr.lift}</Label>
              <GradText vertical colors={GRAD_PR} style={s.prValue}>{pr.value}</GradText>
              <Text style={s.prDelta}>{pr.delta}</Text>
            </View>
          ))}
        </View>

        <Label style={s.groupLabel}>Training</Label>
        <ListGroup>
          <ListRow
            icon={<ProgressRing value={pct} size={40} stroke={4}><Flame size={15} color={C.flame} fill={C.flame} /></ProgressRing>}
            title={challenge.title}
            subtitle={`Current challenge · Day ${ME.challengeDay} of ${challenge.totalDays}`}
            accessibilityLabel={`Current challenge, ${challenge.title}, day ${ME.challengeDay} of ${challenge.totalDays}`}
            onPress={onChallenges}
          />
          <ListRow
            icon={<IconMark icon={BarChart3} tone="flame" solid size={40} />}
            title="Progress Timeline"
            subtitle="6 months · 124 workouts · +45 lb"
            accessibilityLabel="View Progress Timeline"
            onPress={onTimeline}
          />
        </ListGroup>

        {hasPremiumTools ? (
          <>
            <View style={[s.sectionRow, s.groupLabel]}><Label>GYMX Premium</Label><Tag tone="gold">Coming soon</Tag></View>
            <ListGroup>
              {onPremium ? (
                <ListRow icon={<IconMark icon={Crown} tone="gold" solid size={40} />} title="Memberships" subtitle="Compare Pro, Creator and Coach plans" accessibilityLabel="GYMX Premium, memberships coming soon" onPress={onPremium} />
              ) : null}
              {onStudio ? (
                <ListRow icon={<IconMark icon={Palette} tone="gold" size={40} />} title="Profile Studio" badge={<Tag tone="gold">PRO</Tag>} subtitle={look ? "Premium look on · this session" : "Banners, glow ring, PRO badge"} accessibilityLabel="Profile Studio, GYMX Pro preview, coming soon" onPress={onStudio} />
              ) : null}
              {onCreatorStudio ? (
                <ListRow icon={<IconMark icon={Video} tone="flame" size={40} />} title="Creator Studio" badge={<Tag tone="flame">CREATOR</Tag>} subtitle={creator ? "Creator look on · this session" : "Analytics, scheduling, campaigns"} accessibilityLabel="Creator Studio, Creator Pro tools preview, coming soon" onPress={onCreatorStudio} />
              ) : null}
              {onCoachCenter ? (
                <ListRow icon={<IconMark icon={ClipboardList} tone="bone" size={40} />} title="Coach Command Center" badge={<Tag tone="bone">COACH</Tag>} subtitle={coach ? "Coach look on · this session" : "Leads, bookings, services"} accessibilityLabel="Coach Command Center, Coach Pro tools preview, coming soon" onPress={onCoachCenter} />
              ) : null}
            </ListGroup>
          </>
        ) : null}

        {/* Founders is a recognition concept, not a membership, so it sits outside the GYMX Premium group. */}
        {onFounders ? (
          <>
            <Label style={s.groupLabel}>Community</Label>
            <ListGroup>
              <ListRow icon={<IconMark icon={Shield} tone="gold" size={40} />} title="GYMX Founders" subtitle={founder ? "Founder recognition preview on · this session" : "Recognition concept · not a membership"} accessibilityLabel="GYMX Founders, recognition concept" onPress={onFounders} style={founder ? s.founderRow : undefined} />
            </ListGroup>
          </>
        ) : null}
      </View>

      <View style={{ paddingTop: 28 }}>
        {founder ? (
          <LinearGradient colors={["#FFE6A3", "#C9962E", "#FF7A2F"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.founderFrame}>
            <View style={s.founderCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Shield size={14} color={C.gold} />
                <Text style={s.founderKicker}>Founding member · recognition preview</Text>
              </View>
              <Text style={s.founderText}>Early-community recognition concept. It doesn't change your plan, unlock features or verify identity or credentials.</Text>
              <Text style={s.founderNote}>Founder preview · this session only</Text>
            </View>
          </LinearGradient>
        ) : null}
        {look?.pinned ? (
          <View style={s.pinned}>
            <View style={s.pinnedArt}><PostArt art={PINNED_ART} variant="thumb" /></View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}><Pin size={12} color={C.gold} /><Text style={s.pinnedLabel}>Pinned transformation</Text></View>
              <Text style={s.pinnedTitle}>6 months of consistency</Text>
              <Text style={s.pinnedNote}>Demo illustration · Profile Studio preview</Text>
            </View>
          </View>
        ) : null}
        {creator && (creator.stats || creator.links || creator.pinned) ? (
          <View style={s.creatorStrip}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Clapperboard size={12} color={C.flame} />
              <Text style={s.creatorStripKicker}>Creator preview · demo</Text>
            </View>
            {creator.stats ? (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                {creator.stats.map((st) => (
                  <View key={st.label} style={{ flex: 1 }}>
                    <Text style={s.creatorStatValue}>{st.value}</Text>
                    <Text style={s.creatorStatLabel}>{st.label}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {creator.links ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {creator.links.map((l) => <View key={l.id} style={s.creatorLink}><Text style={s.creatorLinkText}>{l.label}</Text></View>)}
              </View>
            ) : null}
            {creator.pinned ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 }}>
                <View style={{ width: 46, height: 60, borderRadius: 9, overflow: "hidden" }}><PostArt art={creator.pinned.art} variant="thumb" /></View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><Pin size={11} color={C.flame} /><Text style={s.creatorStripKicker}>Pinned post</Text></View>
                  <Text style={s.pinnedTitle} numberOfLines={1}>{creator.pinned.title}</Text>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}
        {coach ? (
          <View style={s.coachStrip}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <ClipboardList size={12} color={C.gold} />
              <Text style={s.coachKicker}>Coach preview · demo</Text>
            </View>
            {coach.featuredService ? <Text style={s.coachLine}>Featured service · {coach.featuredService}</Text> : null}
            {coach.inquiryButton ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Coaching inquiry button preview" onPress={() => { tap(); onToast("Preview only — inquiries can't be sent in this demo."); }} style={({ pressed }) => [s.coachInquiry, pressed && { opacity: 0.85 }]}>
                <MessageSquare size={14} color="#1c1407" />
                <Text style={s.coachInquiryText}>Send a coaching inquiry</Text>
              </Pressable>
            ) : null}
            {coach.testimonial ? <Text style={s.coachQuote} numberOfLines={2}>“{coach.testimonial.text}” — {coach.testimonial.alias}</Text> : null}
            {coach.programs || coach.transformation ? (
              <Text style={s.coachMeta}>{[coach.programs ? `${coach.programs} coaching programs` : null, coach.transformation ? `Featured transformation: ${coach.transformation}` : null].filter(Boolean).join(" · ")}</Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={s.tabs}>
        {(["posts", "saved"] as const).map((t) => {
          const on = tab === t;
          return (
            <Pressable key={t} accessibilityRole="tab" accessibilityState={{ selected: on }} aria-selected={on} onPress={() => { tap(); setTab(t); }} style={s.tab}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                {t === "posts" ? <Grid3x3 size={17} color={on ? C.white : C.ash} /> : <Bookmark size={17} color={on ? C.white : C.ash} />}
                <Text style={[s.tabText, on && { color: C.white }]}>{t === "posts" ? "Posts" : `Saved ${savedPosts.length}`}</Text>
              </View>
              {on ? <LinearGradient colors={GRAD} start={DIAG.start} end={DIAG.end} style={s.tabLine} /> : null}
            </Pressable>
          );
        })}
      </View>

      {tab === "posts" ? (
        <View style={s.grid}>
          {myPosts.map((p) => (
            <GridTile key={p.id} w={tileW} onPress={() => { tap(); onOpenPost(p.id); }} label={`Open post: ${p.caption}`}>
              <PostThumb post={p} />
              {p.created ? <LinearGradient colors={GRAD_GOLD} start={DIAG.start} end={DIAG.end} style={s.newTag}><Text style={s.newText}>New</Text></LinearGradient> : null}
              <View style={s.views}><Play size={11} color={C.white} fill={C.white} /><Text style={s.viewsText}>{formatCount(p.likes * 4 || 1)}</Text></View>
            </GridTile>
          ))}
          {PROFILE_EXTRA_TILES.map((t) => (
            <GridTile key={t.id} w={tileW} onPress={() => onToast("Older posts aren’t in this demo feed.")} label="Older post">
              <PostArt art={t.art} variant="thumb" />
              <View style={s.views}><Play size={11} color={C.white} fill={C.white} /><Text style={s.viewsText}>{t.views}</Text></View>
            </GridTile>
          ))}
        </View>
      ) : savedPosts.length ? (
        <View style={s.grid}>
          {savedPosts.map((p) => (
            <GridTile key={p.id} w={tileW} onPress={() => { tap(); onOpenPost(p.id); }} label={`Open saved post by @${p.username}`}>
              <PostThumb post={p} />
              <View style={s.views}><Bookmark size={11} color={C.gold} fill={C.gold} /><Text style={s.viewsText}>@{p.username}</Text></View>
            </GridTile>
          ))}
        </View>
      ) : (
        <View style={s.emptyWrap}>
          <Bookmark size={24} color={C.ash} />
          <Text style={s.emptyTitle}>Nothing saved yet</Text>
          <Text style={s.empty}>Tap the bookmark on any post to save it here.</Text>
        </View>
      )}
    </ScrollView>
  );
}

/** Avatar ring: a slow rotating sweep in the profile's ring colours. */
function GlowRing({ children, colors }: { children: ReactNode; colors?: [string, string, string, string, string] }) {
  const r = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(Animated.timing(r, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [r, reduced]);
  return (
    <View style={s.ringWrap}>
      <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 60, overflow: "hidden", transform: [{ rotate: r.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] }]}>
        <LinearGradient colors={colors ?? [C.gold, C.flame, C.hot, C.flame, C.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <View style={{ padding: 4, borderRadius: 52, backgroundColor: C.bg }}>{children}</View>
    </View>
  );
}

function Stat({ label, value, divider, streak }: { label: string; value: string; divider?: boolean; streak?: boolean }) {
  return (
    <View style={[{ flex: 1, alignItems: "center", gap: 4 }, divider && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: LINE.strong }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
        {streak ? <Flame size={15} color={C.flame} fill={C.flame} /> : null}
        <Text style={[s.statValue, streak && { color: C.flame }]}>{value}</Text>
      </View>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function GridTile({ w, onPress, label, children }: { w: number; onPress: () => void; label: string; children: ReactNode }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => ({ width: w, height: w * (4 / 3), overflow: "hidden", opacity: pressed ? 0.8 : 1 })}>
      {children}
    </Pressable>
  );
}

const s = StyleSheet.create({
  coverActions: { position: "absolute", right: 16, flexDirection: "row", gap: 8 },
  coverBtn: { backgroundColor: "rgba(9,9,9,0.32)" },
  identity: { alignItems: "center", marginTop: -58, paddingHorizontal: GUTTER },
  ringWrap: { width: 106, height: 106, borderRadius: 53, alignItems: "center", justifyContent: "center", shadowColor: C.flame, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  nameRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14, maxWidth: "100%" },
  name: { ...TYPE.title, fontSize: 34, lineHeight: 38, flexShrink: 1 },
  handle: { marginTop: 2, fontSize: 14, fontWeight: "600", color: TEXT.tertiary },
  bio: { maxWidth: 320, marginTop: 12, textAlign: "center", fontSize: 15, lineHeight: 21, color: TEXT.secondary },
  goal: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 14, paddingHorizontal: 12, height: 32, borderRadius: RADIUS.pill, backgroundColor: TINT.flame },
  goalText: { color: TEXT.primary, fontSize: 13, fontWeight: "600" },
  stats: { flexDirection: "row", alignSelf: "stretch", marginTop: 24 },
  statValue: { ...TYPE.metric, fontSize: 24, lineHeight: 28 },
  statLabel: { ...TYPE.eyebrow, fontSize: 11, letterSpacing: 1.3 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4 },
  groupLabel: { marginTop: 32, marginBottom: 12, paddingHorizontal: 4 },
  prs: { flexDirection: "row", marginTop: 14 },
  pr: { flex: 1, paddingHorizontal: 4, gap: 2 },
  prDivider: { paddingLeft: 16, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: LINE.strong },
  prValue: { fontFamily: F.display, fontSize: 40, lineHeight: 46 },
  prDelta: { fontSize: 12, fontWeight: "600", color: TEXT.tertiary },
  tabs: { flexDirection: "row", backgroundColor: "rgba(9,9,9,0.97)", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  tab: { flex: 1, height: 48, alignItems: "center", justifyContent: "center" },
  tabText: { fontFamily: F.label, fontSize: 15, letterSpacing: 1.5, textTransform: "uppercase", color: C.ash },
  tabLine: { position: "absolute", bottom: 0, width: "40%", height: 2.5, borderRadius: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 2 },
  newTag: { position: "absolute", top: 7, left: 7, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  newText: { fontFamily: F.labelHeavy, fontSize: 11, letterSpacing: 1.1, textTransform: "uppercase", color: "#1c0f00" },
  views: { position: "absolute", left: 7, bottom: 7, flexDirection: "row", alignItems: "center", gap: 4 },
  viewsText: { fontFamily: F.label, fontSize: 12, color: C.white, textShadowColor: "rgba(0,0,0,0.9)", textShadowRadius: 6 },
  pinned: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 16, marginBottom: 20, padding: 12, borderRadius: RADIUS.lg, backgroundColor: SURFACE.raised },
  pinnedArt: { width: 72, height: 72, borderRadius: 12, overflow: "hidden" },
  pinnedLabel: { fontFamily: F.labelHeavy, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: C.gold },
  pinnedTitle: { marginTop: 3, fontSize: 15, fontWeight: "700", color: C.white },
  creatorIdentity: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, backgroundColor: TINT.flame },
  creatorIdentityText: { fontFamily: F.labelHeavy, fontSize: 11, letterSpacing: 1.4, color: C.flame },
  creatorStrip: { marginHorizontal: 16, marginBottom: 20, padding: 14, borderRadius: RADIUS.lg, backgroundColor: SURFACE.raised },
  creatorStripKicker: { fontFamily: F.labelHeavy, fontSize: 11, letterSpacing: 1.3, textTransform: "uppercase", color: C.flame },
  creatorStatValue: { fontFamily: F.display, fontSize: 20, color: C.white },
  creatorStatLabel: { fontFamily: F.label, fontSize: 10.5, letterSpacing: 1, textTransform: "uppercase", color: C.ash },
  creatorLink: { paddingHorizontal: 10, height: 26, borderRadius: 13, justifyContent: "center", backgroundColor: SURFACE.fill },
  creatorLinkText: { fontSize: 12, color: C.white },
  coachSpecialty: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, backgroundColor: TINT.gold },
  coachSpecialtyText: { fontFamily: F.labelHeavy, fontSize: 11, letterSpacing: 1.3, textTransform: "uppercase", color: C.gold },
  coachVerify: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(168,162,154,0.6)" },
  coachVerifyText: { fontFamily: F.labelHeavy, fontSize: 10.5, letterSpacing: 0.9, color: C.ash },
  coachStrip: { marginHorizontal: 16, marginBottom: 20, padding: 14, gap: 8, borderRadius: RADIUS.lg, backgroundColor: SURFACE.raised },
  coachKicker: { fontFamily: F.labelHeavy, fontSize: 11, letterSpacing: 1.3, textTransform: "uppercase", color: C.gold },
  coachLine: { fontSize: 13.5, fontWeight: "600", color: C.white },
  coachInquiry: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, height: 44, borderRadius: 12, backgroundColor: C.gold },
  coachInquiryText: { fontFamily: F.labelHeavy, fontSize: 13.5, letterSpacing: 1, textTransform: "uppercase", color: "#1c1407" },
  coachQuote: { fontSize: 13, lineHeight: 18, color: TEXT.secondary },
  coachMeta: { fontSize: 12, color: C.ash },
  founderRow: { backgroundColor: "rgba(255,209,102,0.06)" },
  founderFrame: { marginHorizontal: 16, marginBottom: 20, padding: 1, borderRadius: RADIUS.lg },
  founderCard: { padding: 14, gap: 6, borderRadius: RADIUS.lg - 1, backgroundColor: "#121110" },
  founderKicker: { fontFamily: F.labelHeavy, fontSize: 11.5, letterSpacing: 1.3, textTransform: "uppercase", color: C.gold },
  founderText: { fontSize: 13, lineHeight: 18, color: TEXT.secondary },
  founderNote: { fontSize: 11.5, color: C.ash },
  pinnedNote: { marginTop: 2, fontSize: 11.5, color: C.ash },
  emptyWrap: { alignItems: "center", gap: 8, paddingHorizontal: 32, paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: TEXT.primary },
  empty: { textAlign: "center", color: C.ash, fontSize: 14, lineHeight: 20 },
});
