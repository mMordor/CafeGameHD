import test from "node:test";
import assert from "node:assert/strict";
import { canTransition, nextStatuses, TRANSITIONS } from "../lib/domain/status";
import { checkStatusChange, buildEditPatch } from "../lib/domain/rules";
import { STATUSES } from "../lib/config";
import { input, draft } from "./helpers";
import type { Reservation } from "../lib/domain/reservation";
import { isBlocking } from "../lib/domain/reservation";

const res = (over: Partial<Reservation> = {}): Reservation => ({ ...draft(), id: "x", serial: "0001", createdAt: "2030-01-01T00:00:00Z", ...over });

test("valid transitions", () => {
  assert.ok(canTransition("confirmed", "checked_in"));
  assert.ok(canTransition("checked_in", "completed"));
  assert.ok(canTransition("confirmed", "cancelled"));
  assert.ok(canTransition("confirmed", "no_show"));
  assert.ok(canTransition("cancelled", "confirmed"));
});

test("invalid transitions are rejected", () => {
  assert.equal(canTransition("confirmed", "completed"), false); // must check in first
  assert.equal(canTransition("completed", "cancelled"), false);
  assert.equal(canTransition("completed", "no_show"), false);
  assert.equal(canTransition("cancelled", "completed"), false);
  assert.equal(canTransition("no_show", "completed"), false);
  assert.equal(canTransition("checked_in", "no_show"), false);
});

test("every status has a transition entry and none transitions to itself", () => {
  for (const s of STATUSES) {
    assert.ok(Array.isArray(TRANSITIONS[s.id]));
    assert.ok(!nextStatuses(s.id).includes(s.id));
  }
});

test("checkStatusChange: no-op on same status, rejects invalid", () => {
  assert.deepEqual(checkStatusChange(res(), "confirmed"), { ok: true, noop: true });
  const bad = checkStatusChange(res(), "completed");
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.equal(bad.code, "INVALID_TRANSITION");
});

test("only cancelled / no_show / completed release seats", () => {
  assert.equal(isBlocking({ status: "confirmed" }), true);
  assert.equal(isBlocking({ status: "checked_in" }), true);
  assert.equal(isBlocking({ status: "cancelled" }), false);
  assert.equal(isBlocking({ status: "no_show" }), false);
  assert.equal(isBlocking({ status: "completed" }), false);
});

test("edits: only active bookings; unit price kept unless the tier changes", () => {
  const cur = res({ pricePerSeat: 100000, total: 200000 }); // historical price
  const same = buildEditPatch(cur, input({ seats: [1, 2], hours: 2 }));
  assert.ok(same.ok);
  if (same.ok) {
    assert.equal(same.patch.pricePerSeat, 100000);
    assert.equal(same.patch.total, 400000);
  }
  const moved = buildEditPatch(cur, input({ tier: "pro", seats: [1], hours: 1 }));
  assert.ok(moved.ok);
  if (moved.ok) assert.equal(moved.patch.total, 140000);
  const cancelled = buildEditPatch(res({ status: "cancelled" }), input());
  assert.equal(cancelled.ok, false);
});
