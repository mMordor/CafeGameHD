"use client";

import { toPersianDigits } from "@/lib/format";

// Shared by the public booking form and the staff form.
export default function SeatMap({
  capacity,
  taken,
  selected,
  onToggle,
  label = "انتخاب سیستم",
}: {
  capacity: number;
  taken: Set<number>;
  selected: number[];
  onToggle: (seat: number) => void;
  label?: string;
}) {
  return (
    <div>
      <div className="seatmap" role="group" aria-label={label}>
        {Array.from({ length: capacity }, (_, i) => i + 1).map((n) => {
          const isTaken = taken.has(n);
          const isSelected = selected.includes(n);
          return (
            <button
              type="button"
              key={n}
              className={`seat${isSelected ? " is-selected" : ""}${isTaken ? " is-taken" : ""}`}
              disabled={isTaken}
              aria-pressed={isSelected}
              aria-label={`سیستم ${toPersianDigits(n)}${isTaken ? "، اشغال" : ""}${isSelected ? "، انتخاب شده" : ""}`}
              onClick={() => onToggle(n)}
            >
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" aria-hidden="true">
                <rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M8 20h8M12 16v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span>{toPersianDigits(n)}</span>
            </button>
          );
        })}
      </div>
      <ul className="seat-legend" aria-hidden="true">
        <li><i className="dot free" /> آزاد</li>
        <li><i className="dot sel" /> انتخاب شده</li>
        <li><i className="dot busy" /> اشغال</li>
      </ul>
    </div>
  );
}
