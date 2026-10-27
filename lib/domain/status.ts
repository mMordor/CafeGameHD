import type { Status } from "../config";

// Allowed status changes. Same-status requests are treated as a harmless no-op by the API.
// "Undo" paths exist because staff make mistakes; reinstating re-checks seat conflicts.
export const TRANSITIONS: Record<Status, Status[]> = {
  confirmed: ["checked_in", "no_show", "cancelled"],
  checked_in: ["completed", "cancelled", "confirmed"],
  completed: ["checked_in"],
  no_show: ["confirmed", "checked_in"],
  cancelled: ["confirmed"],
};

export const canTransition = (from: Status, to: Status): boolean => TRANSITIONS[from]?.includes(to) ?? false;
export const nextStatuses = (from: Status): Status[] => TRANSITIONS[from] ?? [];
