import Svg, { Circle, Path } from "react-native-svg";
import { C } from "../theme";

/**
 * GYMX interaction icons (24×24 grid). Monochrome outlines at rest; the Inferno accent appears only when
 * an action is active (liked, saved), so orange in the feed always means "you did this".
 * Pass `accent` to tint the detail strokes explicitly.
 * Bicep and house outlines are adapted from Lucide ("biceps-flexed", "house"), ISC License, © Lucide Contributors.
 */
type IconProps = { size?: number; color?: string; accent?: string; strokeWidth?: number };
type ToggleIconProps = IconProps & { active?: boolean };

const STROKE = 1.7;
const line = { strokeLinecap: "round", strokeLinejoin: "round" } as const;

const ARM = "M12.409 13.017A5 5 0 0 1 22 15c0 3.866-4 7-9 7-4.077 0-8.153-.82-10.371-2.462-.426-.316-.631-.832-.62-1.362C2.118 12.723 2.627 2 10 2a3 3 0 0 1 3 3 2 2 0 0 1-2 2c-1.105 0-1.64-.444-2-1";
// First half of the arm's outer curve, used for the optional accent stroke.
const ARM_ACCENT = "M2.009 18.176C2.064 15.45 2.218 11.406 3.281 8.043";

/** Like: flexing bicep. Filled with the accent when liked. */
export function FlexIcon({ size = 26, color = C.white, accent, strokeWidth = STROKE, active = false }: ToggleIconProps) {
  const fill = accent ?? C.flame;
  const ink = active ? fill : color;
  const detail = active ? C.bg : color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={ARM} stroke={ink} strokeWidth={strokeWidth} fill={active ? fill : "none"} {...line} />
      <Path d="M15 14a5 5 0 0 0-7.584 2" stroke={detail} strokeWidth={strokeWidth} {...line} />
      <Path d="M9.964 6.825C8.019 7.977 9.5 13 8 15" stroke={detail} strokeWidth={strokeWidth} {...line} />
      {!active && accent ? <Path d={ARM_ACCENT} stroke={accent} strokeWidth={strokeWidth + 0.6} {...line} /> : null}
    </Svg>
  );
}

/** Comment: speech bubble with three vertical "rep" bars. */
export function CommentIcon({ size = 26, color = C.white, accent, strokeWidth = STROKE }: IconProps) {
  const detail = accent ?? color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.25c4.83 0 8.75 3.47 8.75 7.75S16.83 18.75 12 18.75c-1.08 0-2.11-.17-3.07-.49L3.9 20.1l1.38-4.06C4.17 14.68 3.25 12.92 3.25 11 3.25 6.72 7.17 3.25 12 3.25Z"
        stroke={color}
        strokeWidth={strokeWidth}
        {...line}
      />
      <Path d="M9.4 9.2v3.6" stroke={detail} strokeWidth={strokeWidth + 0.3} {...line} />
      <Path d="M12 8.2v5.6" stroke={detail} strokeWidth={strokeWidth + 0.3} {...line} />
      <Path d="M14.6 9.2v3.6" stroke={color} strokeWidth={strokeWidth + 0.3} {...line} />
    </Svg>
  );
}

/** Share: athletic forward arrow with a speed line. */
export function ShareIcon({ size = 26, color = C.white, accent, strokeWidth = STROKE }: IconProps) {
  const detail = accent ?? color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M13.2 5.2 20.8 12l-7.6 6.8v-3.9c-4.4-.2-7.8 1.1-10.4 4.3.9-5.3 4.6-8.9 10.4-9.4V5.2Z" stroke={color} strokeWidth={strokeWidth} {...line} />
      <Path d="M4.4 10.1c1.3-2 3.1-3.3 5.4-3.9" stroke={detail} strokeWidth={strokeWidth + 0.3} {...line} />
      <Circle cx={15.7} cy={12} r={1.25} fill={detail} />
    </Svg>
  );
}

/** Save: bookmark with three horizontal lines. Filled with the accent when saved. */
export function SaveIcon({ size = 26, color = C.white, accent, strokeWidth = STROKE, active = false }: ToggleIconProps) {
  const fill = accent ?? C.flame;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.5 3.75h11a.75.75 0 0 1 .75.75v15.6l-6.25-4.3-6.25 4.3V4.5a.75.75 0 0 1 .75-.75Z"
        stroke={active ? fill : color}
        strokeWidth={strokeWidth}
        fill={active ? fill : "none"}
        {...line}
      />
      <Path d="M9.3 7.4h5.4M9.3 10h5.4M10.4 12.6h3.2" stroke={active ? C.bg : accent ?? color} strokeWidth={strokeWidth + 0.1} {...line} />
    </Svg>
  );
}

/** Bottom-nav Home: outline when idle, solid with a door cut-out when active. */
export function HomeIcon({ size = 25, color = C.white, strokeWidth = STROKE, active = false }: Omit<ToggleIconProps, "accent">) {
  const house = "M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z";
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={house} stroke={color} strokeWidth={strokeWidth} fill={active ? color : "none"} {...line} />
      {active ? (
        <Path d="M10 21.5v-7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7z" fill={C.bg} />
      ) : (
        <Path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" stroke={color} strokeWidth={strokeWidth} {...line} />
      )}
    </Svg>
  );
}
