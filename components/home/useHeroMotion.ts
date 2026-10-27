import { useEffect } from "react";
import type { MutableRefObject, RefObject } from "react";

type Args = {
  reduced: boolean;
  rootRef: RefObject<HTMLDivElement>;
  stageRef: RefObject<HTMLDivElement>;
  modelRef: MutableRefObject<any>;
  modelReadyRef: MutableRefObject<boolean>;
  fgRef: RefObject<HTMLDivElement>;
  bgRef: RefObject<HTMLDivElement>;
  particlesRef: RefObject<HTMLDivElement>;
  spin: MutableRefObject<number>;
  switching: MutableRefObject<boolean>;
};

const DURATIONS = [5, 7, 6, 8, 5.5, 6.5, 9, 11, 10];

// Pointer tilt of the PC, parallax layers, pointer repulsion + floating of the gear, rising particles.
// Runs only while the hero is on screen and the tab is visible. Does nothing when reduced motion is on.
export function useHeroMotion(a: Args) {
  const { reduced, rootRef, stageRef, modelRef, modelReadyRef, fgRef, bgRef, particlesRef, spin, switching } = a;

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;
    const hero = root.querySelector<HTMLElement>(".hero");
    const items = Array.from(root.querySelectorAll<HTMLElement>(".berry"));
    items.forEach((b) => {
      b.dataset.rx = "0";
      b.dataset.ry = "0";
      b.dataset.angle = String(Math.random() * 360);
      b.dataset.baseX = "0";
      b.dataset.baseY = "0";
      b.dataset.op = getComputedStyle(b).opacity;
    });

    const mouse = { x: 0, y: 0, px: -9999, py: -9999 };
    const cur = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX / window.innerWidth - 0.5;
      mouse.y = e.clientY / window.innerHeight - 0.5;
      mouse.px = e.clientX;
      mouse.py = e.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    let visible = true;
    let running = false;

    const tick = () => {
      const time = Date.now() * 0.001;
      cur.x += (mouse.x - cur.x) * 0.05;
      cur.y += (mouse.y - cur.y) * 0.05;

      if (modelReadyRef.current && modelRef.current) {
        modelRef.current.cameraOrbit = `${cur.x * 40 + spin.current}deg ${90 + cur.y * 20}deg 380%`;
      } else if (stageRef.current) {
        stageRef.current.style.transform = `perspective(1400px) rotateY(${cur.x * 28 + spin.current}deg) rotateX(${-cur.y * 14}deg)`;
      }
      if (fgRef.current) fgRef.current.style.transform = `translate(${cur.x * 60}px, ${cur.y * 60}px)`;
      if (bgRef.current) bgRef.current.style.transform = `translate(${cur.x * -30}px, ${cur.y * -30}px)`;

      if (!switching.current) {
        items.forEach((berry, i) => {
          const r = berry.getBoundingClientRect();
          const dx = mouse.px - (r.left + r.width / 2);
          const dy = mouse.py - (r.top + r.height / 2);
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          let tx = 0, ty = 0, speed = 1;
          if (dist < 400) {
            const force = (400 - dist) / 400;
            tx = (dx / dist) * force * -80;
            ty = (dy / dist) * force * -80;
            speed = 1 + force * 5;
          }
          let rx = parseFloat(berry.dataset.rx || "0");
          let ry = parseFloat(berry.dataset.ry || "0");
          let angle = parseFloat(berry.dataset.angle || "0");
          const baseX = parseFloat(berry.dataset.baseX || "0");
          const baseY = parseFloat(berry.dataset.baseY || "0");
          rx += (tx - rx) * 0.1;
          ry += (ty - ry) * 0.1;
          angle += 0.2 * speed;
          berry.dataset.rx = String(rx);
          berry.dataset.ry = String(ry);
          berry.dataset.angle = String(angle);
          const phase = (time + i * 0.7) * ((Math.PI * 2) / DURATIONS[i % DURATIONS.length]);
          berry.style.transform = `translate(${rx + baseX}px, ${ry + baseY + Math.sin(phase) * 15}px) rotate(${angle + Math.cos(phase) * 6}deg)`;
        });
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || !visible || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible) start();
      else stop();
    });
    if (hero) io.observe(hero);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    start();

    // Rising particles (kept few; removed when they finish).
    const spawn = () => {
      const host = particlesRef.current;
      if (!host || !visible || document.hidden || host.childElementCount > 24) return;
      const el = document.createElement("span");
      const size = Math.random() * 18 + 8;
      const dur = Math.random() * 6 + 5;
      el.className = "bubble";
      el.style.width = el.style.height = `${size}px`;
      el.style.insetInlineStart = `${Math.random() * 100}%`;
      el.style.opacity = String(Math.random() * 0.4 + 0.2);
      el.style.animation = `floatUp ${dur}s linear forwards`;
      host.appendChild(el);
      window.setTimeout(() => el.remove(), dur * 1000);
    };
    const interval = window.setInterval(spawn, 500);

    return () => {
      stop();
      io.disconnect();
      window.clearInterval(interval);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
      items.forEach((b) => (b.style.transform = ""));
      if (stageRef.current) stageRef.current.style.transform = "";
    };
  }, [reduced, rootRef, stageRef, modelRef, modelReadyRef, fgRef, bgRef, particlesRef, spin, switching]);
}
