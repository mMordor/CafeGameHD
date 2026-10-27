import test from "node:test";
import assert from "node:assert/strict";
import {
  checkCredentials, createSessionToken, verifyToken, hashPassword, verifyHash,
  parseCookie, sessionCookie, clearedCookie, cookieName, SESSION_MAX_AGE,
} from "../lib/authCore";
import { guard } from "../lib/guard";
import { sameOrigin, clientIp } from "../lib/requestInfo";
import { hit, peek, clear, resetAll } from "../lib/rateLimit";
import { once, validKey } from "../lib/idempotency";

function setEnv(env: Record<string, string | undefined>) {
  for (const k of ["ADMIN_USERNAME", "ADMIN_PASSWORD", "ADMIN_PASSWORD_HASH", "MANAGER_USERNAME", "MANAGER_PASSWORD", "MANAGER_PASSWORD_HASH", "AUTH_SECRET", "NODE_ENV", "TRUST_PROXY"]) delete process.env[k];
  for (const [k, v] of Object.entries(env)) if (v !== undefined) process.env[k] = v;
}
const base = { AUTH_SECRET: "x".repeat(32), ADMIN_USERNAME: "boss", ADMIN_PASSWORD: "p@ss-admin", MANAGER_USERNAME: "mgr", MANAGER_PASSWORD: "p@ss-mgr" };

function req(method: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/admin/reservations", { method, headers });
}
function authed(account: string, method: string, extra: Record<string, string> = {}) {
  const a = checkCredentials(account, account === "boss" ? "p@ss-admin" : "p@ss-mgr")!;
  return req(method, { cookie: `${cookieName()}=${createSessionToken(a)}`, host: "localhost", ...extra });
}

test("credentials: correct passes, wrong or unknown fails, role is attached", () => {
  setEnv(base);
  assert.equal(checkCredentials("boss", "p@ss-admin")?.role, "admin");
  assert.equal(checkCredentials("mgr", "p@ss-mgr")?.role, "manager");
  assert.equal(checkCredentials("boss", "wrong"), null);
  assert.equal(checkCredentials("nobody", "p@ss-admin"), null);
  assert.equal(checkCredentials("mgr", "p@ss-admin"), null);
});

test("dev fallback logins exist only outside production", () => {
  setEnv({ AUTH_SECRET: "x".repeat(32) });
  assert.equal(checkCredentials("admin", "admin123")?.role, "admin");
  setEnv({ AUTH_SECRET: "x".repeat(32), NODE_ENV: "production" });
  assert.equal(checkCredentials("admin", "admin123"), null);
  assert.equal(checkCredentials("manager", "manager123"), null);
});

test("production without AUTH_SECRET refuses to sign sessions", () => {
  setEnv({ NODE_ENV: "production", ADMIN_USERNAME: "a", ADMIN_PASSWORD: "b" });
  assert.throws(() => createSessionToken({ user: "a", role: "admin", password: "b" }));
});

test("scrypt password hashes verify, and salts differ", () => {
  const h1 = hashPassword("s3cret");
  const h2 = hashPassword("s3cret");
  assert.notEqual(h1, h2);
  assert.ok(verifyHash("s3cret", h1));
  assert.ok(!verifyHash("S3cret", h1));
  assert.ok(!verifyHash("s3cret", "scrypt$bad"));
  setEnv({ AUTH_SECRET: "x".repeat(32), ADMIN_USERNAME: "boss", ADMIN_PASSWORD_HASH: h1 });
  assert.equal(checkCredentials("boss", "s3cret")?.role, "admin");
  assert.equal(checkCredentials("boss", "nope"), null);
});

test("session tokens: valid, tampered, expired, and invalidated by a password change", () => {
  setEnv(base);
  const acc = checkCredentials("boss", "p@ss-admin")!;
  const t = createSessionToken(acc, 1_000_000_000_000);
  assert.deepEqual(verifyToken(t, 1_000_000_000_000 + 1000), { user: "boss", role: "admin" });
  assert.equal(verifyToken(t, 1_000_000_000_000 + (SESSION_MAX_AGE + 5) * 1000), null); // expired
  const [body, sig] = t.split(".");
  const forged = Buffer.from(JSON.stringify({ u: "boss", r: "admin", pv: "x", exp: 9999999999 })).toString("base64url");
  assert.equal(verifyToken(`${forged}.${sig}`, 1_000_000_000_001), null);
  assert.equal(verifyToken(`${body}.${sig.slice(0, -2)}AA`, 1_000_000_000_001), null);
  assert.equal(verifyToken("garbage"), null);
  assert.equal(verifyToken(null), null);
  setEnv({ ...base, ADMIN_PASSWORD: "changed" }); // password rotated -> old sessions die
  assert.equal(verifyToken(t, 1_000_000_000_001), null);
  setEnv({ ...base, AUTH_SECRET: "y".repeat(32) }); // secret rotated -> all sessions die
  assert.equal(verifyToken(t, 1_000_000_000_001), null);
});

test("cookies: parsing and attributes", () => {
  setEnv(base);
  assert.equal(parseCookie("a=1; gz_session=abc.def; b=2", "gz_session"), "abc.def");
  assert.equal(parseCookie("a=1", "gz_session"), null);
  assert.match(sessionCookie("tok"), /HttpOnly; SameSite=Lax; Max-Age=43200$/);
  assert.match(clearedCookie(), /Max-Age=0/);
  setEnv({ ...base, NODE_ENV: "production" });
  assert.equal(cookieName(), "__Host-gz_session");
  assert.match(sessionCookie("tok"), /; Secure$/);
});

test("guard: admin/manager API protection", async () => {
  setEnv(base);
  const none = guard(req("GET"));
  assert.equal(none.res?.status, 401); // no session
  assert.equal(guard(req("GET", { cookie: `${cookieName()}=forged.token` })).res?.status, 401);
  assert.ok(guard(authed("mgr", "GET")).session); // manager can read
  assert.ok(guard(authed("mgr", "POST")).session); // manager can create/edit
  assert.equal(guard(authed("mgr", "DELETE"), { admin: true }).res?.status, 403); // manager cannot delete
  assert.ok(guard(authed("boss", "DELETE"), { admin: true }).session); // admin can
  assert.equal(guard(authed("boss", "POST", { origin: "http://evil.example" })).res?.status, 403); // cross-site write
  assert.ok(guard(authed("boss", "POST", { origin: "http://localhost" })).session);
});

test("origin check and client IP trust", () => {
  setEnv({ ...base });
  assert.equal(sameOrigin(req("POST", { origin: "http://localhost", host: "localhost" })), true);
  assert.equal(sameOrigin(req("POST", { origin: "http://evil.example", host: "localhost" })), false);
  assert.equal(sameOrigin(req("POST", { origin: "not a url", host: "localhost" })), false);
  assert.equal(clientIp(req("GET", { "x-forwarded-for": "6.6.6.6" })), null); // spoofable header ignored by default
  setEnv({ ...base, TRUST_PROXY: "true" });
  assert.equal(clientIp(req("GET", { "x-forwarded-for": "6.6.6.6, 10.0.0.9" })), "10.0.0.9"); // proxy-appended entry
});

test("rate limiter blocks after the limit and recovers after the window", () => {
  resetAll();
  for (let i = 0; i < 5; i++) assert.ok(hit("k", 5, 1000, 0).ok);
  assert.equal(hit("k", 5, 1000, 10).ok, false);
  assert.ok(hit("k", 5, 1000, 1500).ok);
  resetAll();
  hit("login:u", 3, 1000, 0); hit("login:u", 3, 1000, 0); hit("login:u", 3, 1000, 0);
  assert.equal(peek("login:u", 3, 10).ok, false);
  clear("login:u");
  assert.equal(peek("login:u", 3, 10).ok, true);
});

test("idempotency: concurrent and repeated submissions run once; failures are not cached", async () => {
  let runs = 0;
  const fn = async () => { runs++; await new Promise((r) => setTimeout(r, 20)); return { status: 201, body: { n: runs } }; };
  const [a, b] = await Promise.all([once("key-aaaaaaaa", fn), once("key-aaaaaaaa", fn)]);
  assert.equal(runs, 1);
  assert.deepEqual(a, b);
  assert.deepEqual(await once("key-aaaaaaaa", fn), a);
  assert.equal(runs, 1);
  let fails = 0;
  const bad = async () => { fails++; return { status: 409, body: {} }; };
  await once("key-bbbbbbbb", bad); await once("key-bbbbbbbb", bad);
  assert.equal(fails, 2);
  assert.equal(validKey("short"), false);
  assert.equal(validKey("good-key-12345"), true);
});
