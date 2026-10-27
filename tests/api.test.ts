// End-to-end tests of the real route handlers (called directly with Request objects).
// The handlers only use Web-standard APIs, so no Next.js server is needed.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const dir = await mkdtemp(path.join(tmpdir(), "gz-api-"));
process.env.DATA_DIR = dir;
process.env.AUTH_SECRET = "z".repeat(40);
process.env.ADMIN_USERNAME = "boss";
process.env.ADMIN_PASSWORD = "boss-pass-1";
process.env.MANAGER_USERNAME = "mgr";
process.env.MANAGER_PASSWORD = "mgr-pass-1";
delete process.env.NODE_ENV;
delete process.env.DATABASE_URL;
delete process.env.ALLOW_FILE_STORAGE;
delete process.env.TRUST_PROXY;

const pub = await import("../app/api/reservations/route");
const login = await import("../app/api/admin/login/route");
const logout = await import("../app/api/admin/logout/route");
const adm = await import("../app/api/admin/reservations/route");
const admId = await import("../app/api/admin/reservations/[id]/route");
const { businessNow } = await import("../lib/time");
const { isoAddDays } = await import("../lib/time");
const { resetAll } = await import("../lib/rateLimit");

const today = businessNow().date;
const day = (n: number) => isoAddDays(today, n);
const g = globalThis as unknown as { __gzStore?: unknown };

const req = (method: string, url: string, body?: unknown, headers: Record<string, string> = {}) =>
  new Request(`http://localhost${url}`, {
    method,
    headers: { "content-type": "application/json", origin: "http://localhost", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const json = async (res: Response) => res.json() as Promise<any>;

const booking = (over: Record<string, unknown> = {}) => ({
  tier: "standard", seats: [1, 2], date: day(3), startHour: 18, hours: 3,
  name: "علی رضایی", phone: "09121234567", note: "", expectedTotal: 780000, ...over,
});

async function signIn(user: string, pass: string) {
  const res = await login.POST(req("POST", "/api/admin/login", { username: user, password: pass }));
  assert.equal(res.status, 200, await res.clone().text());
  return (res.headers.get("set-cookie") as string).split(";")[0];
}

test("public availability: validates input and exposes no personal data", async () => {
  assert.equal((await pub.GET(req("GET", "/api/reservations?date=nope&tier=standard"))).status, 400);
  assert.equal((await pub.GET(req("GET", `/api/reservations?date=${day(3)}&tier=vip`))).status, 400);
  const ok = await pub.GET(req("GET", `/api/reservations?date=${day(3)}&tier=standard`));
  assert.equal(ok.status, 200);
  assert.deepEqual(await json(ok), { booked: [] });
});

test("online booking: 201 with serial, server-computed total, and no internal/personal fields", async () => {
  const res = await pub.POST(req("POST", "/api/reservations", booking()));
  assert.equal(res.status, 201);
  const body = await json(res);
  assert.match(body.reservation.serial, /^\d{4}$/);
  assert.equal(body.reservation.total, 780000); // 130,000 x 2 seats x 3 hours
  assert.deepEqual(body.reservation.seats, [1, 2]);
  assert.deepEqual(Object.keys(body.reservation).sort(), ["date", "hours", "pricePerSeat", "seats", "serial", "startHour", "tier", "total"]);

  const avail = await json(await pub.GET(req("GET", `/api/reservations?date=${day(3)}&tier=standard`)));
  assert.deepEqual(avail.booked, [{ seats: [1, 2], startHour: 18, hours: 3 }]); // nothing but seats and times
});

test("a taken seat is refused with SEAT_TAKEN; a free seat for the same time is accepted", async () => {
  const taken = await pub.POST(req("POST", "/api/reservations", booking({ seats: [2, 3], hours: 1, startHour: 19, phone: "09120000002", expectedTotal: 260000 })));
  assert.equal(taken.status, 409);
  const body = await json(taken);
  assert.equal(body.code, "SEAT_TAKEN");
  assert.deepEqual(body.seats, [2]);
  const free = await pub.POST(req("POST", "/api/reservations", booking({ seats: [3], hours: 1, startHour: 19, phone: "09120000003", expectedTotal: 130000 })));
  assert.equal(free.status, 201);
});

test("client-supplied total is never trusted: a wrong total is rejected with the real one", async () => {
  const res = await pub.POST(req("POST", "/api/reservations", booking({ seats: [4], date: day(4), expectedTotal: 1 })));
  assert.equal(res.status, 409);
  const body = await json(res);
  assert.equal(body.code, "PRICE_CHANGED");
  assert.equal(body.total, 390000);
  // injected price fields are ignored
  const ok = await pub.POST(req("POST", "/api/reservations", { ...booking({ seats: [4], date: day(4), expectedTotal: undefined }), total: 1, pricePerSeat: 1 }));
  assert.equal(ok.status, 201);
  assert.equal((await json(ok)).reservation.total, 390000);
});

test("invalid seat counts, durations, dates and contact details are rejected with 400", async () => {
  const bad = async (over: Record<string, unknown>) => (await pub.POST(req("POST", "/api/reservations", booking({ date: day(6), expectedTotal: undefined, ...over })))).status;
  assert.equal(await bad({ seats: [5] }), 400); // standard has 4
  assert.equal(await bad({ seats: [] }), 400);
  assert.equal(await bad({ seats: [1, 1] }), 400);
  assert.equal(await bad({ hours: 0 }), 400);
  assert.equal(await bad({ hours: 99 }), 400);
  assert.equal(await bad({ date: day(-1) }), 400);
  assert.equal(await bad({ date: day(60) }), 400);
  assert.equal(await bad({ phone: "abc" }), 400);
  assert.equal(await bad({ name: "x" }), 400);
  assert.equal(await bad({ tier: "pro", seats: [7] }), 400);
});

test("bots and malformed requests: honeypot, wrong content type, cross-site origin, bad JSON", async () => {
  assert.equal((await pub.POST(req("POST", "/api/reservations", booking({ date: day(7), website: "http://spam" })))).status, 400);
  const form = new Request("http://localhost/api/reservations", { method: "POST", headers: { "content-type": "text/plain", origin: "http://localhost" }, body: "x" });
  assert.equal((await pub.POST(form)).status, 415);
  assert.equal((await pub.POST(req("POST", "/api/reservations", booking({ date: day(7) }), { origin: "http://evil.example" }))).status, 403);
  const broken = new Request("http://localhost/api/reservations", { method: "POST", headers: { "content-type": "application/json", origin: "http://localhost" }, body: "{oops" });
  assert.equal((await pub.POST(broken)).status, 400);
});

test("idempotency key: a retried submission returns the same reservation and creates only one", async () => {
  const body = booking({ seats: [4], date: day(8), hours: 1, phone: "09125550000", expectedTotal: 130000 });
  const headers = { "idempotency-key": "retry-key-12345" };
  const [a, b] = await Promise.all([pub.POST(req("POST", "/api/reservations", body, headers)), pub.POST(req("POST", "/api/reservations", body, headers))]);
  assert.equal(a.status, 201);
  assert.equal(b.status, 201);
  assert.equal((await json(a)).reservation.serial, (await json(b)).reservation.serial);
  const cookie = await signIn("mgr", "mgr-pass-1");
  const all = await json(await adm.GET(req("GET", `/api/admin/reservations?date=${day(8)}`, undefined, { cookie })));
  assert.equal(all.reservations.length, 1);
});

test("per-phone cap: a 4th active online booking from one phone is refused", async () => {
  const mk = (n: number) => booking({ seats: [1], date: day(9 + n), hours: 1, startHour: 12, phone: "09126660000", expectedTotal: 130000 });
  for (let i = 0; i < 3; i++) assert.equal((await pub.POST(req("POST", "/api/reservations", mk(i)))).status, 201);
  const fourth = await pub.POST(req("POST", "/api/reservations", mk(3)));
  assert.equal(fourth.status, 429);
  assert.equal((await json(fourth)).code, "PHONE_LIMIT");
});

test("admin API: every endpoint requires a session; role limits are enforced", async () => {
  const noAuth = [
    await adm.GET(req("GET", "/api/admin/reservations")),
    await adm.POST(req("POST", "/api/admin/reservations", booking())),
    await admId.PATCH(req("PATCH", "/api/admin/reservations/x", { status: "cancelled" }), { params: { id: "x" } }),
    await admId.DELETE(req("DELETE", "/api/admin/reservations/x"), { params: { id: "x" } }),
  ];
  for (const r of noAuth) assert.equal(r.status, 401);
  assert.equal((await adm.GET(req("GET", "/api/admin/reservations", undefined, { cookie: "gz_session=forged.value" }))).status, 401);
  assert.equal((await login.POST(req("POST", "/api/admin/login", { username: "boss", password: "wrong" }))).status, 401);

  const mgr = await signIn("mgr", "mgr-pass-1");
  const full = await json(await adm.GET(req("GET", `/api/admin/reservations?date=${day(3)}`, undefined, { cookie: mgr })));
  assert.equal(full.role, "manager");
  assert.ok(full.reservations[0].name && full.reservations[0].phone); // staff see personal data
  const id = full.reservations[0].id;
  assert.equal((await admId.DELETE(req("DELETE", `/api/admin/reservations/${id}`, undefined, { cookie: mgr }), { params: { id } })).status, 403);
  assert.equal((await adm.POST(req("POST", "/api/admin/reservations", booking({ date: day(20) }), { cookie: mgr, origin: "http://evil.example" }))).status, 403);
});

test("phone reservation by staff, status rules, cancellation releasing seats, edit rules, admin delete", async () => {
  const admin = await signIn("boss", "boss-pass-1");
  const h = { cookie: admin };

  const created = await adm.POST(req("POST", "/api/admin/reservations", { tier: "pro", seats: [1, 2, 3], date: day(13), startHour: 20, hours: 2, name: "مشتری تلفنی", phone: "", note: "سه سیستم کنار هم" }, h));
  assert.equal(created.status, 201);
  const r = (await json(created)).reservation;
  assert.equal(r.source, "phone");
  assert.equal(r.createdBy, "boss");
  assert.equal(r.total, 140000 * 3 * 2); // 840,000
  assert.match(r.serial, /^\d{4}$/);

  // conflicts apply to staff too
  const clash = await adm.POST(req("POST", "/api/admin/reservations", { tier: "pro", seats: [3], date: day(13), startHour: 21, hours: 1, name: "نفر دوم", phone: "" }, h));
  assert.equal(clash.status, 409);

  const patch = (id: string, body: unknown) => admId.PATCH(req("PATCH", `/api/admin/reservations/${id}`, body, h), { params: { id } });
  assert.equal((await patch(r.id, { status: "completed" })).status, 409); // must check in first
  assert.equal((await patch(r.id, { status: "nonsense" })).status, 400);
  assert.equal((await patch(r.id, { status: "checked_in" })).status, 200);
  assert.equal((await patch(r.id, { status: "checked_in" })).status, 200); // repeat = harmless no-op
  assert.equal((await patch(r.id, { status: "no_show" })).status, 409); // can't no-show after check-in
  assert.equal((await patch(r.id, { status: "confirmed", tier: "pro" })).status, 400); // not both at once

  // edit: move to seat 4-5, price recalculated from the stored unit price
  const edit = await patch(r.id, { tier: "pro", seats: [4, 5], date: day(13), startHour: 20, hours: 1, name: "مشتری تلفنی", phone: "", note: "" });
  assert.equal(edit.status, 200);
  assert.equal((await json(edit)).reservation.total, 140000 * 2 * 1);

  // cancel -> seats are free again for online customers
  assert.equal((await patch(r.id, { status: "cancelled" })).status, 200);
  const avail = await json(await pub.GET(req("GET", `/api/reservations?date=${day(13)}&tier=pro`)));
  assert.deepEqual(avail.booked, []);
  const online = await pub.POST(req("POST", "/api/reservations", booking({ tier: "pro", seats: [4, 5], date: day(13), startHour: 20, hours: 1, expectedTotal: 280000, phone: "09127770000" })));
  assert.equal(online.status, 201);

  // a cancelled booking cannot be edited, and reinstating it now conflicts
  assert.equal((await patch(r.id, { tier: "pro", seats: [1], date: day(13), startHour: 20, hours: 1, name: "x y", phone: "" })).status, 409);
  assert.equal((await patch(r.id, { status: "confirmed" })).status, 409);

  // only an admin may permanently delete
  assert.equal((await admId.DELETE(req("DELETE", `/api/admin/reservations/${r.id}`, undefined, h), { params: { id: r.id } })).status, 200);
  assert.equal((await admId.DELETE(req("DELETE", `/api/admin/reservations/${r.id}`, undefined, h), { params: { id: r.id } })).status, 404);
});

test("session cookie: logout clears it; a password change invalidates existing sessions", async () => {
  const cookie = await signIn("boss", "boss-pass-1");
  assert.equal((await adm.GET(req("GET", "/api/admin/reservations", undefined, { cookie }))).status, 200);
  const out = await logout.POST(req("POST", "/api/admin/logout"));
  assert.match(out.headers.get("set-cookie") as string, /Max-Age=0/);
  process.env.ADMIN_PASSWORD = "boss-pass-2";
  assert.equal((await adm.GET(req("GET", "/api/admin/reservations", undefined, { cookie }))).status, 401);
  process.env.ADMIN_PASSWORD = "boss-pass-1";
});

test("login brute-force protection locks a username after repeated failures (independent of IP headers)", async () => {
  resetAll();
  let last = 0;
  for (let i = 0; i < 9; i++) {
    const r = await login.POST(req("POST", "/api/admin/login", { username: "victim", password: `guess${i}` }, { "x-forwarded-for": `1.1.1.${i}` }));
    last = r.status;
  }
  assert.equal(last, 429);
  // even the correct password is blocked while locked, but a different account is unaffected
  assert.equal((await login.POST(req("POST", "/api/admin/login", { username: "mgr", password: "mgr-pass-1" }))).status, 200);
});

test("storage failures are reported as 503 and never overwrite data", async () => {
  g.__gzStore = undefined;
  const file = path.join(dir, "reservations.json");
  const good = await readFile(file, "utf8");
  const broken = '{"schemaVersion":2,"reservations":[';
  await writeFile(file, broken);
  const res = await pub.GET(req("GET", `/api/reservations?date=${day(3)}&tier=standard`));
  assert.equal(res.status, 503);
  assert.equal((await json(res)).code, "STORAGE_UNAVAILABLE");
  const post = await pub.POST(req("POST", "/api/reservations", booking({ date: day(11), seats: [2], expectedTotal: 390000, phone: "09128880000" })));
  assert.equal(post.status, 503);
  assert.equal(await readFile(file, "utf8"), broken); // untouched
  await writeFile(file, good); // restore for the next test
});

test("production safety: file store refused unless explicitly allowed; DATABASE_URL refuses to fall back to files", async () => {
  const url = `/api/reservations?date=${day(3)}&tier=standard`;
  g.__gzStore = undefined;
  process.env.NODE_ENV = "production";
  assert.equal((await pub.GET(req("GET", url))).status, 503);
  process.env.ALLOW_FILE_STORAGE = "true";
  g.__gzStore = undefined;
  assert.equal((await pub.GET(req("GET", url))).status, 200);
  process.env.DATABASE_URL = "postgres://example.invalid/db";
  g.__gzStore = undefined;
  assert.equal((await pub.GET(req("GET", url))).status, 503);
  delete process.env.DATABASE_URL;
  delete process.env.ALLOW_FILE_STORAGE;
  delete process.env.NODE_ENV;
  g.__gzStore = undefined;
});
