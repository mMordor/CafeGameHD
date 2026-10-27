import { checkCredentials, createSessionToken, sessionCookie } from "@/lib/authCore";
import { json, jsonError, readJsonBody } from "@/lib/http";
import { clear, hit, peek } from "@/lib/rateLimit";
import { clientIp, sameOrigin } from "@/lib/requestInfo";

export const dynamic = "force-dynamic";

const WINDOW = 15 * 60 * 1000;
const MAX_PER_USER = 8; // failed attempts per username: works even when the client IP is unknown or spoofed
const MAX_PER_IP = 20; // failed attempts per IP (only when TRUST_PROXY=true)
const FAIL_DELAY_MS = 400; // slows online guessing

export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError(403, "FORBIDDEN", "درخواست نامعتبر است.");
  const body = await readJsonBody(req, 2048);
  if (!body.ok) return body.res;

  const username = String(body.value.username ?? "").slice(0, 64);
  const password = String(body.value.password ?? "").slice(0, 256);
  const ip = clientIp(req);
  const userKey = `login:user:${username.toLowerCase()}`;
  const ipKey = ip ? `login:ip:${ip}` : null;

  const lockedUser = peek(userKey, MAX_PER_USER);
  const lockedIp = ipKey ? peek(ipKey, MAX_PER_IP) : { ok: true, retryAfterSec: 0 };
  if (!lockedUser.ok || !lockedIp.ok) {
    return json(
      { error: "تلاش‌های ناموفق زیاد بود. چند دقیقه بعد دوباره امتحان کنید.", code: "RATE_LIMITED" },
      429,
      { "Retry-After": String(Math.max(lockedUser.retryAfterSec, lockedIp.retryAfterSec)) }
    );
  }

  let account: ReturnType<typeof checkCredentials> = null;
  try {
    account = checkCredentials(username, password);
  } catch (e) {
    // Misconfiguration (e.g. missing AUTH_SECRET in production). Details stay in the server log.
    console.error(`[auth] ${e instanceof Error ? e.message : "login failed"}`);
    return jsonError(500, "AUTH_MISCONFIGURED", "ورود در حال حاضر در دسترس نیست.");
  }

  if (!account) {
    hit(userKey, MAX_PER_USER, WINDOW);
    if (ipKey) hit(ipKey, MAX_PER_IP, WINDOW);
    await new Promise((r) => setTimeout(r, FAIL_DELAY_MS));
    return jsonError(401, "BAD_CREDENTIALS", "نام کاربری یا گذرواژه نادرست است.");
  }

  let token: string;
  try {
    token = createSessionToken(account);
  } catch (e) {
    console.error(`[auth] ${e instanceof Error ? e.message : "cannot create session"}`);
    return jsonError(500, "AUTH_MISCONFIGURED", "ورود در حال حاضر در دسترس نیست.");
  }
  clear(userKey);
  return json({ ok: true, role: account.role }, 200, { "Set-Cookie": sessionCookie(token) });
}
