// Chooses the reservation store. Never silently switches backends.
import path from "node:path";
import { createFileStore } from "./file";
import { StorageError } from "./types";
import type { ReservationStore } from "./types";

const g = globalThis as unknown as { __gzStore?: ReservationStore };

export function getStore(): ReservationStore {
  if (g.__gzStore) return g.__gzStore;

  if (process.env.DATABASE_URL) {
    // Deliberately a hard stop: using files while a database URL is configured would split the data.
    throw new StorageError(
      "postgres_not_implemented",
      "DATABASE_URL is set, but this build has no PostgreSQL adapter (see README > Storage and db/schema.sql). Unset DATABASE_URL to use the local file store."
    );
  }

  if (process.env.NODE_ENV === "production" && process.env.ALLOW_FILE_STORAGE !== "true") {
    throw new StorageError(
      "file_storage_disabled",
      "The JSON file store is not allowed in production by default. Set ALLOW_FILE_STORAGE=true ONLY for a single server with a persistent disk, or implement the PostgreSQL adapter."
    );
  }

  const dir = process.env.DATA_DIR || path.join(process.cwd(), "data");
  g.__gzStore = createFileStore({ dir });
  return g.__gzStore;
}
