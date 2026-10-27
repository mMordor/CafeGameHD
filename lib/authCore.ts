// Pure authentication logic (no Next.js imports) so it can be unit-tested.
//
// Roles: manager = view, add, edit, change status. admin = everything + permanent delete.
// Accounts come from environment variables (ADMIN_*/MANAGER_*), never from source code.
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export type Role = "admin" | "manager";
export type Session = { user: string; role: Role };
export type Account = { user: string; role: Role; password?: string; hash?: string };

export const SESSION_MAX_AGE = 60 * 60 * 12; // 12 hours

const isProd = () => process.env.NODE_ENV === "production";

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 16) return s;
  if (isProd()) throw new Error("AUTH_SECRET (16+ random characters) must be set in production.");
  return "dev-only-secret-change-me";
}

// ---- passwords -------------------------------------------------------------------------------
export function hashPassword(password: string): string {
  const N = 16384, r = 8, p = 1;
  const salt = randomBytes(16);
  const dk = scryptSync(password, salt, 32, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${dk.toString("hex")}`;
}

export function verifyHash(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltHex, hashHex] = parts;
  try {
    const expected = Buffer.from(hashHex, "hex");
    if (expected.length === 0) return false;
    const dk = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length, {
      N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024,
    });
    return dk.length === expected.length && timingSafeEqual(dk, expected);
  } catch {
    return false;
  }
}

const digest = (s: string) => createHash("sha256").update(s).digest();
const sameString = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));

export function loadAccounts(env: NodeJS.ProcessEnv = process.env): Account[] {
  const dev = env.NODE_ENV !== "production";
  const list: Account[] = [
    {
      user: env.ADMIN_USERNAME ?? (dev ? "admin" : ""),
      role: "admin",
      hash: env.ADMIN_PASSWORD_HASH || undefined,
      password: env.ADMIN_PASSWORD ?? (dev && !env.ADMIN_PASSWORD_HASH ? "admin123" : undefined),
    },
    {
      user: env.MANAGER_USERNAME ?? (dev ? "manager" : ""),
      role: "manager",
      hash: env.MANAGER_PASSWORD_HASH || undefined,
      password: env.MANAGER_PASSWORD ?? (dev && !env.MANAGER_PASSWORD_HASH ? "manager123" : undefined),
    },
  ];
  return list.filter((a) => a.user && (a.hash || a.password));
}

function passwordMatches(a: Account, input: string): boolean {
  if (a.hash) return verifyHash(input, a.hash);
  if (a.password) return sameString(input, a.password);
  return false;
}

// Evaluates every account (no early exit) so timing does not reveal which username exists.
export function checkCredentials(user: string, pass: string): Account | null {
  let found: Account | null = null;
  for (const a of loadAccounts()) {
    const ok = sameString(user, a.user) && passwordMatches(a, pass);
    if (ok && !found) found = a;
  }
  return found;
}

// ---- session tokens --------------------------------------------------------------------------
const mac = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");
// Fingerprint of the account's credentials: changing the password (or the account) invalidates old sessions.
const credentialVersion = (a: Account) => mac(`pv:${a.user}:${a.role}:${a.hash ?? a.password ?? ""}`).slice(0, 16);

export function createSessionToken(a: Account, nowMs: number = Date.now()): string {
  const body = Buffer.from(
    JSON.stringify({ u: a.user, r: a.role, pv: credentialVersion(a), exp: Math.floor(nowMs / 1000) + SESSION_MAX_AGE })
  ).toString("base64url");
  return `${body}.${mac(body)}`;
}

export function verifyToken(token: string | null | undefined, nowMs: number = Date.now()): Session | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(mac(body));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof p.exp !== "number" || p.exp < nowMs / 1000) return null;
    const account = loadAccounts().find((x) => x.user === p.u && x.role === p.r);
    if (!account) return null;
    if (typeof p.pv !== "string" || !sameString(p.pv, credentialVersion(account))) return null;
    return { user: account.user, role: account.role };
  } catch {
    return null;
  }
}

// ---- cookies ---------------------------------------------------------------------------------
export const cookieSecure = (): boolean => isProd() && process.env.COOKIE_SECURE !== "false";
// "__Host-" pins the cookie to this exact host over HTTPS.
export const cookieName = (): string => (cookieSecure() ? "__Host-gz_session" : "gz_session");

export function parseCookie(header: string | null | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

export function sessionCookie(token: string): string {
  return `${cookieName()}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}${cookieSecure() ? "; Secure" : ""}`;
}
export function clearedCookie(): string {
  return `${cookieName()}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${cookieSecure() ? "; Secure" : ""}`;
}
