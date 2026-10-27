"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import Link from "next/link";
import { Glyph } from "../Glyphs";
import type { GlyphKind } from "../Glyphs";
import { toPersianDigits } from "@/lib/format";
import { usePrefersReducedMotion } from "@/lib/hooks";

export type AboutItem = {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  glyph: GlyphKind;
  color: string;
  href?: string;
  cta?: string;
};

// Curved, tilted card carousel. Click a side card, drag, use the buttons, or the arrow keys.
// The layout is RTL: the "next" card sits on the left, so dragging right (or ArrowLeft) advances.
export default function AboutCarousel({ items }: { items: AboutItem[] }) {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [step, setStep] = useState(280);
  const viewRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const moved = useRef(false);

  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const measure = () => setStep(Math.max(150, Math.min(300, el.clientWidth * 0.3)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const go = (i: number) => setIndex(Math.max(0, Math.min(items.length - 1, i)));

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    startX.current = e.clientX;
    moved.current = false;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 6) moved.current = true;
    setDrag(dx);
  };
  const onUp = () => {
    if (!dragging) return;
    setDragging(false);
    if (drag > 60) go(index + 1);
    else if (drag < -60) go(index - 1);
    setDrag(0);
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(index - 1);
    }
  };

  return (
    <div className="ab-carousel" aria-roledescription="carousel" aria-label="معرفی GameZone">
      <div
        className={`ab-view${dragging ? " is-dragging" : ""}${reduced ? " no-motion" : ""}`}
        ref={viewRef}
        tabIndex={0}
        onKeyDown={onKey}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {items.map((item, i) => {
          const o = i - index;
          const abs = Math.abs(o);
          const active = o === 0;
          const style = {
            transform: `translateX(-50%) translateX(${-o * step + drag}px) translateY(${o * o * 18}px) rotate(${-o * 7}deg) scale(${active ? 1 : 0.86})`,
            zIndex: 10 - abs,
            opacity: abs > 2 ? 0 : 1 - abs * 0.12,
            pointerEvents: abs > 2 ? ("none" as const) : ("auto" as const),
            background: item.color,
          };
          return (
            <article
              key={item.id}
              className={`ab-card${active ? " is-active" : ""}`}
              style={style}
              aria-hidden={abs > 0 ? true : undefined}
              aria-roledescription="slide"
              onClick={() => {
                if (!moved.current && !active) go(i);
              }}
            >
              <div className="ab-card-glyph">
                <Glyph kind={item.glyph} />
              </div>
              <p className="ab-card-eyebrow">{item.eyebrow}</p>
              <h2>{item.title}</h2>
              <p className="ab-card-text">{item.text}</p>
              {item.href && active && (
                <Link href={item.href} className="ab-card-link">
                  {item.cta ?? "مشاهده"} ←
                </Link>
              )}
            </article>
          );
        })}
      </div>

      <div className="ab-controls">
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label="کارت قبلی">→</button>
        <span aria-live="polite">
          {toPersianDigits(index + 1)} / {toPersianDigits(items.length)}
        </span>
        <button type="button" onClick={() => go(index + 1)} disabled={index === items.length - 1} aria-label="کارت بعدی">←</button>
      </div>
    </div>
  );
}
