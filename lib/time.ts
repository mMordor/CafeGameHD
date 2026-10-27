import { SITE } from "./config";

export type NowInfo = { date: string; hour: number; minute: number };

// Current date/hour in an explicit IANA timezone (never the machine's own timezone).
export function nowInZone(timeZone: string, at: Date = new Date()): NowInfo {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  let hour = Number(get("hour"));
  if (hour === 24) hour = 0;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, hour, minute: Number(get("minute")) };
}

export const businessNow = (at?: Date): NowInfo => nowInZone(SITE.timeZone, at);

export function isValidISODate(s: unknown): s is string {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function isoAddDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
