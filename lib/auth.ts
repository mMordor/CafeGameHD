// Server-component glue (reads the session cookie via next/headers).
import { cookies } from "next/headers";
import { cookieName, verifyToken } from "./authCore";
import type { Session } from "./authCore";

export function readSession(): Session | null {
  return verifyToken(cookies().get(cookieName())?.value);
}
