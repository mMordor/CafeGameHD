// Usage: npm run migrate     (DATA_DIR optionally overrides ./data)
// Safe to run repeatedly. Backs up the original file first and quarantines malformed records.
import path from "node:path";
import { createFileStore } from "../lib/storage/file";

const dir = process.env.DATA_DIR || path.join(process.cwd(), "data");
const store = createFileStore({ dir });
const report = await store.migrate();

if (!report) {
  console.log(`Nothing to migrate in ${store.paths.file} (already current, or file does not exist yet).`);
} else {
  console.log(`Migrated ${report.migrated} of ${report.total} record(s) from schema v${report.fromVersion}.`);
  if (report.backupFile) console.log(`Original backed up to: ${report.backupFile}`);
  if (report.quarantined.length) {
    console.log(`${report.quarantined.length} malformed record(s) moved to ${store.paths.quarantine}:`);
    for (const q of report.quarantined) console.log(`  - ${q.id ?? "(no id)"}: ${q.reason}`);
  }
  for (const w of report.warnings) console.log(`  warning: ${w}`);
}
