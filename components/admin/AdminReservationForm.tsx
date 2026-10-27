"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Reservation } from "@/lib/domain/reservation";
import { SITE, TIERS, getTier } from "@/lib/config";
import type { TierId } from "@/lib/config";
import { takenSeats } from "@/lib/domain/availability";
import { formatHour, formatJalali, formatToman, toPersianDigits } from "@/lib/format";
import { useModalA11y } from "@/lib/hooks";
import { quote } from "@/lib/pricing";
import { businessNow } from "@/lib/time";
import SeatMap from "../SeatMap";

// One form for "add phone reservation" and "edit reservation".
export default function AdminReservationForm({
  initial,
  defaultDate,
  onClose,
  onSaved,
  onUnauthorized,
}: {
  initial?: Reservation;
  defaultDate: string;
  onClose: () => void;
  onSaved: () => void;
  onUnauthorized: () => void;
}) {
  const editing = !!initial;
  const now = useMemo(() => businessNow(), []);
  const [tierId, setTierId] = useState<TierId>(initial?.tier ?? "standard");
  const [date, setDate] = useState(initial?.date ?? defaultDate);
  const [start, setStart] = useState(initial?.startHour ?? Math.min(Math.max(now.hour, SITE.openHour), SITE.closeHour - 1));
  const [hours, setHours] = useState(initial?.hours ?? 1);
  const [seats, setSeats] = useState<number[]>(initial?.seats ?? []);
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [arrived, setArrived] = useState(false);
  const [others, setOthers] = useState<Reservation[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLFormElement>(null);
  useModalA11y(dialogRef, onClose);

  const tier = getTier(tierId);
  const startOptions = useMemo(() => Array.from({ length: SITE.closeHour - SITE.openHour }, (_, i) => SITE.openHour + i), []);
  const maxLen = Math.min(SITE.maxHours, SITE.closeHour - start);
  const effHours = Math.max(1, Math.min(hours, maxLen));

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/reservations?date=${date}&tier=${tierId}`)
      .then((r) => {
        if (r.status === 401) onUnauthorized();
        return r.ok ? r.json() : { reservations: [] };
      })
      .then((d) => !cancelled && setOthers((d.reservations ?? []) as Reservation[]))
      .catch(() => !cancelled && setOthers([]));
    return () => {
      cancelled = true;
    };
  }, [date, tierId, onUnauthorized]);

  const taken = useMemo(() => {
    const blocking = others.filter((r) => r.id !== initial?.id && (r.status === "confirmed" || r.status === "checked_in"));
    return takenSeats(blocking, start, effHours);
  }, [others, start, effHours, initial?.id]);
  const chosen = useMemo(() => seats.filter((s) => s <= tier.seats && !taken.has(s)), [seats, taken, tier.seats]);
  const price = chosen.length ? quote(tierId, chosen.length, effHours, initial && initial.tier === tierId ? initial.pricePerSeat : undefined) : null;

  const toggle = (n: number) => setSeats((cur) => (cur.includes(n) ? cur.filter((s) => s !== n) : [...cur, n].sort((a, b) => a - b)));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError("");
    if (chosen.length === 0) return setError("حداقل یک سیستم آزاد را انتخاب کنید.");
    setBusy(true);
    try {
      const payload: Record<string, unknown> = { tier: tierId, seats: chosen, date, startHour: start, hours: effHours, name, phone, note };
      if (!editing && arrived) payload.status = "checked_in";
      const res = await fetch(editing ? `/api/admin/reservations/${initial!.id}` : "/api/admin/reservations", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) return onUnauthorized();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error ?? "ذخیره انجام نشد.");
      onSaved();
    } catch {
      setError("اتصال به سرور برقرار نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="adm-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="adm-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-label={editing ? "ویرایش رزرو" : "ثبت رزرو تلفنی"} ref={dialogRef}>
        <div className="adm-modal-head">
          <h2>{editing ? `ویرایش رزرو ${toPersianDigits(initial!.serial)}` : "ثبت رزرو تلفنی"}</h2>
          <button type="button" className="adm-x" onClick={onClose} aria-label="بستن">×</button>
        </div>

        <div className="adm-seg" role="radiogroup" aria-label="نوع سیستم">
          {TIERS.map((t) => (
            <button type="button" key={t.id} role="radio" aria-checked={tierId === t.id} className={tierId === t.id ? "on" : ""} onClick={() => { setTierId(t.id); setSeats([]); }}>
              <span><span className="ltr">{t.nameEn}</span> ({t.nameFa})</span>
              <small>{formatToman(t.pricePerSeatHour)} / ساعت</small>
            </button>
          ))}
        </div>

        <div className="adm-row3">
          <label>
            تاریخ
            <input type="date" value={date} onChange={(e) => setDate(e.target.value || defaultDate)} required dir="ltr" />
            <small className="adm-hint">{date ? formatJalali(date) : ""}</small>
          </label>
          <label>
            ساعت شروع
            <select value={start} onChange={(e) => setStart(Number(e.target.value))}>
              {startOptions.map((h) => (
                <option key={h} value={h}>{formatHour(h)}</option>
              ))}
            </select>
          </label>
          <label>
            مدت (ساعت)
            <select value={effHours} onChange={(e) => setHours(Number(e.target.value))}>
              {Array.from({ length: Math.max(maxLen, 1) }, (_, i) => i + 1).map((h) => (
                <option key={h} value={h}>{toPersianDigits(h)}</option>
              ))}
            </select>
          </label>
        </div>

        <fieldset className="adm-seats">
          <legend>
            انتخاب سیستم (آزاد برای این زمان: {toPersianDigits(tier.seats - taken.size)} از {toPersianDigits(tier.seats)})
          </legend>
          <SeatMap capacity={tier.seats} taken={taken} selected={chosen} onToggle={toggle} />
        </fieldset>

        <div className="adm-row2">
          <label>
            نام مشتری
            <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={60} />
          </label>
          <label>
            تلفن (اختیاری)
            <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" dir="ltr" />
          </label>
        </div>
        <label>
          توضیحات (اختیاری)
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="مثلاً: گروه چهار نفره، سیستم‌ها کنار هم" />
        </label>

        {!editing && (
          <label className="adm-check">
            <input type="checkbox" checked={arrived} onChange={(e) => setArrived(e.target.checked)} />
            مشتری همین الان حاضر است (ثبت به‌عنوان «حاضر شد»)
          </label>
        )}

        {error && <p className="adm-error" role="alert">{error}</p>}

        <div className="adm-modal-foot">
          <strong>{price ? formatToman(price.total) : "—"}</strong>
          <div>
            <button type="button" className="adm-btn" onClick={onClose}>انصراف</button>{" "}
            <button className="adm-btn primary" disabled={busy}>
              {busy ? "در حال ذخیره…" : editing ? "ذخیره تغییرات" : "ثبت رزرو"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
