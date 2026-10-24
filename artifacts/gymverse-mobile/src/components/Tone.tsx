import { StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { useId } from "react";

type Glow = { color: string; cx: string; cy: string; rx: string; ry: string; opacity?: number };
export type Tone = { colors: readonly [string, string, ...string[]]; start: { x: number; y: number }; end: { x: number; y: number }; glows?: Glow[] };

/** Gradient recipes shared by Explore tiles and Challenge cards (ported from the web `.gv-tone-*` classes). */
export const TONES: Record<string, Tone> = {
  ember: { colors: ["#FF5A1F", "#FF2E2E", "#4A0C06"], start: { x: 0.2, y: 0 }, end: { x: 0.8, y: 1 }, glows: [{ color: "#FFD166", cx: "100%", cy: "0%", rx: "70%", ry: "60%", opacity: 0.85 }] },
  gold: { colors: ["#FFD166", "#F28A2E", "#3D1A05"], start: { x: 0.3, y: 0 }, end: { x: 0.7, y: 1 }, glows: [{ color: "#FFF7ED", cx: "0%", cy: "0%", rx: "60%", ry: "45%", opacity: 0.35 }] },
  crimson: { colors: ["#FF2E2E", "#8F1018", "#1C0507"], start: { x: 0.3, y: 0 }, end: { x: 0.7, y: 1 } },
  iron: { colors: ["#3B3B3B", "#1A1A1A", "#0D0D0D"], start: { x: 0.2, y: 0 }, end: { x: 0.8, y: 1 }, glows: [{ color: "#FF5A1F", cx: "0%", cy: "100%", rx: "70%", ry: "60%", opacity: 0.6 }] },
  magma: { colors: ["#170806", "#170806"], start: { x: 0, y: 0 }, end: { x: 1, y: 1 }, glows: [{ color: "#FF5A1F", cx: "88%", cy: "10%", rx: "60%", ry: "80%" }, { color: "#FF2E2E", cx: "8%", cy: "100%", rx: "55%", ry: "75%" }] },
  sunset: { colors: ["#FFD166", "#FF5A1F", "#9B1D12", "#2A0806"], start: { x: 0.6, y: 0 }, end: { x: 0.4, y: 1 } },
  citrus: { colors: ["#FFD166", "#FF8A3D", "#6B1F0A"], start: { x: 0, y: 0.2 }, end: { x: 1, y: 0.8 }, glows: [{ color: "#FF2E2E", cx: "100%", cy: "100%", rx: "70%", ry: "45%", opacity: 0.7 }] },
  blood: { colors: ["#3A0A0A", "#0F0505"], start: { x: 0.3, y: 0 }, end: { x: 0.7, y: 1 }, glows: [{ color: "#FF2E2E", cx: "15%", cy: "10%", rx: "80%", ry: "65%", opacity: 0.95 }] },
  smoke: { colors: ["#2E2E2E", "#121212"], start: { x: 0.4, y: 0 }, end: { x: 0.6, y: 1 }, glows: [{ color: "#FFD166", cx: "100%", cy: "0%", rx: "70%", ry: "55%", opacity: 0.5 }] },
  ash: { colors: ["#4A4A4A", "#1A1A1A"], start: { x: 0.3, y: 0 }, end: { x: 0.7, y: 1 }, glows: [{ color: "#FF5A1F", cx: "100%", cy: "100%", rx: "60%", ry: "55%", opacity: 0.55 }] },
};

/** Fills its parent with a linear gradient plus optional soft radial glows. */
export function ToneFill({ tone, style }: { tone: Tone; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <LinearGradient colors={tone.colors} start={tone.start} end={tone.end} style={StyleSheet.absoluteFill} />
      {tone.glows?.length ? <Glows glows={tone.glows} /> : null}
    </View>
  );
}

export function Glows({ glows }: { glows: Glow[] }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
      <Defs>
        {glows.map((g, i) => (
          <RadialGradient key={i} id={`${id}g${i}`} cx={g.cx} cy={g.cy} rx={g.rx} ry={g.ry} fx={g.cx} fy={g.cy} gradientUnits="objectBoundingBox">
            <Stop offset="0" stopColor={g.color} stopOpacity={g.opacity ?? 1} />
            <Stop offset="1" stopColor={g.color} stopOpacity={0} />
          </RadialGradient>
        ))}
      </Defs>
      {glows.map((_, i) => <Rect key={i} x="0" y="0" width="100%" height="100%" fill={`url(#${id}g${i})`} />)}
    </Svg>
  );
}
