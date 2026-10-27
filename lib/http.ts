// Small helpers for route handlers. Uses the standard Response API (no Next imports).
import { StorageError } from "./storage/types";

export const NO_STORE = { "Cache-Control": "no-store" };

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { ...NO_STORE, ...headers } });
}

export function jsonError(status: number, code: string, message: string, extra: Record<string, unknown> = {}): Response {
  return json({ error: message, code, ...extra }, status);
}

// Logs the technical reason on the server only (no request data), shows a generic message to users.
export function storageFailure(e: unknown): Response {
  const code = e instanceof StorageError ? e.code : "unexpected";
  console.error(`[storage] ${code}: ${e instanceof Error ? e.message : String(e)}`);
  return jsonError(503, "STORAGE_UNAVAILABLE", "سرویس رزرو موقتاً در دسترس نیست. لطفاً کمی بعد دوباره تلاش کنید.");
}

export async function readJsonBody(
  req: Request,
  maxBytes = 16 * 1024
): Promise<{ ok: true; value: Record<string, unknown> } | { ok: false; res: Response }> {
  const type = req.headers.get("content-type") ?? "";
  if (!type.toLowerCase().includes("application/json")) {
    return { ok: false, res: jsonError(415, "UNSUPPORTED_MEDIA_TYPE", "درخواست نامعتبر است.") };
  }
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > maxBytes) return { ok: false, res: jsonError(413, "TOO_LARGE", "درخواست بیش از حد بزرگ است.") };
  let text = "";
  try {
    text = await req.text();
  } catch {
    return { ok: false, res: jsonError(400, "VALIDATION", "درخواست نامعتبر است.") };
  }
  if (text.length > maxBytes) return { ok: false, res: jsonError(413, "TOO_LARGE", "درخواست بیش از حد بزرگ است.") };
  try {
    const v = JSON.parse(text);
    if (v && typeof v === "object" && !Array.isArray(v)) return { ok: true, value: v as Record<string, unknown> };
  } catch {
    /* fall through */
  }
  return { ok: false, res: jsonError(400, "VALIDATION", "درخواست نامعتبر است.") };
}
