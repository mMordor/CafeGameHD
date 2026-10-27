import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";
import type { Source, Status } from "./config";

// File-based storage so it works with zero setup locally / on a VPS.
// For production on read-only hosts (e.g. Vercel) swap these functions for a real
// database such as Postgres, Supabase or MongoDB. The rest of the app stays the same.

export type Reservation = {
  id: string;
  tier: string;
  seat: number;
  date: string;
  startHour: number;
  hours: number;
  name: string;
  phone: string;
  note: string;
  status: Status;
  source: Source;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
};

const FILE = path.join(process.cwd(), "data", "reservations.json");
let chain: Promise<unknown> = Promise.resolve();

// Older records (before staff tools existed) have no status/source/note.
const normalize = (r: Partial<Reservation>): Reservation =>
  ({ note: "", status: "confirmed", source: "online", ...r }) as Reservation;

async function readAll(): Promise<Reservation[]> {
  try {
    const raw = JSON.parse(await fs.readFile(FILE, "utf8"));
    return Array.isArray(raw) ? raw.map(normalize) : [];
  } catch {
    return [];
  }
}

async function writeAll(all: Reservation[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(all, null, 2));
}

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.catch(() => undefined);
  return run;
}

// A cancelled reservation frees its seat.
const isActive = (r: Reservation) => r.status !== "cancelled";

export const overlaps = (
  a: { startHour: number; hours: number },
  b: { startHour: number; hours: number }
) => a.startHour < b.startHour + b.hours && b.startHour < a.startHour + a.hours;

const clashes = (a: Reservation, b: Reservation) =>
  a.date === b.date && a.tier === b.tier && a.seat === b.seat && overlaps(a, b);

// Public availability (no personal data is exposed by the route that uses this).
export async function listActive(date: string, tier: string) {
  const all = await readAll();
  return all.filter((r) => r.date === date && r.tier === tier && isActive(r));
}

export async function listAll(filter: { date?: string; tier?: string } = {}) {
  const all = await readAll();
  return all
    .filter((r) => (!filter.date || r.date === filter.date) && (!filter.tier || r.tier === filter.tier))
    .sort((a, b) => a.date.localeCompare(b.date) || a.startHour - b.startHour || a.seat - b.seat);
}

// Returns null when the seat is already taken for that time.
export function createReservation(
  input: Omit<Reservation, "id" | "createdAt">
): Promise<Reservation | null> {
  return withLock(async () => {
    const all = await readAll();
    const draft: Reservation = {
      ...input,
      id: randomBytes(3).toString("hex").toUpperCase(),
      createdAt: new Date().toISOString(),
    };
    if (isActive(draft) && all.some((r) => isActive(r) && clashes(r, draft))) return null;
    await writeAll([...all, draft]);
    return draft;
  });
}

export function updateReservation(
  id: string,
  patch: Partial<Omit<Reservation, "id" | "createdAt">>
): Promise<{ reservation: Reservation } | { error: "not_found" | "conflict" }> {
  return withLock(async () => {
    const all = await readAll();
    const idx = all.findIndex((r) => r.id === id);
    if (idx === -1) return { error: "not_found" as const };
    const next: Reservation = {
      ...all[idx],
      ...patch,
      id: all[idx].id,
      createdAt: all[idx].createdAt,
      updatedAt: new Date().toISOString(),
    };
    if (isActive(next) && all.some((r, i) => i !== idx && isActive(r) && clashes(r, next))) {
      return { error: "conflict" as const };
    }
    all[idx] = next;
    await writeAll(all);
    return { reservation: next };
  });
}

export function deleteReservation(id: string): Promise<boolean> {
  return withLock(async () => {
    const all = await readAll();
    const rest = all.filter((r) => r.id !== id);
    if (rest.length === all.length) return false;
    await writeAll(rest);
    return true;
  });
}
