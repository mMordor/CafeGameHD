import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createFileStore } from "../lib/storage/file";
import { draftFromInput } from "../lib/domain/booking";
import type { BookingInput } from "../lib/validate";

export async function tempDir() {
  const dir = await mkdtemp(path.join(tmpdir(), "gz-test-"));
  return { dir, cleanup: () => rm(dir, { recursive: true, force: true }) };
}

// A fixed "now" far from any test date: 2030-06-15 12:30 UTC (= 16:00 in Asia/Tehran).
export const FIXED_NOW = new Date("2030-06-15T12:30:00Z");

export const store = (dir: string, extra: Partial<Parameters<typeof createFileStore>[0]> = {}) =>
  createFileStore({ dir, now: () => FIXED_NOW, ...extra });

export const input = (over: Partial<BookingInput> = {}): BookingInput => ({
  tier: "standard",
  seats: [1],
  date: "2031-01-10",
  startHour: 18,
  hours: 2,
  name: "Test User",
  phone: "09120000001",
  note: "",
  ...over,
});

export const draft = (over: Partial<BookingInput> = {}, status: "confirmed" | "checked_in" = "confirmed") =>
  draftFromInput(input(over), { source: "online", status });
