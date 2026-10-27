import test from "node:test";
import assert from "node:assert/strict";
import { parseBooking } from "../lib/validate";
import { SITE } from "../lib/config";

const now = { date: "2030-06-15", hour: 16, minute: 0 };
const good = { tier: "standard", seats: [1, 2], date: "2030-06-16", startHour: 18, hours: 2, name: "علی رضایی", phone: "۰۹۱۲۱۲۳۴۵۶۷", note: "" };
const pub = (over: Record<string, unknown> = {}) => parseBooking({ ...good, ...over }, { staff: false, now });
const staff = (over: Record<string, unknown> = {}) => parseBooking({ ...good, ...over }, { staff: true, now });

test("valid booking passes; Persian digits in phone are normalized; seats sorted", () => {
  const r = pub({ seats: [2, 1] });
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.value.phone, "09121234567");
    assert.deepEqual(r.value.seats, [1, 2]);
  }
});

test("seat validation: capacity per tier, duplicates, junk", () => {
  assert.equal(pub({ seats: [5] }).ok, false); // standard has 4
  assert.equal(pub({ seats: [4] }).ok, true);
  assert.equal(pub({ tier: "pro", seats: [6] }).ok, true);
  assert.equal(pub({ tier: "pro", seats: [7] }).ok, false);
  assert.equal(pub({ seats: [0] }).ok, false);
  assert.equal(pub({ seats: [1, 1] }).ok, false);
  assert.equal(pub({ seats: [] }).ok, false);
  assert.equal(pub({ seats: ["x"] }).ok, false);
  assert.equal(pub({ seats: [1.5] }).ok, false);
  assert.equal(pub({ seats: undefined }).ok, false);
  assert.equal(pub({ seats: undefined, seat: 3 }).ok, true); // legacy single-seat field
});

test("tier validation", () => {
  assert.equal(pub({ tier: "vip" }).ok, false);
  assert.equal(pub({ tier: undefined }).ok, false);
});

test("duration and time-window validation", () => {
  assert.equal(pub({ hours: 0 }).ok, false);
  assert.equal(pub({ hours: SITE.maxHours + 1 }).ok, false);
  assert.equal(pub({ hours: 1.5 }).ok, false);
  assert.equal(pub({ startHour: SITE.openHour - 1 }).ok, false);
  assert.equal(pub({ startHour: SITE.closeHour - 1, hours: 2 }).ok, false); // would cross midnight
  assert.equal(pub({ startHour: SITE.closeHour - 1, hours: 1 }).ok, true);
});

test("past dates and past hours are rejected for online bookings", () => {
  assert.equal(pub({ date: "2030-06-14" }).ok, false);
  assert.equal(pub({ date: "2030-06-15", startHour: 15 }).ok, false);
  assert.equal(pub({ date: "2030-06-15", startHour: 16 }).ok, false); // current hour already started
  assert.equal(pub({ date: "2030-06-15", startHour: 17 }).ok, true);
  assert.equal(staff({ date: "2030-06-15", startHour: 16 }).ok, true); // staff may book the current hour
  assert.equal(staff({ date: "2030-06-14" }).ok, false);
});

test("booking window", () => {
  assert.equal(pub({ date: "2030-06-29" }).ok, true); // +14 days
  assert.equal(pub({ date: "2030-06-30" }).ok, false);
  assert.equal(staff({ date: "2030-06-30" }).ok, true);
  assert.equal(pub({ date: "2030-02-31" }).ok, false);
});

test("name, phone and note validation", () => {
  assert.equal(pub({ name: "a" }).ok, false);
  assert.equal(pub({ name: "x".repeat(61) }).ok, false);
  assert.equal(pub({ name: "   " }).ok, false);
  assert.equal(pub({ phone: "abc" }).ok, false);
  assert.equal(pub({ phone: "" }).ok, false);
  assert.equal(staff({ phone: "" }).ok, true); // staff can omit phone
  assert.equal(staff({ phone: "12" }).ok, false);
  assert.equal(pub({ note: "x".repeat(201) }).ok, false);
});

test("control and bidi-override characters are stripped from text", () => {
  const r = pub({ name: "Ali\u202E\u0007 Reza", note: "a\nb" });
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.value.name, "Ali Reza");
    assert.equal(r.value.note, "a b");
  }
});
