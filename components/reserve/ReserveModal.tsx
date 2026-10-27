"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SITE, TIERS, getTier } from "@/lib/config";
import type { TierId } from "@/lib/config";
import { takenSeats } from "@/lib/domain/availability";
import type { BookedSlot } from "@/lib/domain/availability";
import { formatHour, formatToman, toPersianDigits } from "@/lib/format";
import { useModalA11y } from "@/lib/hooks";
import { quote } from "@/lib/pricing";
import { businessNow } from "@/lib/time";
import DateStrip from "../DateStrip";
import SeatMap from "../SeatMap";
import ReservationConfirmation from "./ReservationConfirmation";
import type { Confirmed } from "./ReservationConfirmation";

const newKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `k${Date.now()}${Math.random().toString(36).slice(2)}`;

export default function ReserveModal({ initialTier, onClose }: { initialTier: TierId; onClose: () => void }) {
  const now = useMemo(() => businessNow(), []);
  const [tierId, setTierId] = useState<TierId>(initialTier);
  const [date, setDate] = useState(now.date);
  const [start, setStart] = useState(Math.max(SITE.openHour, Math.min(now.hour + 1, SITE.closeHour - 1)));
  const [hours, setHours] = useState(1);
  const [seats, setSeats] = useState<number[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [booked, setBooked] = useState<BookedSlot[]>([]);
  const [availability, setAvailability] = useState<"loading" | "ok" | "error">("loading");
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Confirmed | null>(null);
  const keyRef = useRef(newKey());
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalA11y(dialogRef, onClose);

  const tier = getTier(tierId);
  const isToday = date === now.date;

  const startOptions = useMemo(() => {
    const out: number[] = [];
    for (let h = SITE.openHour; h < SITE.closeHour; h++) if (!isToday || h > now.hour) out.push(h);
    return out;
  }, [isToday, now.hour]);
  const effStart = startOptions.includes(start) ? start : startOptions[0] ?? null;
  const maxLen = effStart === null ? 0 : Math.min(SITE.maxHours, SITE.closeHour - effStart);
  const effHours = Math.max(1, Math.min(hours, maxLen || 1));

  // Availability for the chosen date + tier (public endpoint). Seat state is then derived locally
  // for the chosen start/duration; the server re-validates everything on submit.
  useEffect(() => {
    const ctrl = new AbortController();
    setAvailability("loading");
    fetch(`/api/reservations?date=${date}&tier=${tierId}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad status"))))
      .then((d) => {
        setBooked((d.booked ?? []) as BookedSlot[]);
        setAvailability("ok");
      })
      .catch((e) => {
        if ((e as Error).name === "AbortError") return;
        setBooked([]);
        setAvailability("error");
      });
    return () => ctrl.abort();
  }, [date, tierId, reload]);

  const taken = useMemo(
    () => (effStart === null ? new Set<number>() : takenSeats(booked, effStart, effHours)),
    [booked, effStart, effHours]
  );
  const chosen = useMemo(() => seats.filter((s) => s <= tier.seats && !taken.has(s)), [seats, taken, tier.seats]);
  const price = chosen.length > 0 ? quote(tierId, chosen.length, effHours) : null;

  const toggleSeat = (n: number) => setSeats((cur) => (cur.includes(n) ? cur.filter((s) => s !== n) : [...cur, n].sort((a, b) => a - b)));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return; // double-click guard
    setError("");
    if (effStart === null) return setError("برای این تاریخ ساعت قابل رزروی باقی نمانده است. تاریخ دیگری انتخاب کنید.");
    if (chosen.length === 0) return setError("حداقل یک سیستم آزاد را انتخاب کنید.");
    if (name.trim().length < 2) return setError("نام و نام خانوادگی را وارد کنید.");
    if (!/^\+?[0-9\u06F0-\u06F9\u0660-\u0669\s\-()]{7,20}$/.test(phone.trim())) return setError("شماره تلفن معتبر وارد کنید.");

    setBusy(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": keyRef.current },
        body: JSON.stringify({
          tier: tierId,
          seats: chosen,
          date,
          startHour: effStart,
          hours: effHours,
          name,
          phone,
          note,
          website,
          expectedTotal: price?.total, // the server recomputes and rejects a mismatch; it never trusts this value
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 201 && data.reservation) {
        setDone(data.reservation as Confirmed);
        return;
      }
      keyRef.current = newKey(); // a failed attempt must not be replayed with the same key
      setError(data.error ?? "ثبت رزرو انجام نشد. دوباره تلاش کنید.");
      if (res.status === 409 || res.status === 400) setReload((n) => n + 1);
      if (data.code === "SEAT_TAKEN" && Array.isArray(data.seats)) setSeats((cur) => cur.filter((s) => !(data.seats as number[]).includes(s)));
    } catch {
      keyRef.current = newKey();
      setError("اتصال به سرور برقرار نشد. اینترنت خود را بررسی کنید و دوباره تلاش کنید.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="reserve-title" ref={dialogRef}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="بستن">
          ×
        </button>

        {done ? (
          <ReservationConfirmation data={done} onClose={onClose} />
        ) : (
          <form onSubmit={submit} noValidate>
            <h2 id="reserve-title">رزرو سیستم</h2>

            <div className="seg" role="radiogroup" aria-label="نوع سیستم">
              {TIERS.map((t) => (
                <button key={t.id} type="button" role="radio" aria-checked={tierId === t.id} className={tierId === t.id ? "on" : ""} onClick={() => { setTierId(t.id); setSeats([]); }}>
                  <span><span className="ltr">{t.nameEn}</span> ({t.nameFa})</span>
                  <small>{formatToman(t.pricePerSeatHour)} / ساعت برای هر سیستم</small>
                </button>
              ))}
            </div>

            <div className="field">
              <span className="field-label">تاریخ</span>
              <DateStrip value={date} onChange={setDate} from={now.date} days={SITE.onlineWindowDays} />
            </div>

            <div className="row2">
              <label className="field">
                <span className="field-label">ساعت شروع</span>
                <select value={effStart ?? ""} onChange={(e) => setStart(Number(e.target.value))} disabled={effStart === null}>
                  {effStart === null && <option value="">ساعتی باقی نمانده</option>}
                  {startOptions.map((h) => (
                    <option key={h} value={h}>{formatHour(h)}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="field-label">مدت (ساعت)</span>
                <select value={effHours} onChange={(e) => setHours(Number(e.target.value))} disabled={effStart === null}>
                  {Array.from({ length: Math.max(maxLen, 1) }, (_, i) => i + 1).map((h) => (
                    <option key={h} value={h}>{toPersianDigits(h)}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="field">
              <span className="field-label">
                انتخاب سیستم (ظرفیت {toPersianDigits(tier.seats)}، آزاد برای این زمان: {toPersianDigits(tier.seats - taken.size)})
              </span>
              {availability === "loading" && <p className="hint">در حال بررسی سیستم‌های آزاد…</p>}
              {availability === "error" && <p className="hint warn">وضعیت سیستم‌ها دریافت نشد. می‌توانید ادامه دهید؛ در زمان ثبت دوباره بررسی می‌شود.</p>}
              <SeatMap capacity={tier.seats} taken={taken} selected={chosen} onToggle={toggleSeat} />
            </div>

            <div className="price-box" aria-live="polite">
              {price ? (
                <>
                  <span>
                    {formatToman(price.pricePerSeat)} × {toPersianDigits(price.seatCount)} سیستم × {toPersianDigits(price.hours)} ساعت
                  </span>
                  <strong>{formatToman(price.total)}</strong>
                </>
              ) : (
                <span>پس از انتخاب سیستم، مبلغ کل اینجا نمایش داده می‌شود.</span>
              )}
            </div>

            <div className="row2">
              <label className="field">
                <span className="field-label">نام و نام خانوادگی</span>
                <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={60} />
              </label>
              <label className="field">
                <span className="field-label">شماره تلفن</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" autoComplete="tel" dir="ltr" className="ltr-input" />
              </label>
            </div>
            <label className="field">
              <span className="field-label">توضیحات (اختیاری)</span>
              <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
            </label>

            <div className="hp" aria-hidden="true">
              <label>
                وب‌سایت
                <input tabIndex={-1} autoComplete="off" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </label>
            </div>

            {error && <p className="form-error" role="alert">{error}</p>}

            <div className="modal-foot">
              <p className="muted">با ثبت رزرو، کد چهار رقمی شما نمایش داده می‌شود.</p>
              <button className="btn-primary" disabled={busy}>
                {busy ? "در حال ثبت…" : "ثبت رزرو"}
                <span className="plus" aria-hidden="true">+</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
