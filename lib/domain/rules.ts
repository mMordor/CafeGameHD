import { getTier } from "../config";
import type { Status } from "../config";
import { quote } from "../pricing";
import type { BookingInput } from "../validate";
import { canTransition } from "./status";
import { isBlocking } from "./reservation";
import type { Reservation } from "./reservation";

export type RuleFailure = { ok: false; code: "INVALID_TRANSITION" | "NOT_EDITABLE"; message: string };

export function checkStatusChange(current: Reservation, next: Status): { ok: true; noop: boolean } | RuleFailure {
  if (current.status === next) return { ok: true, noop: true };
  if (!canTransition(current.status, next)) {
    return { ok: false, code: "INVALID_TRANSITION", message: "این تغییر وضعیت مجاز نیست." };
  }
  return { ok: true, noop: false };
}

// Only active bookings can be edited. Others must be reinstated (status change) first.
export function buildEditPatch(
  current: Reservation,
  input: BookingInput
): { ok: true; patch: Partial<Reservation> } | RuleFailure {
  if (!isBlocking(current)) {
    return { ok: false, code: "NOT_EDITABLE", message: "فقط رزروهای فعال قابل ویرایش هستند. ابتدا وضعیت را به «تأیید شده» برگردانید." };
  }
  // Keep the historical unit price unless the PC type changes.
  const unit = input.tier === current.tier ? current.pricePerSeat : getTier(input.tier).pricePerSeatHour;
  const q = quote(input.tier, input.seats.length, input.hours, unit);
  return {
    ok: true,
    patch: {
      tier: input.tier,
      seats: input.seats,
      date: input.date,
      startHour: input.startHour,
      hours: input.hours,
      name: input.name,
      phone: input.phone,
      note: input.note,
      pricePerSeat: q.pricePerSeat,
      total: q.total,
    },
  };
}
