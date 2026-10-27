// Static sanity check: every relative or "@/" import in .ts/.tsx files must point to a real file.
// This is NOT a type check. It catches broken paths before `next build`.
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const skip = new Set(["node_modules", ".next", ".git", "data"]);
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(name)) files.push(full);
  }
})(root);

const exts = ["", ".ts", ".tsx", ".css", ".json", "/index.ts", "/index.tsx"];
const re = /(?:import|export)\s+(?:[^"';]*?\s+from\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;
let bad = 0;
for (const file of files) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(re)) {
    const spec = m[1] ?? m[2];
    let base = null;
    if (spec.startsWith("@/")) base = path.join(root, spec.slice(2));
    else if (spec.startsWith(".")) base = path.resolve(path.dirname(file), spec);
    if (!base) continue;
    if (!exts.some((e) => existsSync(base + e) && statSync(base + e).isFile())) {
      console.error(`UNRESOLVED  ${path.relative(root, file)}  ->  ${spec}`);
      bad++;
    }
  }
}
console.log(`${files.length} files scanned, ${bad} unresolved import(s).`);
process.exit(bad ? 1 : 0);
