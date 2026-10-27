// Lets plain Node run the TypeScript domain/storage code (used by tests and scripts):
// resolves extensionless relative imports and the "@/" alias.
import { register } from "node:module";
register("./loader.mjs", import.meta.url);
