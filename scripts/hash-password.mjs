// Usage:  npm run hash-password -- "my password"      (or run without args to type it)
// Prints a value for ADMIN_PASSWORD_HASH / MANAGER_PASSWORD_HASH.
import { randomBytes, scryptSync } from "node:crypto";
import readline from "node:readline";

function hash(password) {
  const N = 16384, r = 8, p = 1;
  const salt = randomBytes(16);
  const dk = scryptSync(password, salt, 32, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${dk.toString("hex")}`;
}

const arg = process.argv[2];
if (arg) {
  console.log(hash(arg));
} else {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question("Password: ", (answer) => {
    rl.close();
    if (!answer) { console.error("Empty password."); process.exit(1); }
    console.log(hash(answer));
  });
}
