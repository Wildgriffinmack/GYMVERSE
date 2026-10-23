import { useState } from "react";
import { ArrowRight, BarChart3, Bookmark, ChevronRight, Flame, Grid3x3, Play, Settings, Share2, Target } from "lucide-react";
import type { Post } from "./data";
import { CHALLENGES, ME, PERSONAL_RECORDS, PROFILE_EXTRA_TILES } from "./data";
import { PostArt } from "./PostArt";
import { Avatar, ProgressRing, Verified } from "./ui";
import { formatCount } from "./utils";

type ProfileProps = {
  myPosts: Post[];
  savedPosts: Post[];
  onOpenPost: (id: string) => void;
  onTimeline: () => void;
  onChallenges: () => void;
  onToast: (message: string) => void;
};

export function ProfileScreen({ myPosts, savedPosts, onOpenPost, onTimeline, onChallenges, onToast }: ProfileProps) {
  const [tab, setTab] = useState<"posts" | "saved">("posts");
  const challenge = CHALLENGES.find((c) => c.id === ME.challengeId)!;
  const createdCount = myPosts.filter((post) => post.created).length;
  const challengePct = Math.round((ME.challengeDay / challenge.totalDays) * 100);

  return (
    <div className="gv-page gv-profile">
      <div className="gv-cover">
        <span className="gv-cover-word" aria-hidden="true">{ME.name}</span>
        <div className="gv-cover-actions">
          <button type="button" className="gv-icon-btn" aria-label="Share profile" onClick={() => onToast("Profile link copied.")}><Share2 size={18} /></button>
          <button type="button" className="gv-icon-btn" aria-label="Settings" onClick={() => onToast("Settings aren’t part of this demo.")}><Settings size={18} /></button>
        </div>
      </div>

      <section className="gv-identity">
        <div className="gv-identity-avatar">
          <Avatar username={ME.username} name={ME.name} size={96} />
          <span className="gv-streak-badge"><Flame size={13} fill="currentColor" />{ME.streak}</span>
        </div>
        <h1 className="gv-profile-name">{ME.name}<Verified /></h1>
        <span className="gv-profile-handle">@{ME.username}</span>
        <p className="gv-profile-bio">{ME.bio}</p>
        <span className="gv-goal"><Target size={14} />Goal · {ME.goal}</span>

        <dl className="gv-stats">
          <div><dt>Followers</dt><dd>{ME.followers}</dd></div>
          <div><dt>Following</dt><dd>{ME.following}</dd></div>
          <div><dt>Posts</dt><dd>{ME.basePosts + createdCount}</dd></div>
          <div className="is-streak"><dt>Day streak</dt><dd><Flame size={16} fill="currentColor" />{ME.streak}</dd></div>
        </dl>
      </section>

      <section className="gv-profile-section">
        <div className="gv-section-label is-tight">
          <span className="gv-label">Personal records</span>
          <span className="gv-label is-accent">LB</span>
        </div>
        <div className="gv-pr-chips">
          {PERSONAL_RECORDS.map((pr) => (
            <div key={pr.lift} className="gv-pr-chip">
              <span className="gv-label">{pr.lift}</span>
              <b>{pr.value}</b>
              <small>{pr.delta}</small>
            </div>
          ))}
        </div>

        <button type="button" className="gv-current-challenge" onClick={onChallenges}>
          <ProgressRing value={challengePct} size={46} stroke={4.5}><Flame size={16} fill="currentColor" /></ProgressRing>
          <span>
            <small className="gv-label is-accent">Current challenge</small>
            <b>30-Day Consistency Challenge</b>
            <em>Day {ME.challengeDay} of {challenge.totalDays}</em>
          </span>
          <ChevronRight size={20} />
        </button>

        <button type="button" className="gv-timeline-cta" onClick={onTimeline}>
          <span className="gv-timeline-cta-icon"><BarChart3 size={22} /></span>
          <span>
            <b>View Progress Timeline</b>
            <small>6 months · 124 workouts · +45 lb</small>
          </span>
          <ArrowRight size={20} strokeWidth={2.6} />
        </button>
      </section>

      <div className="gv-profile-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "posts"} className={tab === "posts" ? "is-active" : ""} onClick={() => setTab("posts")}>
          <Grid3x3 size={17} />Posts
        </button>
        <button type="button" role="tab" aria-selected={tab === "saved"} className={tab === "saved" ? "is-active" : ""} onClick={() => setTab("saved")}>
          <Bookmark size={17} />Saved <small>{savedPosts.length}</small>
        </button>
      </div>

      {tab === "posts" ? (
        <div className="gv-grid">
          {myPosts.map((post) => (
            <button key={post.id} type="button" className="gv-grid-tile" onClick={() => onOpenPost(post.id)} aria-label={`Open post: ${post.caption}`}>
              <PostArt art={post.art} variant="thumb" />
              {post.created && <span className="gv-grid-new">New</span>}
              <span className="gv-grid-views"><Play size={11} fill="currentColor" />{formatCount(post.likes * 4 || 1)}</span>
            </button>
          ))}
          {PROFILE_EXTRA_TILES.map((tile) => (
            <button key={tile.id} type="button" className="gv-grid-tile" onClick={() => onToast("Older posts aren’t in this demo feed.")} aria-label="Older post">
              <PostArt art={tile.art} variant="thumb" />
              <span className="gv-grid-views"><Play size={11} fill="currentColor" />{tile.views}</span>
            </button>
          ))}
        </div>
      ) : savedPosts.length ? (
        <div className="gv-grid">
          {savedPosts.map((post) => (
            <button key={post.id} type="button" className="gv-grid-tile" onClick={() => onOpenPost(post.id)} aria-label={`Open saved post by @${post.username}`}>
              <PostArt art={post.art} variant="thumb" />
              <span className="gv-grid-views"><Bookmark size={11} fill="currentColor" />@{post.username}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="gv-empty-note">Tap the bookmark on any post to save it here.</p>
      )}
    </div>
  );
}
