import type { CategoryId, DecisionSource, ModerationStatus, Severity } from "../contract.ts";
import type { ModelAssessment } from "../model/adapter.ts";
import { CATEGORIES, severityRank } from "./categories.ts";
import type { RuleAssessment } from "./engine.ts";

export interface Verdict {
  status: ModerationStatus;
  risk_score: number;
  categories: CategoryId[];
  labels: CategoryId[];
  reason: string;
  source: DecisionSource;
  requires_human_review: boolean;
  retryable: boolean;
}

const SEVERITY_WEIGHT: Record<Severity, number> = { info: 0.05, low: 0.35, medium: 0.55, high: 0.75, critical: 0.9 };
const CONFIDENCE_WEIGHT = { high: 1, medium: 0.8 } as const;

/** Thresholds for trusting the local model. Model confidence is self-reported, so these are conservative. */
export const MODEL_ALLOW_MIN_CONFIDENCE = 0.85;
export const MODEL_BLOCK_MIN_CONFIDENCE = 0.85;

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function riskFromRules(ra: RuleAssessment): number {
  if (!ra.findings.length) return ra.labels.some((l) => l !== "safe_fitness") ? 0.08 : 0.03;
  const scores = ra.findings.map((f) => SEVERITY_WEIGHT[f.severity] * CONFIDENCE_WEIGHT[f.confidence]);
  return round(Math.min(0.98, Math.max(...scores) + 0.04 * (scores.length - 1)));
}

function describeLabels(labels: CategoryId[]): string {
  if (labels.includes("ped_disclosure") || labels.includes("ped_risk_discussion")) {
    return "PED disclosure or risk discussion is allowed; no promotion, sourcing or dosing detected.";
  }
  return "No policy concerns detected.";
}

/** Stage 1: decide from rules alone. */
export function decideFromRules(ra: RuleAssessment): Verdict {
  const categories = unique(ra.findings.map((f) => f.category));
  const risk = riskFromRules(ra);
  if (!ra.findings.length) {
    return { status: "approved", risk_score: risk, categories: [], labels: ra.labels, reason: describeLabels(ra.labels), source: "local_rules", requires_human_review: false, retryable: false };
  }
  const ordered = [...ra.findings].sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || (a.confidence === "high" ? -1 : 1));
  const top = ordered[0];
  const blocking = ordered.find((f) => f.confidence === "high" && severityRank(f.severity) >= severityRank("high"));
  if (blocking) {
    return {
      status: "rejected",
      risk_score: risk,
      categories,
      labels: ra.labels,
      reason: `${CATEGORIES[blocking.category].label}: ${blocking.note ?? "violates community guidelines."}`,
      source: "local_rules",
      requires_human_review: false,
      retryable: false,
    };
  }
  return {
    status: "needs_review",
    risk_score: risk,
    categories,
    labels: ra.labels,
    reason: `Possible ${CATEGORIES[top.category].label.toLowerCase()}: ${top.note ?? "needs context."}`,
    source: "local_rules",
    requires_human_review: true,
    retryable: false,
  };
}

/**
 * Stage 2: combine a rule verdict with a validated model assessment.
 * The model may resolve ambiguity, but it can never overrule a rule block, and
 * sensitive categories (threats, privacy, eating disorders, hate) always reach a human.
 */
export function combineWithModel(rules: Verdict, ra: RuleAssessment, model: ModelAssessment): Verdict {
  if (rules.status === "rejected") return rules;
  const modelViolations = model.categories.filter((c) => !CATEGORIES[c].informational);
  const modelLabels = model.categories.filter((c) => CATEGORIES[c].informational);
  const allCategories = unique([...rules.categories, ...modelViolations]);
  const labels = unique([...rules.labels, ...modelLabels]);
  const sensitive = allCategories.some((c) => CATEGORIES[c].alwaysHumanReview);
  const ruleWorst = ra.findings.reduce((m, f) => Math.max(m, severityRank(f.severity)), 0);
  const rationale = model.rationale.trim();

  if (model.verdict === "allow" && model.confidence >= MODEL_ALLOW_MIN_CONFIDENCE && !sensitive && ruleWorst < severityRank("critical")) {
    return {
      status: "approved",
      risk_score: round(Math.min(rules.risk_score, 0.3)),
      categories: [],
      labels,
      reason: rules.status === "approved" ? rules.reason : `Allowed in context: ${rationale}`,
      source: rules.status === "approved" ? "local_rules" : "rules_and_model",
      requires_human_review: false,
      retryable: false,
    };
  }

  const ruleSevere = ra.findings.some((f) => severityRank(f.severity) >= severityRank("high") && modelViolations.includes(f.category));
  if (model.verdict === "block" && model.confidence >= MODEL_BLOCK_MIN_CONFIDENCE && ruleSevere) {
    return {
      status: "rejected",
      risk_score: round(Math.max(rules.risk_score, 0.85)),
      categories: allCategories,
      labels,
      reason: `${rules.reason} Local model agrees: ${rationale}`,
      source: "rules_and_model",
      requires_human_review: false,
      retryable: false,
    };
  }

  if (rules.status === "approved" && (model.verdict === "allow" || model.confidence < 0.6)) return rules;

  const modelRisk = model.verdict === "block" ? 0.8 : model.verdict === "review" ? 0.6 : 0.4;
  return {
    status: "needs_review",
    risk_score: round(Math.max(rules.risk_score, modelRisk * Math.max(0.5, model.confidence))),
    categories: allCategories.length ? allCategories : ["needs_human_review"],
    labels,
    reason: rules.status === "approved" ? `Local model flagged for review: ${rationale}` : `${rules.reason} Model: ${rationale}`,
    source: rules.status === "approved" ? "local_model" : "rules_and_model",
    requires_human_review: true,
    retryable: false,
  };
}

/** Used when the model was required but could not answer: never approve, hold for a human or retry. */
export function modelUnavailable(rules: Verdict, why: string): Verdict {
  return {
    ...rules,
    status: rules.status === "rejected" ? "rejected" : "needs_review",
    categories: rules.categories.length ? rules.categories : ["needs_human_review"],
    reason: `${rules.reason} AI assessment unavailable (${why}); held for human review.`,
    requires_human_review: rules.status !== "rejected",
    retryable: rules.status !== "rejected",
  };
}
