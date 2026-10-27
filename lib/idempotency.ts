// Protects against double submission: retries carrying the same Idempotency-Key get the same
// result instead of creating a second reservation. In-memory, per server instance.
export type Stored = { status: number; body: unknown };

const g = globalThis as unknown as { __gzIdem?: { done: Map<string, { at: number; value: Stored }>; running: Map<string, Promise<Stored>> } };
const state = (g.__gzIdem ??= { done: new Map(), running: new Map() });
const TTL_MS = 10 * 60 * 1000;

export const validKey = (k: string | null): k is string => !!k && /^[A-Za-z0-9_-]{8,64}$/.test(k);

export async function once(key: string, fn: () => Promise<Stored>): Promise<Stored> {
  const now = Date.now();
  if (state.done.size > 500) for (const [k, v] of state.done) if (now - v.at > TTL_MS) state.done.delete(k);

  const cached = state.done.get(key);
  if (cached && now - cached.at <= TTL_MS) return cached.value;
  const running = state.running.get(key);
  if (running) return running;

  const p = fn()
    .then((value) => {
      if (value.status < 300) state.done.set(key, { at: Date.now(), value }); // never cache failures
      return value;
    })
    .finally(() => state.running.delete(key));
  state.running.set(key, p);
  return p;
}
