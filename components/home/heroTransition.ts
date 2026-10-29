import gsap from "gsap";
import type { MutableRefObject } from "react";

export function applyTheme(el: HTMLElement, theme: Record<string, string>) {
  for (const [k, v] of Object.entries(theme)) el.style.setProperty(k, v);
}

// The template's signature transition, shared by the home page (Standard/Pro) and the café (categories):
//  1. background / palette morph (GSAP tweens the CSS custom properties)
//  2. the central object spins 720deg with motion blur; content swaps at the 360deg peak (onSwap)
//  3. the floating items implode toward the center, then explode out to new positions
// Sets switching.current = false when every item has landed.
export function playSwitch(o: {
  root: HTMLElement;
  stage: HTMLElement | null;
  theme: Record<string, string>;
  spin: MutableRefObject<number>;
  switching: MutableRefObject<boolean>;
  onSwap: () => void;
}) {
  const { root, theme, spin, switching } = o;

  gsap.to(root, { ...theme, duration: 1.4, ease: "power2.inOut", onComplete: () => applyTheme(root, theme) });

  const spinObj = { val: 0, blur: 0 };
  const apply = () => {
    spin.current = spinObj.val;
    if (o.stage) o.stage.style.filter = `blur(${spinObj.blur}px)`;
  };
  gsap.to(spinObj, {
    val: 360,
    blur: 14,
    duration: 0.6,
    ease: "power2.in",
    onUpdate: apply,
    onComplete: () => {
      o.onSwap();
      gsap.to(spinObj, {
        val: 720,
        blur: 0,
        duration: 1.5,
        ease: "back.out(0.7)",
        onUpdate: apply,
        onComplete: () => {
          spin.current = 0;
          if (o.stage) o.stage.style.filter = "";
        },
      });
    },
  });

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
}
