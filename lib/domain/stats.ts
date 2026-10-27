import type { NowInfo } from "../time";
import { hasEnded } from "./reservation";
import type { Reservation } from "./reservation";

export type Stats = {
  total: number;
  upcoming: number; // confirmed, not yet checked in, and not yet ended
  checkedIn: number;
  completed: number;
  cancelled: number;
  noShow: number;
  expectedRevenue: number; // toman: confirmed + checked-in + completed (cancelled / no-show excluded)
};

export function computeStats(list: Reservation[], now: NowInfo): Stats {
  const s: Stats = { total: list.length, upcoming: 0, checkedIn: 0, completed: 0, cancelled: 0, noShow: 0, expectedRevenue: 0 };
  for (const r of list) {
    if (r.status === "confirmed" && !hasEnded(r, now)) s.upcoming++;
    if (r.status === "checked_in") s.checkedIn++;
    if (r.status === "completed") s.completed++;
    if (r.status === "cancelled") s.cancelled++;
    if (r.status === "no_show") s.noShow++;
    if (r.status === "confirmed" || r.status === "checked_in" || r.status === "completed") s.expectedRevenue += r.total;
  }
  return s;
}
