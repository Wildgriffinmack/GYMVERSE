import type { CategoryId, Severity } from "../contract.ts";

export const POLICY_VERSION = "2026-10-23.1";

export interface CategoryInfo {
  label: string;
  severity: Severity;
  /** Informational categories are allowed and returned as `labels`, never as violations. */
  informational: boolean;
  /** Sensitive categories always end with a human, even if a model is confident. */
  alwaysHumanReview: boolean;
}

export const CATEGORIES: Record<CategoryId, CategoryInfo> = {
  safe_fitness: { label: "Safe fitness content", severity: "info", informational: true, alwaysHumanReview: false },
  ped_disclosure: { label: "PED disclosure", severity: "info", informational: true, alwaysHumanReview: false },
  ped_risk_discussion: { label: "PED risk discussion", severity: "info", informational: true, alwaysHumanReview: false },
  body_shaming: { label: "Body shaming", severity: "high", informational: false, alwaysHumanReview: false },
  harassment: { label: "Bullying / harassment", severity: "high", informational: false, alwaysHumanReview: false },
  hate_speech: { label: "Hate speech", severity: "critical", informational: false, alwaysHumanReview: true },
  threats_violence: { label: "Threats or violence", severity: "critical", informational: false, alwaysHumanReview: true },
  sexual_content: { label: "Sexual content / sexual harassment", severity: "high", informational: false, alwaysHumanReview: false },
  privacy_violation: { label: "Privacy violation", severity: "high", informational: false, alwaysHumanReview: true },
  dangerous_advice: { label: "Dangerous fitness advice", severity: "medium", informational: false, alwaysHumanReview: false },
  eating_disorder: { label: "Eating disorder / starvation content", severity: "high", informational: false, alwaysHumanReview: true },
  false_medical_claims: { label: "False medical or supplement claim", severity: "medium", informational: false, alwaysHumanReview: false },
  scam: { label: "Scam or suspicious product claim", severity: "high", informational: false, alwaysHumanReview: false },
  ped_promotion: { label: "PED promotion", severity: "high", informational: false, alwaysHumanReview: false },
  drug_sales: { label: "Drug sales or sourcing", severity: "critical", informational: false, alwaysHumanReview: false },
  copyright_concern: { label: "Stolen content / copyright concern", severity: "low", informational: false, alwaysHumanReview: true },
  needs_human_review: { label: "Needs human review", severity: "medium", informational: false, alwaysHumanReview: true },
};

export const CATEGORY_IDS = Object.keys(CATEGORIES) as CategoryId[];

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === "string" && Object.hasOwn(CATEGORIES, value);
}

const SEVERITY_RANK: Record<Severity, number> = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };

export function maxSeverity(categories: CategoryId[]): Severity {
  let best: Severity = "info";
  for (const id of categories) {
    const s = CATEGORIES[id].severity;
    if (SEVERITY_RANK[s] > SEVERITY_RANK[best]) best = s;
  }
  return best;
}

export function severityRank(s: Severity): number {
  return SEVERITY_RANK[s];
}
