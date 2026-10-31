import { Children, Fragment, isValidElement, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import MaskedViewImpl from "@react-native-masked-view/masked-view";
import type { ComponentType } from "react";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import { ArrowLeft, BadgeCheck, Check, ChevronRight, Search, SquarePlay, SquarePlus, User } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import type { BadgeTone, Screen } from "../data";
import { NAV_TABS, navTabFor } from "../nav";
import { avatarTone, initialsOf } from "../utils";
import { C, DIAG, ELEVATION, F, GRAD, GRAD_GOLD, GUTTER, HIT, LINE, MOTION, NAV_HEIGHT, RADIUS, SURFACE, TEXT, TINT, TYPE } from "../theme";
import { HomeIcon } from "./GymIcons";

export const tap = () => void Haptics.selectionAsync().catch(() => {});
export const thump = () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

/** True when the OS "Reduce Motion" setting is on. Decorative loops should stay still when it is. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => { if (alive) setReduced(v); }).catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => { alive = false; sub?.remove(); };
  }, []);
  return reduced;
}

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

/** Uppercase eyebrow label. `accent` switches it to Inferno for section kickers. */
export function Label({ children, accent, style }: { children: ReactNode; accent?: boolean; style?: StyleProp<TextStyle> }) {
  return <Text style={[s.label, accent && { color: C.flame }, style]}>{children}</Text>;
}

/** Deep, warm fills so initials read as people rather than placeholders. Gold is the only light tone. */
const AVATAR_GRADS: (readonly [string, string])[] = [
  ["#FF6A2B", "#DD3519"],
  ["#FFD166", "#EE9230"],
  ["#3B3734", "#1C1A18"],
  ["#E33B2E", "#7E1714"],
  ["#B97A3A", "#5E3412"],
];

export function Avatar({ username, name, size = 38, ring = false }: { username: string; name: string; size?: number; ring?: boolean }) {
  const tone = avatarTone(username);
  const inner = (
    <LinearGradient colors={AVATAR_GRADS[tone]} start={DIAG.start} end={DIAG.end} style={{ width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontFamily: F.labelHeavy, fontSize: Math.round(size * 0.4), letterSpacing: size * 0.012, color: tone === 1 ? TEXT.onGold : "#fff", includeFontPadding: false }}>{initialsOf(name)}</Text>
    </LinearGradient>
  );
  if (!ring) return inner;
  return (
    <View style={{ padding: 2.5, borderRadius: size, borderWidth: 1.5, borderColor: C.flame }}>{inner}</View>
  );
}

export function Verified({ size = 15 }: { size?: number }) {
  return <BadgeCheck size={size} color={C.gold} />;
}

/** Slanted, gradient badge (NEW PR, GYM EDIT, HOT, …). Reserved for content moments, not UI chrome. */
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

/** Compact header for detail screens whose hero carries the headline: back button + eyebrow. */
export function TopBar({ top, kicker, onBack, backLabel = "Back", trailing }: { top: number; kicker?: string; onBack: () => void; backLabel?: string; trailing?: ReactNode }) {
  return (
    <View style={[s.topBar, { paddingTop: top + 10 }]}>
      <IconBtn label={backLabel} onPress={onBack}><ArrowLeft size={20} color={C.white} /></IconBtn>
      <View style={{ flex: 1 }}>{kicker ? <Label>{kicker}</Label> : null}</View>
      {trailing}
    </View>
  );
}

/** Screen header: optional back button, eyebrow and a single page title. Long titles shrink to fit one line. */
export function PageHeader({ kicker, title, leading, trailing, top }: { kicker?: string; title: string; leading?: ReactNode; trailing?: ReactNode; top: number }) {
  return (
    <View style={[s.pageHead, { paddingTop: top + 10 }]}>
      {leading}
      <View style={{ flex: 1 }}>
        {kicker ? <Label>{kicker}</Label> : null}
        <Text style={s.pageTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} accessibilityRole="header">{title}</Text>
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
      hitSlop={Math.max(6, (HIT - size) / 2)}
      onPress={() => { tap(); onPress(); }}
      onLongPress={onLongPress ? () => { thump(); onLongPress(); } : undefined}
      style={({ pressed }) => [{ width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center", backgroundColor: pressed ? SURFACE.fillPressed : "rgba(255,247,237,0.08)", transform: [{ scale: pressed ? 0.92 : 1 }] }, style]}
    >
      {children}
    </Pressable>
  );
}

/** Primary gradient call-to-action with a periodic light sweep. One per screen. */
export function Cta({ title, onPress, icon, style }: { title: string; onPress: () => void; icon?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const sweep = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(Animated.sequence([Animated.delay(1600), Animated.timing(sweep, { toValue: 1, duration: 1100, useNativeDriver: true }), Animated.timing(sweep, { toValue: 0, duration: 0, useNativeDriver: true })]));
    loop.start();
    return () => loop.stop();
  }, [sweep, reduced]);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={() => { thump(); onPress(); }} style={({ pressed }) => [s.ctaShadow, { transform: [{ scale: pressed ? MOTION.pressScale : 1 }] }, style]}>
      <LinearGradient colors={GRAD} start={DIAG.start} end={DIAG.end} style={s.cta}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { transform: [{ translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [-420, 420] }) }, { skewX: "-20deg" }] }]}>
          <LinearGradient colors={["transparent", "rgba(255,255,255,0.28)", "transparent"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ width: 140, height: "100%" }} />
        </Animated.View>
        <Text style={s.ctaText}>{title}</Text>
        {icon}
      </LinearGradient>
    </Pressable>
  );
}

export type Tone = "flame" | "gold" | "bone";
const TONE_INK: Record<Tone, string> = { flame: C.flame, gold: C.gold, bone: C.white };
const TONE_FILL: Record<Tone, string> = { flame: TINT.flame, gold: TINT.gold, bone: TINT.bone };
const TONE_GRAD: Record<Tone, readonly [string, string]> = { flame: GRAD, gold: GRAD_GOLD, bone: ["#FFF7ED", "#E9DCC8"] };

/**
 * Button variants:
 * - primary: Inferno gradient (the main action on a screen)
 * - gold: premium / membership moments
 * - solid: gradient in the given tone (plan-specific primary actions)
 * - tinted: quiet fill in a tone colour (secondary actions with identity)
 * - secondary: neutral fill
 * - ghost: text only
 */
export function Button({ title, onPress, variant = "secondary", tone = "flame", size = "md", icon: Icon, trailingIcon: Trailing, style, accessibilityLabel, disabled = false }: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "gold" | "solid" | "tinted" | "secondary" | "ghost";
  tone?: Tone;
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  trailingIcon?: LucideIcon;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  disabled?: boolean;
}) {
  const height = size === "lg" ? 52 : size === "md" ? 46 : 36;
  const solid: Tone | null = variant === "primary" ? "flame" : variant === "gold" ? "gold" : variant === "solid" ? tone : null;
  const ink = solid ? (solid === "flame" ? "#fff" : TEXT.onGold) : variant === "secondary" ? TEXT.primary : TONE_INK[tone];
  const frame: StyleProp<ViewStyle> = [s.btn, { height, borderRadius: size === "sm" ? RADIUS.sm : RADIUS.md, paddingHorizontal: size === "sm" ? 14 : 20 }];
  const content = (
    <>
      {Icon ? <Icon size={size === "sm" ? 15 : 17} color={ink} strokeWidth={2.3} /> : null}
      <Text style={[s.btnText, { color: ink, fontSize: size === "sm" ? 13.5 : size === "md" ? 15 : 16 }]} numberOfLines={1}>{title}</Text>
      {Trailing ? <Trailing size={size === "sm" ? 15 : 17} color={ink} strokeWidth={2.4} /> : null}
    </>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled }} aria-disabled={disabled}
      disabled={disabled}
      hitSlop={size === "sm" ? 4 : 0}
      onPress={() => { tap(); onPress(); }}
      style={({ pressed }) => [{ opacity: disabled ? 0.4 : 1, transform: [{ scale: pressed ? MOTION.pressScale : 1 }] }, style]}
    >
      {({ pressed }) =>
        solid ? (
          <LinearGradient colors={TONE_GRAD[solid]} start={DIAG.start} end={DIAG.end} style={frame}>{content}</LinearGradient>
        ) : (
          <View style={[frame, { backgroundColor: variant === "tinted" ? TONE_FILL[tone] : variant === "secondary" ? (pressed ? SURFACE.fillPressed : SURFACE.fill) : "transparent" }]}>{content}</View>
        )
      }
    </Pressable>
  );
}

/** Small uppercase status tag (PRO, COACH, DEMO…): tinted fill, never an outline. */
export function Tag({ children, tone = "neutral", icon: Icon, style }: { children: string; tone?: Tone | "neutral"; icon?: LucideIcon; style?: StyleProp<ViewStyle> }) {
  const ink = tone === "neutral" ? TEXT.secondary : TONE_INK[tone];
  return (
    <View style={[s.tag, { backgroundColor: tone === "neutral" ? SURFACE.fill : TONE_FILL[tone] }, style]}>
      {Icon ? <Icon size={11} color={ink} strokeWidth={2.6} /> : null}
      <Text style={[s.tagText, { color: ink }]}>{children}</Text>
    </View>
  );
}

/** Rounded-square icon carrier for rows. `solid` uses the tone gradient for the one row that should lead. */
export function IconMark({ icon: Icon, tone = "flame", solid = false, size = 36 }: { icon: LucideIcon; tone?: Tone; solid?: boolean; size?: number }) {
  const box = { width: size, height: size, borderRadius: Math.round(size * 0.3), alignItems: "center" as const, justifyContent: "center" as const };
  const glyph = Math.round(size * 0.5);
  if (solid) {
    return (
      <LinearGradient colors={TONE_GRAD[tone]} start={DIAG.start} end={DIAG.end} style={box}>
        <Icon size={glyph} color={tone === "flame" ? "#fff" : TEXT.onGold} strokeWidth={2.2} />
      </LinearGradient>
    );
  }
  return <View style={[box, { backgroundColor: TONE_FILL[tone] }]}><Icon size={glyph} color={TONE_INK[tone]} strokeWidth={2.1} /></View>;
}

/** Section heading: eyebrow + title, with an optional trailing element aligned to the title baseline. */
export function SectionHeader({ eyebrow, title, trailing, accent = false, style }: { eyebrow?: string; title?: string; trailing?: ReactNode; accent?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[s.sectionHead, style]}>
      <View style={{ flex: 1, gap: 4 }}>
        {eyebrow ? <Label accent={accent}>{eyebrow}</Label> : null}
        {title ? <Text style={s.sectionTitle} accessibilityRole="header">{title}</Text> : null}
      </View>
      {trailing}
    </View>
  );
}

/** One quiet container for related rows, separated by inset hairlines — instead of a stack of cards. */
export function ListGroup({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View style={[s.group, style]}>
      {rows.map((row, i) => (
        <Fragment key={row.key ?? i}>
          {i > 0 ? <View style={s.groupDivider} /> : null}
          {row}
        </Fragment>
      ))}
    </View>
  );
}

export function ListRow({ icon, title, badge, subtitle, trailing, onPress, onLongPress, accessibilityLabel, chevron = true, style }: {
  icon?: ReactNode;
  title: string;
  /** Small tag shown inline after the title (e.g. PRO). */
  badge?: ReactNode;
  subtitle?: string;
  trailing?: ReactNode;
  onPress: () => void;
  onLongPress?: () => void;
  accessibilityLabel?: string;
  chevron?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      onPress={() => { tap(); onPress(); }}
      onLongPress={onLongPress}
      style={({ pressed }) => [s.row, pressed && { backgroundColor: SURFACE.fill }, style]}
    >
      {icon}
      <View style={{ flex: 1, gap: 2 }}>
        <View style={s.rowTitleLine}>
          <Text style={s.rowTitle} numberOfLines={1}>{title}</Text>
          {badge}
        </View>
        {subtitle ? <Text style={s.rowSub} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      {trailing}
      {chevron ? <ChevronRight size={18} color={TEXT.tertiary} /> : null}
    </Pressable>
  );
}

export function Divider({ inset = 0, style }: { inset?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: StyleSheet.hairlineWidth, marginLeft: inset, backgroundColor: LINE.hairline }, style]} />;
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
            <Text style={[s.navLabel, { color }, on && { fontWeight: "600" }]}>{label}</Text>
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
  label: TYPE.eyebrow,
  badge: { height: 24, paddingHorizontal: 11, justifyContent: "center" },
  badgeText: { fontFamily: F.labelHeavy, fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase" },
  glass: { flexDirection: "row", alignItems: "center", gap: 5, height: 24, paddingHorizontal: 10, borderRadius: 7, backgroundColor: "rgba(9,9,9,0.5)", alignSelf: "flex-start" },
  glassText: { fontFamily: F.label, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: C.white },
  pageHead: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: GUTTER, paddingBottom: 18 },
  topBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: GUTTER, paddingBottom: 14 },
  pageTitle: { ...TYPE.title, marginTop: 2 },
  ctaShadow: { borderRadius: 16, ...ELEVATION.cta },
  cta: { height: 56, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 28, overflow: "hidden" },
  ctaText: { ...TYPE.button, fontSize: 18, letterSpacing: 1.8, color: "#fff" },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, overflow: "hidden" },
  btnText: { fontFamily: F.labelHeavy, letterSpacing: 1.2, textTransform: "uppercase" },
  tag: { flexDirection: "row", alignItems: "center", gap: 4, height: 22, paddingHorizontal: 8, borderRadius: RADIUS.xs },
  tagText: TYPE.tag,
  sectionHead: { flexDirection: "row", alignItems: "flex-end", gap: 12, marginBottom: 14 },
  sectionTitle: TYPE.section,
  group: { borderRadius: RADIUS.lg, overflow: "hidden", backgroundColor: SURFACE.raised },
  groupDivider: { height: StyleSheet.hairlineWidth, marginLeft: 64, backgroundColor: LINE.hairline },
  row: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 64, paddingVertical: 12, paddingLeft: 14, paddingRight: 12 },
  rowTitleLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowTitle: { flexShrink: 1, fontSize: 15.5, lineHeight: 20, fontWeight: "600", color: TEXT.primary },
  rowSub: { fontSize: 13, lineHeight: 17, color: TEXT.tertiary },
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
    borderTopColor: LINE.hairline,
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
    borderColor: LINE.strong,
    ...ELEVATION.floating,
    zIndex: 50,
  },
  toastIcon: { width: 26, height: 26, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  toastText: { color: C.white, fontSize: 14, fontWeight: "600", flexShrink: 1 },
});
