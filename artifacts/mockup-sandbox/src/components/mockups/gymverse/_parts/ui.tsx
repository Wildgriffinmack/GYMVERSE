import { useId } from "react";
import type { ReactNode } from "react";
import { BadgeCheck, Compass, House, Plus, Trophy, UserRound } from "lucide-react";
import type { BadgeTone, Screen } from "./data";
import { avatarTone, initialsOf } from "./utils";

export function Wordmark({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span className={`gv-wordmark is-${size}`}>
      GYM<span className="gv-grad-text">VERSE</span>
    </span>
  );
}

export function Avatar({ username, name, size = 38, ring = false }: { username: string; name: string; size?: number; ring?: boolean }) {
  return (
    <span
      className={`gv-avatar gv-av-${avatarTone(username)} ${ring ? "has-ring" : ""}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  );
}

export function Verified() {
  return <BadgeCheck className="gv-verified" size={15} aria-label="Verified" />;
}

export function Badge({ tone = "flame", children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={`gv-badge is-${tone}`}>{children}</span>;
}

export function ProgressRing({ value, size = 64, stroke = 6, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const id = useId();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="gv-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFD166" />
            <stop offset=".45" stopColor="#FF5A1F" />
            <stop offset="1" stopColor="#FF2E2E" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,247,237,.1)" strokeWidth={stroke} fill="none" />
        <circle
          className="gv-ring-value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${id}-g)`}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {children && <div className="gv-ring-label">{children}</div>}
    </div>
  );
}

export function PageHeader({ kicker, title, leading, trailing }: { kicker?: string; title: string; leading?: ReactNode; trailing?: ReactNode }) {
  return (
    <header className="gv-page-head">
      <div className="gv-page-head-main">
        {leading}
        <div>
          {kicker && <span className="gv-label">{kicker}</span>}
          <h1 className="gv-page-title">{title}</h1>
        </div>
      </div>
      {trailing && <div className="gv-page-head-actions">{trailing}</div>}
    </header>
  );
}

const NAV_ITEMS: { screen: Screen; label: string; icon: typeof House }[] = [
  { screen: "home", label: "Home", icon: House },
  { screen: "explore", label: "Explore", icon: Compass },
  { screen: "challenges", label: "Challenges", icon: Trophy },
  { screen: "profile", label: "Profile", icon: UserRound },
];

export function BottomNav({ active, onNavigate }: { active: Screen; onNavigate: (screen: Screen) => void }) {
  const isActive = (screen: Screen) => active === screen || (screen === "profile" && active === "progress");
  const renderItem = ({ screen, label, icon: Icon }: (typeof NAV_ITEMS)[number]) => (
    <button
      key={screen}
      type="button"
      className={`gv-nav-item ${isActive(screen) ? "is-active" : ""}`}
      aria-current={isActive(screen) ? "page" : undefined}
      onClick={() => onNavigate(screen)}
    >
      <Icon size={22} strokeWidth={isActive(screen) ? 2.4 : 2} />
      <span>{label}</span>
    </button>
  );
  return (
    <nav className="gv-nav" aria-label="Main navigation">
      {NAV_ITEMS.slice(0, 2).map(renderItem)}
      <button
        type="button"
        className={`gv-nav-create ${active === "create" ? "is-active" : ""}`}
        aria-label="Create post"
        aria-current={active === "create" ? "page" : undefined}
        onClick={() => onNavigate("create")}
      >
        <Plus size={24} strokeWidth={2.8} />
      </button>
      {NAV_ITEMS.slice(2).map(renderItem)}
    </nav>
  );
}
