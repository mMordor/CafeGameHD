import test from "node:test";
import assert from "node:assert/strict";
import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { tempDir, store } from "./helpers";
import { StorageError } from "../lib/storage/types";

const legacy = [
  { id: "A1B2C3", tier: "standard", seat: 3, date: "2031-02-01", startHour: 18, hours: 2, name: "Legacy One", phone: "0912", status: "confirmed", source: "online", createdAt: "2030-01-01T00:00:00.000Z" },
  { id: "D4E5F6", tier: "pro", seat: 2, date: "2031-02-01", startHour: 18, hours: 1, name: "Legacy Two", phone: "0913", createdAt: "2030-01-02T00:00:00.000Z" },
  { id: "BADBAD", tier: "nope", seat: 1, date: "2031-02-01", startHour: 18, hours: 1, name: "Bad tier" },
  { id: "A1B2C3", tier: "standard", seat: 4, date: "2031-02-01", startHour: 20, hours: 1, name: "Duplicate id" },
  "not an object",
];

test("legacy seat -> seats[] migration keeps valid records, backs up, quarantines the rest", async () => {
  const { dir, cleanup } = await tempDir();
  try {
    const file = path.join(dir, "reservations.json");
    const original = JSON.stringify(legacy);
    await writeFile(file, original);
    const s = store(dir);
    const all = await s.list();

    assert.equal(all.length, 2);
    const one = all.find((r) => r.id === "A1B2C3")!;
    assert.deepEqual(one.seats, [3]);
    assert.equal("seat" in one, false);
    assert.match(one.serial, /^\d{4}$/);
    assert.equal(one.status, "confirmed");
    assert.equal(one.pricePerSeat, 130000);
    assert.equal(one.total, 130000 * 2);
    assert.equal(one.pricingEstimated, true);
    const two = all.find((r) => r.id === "D4E5F6")!;
    assert.equal(two.source, "online"); // defaulted
    assert.equal(two.total, 140000);

    // original bytes preserved in a backup
    const backups = await readdir(path.join(dir, "backups"));
    const pre = backups.find((f) => f.startsWith("reservations.pre-migration-"))!;
    assert.ok(pre);
    assert.equal(await readFile(path.join(dir, "backups", pre), "utf8"), original);

    // malformed records quarantined, not dropped
    const q = JSON.parse(await readFile(path.join(dir, "quarantine.json"), "utf8"));
    assert.equal(q.length, 3);
    assert.ok(q.some((x: { reason: string }) => x.reason.includes("unknown tier")));
    assert.ok(q.some((x: { reason: string }) => x.reason === "duplicate id"));

    // file is now schema v2
    const disk = JSON.parse(await readFile(file, "utf8"));
    assert.equal(disk.schemaVersion, 2);
    assert.equal(disk.reservations.length, 2);
  } finally {
    await cleanup();
  }
});

test("migration is idempotent: a second run changes nothing and creates no new backup", async () => {
  const { dir, cleanup } = await tempDir();
  try {
    await writeFile(path.join(dir, "reservations.json"), JSON.stringify(legacy));
    const first = await store(dir).list();
    const diskBefore = await readFile(path.join(dir, "reservations.json"), "utf8");
    const backupsBefore = await readdir(path.join(dir, "backups"));

    const s2 = store(dir);
    const second = await s2.list();
    assert.deepEqual(second, first);
    assert.equal(await s2.migrate(), null);
    assert.equal(await readFile(path.join(dir, "reservations.json"), "utf8"), diskBefore);
    assert.deepEqual(await readdir(path.join(dir, "backups")), backupsBefore);
    const q = JSON.parse(await readFile(path.join(dir, "quarantine.json"), "utf8"));
    assert.equal(q.length, 3); // not appended again
  } finally {
    await cleanup();
  }
});

test("a corrupt data file is an ERROR, never an empty database, and is left untouched", async () => {
  const { dir, cleanup } = await tempDir();
  try {
    const file = path.join(dir, "reservations.json");
    const broken = '{"schemaVersion":2,"reservations":[{"id":"x"';
    await writeFile(file, broken);
    const s = store(dir);
    await assert.rejects(() => s.list(), (e: unknown) => e instanceof StorageError && e.code === "corrupt");
    await assert.rejects(() => s.create(({ tier: "standard", seats: [1], date: "2031-01-10", startHour: 18, hours: 1, name: "n", phone: "0912", note: "", status: "confirmed", source: "online", pricePerSeat: 1, total: 1 }) as never), (e: unknown) => e instanceof StorageError);
    assert.equal(await readFile(file, "utf8"), broken); // never overwritten
  } finally {
    await cleanup();
  }
});

test("an empty (0-byte) file and wrong structure are treated as corrupt, not empty", async () => {
  const { dir, cleanup } = await tempDir();
  try {
    await writeFile(path.join(dir, "reservations.json"), "");
    await assert.rejects(() => store(dir).list(), (e: unknown) => e instanceof StorageError && e.code === "corrupt");
    await writeFile(path.join(dir, "reservations.json"), '{"hello":1}');
    await assert.rejects(() => store(dir).list(), (e: unknown) => e instanceof StorageError && e.code === "corrupt");
  } finally {
    await cleanup();
  }
});

test("a missing file is simply an empty database", async () => {
  const { dir, cleanup } = await tempDir();
  try {
    assert.deepEqual(await store(dir).list(), []);
  } finally {
    await cleanup();
  }
});

test("a newer schema version is refused", async () => {
  const { dir, cleanup } = await tempDir();
  try {
    await writeFile(path.join(dir, "reservations.json"), JSON.stringify({ schemaVersion: 99, reservations: [] }));
    await assert.rejects(() => store(dir).list(), (e: unknown) => e instanceof StorageError && e.code === "newer_schema");
  } finally {
    await cleanup();
  }
});

test("legacy record with a seat above the current capacity is kept with a warning", async () => {
  const { dir, cleanup } = await tempDir();
  try {
    await writeFile(path.join(dir, "reservations.json"), JSON.stringify([{ id: "OLD123", tier: "standard", seat: 12, date: "2031-02-01", startHour: 10, hours: 1, name: "Old", phone: "0912" }]));
    const s = store(dir);
    assert.equal((await s.list()).length, 1);
  } finally {
    await cleanup();
  }
});
