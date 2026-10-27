import { SITE, isTierId } from "@/lib/config";
import { createFailure } from "@/lib/bookingApi";
import { draftFromInput, priceMismatch } from "@/lib/domain/booking";
import { json, jsonError, readJsonBody, storageFailure } from "@/lib/http";
import { once, validKey } from "@/lib/idempotency";
import { hit } from "@/lib/rateLimit";
import { clientIp, sameOrigin } from "@/lib/requestInfo";
import { getStore } from "@/lib/storage";
import { isValidISODate } from "@/lib/time";
import { parseBooking } from "@/lib/validate";

export const dynamic = "force-dynamic";

// Public availability: seats + times only, never names or phone numbers.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? "";
  const tier = searchParams.get("tier") ?? "";
  if (!isValidISODate(date) || !isTierId(tier)) return jsonError(400, "VALIDATION", "تاریخ یا نوع سیستم نامعتبر است.");
  try {
    const list = await getStore().listBlocking(date, tier);
    return json({ booked: list.map(({ seats, startHour, hours }) => ({ seats, startHour, hours })) });
  } catch (e) {
    return storageFailure(e);
  }
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError(403, "FORBIDDEN", "درخواست نامعتبر است.");

  // Anti-abuse: per-IP limit only when a trusted proxy is declared (TRUST_PROXY), plus a global flood guard.
  const ip = clientIp(req);
  const windowMs = 10 * 60 * 1000;
  const limits = [hit("book:global", 60, windowMs), ...(ip ? [hit(`book:ip:${ip}`, 6, windowMs)] : [])];
  const blocked = limits.find((l) => !l.ok);
  if (blocked) {
    return json(
      { error: "تعداد درخواست‌ها زیاد است. چند دقیقه بعد دوباره تلاش کنید.", code: "RATE_LIMITED" },
      429,
      { "Retry-After": String(blocked.retryAfterSec) }
    );
  }

  const body = await readJsonBody(req);
  if (!body.ok) return body.res;
  const data = body.value;

  // Honeypot: real users never fill this hidden field.
  if (typeof data.website === "string" && data.website.trim() !== "") {
    return jsonError(400, "VALIDATION", "درخواست نامعتبر است.");
  }

  const parsed = parseBooking(data, { staff: false });
  if (!parsed.ok) return jsonError(400, "VALIDATION", parsed.error, { field: parsed.field });
  const input = parsed.value;
  const draft = draftFromInput(input, { source: "online", status: "confirmed" });

  // The browser may send the total it displayed; if it is stale the customer must see the real price first.
  if (priceMismatch(data.expectedTotal, draft.total)) {
    return jsonError(409, "PRICE_CHANGED", "مبلغ تغییر کرده است. لطفاً مبلغ جدید را بررسی و دوباره تأیید کنید.", { total: draft.total });
  }

  const key = req.headers.get("idempotency-key");
  const run = async () => {
    try {
      const result = await getStore().create(draft, { maxActivePerPhone: SITE.maxActiveBookingsPerPhone });
      if (!result.ok) {
        const res = createFailure(result, false);
        return { status: res.status, body: await res.json() };
      }
      const r = result.reservation;
      // Only what the customer needs. No internal id, no personal data.
      return {
        status: 201,
        body: {
          reservation: {
            serial: r.serial,
            tier: r.tier,
            seats: r.seats,
            date: r.date,
            startHour: r.startHour,
            hours: r.hours,
            pricePerSeat: r.pricePerSeat,
            total: r.total,
          },
        },
      };
    } catch (e) {
      const res = storageFailure(e);
      return { status: res.status, body: await res.json() };
    }
  };

  const out = validKey(key) ? await once(key, run) : await run();
  return json(out.body, out.status);
}
