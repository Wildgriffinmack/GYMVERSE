import type { CategoryId, ContentType } from "../contract.ts";
import { isCategoryId } from "../policy/categories.ts";

/**
 * Model adapter boundary. Guardian only talks to models through this interface,
 * so Ollama can be swapped for llama.cpp, vLLM or another runtime without touching policy code.
 */
export interface ModelInput {
  content_type: ContentType;
  text: string;
  /** Rule hints so the model knows what to check; never the decision itself. */
  rule_hints: { category: CategoryId; rule_id: string }[];
}

export interface ModelAssessment {
  verdict: "allow" | "review" | "block";
  categories: CategoryId[];
  /** Self-reported 0..1. Treated as a hint, not a probability. */
  confidence: number;
  rationale: string;
}

export interface ModelHealth {
  ok: boolean;
  detail: string;
}

export interface ModelAdapter {
  readonly provider: string;
  readonly model: string;
  health(signal?: AbortSignal): Promise<ModelHealth>;
  assess(input: ModelInput, signal: AbortSignal): Promise<ModelAssessment>;
}

export class ModelOutputError extends Error {
  override name = "ModelOutputError";
}

const VERDICTS = new Set(["allow", "review", "block"]);

/** Validates untrusted model output. Anything malformed is rejected rather than guessed at. */
export function parseAssessment(raw: unknown): ModelAssessment {
  let value = raw;
  if (typeof value === "string") {
    const trimmed = value.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
    try {
      value = JSON.parse(trimmed);
    } catch {
      throw new ModelOutputError("model output is not valid JSON");
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ModelOutputError("model output is not an object");
  const o = value as Record<string, unknown>;
  if (typeof o.verdict !== "string" || !VERDICTS.has(o.verdict)) throw new ModelOutputError("invalid verdict");
  if (typeof o.confidence !== "number" || !Number.isFinite(o.confidence) || o.confidence < 0 || o.confidence > 1) throw new ModelOutputError("invalid confidence");
  if (!Array.isArray(o.categories)) throw new ModelOutputError("categories must be an array");
  const categories = [...new Set(o.categories.filter(isCategoryId))];
  const rationale = typeof o.rationale === "string" ? o.rationale.slice(0, 400) : "";
  if (!rationale) throw new ModelOutputError("missing rationale");
  return { verdict: o.verdict as ModelAssessment["verdict"], categories, confidence: o.confidence, rationale };
}
