// Child process used by concurrency.test.ts: tries to book the SAME seat and time.
import { createFileStore } from "../../lib/storage/file";
import { draftFromInput } from "../../lib/domain/booking";

const [dir, tag] = process.argv.slice(2);
const store = createFileStore({ dir });
const draft = draftFromInput(
  { tier: "standard", seats: [1], date: "2099-01-01", startHour: 18, hours: 2, name: `Child ${tag}`, phone: `0912000000${tag}`, note: "" },
  { source: "online", status: "confirmed" }
);
const r = await store.create(draft);
process.stdout.write(JSON.stringify({ tag, ok: r.ok, code: r.ok ? null : r.code }));
