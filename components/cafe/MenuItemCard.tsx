"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import type { MenuItem } from "@/lib/menu";
import { formatToman, toPersianDigits } from "@/lib/format";

// Price counts up on mount (from 70% to the real price). The final value is always exact, and the
// server-rendered HTML already contains the real price.
function PriceCount({ value, animate }: { value: number; animate: boolean }) {
  const [n, setN] = useState(value);
  useEffect(() => {
    if (!animate) {
      setN(value);
      return;
    }
    const from = Math.round((value * 0.7) / 1000) * 1000;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 700);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(p >= 1 ? value : Math.round((from + (value - from) * eased) / 1000) * 1000);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, animate]);
  return <>{formatToman(n)}</>;
}

// Menu card with a pointer spotlight and a subtle 3D tilt (CSS variables, no re-render per move).
export default function MenuItemCard({
  item,
  index,
  animate,
  onHover,
}: {
  item: MenuItem;
  index: number;
  animate: boolean;
  onHover: (on: boolean) => void;
}) {
  const ref = useRef<HTMLElement>(null);

  const move = (e: PointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el || !animate) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    el.style.setProperty("--rx", `${(0.5 - y) * 9}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 11}deg`);
  };
  const leave = () => {
    const el = ref.current;
    if (el) {
      el.style.removeProperty("--rx");
      el.style.removeProperty("--ry");
    }
    onHover(false);
  };

  return (
    <article
      ref={ref}
      className="cx-item"
      style={{ "--i": index } as CSSProperties}
      onPointerMove={move}
      onPointerEnter={() => onHover(true)}
      onPointerLeave={leave}
    >
      <span className="cx-item-no" aria-hidden="true">
        {toPersianDigits(String(index + 1).padStart(2, "0"))}
      </span>
      <h3>{item.name}</h3>
      {item.description && <p className="cx-item-desc">{item.description}</p>}
      <p className="cx-item-price">
        <PriceCount value={item.price} animate={animate} />
      </p>
    </article>
  );
}
