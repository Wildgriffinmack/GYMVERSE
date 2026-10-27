import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowRight } from "lucide-react-native";
import { STARTER_POSTS } from "../data";
import { PostArt } from "../components/PostArt";
import { Glows } from "../components/Tone";
import { Cta, GradText, Label, tap } from "../components/ui";
import { C, F } from "../theme";

/** Floating, blurred-looking mock posts behind the brand. Positions are fractions of the screen. */
const FLOATING = [
  { post: 3, x: -0.08, y: 0.04, w: 0.4, r: -9, o: 0.5, z: 0 },
  { post: 0, x: 0.3, y: 0.1, w: 0.44, r: 3, o: 0.85, z: 2 },
  { post: 2, x: 0.7, y: 0.02, w: 0.4, r: 10, o: 0.5, z: 1 },
  { post: 1, x: -0.14, y: 0.4, w: 0.4, r: 7, o: 0.3, z: 0 },
  { post: 5, x: 0.74, y: 0.36, w: 0.4, r: -8, o: 0.3, z: 0 },
];

export function WelcomeScreen({ onEnter }: { onEnter: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const brandSize = Math.min(96, width * 0.22, height * 0.105);
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Glows glows={[{ color: C.flame, cx: "10%", cy: "25%", rx: "75%", ry: "30%", opacity: 0.55 }, { color: C.hot, cx: "100%", cy: "45%", rx: "65%", ry: "28%", opacity: 0.45 }]} />
        {FLOATING.map((f, i) => (
          <Floater key={i} delay={i * 900} style={{ left: f.x * width, top: f.y * height + insets.top, width: f.w * width, height: f.w * width * (16 / 9), opacity: f.o, zIndex: f.z, transform: [{ rotate: `${f.r}deg` }] }}>
            <PostArt art={STARTER_POSTS[f.post].art} variant="thumb" />
          </Floater>
        ))}
        <LinearGradient colors={["rgba(9,9,9,0.35)", "rgba(9,9,9,0.15)", "rgba(9,9,9,0.75)", C.bg]} locations={[0, 0.22, 0.5, 0.68]} style={[StyleSheet.absoluteFill, { zIndex: 3 }]} />
      </View>

      <Rise delay={50} style={[s.live, { top: insets.top + 12 }]}>
        <Pulse />
        <Text style={s.liveText}>12.4K lifting right now</Text>
      </Rise>

      <View style={[s.body, { paddingBottom: insets.bottom + 26 }]}>
        <Rise delay={100}><Label>The fitness-only social app</Label></Rise>
        <Rise delay={180} style={{ flexDirection: "row", marginTop: 8 }}>
          <Text style={[s.brand, { fontSize: brandSize, lineHeight: brandSize * 1.08 }]}>GYM</Text>
          <GradText style={[s.brand, { fontSize: brandSize, lineHeight: brandSize * 1.08 }]}>X</GradText>
        </Rise>
        <Rise delay={260}><Text style={s.tagline}>Your gym feed. Nothing else.</Text></Rise>
        <Rise delay={320}>
          <Text style={s.support}>
            {["Edits", "Workouts", "PRs", "Transformations"].map((w) => <Text key={w}>{w}<Text style={{ color: C.flame, fontWeight: "800" }}>. </Text></Text>)}
          </Text>
        </Rise>
        <Rise delay={400} style={{ marginTop: 28, gap: 6, alignItems: "center" }}>
          <Cta title="Enter GYMX" onPress={onEnter} icon={<ArrowRight size={20} color="#fff" strokeWidth={2.6} />} style={{ alignSelf: "stretch" }} />
          <Pressable accessibilityRole="button" onPress={() => { tap(); onEnter(); }} hitSlop={8} style={({ pressed }) => ({ padding: 10, opacity: pressed ? 0.6 : 1 })}>
            <Text style={s.link}>Explore demo</Text>
          </Pressable>
        </Rise>
      </View>
    </View>
  );
}

function Floater({ delay, style, children }: { delay: number; style: object; children: ReactNode }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(y, { toValue: -14, duration: 4500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 4500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [delay, y]);
  return (
    <Animated.View style={[s.float, style, { transform: [...((style as { transform?: object[] }).transform ?? []), { translateY: y }] }]}>
      {children}
    </Animated.View>
  );
}

export function Rise({ delay = 0, style, children }: { delay?: number; style?: object; children: ReactNode }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 700, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [a, delay]);
  return <Animated.View style={[style, { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>{children}</Animated.View>;
}

export function Pulse({ color = C.hot }: { color?: string }) {
  const a = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([Animated.timing(a, { toValue: 0.3, duration: 800, useNativeDriver: true }), Animated.timing(a, { toValue: 1, duration: 800, useNativeDriver: true })]));
    loop.start();
    return () => loop.stop();
  }, [a]);
  return <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, opacity: a }} />;
}

const s = StyleSheet.create({
  float: { position: "absolute", borderRadius: 22, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,247,237,0.1)" },
  live: { position: "absolute", alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 8, height: 30, paddingHorizontal: 12, borderRadius: 15, backgroundColor: "rgba(9,9,9,0.6)", borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,247,237,0.14)", zIndex: 5 },
  liveText: { fontFamily: F.label, fontSize: 12, letterSpacing: 1.7, textTransform: "uppercase", color: C.white },
  body: { flex: 1, justifyContent: "flex-end", paddingHorizontal: 24, zIndex: 5 },
  brand: { fontFamily: F.display, color: C.white, includeFontPadding: false },
  tagline: { marginTop: 14, color: C.white, fontSize: 23, fontWeight: "800", letterSpacing: -0.4 },
  support: { marginTop: 8, color: C.muted, fontSize: 15, fontWeight: "500" },
  link: { fontFamily: F.label, fontSize: 14, letterSpacing: 2.5, textTransform: "uppercase", color: C.muted },
});
