// Local JSON-file reservation store. SAFE for development and for a single server with a
// persistent disk. NOT suitable for serverless or multi-machine deployments (see README).
//
// Guarantees:
//  - a missing file is an empty database; an unreadable/corrupt file is an ERROR (never "empty")
//  - writes are atomic (temp file + fsync + rename) and keep a rolling backup
//  - legacy records are migrated idempotently, with a timestamped backup first;
//    malformed records are moved to quarantine.json, never dropped
//  - all reads-modify-writes run under a cross-process file lock
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomInt, randomUUID } from "node:crypto";
import { getTier } from "../config";
import { businessNow } from "../time";
import { activeSerials, findConflicts, hasEnded, isBlocking, sameSeats, serialInUse } from "../domain/reservation";
import type { NewReservation, Reservation } from "../domain/reservation";
import { allocateSerial } from "../domain/serial";
import { normalizeRecord } from "../domain/migrate";
import type { MigrationReport } from "../domain/migrate";
import { withFileLock } from "./lock";
import { StorageError } from "./types";
import type { CreateOptions, CreateResult, ListFilter, ReservationStore, UpdateDecision, UpdateResult } from "./types";

export const SCHEMA_VERSION = 2;

export type FileStoreOptions = {
  dir: string;
  now?: () => Date; // injectable clock (tests)
  rng?: (max: number) => number; // injectable randomness (tests)
};

const codeOf = (e: unknown) => (e as { code?: string }).code;

async function writeAtomic(target: string, data: string) {
  const tmp = `${target}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  const fh = await fs.open(tmp, "w");
  try {
    await fh.writeFile(data);
    await fh.sync();
  } finally {
    await fh.close();
  }
  try {
    await fs.rename(tmp, target);
  } catch (e) {
    await fs.unlink(tmp).catch(() => undefined);
    throw e;
  }
}

export function createFileStore(options: FileStoreOptions) {
  const dir = options.dir;
  const file = path.join(dir, "reservations.json");
  const lockPath = path.join(dir, ".reservations.lock");
  const backups = path.join(dir, "backups");
  const quarantineFile = path.join(dir, "quarantine.json");
  const clock = options.now ?? (() => new Date());
  const rng = options.rng ?? ((m: number) => randomInt(m));
  const nowInfo = () => businessNow(clock());
  let lastReport: MigrationReport | null = null;

  // ---- loading (call only while holding the lock) --------------------------------------------
  async function loadLocked(): Promise<Reservation[]> {
    let raw: string;
    try {
      raw = await fs.readFile(file, "utf8");
    } catch (e) {
      if (codeOf(e) === "ENOENT") return [];
      throw new StorageError("read_failed", `Cannot read ${file}: ${(e as Error).message}`);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new StorageError(
        "corrupt",
        `${file} is not valid JSON. Refusing to continue so no data is overwritten. The file was left untouched; restore from ${backups}.`
      );
    }

    let rawList: unknown[];
    let version = 1;
    if (Array.isArray(parsed)) rawList = parsed;
    else if (parsed && typeof parsed === "object" && Array.isArray((parsed as { reservations?: unknown }).reservations)) {
      rawList = (parsed as { reservations: unknown[] }).reservations;
      version = Number((parsed as { schemaVersion?: unknown }).schemaVersion ?? 1) || 1;
    } else {
      throw new StorageError("corrupt", `${file} has an unexpected structure. Left untouched.`);
    }
    if (version > SCHEMA_VERSION) {
      throw new StorageError("newer_schema", `${file} uses schema ${version}, newer than this app supports (${SCHEMA_VERSION}).`);
    }

    const now = nowInfo();
    const nowIso = clock().toISOString();
    const report: MigrationReport = { fromVersion: version, total: rawList.length, migrated: 0, quarantined: [], warnings: [] };
    const quarantine: { quarantinedAt: string; reason: string; record: unknown }[] = [];
    const changedIds = new Set<string>();
    const seenIds = new Set<string>();
    const out: Reservation[] = [];

    for (const item of rawList) {
      const res = normalizeRecord(item, { pricePerSeat: (t) => getTier(t).pricePerSeatHour, nowIso });
      const idGuess = item && typeof item === "object" ? String((item as { id?: unknown }).id ?? "") || undefined : undefined;
      if (!res.ok) {
        report.quarantined.push({ id: idGuess, reason: res.reason });
        quarantine.push({ quarantinedAt: nowIso, reason: res.reason, record: item });
        continue;
      }
      const r = res.reservation;
      if (seenIds.has(r.id)) {
        report.quarantined.push({ id: r.id, reason: "duplicate id" });
        quarantine.push({ quarantinedAt: nowIso, reason: "duplicate id", record: item });
        continue;
      }
      seenIds.add(r.id);
      if (res.changed) changedIds.add(r.id);
      for (const w of res.warnings) report.warnings.push(`${r.id}: ${w}`);
      out.push(r);
    }

    // Serials: keep valid ones; give a serial to records that have none, and re-issue when two
    // currently-active records share the same one.
    const used = new Set<string>();
    const needs: Reservation[] = [];
    for (const r of out) {
      if (!r.serial) needs.push(r);
      else if (serialInUse(r, now)) {
        if (used.has(r.serial)) needs.push(r);
        else used.add(r.serial);
      }
    }
    for (const r of needs) {
      const s = allocateSerial(used, rng);
      if (s === null) throw new StorageError("serial_exhausted", "All 10,000 four-digit serials are in use.");
      r.serial = s;
      if (serialInUse(r, now)) used.add(s);
      changedIds.add(r.id);
    }

    const needsRewrite = version < SCHEMA_VERSION || changedIds.size > 0 || quarantine.length > 0;
    if (!needsRewrite) return out;

    // 1) back up the ORIGINAL bytes, 2) record quarantined items, 3) only then rewrite.
    await fs.mkdir(backups, { recursive: true });
    const stamp = nowIso.replace(/[:.]/g, "-");
    const backupFile = path.join(backups, `reservations.pre-migration-${stamp}.json`);
    await fs.writeFile(backupFile, raw);
    report.backupFile = backupFile;
    report.migrated = changedIds.size;

    if (quarantine.length > 0) {
      let existing: unknown[] = [];
      try {
        const prev = JSON.parse(await fs.readFile(quarantineFile, "utf8"));
        if (Array.isArray(prev)) existing = prev;
        else throw new Error("not an array");
      } catch (e) {
        if (codeOf(e) !== "ENOENT") {
          throw new StorageError("corrupt", `${quarantineFile} is unreadable; refusing to overwrite it.`);
        }
      }
      await writeAtomic(quarantineFile, JSON.stringify([...existing, ...quarantine], null, 2));
    }

    await saveLocked(out);
    lastReport = report;
    return out;
  }

  async function saveLocked(list: Reservation[]) {
    await fs.mkdir(dir, { recursive: true });
    await fs.mkdir(backups, { recursive: true });
    try {
      await fs.copyFile(file, path.join(backups, "latest.bak.json"));
    } catch (e) {
      if (codeOf(e) !== "ENOENT") throw new StorageError("backup_failed", `Could not back up before writing: ${(e as Error).message}`);
    }
    const payload = JSON.stringify({ schemaVersion: SCHEMA_VERSION, updatedAt: clock().toISOString(), reservations: list }, null, 2);
    try {
      await writeAtomic(file, payload);
    } catch (e) {
      throw new StorageError("write_failed", `Could not write ${file}: ${(e as Error).message}`);
    }
  }

  function transact<T>(fn: (list: Reservation[]) => { value: T; changed: boolean }): Promise<T> {
    return withFileLock(lockPath, async () => {
      const list = await loadLocked();
      const { value, changed } = fn(list);
      if (changed) await saveLocked(list);
      return value;
    });
  }

  // Lock-free read of an already-clean v2 file (writes are atomic renames, so this is consistent).
  // Anything that needs migration goes through the locked path.
  async function snapshot(): Promise<Reservation[]> {
    let raw: string | null = null;
    try {
      raw = await fs.readFile(file, "utf8");
    } catch (e) {
      if (codeOf(e) === "ENOENT") return [];
      throw new StorageError("read_failed", `Cannot read ${file}: ${(e as Error).message}`);
    }
    try {
      const p = JSON.parse(raw) as { schemaVersion?: number; reservations?: Reservation[] };
      if (
        p &&
        !Array.isArray(p) &&
        p.schemaVersion === SCHEMA_VERSION &&
        Array.isArray(p.reservations) &&
        p.reservations.every((r) => r && Array.isArray(r.seats) && typeof r.serial === "string" && r.serial !== "")
      ) {
        return p.reservations;
      }
    } catch {
      /* fall through: the locked path reports corruption properly */
    }
    return transact((list) => ({ value: list.slice(), changed: false }));
  }

  // ---- public API -----------------------------------------------------------------------------
  const store: ReservationStore & { migrate(): Promise<MigrationReport | null>; paths: { file: string; backups: string; quarantine: string } } = {
    kind: "file",
    paths: { file, backups, quarantine: quarantineFile },

    async list(filter: ListFilter = {}) {
      const all = await snapshot();
      return all
        .filter(
          (r) =>
            (!filter.date || r.date === filter.date) &&
            (!filter.tier || r.tier === filter.tier) &&
            (!filter.status || r.status === filter.status)
        )
        .sort((a, b) => a.date.localeCompare(b.date) || a.startHour - b.startHour || a.tier.localeCompare(b.tier));
    },

    async listBlocking(date: string, tier: string) {
      const all = await snapshot();
      return all.filter((r) => r.date === date && r.tier === tier && isBlocking(r));
    },

    create(draft: NewReservation, opts: CreateOptions = {}): Promise<CreateResult> {
      return transact<CreateResult>((list) => {
        const now = nowInfo();
        if (draft.phone) {
          const dup = list.find(
            (r) =>
              isBlocking(r) &&
              r.phone === draft.phone &&
              r.tier === draft.tier &&
              r.date === draft.date &&
              r.startHour === draft.startHour &&
              r.hours === draft.hours &&
              sameSeats(r.seats, draft.seats)
          );
          if (dup) return { value: { ok: false, code: "DUPLICATE" }, changed: false };
          if (opts.maxActivePerPhone) {
            const active = list.filter((r) => r.phone === draft.phone && isBlocking(r) && !hasEnded(r, now)).length;
            if (active >= opts.maxActivePerPhone) return { value: { ok: false, code: "PHONE_LIMIT" }, changed: false };
          }
        }
        const conflicts = findConflicts(list, draft);
        if (conflicts.length > 0) {
          const taken = new Set<number>();
          for (const c of conflicts) for (const s of c.seats) if (draft.seats.includes(s)) taken.add(s);
          return { value: { ok: false, code: "CONFLICT", seats: [...taken].sort((a, b) => a - b) }, changed: false };
        }
        const serial = allocateSerial(activeSerials(list, now), rng);
        if (serial === null) return { value: { ok: false, code: "SERIAL_EXHAUSTED" }, changed: false };
        const reservation: Reservation = { ...draft, id: randomUUID(), serial, createdAt: clock().toISOString() };
        list.push(reservation);
        return { value: { ok: true, reservation }, changed: true };
      });
    },

    update(id: string, decide: (current: Reservation) => UpdateDecision): Promise<UpdateResult> {
      return transact<UpdateResult>((list) => {
        const idx = list.findIndex((r) => r.id === id);
        if (idx < 0) return { value: { ok: false, code: "NOT_FOUND" }, changed: false };
        const cur = list[idx];
        const d = decide(cur);
        if ("error" in d) return { value: { ok: false, code: d.error.code, message: d.error.message }, changed: false };

        const next: Reservation = {
          ...cur,
          ...d.patch,
          id: cur.id,
          serial: cur.serial,
          createdAt: cur.createdAt,
          updatedAt: clock().toISOString(),
        };
        if (isBlocking(next) && findConflicts(list, next, id).length > 0) {
          return { value: { ok: false, code: "CONFLICT" }, changed: false };
        }
        // A reinstated / moved booking must not share an active serial with another booking.
        const now = nowInfo();
        if (serialInUse(next, now) && list.some((r) => r.id !== id && serialInUse(r, now) && r.serial === next.serial)) {
          const fresh = allocateSerial(activeSerials(list.filter((r) => r.id !== id), now), rng);
          if (fresh === null) return { value: { ok: false, code: "SERIAL_EXHAUSTED" }, changed: false };
          next.serial = fresh;
        }
        list[idx] = next;
        return { value: { ok: true, reservation: next }, changed: true };
      });
    },

    remove(id: string): Promise<boolean> {
      return transact<boolean>((list) => {
        const idx = list.findIndex((r) => r.id === id);
        if (idx < 0) return { value: false, changed: false };
        list.splice(idx, 1);
        return { value: true, changed: true };
      });
    },

    // Runs the migration (if needed) and returns its report, or null when nothing was migrated.
    migrate() {
      lastReport = null;
      return transact<MigrationReport | null>(() => ({ value: lastReport, changed: false }));
    },
  };
  return store;
}
