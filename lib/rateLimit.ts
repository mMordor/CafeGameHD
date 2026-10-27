// In-memory fixed-window limiter. Per server instance only: with several instances each keeps
// its own counters (see README). Good enough for one server; use a shared store when scaling out.
type Bucket = { count: number; resetAt: number };
const g = globalThis as unknown as { __gzBuckets?: Map<string, Bucket> };
const buckets: Map<string, Bucket> = (g.__gzBuckets ??= new Map());

function prune(now: number) {
  if (buckets.size < 5000) return;
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
}

// Counts one hit and reports whether the caller is still within the limit.
export function hit(key: string, limit: number, windowMs: number, now: number = Date.now()): { ok: boolean; retryAfterSec: number } {
  prune(now);
  let b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(key, b);
  }
  b.count++;
  return { ok: b.count <= limit, retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) };
}

// Looks at a key without counting (used to block login attempts before checking the password).
export function peek(key: string, limit: number, now: number = Date.now()): { ok: boolean; retryAfterSec: number } {
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) return { ok: true, retryAfterSec: 0 };
  return { ok: b.count < limit, retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) };
}

export function clear(key: string) {
  buckets.delete(key);
}

export function resetAll() {
  buckets.clear();
}
