import { SITE, getTier, isTierId } from "./config";
import type { TierId } from "./config";
import { normalizeDigits, toPersianDigits } from "./format";
import { businessNow, isoAddDays, isValidISODate } from "./time";
import type { NowInfo } from "./time";

export type BookingInput = {
  tier: TierId;
  seats: number[];
  date: string;
  startHour: number;
  hours: number;
  name: string;
  phone: string;
  note: string;
};

export type ParseResult = { ok: true; value: BookingInput } | { ok: false; field: string; error: string };

const fail = (field: string, error: string): ParseResult => ({ ok: false, field, error });

// Collapses whitespace and strips control / bidi-override characters (ZWNJ is kept: Persian needs it).
const clean = (v: unknown): string =>
  String(v ?? "")
    .replace(/[\u0000-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

type Options = {
  staff: boolean; // staff may omit the phone number and may book the current hour
  now?: NowInfo; // injectable for tests; defaults to the business timezone clock
  allowPastDate?: boolean; // editing an old booking
};

export function parseBooking(body: Record<string, unknown>, opts: Options): ParseResult {
  const { staff } = opts;
  const now = opts.now ?? businessNow();

  if (!isTierId(body.tier)) return fail("tier", "نوع سیستم را انتخاب کنید.");
  const tier = getTier(body.tier);

  // `seat` (single number) is accepted for backward compatibility with the old API.
  const rawSeats: unknown[] = Array.isArray(body.seats) ? body.seats : body.seat !== undefined ? [body.seat] : [];
  if (rawSeats.length === 0) return fail("seats", "حداقل یک سیستم را انتخاب کنید.");
  const seats = rawSeats.map((s) => (typeof s === "number" || typeof s === "string" ? Number(s) : NaN));
  if (seats.some((s) => !Number.isInteger(s) || s < 1 || s > tier.seats))
    return fail("seats", "شماره سیستم انتخاب‌شده معتبر نیست.");
  if (new Set(seats).size !== seats.length) return fail("seats", "یک سیستم بیش از یک‌بار انتخاب شده است.");
  seats.sort((a, b) => a - b);

  const date = body.date;
  if (!isValidISODate(date)) return fail("date", "تاریخ نامعتبر است.");
  if (!opts.allowPastDate && date < now.date) return fail("date", "تاریخ انتخاب‌شده گذشته است.");
  const windowDays = staff ? SITE.staffWindowDays : SITE.onlineWindowDays;
  if (date > isoAddDays(now.date, windowDays))
    return fail("date", `رزرو حداکثر تا ${toPersianDigits(windowDays)} روز آینده ممکن است.`);

  const startHour = Number(body.startHour);
  const hours = Number(body.hours);
  if (!Number.isInteger(startHour) || !Number.isInteger(hours)) return fail("startHour", "ساعت یا مدت رزرو نامعتبر است.");
  if (startHour < SITE.openHour || startHour + hours > SITE.closeHour)
    return fail(
      "startHour",
      `زمان رزرو باید بین ساعت ${toPersianDigits(SITE.openHour)} و ${toPersianDigits(SITE.closeHour)} باشد.`
    );
  if (hours < 1 || hours > SITE.maxHours)
    return fail("hours", `مدت رزرو باید بین ۱ تا ${toPersianDigits(SITE.maxHours)} ساعت باشد.`);
  if (!staff && date === now.date && startHour <= now.hour)
    return fail("startHour", "این ساعت گذشته است. ساعت بعدی را انتخاب کنید.");

  const name = clean(body.name);
  if (name.length < 2 || name.length > 60) return fail("name", "نام و نام خانوادگی را وارد کنید (۲ تا ۶۰ نویسه).");

  const phone = normalizeDigits(String(body.phone ?? "")).replace(/[\s\-()]/g, "");
  const phoneOk = /^\+?\d{7,15}$/.test(phone);
  if (!staff && !phoneOk) return fail("phone", "شماره تلفن معتبر وارد کنید.");
  if (staff && phone !== "" && !phoneOk) return fail("phone", "شماره تلفن نامعتبر است.");

  const note = clean(body.note);
  if (note.length > 200) return fail("note", "توضیحات حداکثر ۲۰۰ نویسه می‌تواند باشد.");

  return { ok: true, value: { tier: tier.id, seats, date, startHour, hours, name, phone, note } };
}
