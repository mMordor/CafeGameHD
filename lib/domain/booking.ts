import { quote } from "../pricing";
import type { Source, Status } from "../config";
import type { BookingInput } from "../validate";
import type { NewReservation } from "./reservation";

// Builds the record to store. Price and total are ALWAYS computed here, never taken from the client.
export function draftFromInput(
  input: BookingInput,
  meta: { source: Source; status: Status; createdBy?: string }
): NewReservation {
  const q = quote(input.tier, input.seats.length, input.hours);
  const draft: NewReservation = {
    tier: input.tier,
    seats: input.seats,
    date: input.date,
    startHour: input.startHour,
    hours: input.hours,
    name: input.name,
    phone: input.phone,
    note: input.note,
    status: meta.status,
    source: meta.source,
    pricePerSeat: q.pricePerSeat,
    total: q.total,
  };
  if (meta.createdBy) draft.createdBy = meta.createdBy;
  return draft;
}

// The browser may send the total it displayed. If it differs from the server's figure the booking is
// rejected so the customer sees the real price before confirming. The client value is never stored.
export function priceMismatch(clientTotal: unknown, serverTotal: number): boolean {
  if (clientTotal === undefined || clientTotal === null) return false;
  return Number(clientTotal) !== serverTotal;
}
