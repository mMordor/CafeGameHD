// Server-only (uses node:crypto). Four-digit serial allocation.
import { randomInt } from "node:crypto";

export const SERIAL_SPACE = 10000;
export const formatSerial = (n: number): string => String(n).padStart(4, "0");

// Returns a serial that is not in `used`, or null when all 10,000 are taken.
// Never returns a value from `used`. Call it inside the same lock/transaction that saves the booking.
export function allocateSerial(used: Set<string>, rng: (max: number) => number = (m) => randomInt(m)): string | null {
  if (used.size >= SERIAL_SPACE) return null;
  for (let i = 0; i < 64; i++) {
    const s = formatSerial(rng(SERIAL_SPACE));
    if (!used.has(s)) return s;
  }
  const start = rng(SERIAL_SPACE);
  for (let i = 0; i < SERIAL_SPACE; i++) {
    const s = formatSerial((start + i) % SERIAL_SPACE);
    if (!used.has(s)) return s;
  }
  return null;
}
