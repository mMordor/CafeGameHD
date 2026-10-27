"use client";

import { TIERS } from "@/lib/config";
import type { TierId } from "@/lib/config";
import { formatToman, toPersianDigits } from "@/lib/format";
import { MiniCase } from "../PCCaseArt";

export default function TierSelector({ active, onSelect }: { active: TierId; onSelect: (id: TierId) => void }) {
  return (
    <div className="tier-selector" role="radiogroup" aria-label="انتخاب نوع سیستم">
      {TIERS.map((t) => {
        const on = active === t.id;
        return (
          <button key={t.id} type="button" role="radio" aria-checked={on} className={`tier-card${on ? " is-active" : ""}`} onClick={() => onSelect(t.id)}>
            <span className="tier-art">
              <MiniCase color={t.theme["--accent"]} />
            </span>
            <span className="tier-name">
              <span className="ltr">{t.nameEn}</span>
              <small>{t.nameFa}</small>
            </span>
            <span className="tier-meta">{formatToman(t.pricePerSeatHour)} / ساعت</span>
            <span className="tier-meta">{toPersianDigits(t.seats)} سیستم</span>
          </button>
        );
      })}
    </div>
  );
}
