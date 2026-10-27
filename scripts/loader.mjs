import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hasExt = /\.[cm]?[jt]sx?$|\.json$|\.node$/;

export async function resolve(specifier, context, nextResolve) {
  let spec = specifier;
  if (spec.startsWith("@/")) spec = pathToFileURL(path.join(root, spec.slice(2))).href;
  const relative = spec.startsWith("./") || spec.startsWith("../");
  if ((relative || spec.startsWith("file:")) && !hasExt.test(spec)) {
    const base = spec.startsWith("file:")
      ? fileURLToPath(spec)
      : path.resolve(path.dirname(fileURLToPath(context.parentURL)), spec);
    for (const candidate of [`${base}.ts`, path.join(base, "index.ts")]) {
      if (existsSync(candidate)) return nextResolve(pathToFileURL(candidate).href, context);
    }
  }
  return nextResolve(spec, context);
}
