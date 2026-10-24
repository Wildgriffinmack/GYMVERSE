import { randomUUID } from "node:crypto";
import type {
  CategoryId,
  ContentType,
  DecisionSource,
  HistoryEntry,
  ModerationDecision,
  ModerationFinding,
  ModeratorActionType,
  ReviewItemView,
  ReviewStatus,
  Severity,
} from "../contract.ts";
import { maxSeverity } from "../policy/categories.ts";

interface ReviewRecord {
  id: string;
  decision_id: string;
  content_type: ContentType;
  status: ReviewStatus;
  severity: Severity;
  risk_score: number;
  categories: CategoryId[];
  labels: CategoryId[];
  reason: string;
  source: DecisionSource;
  /** Retained only while needed. Private content is purged as soon as a decision is made. */
  text: string | null;
  private: boolean;
  author_id?: string;
  findings: ModerationFinding[];
  created_at: string;
  updated_at: string;
}

export interface QueueFilter {
  status?: ReviewStatus | "all";
  content_type?: ContentType;
  severity?: Severity;
}

export class NotFoundError extends Error {
  override name = "NotFoundError";
}
export class ConflictError extends Error {
  override name = "ConflictError";
}

const MAX_RECORDS = 5000;
const MAX_HISTORY = 10000;

/**
 * In-memory review store for the prototype. The class boundary is the seam for a
 * database-backed store later (same methods, persistent storage, row-level access control).
 */
export class ReviewStore {
  readonly #items = new Map<string, ReviewRecord>();
  readonly #history: HistoryEntry[] = [];
  readonly #now: () => Date;

  constructor(now: () => Date = () => new Date()) {
    this.#now = now;
  }

  /** Places a needs_review decision in the queue. Returns the review id. */
  enqueue(decision: ModerationDecision, text: string | undefined, authorId?: string): string {
    const rec = this.#record(decision, text, authorId, "pending");
    return rec.id;
  }

  /** Audit trail for automatic rejections so moderators can spot false positives. */
  recordAutoReject(decision: ModerationDecision, text: string | undefined, authorId?: string): string {
    const rec = this.#record(decision, text, authorId, "rejected");
    if (rec.private) rec.text = null;
    this.#log({ item: rec, action: "auto_reject", actor: "guardian", note: decision.reason });
    return rec.id;
  }

  list(filter: QueueFilter = {}): ReviewItemView[] {
    const status = filter.status ?? "pending";
    return [...this.#items.values()]
      .filter((r) => (status === "all" || r.status === status) && (!filter.content_type || r.content_type === filter.content_type) && (!filter.severity || r.severity === filter.severity))
      .sort((a, b) => b.risk_score - a.risk_score || b.created_at.localeCompare(a.created_at))
      .map(toView);
  }

  get(id: string): ReviewItemView {
    return toView(this.#require(id));
  }

  /** Reveals private content to a trust & safety reviewer. Always audited. */
  reveal(id: string, actor: string, note?: string): { id: string; text: string | null } {
    const rec = this.#require(id);
    if (!rec.private) return { id, text: rec.text };
    this.#log({ item: rec, action: "reveal_private", actor, note: note ?? "Private content viewed for review" });
    return { id, text: rec.text };
  }

  act(id: string, action: ModeratorActionType, actor: string, note?: string): ReviewItemView {
    const rec = this.#require(id);
    if (rec.status !== "pending") throw new ConflictError(`item is already ${rec.status}`);
    rec.status = action === "approve" ? "approved" : action === "reject" ? "rejected" : "edit_requested";
    rec.source = "human_moderator";
    rec.updated_at = this.#now().toISOString();
    if (rec.private) rec.text = null;
    this.#log({ item: rec, action, actor, note });
    return toView(rec);
  }

  history(limit = 100, contentType?: ContentType): HistoryEntry[] {
    const rows = contentType ? this.#history.filter((h) => h.content_type === contentType) : this.#history;
    return rows.slice(-limit).reverse();
  }

  counts(): Record<ReviewStatus, number> {
    const c: Record<ReviewStatus, number> = { pending: 0, approved: 0, rejected: 0, edit_requested: 0 };
    for (const r of this.#items.values()) c[r.status]++;
    return c;
  }

  #record(decision: ModerationDecision, text: string | undefined, authorId: string | undefined, status: ReviewStatus): ReviewRecord {
    const now = this.#now().toISOString();
    const isPrivate = decision.content_type === "direct_message";
    const rec: ReviewRecord = {
      id: `rv_${randomUUID().slice(0, 12)}`,
      decision_id: decision.decision_id,
      content_type: decision.content_type,
      status,
      severity: maxSeverity(decision.categories),
      risk_score: decision.risk_score,
      categories: decision.categories,
      labels: decision.labels,
      reason: decision.reason,
      source: decision.source,
      text: text ?? null,
      private: isPrivate,
      author_id: authorId,
      findings: isPrivate ? decision.findings.map(({ excerpt: _excerpt, ...rest }) => rest) : decision.findings,
      created_at: now,
      updated_at: now,
    };
    this.#items.set(rec.id, rec);
    this.#prune();
    return rec;
  }

  #require(id: string): ReviewRecord {
    const rec = this.#items.get(id);
    if (!rec) throw new NotFoundError("review item not found");
    return rec;
  }

  #log(e: { item: ReviewRecord; action: HistoryEntry["action"]; actor: string; note?: string }): void {
    this.#history.push({
      id: `h_${randomUUID().slice(0, 12)}`,
      at: this.#now().toISOString(),
      item_id: e.item.id,
      content_type: e.item.content_type,
      action: e.action,
      actor: e.actor,
      note: e.note,
      categories: e.item.categories,
    });
    if (this.#history.length > MAX_HISTORY) this.#history.splice(0, this.#history.length - MAX_HISTORY);
  }

  #prune(): void {
    if (this.#items.size <= MAX_RECORDS) return;
    for (const [id, rec] of this.#items) {
      if (this.#items.size <= MAX_RECORDS) break;
      if (rec.status !== "pending") this.#items.delete(id);
    }
  }
}

function toView(r: ReviewRecord): ReviewItemView {
  return {
    id: r.id,
    decision_id: r.decision_id,
    content_type: r.content_type,
    status: r.status,
    severity: r.severity,
    risk_score: r.risk_score,
    categories: r.categories,
    labels: r.labels,
    reason: r.reason,
    source: r.source,
    text: r.private ? null : r.text,
    private: r.private,
    content_note: r.private ? (r.text === null ? "Private message purged after decision." : "Private message — content withheld. Trust & Safety can reveal it (audited).") : r.text === null ? "No text content." : undefined,
    author_id: r.author_id,
    findings: r.findings,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}
