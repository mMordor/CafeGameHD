import test from "node:test";
import assert from "node:assert/strict";
import { nowInZone, isValidISODate, isoAddDays } from "../lib/time";
import { jalaliNumeric, formatJalali } from "../lib/format";

test("business-timezone clock is independent of the machine timezone", () => {
  const at = new Date("2026-03-20T20:45:00Z"); // 00:15 next day in Tehran (+03:30)
  assert.deepEqual(nowInZone("Asia/Tehran", at), { date: "2026-03-21", hour: 0, minute: 15 });
  assert.deepEqual(nowInZone("UTC", at), { date: "2026-03-20", hour: 20, minute: 45 });
});

test("ISO date validation and arithmetic", () => {
  assert.equal(isValidISODate("2026-02-29"), false);
  assert.equal(isValidISODate("2028-02-29"), true);
  assert.equal(isValidISODate("2026-13-01"), false);
  assert.equal(isValidISODate(20260101), false);
  assert.equal(isoAddDays("2026-12-31", 1), "2027-01-01");
  assert.equal(isoAddDays("2026-03-01", -1), "2026-02-28");
});

test("Jalali conversion uses platform ICU data (Nowruz 1405 = 2026-03-21)", () => {
  assert.deepEqual(jalaliNumeric("2026-03-21"), { year: 1405, month: 1, day: 1 });
  assert.deepEqual(jalaliNumeric("2026-03-20"), { year: 1404, month: 12, day: 29 });
  assert.match(formatJalali("2026-03-21"), /فروردین/);
  assert.match(formatJalali("2026-03-21"), /۱۴۰۵/);
});
