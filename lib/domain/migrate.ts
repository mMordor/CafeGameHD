// Normalizes stored records (legacy v1 -> current schema) without ever discarding data silently.
import { STATUSES, TIERS } from "../config";
import type { Source, Status, TierId } from "../config";
import { isValidISODate } from "../time";
import type { Reservation } from "./reservation";

export type MigrationReport = {
  fromVersion: number;
  total: number;
  migrated: number;
  quarantined: { id?: string; reason: string }[];
  warnings: string[];
  backupFile?: string;
};

export type NormalizeCtx = { pricePerSeat: (tier: TierId) => number; nowIso: string };

type Result =
  | { ok: true; reservation: Reservation; changed: boolean; warnings: string[] }
  | { ok: false; reason: string };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const STATUS_IDS = STATUSES.map((s) => s.id);
const bad = (reason: string): Result => ({ ok: false, reason });

export function normalizeRecord(raw: unknown, ctx: NormalizeCtx): Result {
  if (!isObj(raw)) return bad("record is not an object");
  const warnings: string[] = [];
  let changed = false;

  if (typeof raw.id !== "string" || raw.id.trim() === "") return bad("missing id");
  const id = raw.id;
  const tier = TIERS.find((t) => t.id === raw.tier);
  if (!tier) return bad(`unknown tier "${String(raw.tier)}"`);
  if (!isValidISODate(raw.date)) return bad("invalid date");
  const date = raw.date;
  if (!Number.isInteger(raw.startHour) || (raw.startHour as number) < 0 || (raw.startHour as number) > 23) return bad("invalid startHour");
  if (!Number.isInteger(raw.hours) || (raw.hours as number) < 1 || (raw.hours as number) > 24) return bad("invalid hours");
  if (typeof raw.name !== "string") return bad("missing name");

  let seatsRaw: unknown[];
  if (Array.isArray(raw.seats)) seatsRaw = raw.seats;
  else if (raw.seat !== undefined) {
    seatsRaw = [raw.seat]; // legacy single-seat record
    changed = true;
  } else return bad("missing seat(s)");
  if (seatsRaw.length === 0 || seatsRaw.some((s) => !Number.isInteger(s) || (s as number) < 1)) return bad("invalid seat(s)");
  const seats = seatsRaw as number[];
  if (new Set(seats).size !== seats.length) return bad("duplicate seats in one record");
  if (seats.some((s) => s > tier.seats)) {
    warnings.push(`seat number above the current capacity of ${tier.seats} (kept as is)`);
  }

  let status: Status = "confirmed";
  if (raw.status === undefined) changed = true;
  else if (STATUS_IDS.includes(raw.status as Status)) status = raw.status as Status;
  else return bad(`invalid status "${String(raw.status)}"`);

  let source: Source = "online";
  if (raw.source === undefined) changed = true;
  else if (raw.source === "online" || raw.source === "phone") source = raw.source;
  else return bad(`invalid source "${String(raw.source)}"`);

  let phone = "";
  if (typeof raw.phone === "string") phone = raw.phone;
  else changed = true;
  let note = "";
  if (typeof raw.note === "string") note = raw.note;
  else changed = true;

  let createdAt = ctx.nowIso;
  if (typeof raw.createdAt === "string" && raw.createdAt) createdAt = raw.createdAt;
  else {
    changed = true;
    warnings.push("createdAt was missing; set to migration time");
  }

  let pricePerSeat: number;
  let total: number;
  let pricingEstimated = raw.pricingEstimated === true;
  const okNum = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0;
  if (okNum(raw.pricePerSeat) && okNum(raw.total)) {
    pricePerSeat = raw.pricePerSeat;
    total = raw.total;
  } else {
    // No historical price was stored. Price it at today's rate and say so.
    pricePerSeat = ctx.pricePerSeat(tier.id);
    total = pricePerSeat * seats.length * (raw.hours as number);
    pricingEstimated = true;
    changed = true;
    warnings.push("price was not stored; estimated at the current rate");
  }

  let serial = "";
  if (typeof raw.serial === "string" && /^\d{4}$/.test(raw.serial)) serial = raw.serial;
  else changed = true; // the store assigns a serial afterwards

  const rest: Record<string, unknown> = { ...raw };
  delete rest.seat; // legacy field

  const reservation = {
    ...rest,
    id,
    serial,
    tier: tier.id,
    seats,
    date,
    startHour: raw.startHour as number,
    hours: raw.hours as number,
    name: raw.name,
    phone,
    note,
    status,
    source,
    pricePerSeat,
    total,
    createdAt,
  } as Reservation;
  if (pricingEstimated) reservation.pricingEstimated = true;

  return { ok: true, reservation, changed, warnings };
}
