import test from "node:test";
import assert from "node:assert/strict";
import { writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { tempDir, store, draft, FIXED_NOW } from "./helpers";
import { allocateSerial, SERIAL_SPACE, formatSerial } from "../lib/domain/serial";
import { takenSeats } from "../lib/domain/availability";

test("create stores a reservation with a 4-digit serial and historical price", async () => {
  const { dir, cleanup } = await tempDir();
  try {
    const s = store(dir);
    const r = await s.create(draft({ seats: [1, 2], hours: 3 }));
    assert.ok(r.ok);
    if (r.ok) {
      assert.match(r.reservation.serial, /^\d{4}$/);
      assert.deepEqual(r.reservation.seats, [1, 2]);
      assert.equal(r.reservation.total, 780000);
      assert.equal(r.reservation.pricePerSeat, 130000);
    }
  } finally {
    await cleanup();
  }
});

test("same seat + overlapping time is rejected; partial seat overlap is rejected; other seat is fine", async () => {
  const { dir, cleanup } = await tempDir();
  try {
    const s = store(dir);
    assert.ok((await s.create(draft({ seats: [1, 2], startHour: 18, hours: 2, phone: "0911" }))).ok);

    const same = await s.create(draft({ seats: [1], startHour: 19, hours: 1, phone: "0912" }));
    assert.equal(same.ok, false);
    if (!same.ok && same.code === "CONFLICT") assert.deepEqual(same.seats, [1]);

    const partial = await s.create(draft({ seats: [2, 3], startHour: 18, hours: 1, phone: "0913" }));
    assert.equal(partial.ok, false);
    if (!partial.ok && partial.code === "CONFLICT") assert.deepEqual(partial.seats, [2]);

    assert.ok((await s.create(draft({ seats: [3], startHour: 18, hours: 2, phone: "0914" }))).ok); // free seat
    assert.ok((await s.create(draft({ tier: "pro", seats: [1], startHour: 18, hours: 2, phone: "0915" }))).ok); // other tier
    assert.ok((await s.create(draft({ seats: [1], date: "2031-01-11", startHour: 18, hours: 2, phone: "0916" }))).ok); // other day
  } finally {
    await cleanup();
  }
});

test("adjacent bookings (end == start) do not conflict", async () => {
  const { dir, cleanup } = await tempDir();
  try {
    const s = store(dir);
    assert.ok((await s.create(draft({ seats: [1], startHour: 18, hours: 2, phone: "0911" }))).ok);
    assert.ok((await s.create(draft({ seats: [1], startHour: 20, hours: 1, phone: "0912" }))).ok);
    assert.ok((await s.create(draft({ seats: [1], startHour: 17, hours: 1, phone: "0913" }))).ok);
    const overlap = await s.create(draft({ seats: [1], startHour: 17, hours: 2, phone: "0914" }));
    assert.equal(overlap.ok, false);
  } finally {
    await cleanup();
  }
});

test("cancelled, no_show and completed bookings release their seats; reinstating re-checks conflicts", async () => {
  const { dir, cleanup } = await tempDir();
  try {
    const s = store(dir);
    const first = await s.create(draft({ seats: [1], phone: "0911" }));
    assert.ok(first.ok);
    if (!first.ok) return;
    assert.ok(!(await s.create(draft({ seats: [1], phone: "0912" }))).ok);

    for (const status of ["cancelled"] as const) {
      const u = await s.update(first.reservation.id, () => ({ patch: { status } }));
      assert.ok(u.ok);
    }
    assert.equal((await s.listBlocking("2031-01-10", "standard")).length, 0);

    const second = await s.create(draft({ seats: [1], phone: "0912" })); // seat is free now
    assert.ok(second.ok);

    // Reinstating the first booking must fail: the seat has been taken in the meantime.
    const back = await s.update(first.reservation.id, () => ({ patch: { status: "confirmed" } }));
    assert.equal(back.ok, false);
    if (!back.ok) assert.equal(back.code, "CONFLICT");

    if (second.ok) {
      assert.ok((await s.update(second.reservation.id, () => ({ patch: { status: "no_show" } }))).ok);
      assert.equal((await s.listBlocking("2031-01-10", "standard")).length, 0);
      assert.ok((await s.update(first.reservation.id, () => ({ patch: { status: "confirmed" } }))).ok); // now fine
    }
  } finally {
    await cleanup();
  }
});

test("editing into a taken slot is rejected and leaves the booking unchanged", async () => {
  const { dir, cleanup } = await tempDir();
  try {
    const s = store(dir);
    const a = await s.create(draft({ seats: [1], startHour: 18, hours: 1, phone: "0911" }));
    const b = await s.create(draft({ seats: [2], startHour: 18, hours: 1, phone: "0912" }));
    assert.ok(a.ok && b.ok);
    if (!(a.ok && b.ok)) return;
    const moved = await s.update(b.reservation.id, () => ({ patch: { seats: [1] } }));
    assert.equal(moved.ok, false);
    const list = await s.list();
    assert.deepEqual(list.find((r) => r.id === b.reservation.id)!.seats, [2]);
  } finally {
    await cleanup();
  }
});

test("update returns NOT_FOUND for unknown ids; decide() errors pass through", async () => {
  const { dir, cleanup } = await tempDir();
  try {
    const s = store(dir);
    const r = await s.update("nope", () => ({ patch: {} }));
    assert.equal(r.ok, false);
    const c = await s.create(draft());
    if (c.ok) {
      const e = await s.update(c.reservation.id, () => ({ error: { code: "INVALID_TRANSITION", message: "x" } }));
      assert.equal(e.ok, false);
      if (!e.ok) assert.equal(e.code, "INVALID_TRANSITION");
    }
  } finally {
    await cleanup();
  }
});

test("exact duplicate submissions are detected; per-phone active limit is enforced", async () => {
  const { dir, cleanup } = await tempDir();
  try {
    const s = store(dir);
    assert.ok((await s.create(draft({ seats: [1] }), { maxActivePerPhone: 3 })).ok);
    const dup = await s.create(draft({ seats: [1] }), { maxActivePerPhone: 3 });
    assert.equal(dup.ok, false);
    if (!dup.ok) assert.equal(dup.code, "DUPLICATE");
    assert.ok((await s.create(draft({ seats: [2] }), { maxActivePerPhone: 3 })).ok);
    assert.ok((await s.create(draft({ seats: [3] }), { maxActivePerPhone: 3 })).ok);
    const limit = await s.create(draft({ seats: [4] }), { maxActivePerPhone: 3 });
    assert.equal(limit.ok, false);
    if (!limit.ok) assert.equal(limit.code, "PHONE_LIMIT");
    // staff bookings are not limited
    assert.ok((await s.create(draft({ seats: [4] }))).ok);
  } finally {
    await cleanup();
  }
});

test("serials are unique among active bookings, even when the RNG keeps returning the same number", async () => {
  const { dir, cleanup } = await tempDir();
  try {
    const s = store(dir, { rng: () => 7 }); // worst case: always collides
    const serials: string[] = [];
    for (let i = 1; i <= 4; i++) {
      const r = await s.create(draft({ seats: [i], phone: `091${i}` }));
      assert.ok(r.ok);
      if (r.ok) serials.push(r.reservation.serial);
    }
    assert.equal(new Set(serials).size, 4);
    assert.equal(serials[0], "0007");
    assert.equal(serials[1], "0008"); // collision resolved by scanning forward
  } finally {
    await cleanup();
  }
});

test("a serial is reusable once its booking is cancelled or has ended", async () => {
  const { dir, cleanup } = await tempDir();
  try {
    const s = store(dir, { rng: () => 42 });
    const a = await s.create(draft({ seats: [1], phone: "0911" }));
    assert.ok(a.ok);
    if (!a.ok) return;
    assert.equal(a.reservation.serial, "0042");
    await s.update(a.reservation.id, () => ({ patch: { status: "cancelled" } }));
    const b = await s.create(draft({ seats: [2], phone: "0912" }));
    assert.ok(b.ok);
    if (b.ok) assert.equal(b.reservation.serial, "0042"); // freed by cancellation

    // Reinstating the cancelled booking must not create two ACTIVE bookings with serial 0042.
    await s.update(b.reservation.id, () => ({ patch: { status: "cancelled" } }));
    const c = await s.create(draft({ seats: [3], phone: "0913" })); // takes 0042 again
    assert.ok(c.ok);
    const back = await s.update(a.reservation.id, () => ({ patch: { status: "confirmed" } }));
    assert.ok(back.ok);
    const active = (await s.list()).filter((r) => r.status === "confirmed");
    assert.equal(new Set(active.map((r) => r.serial)).size, active.length);
  } finally {
    await cleanup();
  }
});

test("pure allocator: never returns a used value, returns null when all 10,000 are used", () => {
  const used = new Set<string>();
  for (let i = 0; i < SERIAL_SPACE - 1; i++) used.add(formatSerial(i));
  assert.equal(allocateSerial(used, () => 5), "9999"); // only one left, found by scanning
  used.add("9999");
  assert.equal(allocateSerial(used), null);
});

test("when every serial is active the store refuses to create a booking (no duplicate is issued)", async () => {
  const { dir, cleanup } = await tempDir();
  try {
    const records = Array.from({ length: SERIAL_SPACE }, (_, i) => ({
      id: `id-${i}`, serial: formatSerial(i), tier: "pro", seats: [1 + (i % 6)], date: `2031-${String(1 + (i % 12)).padStart(2, "0")}-${String(1 + (i % 28)).padStart(2, "0")}`,
      startHour: 10 + (i % 12), hours: 1, name: "Seed", phone: "0900", note: "", status: "confirmed", source: "online", pricePerSeat: 140000, total: 140000, createdAt: "2030-01-01T00:00:00.000Z",
    }));
    // make the seeded records conflict-free: unique (date, hour, seat) is not guaranteed, so use tier/seat/date/hour combos only for serial purposes
    await writeFile(path.join(dir, "reservations.json"), JSON.stringify({ schemaVersion: 2, reservations: records }));
    const s = store(dir);
    const r = await s.create(draft({ tier: "standard", seats: [1], date: "2032-05-05", startHour: 10, hours: 1, phone: "0999" }));
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.code, "SERIAL_EXHAUSTED");
    assert.equal((await s.list()).length, SERIAL_SPACE);
  } finally {
    await cleanup();
  }
});

test("persisted files: rolling backup exists after a write and the data file is valid v2", async () => {
  const { dir, cleanup } = await tempDir();
  try {
    const s = store(dir);
    await s.create(draft({ seats: [1], phone: "0911" }));
    await s.create(draft({ seats: [2], phone: "0912" }));
    const disk = JSON.parse(await readFile(path.join(dir, "reservations.json"), "utf8"));
    assert.equal(disk.schemaVersion, 2);
    assert.equal(disk.reservations.length, 2);
    const bak = JSON.parse(await readFile(path.join(dir, "backups", "latest.bak.json"), "utf8"));
    assert.equal(bak.reservations.length, 1); // state before the last write
  } finally {
    await cleanup();
  }
});

test("availability helper marks overlapping seats as taken", () => {
  const booked = [{ seats: [1, 2], startHour: 18, hours: 2 }, { seats: [3], startHour: 20, hours: 1 }];
  assert.deepEqual([...takenSeats(booked, 19, 2)].sort(), [1, 2, 3]);
  assert.deepEqual([...takenSeats(booked, 20, 1)].sort(), [3]);
  assert.deepEqual([...takenSeats(booked, 21, 1)], []);
  void FIXED_NOW;
});
