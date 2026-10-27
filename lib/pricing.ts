// The ONE pricing module, used by the browser (to show the total) and by the server (authoritative).
import { getTier } from "./config";
import type { TierId } from "./config";

export type Quote = { pricePerSeat: number; seatCount: number; hours: number; total: number };

// total = hourly price x number of seats x hours.
// `pricePerSeatOverride` keeps an existing booking's historical price when it is edited.
export function quote(tier: TierId, seatCount: number, hours: number, pricePerSeatOverride?: number): Quote {
  if (!Number.isInteger(seatCount) || seatCount < 1) throw new RangeError("seatCount must be a positive integer");
  if (!Number.isInteger(hours) || hours < 1) throw new RangeError("hours must be a positive integer");
  const pricePerSeat = pricePerSeatOverride ?? getTier(tier).pricePerSeatHour;
  return { pricePerSeat, seatCount, hours, total: pricePerSeat * seatCount * hours };
}
