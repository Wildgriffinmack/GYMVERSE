import { useRef, useState } from "react";
import { PanResponder, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronsLeftRight } from "lucide-react-native";
import { Physique } from "../components/PostArt";
import { Glows } from "../components/Tone";
import { C, F } from "../theme";
import { COMPARISON_DEMO, sliderFraction } from "./proData";

/**
 * Before/after comparison with a draggable divider. Uses React Native's built-in PanResponder
 * (no gesture dependency). Imagery is neutral illustrated silhouettes, not photos of real people.
 */
export function CompareSlider({ height = 320, interactive = true }: { height?: number; interactive?: boolean }) {
  const [width, setWidth] = useState(0);
  const [pos, setPos] = useState(0.5);
  const start = useRef(0.5);
  const widthRef = useRef(0);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        const next = sliderFraction(e.nativeEvent.locationX, widthRef.current);
        start.current = next;
        setPos(next);
      },
      onPanResponderMove: (_e, g) => {
        setPos(sliderFraction(start.current * widthRef.current + g.dx, widthRef.current));
      },
    }),
  ).current;

  const split = width * pos;
  const figure = Math.min(width * 0.5, height * 0.62);

  return (
    <View
      style={[s.frame, { height }]}
      onLayout={(e) => {
        widthRef.current = e.nativeEvent.layout.width;
        setWidth(e.nativeEvent.layout.width);
      }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Before and after comparison"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pos * 100), text: `${Math.round(pos * 100)}% before` }}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pos * 100)}
      aria-valuetext={`${Math.round(pos * 100)}% before`}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => setPos((p) => sliderFraction((p + (e.nativeEvent.actionName === "increment" ? 0.1 : -0.1)) * 100, 100))}
      {...(interactive ? responder.panHandlers : {})}
    >
      {/* AFTER (full background) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient colors={["#2c0d06", "#0b0b0b"]} style={StyleSheet.absoluteFill} />
        <Glows glows={[{ color: C.flame, cx: "60%", cy: "65%", rx: "75%", ry: "55%", opacity: 0.6 }]} />
        <View style={[s.figure, { left: width * 0.5 - figure / 2 + width * 0.12 }]}><Physique build="after" width={figure} /></View>
        <View style={[s.tag, { right: 12 }]}>
          <Text style={[s.tagLabel, { color: C.flame }]}>{COMPARISON_DEMO.after.label}</Text>
          <Text style={s.tagDetail}>{COMPARISON_DEMO.after.detail}</Text>
        </View>
      </View>

      {/* BEFORE (clipped to the divider) */}
      <View style={[s.clip, { width: split }]} pointerEvents="none">
        <View style={{ width, height }}>
          <LinearGradient colors={["#262626", "#0b0b0b"]} style={StyleSheet.absoluteFill} />
          <Glows glows={[{ color: "#A3A3A3", cx: "40%", cy: "65%", rx: "70%", ry: "50%", opacity: 0.25 }]} />
          <View style={[s.figure, { left: width * 0.5 - figure / 2 - width * 0.12 }]}><Physique build="before" width={figure * 0.96} /></View>
          <View style={[s.tag, { left: 12 }]}>
            <Text style={[s.tagLabel, { color: C.ash }]}>{COMPARISON_DEMO.before.label}</Text>
            <Text style={s.tagDetail}>{COMPARISON_DEMO.before.detail}</Text>
          </View>
        </View>
      </View>

      {/* Divider + knob */}
      <View pointerEvents="none" style={[s.divider, { left: split - 1 }]} />
      <View pointerEvents="none" style={[s.knob, { left: split - 22, top: height / 2 - 22 }]}>
        <ChevronsLeftRight size={20} color={C.bg} />
      </View>
      <View pointerEvents="none" style={s.hint}><Text style={s.hintText}>{interactive ? "Drag to compare" : "Preview"}</Text></View>
    </View>
  );
}

const s = StyleSheet.create({
  frame: { borderRadius: 22, overflow: "hidden", backgroundColor: "#0b0b0b" },
  clip: { position: "absolute", left: 0, top: 0, bottom: 0, overflow: "hidden" },
  figure: { position: "absolute", bottom: 0 },
  tag: { position: "absolute", top: 12, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: "rgba(9,9,9,0.55)" },
  tagLabel: { fontFamily: F.labelHeavy, fontSize: 12, letterSpacing: 1.6 },
  tagDetail: { fontFamily: F.display, fontSize: 16, color: C.white },
  divider: { position: "absolute", top: 0, bottom: 0, width: 2, backgroundColor: C.white },
  knob: { position: "absolute", width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: C.white, shadowColor: C.flame, shadowOpacity: 0.7, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  hint: { position: "absolute", bottom: 10, alignSelf: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: "rgba(9,9,9,0.6)" },
  hintText: { fontFamily: F.label, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: C.white },
});
