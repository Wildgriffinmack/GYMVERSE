import type { ModelAdapter, ModelAssessment, ModelHealth, ModelInput } from "./adapter.ts";
import { ModelOutputError, parseAssessment } from "./adapter.ts";
import { ASSESSMENT_SCHEMA, systemPrompt, userPrompt } from "./prompt.ts";

export interface OllamaOptions {
  baseUrl: string;
  model: string;
  /** false | "low" | "medium" | "high". Reasoning models (gpt-oss) accept levels; others accept false. */
  think: boolean | "low" | "medium" | "high";
  keepAlive?: string;
}

/** Talks to a local Ollama runtime over its HTTP API. No API keys, no external calls. */
export class OllamaAdapter implements ModelAdapter {
  readonly provider = "ollama";
  readonly model: string;
  readonly #opts: OllamaOptions;

  constructor(opts: OllamaOptions) {
    this.#opts = { ...opts, baseUrl: opts.baseUrl.replace(/\/+$/, "") };
    this.model = opts.model;
  }

  async health(signal?: AbortSignal): Promise<ModelHealth> {
    try {
      const res = await fetch(`${this.#opts.baseUrl}/api/tags`, { signal: signal ?? AbortSignal.timeout(2000) });
      if (!res.ok) return { ok: false, detail: `Ollama responded ${res.status}` };
      const body = (await res.json()) as { models?: { name?: string }[] };
      const names = (body.models ?? []).map((m) => m.name ?? "");
      const wanted = this.model.includes(":") ? this.model : `${this.model}:latest`;
      return names.includes(wanted) || names.includes(this.model)
        ? { ok: true, detail: `${this.model} ready` }
        : { ok: false, detail: `model "${this.model}" is not pulled (run: ollama pull ${this.model})` };
    } catch (error) {
      return { ok: false, detail: `Ollama unreachable at ${this.#opts.baseUrl} (${(error as Error).name})` };
    }
  }

  async assess(input: ModelInput, signal: AbortSignal): Promise<ModelAssessment> {
    const res = await fetch(`${this.#opts.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal,
      body: JSON.stringify({
        model: this.model,
        stream: false,
        format: ASSESSMENT_SCHEMA,
        think: this.#opts.think,
        keep_alive: this.#opts.keepAlive ?? "10m",
        options: { temperature: 0 },
        messages: [
          { role: "system", content: systemPrompt() },
          { role: "user", content: userPrompt(input) },
        ],
      }),
    });
    if (!res.ok) throw new ModelOutputError(`Ollama responded ${res.status}`);
    const body = (await res.json()) as { message?: { content?: unknown } };
    return parseAssessment(body.message?.content);
  }
}
