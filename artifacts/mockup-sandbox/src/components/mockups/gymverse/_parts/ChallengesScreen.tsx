import { ArrowRight, Check, Users } from "lucide-react";
import { CHALLENGES, ME } from "./data";
import { Avatar, Badge, PageHeader, ProgressRing } from "./ui";

const MEMBER_FACES = ["maya_moves", "iron_jay", "coach_elena"];

export function ChallengesScreen({ joined, onToggle }: { joined: string[]; onToggle: (id: string) => void }) {
  const active = CHALLENGES.find((c) => c.id === ME.challengeId)!;
  const activePct = Math.round((ME.challengeDay / active.totalDays) * 100);

  return (
    <div className="gv-page">
      <PageHeader kicker="Better together" title="Challenges" trailing={<span className="gv-live is-compact"><i />{CHALLENGES.length} live</span>} />

      <section className="gv-challenge-hero">
        <div className="gv-challenge-hero-glow" />
        <ProgressRing value={activePct} size={116} stroke={9}>
          <b>{activePct}%</b>
          <small>Day {ME.challengeDay}/{active.totalDays}</small>
        </ProgressRing>
        <div className="gv-challenge-hero-copy">
          <span className="gv-label is-accent">Your active challenge</span>
          <h2>{active.title}</h2>
          <p>{active.totalDays - ME.challengeDay} days to go. Don’t break the chain.</p>
        </div>
        <div className="gv-chain" aria-label={`${ME.challengeDay} of ${active.totalDays} days complete`}>
          {Array.from({ length: active.totalDays }, (_, day) => (
            <i key={day} className={day < ME.challengeDay ? "is-done" : day === ME.challengeDay ? "is-today" : ""} />
          ))}
        </div>
      </section>

      <div className="gv-section-label">
        <span className="gv-label">Trending now</span>
        <span className="gv-label is-accent">Join one today</span>
      </div>

      <div className="gv-challenge-list">
        {CHALLENGES.map((challenge, index) => {
          const { id, title, desc, members, difficulty, duration, totalDays, badge, badgeTone, tone, icon: Icon } = challenge;
          const isActive = id === ME.challengeId;
          const isJoined = isActive || joined.includes(id);
          const day = isActive ? ME.challengeDay : 1;
          return (
            <article key={id} className={`gv-challenge gv-tone-${tone} ${isJoined ? "is-joined" : ""}`} style={{ animationDelay: `${index * 60}ms` }}>
              <Icon className="gv-challenge-mark" strokeWidth={1.3} />
              <div className="gv-challenge-top">
                <Badge tone={badgeTone}>{badge}</Badge>
                <span className="gv-challenge-duration">{duration}</span>
              </div>
              <h3 className="gv-challenge-title">{title}</h3>
              <p className="gv-challenge-desc">{desc}</p>
              <div className="gv-challenge-meta">
                <span className="gv-faces">
                  {MEMBER_FACES.map((face) => <Avatar key={face} username={face} name={face} size={24} />)}
                </span>
                <span><Users size={13} />{members} joined</span>
                <span className="gv-dot-sep">{difficulty}</span>
              </div>
              <div className="gv-challenge-foot">
                {isJoined ? (
                  <div className="gv-challenge-progress">
                    <ProgressRing value={Math.max(4, Math.round((day / totalDays) * 100))} size={40} stroke={4} />
                    <span><b>Day {day}</b> of {totalDays}</span>
                  </div>
                ) : (
                  <span className="gv-challenge-hint">Start when you’re ready</span>
                )}
                <button type="button" className={`gv-join ${isJoined ? "is-joined" : ""}`} aria-pressed={isJoined} onClick={() => onToggle(id)}>
                  {isJoined ? <><Check size={16} strokeWidth={3} />Joined</> : <>Join <ArrowRight size={16} strokeWidth={2.6} /></>}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
