"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import gsap from "gsap";
import { TIERS, getTier } from "@/lib/config";
import type { TierId } from "@/lib/config";
import { usePrefersReducedMotion } from "@/lib/hooks";
import ReserveModal from "../reserve/ReserveModal";
import FloatingGear from "./FloatingGear";
import GamingPCViewer from "./GamingPCViewer";
import SystemSpecsPanel from "./SystemSpecsPanel";
import TierSelector from "./TierSelector";
import { useHeroMotion } from "./useHeroMotion";

const asStyle = (vars: Record<string, string>) => vars as unknown as CSSProperties;

function applyTheme(el: HTMLElement, theme: Record<string, string>) {
  for (const [k, v] of Object.entries(theme)) el.style.setProperty(k, v);
}

export default function HomeExperience() {
  const router = useRouter();
  const params = useSearchParams();
  const reduced = usePrefersReducedMotion();
  const reducedRef = useRef(false);
  reducedRef.current = reduced;

  const [active, setActive] = useState<TierId>("standard"); // highlighted card (immediate)
  const [shown, setShown] = useState<TierId>("standard"); // spec panel + art (swapped at the spin's peak)
  const [modalOpen, setModalOpen] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<any>(null);
  const modelReadyRef = useRef(false);
  const fgRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const spin = useRef(0);
  const switching = useRef(false);
  const shownRef = useRef<TierId>("standard");

  // Initial theme only. Later changes are applied imperatively (GSAP), so React must not re-apply them.
  const initialStyle = useMemo(() => asStyle(TIERS[0].theme), []);
  const tier = getTier(shown);

  useHeroMotion({ reduced, rootRef, stageRef, modelRef, modelReadyRef, fgRef, bgRef, particlesRef, spin, switching });

  // Opened from the navbar (/?reserve=1).
  useEffect(() => {
    if (params.get("reserve") === "1") setModalOpen(true);
  }, [params]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    if (params.get("reserve")) router.replace("/", { scroll: false });
  }, [params, router]);

  const switchTier = useCallback((next: TierId) => {
    const root = rootRef.current;
    if (!root || switching.current || next === shownRef.current) return;
    const target = getTier(next);
    setActive(next);

    if (reducedRef.current) {
      applyTheme(root, target.theme);
      shownRef.current = next;
      setShown(next);
      return;
    }

    switching.current = true;
    gsap.to(root, { ...target.theme, duration: 1.4, ease: "power2.inOut", onComplete: () => applyTheme(root, target.theme) });

    // The PC spins 720deg with motion blur; the content swaps at the peak (after 360deg).
    const spinObj = { val: 0, blur: 0 };
    const apply = () => {
      spin.current = spinObj.val;
      if (stageRef.current) stageRef.current.style.filter = `blur(${spinObj.blur}px)`;
    };
    gsap.to(spinObj, {
      val: 360,
      blur: 14,
      duration: 0.6,
      ease: "power2.in",
      onUpdate: apply,
      onComplete: () => {
        shownRef.current = next;
        setShown(next);
        gsap.to(spinObj, {
          val: 720,
          blur: 0,
          duration: 1.5,
          ease: "back.out(0.7)",
          onUpdate: apply,
          onComplete: () => {
            spin.current = 0;
            if (stageRef.current) stageRef.current.style.filter = "";
          },
        });
      },
    });

    // The floating gear implodes toward the center, then explodes back out to new positions.
    const items = Array.from(root.querySelectorAll<HTMLElement>(".berry"));
    let done = 0;
    const finish = () => {
      if (++done >= items.length) switching.current = false;
    };
    if (items.length === 0) switching.current = false;
    items.forEach((berry) => {
      const parent = berry.offsetParent as HTMLElement | null;
      const cx = (parent?.clientWidth ?? window.innerWidth) / 2 - berry.offsetLeft - berry.offsetWidth / 2;
      const cy = (parent?.clientHeight ?? window.innerHeight) / 2 - berry.offsetTop - berry.offsetHeight / 2;
      const angle = parseFloat(berry.dataset.angle || "0") || 0;
      const nextX = (Math.random() - 0.5) * 200;
      const nextY = (Math.random() - 0.5) * 200;
      const finalOpacity = parseFloat(berry.dataset.op || "1") || 1;
      gsap.set(berry, {
        rotation: angle,
        x: parseFloat(berry.dataset.baseX || "0") || 0,
        y: parseFloat(berry.dataset.baseY || "0") || 0,
      });
      gsap
        .timeline()
        .to(berry, { x: cx, y: cy, rotation: angle + 45, scale: 0.1, opacity: 0, duration: 0.5, ease: "power2.in" })
        .to(berry, { duration: 0.3 })
        .to(berry, {
          x: nextX,
          y: nextY,
          rotation: angle + 90,
          scale: 1,
          opacity: finalOpacity,
          duration: 0.9,
          ease: "back.out(1.5)",
          onComplete: () => {
            berry.dataset.angle = String(angle + 90);
            berry.dataset.baseX = String(nextX);
            berry.dataset.baseY = String(nextY);
            berry.dataset.rx = "0";
            berry.dataset.ry = "0";
            finish();
          },
        });
    });
  }, []);

  return (
    <div className="home" ref={rootRef} style={initialStyle} data-tier={shown}>
      <div className="particles" ref={particlesRef} aria-hidden="true" />

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-content">
          <div className="berries-container-bg" ref={bgRef} aria-hidden="true">
            <FloatingGear slots={[6, 7, 8]} tier={shown} />
          </div>

          <div className="hero-copy">
            <p className="eyebrow ltr">GAMING LOUNGE</p>
            <h1 id="hero-title" className="hero-title">
              <span className="outline-text">بازی</span>
              <br />
              بدون لگ
            </h1>
            <p className="hero-desc">
              مشخصات دقیق هر سیستم را ببینید، تاریخ و ساعت و سیستم‌های دلخواهتان را انتخاب کنید و با یک کد چهار رقمی جای خود را رزرو کنید.
            </p>
            <div>
              <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
                رزرو کردن
                <span className="plus" aria-hidden="true">+</span>
              </button>
            </div>
          </div>

          <div className="hero-center">
            <GamingPCViewer stageRef={stageRef} modelRef={modelRef} readyRef={modelReadyRef} />
          </div>

          <div className="hero-side">
            <TierSelector active={active} onSelect={switchTier} />
          </div>

          <SystemSpecsPanel tier={tier} onReserve={() => setModalOpen(true)} />

          <div className="berries-container" ref={fgRef} aria-hidden="true">
            <FloatingGear slots={[0, 1, 2, 3, 4, 5]} tier={shown} />
          </div>
        </div>
      </section>

      <section className="how" aria-labelledby="how-title">
        <h2 id="how-title">رزرو در سه قدم</h2>
        <ol>
          <li>
            <strong>۱</strong>
            <span>نوع سیستم (Standard یا Pro) را انتخاب کنید.</span>
          </li>
          <li>
            <strong>۲</strong>
            <span>تاریخ، ساعت شروع، مدت و یک یا چند سیستم آزاد را انتخاب کنید.</span>
          </li>
          <li>
            <strong>۳</strong>
            <span>کد چهار رقمی رزرو را بگیرید و هنگام مراجعه به مسئول سالن اعلام کنید.</span>
          </li>
        </ol>
      </section>

      {modalOpen && <ReserveModal initialTier={shown} onClose={closeModal} />}
    </div>
  );
}
