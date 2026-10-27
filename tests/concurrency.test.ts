import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { tempDir, store, draft } from "./helpers";

test("12 parallel in-process bookings for one seat: exactly one wins, no corruption", async () => {
  const { dir, cleanup } = await tempDir();
  try {
    const s = store(dir);
    const results = await Promise.all(Array.from({ length: 12 }, (_, i) => s.create(draft({ seats: [1], phone: `0912000${i}` }))));
    assert.equal(results.filter((r) => r.ok).length, 1);
    assert.equal(results.filter((r) => !r.ok && r.code === "CONFLICT").length, 11);
    assert.equal((await s.list()).length, 1);
  } finally {
    await cleanup();
  }
});

test("parallel bookings of different seats all succeed and get distinct serials", async () => {
  const { dir, cleanup } = await tempDir();
  try {
    const s = store(dir);
    const results = await Promise.all([1, 2, 3, 4].map((n) => s.create(draft({ seats: [n], phone: `09110${n}` }))));
    assert.ok(results.every((r) => r.ok));
    const serials = results.map((r) => (r.ok ? r.reservation.serial : ""));
    assert.equal(new Set(serials).size, 4);
  } finally {
    await cleanup();
  }
});

test("6 SEPARATE node processes racing for the same seat: exactly one wins (cross-process file lock)", async () => {
  const { dir, cleanup } = await tempDir();
  try {
    const root = path.resolve(import.meta.dirname, "..");
    const run = (tag: string) =>
      new Promise<{ tag: string; ok: boolean; code: string | null }>((resolve, reject) => {
        execFile(
          process.execPath,
          ["--import", path.join(root, "scripts/register.mjs"), path.join(root, "tests/helpers/child-create.ts"), dir, tag],
          { cwd: root },
          (err, stdout, stderr) => (err ? reject(new Error(`${err.message}\n${stderr}`)) : resolve(JSON.parse(stdout)))
        );
      });
    const results = await Promise.all(["1", "2", "3", "4", "5", "6"].map(run));
    assert.equal(results.filter((r) => r.ok).length, 1, JSON.stringify(results));
    assert.equal(results.filter((r) => r.code === "CONFLICT").length, 5, JSON.stringify(results));
    const disk = JSON.parse(await readFile(path.join(dir, "reservations.json"), "utf8"));
    assert.equal(disk.reservations.length, 1);
  } finally {
    await cleanup();
  }
});
