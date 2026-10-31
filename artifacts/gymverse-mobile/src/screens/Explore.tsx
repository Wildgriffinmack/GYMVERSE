import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowUpRight, Search, Trophy, X } from "lucide-react-native";
import type { CategoryTile, FeedTab } from "../data";
import { CATEGORIES, TRENDS } from "../data";
import { TONES, ToneFill } from "../components/Tone";
import { IconMark, Label, ListGroup, ListRow, PageHeader, tap } from "../components/ui";
import { C, F, NAV_GAP, NAV_HEIGHT, RADIUS, SURFACE, TEXT } from "../theme";

const GAP = 10;
const ROW = 120;
const PAD = 16;
const byName = (name: string) => CATEGORIES.find((c) => c.name === name)!;
/** Largest display size at which the longest word still fits on one line (Anton ≈ 0.5em per capital). */
const fitTitle = (name: string, inner: number, max: number) => Math.min(max, Math.floor(inner / (Math.max(...name.split(" ").map((w) => w.length)) * 0.5)));

export function ExploreScreen({ onOpenFeed, onChallenges }: { onOpenFeed: (tab: FeedTab, label: string) => void; onChallenges?: () => void }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const results = useMemo(() => (q ? CATEGORIES.filter((c) => `${c.name} ${c.desc}`.toLowerCase().includes(q)) : CATEGORIES), [q]);
  const open = (c: CategoryTile) => onOpenFeed(c.tab, c.name);
  const full = width - PAD * 2;
  const half = (full - GAP) / 2;
  const tile = (name: string, size: CategoryTile["size"], height: number) => <Tile key={name} cat={byName(name)} size={size} height={height} width={size === "hero" || size === "wide" ? full : half} onPress={open} />;
  const tall = ROW * 2 + GAP;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: insets.bottom + NAV_GAP + NAV_HEIGHT + 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <PageHeader top={insets.top} kicker="Find your lane" title="Explore" />
      <View style={s.search}>
        <Search size={18} color={C.ash} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search lanes, lifts, goals" placeholderTextColor="rgba(255,247,237,0.4)" style={s.searchInput} accessibilityLabel="Search categories" returnKeyType="search" />
        {query ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={9} onPress={() => setQuery("")} style={s.clear}><X size={14} color={C.white} /></Pressable> : null}
      </View>

      {!q ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: PAD, gap: 8, paddingTop: 14 }}>
          {TRENDS.map((t) => (
            <Pressable key={t.tag} accessibilityRole="button" onPress={() => { tap(); onOpenFeed(t.tab, t.tag); }} style={({ pressed }) => [s.trend, pressed && { backgroundColor: SURFACE.fillPressed }]}>
              <Text style={s.trendTag}><Text style={{ color: C.flame }}>#</Text>{t.tag.slice(1)}</Text>
              <Text style={s.trendCount}>{t.count}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {!q && onChallenges ? (
        <ListGroup style={{ marginHorizontal: PAD, marginTop: 16 }}>
          <ListRow icon={<IconMark icon={Trophy} tone="flame" size={40} />} title="Challenges" subtitle="Join a challenge. Build the habit together." accessibilityLabel="Challenges, join a challenge" onPress={onChallenges} />
        </ListGroup>
      ) : null}

      <View style={s.sectionLabel}>
        <Label>{q ? `${results.length} ${results.length === 1 ? "lane" : "lanes"} found` : "All fitness. All the time."}</Label>
        {!q ? <Label accent>10 lanes</Label> : null}
      </View>

      {q ? (
        results.length ? (
          <View style={s.grid}>
            {results.map((c) => <View key={c.name} style={{ width: half }}><Tile cat={c} size="base" height={ROW} width={half} onPress={open} /></View>)}
          </View>
        ) : (
          <Text style={s.emptyNote}>No lanes match “{query}”. Try “strength” or “beginner”.</Text>
        )
      ) : (
        <View style={{ paddingHorizontal: PAD, gap: GAP }}>
          {tile("Gym Motivation", "hero", tall)}
          <View style={s.row}>
            <View style={{ flex: 1 }}>{tile("Beginner Workouts", "tall", tall)}</View>
            <View style={{ flex: 1, gap: GAP }}>{tile("Transformations", "base", ROW)}{tile("Strength Training", "base", ROW)}</View>
          </View>
          {tile("Bodybuilding", "wide", ROW)}
          <View style={s.row}>
            <View style={{ flex: 1, gap: GAP }}>{tile("Weight Loss", "base", ROW)}{tile("Powerlifting", "base", ROW)}</View>
            <View style={{ flex: 1 }}>{tile("Nutrition", "tall", tall)}</View>
          </View>
          <View style={s.row}>
            <View style={{ flex: 1 }}>{tile("Calisthenics", "base", ROW)}</View>
            <View style={{ flex: 1 }}>{tile("Mental Discipline", "base", ROW)}</View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function Tile({ cat, size, height, width, onPress }: { cat: CategoryTile; size: CategoryTile["size"]; height: number; width: number; onPress: (c: CategoryTile) => void }) {
  const { name, desc, count, icon: Icon, tone } = cat;
  const hero = size === "hero";
  const pad = hero ? 20 : 14;
  const showDesc = size !== "base";
  const mark = hero ? 230 : size === "wide" ? 150 : 124;
  const fontSize = fitTitle(name, width - pad * 2, hero ? 46 : 21);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${name}, ${count}`} onPress={() => { tap(); onPress(cat); }} style={({ pressed }) => [s.tile, { height, borderRadius: hero ? RADIUS.xl - 4 : RADIUS.lg - 2, padding: pad, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
      <ToneFill tone={TONES[tone]} />
      <View style={[s.mark, { width: mark, height: mark, top: hero ? -30 : -14, right: hero ? -40 : size === "wide" ? 10 : -22 }]}>
        <Icon size={mark} color="rgba(255,255,255,0.2)" strokeWidth={1.4} />
      </View>
      <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]} locations={[0.3, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      {hero || size === "tall" ? <View style={[s.icon, { top: pad, left: pad }]}><Icon size={18} color="#fff" /></View> : null}
      <ArrowUpRight size={18} color="rgba(255,255,255,0.75)" style={{ position: "absolute", top: hero ? 20 : 14, right: 14 }} />
      <Text style={[s.name, { fontSize, lineHeight: Math.round(fontSize * 1.12) }]}>{name}</Text>
      {showDesc ? <Text style={s.desc}>{desc}</Text> : null}
      <View style={s.count}><View style={s.countDot} /><Text style={s.countText}>{count}</Text></View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  search: { flexDirection: "row", alignItems: "center", gap: 10, height: 48, marginHorizontal: PAD, paddingLeft: 16, paddingRight: 12, borderRadius: RADIUS.md, backgroundColor: SURFACE.fill },
  searchInput: { flex: 1, height: "100%", fontSize: 15, color: C.white },
  clear: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,247,237,0.12)" },
  trend: { flexDirection: "row", alignItems: "center", gap: 7, height: 38, paddingHorizontal: 14, borderRadius: 19, backgroundColor: SURFACE.fill },
  trendTag: { color: C.white, fontSize: 14, fontWeight: "700" },
  trendCount: { fontFamily: F.label, fontSize: 12, letterSpacing: 0.7, color: TEXT.tertiary },
  sectionLabel: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 28, paddingBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: GAP, paddingHorizontal: PAD },
  row: { flexDirection: "row", gap: GAP },
  tile: { overflow: "hidden", justifyContent: "flex-end" },
  mark: { position: "absolute", transform: [{ rotate: "-14deg" }] },
  icon: { position: "absolute", width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(9,9,9,0.26)" },
  name: { fontFamily: F.display, color: "#fff", textTransform: "uppercase", textShadowColor: "rgba(0,0,0,0.35)", textShadowRadius: 12 },
  desc: { marginTop: 6, fontSize: 13, lineHeight: 18, color: "rgba(255,247,237,0.88)" },
  count: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  countDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  countText: { fontFamily: F.label, fontSize: 12, letterSpacing: 1.7, textTransform: "uppercase", color: "rgba(255,247,237,0.92)" },
  emptyNote: { padding: 32, textAlign: "center", color: C.ash, fontSize: 14, lineHeight: 20 },
});
