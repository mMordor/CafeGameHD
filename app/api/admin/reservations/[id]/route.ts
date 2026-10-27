import { guard } from "@/lib/guard";
import { json, jsonError, readJsonBody, storageFailure } from "@/lib/http";
import { buildEditPatch, checkStatusChange } from "@/lib/domain/rules";
import { getStore } from "@/lib/storage";
import { parseBooking } from "@/lib/validate";
import { STATUSES } from "@/lib/config";
import type { Status } from "@/lib/config";

export const dynamic = "force-dynamic";

const MESSAGES: Record<string, [number, string]> = {
  NOT_FOUND: [404, "رزرو پیدا نشد."],
  CONFLICT: [409, "این سیستم‌ها در زمان انتخابی قبلاً رزرو شده‌اند."],
  SERIAL_EXHAUSTED: [503, "ظرفیت کدهای رزرو موقتاً تکمیل است."],
  INVALID_TRANSITION: [409, "این تغییر وضعیت مجاز نیست."],
  NOT_EDITABLE: [409, "فقط رزروهای فعال قابل ویرایش هستند."],
};

// Either { status } (status change) or the full booking fields (edit). Not both at once.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const g = guard(req);
  if (g.res) return g.res;
  const body = await readJsonBody(req);
  if (!body.ok) return body.res;
  const data = body.value;

  const wantsStatus = "status" in data;
  const wantsEdit = "tier" in data;
  if (wantsStatus === wantsEdit) {
    return jsonError(400, "VALIDATION", wantsStatus ? "تغییر وضعیت و ویرایش را جداگانه انجام دهید." : "چیزی برای به‌روزرسانی ارسال نشده است.");
  }

  try {
    const store = getStore();
    if (wantsStatus) {
      const next = STATUSES.find((s) => s.id === data.status)?.id as Status | undefined;
      if (!next) return jsonError(400, "VALIDATION", "وضعیت نامعتبر است.");
      const result = await store.update(params.id, (cur) => {
        const check = checkStatusChange(cur, next);
        if (!check.ok) return { error: { code: check.code, message: check.message } };
        return { patch: check.noop ? {} : { status: next } };
      });
      if (!result.ok) {
        const [status, message] = MESSAGES[result.code] ?? [400, result.message ?? "خطا"];
        return jsonError(status, result.code, result.message ?? message);
      }
      return json({ reservation: result.reservation });
    }

    const parsed = parseBooking(data, { staff: true, allowPastDate: true });
    if (!parsed.ok) return jsonError(400, "VALIDATION", parsed.error, { field: parsed.field });
    const result = await store.update(params.id, (cur) => {
      const edit = buildEditPatch(cur, parsed.value);
      if (!edit.ok) return { error: { code: edit.code, message: edit.message } };
      return { patch: edit.patch };
    });
    if (!result.ok) {
      const [status, message] = MESSAGES[result.code] ?? [400, result.message ?? "خطا"];
      return jsonError(status, result.code, result.message ?? message);
    }
    return json({ reservation: result.reservation });
  } catch (e) {
    return storageFailure(e);
  }
}

// Permanent delete: admin only. Managers set the status to "cancelled" instead (keeps a record).
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const g = guard(req, { admin: true });
  if (g.res) return g.res;
  try {
    const ok = await getStore().remove(params.id);
    return ok ? json({ ok: true }) : jsonError(404, "NOT_FOUND", "رزرو پیدا نشد.");
  } catch (e) {
    return storageFailure(e);
  }
}
