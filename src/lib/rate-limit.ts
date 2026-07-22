// In-memory sliding-window rate limiter for public endpoints (RSVP, access
// code attempts, reports). Per-instance only — good enough for a single
// Vercel region at MVP scale; swap for Upstash Redis when scaling out
// (documented in docs/deployment-guide.md).

const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  // Opportunistic cleanup to bound memory.
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
  }
  return true;
}

export function resetRateLimits() {
  buckets.clear();
}
