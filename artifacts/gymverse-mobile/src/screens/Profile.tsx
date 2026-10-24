import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Text as SvgText } from "react-native-svg";
import { ArrowRight, BarChart3, Bookmark, ChevronRight, Flame, Grid3x3, Play, Settings, Share2, Target } from "lucide-react-native";
import type { Post } from "../data";
import { CHALLENGES, ME, PERSONAL_RECORDS, PROFILE_EXTRA_TILES } from "../data";
import { PostArt } from "../components/PostArt";
import { Glows } from "../components/Tone";
import { Avatar, GradText, IconBtn, Label, ProgressRing, Verified, tap, thump } from "../components/ui";
import { formatCount } from "../utils";
import { C, DIAG, F, GRAD, GRAD_GOLD, GRAD_PR, NAV_GAP, NAV_HEIGHT } from "../theme";

type Props = {
  myPosts: Post[];
  savedPosts: Post[];
  onOpenPost: (id: string) => void;
  onTimeline: () => void;
  onChallenges: () => void;
  onToast: (m: string) => void;
};

export function ProfileScreen({ myPosts, savedPosts, onOpenPost, onTimeline, onChallenges, onToast }: Props) {
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
        <LinearGradient colors={["#FF5A1F", "#8D1B10", "#1A0805"]} locations={[0, 0.58, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
        <Glows glows={[{ color: C.gold, cx: "88%", cy: "0%", rx: "70%", ry: "90%", opacity: 0.55 }, { color: C.hot, cx: "0%", cy: "100%", rx: "90%", ry: "100%", opacity: 0.6 }]} />
        <Svg style={{ position: "absolute", left: -6, bottom: -18 }} width={width + 40} height={170}>
          <SvgText x="0" y="150" fontFamily={F.display} fontSize="160" fill="none" stroke="rgba(255,247,237,0.28)" strokeWidth="1.5">{ME.name.toUpperCase()}</SvgText>
        </Svg>
        <LinearGradient colors={["rgba(9,9,9,0)", C.bg]} locations={[0.35, 1]} style={StyleSheet.absoluteFill} />
        <View style={[s.coverActions, { top: insets.top + 12 }]}>
          <IconBtn label="Share profile" onPress={() => onToast("Profile link copied.")} style={{ backgroundColor: "rgba(9,9,9,0.35)" }}><Share2 size={18} color={C.white} /></IconBtn>
          <IconBtn label="Settings" onPress={() => onToast("Settings aren’t part of this demo.")} style={{ backgroundColor: "rgba(9,9,9,0.35)" }}><Settings size={18} color={C.white} /></IconBtn>
        </View>
      </View>

      <View style={s.identity}>
        <GlowRing>
          <Avatar username={ME.username} name={ME.name} size={96} />
        </GlowRing>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14 }}>
          <Text style={s.name}>{ME.name}</Text>
          <Verified size={22} />
        </View>
        <Text style={s.handle}>@{ME.username}</Text>
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
      </View>

      <View style={{ height: 26 }} />

      <View style={s.tabs}>
        {(["posts", "saved"] as const).map((t) => {
          const on = tab === t;
          return (
            <Pressable key={t} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => { tap(); setTab(t); }} style={s.tab}>
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
              <PostArt art={p.art} variant="thumb" />
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
              <PostArt art={p.art} variant="thumb" />
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

function GlowRing({ children }: { children: ReactNode }) {
  const r = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(r, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [r]);
  return (
    <View style={s.ringWrap}>
      <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 60, overflow: "hidden", transform: [{ rotate: r.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] }]}>
        <LinearGradient colors={[C.gold, C.flame, C.hot, C.flame, C.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
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
  empty: { padding: 32, textAlign: "center", color: C.ash, fontSize: 14 },
});
