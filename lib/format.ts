// Persian formatting helpers. Dates are stored as Gregorian ISO strings; the UI shows Jalali
// using the platform's Intl (ICU) calendar data, not a hand-written conversion.

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export const toPersianDigits = (v: string | number): string =>
  String(v).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);

// Converts Persian (۰-۹) and Arabic-Indic (٠-٩) digits to ASCII.
export const normalizeDigits = (s: string): string =>
  s
    .replace(/[\u06F0-\u06F9]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
    .replace(/[\u0660-\u0669]/g, (c) => String(c.charCodeAt(0) - 0x0660));

export const formatNumber = (n: number): string => new Intl.NumberFormat("fa-IR").format(n);
export const formatToman = (n: number): string => `${formatNumber(n)} تومان`;
export const formatHour = (h: number): string => toPersianDigits(`${String(h).padStart(2, "0")}:00`);
export const formatTimeRange = (start: number, hours: number): string =>
  `${formatHour(start)} تا ${formatHour(start + hours)}`;
export const formatSeats = (seats: number[]): string => seats.map(toPersianDigits).join("، ");

const noonUTC = (iso: string) => new Date(`${iso}T12:00:00Z`);

function jalaliParts(iso: string, opts: Intl.DateTimeFormatOptions, numbering = "arabext") {
  const fmt = new Intl.DateTimeFormat(`fa-IR-u-ca-persian-nu-${numbering}`, { ...opts, timeZone: "UTC" });
  const out: Record<string, string> = {};
  for (const p of fmt.formatToParts(noonUTC(iso))) out[p.type] = p.value;
  return out;
}

// "یکشنبه ۴ آبان ۱۴۰۵"
export function formatJalali(iso: string): string {
  const p = jalaliParts(iso, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return `${p.weekday} ${p.day} ${p.month} ${p.year}`;
}

// "۴ آبان"
export function formatJalaliShort(iso: string): string {
  const p = jalaliParts(iso, { day: "numeric", month: "long" });
  return `${p.day} ${p.month}`;
}

export function jalaliChip(iso: string): { weekday: string; day: string; month: string } {
  const p = jalaliParts(iso, { weekday: "long", day: "numeric", month: "long" });
  return { weekday: p.weekday, day: p.day, month: p.month };
}

// Numeric Jalali date (for tests and sorting); uses Latin digits.
export function jalaliNumeric(iso: string): { year: number; month: number; day: number } {
  const p = jalaliParts(iso, { day: "numeric", month: "numeric", year: "numeric" }, "latn");
  return { year: Number(p.year), month: Number(p.month), day: Number(p.day) };
}
