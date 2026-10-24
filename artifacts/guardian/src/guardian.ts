import { randomUUID } from "node:crypto";
import type { CategoryId, ModerationDecision, ModerationRequest } from "./contract.ts";
import type { Logger } from "./log.ts";
import type { MediaModerator } from "./media/moderator.ts";
import type { ModelAdapter } from "./model/adapter.ts";
import { QueueFullError, TaskTimeoutError } from "./model/queue.ts";
import type { BoundedQueue } from "./model/queue.ts";
import { CATEGORIES, POLICY_VERSION } from "./policy/categories.ts";
import { combineWithModel, decideFromRules, modelUnavailable } from "./policy/decide.ts";
import type { Verdict } from "./policy/decide.ts";
import type { RuleAssessment, RuleEngine } from "./policy/engine.ts";
import type { ReviewStore } from "./review/store.ts";

export interface GuardianDeps {
  engine: RuleEngine;
  store: ReviewStore;
  media: MediaModerator;
  model: ModelAdapter | null;
  queue: BoundedQueue;
  log: Logger;
  /** Also ask the model about content the rules approved (higher recall, more GPU load). */
  screenAll?: boolean;
}

/** The moderation pipeline: rules → (optional) local model → decision → review queue. */
export class Guardian {
  readonly #d: GuardianDeps;

  constructor(deps: GuardianDeps) {
    this.#d = deps;
  }

  get modelInfo(): { provider: string; model: string } | null {
    return this.#d.model ? { provider: this.#d.model.provider, model: this.#d.model.model } : null;
  }

  async moderate(req: ModerationRequest): Promise<ModerationDecision> {
    const started = performance.now();
    const text = req.content_type === "user_report" ? [req.report?.target_text, req.report?.details].filter(Boolean).join("\n") : (req.text ?? "");
    const ra = text.trim() ? this.#d.engine.evaluate(req.report?.target_content_type ?? req.content_type, text) : { findings: [], labels: [], defused: [] };
    let verdict = decideFromRules(ra);

    if (req.content_type === "user_report") {
      verdict = reportVerdict(verdict, req.report!.reason);
    } else if (req.content_type === "image" || req.content_type === "video" || req.media?.length) {
      const media = await this.#d.media.assess(req.media ?? [{ kind: req.content_type === "video" ? "video" : "image" }], AbortSignal.timeout(5000));
      if (!media.supported && verdict.status !== "rejected") {
        verdict = {
          ...verdict,
          status: "needs_review",
          categories: verdict.categories.length ? verdict.categories : ["needs_human_review"],
          reason: verdict.status === "needs_review" ? `${verdict.reason} ${media.note}` : media.note,
          requires_human_review: true,
        };
      }
    } else {
      verdict = await this.#maybeAskModel(req, text, ra, verdict);
    }

    const decision: ModerationDecision = {
      decision_id: `dec_${randomUUID().slice(0, 12)}`,
      content_type: req.content_type,
      ...verdict,
      findings: ra.findings.map(({ severity: _s, ...f }) => f),
      policy_version: POLICY_VERSION,
      ...(req.client_ref ? { client_ref: req.client_ref } : {}),
    };
    const stored = req.content_type === "user_report" ? (req.report?.target_text ?? null) : text || null;
    if (decision.status === "needs_review") decision.review_id = this.#d.store.enqueue(decision, stored ?? undefined, req.author_id);
    else if (decision.status === "rejected") this.#d.store.recordAutoReject(decision, stored ?? undefined, req.author_id);

    // Never log content: ids, type, outcome and timing only.
    this.#d.log.info("moderation.decision", {
      decision_id: decision.decision_id,
      content_type: decision.content_type,
      status: decision.status,
      categories: decision.categories,
      source: decision.source,
      ms: Math.round(performance.now() - started),
    });
    return decision;
  }

  async #maybeAskModel(req: ModerationRequest, text: string, ra: RuleAssessment, verdict: Verdict): Promise<Verdict> {
    const model = this.#d.model;
    const ambiguous = verdict.status === "needs_review";
    const screen = this.#d.screenAll && verdict.status === "approved" && text.trim().length > 0;
    if (!model || (!ambiguous && !screen)) return verdict;
    try {
      const assessment = await this.#d.queue.run((signal) =>
        model.assess({ content_type: req.content_type, text, rule_hints: [...ra.findings, ...ra.defused].map((f) => ({ category: f.category, rule_id: f.rule_id })) }, signal),
      );
      return combineWithModel(verdict, ra, assessment);
    } catch (error) {
      const why = error instanceof QueueFullError ? "queue full" : error instanceof TaskTimeoutError ? "timed out" : (error as Error).name === "ModelOutputError" ? "invalid model output" : "model unreachable";
      this.#d.log.warn("model.unavailable", { reason: why });
      // Content the rules already approved stays approved when only optional screening failed.
      return screen && !ambiguous ? verdict : modelUnavailable(verdict, why);
    }
  }
}

/** User reports always go to a human; the reported reason sets the floor for priority. */
function reportVerdict(rules: Verdict, reason: CategoryId): Verdict {
  const categories = [...new Set([reason, ...rules.categories])].filter((c) => !CATEGORIES[c].informational);
  const reasonWeight = { info: 0.3, low: 0.4, medium: 0.55, high: 0.7, critical: 0.85 }[CATEGORIES[reason].severity];
  return {
    status: "needs_review",
    risk_score: Math.max(rules.risk_score, reasonWeight),
    categories: categories.length ? categories : ["needs_human_review"],
    labels: rules.labels,
    reason: `User report: ${CATEGORIES[reason].label}.${rules.status !== "approved" ? ` Rules also flagged: ${rules.reason}` : ""}`,
    source: "local_rules",
    requires_human_review: true,
    retryable: false,
  };
}
