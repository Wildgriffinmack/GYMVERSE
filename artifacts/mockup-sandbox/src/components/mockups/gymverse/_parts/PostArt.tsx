import { useId } from "react";
import type { CSSProperties } from "react";
import { ChevronsLeftRight } from "lucide-react";
import type { PostArtData } from "./data";

type ArtVariant = "reel" | "card" | "thumb";

/**
 * Mock "media" for posts. Pure CSS/SVG so the prototype needs no image assets.
 * Text sizes scale with the container (cqmin units), so one component serves
 * full-screen reels, previews, and tiny grid thumbnails.
 */
export function PostArt({ art, variant = "card", className = "", style }: { art: PostArtData; variant?: ArtVariant; className?: string; style?: CSSProperties }) {
  return (
    <div className={`gv-art gv-art--${art.visual} gv-art-v-${variant} ${className}`} style={style} aria-hidden="true">
      {art.visual === "pr" && <PrArt art={art} />}
      {art.visual === "routine" && <RoutineArt art={art} />}
      {art.visual === "transformation" && <TransformationArt art={art} />}
      {art.visual === "edit" && <EditArt art={art} />}
      {art.visual === "form" && <FormArt art={art} />}
      {art.visual === "motivation" && <MotivationArt art={art} />}
      <div className="gv-art-grain" />
    </div>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

function PrArt({ art }: { art: PostArtData }) {
  return (
    <>
      <div className="gv-pr-beam" />
      <div className="gv-art-stage gv-pr">
        {art.subline && <span className="gv-art-kicker">{art.subline}</span>}
        <div className="gv-pr-figure">
          <span className="gv-pr-number" data-text={art.stat}>{art.stat}</span>
          {art.unit && <span className="gv-pr-unit">{art.unit}</span>}
        </div>
        <Barbell />
        <span className="gv-pr-lift">{art.headline}</span>
      </div>
    </>
  );
}

function RoutineArt({ art }: { art: PostArtData }) {
  return (
    <>
      <div className="gv-routine-streak" />
      <div className="gv-art-stage gv-routine">
        {art.subline && <span className="gv-art-kicker">{art.subline}</span>}
        <h3 className="gv-routine-title">{art.headline}</h3>
        <ol className="gv-routine-list">
          {(art.lines ?? []).map((line, index) => (
            <li key={line.label}>
              <span>{pad(index + 1)}</span>
              <b>{line.label}</b>
              <em>{line.detail}</em>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

function TransformationArt({ art }: { art: PostArtData }) {
  const [before, after] = art.lines ?? [];
  return (
    <div className="gv-split">
      <div className="gv-split-half is-before">
        <Physique build="before" />
        <span className="gv-split-label"><small>{before?.label ?? "Before"}</small>{before?.detail}</span>
      </div>
      <div className="gv-split-half is-after">
        <Physique build="after" />
        <span className="gv-split-label"><small>{after?.label ?? "After"}</small>{after?.detail}</span>
      </div>
      <div className="gv-split-handle"><ChevronsLeftRight /></div>
      <div className="gv-art-stage gv-split-stage">
        <h3 className="gv-split-title">{art.headline}</h3>
        {art.subline && <span className="gv-art-kicker">{art.subline}</span>}
      </div>
    </div>
  );
}

function EditArt({ art }: { art: PostArtData }) {
  return (
    <>
      <div className="gv-edit-strobe" />
      <div className="gv-edit-lines" />
      <div className="gv-edit-bar is-top" />
      <div className="gv-edit-bar is-bottom" />
      <div className="gv-art-stage gv-edit">
        <span className="gv-edit-rec"><i />REC 00:14</span>
        <h3 className="gv-edit-title" data-text={art.headline}>{art.headline}</h3>
        {art.subline && <span className="gv-art-kicker">{art.subline}</span>}
      </div>
    </>
  );
}

function FormArt({ art }: { art: PostArtData }) {
  return (
    <>
      <div className="gv-form-grid" />
      <div className="gv-art-stage gv-form">
        {art.subline && <span className="gv-art-kicker">{art.subline}</span>}
        <SquatDiagram />
        <h3 className="gv-form-title">{art.headline}</h3>
        <div className="gv-form-cues">
          {(art.lines ?? []).map((line, index) => (
            <span key={line.label}><b>{pad(index + 1)}</b>{line.label}</span>
          ))}
        </div>
      </div>
    </>
  );
}

function MotivationArt({ art }: { art: PostArtData }) {
  const words = art.headline.split(/\s+/).filter(Boolean);
  const last = words.pop();
  return (
    <>
      <div className="gv-spotlight" />
      <Physique build="after" className="gv-motivation-figure" />
      <div className="gv-art-stage gv-motivation">
        <h3 className="gv-motivation-title">
          {words.map((word, index) => <span key={`${word}-${index}`}>{word}</span>)}
          {last && <span className="gv-grad-text">{last}</span>}
        </h3>
        {art.subline && <span className="gv-art-kicker">{art.subline}</span>}
      </div>
    </>
  );
}

function Barbell() {
  const id = useId();
  return (
    <svg className="gv-barbell" viewBox="0 0 300 64" fill="none">
      <defs>
        <linearGradient id={`${id}-bar`} x1="0" x2="1">
          <stop offset="0" stopColor="#6b6b6b" />
          <stop offset=".5" stopColor="#e9e2d8" />
          <stop offset="1" stopColor="#6b6b6b" />
        </linearGradient>
        <linearGradient id={`${id}-plate`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2a2a" />
          <stop offset="1" stopColor="#0d0d0d" />
        </linearGradient>
      </defs>
      <rect x="0" y="29" width="300" height="6" rx="3" fill={`url(#${id}-bar)`} />
      {[0, 1].map((side) => (
        <g key={side} transform={side ? "translate(300 0) scale(-1 1)" : undefined}>
          <rect x="34" y="2" width="16" height="60" rx="4" fill={`url(#${id}-plate)`} stroke="#FF5A1F" strokeWidth="1.5" />
          <rect x="52" y="9" width="12" height="46" rx="3" fill={`url(#${id}-plate)`} stroke="#FF2E2E" strokeWidth="1.2" />
          <rect x="66" y="16" width="8" height="32" rx="2" fill="#1A1A1A" stroke="#FFD166" strokeWidth="1" />
          <rect x="76" y="24" width="6" height="16" rx="1.5" fill="#bdb6ad" />
        </g>
      ))}
    </svg>
  );
}

function Physique({ build, className = "" }: { build: "before" | "after"; className?: string }) {
  const id = useId();
  const torso =
    build === "after"
      ? "M28 124 Q36 103 68 98 L88 95 Q100 104 112 95 L132 98 Q164 103 172 124 L178 182 Q174 196 160 197 L152 160 L148 204 Q142 240 134 260 L66 260 Q58 240 52 204 L48 160 L40 197 Q26 196 22 182 Z"
      : "M50 126 Q57 107 79 102 L90 100 Q100 106 110 100 L121 102 Q143 107 150 126 L155 182 Q152 194 144 195 L140 162 L143 208 Q141 240 137 260 L63 260 Q59 240 57 208 L60 162 L56 195 Q48 194 45 182 Z";
  const rim = build === "after" ? "#FF5A1F" : "#A3A3A3";
  return (
    <svg className={`gv-physique is-${build} ${className}`} viewBox="0 0 200 260" preserveAspectRatio="xMidYMax meet">
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#262626" />
          <stop offset="1" stopColor="#050505" />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={rim} stopOpacity=".9" />
          <stop offset=".45" stopColor={rim} stopOpacity="0" />
          <stop offset=".55" stopColor={rim} stopOpacity="0" />
          <stop offset="1" stopColor={rim} stopOpacity=".9" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="58" rx="23" ry="28" fill={`url(#${id}-fill)`} stroke={`url(#${id}-rim)`} strokeWidth="2" />
      <path d="M89 82 L111 82 L113 100 L87 100 Z" fill={`url(#${id}-fill)`} />
      <path d={torso} fill={`url(#${id}-fill)`} stroke={`url(#${id}-rim)`} strokeWidth="2.2" />
      {build === "after" && (
        <g stroke="#FF5A1F" strokeOpacity=".45" strokeWidth="1.6" fill="none" strokeLinecap="round">
          <path d="M66 132 Q84 146 100 136 Q116 146 134 132" />
          <path d="M100 138 L100 214" />
          <path d="M84 160 Q92 163 98 160 M102 160 Q108 163 116 160 M86 182 Q93 185 98 182 M102 182 Q107 185 114 182" />
          <path d="M44 132 Q40 150 46 164 M156 132 Q160 150 154 164" />
        </g>
      )}
    </svg>
  );
}

function SquatDiagram() {
  return (
    <svg className="gv-squat" viewBox="0 0 200 160" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <line x1="40" y1="100" x2="170" y2="100" stroke="#FFD166" strokeWidth="1.5" strokeDasharray="5 6" />
      <text x="168" y="93" textAnchor="end" fill="#FFD166" fontSize="10" fontFamily="Barlow Condensed, sans-serif" fontWeight="700" letterSpacing="1.5">PARALLEL</text>
      <line x1="48" y1="40" x2="152" y2="40" stroke="#d9d2c8" strokeWidth="4" />
      <rect x="38" y="25" width="10" height="30" rx="2.5" fill="#1A1A1A" stroke="#FF5A1F" strokeWidth="1.5" />
      <rect x="152" y="25" width="10" height="30" rx="2.5" fill="#1A1A1A" stroke="#FF5A1F" strokeWidth="1.5" />
      <circle cx="108" cy="24" r="10" fill="#FFF7ED" />
      <path d="M100 42 L82 96 L128 100 L118 146 L140 146" stroke="#FFF7ED" strokeWidth="7" />
      <path d="M102 46 L122 56 L116 40" stroke="#FFF7ED" strokeWidth="5" />
      <path d="M128 100 m-14 -1 a14 14 0 0 1 9 -12" stroke="#FF5A1F" strokeWidth="2" />
      {[[82, 96], [128, 100], [118, 146]].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" fill="#FF5A1F" stroke="#090909" strokeWidth="2" />
      ))}
    </svg>
  );
}
