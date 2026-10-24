import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import type { LayoutChangeEvent, StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient as SvgGradient, Path, Polygon, Rect, Stop, Text as SvgText } from "react-native-svg";
import { ChevronsLeftRight } from "lucide-react-native";
import type { PostArtData } from "../data";
import { C, F, GRAD_PR } from "../theme";
import { Glows } from "./Tone";
import { GradText } from "./ui";

export type ArtVariant = "reel" | "card" | "thumb";

/** Safe areas (fractions of height) so art never collides with overlays. */
const SAFE: Record<ArtVariant, { pt: number; pb: number; fb: number }> = {
  reel: { pt: 0.2, pb: 0.44, fb: 0.4 },
  card: { pt: 0.13, pb: 0.24, fb: 0.24 },
  thumb: { pt: 0.08, pb: 0.08, fb: 0 },
};

/** Content height of each visual, in "u" units (1u = 1% of the frame's short side). */
function need(art: PostArtData): number {
  switch (art.visual) {
    case "pr": return 88;
    case "routine": return 26 + (art.lines?.length ?? 3) * 11;
    case "form": return 72;
    case "edit": return 14 + Math.ceil(art.headline.length / 13) * 13;
    case "motivation": return 8 + art.headline.split(/\s+/).length * 14;
    default: return 30;
  }
}

/**
 * Mock "media" for posts, drawn with gradients and SVG so the prototype needs no image assets.
 * Everything scales from the frame size, so one component serves full-screen reels, previews and grid thumbnails.
 */
export function PostArt({ art, variant = "card", style }: { art: PostArtData; variant?: ArtVariant; style?: StyleProp<ViewStyle> }) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!size || Math.abs(size.w - width) > 1 || Math.abs(size.h - height) > 1) setSize({ w: width, h: height });
  };
  const safe = SAFE[variant];
  let body: ReactNode = null;
  if (size) {
    const avail = size.h * (1 - safe.pt - safe.pb);
    const u = Math.min(size.w / 100, size.h / 100, avail / need(art));
    const stage: ViewStyle = { ...StyleSheet.absoluteFill, paddingTop: size.h * safe.pt, paddingBottom: size.h * safe.pb, paddingHorizontal: size.w * 0.08, alignItems: "center", justifyContent: "center", gap: 2.4 * u };
    const p = { art, u, w: size.w, h: size.h, stage, safe, thumb: variant === "thumb" };
    body =
      art.visual === "pr" ? <PrArt {...p} /> :
      art.visual === "routine" ? <RoutineArt {...p} /> :
      art.visual === "transformation" ? <TransformationArt {...p} /> :
      art.visual === "edit" ? <EditArt {...p} /> :
      art.visual === "form" ? <FormArt {...p} /> :
      <MotivationArt {...p} />;
  }
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: "#0b0b0b", overflow: "hidden" }, style]} onLayout={onLayout} pointerEvents="none">
      {body}
    </View>
  );
}

type ArtProps = { art: PostArtData; u: number; w: number; h: number; stage: ViewStyle; safe: { pt: number; pb: number; fb: number }; thumb: boolean };

const pad = (n: number) => String(n).padStart(2, "0");
const display = (size: number) => ({ fontFamily: F.display, fontSize: size, lineHeight: size * 1.08, color: C.white, textTransform: "uppercase" as const, includeFontPadding: false });
const kicker = (u: number) => ({ fontFamily: F.label, fontSize: Math.max(8, 3.8 * u), letterSpacing: 0.7 * u, textTransform: "uppercase" as const, color: "rgba(255,247,237,0.74)" });

function Spotlight({ color = C.gold, opacity = 0.28 }: { color?: string; opacity?: number }) {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <Defs>
        <SvgGradient id="beam" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={opacity} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </SvgGradient>
      </Defs>
      <Polygon points="44,0 56,0 82,100 18,100" fill="url(#beam)" />
    </Svg>
  );
}

function PrArt({ art, u, stage, thumb }: ArtProps) {
  return (
    <>
      <LinearGradient colors={["#170805", "#090909", "#1C0704"]} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
      <Glows glows={[{ color: C.flame, cx: "50%", cy: "100%", rx: "75%", ry: "45%", opacity: 0.6 }, { color: C.gold, cx: "50%", cy: "0%", rx: "60%", ry: "35%", opacity: 0.16 }]} />
      <Spotlight />
      <View style={stage}>
        {art.subline && !thumb ? <Text style={kicker(u)}>{art.subline}</Text> : null}
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <GradText vertical colors={GRAD_PR} style={{ fontFamily: F.display, fontSize: 40 * u, lineHeight: 44 * u, includeFontPadding: false }}>{art.stat}</GradText>
          {art.unit ? <Text style={{ fontFamily: F.label, fontSize: 6.5 * u, letterSpacing: 0.8 * u, color: C.gold, marginTop: 4 * u, marginLeft: 1.6 * u }}>{art.unit}</Text> : null}
        </View>
        <Barbell width={80 * u} />
        <Text style={[display(9 * u), { letterSpacing: 0.4 * u }]}>{art.headline}</Text>
      </View>
    </>
  );
}

function RoutineArt({ art, u, w, stage, thumb }: ArtProps) {
  return (
    <>
      <LinearGradient colors={["#272727", "#131313", "#0a0a0a"]} start={{ x: 0, y: 0 }} end={{ x: 0.7, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={{ position: "absolute", top: -w * 0.2, bottom: -w * 0.2, left: w * 0.35, width: w * 0.26, transform: [{ rotate: "25deg" }] }}>
        <LinearGradient colors={["transparent", "rgba(255,90,31,0.5)", "rgba(255,46,46,0.2)", "transparent"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
      </View>
      <Glows glows={[{ color: C.flame, cx: "100%", cy: "0%", rx: "60%", ry: "40%", opacity: 0.38 }]} />
      <View style={[stage, { alignItems: "stretch" }]}>
        {art.subline && !thumb ? <Text style={kicker(u)}>{art.subline}</Text> : null}
        <Text style={display(16 * u)} numberOfLines={2}>{art.headline}</Text>
        <View>
          {(art.lines ?? []).map((line, i) => (
            <View key={line.label} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 2.2 * u, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,247,237,0.18)" }}>
              <Text style={{ width: 9 * u, fontFamily: F.label, fontSize: 4.4 * u, color: C.flame }}>{pad(i + 1)}</Text>
              <Text style={{ flex: 1, fontFamily: F.label, fontSize: 5.4 * u, letterSpacing: 0.2 * u, textTransform: "uppercase", color: C.white }} numberOfLines={1}>{line.label}</Text>
              <Text style={{ fontFamily: F.labelSemi, fontSize: 5 * u, color: C.gold }}>{line.detail}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

function TransformationArt({ art, u, w, h, safe, thumb }: ArtProps) {
  const [before, after] = art.lines ?? [];
  const figW = Math.min(w * 0.47, h * 0.5);
  const half = (side: "before" | "after", label?: { label: string; detail: string }) => (
    <View style={{ flex: 1, overflow: "hidden" }}>
      {side === "before" ? (
        <>
          <LinearGradient colors={["#222", "#0b0b0b"]} style={StyleSheet.absoluteFill} />
          <Glows glows={[{ color: "#A3A3A3", cx: "50%", cy: "62%", rx: "70%", ry: "45%", opacity: 0.26 }]} />
        </>
      ) : (
        <>
          <LinearGradient colors={["#2c0d06", "#0b0b0b"]} style={StyleSheet.absoluteFill} />
          <Glows glows={[{ color: C.flame, cx: "50%", cy: "62%", rx: "75%", ry: "50%", opacity: 0.62 }]} />
        </>
      )}
      <View style={{ position: "absolute", left: 0, right: 0, bottom: h * safe.fb, alignItems: "center" }}>
        <Physique build={side} width={figW} />
      </View>
      {!thumb ? (
        <View style={{ position: "absolute", top: h * safe.pt, [side === "before" ? "left" : "right"]: w * 0.04, alignItems: side === "before" ? "flex-start" : "flex-end" }}>
          <Text style={{ fontFamily: F.label, fontSize: 3.4 * u, letterSpacing: 0.7 * u, color: side === "before" ? C.ash : C.flame, textTransform: "uppercase" }}>{label?.label ?? side}</Text>
          <Text style={display(7 * u)}>{label?.detail}</Text>
        </View>
      ) : null}
    </View>
  );
  return (
    <View style={[StyleSheet.absoluteFill, { flexDirection: "row" }]}>
      {half("before", before)}
      {half("after", after)}
      <LinearGradient colors={["transparent", "rgba(255,247,237,0.85)", "rgba(255,247,237,0.85)", "transparent"]} locations={[0, 0.18, 0.82, 1]} style={{ position: "absolute", top: 0, bottom: 0, left: w / 2 - 1, width: 2 }} />
      <View style={{ position: "absolute", left: w / 2 - 4.5 * u, top: h * 0.46 - 4.5 * u, width: 9 * u, height: 9 * u, borderRadius: 4.5 * u, backgroundColor: C.white, alignItems: "center", justifyContent: "center" }}>
        <ChevronsLeftRight size={5.5 * u} color={C.bg} />
      </View>
      <View style={{ position: "absolute", left: 0, right: 0, bottom: h * safe.pb + 3 * u, alignItems: "center", paddingHorizontal: w * 0.06 }}>
        <Text style={[display(15 * u), { textAlign: "center", textShadowColor: "rgba(0,0,0,0.85)", textShadowRadius: 5 * u, textShadowOffset: { width: 0, height: u } }]}>{art.headline}</Text>
        {art.subline && !thumb ? <Text style={[kicker(u), { textAlign: "center", marginTop: u }]} numberOfLines={1}>{art.subline}</Text> : null}
      </View>
    </View>
  );
}

function EditArt({ art, u, w, h, stage, thumb }: ArtProps) {
  const strobe = useRef(new Animated.Value(0.25)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(strobe, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(strobe, { toValue: 0.25, duration: 120, useNativeDriver: true }),
        Animated.delay(1400),
        Animated.timing(strobe, { toValue: 0.9, duration: 60, useNativeDriver: true }),
        Animated.timing(strobe, { toValue: 0.25, duration: 120, useNativeDriver: true }),
        Animated.delay(1200),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [strobe]);
  const title = display(13 * u);
  const lines = Array.from({ length: 26 }, (_, i) => i);
  return (
    <>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "#0a0505" }]} />
      <Glows glows={[{ color: C.hot, cx: "30%", cy: "40%", rx: "80%", ry: "50%", opacity: 0.6 }, { color: C.flame, cx: "80%", cy: "72%", rx: "60%", ry: "40%", opacity: 0.4 }]} />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: strobe }]}>
        <Glows glows={[{ color: C.white, cx: "50%", cy: "45%", rx: "45%", ry: "30%", opacity: 0.2 }]} />
      </Animated.View>
      <Svg style={StyleSheet.absoluteFill} width={w} height={h}>
        {lines.map((i) => {
          const x = (i / lines.length) * w * 1.4 - w * 0.2;
          return <Line key={i} x1={x} y1={0} x2={x - h * 0.18} y2={h} stroke="rgba(255,247,237,0.06)" strokeWidth={1} />;
        })}
      </Svg>
      <View style={stage}>
        {!thumb ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 1.6 * u }}>
            <View style={{ width: 2.2 * u, height: 2.2 * u, borderRadius: u, backgroundColor: C.hot }} />
            <Text style={[kicker(u), { color: "rgba(255,247,237,0.8)" }]}>REC 00:14</Text>
          </View>
        ) : null}
        <View>
          <Text style={[title, { position: "absolute", left: -0.9 * u, right: 0.9 * u, color: "rgba(255,46,46,0.85)", textAlign: "center" }]}>{art.headline}</Text>
          <Text style={[title, { position: "absolute", left: 0.9 * u, right: -0.9 * u, color: "rgba(255,90,31,0.55)", textAlign: "center" }]}>{art.headline}</Text>
          <Text style={[title, { textAlign: "center" }]}>{art.headline}</Text>
        </View>
        {art.subline && !thumb ? <Text style={kicker(u)}>{art.subline}</Text> : null}
      </View>
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: h * 0.07, backgroundColor: "#000" }} />
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: h * 0.07, backgroundColor: "#000" }} />
    </>
  );
}

function FormArt({ art, u, w, h, stage, thumb }: ArtProps) {
  const step = 8 * u;
  const cols = Math.ceil(w / step);
  const rows = Math.ceil(h / step);
  return (
    <>
      <LinearGradient colors={["#1d1d1d", "#0b0b0b"]} style={StyleSheet.absoluteFill} />
      <Glows glows={[{ color: C.flame, cx: "50%", cy: "35%", rx: "70%", ry: "50%", opacity: 0.26 }]} />
      <Svg style={StyleSheet.absoluteFill} width={w} height={h} opacity={0.6}>
        {Array.from({ length: cols }, (_, i) => <Line key={`c${i}`} x1={i * step} y1={0} x2={i * step} y2={h} stroke="rgba(255,247,237,0.06)" />)}
        {Array.from({ length: rows }, (_, i) => <Line key={`r${i}`} x1={0} y1={i * step} x2={w} y2={i * step} stroke="rgba(255,247,237,0.06)" />)}
      </Svg>
      <View style={stage}>
        {art.subline && !thumb ? <Text style={kicker(u)}>{art.subline}</Text> : null}
        <SquatDiagram width={48 * u} />
        <Text style={display(12 * u)}>{art.headline}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 1.8 * u }}>
          {(art.lines ?? []).map((line, i) => (
            <View key={line.label} style={{ flexDirection: "row", gap: 1.2 * u, paddingVertical: 1.4 * u, paddingHorizontal: 2.6 * u, borderRadius: 99, backgroundColor: "rgba(255,247,237,0.09)" }}>
              <Text style={{ fontFamily: F.label, fontSize: 4 * u, color: C.flame }}>{pad(i + 1)}</Text>
              <Text style={{ fontFamily: F.label, fontSize: 4 * u, letterSpacing: 0.4 * u, textTransform: "uppercase", color: C.white }}>{line.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

function MotivationArt({ art, u, w, h, stage, safe, thumb }: ArtProps) {
  const words = art.headline.split(/\s+/).filter(Boolean);
  const last = words.pop();
  const t = display(15 * u);
  return (
    <>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "#070707" }]} />
      <Spotlight opacity={0.3} />
      <Glows glows={[{ color: C.flame, cx: "50%", cy: "100%", rx: "60%", ry: "25%", opacity: 0.5 }]} />
      <View style={{ position: "absolute", left: 0, right: 0, bottom: h * safe.fb, alignItems: "center", opacity: 0.6 }}>
        <Physique build="after" width={Math.min(w * 0.66, h * 0.52)} />
      </View>
      <View style={stage}>
        <View style={{ alignItems: "center" }}>
          {words.map((word, i) => <Text key={`${word}-${i}`} style={[t, { textAlign: "center" }]}>{word}</Text>)}
          {last ? <GradText style={t}>{last}</GradText> : null}
        </View>
        {art.subline && !thumb ? <Text style={kicker(u)}>{art.subline}</Text> : null}
      </View>
    </>
  );
}

function Barbell({ width }: { width: number }) {
  const plates = (mirror: boolean) => (
    <G transform={mirror ? "translate(300 0) scale(-1 1)" : undefined}>
      <Rect x="34" y="2" width="16" height="60" rx="4" fill="#161616" stroke={C.flame} strokeWidth="1.5" />
      <Rect x="52" y="9" width="12" height="46" rx="3" fill="#161616" stroke={C.hot} strokeWidth="1.2" />
      <Rect x="66" y="16" width="8" height="32" rx="2" fill="#1A1A1A" stroke={C.gold} strokeWidth="1" />
      <Rect x="76" y="24" width="6" height="16" rx="1.5" fill="#bdb6ad" />
    </G>
  );
  return (
    <Svg width={width} height={(width * 64) / 300} viewBox="0 0 300 64">
      <Defs>
        <SvgGradient id="bar" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#6b6b6b" />
          <Stop offset="0.5" stopColor="#e9e2d8" />
          <Stop offset="1" stopColor="#6b6b6b" />
        </SvgGradient>
      </Defs>
      <Rect x="0" y="29" width="300" height="6" rx="3" fill="url(#bar)" />
      {plates(false)}
      {plates(true)}
    </Svg>
  );
}

function Physique({ build, width }: { build: "before" | "after"; width: number }) {
  const torso =
    build === "after"
      ? "M28 124 Q36 103 68 98 L88 95 Q100 104 112 95 L132 98 Q164 103 172 124 L178 182 Q174 196 160 197 L152 160 L148 204 Q142 240 134 260 L66 260 Q58 240 52 204 L48 160 L40 197 Q26 196 22 182 Z"
      : "M50 126 Q57 107 79 102 L90 100 Q100 106 110 100 L121 102 Q143 107 150 126 L155 182 Q152 194 144 195 L140 162 L143 208 Q141 240 137 260 L63 260 Q59 240 57 208 L60 162 L56 195 Q48 194 45 182 Z";
  const rim = build === "after" ? C.flame : C.ash;
  return (
    <Svg width={width} height={(width * 260) / 200} viewBox="0 0 200 260">
      <Defs>
        <SvgGradient id={`fill-${build}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#262626" />
          <Stop offset="1" stopColor="#050505" />
        </SvgGradient>
      </Defs>
      <Ellipse cx="100" cy="58" rx="23" ry="28" fill={`url(#fill-${build})`} stroke={rim} strokeOpacity={0.75} strokeWidth="2" />
      <Path d="M89 82 L111 82 L113 100 L87 100 Z" fill={`url(#fill-${build})`} />
      <Path d={torso} fill={`url(#fill-${build})`} stroke={rim} strokeOpacity={0.75} strokeWidth="2.2" />
      {build === "after" ? (
        <G stroke={C.flame} strokeOpacity={0.45} strokeWidth="1.6" fill="none" strokeLinecap="round">
          <Path d="M66 132 Q84 146 100 136 Q116 146 134 132" />
          <Path d="M100 138 L100 214" />
          <Path d="M84 160 Q92 163 98 160 M102 160 Q108 163 116 160 M86 182 Q93 185 98 182 M102 182 Q107 185 114 182" />
          <Path d="M44 132 Q40 150 46 164 M156 132 Q160 150 154 164" />
        </G>
      ) : null}
    </Svg>
  );
}

function SquatDiagram({ width }: { width: number }) {
  return (
    <Svg width={width} height={width * 0.8} viewBox="0 0 200 160" fill="none">
      <Line x1="40" y1="100" x2="170" y2="100" stroke={C.gold} strokeWidth="1.5" strokeDasharray="5 6" />
      <SvgText x="168" y="93" textAnchor="end" fill={C.gold} fontSize="10" fontFamily={F.label} letterSpacing="1.5">PARALLEL</SvgText>
      <Line x1="48" y1="40" x2="152" y2="40" stroke="#d9d2c8" strokeWidth="4" />
      <Rect x="38" y="25" width="10" height="30" rx="2.5" fill="#1A1A1A" stroke={C.flame} strokeWidth="1.5" />
      <Rect x="152" y="25" width="10" height="30" rx="2.5" fill="#1A1A1A" stroke={C.flame} strokeWidth="1.5" />
      <Circle cx="108" cy="24" r="10" fill={C.white} />
      <Path d="M100 42 L82 96 L128 100 L118 146 L140 146" stroke={C.white} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M102 46 L122 56 L116 40" stroke={C.white} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M114 99 A14 14 0 0 1 123 87" stroke={C.flame} strokeWidth="2" />
      {[[82, 96], [128, 100], [118, 146]].map(([cx, cy]) => <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" fill={C.flame} stroke={C.bg} strokeWidth="2" />)}
    </Svg>
  );
}
