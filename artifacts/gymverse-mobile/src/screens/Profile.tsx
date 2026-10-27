import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Text as SvgText } from "react-native-svg";
import { ArrowRight, BarChart3, Bookmark, Briefcase, ChevronRight, Clapperboard, ClipboardList, Crown, Flame, Grid3x3, MessageSquare, Palette, Pin, Play, Settings, Share2, Shield, ShieldAlert, Target, Video } from "lucide-react-native";
import type { BadgeTone, Post, PostArtData } from "../data";
import { CHALLENGES, ME, PERSONAL_RECORDS, PROFILE_EXTRA_TILES } from "../data";
import { PostArt } from "../components/PostArt";
import { PostThumb } from "../home/HomePost";
import { Glows } from "../components/Tone";
import { Avatar, Badge, GradText, IconBtn, Label, ProgressRing, Verified, tap, thump } from "../components/ui";
import { PINNED_ART } from "../pro/ProfileStudio";
import { FounderBadge } from "../founders/FounderBadge";
import { formatCount } from "../utils";
import { C, DIAG, F, GRAD, GRAD_GOLD, GRAD_PR, NAV_GAP, NAV_HEIGHT } from "../theme";

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
  const coverH = 196 + insets.top;
  const tileW = (width - 4) / 3;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: insets.bottom + NAV_GAP + NAV_HEIGHT + 24 }} showsVerticalScrollIndicator={false} stickyHeaderIndices={[4]}>
      <View style={{ height: coverH, overflow: "hidden" }}>
        <LinearGradient colors={look?.banner ?? creator?.banner ?? coach?.banner ?? ["#FF5A1F", "#8D1B10", "#1A0805"]} locations={[0, 0.58, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
        <Glows glows={[{ color: C.gold, cx: "88%", cy: "0%", rx: "70%", ry: "90%", opacity: 0.55 }, { color: C.hot, cx: "0%", cy: "100%", rx: "90%", ry: "100%", opacity: 0.6 }]} />
        <Svg style={{ position: "absolute", left: -6, bottom: -18 }} width={width + 40} height={170}>
          <SvgText x="0" y="150" fontFamily={F.display} fontSize="160" fill="none" stroke="rgba(255,247,237,0.28)" strokeWidth="1.5">{ME.name.toUpperCase()}</SvgText>
        </Svg>
        <LinearGradient colors={["rgba(9,9,9,0)", C.bg]} locations={[0.35, 1]} style={StyleSheet.absoluteFill} />
        <View style={[s.coverActions, { top: insets.top + 12 }]}>
          <IconBtn label="Share profile" onPress={() => onToast("Profile link copied.")} style={{ backgroundColor: "rgba(9,9,9,0.35)" }}><Share2 size={18} color={C.white} /></IconBtn>
          <IconBtn label="Settings" onPress={() => onToast("Settings aren’t part of this demo.")} onLongPress={onDevTools} style={{ backgroundColor: "rgba(9,9,9,0.35)" }}><Settings size={18} color={C.white} /></IconBtn>
        </View>
      </View>

      <View style={s.identity}>
        <GlowRing colors={look?.ring}>
          <Avatar username={ME.username} name={ME.name} size={96} />
        </GlowRing>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14 }}>
          <Text style={s.name}>{ME.name}</Text>
          {/* The generic check mark is hidden under the coach look so it can't read as coaching certification. */}
          {coach ? null : <Verified size={22} />}
          {/* One primary membership badge at a time. */}
          {look?.badge ? <Badge tone={look.badge.tone}>{look.badge.label}</Badge> : creator?.badge ? <Badge tone="flame">{creator.badge}</Badge> : coach?.badge ? <Badge tone="ash">{coach.badge}</Badge> : null}
        </View>
        <Text style={s.handle}>@{ME.username}</Text>
        {creator?.identityLabel ? (
          <View style={s.creatorIdentity}><Clapperboard size={11} color={C.flame} /><Text style={s.creatorIdentityText}>{creator.identityLabel}</Text></View>
        ) : null}
        {coach ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 6 }}>
            <View style={s.coachSpecialty}><Briefcase size={11} color={C.gold} /><Text style={s.coachSpecialtyText}>{coach.specialty}</Text></View>
            {coach.verificationPreview ? (
              <View style={s.coachVerify} accessibilityLabel={coach.verificationPreview}><ShieldAlert size={11} color={C.ash} /><Text style={s.coachVerifyText}>{coach.verificationPreview}</Text></View>
            ) : null}
          </View>
        ) : null}
        {founder ? <View style={{ marginTop: 8 }}><FounderBadge /></View> : null}
        <Text style={s.bio}>{ME.bio}</Text>
        <View style={s.goal}><Target size={14} color={C.flame} /><Text style={{ color: C.white, fontSize: 13, fontWeight: "600" }}>Goal · {ME.goal}</Text></View>
        <View style={s.stats}>
          <Stat label="Followers" value={ME.followers} />
          <Stat label="Following" value={ME.following} divider />
          <Stat label="Posts" value={String(ME.basePosts + created)} divider />
          <Stat label="Day streak" value={String(ME.streak)} divider streak />
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 28 }}>
        <View style={s.rowBetween}><Label>Personal records</Label><Label accent>LB</Label></View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {PERSONAL_RECORDS.map((pr) => (
            <LinearGradient key={pr.lift} colors={["rgba(255,209,102,0.75)", "rgba(255,90,31,0.3)", "rgba(255,247,237,0.04)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.prBorder}>
              <View style={s.pr}>
                <Glows glows={[{ color: C.gold, cx: "100%", cy: "0%", rx: "60%", ry: "50%", opacity: 0.22 }]} />
                <Label>{pr.lift}</Label>
                <GradText vertical colors={GRAD_PR} style={s.prValue}>{pr.value}</GradText>
                <Text style={s.prDelta}>{pr.delta}</Text>
              </View>
            </LinearGradient>
          ))}
        </View>

        <Pressable accessibilityRole="button" onPress={() => { tap(); onChallenges(); }} style={({ pressed }) => [{ marginTop: 14, borderRadius: 20, overflow: "hidden", transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
          <LinearGradient colors={["rgba(255,90,31,0.18)", "rgba(255,90,31,0.02)"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={s.challenge}>
            <ProgressRing value={pct} size={46} stroke={4.5}><Flame size={16} color={C.flame} fill={C.flame} /></ProgressRing>
            <View style={{ flex: 1, gap: 3 }}>
              <Label accent>Current challenge</Label>
              <Text style={{ color: C.white, fontSize: 15, fontWeight: "700" }}>30-Day Consistency Challenge</Text>
              <Text style={{ color: C.ash, fontSize: 12.5 }}>Day {ME.challengeDay} of {challenge.totalDays}</Text>
            </View>
            <ChevronRight size={20} color={C.ash} />
          </LinearGradient>
        </Pressable>

        <Pressable accessibilityRole="button" accessibilityLabel="View Progress Timeline" onPress={() => { thump(); onTimeline(); }} style={({ pressed }) => [s.ctaShadow, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
          <LinearGradient colors={GRAD} start={DIAG.start} end={DIAG.end} style={s.timelineCta}>
            <View style={s.ctaIcon}><BarChart3 size={22} color="#fff" /></View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={s.ctaTitle}>View Progress Timeline</Text>
              <Text style={{ color: "rgba(255,255,255,0.88)", fontSize: 12.5 }}>6 months · 124 workouts · +45 lb</Text>
            </View>
            <ArrowRight size={20} color="#fff" strokeWidth={2.6} />
          </LinearGradient>
        </Pressable>

        {onPremium ? (
          <Pressable accessibilityRole="button" accessibilityLabel="GYMX Premium, memberships coming soon" onPress={() => { tap(); onPremium(); }} style={({ pressed }) => [{ marginTop: 12, borderRadius: 20, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
            <LinearGradient colors={["rgba(255,209,102,0.7)", "rgba(255,90,31,0.35)", "rgba(255,247,237,0.06)"]} start={DIAG.start} end={DIAG.end} style={s.premiumBorder}>
              <View style={s.premiumRow}>
                <LinearGradient colors={GRAD_GOLD} start={DIAG.start} end={DIAG.end} style={s.premiumIcon}><Crown size={20} color="#1c0f00" /></LinearGradient>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={s.premiumTitle}>GYMX Premium</Text>
                  <Text style={s.premiumSub}>Memberships coming soon</Text>
                </View>
                <ChevronRight size={20} color={C.gold} />
              </View>
            </LinearGradient>
          </Pressable>
        ) : null}

        {onStudio ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Profile Studio, GYMX Pro preview, coming soon" onPress={() => { tap(); onStudio(); }} style={({ pressed }) => [s.studioRow, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
            <View style={s.studioIcon}><Palette size={18} color={C.gold} /></View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.studioTitle}>Profile Studio</Text>
              <Text style={s.studioSub}>{look ? "Premium look on · this session" : "Banners, glow ring, PRO badge · Coming Soon"}</Text>
            </View>
            <View style={s.proChip}><Text style={s.proChipText}>PRO</Text></View>
            <ChevronRight size={18} color={C.ash} />
          </Pressable>
        ) : null}

        {onCreatorStudio ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Creator Studio, Creator Pro tools preview, coming soon" onPress={() => { tap(); onCreatorStudio(); }} style={({ pressed }) => [s.studioRow, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
            <View style={[s.studioIcon, { backgroundColor: "rgba(255,90,31,0.14)" }]}><Video size={18} color={C.flame} /></View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.studioTitle}>Creator Studio</Text>
              <Text style={s.studioSub}>{creator ? "Creator look on · this session" : "Creator Pro tools preview · Coming Soon"}</Text>
            </View>
            <View style={[s.proChip, { backgroundColor: C.flame }]}><Text style={[s.proChipText, { color: "#fff" }]}>CREATOR</Text></View>
            <ChevronRight size={18} color={C.ash} />
          </Pressable>
        ) : null}

        {onCoachCenter ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Coach Command Center, Coach Pro tools preview, coming soon" onPress={() => { tap(); onCoachCenter(); }} style={({ pressed }) => [s.studioRow, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
            <View style={s.studioIcon}><ClipboardList size={18} color={C.gold} /></View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.studioTitle}>Coach Command Center</Text>
              <Text style={s.studioSub}>{coach ? "Coach look on · this session" : "Leads, bookings, services · Coming Soon"}</Text>
            </View>
            <View style={[s.proChip, { backgroundColor: C.white }]}><Text style={[s.proChipText, { color: "#1c1407" }]}>COACH</Text></View>
            <ChevronRight size={18} color={C.ash} />
          </Pressable>
        ) : null}

        {onFounders ? (
          <Pressable accessibilityRole="button" accessibilityLabel="GYMX Founders, recognition concept" onPress={() => { tap(); onFounders(); }} style={({ pressed }) => [s.studioRow, founder && s.founderRow, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
            <View style={[s.studioIcon, { backgroundColor: "#1a1208" }]}><Shield size={18} color={C.gold} /></View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.studioTitle}>GYMX Founders</Text>
              <Text style={s.studioSub}>{founder ? "Founder recognition preview on · this session" : "Recognition concept · not a membership"}</Text>
            </View>
            <ChevronRight size={18} color={C.ash} />
          </Pressable>
        ) : null}
      </View>

      <View style={{ paddingTop: 26 }}>
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
              <Pressable accessibilityRole="button" accessibilityLabel="Coaching inquiry button preview" onPress={() => { tap(); onToast("Preview only — inquiries can't be sent in this demo."); }} style={s.coachInquiry}>
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
        <Text style={s.empty}>Tap the bookmark on any post to save it here.</Text>
      )}
    </ScrollView>
  );
}

function GlowRing({ children, colors }: { children: ReactNode; colors?: [string, string, string, string, string] }) {
  const r = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(r, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [r]);
  return (
    <View style={s.ringWrap}>
      <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 60, overflow: "hidden", transform: [{ rotate: r.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] }]}>
        <LinearGradient colors={colors ?? [C.gold, C.flame, C.hot, C.flame, C.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <View style={{ padding: 4, borderRadius: 52, backgroundColor: C.bg }}>{children}</View>
      <LinearGradient colors={GRAD} start={DIAG.start} end={DIAG.end} style={s.streakBadge}>
        <Flame size={13} color="#fff" fill="#fff" />
        <Text style={{ fontFamily: F.labelHeavy, fontSize: 15, color: "#fff" }}>{ME.streak}</Text>
      </LinearGradient>
    </View>
  );
}

function Stat({ label, value, divider, streak }: { label: string; value: string; divider?: boolean; streak?: boolean }) {
  return (
    <View style={[{ flex: 1, alignItems: "center", gap: 5 }, divider && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: "rgba(255,247,237,0.14)" }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
        {streak ? <Flame size={16} color={C.flame} fill={C.flame} /> : null}
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
  identity: { alignItems: "center", marginTop: -64, paddingHorizontal: 20 },
  ringWrap: { width: 112, height: 112, borderRadius: 56, alignItems: "center", justifyContent: "center", shadowColor: C.flame, shadowOpacity: 0.65, shadowRadius: 20, shadowOffset: { width: 0, height: 0 }, elevation: 12 },
  streakBadge: { position: "absolute", right: -10, bottom: 2, flexDirection: "row", alignItems: "center", gap: 3, height: 28, paddingLeft: 8, paddingRight: 10, borderRadius: 14, borderWidth: 3, borderColor: C.bg },
  name: { fontFamily: F.display, fontSize: 40, lineHeight: 44, textTransform: "uppercase", color: C.white },
  handle: { marginTop: 2, fontSize: 14, fontWeight: "600", color: C.ash },
  bio: { maxWidth: 300, marginTop: 10, textAlign: "center", fontSize: 15, lineHeight: 21, color: "rgba(255,247,237,0.9)" },
  goal: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 12, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: "rgba(255,90,31,0.1)", borderWidth: 1, borderColor: "rgba(255,90,31,0.3)" },
  stats: { flexDirection: "row", alignSelf: "stretch", marginTop: 22 },
  statValue: { fontFamily: F.display, fontSize: 26, color: C.white },
  statLabel: { fontFamily: F.label, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: C.ash },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  prBorder: { flex: 1, borderRadius: 20, padding: 1 },
  pr: { borderRadius: 19, paddingHorizontal: 12, paddingVertical: 13, gap: 6, overflow: "hidden", backgroundColor: "#141414" },
  prValue: { fontFamily: F.display, fontSize: 38, lineHeight: 42 },
  prDelta: { fontSize: 11, fontWeight: "600", color: C.ash },
  challenge: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 12, paddingHorizontal: 14 },
  ctaShadow: { marginTop: 12, borderRadius: 22, shadowColor: C.hot, shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  timelineCta: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16, paddingLeft: 14, paddingRight: 18, borderRadius: 22 },
  ctaIcon: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.2)" },
  ctaTitle: { fontFamily: F.labelHeavy, fontSize: 19, letterSpacing: 1, textTransform: "uppercase", color: "#fff" },
  tabs: { flexDirection: "row", backgroundColor: "rgba(9,9,9,0.97)", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  tab: { flex: 1, height: 48, alignItems: "center", justifyContent: "center" },
  tabText: { fontFamily: F.label, fontSize: 15, letterSpacing: 1.5, textTransform: "uppercase", color: C.ash },
  tabLine: { position: "absolute", bottom: 0, width: "40%", height: 2.5, borderRadius: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 2 },
  newTag: { position: "absolute", top: 7, left: 7, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  newText: { fontFamily: F.labelHeavy, fontSize: 11, letterSpacing: 1.1, textTransform: "uppercase", color: "#1c0f00" },
  views: { position: "absolute", left: 7, bottom: 7, flexDirection: "row", alignItems: "center", gap: 4 },
  viewsText: { fontFamily: F.label, fontSize: 12, color: C.white, textShadowColor: "rgba(0,0,0,0.9)", textShadowRadius: 6 },
  premiumBorder: { borderRadius: 20, padding: 1.2 },
  premiumRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 13, paddingLeft: 14, paddingRight: 16, borderRadius: 19, backgroundColor: "#141414" },
  premiumIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  premiumTitle: { fontFamily: F.labelHeavy, fontSize: 17, letterSpacing: 1, textTransform: "uppercase", color: C.white },
  premiumSub: { fontFamily: F.label, fontSize: 12, letterSpacing: 1.6, textTransform: "uppercase", color: C.gold },
  studioRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 18, backgroundColor: "rgba(255,247,237,0.04)" },
  studioIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,209,102,0.12)" },
  studioTitle: { fontFamily: F.labelHeavy, fontSize: 16, letterSpacing: 0.8, textTransform: "uppercase", color: C.white },
  studioSub: { fontSize: 12, color: C.ash },
  proChip: { paddingHorizontal: 7, height: 20, borderRadius: 6, justifyContent: "center", backgroundColor: C.gold },
  proChipText: { fontFamily: F.labelHeavy, fontSize: 11, letterSpacing: 1.2, color: "#1c0f00" },
  pinned: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 16, marginBottom: 20, padding: 10, borderRadius: 18, backgroundColor: "rgba(255,209,102,0.07)", borderWidth: 1, borderColor: "rgba(255,209,102,0.3)" },
  pinnedArt: { width: 76, height: 76, borderRadius: 12, overflow: "hidden" },
  pinnedLabel: { fontFamily: F.labelHeavy, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: C.gold },
  pinnedTitle: { marginTop: 3, fontSize: 15, fontWeight: "700", color: C.white },
  creatorIdentity: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, backgroundColor: "rgba(255,90,31,0.12)" },
  creatorIdentityText: { fontFamily: F.labelHeavy, fontSize: 11, letterSpacing: 1.4, color: C.flame },
  creatorStrip: { marginHorizontal: 16, marginBottom: 20, padding: 12, borderRadius: 18, backgroundColor: "rgba(255,90,31,0.07)", borderWidth: 1, borderColor: "rgba(255,90,31,0.3)" },
  creatorStripKicker: { fontFamily: F.labelHeavy, fontSize: 11, letterSpacing: 1.3, textTransform: "uppercase", color: C.flame },
  creatorStatValue: { fontFamily: F.display, fontSize: 20, color: C.white },
  creatorStatLabel: { fontFamily: F.label, fontSize: 10.5, letterSpacing: 1, textTransform: "uppercase", color: C.ash },
  creatorLink: { paddingHorizontal: 9, height: 24, borderRadius: 12, justifyContent: "center", backgroundColor: "rgba(255,247,237,0.07)" },
  creatorLinkText: { fontSize: 12, color: C.white },
  coachSpecialty: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, backgroundColor: "rgba(255,209,102,0.12)" },
  coachSpecialtyText: { fontFamily: F.labelHeavy, fontSize: 11, letterSpacing: 1.3, textTransform: "uppercase", color: C.gold },
  coachVerify: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(163,163,163,0.6)" },
  coachVerifyText: { fontFamily: F.labelHeavy, fontSize: 10.5, letterSpacing: 0.9, color: C.ash },
  coachStrip: { marginHorizontal: 16, marginBottom: 20, padding: 12, gap: 8, borderRadius: 18, backgroundColor: "rgba(255,209,102,0.06)", borderWidth: 1, borderColor: "rgba(255,209,102,0.35)" },
  coachKicker: { fontFamily: F.labelHeavy, fontSize: 11, letterSpacing: 1.3, textTransform: "uppercase", color: C.gold },
  coachLine: { fontSize: 13.5, fontWeight: "600", color: C.white },
  coachInquiry: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, height: 40, borderRadius: 12, backgroundColor: C.gold },
  coachInquiryText: { fontFamily: F.labelHeavy, fontSize: 13.5, letterSpacing: 1, textTransform: "uppercase", color: "#1c1407" },
  coachQuote: { fontSize: 13, lineHeight: 18, color: "rgba(255,247,237,0.82)" },
  coachMeta: { fontSize: 12, color: C.ash },
  founderRow: { borderWidth: 1, borderColor: "rgba(255,209,102,0.45)" },
  founderFrame: { marginHorizontal: 16, marginBottom: 20, padding: 1.5, borderRadius: 19 },
  founderCard: { padding: 13, gap: 6, borderRadius: 18, backgroundColor: "#121110" },
  founderKicker: { fontFamily: F.labelHeavy, fontSize: 11.5, letterSpacing: 1.3, textTransform: "uppercase", color: C.gold },
  founderText: { fontSize: 13, lineHeight: 18, color: "rgba(255,247,237,0.85)" },
  founderNote: { fontSize: 11.5, color: C.ash },
  pinnedNote: { marginTop: 2, fontSize: 11.5, color: C.ash },
  empty: { padding: 32, textAlign: "center", color: C.ash, fontSize: 14 },
});
