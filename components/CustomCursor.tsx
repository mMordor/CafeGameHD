
"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ring = ringRef.current;
    const dot = dotRef.current;
    let scale = 1;
    let overInteractive = false;
    if (!ring || !dot) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    let ringX = x;
    let ringY = y;

    let animationFrame = 0;

    
    const handlePointerMove = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
       const target = document.elementFromPoint(x, y);
    
       overInteractive = Boolean(
            target?.closest("a, button, input")
        );
        };

        const handlePointerLeave = () => {
        overInteractive = false;
    };

    const animate = () => {
        const targetScale = overInteractive ? 1.9 : 1;
        scale += (targetScale - scale) * 0.22;  

      ringX += (x - ringX) * 0.4;
      ringY += (y - ringY) * 0.4;

      dot.style.transform =
        `translate(${x - 3}px, ${y - 3}px)`;

      ring.style.transform =
        `translate(${ringX - 23}px, ${ringY - 23}px) scale(${scale})`;

      animationFrame = requestAnimationFrame(animate);
    };

    window.addEventListener("pointermove", handlePointerMove);
    animationFrame = requestAnimationFrame(animate);

    window.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  return (
    <>
      <div
        ref={ringRef}
        className="custom-cursor-ring"
        aria-hidden="true"
      />
      <div
        ref={dotRef}
        className="custom-cursor-dot"
        aria-hidden="true"
      />
    </>
  );
}
