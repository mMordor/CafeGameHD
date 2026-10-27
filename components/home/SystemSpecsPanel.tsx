"use client";

import { useEffect, useState } from "react";
import { SITE, getTier } from "@/lib/config";
import type { Tier, TierId } from "@/lib/config";
import { takenSeats } from "@/lib/domain/availability";
import type { BookedSlot } from "@/lib/domain/availability";
import { formatHour, formatToman, toPersianDigits } from "@/lib/format";
import { businessNow, isoAddDays } from "@/lib/time";

type Slot = { label: string; free: number; total: number };

// Live availability for the next bookable hour (public endpoint; failures are silent).
function useNextSlot(tier: TierId): Slot | null {
  const [slot, setSlot] = useState<Slot | null>(null);
  useEffect(() => {
    let cancelled = false;
    const now = businessNow();
    let date = now.date;
    let hour = Math.max(SITE.openHour, now.hour + 1);
    if (hour >= SITE.closeHour) {
      date = isoAddDays(date, 1);
      hour = SITE.openHour;
    }
    const when = date === now.date ? "امروز" : "فردا";
    setSlot(null);
    fetch(`/api/reservations?date=${date}&tier=${tier}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        const total = getTier(tier).seats;
        const taken = takenSeats(d.booked as BookedSlot[], hour, 1).size;
        setSlot({ label: `${when}، ساعت ${formatHour(hour)}`, free: Math.max(0, total - taken), total });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [tier]);
  return slot;
}

export default function SystemSpecsPanel({ tier, onReserve }: { tier: Tier; onReserve: () => void }) {
  const slot = useNextSlot(tier.id);
  return (
    <section className="spec-panel" aria-label={`مشخصات سیستم ${tier.nameFa}`}>
      <div className="sp-head">
        <div>
          <h2>
            <span className="ltr">{tier.nameEn}</span> <small>{tier.nameFa}</small>
          </h2>
          <p>{tier.description}</p>
        </div>
        <dl className="sp-facts">
          <div>
            <dt>قیمت هر ساعت برای هر سیستم</dt>
            <dd>{formatToman(tier.pricePerSeatHour)}</dd>
          </div>
          <div>
            <dt>ظرفیت کل</dt>
            <dd>{toPersianDigits(tier.seats)} سیستم</dd>
          </div>
        </dl>
      </div>

      <dl className="sp-grid" key={tier.id}>
        {tier.specs.map((s) => (
          <div key={s.key} className={`sp-cell${s.key === "gear" ? " wide" : ""}`}>
            <dt>{s.label}</dt>
            <dd className="ltr">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="sp-foot">
        <div className="sp-avail" aria-live="polite">
          {slot ? (
            <>
              <span className="dots" aria-hidden="true">
                {Array.from({ length: slot.total }, (_, i) => (
                  <i key={i} className={i < slot.free ? "free" : "busy"} />
                ))}
              </span>
              <span>
                {slot.label}: {toPersianDigits(slot.free)} از {toPersianDigits(slot.total)} سیستم آزاد
              </span>
            </>
          ) : (
            <span className="muted">وضعیت سیستم‌ها در حال بررسی است</span>
          )}
        </div>
        <button type="button" className="btn-primary" onClick={onReserve}>
          رزرو کردن
          <span className="plus" aria-hidden="true">+</span>
        </button>
      </div>
    </section>
  );
}
