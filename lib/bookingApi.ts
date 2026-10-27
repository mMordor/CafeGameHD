// Shared mapping from store results to HTTP responses (public and staff booking routes).
import { SITE } from "./config";
import { toPersianDigits } from "./format";
import { jsonError } from "./http";
import type { CreateResult } from "./storage/types";

export function createFailure(r: Extract<CreateResult, { ok: false }>, staff: boolean): Response {
  switch (r.code) {
    case "CONFLICT":
      return jsonError(409, "SEAT_TAKEN", "بعضی از سیستم‌های انتخابی همین حالا رزرو شده‌اند. سیستم یا ساعت دیگری انتخاب کنید.", { seats: r.seats });
    case "DUPLICATE":
      return jsonError(409, "DUPLICATE", "این رزرو قبلاً ثبت شده است.");
    case "PHONE_LIMIT":
      return jsonError(
        429,
        "PHONE_LIMIT",
        `برای هر شماره تلفن حداکثر ${toPersianDigits(SITE.maxActiveBookingsPerPhone)} رزرو فعال امکان‌پذیر است. برای تغییر رزرو با ما تماس بگیرید.`
      );
    default:
      console.error(`[booking] serial space exhausted (staff=${staff})`);
      return jsonError(503, "SERIAL_EXHAUSTED", "ظرفیت کدهای رزرو موقتاً تکمیل است. لطفاً بعداً تلاش کنید یا تماس بگیرید.");
  }
}
