import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { LayoutChangeEvent } from "react-native";
import Svg, { Circle, Defs, Line, LinearGradient as SvgGradient, Path, Rect, Stop, Text as SvgText } from "react-native-svg";
import { C, F } from "../theme";

function useWidth(): [number, (e: LayoutChangeEvent) => void] {
  const [w, setW] = useState(0);
  return [w, (e) => setW(Math.round(e.nativeEvent.layout.width))];
}

/**
 * Line chart for PR history. Tapping a point selects it and shows its value.
 * Pure react-native-svg — no chart dependency.
 */
export function LineChart({ values, labels, unit = "", height = 190, selected, onSelect }: { values: number[]; labels: string[]; unit?: string; height?: number; selected: number; onSelect: (i: number) => void }) {
  const [width, onLayout] = useWidth();
  const pad = { l: 8, r: 8, t: 26, b: 26 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const lo = min - span * 0.15;
  const hi = max + span * 0.1;
  const x = (i: number) => pad.l + (i * (width - pad.l - pad.r)) / Math.max(1, values.length - 1);
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (height - pad.t - pad.b);
  const line = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(values.length - 1).toFixed(1)},${height - pad.b} L${x(0).toFixed(1)},${height - pad.b} Z`;
  const sel = Math.min(values.length - 1, Math.max(0, selected));

  return (
    <View style={{ height }} onLayout={onLayout}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Defs>
            <SvgGradient id="lc-stroke" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={C.flame} />
              <Stop offset="1" stopColor={C.gold} />
            </SvgGradient>
            <SvgGradient id="lc-area" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={C.flame} stopOpacity={0.35} />
              <Stop offset="1" stopColor={C.flame} stopOpacity={0} />
            </SvgGradient>
          </Defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <Line key={f} x1={pad.l} x2={width - pad.r} y1={pad.t + f * (height - pad.t - pad.b)} y2={pad.t + f * (height - pad.t - pad.b)} stroke="rgba(255,247,237,0.07)" strokeDasharray="4 6" />
          ))}
          <Path d={area} fill="url(#lc-area)" />
          <Path d={line} stroke="url(#lc-stroke)" strokeWidth={3.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <Line x1={x(sel)} x2={x(sel)} y1={y(values[sel])} y2={height - pad.b} stroke="rgba(255,209,102,0.45)" strokeDasharray="3 4" />
          {values.map((v, i) => (
            <Circle key={i} cx={x(i)} cy={y(v)} r={i === sel ? 7 : 4} fill={i === sel ? C.gold : C.bg} stroke={i === sel ? C.bg : C.flame} strokeWidth={i === sel ? 3 : 2.5} />
          ))}
          <SvgText x={Math.min(Math.max(x(sel), 30), width - 30)} y={Math.max(14, y(values[sel]) - 14)} fill={C.white} fontSize={14} fontFamily={F.display} textAnchor="middle">
            {`${values[sel]}${unit}`}
          </SvgText>
          {labels.map((l, i) => (
            <SvgText key={`${l}-${i}`} x={x(i)} y={height - 6} fill={i === sel ? C.gold : C.ash} fontSize={11} fontFamily={F.label} textAnchor="middle">
              {l.toUpperCase()}
            </SvgText>
          ))}
        </Svg>
      ) : null}
      {width > 0 ? (
        <View style={[StyleSheet.absoluteFill, { flexDirection: "row" }]}>
          {values.map((v, i) => (
            <Pressable key={i} style={{ flex: 1 }} accessibilityRole="button" accessibilityLabel={`${labels[i]}: ${v}${unit}`} accessibilityState={{ selected: i === sel }} aria-selected={i === sel} onPress={() => onSelect(i)} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Bar chart (weekly volume / monthly consistency). The highlighted bar uses the gold-to-flame gradient. */
export function BarChart({ values, labels, height = 150, highlight, format }: { values: number[]; labels: string[]; height?: number; highlight?: number; format?: (v: number) => string }) {
  const [width, onLayout] = useWidth();
  const top = 18;
  const bottom = 20;
  const max = Math.max(...values) || 1;
  const gap = 8;
  const bw = width > 0 ? (width - gap * (values.length - 1)) / values.length : 0;
  const hl = highlight ?? values.length - 1;
  return (
    <View style={{ height }} onLayout={onLayout}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Defs>
            <SvgGradient id="bc-hl" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={C.gold} />
              <Stop offset="1" stopColor={C.flame} />
            </SvgGradient>
          </Defs>
          {values.map((v, i) => {
            const h = Math.max(4, (v / max) * (height - top - bottom));
            const x = i * (bw + gap);
            const y = height - bottom - h;
            return (
              <Rect key={i} x={x} y={y} width={bw} height={h} rx={Math.min(8, bw / 3)} fill={i === hl ? "url(#bc-hl)" : "rgba(255,90,31,0.28)"} />
            );
          })}
          {format ? (
            <SvgText x={hl * (bw + gap) + bw / 2} y={Math.max(12, height - bottom - (values[hl] / max) * (height - top - bottom) - 6)} fill={C.white} fontSize={11} fontFamily={F.label} textAnchor="middle">
              {format(values[hl])}
            </SvgText>
          ) : null}
          {labels.map((l, i) => (
            <SvgText key={`${l}-${i}`} x={i * (bw + gap) + bw / 2} y={height - 5} fill={i === hl ? C.gold : C.ash} fontSize={10} fontFamily={F.label} textAnchor="middle">
              {l.toUpperCase()}
            </SvgText>
          ))}
        </Svg>
      ) : null}
    </View>
  );
}

/** Training calendar heatmap: rows are weeks (oldest → newest), columns Mon–Sun. */
export function Heatmap({ weeks }: { weeks: boolean[][] }) {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <View style={{ gap: 5 }}>
      <View style={{ flexDirection: "row", gap: 5 }}>
        {days.map((d, i) => <Text key={i} style={s.day}>{d}</Text>)}
      </View>
      {weeks.map((week, w) => (
        <View key={w} style={{ flexDirection: "row", gap: 5 }}>
          {week.map((on, d) => (
            <View key={d} style={[s.cell, on && (w === weeks.length - 1 ? s.cellNow : s.cellOn)]} accessibilityLabel={on ? "Workout" : "Rest"} />
          ))}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  day: { flex: 1, textAlign: "center", fontFamily: F.label, fontSize: 11, color: C.ash },
  cell: { flex: 1, aspectRatio: 1.6, borderRadius: 5, backgroundColor: "rgba(255,247,237,0.06)" },
  cellOn: { backgroundColor: "rgba(255,90,31,0.6)" },
  cellNow: { backgroundColor: C.gold },
});
