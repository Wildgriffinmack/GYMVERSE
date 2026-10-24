import type { ContentType, ModerationRequest } from "../src/contract.ts";
import { Guardian } from "../src/guardian.ts";
import { silentLogger } from "../src/log.ts";
import { UnimplementedMediaModerator } from "../src/media/moderator.ts";
import type { ModelAdapter, ModelAssessment, ModelInput } from "../src/model/adapter.ts";
import { BoundedQueue } from "../src/model/queue.ts";
import { RuleEngine } from "../src/policy/engine.ts";
import { ReviewStore } from "../src/review/store.ts";

export function buildTestGuardian(opts: { model?: ModelAdapter | null; timeoutMs?: number; concurrency?: number; maxWaiting?: number; screenAll?: boolean; lexicon?: string[] } = {}) {
  const store = new ReviewStore();
  const queue = new BoundedQueue({ concurrency: opts.concurrency ?? 2, maxWaiting: opts.maxWaiting ?? 8, timeoutMs: opts.timeoutMs ?? 500 });
  const guardian = new Guardian({
    engine: new RuleEngine({ lexicon: opts.lexicon }),
    store,
    media: new UnimplementedMediaModerator(),
    model: opts.model ?? null,
    queue,
    log: silentLogger,
    screenAll: opts.screenAll,
  });
  return { guardian, store, queue };
}

export function req(content_type: ContentType, text: string, extra: Partial<ModerationRequest> = {}): ModerationRequest {
  return { content_type, text, author_id: "tester", ...extra };
}

/** Scriptable model used to test decision policy without a real runtime. */
export class FakeModel implements ModelAdapter {
  readonly provider = "fake";
  readonly model = "fake-1";
  calls: ModelInput[] = [];
  readonly #behavior: (input: ModelInput, signal: AbortSignal) => Promise<ModelAssessment>;

  constructor(behavior: (input: ModelInput, signal: AbortSignal) => Promise<ModelAssessment>) {
    this.#behavior = behavior;
  }

  async health() {
    return { ok: true, detail: "fake" };
  }

  assess(input: ModelInput, signal: AbortSignal): Promise<ModelAssessment> {
    this.calls.push(input);
    return this.#behavior(input, signal);
  }
}

export const answer = (a: ModelAssessment) => new FakeModel(async () => a);
export const never = () =>
  new FakeModel(
    (_i, signal) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(signal.reason), { once: true });
      }),
  );
