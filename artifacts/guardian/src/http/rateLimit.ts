/** Token-bucket rate limiter keyed by client address. In-memory; use a shared store when running several instances. */
export class RateLimiter {
  readonly #capacity: number;
  readonly #refillPerMs: number;
  readonly #buckets = new Map<string, { tokens: number; at: number }>();
  readonly #now: () => number;

  constructor(perMinute: number, now: () => number = Date.now) {
    this.#capacity = perMinute;
    this.#refillPerMs = perMinute / 60000;
    this.#now = now;
  }

  /** Returns 0 when allowed, otherwise seconds until the next request is allowed. */
  take(key: string): number {
    const now = this.#now();
    const b = this.#buckets.get(key) ?? { tokens: this.#capacity, at: now };
    b.tokens = Math.min(this.#capacity, b.tokens + (now - b.at) * this.#refillPerMs);
    b.at = now;
    if (b.tokens >= 1) {
      b.tokens -= 1;
      this.#buckets.set(key, b);
      this.#sweep(now);
      return 0;
    }
    this.#buckets.set(key, b);
    return Math.max(1, Math.ceil((1 - b.tokens) / this.#refillPerMs / 1000));
  }

  #sweep(now: number): void {
    if (this.#buckets.size < 10000) return;
    for (const [k, b] of this.#buckets) if (now - b.at > 120000) this.#buckets.delete(k);
  }
}
