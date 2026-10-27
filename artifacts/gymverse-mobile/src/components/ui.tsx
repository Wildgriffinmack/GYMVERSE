import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import MaskedViewImpl from "@react-native-masked-view/masked-view";
import type { ComponentType } from "react";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import { BadgeCheck, Check, Search, SquarePlay, SquarePlus, User } from "lucide-react-native";
import type { BadgeTone, Screen } from "../data";
import { NAV_TABS, navTabFor } from "../nav";
import { avatarTone, initialsOf } from "../utils";
import { C, DIAG, F, GRAD, GRAD_GOLD, NAV_HEIGHT } from "../theme";
import { HomeIcon } from "./GymIcons";

export const tap = () => void Haptics.selectionAsync().catch(() => {});
export const thump = () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

// masked-view still ships class-component typings that React 19.3's JSX types reject; the runtime is fine.
const MaskedView = MaskedViewImpl as unknown as ComponentType<{ maskElement: ReactNode; children: ReactNode }>;

/** Text filled with a gradient. Children must be plain text. */
export function GradText({ children, style, colors = GRAD, vertical = false }: { children: ReactNode; style?: StyleProp<TextStyle>; colors?: readonly [string, string, ...string[]]; vertical?: boolean }) {
  return (
    <MaskedView maskElement={<Text style={[style, { backgroundColor: "transparent" }]}>{children}</Text>}>
      <LinearGradient colors={colors} start={vertical ? { x: 0, y: 0 } : DIAG.start} end={vertical ? { x: 0, y: 1 } : DIAG.end}>
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

/** `split` = white GYM + gradient X (default); `accent` = solid Inferno wordmark used in the Home Feed header. */
export function Wordmark({ size = 22, tone = "split" }: { size?: number; tone?: "split" | "accent" }) {
  const style = { fontFamily: F.display, fontSize: size, lineHeight: size * 1.15, letterSpacing: size * 0.02, color: C.white };
  if (tone === "accent") return <Text style={[style, { color: C.flame }]} accessibilityRole="header">GYMX</Text>;
  return (
    <View style={{ flexDirection: "row" }}>
      <Text style={style}>GYM</Text>
      <GradText style={style}>X</GradText>
    </View>
  );
}

export function Label({ children, accent, style }: { children: ReactNode; accent?: boolean; style?: StyleProp<TextStyle> }) {
  return <Text style={[s.label, accent && { color: C.flame }, style]}>{children}</Text>;
}

const AVATAR_GRADS: (readonly [string, string])[] = [
  ["#FF5A1F", "#FF2E2E"],
  ["#FFD166", "#FF5A1F"],
  ["#3D3D3D", "#161616"],
  ["#FF2E2E", "#6B0F12"],
  ["#FFF7ED", "#A3A3A3"],
];

export function Avatar({ username, name, size = 38, ring = false }: { username: string; name: string; size?: number; ring?: boolean }) {
  const tone = avatarTone(username);
  const dark = tone === 1 || tone === 4;
  const inner = (
    <LinearGradient colors={AVATAR_GRADS[tone]} start={DIAG.start} end={DIAG.end} style={{ width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontFamily: F.display, fontSize: Math.round(size * 0.38), color: dark ? "#160c02" : "#fff" }}>{initialsOf(name)}</Text>
    </LinearGradient>
  );
  if (!ring) return inner;
  return (
    <View style={{ padding: 3, borderRadius: size, borderWidth: 1.5, borderColor: C.flame }}>{inner}</View>
  );
}

export function Verified({ size = 15 }: { size?: number }) {
  return <BadgeCheck size={size} color={C.gold} />;
}

/** Slanted, gradient badge (NEW PR, GYM EDIT, HOT, …). */
export function Badge({ tone = "flame", children }: { tone?: BadgeTone; children: string }) {
  const colors: readonly [string, string] = tone === "gold" ? GRAD_GOLD : tone === "hot" ? [C.hot, C.hot] : tone === "ash" ? [C.white, "#d8d2ca"] : GRAD;
  const ink = tone === "gold" || tone === "ash" ? "#160c02" : "#fff";
  return (
    <View style={{ transform: [{ skewX: "-12deg" }], alignSelf: "flex-start" }}>
      <LinearGradient colors={colors} start={DIAG.start} end={DIAG.end} style={s.badge}>
        <Text style={[s.badgeText, { color: ink, transform: [{ skewX: "12deg" }] }]}>{children}</Text>
      </LinearGradient>
    </View>
  );
}

export function GlassChip({ icon, children, style }: { icon?: ReactNode; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.glass, style]}>
      {icon}
      <Text style={s.glassText} numberOfLines={1}>{children}</Text>
    </View>
  );
}

export function ProgressRing({ value, size = 64, stroke = 6, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgGradient id={`${id}r`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={C.gold} />
            <Stop offset="0.45" stopColor={C.flame} />
            <Stop offset="1" stopColor={C.hot} />
          </SvgGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,247,237,0.1)" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${id}r)`}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={circ * (1 - pct / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

export function PageHeader({ kicker, title, leading, trailing, top }: { kicker?: string; title: string; leading?: ReactNode; trailing?: ReactNode; top: number }) {
  return (
    <View style={[s.pageHead, { paddingTop: top + 14 }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, flex: 1 }}>
        {leading}
        <View style={{ flex: 1 }}>
          {kicker ? <Label>{kicker}</Label> : null}
          <Text style={s.pageTitle} numberOfLines={1}>{title}</Text>
        </View>
      </View>
      {trailing}
    </View>
  );
}

export function IconBtn({ onPress, onLongPress, label, children, size = 40, style }: { onPress: () => void; onLongPress?: () => void; label: string; children: ReactNode; size?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={() => { tap(); onPress(); }}
      onLongPress={onLongPress ? () => { thump(); onLongPress(); } : undefined}
      style={({ pressed }) => [{ width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,247,237,0.08)", transform: [{ scale: pressed ? 0.9 : 1 }] }, style]}
    >
      {children}
    </Pressable>
  );
}

/** Primary gradient call-to-action with a periodic light sweep. */
export function Cta({ title, onPress, icon, style }: { title: string; onPress: () => void; icon?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const sweep = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([Animated.delay(1600), Animated.timing(sweep, { toValue: 1, duration: 1100, useNativeDriver: true }), Animated.timing(sweep, { toValue: 0, duration: 0, useNativeDriver: true })]));
    loop.start();
    return () => loop.stop();
  }, [sweep]);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={() => { thump(); onPress(); }} style={({ pressed }) => [s.ctaShadow, { transform: [{ scale: pressed ? 0.97 : 1 }] }, style]}>
      <LinearGradient colors={GRAD} start={DIAG.start} end={DIAG.end} style={s.cta}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { transform: [{ translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [-420, 420] }) }, { skewX: "-20deg" }] }]}>
          <LinearGradient colors={["transparent", "rgba(255,255,255,0.32)", "transparent"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ width: 140, height: "100%" }} />
        </Animated.View>
        <Text style={s.ctaText}>{title}</Text>
        {icon}
      </LinearGradient>
    </Pressable>
  );
}

const NAV_ICONS: Partial<Record<Screen, typeof Search>> = { explore: Search, create: SquarePlus, clips: SquarePlay, profile: User };
const NAV_IDLE = "rgba(255,247,237,0.66)";

/** Docked bottom navigation: Home, Explore, Create, Clips, Profile. */
export function BottomNav({ active, onNavigate, bottom }: { active: Screen; onNavigate: (s: Screen) => void; bottom: number }) {
  const current = navTabFor(active);
  return (
    <View style={[s.nav, { height: NAV_HEIGHT + bottom, paddingBottom: bottom }]}>
      {NAV_TABS.map(({ screen, label }) => {
        const on = current === screen;
        const color = on ? C.flame : NAV_IDLE;
        const Icon = NAV_ICONS[screen];
        return (
          <Pressable
            key={screen}
            accessibilityRole="tab"
            accessibilityLabel={screen === "create" ? "Create post" : label}
            accessibilityState={{ selected: on }}
            aria-selected={on}
            onPress={() => { if (screen === "create") thump(); else tap(); onNavigate(screen); }}
            style={({ pressed }) => [s.navItem, { opacity: pressed ? 0.6 : 1 }]}
          >
            {Icon ? <Icon size={24} color={color} strokeWidth={on ? 2.1 : 1.7} /> : <HomeIcon size={24} color={color} active={on} strokeWidth={on ? 2.1 : 1.7} />}
            <Text style={[s.navLabel, { color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Toast({ text, top, bottom }: { text: string; top?: number; bottom?: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 7, tension: 80 }).start();
  }, [anim]);
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[s.toast, top !== undefined ? { top } : { bottom }, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }, { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }]}
    >
      <LinearGradient colors={GRAD} start={DIAG.start} end={DIAG.end} style={s.toastIcon}>
        <Check size={15} color="#fff" strokeWidth={3} />
      </LinearGradient>
      <Text style={s.toastText}>{text}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  label: { fontFamily: F.label, fontSize: 12, letterSpacing: 1.9, textTransform: "uppercase", color: C.ash },
  badge: { height: 24, paddingHorizontal: 11, justifyContent: "center" },
  badgeText: { fontFamily: F.labelHeavy, fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase" },
  glass: { flexDirection: "row", alignItems: "center", gap: 5, height: 24, paddingHorizontal: 10, borderRadius: 7, backgroundColor: "rgba(9,9,9,0.5)", alignSelf: "flex-start" },
  glassText: { fontFamily: F.label, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: C.white },
  pageHead: { flexDirection: "row", alignItems: "flex-end", gap: 12, paddingHorizontal: 20, paddingBottom: 18 },
  pageTitle: { fontFamily: F.display, fontSize: 42, lineHeight: 46, color: C.white, textTransform: "uppercase", marginTop: 4 },
  ctaShadow: { borderRadius: 18, shadowColor: C.hot, shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  cta: { height: 58, borderRadius: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 28, overflow: "hidden" },
  ctaText: { fontFamily: F.labelHeavy, fontSize: 19, letterSpacing: 1.9, textTransform: "uppercase", color: "#fff" },
  nav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 4,
    backgroundColor: C.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,247,237,0.08)",
  },
  navItem: { flex: 1, height: NAV_HEIGHT, alignItems: "center", justifyContent: "center", gap: 3, paddingTop: 2 },
  navLabel: { fontSize: 11, fontWeight: "500", letterSpacing: 0.1 },
  toast: {
    position: "absolute",
    alignSelf: "center",
    maxWidth: "88%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 16,
    borderRadius: 16,
    backgroundColor: "rgba(24,24,24,0.97)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,247,237,0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 20,
    zIndex: 50,
  },
  toastIcon: { width: 26, height: 26, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  toastText: { color: C.white, fontSize: 14, fontWeight: "600", flexShrink: 1 },
});
