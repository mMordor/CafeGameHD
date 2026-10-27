import test from "node:test";
import assert from "node:assert/strict";
import { computeStats } from "../lib/domain/stats";
import { draft } from "./helpers";
import type { Reservation } from "../lib/domain/reservation";

const r = (over: Partial<Reservation>): Reservation => ({ ...draft(), id: Math.random().toString(), serial: "0001", createdAt: "x", ...over });

test("dashboard statistics use stored historical totals and exclude cancelled / no-show revenue", () => {
  const now = { date: "2031-01-10", hour: 19, minute: 0 };
  const list = [
    r({ status: "confirmed", date: "2031-01-10", startHour: 20, hours: 1, total: 130000 }), // upcoming
    r({ status: "confirmed", date: "2031-01-10", startHour: 10, hours: 1, total: 130000 }), // ended, still confirmed
    r({ status: "checked_in", total: 260000 }),
    r({ status: "completed", total: 390000 }),
    r({ status: "cancelled", total: 999000 }),
    r({ status: "no_show", total: 111000 }),
  ];
  const s = computeStats(list, now);
  assert.equal(s.total, 6);
  assert.equal(s.upcoming, 1);
  assert.equal(s.checkedIn, 1);
  assert.equal(s.completed, 1);
  assert.equal(s.cancelled, 1);
  assert.equal(s.noShow, 1);
  assert.equal(s.expectedRevenue, 130000 + 130000 + 260000 + 390000);
});
