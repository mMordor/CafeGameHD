"use client";

import { useMemo } from "react";
import { jalaliChip } from "@/lib/format";
import { isoAddDays } from "@/lib/time";

// Day picker showing Jalali labels; the value stays a Gregorian ISO date.
export default function DateStrip({
  value,
  onChange,
  from,
  days,
}: {
  value: string;
  onChange: (iso: string) => void;
  from: string;
  days: number;
}) {
  const items = useMemo(() => Array.from({ length: days + 1 }, (_, i) => isoAddDays(from, i)), [from, days]);
  return (
    <div className="datestrip" role="radiogroup" aria-label="انتخاب تاریخ">
      {items.map((iso) => {
        const c = jalaliChip(iso);
        const on = iso === value;
        return (
          <button key={iso} type="button" role="radio" aria-checked={on} className={`date-chip${on ? " is-on" : ""}`} onClick={() => onChange(iso)}>
            <span>{c.weekday}</span>
            <strong>{c.day}</strong>
            <span>{c.month}</span>
          </button>
        );
      })}
    </div>
  );
}
