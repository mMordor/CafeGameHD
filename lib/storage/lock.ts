// Cross-process mutual exclusion using an exclusive lock file ("wx"), plus an in-process queue.
// Works for several Node processes on ONE machine sharing a disk. It does not work across machines.
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { StorageError } from "./types";

const g = globalThis as unknown as { __gzLockChains?: Map<string, Promise<unknown>> };
const chains: Map<string, Promise<unknown>> = (g.__gzLockChains ??= new Map());

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

type Opts = { timeoutMs?: number; staleMs?: number };

async function acquireAndRun<T>(lockPath: string, fn: () => Promise<T>, opts: Opts): Promise<T> {
  const timeoutMs = opts.timeoutMs ?? 15000;
  const staleMs = opts.staleMs ?? 30000;
  await fs.mkdir(path.dirname(lockPath), { recursive: true });
  const token = `${process.pid}:${randomBytes(8).toString("hex")}`;
  const deadline = Date.now() + timeoutMs;

  for (;;) {
    try {
      const fh = await fs.open(lockPath, "wx");
      try {
        await fh.writeFile(token);
      } finally {
        await fh.close();
      }
      break;
    } catch (e) {
      if ((e as { code?: string }).code !== "EEXIST") throw e;
      try {
        const st = await fs.stat(lockPath);
        if (Date.now() - st.mtimeMs > staleMs) {
          // Dead owner: move the stale lock aside atomically (only one contender wins the rename).
          const graveyard = `${lockPath}.stale-${token.replace(":", "-")}`;
          try {
            await fs.rename(lockPath, graveyard);
            await fs.unlink(graveyard).catch(() => undefined);
          } catch {
            /* someone else cleaned it first */
          }
          continue;
        }
      } catch (e2) {
        if ((e2 as { code?: string }).code === "ENOENT") continue;
      }
      if (Date.now() > deadline) throw new StorageError("lock_timeout", "Could not acquire the reservation lock in time.");
      await sleep(10 + Math.random() * 30);
    }
  }

  try {
    return await fn();
  } finally {
    try {
      if ((await fs.readFile(lockPath, "utf8")) === token) await fs.unlink(lockPath);
    } catch {
      /* already gone */
    }
  }
}

export function withFileLock<T>(lockPath: string, fn: () => Promise<T>, opts: Opts = {}): Promise<T> {
  const prev = chains.get(lockPath) ?? Promise.resolve();
  const run = prev.then(() => acquireAndRun(lockPath, fn, opts));
  chains.set(
    lockPath,
    run.then(
      () => undefined,
      () => undefined
    )
  );
  return run;
}
