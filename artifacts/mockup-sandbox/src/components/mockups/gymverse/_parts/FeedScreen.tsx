import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Bell, Bookmark, Flame, Heart, MessageCircle, Music2, Play, Send, TrendingUp } from "lucide-react";
import type { FeedTab, Post } from "./data";
import { FEED_TABS, ME } from "./data";
import { PostArt } from "./PostArt";
import { Avatar, Badge, Verified, Wordmark } from "./ui";
import { formatCount } from "./utils";

type FeedProps = {
  tab: FeedTab;
  onTab: (tab: FeedTab) => void;
  posts: Post[];
  likedIds: string[];
  savedIds: string[];
  followed: string[];
  focusPostId: string | null;
  onFocusHandled: () => void;
  onLike: (id: string, forceOn?: boolean) => void;
  onSave: (id: string) => void;
  onFollow: (username: string) => void;
  onComment: (id: string) => void;
  onShare: (post: Post) => void;
  onToast: (message: string) => void;
};

export function FeedScreen(props: FeedProps) {
  const { tab, onTab, posts, focusPostId, onFocusHandled } = props;
  const scroller = useRef<HTMLDivElement>(null);
  const visible = useMemo(() => (tab === "For You" ? posts : posts.filter((post) => post.feeds.includes(tab))), [tab, posts]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [tab]);

  useEffect(() => {
    if (!focusPostId) return;
    scroller.current?.querySelector(`[data-post="${focusPostId}"]`)?.scrollIntoView({ block: "start" });
    onFocusHandled();
  }, [focusPostId, onFocusHandled]);

  return (
    <>
      <header className="gv-feed-top">
        <div className="gv-feed-bar">
          <Wordmark size="sm" />
          <div className="gv-feed-actions">
            <button type="button" className="gv-streak-chip" onClick={() => props.onToast(`${ME.streak}-day streak. Don’t break the chain.`)} aria-label={`${ME.streak}-day streak`}>
              <Flame size={16} fill="currentColor" />
              {ME.streak}
            </button>
            <button type="button" className="gv-icon-btn" aria-label="Notifications" onClick={() => props.onToast("You’re all caught up.")}>
              <Bell size={19} />
              <i className="gv-notify-dot" />
            </button>
          </div>
        </div>
        <div className="gv-tabs" role="tablist" aria-label="Feed">
          {FEED_TABS.map((item) => (
            <button key={item} type="button" role="tab" aria-selected={tab === item} className={`gv-tab ${tab === item ? "is-active" : ""}`} onClick={() => onTab(item)}>
              {item}
            </button>
          ))}
        </div>
      </header>

      <div className="gv-feed" ref={scroller} key={tab}>
        {visible.length ? (
          visible.map((post) => <Reel key={post.id} post={post} {...props} />)
        ) : (
          <div className="gv-feed-empty">
            <Flame size={34} />
            <b>Nothing here yet</b>
            <span>Be the first to post in {tab}.</span>
          </div>
        )}
      </div>
    </>
  );
}

function Reel({ post, likedIds, savedIds, followed, onLike, onSave, onFollow, onComment, onShare }: FeedProps & { post: Post }) {
  const isVideo = post.postType !== "Photo";
  const [playing, setPlaying] = useState(false);
  const [burst, setBurst] = useState(0);
  const liked = likedIds.includes(post.id);
  const saved = savedIds.includes(post.id);
  const isFollowing = followed.includes(post.username);
  const isMine = post.username === ME.username;

  return (
    <article className={`gv-reel ${playing ? "is-playing" : ""}`} data-post={post.id} aria-label={`Post by @${post.username}`}>
      <div
        className="gv-reel-media"
        role="button"
        tabIndex={0}
        aria-label={isVideo ? (playing ? "Pause video" : "Play video") : "Double-tap to like"}
        onClick={() => isVideo && setPlaying((value) => !value)}
        onKeyDown={(event) => {
          if (isVideo && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            setPlaying((value) => !value);
          }
        }}
        onDoubleClick={() => {
          onLike(post.id, true);
          setBurst((value) => value + 1);
        }}
      >
        <PostArt art={post.art} variant="reel" />
      </div>
      <div className="gv-reel-shade" />
      {isVideo && <div className="gv-play"><Play size={30} fill="currentColor" /></div>}
      {burst > 0 && <Heart key={burst} className="gv-burst" fill="currentColor" strokeWidth={0} />}

      <div className="gv-reel-badges">
        <Badge tone={post.badgeTone}>{post.badge}</Badge>
        {post.challenge && <span className="gv-chip-glass"><Flame size={13} />{post.challenge}</span>}
        {post.created && <span className="gv-chip-glass"><TrendingUp size={13} />{post.onTimeline ? "Added to timeline" : "Just posted"}</span>}
      </div>

      <div className="gv-reel-info">
        <div className="gv-author">
          <Avatar username={post.username} name={post.name} size={40} ring />
          <div className="gv-author-text">
            <span className="gv-author-name">@{post.username}{post.verified && <Verified />}</span>
            <span className="gv-author-meta">{post.name} · {post.time}</span>
          </div>
          {!isMine && (
            <button type="button" className={`gv-follow ${isFollowing ? "is-following" : ""}`} aria-pressed={isFollowing} onClick={() => onFollow(post.username)}>
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>
        <p className="gv-caption">{post.caption}</p>
        {post.hashtags.length > 0 && <div className="gv-hashtags">{post.hashtags.map((tag) => <span key={tag}><i>#</i>{tag.slice(1)}</span>)}</div>}
        <div className="gv-audio-row">
          <Music2 size={14} />
          <div className="gv-marquee"><span>{post.audio} · {post.audio} · </span></div>
          <span className="gv-cat-chip">{post.category}</span>
        </div>
      </div>

      <div className="gv-rail">
        <RailButton label={formatCount(post.likes + (liked ? 1 : 0))} active={liked} kind="like" aria={liked ? "Unlike" : "Like"} onClick={() => onLike(post.id)}>
          <Heart size={28} fill={liked ? "currentColor" : "none"} />
        </RailButton>
        <RailButton label={formatCount(post.comments)} aria="Open comments" onClick={() => onComment(post.id)}>
          <MessageCircle size={27} />
        </RailButton>
        <RailButton label={formatCount(post.saves + (saved ? 1 : 0))} active={saved} kind="save" aria={saved ? "Remove from saved" : "Save"} onClick={() => onSave(post.id)}>
          <Bookmark size={26} fill={saved ? "currentColor" : "none"} />
        </RailButton>
        <RailButton label="Share" aria="Share" onClick={() => onShare(post)}>
          <Send size={25} />
        </RailButton>
        <div className="gv-disc" aria-hidden="true">
          <Avatar username={post.username} name={post.name} size={24} />
        </div>
      </div>

      {isVideo && <div className="gv-reel-progress"><span /></div>}
    </article>
  );
}

function RailButton({ label, active = false, kind, aria, onClick, children }: { label: string; active?: boolean; kind?: "like" | "save"; aria: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={`gv-rail-btn ${active ? `is-active is-${kind}` : ""}`} aria-label={`${aria}, ${label}`} aria-pressed={kind ? active : undefined} onClick={onClick}>
      <span className="gv-rail-icon">{children}</span>
      <span className="gv-rail-count">{label}</span>
    </button>
  );
}
