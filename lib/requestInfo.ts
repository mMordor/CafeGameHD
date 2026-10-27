const trustProxy = () => process.env.TRUST_PROXY === "true";

// Rejects cross-site writes: the Origin header (when sent) must match this site's host.
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser clients; browsers always send Origin on cross-site POSTs
  const host = (trustProxy() ? req.headers.get("x-forwarded-host") : null) ?? req.headers.get("host") ?? new URL(req.url).host;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

// Returns a client IP ONLY when a trusted proxy is declared; otherwise null. X-Forwarded-For is
// attacker-controlled unless your own proxy overwrites it, so it is never trusted by default.
// With a single proxy the right-most entry is the one the proxy itself added.
export function clientIp(req: Request): string | null {
  if (!trustProxy()) return null;
  const xff = req.headers.get("x-forwarded-for");
  if (!xff) return req.headers.get("x-real-ip");
  const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
  return parts[parts.length - 1] ?? null;
}
