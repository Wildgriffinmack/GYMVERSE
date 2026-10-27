import { useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, Camera, Clapperboard, Dumbbell, Flame, ImagePlus, Sparkles, TrendingUp, Trophy, Video, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PostType } from "./data";
import { ME, POST_CATEGORIES, POST_TYPES } from "./data";
import { PostArt } from "./PostArt";
import { Avatar, Badge, PageHeader } from "./ui";
import type { PostDraft } from "./utils";
import { buildPost, parseHashtags } from "./utils";

const TYPE_ICONS: Record<PostType, LucideIcon> = {
  Video,
  Photo: Camera,
  "Gym Edit": Clapperboard,
  Workout: Dumbbell,
  Transformation: TrendingUp,
  PR: Trophy,
  Motivation: Flame,
};

const CAPTION_LIMIT = 150;

export function CreateScreen({ onPost, onClose, onToast }: { onPost: (draft: PostDraft) => void; onClose: () => void; onToast: (message: string) => void }) {
  const [postType, setPostType] = useState<PostType>("Video");
  const [category, setCategory] = useState<string>("Workout");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [addToTimeline, setAddToTimeline] = useState(false);
  const [hasMedia, setHasMedia] = useState(false);
  const [shake, setShake] = useState(false);
  const captionRef = useRef<HTMLTextAreaElement>(null);

  const draft: PostDraft = { postType, category, caption, hashtags, addToTimeline };
  const preview = useMemo(() => buildPost({ postType, category, caption: caption || "Your caption here", hashtags, addToTimeline }), [postType, category, caption, hashtags, addToTimeline]);
  const tags = parseHashtags(hashtags);

  const chooseType = (type: PostType) => {
    setPostType(type);
    if (type === "Gym Edit") setCategory("Motivation");
    else if (type === "Workout" || type === "Transformation" || type === "PR" || type === "Motivation") setCategory(type);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!caption.trim()) {
      setShake(true);
      captionRef.current?.focus();
      onToast("Add a caption before you post.");
      return;
    }
    onPost(draft);
  };

  return (
    <form className="gv-page gv-create" onSubmit={submit}>
      <PageHeader
        kicker="Put your work out there"
        title="New post"
        trailing={<button type="button" className="gv-icon-btn" aria-label="Discard post" onClick={onClose}><X size={20} /></button>}
      />

      <div className={`gv-preview ${hasMedia ? "has-media" : ""}`}>
        <PostArt art={preview.art} variant="card" />
        <div className="gv-preview-shade" />
        <div className="gv-preview-top">
          <Badge tone={preview.badgeTone}>{preview.badge}</Badge>
          {hasMedia && <span className="gv-chip-glass"><Sparkles size={13} />Live preview</span>}
        </div>
        <div className="gv-preview-caption">
          <div className="gv-author">
            <Avatar username={ME.username} name={ME.name} size={30} ring />
            <span className="gv-author-name">@{ME.username}</span>
          </div>
          <p>{caption || "Your caption shows up here."}</p>
        </div>
        {hasMedia ? (
          <button type="button" className="gv-preview-remove" onClick={() => { setHasMedia(false); onToast("Demo media removed."); }}>
            <X size={14} /> Remove
          </button>
        ) : (
          <button type="button" className="gv-drop" onClick={() => { setHasMedia(true); onToast(`${postType} placeholder added.`); }}>
            <span className="gv-drop-icon"><ImagePlus size={26} /></span>
            <b>Tap to add {postType === "Photo" ? "a photo" : "a clip"}</b>
            <small>Demo media · no real upload</small>
          </button>
        )}
      </div>

      <section className="gv-form-block">
        <span className="gv-label">Post type</span>
        <div className="gv-pill-scroll" role="group" aria-label="Post type">
          {POST_TYPES.map((type) => {
            const Icon = TYPE_ICONS[type];
            return (
              <button key={type} type="button" className={`gv-pill ${postType === type ? "is-active" : ""}`} aria-pressed={postType === type} onClick={() => chooseType(type)}>
                <Icon size={15} />{type}
              </button>
            );
          })}
        </div>
      </section>

      <section className="gv-form-block">
        <div className="gv-form-label">
          <label className="gv-label" htmlFor="gv-caption">Caption</label>
          <span className={`gv-counter ${caption.length > CAPTION_LIMIT - 20 ? "is-warn" : ""}`}>{caption.length}/{CAPTION_LIMIT}</span>
        </div>
        <textarea
          id="gv-caption"
          ref={captionRef}
          className={`gv-textarea ${shake ? "is-shake" : ""}`}
          onAnimationEnd={() => setShake(false)}
          value={caption}
          maxLength={CAPTION_LIMIT}
          onChange={(event) => setCaption(event.target.value)}
          placeholder="What did you show up for today?"
          rows={3}
        />
      </section>

      <section className="gv-form-block">
        <label className="gv-label" htmlFor="gv-hashtags">Hashtags</label>
        <div className="gv-hashtag-field">
          <span>#</span>
          <input id="gv-hashtags" value={hashtags} onChange={(event) => setHashtags(event.target.value)} placeholder="BenchPR Consistency LegDay" />
        </div>
        {tags.length > 0 && <div className="gv-tag-preview">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
      </section>

      <section className="gv-form-block">
        <span className="gv-label">Category</span>
        <div className="gv-pill-wrap" role="group" aria-label="Category">
          {POST_CATEGORIES.map((item) => (
            <button key={item} type="button" className={`gv-pill is-soft ${category === item ? "is-active" : ""}`} aria-pressed={category === item} onClick={() => setCategory(item)}>
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="gv-form-block">
        <button type="button" className={`gv-toggle ${addToTimeline ? "is-on" : ""}`} role="switch" aria-checked={addToTimeline} onClick={() => setAddToTimeline((value) => !value)}>
          <span className="gv-toggle-icon"><TrendingUp size={18} /></span>
          <span className="gv-toggle-text">
            <b>Add to Progress Timeline</b>
            <small>Keep the moments that matter.</small>
          </span>
          <span className="gv-switch"><i /></span>
        </button>
      </section>

      <div className="gv-form-block">
        <button type="submit" className="gv-cta is-block">
          Post to GYMX <ArrowRight size={20} strokeWidth={2.6} />
        </button>
        <p className="gv-fine-print">Demo only. Your post appears in this session’s feed.</p>
      </div>
    </form>
  );
}
