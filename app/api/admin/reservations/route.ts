import { isTierId } from "@/lib/config";
import { createFailure } from "@/lib/bookingApi";
import { draftFromInput } from "@/lib/domain/booking";
import { guard } from "@/lib/guard";
import { json, jsonError, readJsonBody, storageFailure } from "@/lib/http";
import { getStore } from "@/lib/storage";
import { businessNow, isValidISODate } from "@/lib/time";
import { parseBooking } from "@/lib/validate";
import { STATUSES } from "@/lib/config";
import type { Status } from "@/lib/config";

export const dynamic = "force-dynamic";

// Full reservation data (names, phones). Staff only.
export async function GET(req: Request) {
  const g = guard(req);
  if (g.res) return g.res;
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? undefined;
  const tier = searchParams.get("tier") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  if (date !== undefined && !isValidISODate(date)) return jsonError(400, "VALIDATION", "تاریخ نامعتبر است.");
  if (tier !== undefined && !isTierId(tier)) return jsonError(400, "VALIDATION", "نوع سیستم نامعتبر است.");
  if (status !== undefined && !STATUSES.some((s) => s.id === status)) return jsonError(400, "VALIDATION", "وضعیت نامعتبر است.");
  try {
    const reservations = await getStore().list({ date, tier, status });
    return json({ reservations, role: g.session.role, today: businessNow().date });
  } catch (e) {
    return storageFailure(e);
  }
}

// Add a reservation for a customer who phoned or walked in.
export async function POST(req: Request) {
  const g = guard(req);
  if (g.res) return g.res;
  const body = await readJsonBody(req);
  if (!body.ok) return body.res;

  const parsed = parseBooking(body.value, { staff: true });
  if (!parsed.ok) return jsonError(400, "VALIDATION", parsed.error, { field: parsed.field });

  // Staff may register a customer who is already here; cancelled/other states are not valid on creation.
  const requested = body.value.status as Status | undefined;
  const status: Status = requested === "checked_in" ? "checked_in" : "confirmed";
  const draft = draftFromInput(parsed.value, { source: "phone", status, createdBy: g.session.user });

  try {
    const result = await getStore().create(draft); // staff bookings skip the per-phone limit
    if (!result.ok) return createFailure(result, true);
    return json({ reservation: result.reservation }, 201);
  } catch (e) {
    return storageFailure(e);
  }
}
