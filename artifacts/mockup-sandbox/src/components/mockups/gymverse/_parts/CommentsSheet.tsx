import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Heart, Send, X } from "lucide-react";
import type { Comment, Post } from "./data";
import { ME } from "./data";
import { Avatar } from "./ui";
import { formatCount } from "./utils";

export function CommentsSheet({ post, comments, onAdd, onClose }: { post: Post; comments: Comment[]; onAdd: (text: string) => void; onClose: () => void }) {
  const [draft, setDraft] = useState("");
  const [liked, setLiked] = useState<string[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    onAdd(draft.trim());
    setDraft("");
    requestAnimationFrame(() => listRef.current?.scrollTo({ top: 0, behavior: "smooth" }));
  };

  return (
    <>
      <div className="gv-sheet-backdrop" onClick={onClose} />
      <section className="gv-sheet" role="dialog" aria-modal="true" aria-label="Comments">
        <div className="gv-sheet-handle" />
        <header className="gv-sheet-head">
          <span className="gv-sheet-title">{formatCount(post.comments)} comments</span>
          <button type="button" className="gv-icon-btn is-sm" aria-label="Close comments" onClick={onClose}><X size={18} /></button>
        </header>
        <div className="gv-comment-list" ref={listRef}>
          {comments.map((comment) => {
            const isLiked = liked.includes(comment.id);
            return (
              <div key={comment.id} className="gv-comment">
                <Avatar username={comment.user} name={comment.user} size={34} />
                <div>
                  <div className="gv-comment-meta"><b>@{comment.user}</b><time>{comment.time}</time></div>
                  <p>{comment.text}</p>
                </div>
                <button
                  type="button"
                  className={`gv-comment-like ${isLiked ? "is-active" : ""}`}
                  aria-pressed={isLiked}
                  aria-label={isLiked ? "Unlike comment" : "Like comment"}
                  onClick={() => setLiked((current) => (current.includes(comment.id) ? current.filter((id) => id !== comment.id) : [...current, comment.id]))}
                >
                  <Heart size={15} fill={isLiked ? "currentColor" : "none"} />
                  <span>{formatCount(comment.likes + (isLiked ? 1 : 0))}</span>
                </button>
              </div>
            );
          })}
        </div>
        <form className="gv-comment-form" onSubmit={submit}>
          <Avatar username={ME.username} name={ME.name} size={34} />
          <input className="gv-comment-input" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Hype up @${post.username}…`} aria-label="Write a comment" />
          <button type="submit" className="gv-send" aria-label="Post comment" disabled={!draft.trim()}><Send size={17} /></button>
        </form>
      </section>
    </>
  );
}
