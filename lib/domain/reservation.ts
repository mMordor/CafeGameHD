import type { Source, Status, TierId } from "../config";
import type { NowInfo } from "../time";
import { intervalsOverlap } from "./availability";

export type Reservation = {
  id: string; // internal identifier
  serial: string; // customer-facing 4-digit code ("0000".."9999")
  tier: TierId;
  seats: number[];
  date: string; // Gregorian ISO (YYYY-MM-DD)
  startHour: number;
  hours: number;
  name: string;
  phone: string;
  note: string;
  status: Status;
  source: Source;
  createdBy?: string;
  pricePerSeat: number; // historical price at booking time (toman)
  total: number; // historical total (toman)
  pricingEstimated?: boolean; // true for legacy records priced at migration time
  createdAt: string;
  updatedAt?: string;
};

export type NewReservation = Omit<Reservation, "id" | "serial" | "createdAt" | "updatedAt">;

// Only these statuses hold their seats. cancelled / no_show / completed release them.
export const BLOCKING_STATUSES: readonly Status[] = ["confirmed", "checked_in"];
export const isBlocking = (r: { status: Status }): boolean => BLOCKING_STATUSES.includes(r.status);

export const hasEnded = (r: { date: string; startHour: number; hours: number }, now: NowInfo): boolean =>
  r.date < now.date || (r.date === now.date && r.startHour + r.hours <= now.hour);

// A serial is "in use" while its reservation still holds seats and has not ended.
export const serialInUse = (r: Reservation, now: NowInfo): boolean => isBlocking(r) && !hasEnded(r, now);

export function activeSerials(list: Reservation[], now: NowInfo): Set<string> {
  const used = new Set<string>();
  for (const r of list) if (serialInUse(r, now)) used.add(r.serial);
  return used;
}

export const sameSeats = (a: number[], b: number[]): boolean =>
  a.length === b.length && [...a].sort((x, y) => x - y).every((s, i) => s === [...b].sort((x, y) => x - y)[i]);

type Candidate = { tier: string; date: string; seats: number[]; startHour: number; hours: number };

// Existing blocking reservations that share a seat and overlap in time with the candidate.
export function findConflicts(list: Reservation[], c: Candidate, ignoreId?: string): Reservation[] {
  return list.filter(
    (r) =>
      r.id !== ignoreId &&
      isBlocking(r) &&
      r.tier === c.tier &&
      r.date === c.date &&
      intervalsOverlap(r.startHour, r.hours, c.startHour, c.hours) &&
      r.seats.some((s) => c.seats.includes(s))
  );
}
