// Pure helpers shared by the browser (seat map) and the server (conflict detection).
export type BookedSlot = { seats: number[]; startHour: number; hours: number };

export const intervalsOverlap = (aStart: number, aHours: number, bStart: number, bHours: number): boolean =>
  aStart < bStart + bHours && bStart < aStart + aHours;

export function takenSeats(booked: BookedSlot[], startHour: number, hours: number): Set<number> {
  const taken = new Set<number>();
  for (const b of booked) {
    if (intervalsOverlap(startHour, hours, b.startHour, b.hours)) for (const s of b.seats) taken.add(s);
  }
  return taken;
}
