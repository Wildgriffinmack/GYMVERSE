import type { CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import type { PostArtData } from "./data";
import { STARTER_POSTS } from "./data";
import { PostArt } from "./PostArt";

const FLOATING: { art: PostArtData; style: CSSProperties }[] = [
  { art: STARTER_POSTS[3].art, style: { left: "-8%", top: "4%", "--r": "-9deg", "--d": "0s" } as CSSProperties },
  { art: STARTER_POSTS[0].art, style: { left: "31%", top: "11%", "--r": "3deg", "--d": "-2s" } as CSSProperties },
  { art: STARTER_POSTS[2].art, style: { right: "-10%", top: "2%", "--r": "10deg", "--d": "-4s" } as CSSProperties },
  { art: STARTER_POSTS[1].art, style: { left: "-14%", top: "40%", "--r": "7deg", "--d": "-6s" } as CSSProperties },
  { art: STARTER_POSTS[5].art, style: { right: "-14%", top: "36%", "--r": "-8deg", "--d": "-3s" } as CSSProperties },
];

export function WelcomeScreen({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="gv-welcome">
      <div className="gv-welcome-bg" aria-hidden="true">
        <div className="gv-glow is-a" />
        <div className="gv-glow is-b" />
        {FLOATING.map(({ art, style }, index) => (
          <div key={index} className={`gv-float is-${index}`} style={style}>
            <PostArt art={art} variant="thumb" />
          </div>
        ))}
        <div className="gv-welcome-fade" />
      </div>

      <div className="gv-welcome-top gv-rise" style={{ "--delay": ".05s" } as CSSProperties}>
        <span className="gv-live"><i />12.4K lifting right now</span>
      </div>

      <div className="gv-welcome-body">
        <span className="gv-label gv-rise" style={{ "--delay": ".1s" } as CSSProperties}>The fitness-only social app</span>
        <h1 className="gv-brand gv-rise" style={{ "--delay": ".18s" } as CSSProperties}>
          GYM<span className="gv-grad-text">VERSE</span>
        </h1>
        <p className="gv-welcome-tagline gv-rise" style={{ "--delay": ".26s" } as CSSProperties}>Your gym feed. Nothing else.</p>
        <p className="gv-welcome-support gv-rise" style={{ "--delay": ".32s" } as CSSProperties}>
          Edits<i>.</i> Workouts<i>.</i> PRs<i>.</i> Transformations<i>.</i>
        </p>
        <div className="gv-welcome-actions gv-rise" style={{ "--delay": ".4s" } as CSSProperties}>
          <button type="button" className="gv-cta is-block" onClick={onEnter}>
            Enter GYMVERSE <ArrowRight size={20} strokeWidth={2.6} />
          </button>
          <button type="button" className="gv-text-link" onClick={onEnter}>Explore demo</button>
        </div>
      </div>
    </div>
  );
}
