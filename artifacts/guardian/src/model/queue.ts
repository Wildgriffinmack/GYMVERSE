export class QueueFullError extends Error {
  override name = "QueueFullError";
}

export class TaskTimeoutError extends Error {
  override name = "TaskTimeoutError";
}

export interface QueueStats {
  active: number;
  waiting: number;
  concurrency: number;
  maxWaiting: number;
}

/**
 * Bounded-concurrency queue for model calls.
 * - At most `concurrency` tasks run at once (protects the GPU/CPU).
 * - At most `maxWaiting` tasks wait; beyond that callers get QueueFullError immediately.
 * - Each task has a total time budget (waiting + running) and receives an AbortSignal.
 */
export class BoundedQueue {
  readonly #concurrency: number;
  readonly #maxWaiting: number;
  readonly #timeoutMs: number;
  #active = 0;
  readonly #waiting: (() => void)[] = [];

  constructor(options: { concurrency: number; maxWaiting: number; timeoutMs: number }) {
    this.#concurrency = Math.max(1, options.concurrency);
    this.#maxWaiting = Math.max(0, options.maxWaiting);
    this.#timeoutMs = options.timeoutMs;
  }

  stats(): QueueStats {
    return { active: this.#active, waiting: this.#waiting.length, concurrency: this.#concurrency, maxWaiting: this.#maxWaiting };
  }

  async run<T>(task: (signal: AbortSignal) => Promise<T>): Promise<T> {
    if (this.#active >= this.#concurrency && this.#waiting.length >= this.#maxWaiting) {
      throw new QueueFullError("assessment queue is full");
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new TaskTimeoutError(`timed out after ${this.#timeoutMs}ms`)), this.#timeoutMs);
    try {
      await this.#acquire(controller.signal);
      try {
        return await raceAbort(task(controller.signal), controller.signal);
      } finally {
        this.#release();
      }
    } finally {
      clearTimeout(timer);
    }
  }

  #acquire(signal: AbortSignal): Promise<void> {
    if (this.#active < this.#concurrency) {
      this.#active++;
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const grant = () => {
        signal.removeEventListener("abort", onAbort);
        this.#active++;
        resolve();
      };
      const onAbort = () => {
        const i = this.#waiting.indexOf(grant);
        if (i >= 0) this.#waiting.splice(i, 1);
        reject(signal.reason);
      };
      signal.addEventListener("abort", onAbort, { once: true });
      this.#waiting.push(grant);
    });
  }

  #release(): void {
    this.#active--;
    const next = this.#waiting.shift();
    if (next) next();
  }
}

function raceAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(signal.reason);
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (v) => {
        signal.removeEventListener("abort", onAbort);
        resolve(v);
      },
      (e) => {
        signal.removeEventListener("abort", onAbort);
        reject(e);
      },
    );
  });
}
