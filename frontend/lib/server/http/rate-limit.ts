export type RateLimitRule = { limit: number; windowMs: number };
export type RateLimitDecision = { allowed: boolean; remaining: number; retryAfterSeconds: number };

type Bucket = { count: number; resetAt: number };

/**
 * 고정 창 방식 요청 제한. 서버 인스턴스 한 대의 메모리에만 남는 최소 방어선이다.
 * 여러 인스턴스를 합친 제한은 Vercel Firewall 규칙으로 건다.
 */
export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private readonly rule: RateLimitRule;
  private readonly now: () => number;
  private readonly maxKeys: number;

  constructor(rule: RateLimitRule, now: () => number = Date.now, maxKeys = 10_000) {
    if (rule.limit < 1 || rule.windowMs < 1) throw new RangeError("rate limit rule must be positive");
    this.rule = rule;
    this.now = now;
    this.maxKeys = maxKeys;
  }

  hit(key: string): RateLimitDecision {
    const now = this.now();
    let bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      if (!bucket) this.makeRoom(now);
      bucket = { count: 0, resetAt: now + this.rule.windowMs };
      this.buckets.set(key, bucket);
    }

    bucket.count += 1;
    const allowed = bucket.count <= this.rule.limit;
    return {
      allowed,
      remaining: Math.max(0, this.rule.limit - bucket.count),
      retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  get size(): number {
    return this.buckets.size;
  }

  private makeRoom(now: number) {
    if (this.buckets.size < this.maxKeys) return;
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
    while (this.buckets.size >= this.maxKeys) {
      const oldest = this.buckets.keys().next();
      if (oldest.done) break;
      this.buckets.delete(oldest.value);
    }
  }
}
