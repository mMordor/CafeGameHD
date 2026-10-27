// Authorization for staff API routes. Every /api/admin handler calls this first.
import { cookieName, parseCookie, verifyToken } from "./authCore";
import type { Session } from "./authCore";
import { jsonError } from "./http";
import { sameOrigin } from "./requestInfo";

type Guarded = { session: Session; res?: undefined } | { session?: undefined; res: Response };

export function getRequestSession(req: Request): Session | null {
  return verifyToken(parseCookie(req.headers.get("cookie"), cookieName()));
}

export function guard(req: Request, opts: { admin?: boolean } = {}): Guarded {
  if (req.method !== "GET" && req.method !== "HEAD" && !sameOrigin(req)) {
    return { res: jsonError(403, "FORBIDDEN", "درخواست نامعتبر است.") };
  }
  const session = getRequestSession(req);
  if (!session) return { res: jsonError(401, "UNAUTHENTICATED", "لطفاً وارد شوید.") };
  if (opts.admin && session.role !== "admin") {
    return { res: jsonError(403, "FORBIDDEN", "این عملیات فقط برای مدیر کل مجاز است.") };
  }
  return { session };
}
