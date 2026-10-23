import { ArrowLeft, Dumbbell, Flame, Play, Target, Trophy } from "lucide-react";
import type { TimelineEntry } from "./data";
import { ME } from "./data";
import { PostArt } from "./PostArt";
import { PageHeader } from "./ui";

const SUMMARY = [
  { icon: Dumbbell, value: "124", label: "Workouts" },
  { icon: Flame, value: `${ME.streak}`, label: "Day streak" },
  { icon: Trophy, value: "+45", label: "Bench PR (lb)", gold: true },
  { icon: Target, value: "92%", label: "Consistency" },
];

export function ProgressScreen({ timeline, onBack }: { timeline: TimelineEntry[]; onBack: () => void }) {
  return (
    <div className="gv-page gv-progress-page">
      <PageHeader
        kicker={`@${ME.username}`}
        title="Progress"
        leading={<button type="button" className="gv-icon-btn" aria-label="Back to profile" onClick={onBack}><ArrowLeft size={20} /></button>}
      />

      <section className="gv-progress-hero">
        <span className="gv-label is-accent">The work adds up</span>
        <h2 className="gv-progress-title">6 months of <span className="gv-grad-text">progress.</span></h2>
        <div className="gv-progress-track" role="progressbar" aria-valuenow={6} aria-valuemin={0} aria-valuemax={6} aria-label="6 of 6 months">
          <span />
        </div>
        <div className="gv-progress-ends"><span>Day 1</span><span>6 months of progress.</span><span>Today</span></div>
      </section>

      <div className="gv-summary">
        {SUMMARY.map(({ icon: Icon, value, label, gold }) => (
          <div key={label} className={`gv-summary-chip ${gold ? "is-gold" : ""}`}>
            <Icon size={16} />
            <b>{value}</b>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <ol className="gv-timeline">
        {timeline.map((entry, index) => {
          const latest = index === timeline.length - 1;
          return (
            <li key={entry.id} className={`gv-tl-item ${latest ? "is-latest" : ""}`} style={{ animationDelay: `${index * 70}ms` }}>
              <span className="gv-tl-node" />
              <div className="gv-tl-head">
                <h3>{entry.title}</h3>
                {entry.isNew && <span className="gv-badge is-gold">New</span>}
                <time>{entry.date}</time>
              </div>
              <p className="gv-tl-note">{entry.note}</p>
              <div className="gv-tl-media">
                <PostArt art={entry.art} variant="card" />
                <span className="gv-tl-media-label">{ME.name} · {entry.title}</span>
                <span className="gv-tl-play"><Play size={14} fill="currentColor" /></span>
              </div>
              <div className="gv-tl-stats">
                {entry.stats.map((stat) => <span key={stat}>{stat}</span>)}
              </div>
            </li>
          );
        })}
      </ol>

      <button type="button" className="gv-text-link is-center" onClick={onBack}><ArrowLeft size={15} />Back to profile</button>
    </div>
  );
}
