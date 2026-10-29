"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { formatToman, toPersianDigits } from "@/lib/format";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { MENU } from "@/lib/menu";
import type { MenuCategory } from "@/lib/menu";
import { applyTheme, playSwitch } from "../home/heroTransition";
import { useHeroMotion } from "../home/useHeroMotion";
import { ColdArt, FoodArt, HotArt } from "./CafeArt";
import CafeGear from "./CafeGear";
import CafeGlyph from "./CafeGlyph";
import type { CafeGlyphKind } from "./CafeGlyph";
import MenuItemCard from "./MenuItemCard";

type CategoryId = MenuCategory["id"];
const ARTS = { cold: ColdArt, hot: HotArt, food: FoodArt };
const ICONS: Record<CategoryId, CafeGlyphKind> = { cold: "drop", hot: "bean", food: "wedge" };
const asStyle = (vars: Record<string, string>) => vars as unknown as CSSProperties;
const find = (id: string) => MENU.find((c) => c.id === id);

// Headline whose letters rise in one by one (re-mounted on each category change).
function SplitHeadline({ text }: { text: string }) {
  return (
    <>
      {Array.from(text).map((ch, i) => (
        <span key={i} className="cx-ch" style={{ "--i": i } as CSSProperties}>
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </>
  );
}

// The Soda template applied to the café: a large central object, category cards instead of flavors,
// a glass menu panel, and the spin / implode / explode transition when the category changes.
export default function CafeExperience() {
  const reduced = usePrefersReducedMotion();
  const reducedRef = useRef(false);
  reducedRef.current = reduced;

  const [active, setActive] = useState<CategoryId>("cold"); // highlighted card (immediate)
  const [shown, setShown] = useState<CategoryId>("cold"); // art, headline, panel (swapped at the spin's peak)
  const [announce, setAnnounce] = useState("");

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<any>(null); // unused here (the café has no GLB), required by the shared hook
  const modelReadyRef = useRef(false);
  const fgRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const spin = useRef(0);
  const switching = useRef(false);
  const shownRef = useRef<CategoryId>("cold");

  const initialStyle = asStyle(MENU[0].theme); // later changes are applied imperatively (GSAP)
  const category = find(shown) ?? MENU[0];
  const Art = ARTS[category.id];

  useHeroMotion({ reduced, rootRef, stageRef, modelRef, modelReadyRef, fgRef, bgRef, particlesRef, spin, switching });

  const commit = useCallback((id: CategoryId) => {
    shownRef.current = id;
    setShown(id);
    const c = find(id);
    if (c) setAnnounce(`نمایش ${c.title}`);
    if (typeof history !== "undefined") history.replaceState(null, "", `#${id}`);
  }, []);

  const switchCategory = useCallback(
    (next: CategoryId) => {
      const root = rootRef.current;
      const target = find(next);
      if (!root || !target || switching.current || next === shownRef.current) return;
      setActive(next);
      if (reducedRef.current) {
        applyTheme(root, target.theme);
        commit(next);
        return;
      }
      switching.current = true;
      playSwitch({ root, stage: stageRef.current, theme: target.theme, spin, switching, onSwap: () => commit(next) });
    },
    [commit]
  );

  // Deep link: /cafe#hot opens that category (applied instantly, no animation).
  useEffect(() => {
    const id = window.location.hash.slice(1);
    const target = find(id);
    const root = rootRef.current;
    if (!target || !root || id === "cold") return;
    applyTheme(root, target.theme);
    shownRef.current = target.id;
    setShown(target.id);
    setActive(target.id);
  }, []);

  // Cursor spotlight + scroll parallax (CSS variables only; one rAF-throttled write per frame).
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;
    let raf = 0;
    let gx = 0;
    let gy = 0;
    let sy = 0;
    const flush = () => {
      raf = 0;
      root.style.setProperty("--gx", `${gx}px`);
      root.style.setProperty("--gy", `${gy}px`);
      root.style.setProperty("--sy", String(sy));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(flush);
    };
    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      gx = e.clientX - r.left;
      gy = e.clientY - r.top;
      schedule();
    };
    const onScroll = () => {
      sy = window.scrollY;
      schedule();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  // Hovering a menu card makes the central object lean in.
  const onItemHover = useCallback((on: boolean) => {
    const root = rootRef.current;
    if (root) root.dataset.hot = on ? "1" : "";
  }, []);

  const scrollToMenu = () => panelRef.current?.scrollIntoView({ behavior: reducedRef.current ? "auto" : "smooth", block: "start" });

  return (
    <div className="home cx" ref={rootRef} style={initialStyle} data-cat={shown}>
      <div className="particles" ref={particlesRef} aria-hidden="true" />
      <div className="cx-glow" aria-hidden="true" />

      <section className="hero" aria-label="منوی کافه">
        <div className="hero-content">
          <div className="berries-container-bg" ref={bgRef} aria-hidden="true">
            <CafeGear category={shown} slots={[4, 5, 6, 7]} />
          </div>

          <div className="hero-copy">
            <h1 className="cx-eyebrow">منوی کافه</h1>
            <p className="cx-big ltr" key={`big-${shown}`} aria-hidden="true">
              <SplitHeadline text={category.heroEn} />
            </p>
            <p className="cx-title" key={`title-${shown}`}>{category.title}</p>
            <p className="hero-desc">{category.tagline}</p>
            <div>
              <button type="button" className="btn-primary" onClick={scrollToMenu}>
                مشاهده منو
                <span className="plus" aria-hidden="true">↓</span>
              </button>
            </div>
          </div>

          <div className="hero-center">
            <div className="stage" ref={stageRef}>
              <div className="stage-inner" key={shown}>
                <Art />
              </div>
            </div>
          </div>

          <div className="hero-side">
            <div className="cx-cats" role="radiogroup" aria-label="دسته‌بندی منو">
              {MENU.map((c) => {
                const on = active === c.id;
                const from = Math.min(...c.items.map((i) => i.price));
                return (
                  <button key={c.id} type="button" role="radio" aria-checked={on} className={`cx-cat${on ? " is-active" : ""}`} onClick={() => switchCategory(c.id)}>
                    <span className="cx-cat-icon" aria-hidden="true">
                      <CafeGlyph kind={ICONS[c.id]} />
                    </span>
                    <span className="cx-cat-text">
                      <strong>{c.title}</strong>
                      <small>
                        {toPersianDigits(c.items.length)} مورد، از {formatToman(from)}
                      </small>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <section className="cx-panel" ref={panelRef} aria-labelledby="cx-panel-title">
            <header className="cx-panel-head">
              <div>
                <h2 id="cx-panel-title">{category.title}</h2>
                <p>{category.tagline}</p>
              </div>
              <span className="cx-count">{toPersianDigits(category.items.length)} مورد</span>
            </header>
            <ul className="cx-items" key={`items-${shown}`}>
              {category.items.map((item, i) => (
                <li key={item.id}>
                  <MenuItemCard item={item} index={i} animate={!reduced} onHover={onItemHover} />
                </li>
              ))}
            </ul>
          </section>

          <div className="berries-container" ref={fgRef} aria-hidden="true">
            <CafeGear category={shown} slots={[0, 1, 2, 3]} />
          </div>
        </div>
      </section>

      <div className="cx-marquee" aria-hidden="true">
        <div className="cx-marquee-track" key={`m-${shown}`}>
          {[0, 1].map((k) => (
            <span key={k}>
              {category.items.map((item) => (
                <b key={item.id}>
                  {item.name}
                  <i />
                </b>
              ))}
            </span>
          ))}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">{announce}</p>
    </div>
  );
}
