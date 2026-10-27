import type { NewReservation, Reservation } from "../domain/reservation";

export class StorageError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "StorageError";
    this.code = code;
  }
}

export type CreateOptions = { maxActivePerPhone?: number };

export type CreateResult =
  | { ok: true; reservation: Reservation }
  | { ok: false; code: "CONFLICT"; seats: number[] }
  | { ok: false; code: "DUPLICATE" | "PHONE_LIMIT" | "SERIAL_EXHAUSTED" };

// Called with the CURRENT stored record inside the store's lock, so read-modify-write is atomic.
export type UpdateDecision =
  | { patch: Partial<Reservation> }
  | { error: { code: string; message: string } };

export type UpdateResult =
  | { ok: true; reservation: Reservation }
  | { ok: false; code: string; message?: string };

export type ListFilter = { date?: string; tier?: string; status?: string };

export type ReservationStore = {
  kind: string;
  list(filter?: ListFilter): Promise<Reservation[]>;
  // Reservations that currently hold seats for a date + tier (public availability).
  listBlocking(date: string, tier: string): Promise<Reservation[]>;
  create(draft: NewReservation, options?: CreateOptions): Promise<CreateResult>;
  update(id: string, decide: (current: Reservation) => UpdateDecision): Promise<UpdateResult>;
  remove(id: string): Promise<boolean>;
};
