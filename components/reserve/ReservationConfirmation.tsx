"use client";

import { getTier } from "@/lib/config";
import type { TierId } from "@/lib/config";
import { formatJalali, formatSeats, formatTimeRange, formatToman, toPersianDigits } from "@/lib/format";

export type Confirmed = {
  serial: string;
  tier: TierId;
  seats: number[];
  date: string;
  startHour: number;
  hours: number;
  pricePerSeat: number;
  total: number;
};

// Shown ONLY after the server has committed the reservation (HTTP 201).
export default function ReservationConfirmation({ data, onClose }: { data: Confirmed; onClose: () => void }) {
  const tier = getTier(data.tier);
  return (
    <div className="confirm" role="status">
      <p className="confirm-badge">رزرو شما ثبت شد</p>
      <p className="confirm-label">کد رزرو شما</p>
      <p className="confirm-serial ltr" aria-label={`کد رزرو ${toPersianDigits(data.serial)}`}>
        {toPersianDigits(data.serial)}
      </p>
      <p className="confirm-hint">این کد را هنگام مراجعه به مسئول سالن اعلام کنید.</p>
      <dl className="confirm-list">
        <div><dt>نوع سیستم</dt><dd><span className="ltr">{tier.nameEn}</span> ({tier.nameFa})</dd></div>
        <div><dt>سیستم‌ها</dt><dd>{formatSeats(data.seats)}</dd></div>
        <div><dt>تاریخ</dt><dd>{formatJalali(data.date)}</dd></div>
        <div><dt>ساعت</dt><dd>{formatTimeRange(data.startHour, data.hours)}</dd></div>
        <div><dt>مدت</dt><dd>{toPersianDigits(data.hours)} ساعت</dd></div>
        <div><dt>مبلغ کل</dt><dd><strong>{formatToman(data.total)}</strong></dd></div>
      </dl>
      <button type="button" className="btn-primary" onClick={onClose}>
        بستن
        <span className="plus" aria-hidden="true">✓</span>
      </button>
    </div>
  );
}
