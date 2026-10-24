import { readFileSync } from "node:fs";
import type { CategoryId, ContentType, ModerationFinding, Severity } from "../contract.ts";
import { CATEGORIES } from "./categories.ts";
import { normalizeText, normalizeUsername } from "./normalize.ts";
import { FIRST_PERSON_TAIL, LABEL_RULES, NEGATORS, PED_MENTION, RISK_CUES, RULES } from "./rules.ts";
import type { Rule } from "./rules.ts";

export interface EngineFinding extends ModerationFinding {
  severity: Severity;
}

export interface RuleAssessment {
  findings: EngineFinding[];
  labels: CategoryId[];
  /** Rules that matched but were neutralized by context (kept for explanations and model escalation). */
  defused: { rule_id: string; category: CategoryId; why: string }[];
}

export interface EngineOptions {
  /** Extra hate-speech terms, one per line, loaded from a private file (never committed). */
  lexicon?: string[];
}

/** Loads a newline-separated lexicon file; lines starting with # are comments. */
export function loadLexicon(path: string): string[] {
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim().toLowerCase())
    .filter((l) => l && !l.startsWith("#"));
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Text of the current sentence before `index`. */
function sentenceTail(text: string, index: number): string {
  const before = text.slice(Math.max(0, index - 60), index);
  const cut = Math.max(before.lastIndexOf("."), before.lastIndexOf("!"), before.lastIndexOf("?"), before.lastIndexOf("\n"), before.lastIndexOf(","), before.lastIndexOf(";"));
  return cut >= 0 ? before.slice(cut + 1) : before;
}

function appliesTo(rule: Rule, type: ContentType): boolean {
  if (rule.only && !rule.only.includes(type)) return false;
  if (rule.except && rule.except.includes(type)) return false;
  return true;
}

export class RuleEngine {
  readonly #lexicon: RegExp | null;

  constructor(options: EngineOptions = {}) {
    const terms = (options.lexicon ?? []).filter(Boolean);
    this.#lexicon = terms.length ? new RegExp(String.raw`\b(?:${terms.map(escapeRegExp).join("|")})\b`) : null;
  }

  evaluate(type: ContentType, raw: string): RuleAssessment {
    const norm = type === "profile_username" ? normalizeUsername(raw) : normalizeText(raw);
    const plain = norm.display.toLowerCase();
    const result: RuleAssessment = { findings: [], labels: [], defused: [] };
    const privateContent = type === "direct_message";

    for (const rule of RULES) {
      if (!appliesTo(rule, type)) continue;
      const haystack = rule.on === "plain" ? plain : norm.folded;
      const match = rule.pattern.exec(haystack);
      if (!match) continue;

      let confidence = rule.confidence;
      let defusedWhy: string | null = null;
      const tail = sentenceTail(haystack, match.index);

      if (rule.negatable && NEGATORS.test(tail)) defusedWhy = "negated (discussion or warning, not encouragement)";
      else if (rule.firstPersonExempt && FIRST_PERSON_TAIL.test(tail)) defusedWhy = "describes the speaker's own experience";
      else {
        for (const ctx of rule.context ?? []) {
          if (!ctx.cue.test(haystack)) continue;
          if (ctx.effect === "drop") {
            defusedWhy = "context indicates recovery, risk or warning discussion";
            break;
          }
          if (confidence === "high") confidence = "medium";
        }
      }

      if (defusedWhy) {
        result.defused.push({ rule_id: rule.id, category: rule.category, why: defusedWhy });
        if (rule.defusedLabel) pushUnique(result.labels, rule.defusedLabel);
        continue;
      }

      result.findings.push({
        category: rule.category,
        rule_id: rule.id,
        confidence,
        severity: rule.severity ?? CATEGORIES[rule.category].severity,
        note: rule.note,
        ...(privateContent ? {} : { excerpt: match[0].slice(0, 80) }),
      });
    }

    if (this.#lexicon) {
      const m = this.#lexicon.exec(norm.folded);
      if (m) {
        result.findings.push({ category: "hate_speech", rule_id: "hate.lexicon", confidence: "high", severity: "critical", note: "Matches the curated hate-speech lexicon." });
      }
    }

    for (const rule of LABEL_RULES) {
      if (rule.pattern.test(norm.folded)) pushUnique(result.labels, rule.label);
    }
    if (PED_MENTION.test(norm.folded) && RISK_CUES.test(norm.folded)) pushUnique(result.labels, "ped_risk_discussion");
    // Promotion overrides disclosure framing; keep the label only when nothing PED-related was flagged.
    if (result.findings.some((f) => f.category === "ped_promotion" || f.category === "drug_sales")) {
      result.labels = result.labels.filter((l) => l !== "ped_disclosure" && l !== "ped_risk_discussion");
    }
    if (result.findings.length) result.labels = result.labels.filter((l) => l !== "safe_fitness");
    return result;
  }
}

function pushUnique<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value);
}
