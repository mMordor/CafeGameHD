import { clearedCookie } from "@/lib/authCore";
import { json, jsonError } from "@/lib/http";
import { sameOrigin } from "@/lib/requestInfo";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError(403, "FORBIDDEN", "درخواست نامعتبر است.");
  return json({ ok: true }, 200, { "Set-Cookie": clearedCookie() });
}
