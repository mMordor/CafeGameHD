
"use client";

import { useEffect, useRef } from "react";

type DotGridWarpProps = {
  className?: string;
};

export default function DotGridWarp({
  className = "",
}: DotGridWarpProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const finePointer = window.matchMedia(
        "(hover: hover) and (pointer: fine)"
    );

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    if (!finePointer.matches || reducedMotion.matches) {
        return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) return;
        
    const gap = 26;
    const dotSize = 1;
    let mouseX = -1000;
    let mouseY = -1000;

    const reach = 150;
    const push = 26;
    const resizeCanvas = () => {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
    
    let animationFrame = 0;

    const draw = () => {
    const rect = canvas.getBoundingClientRect();

    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#0007";

    for (let y = gap / 2; y < rect.height; y += gap) {
        for (let x = gap / 2; x < rect.width; x += gap) {
        const dx = x - mouseX;
        const dy = y - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let offsetX = 0;
        let offsetY = 0;
        let radius = dotSize;

        if (distance < reach && distance > 0) {
            const influence = 1 - distance / reach;
            const force = influence * push;

            offsetX = (dx / distance) * force;
            offsetY = (dy / distance) * force;

            radius = dotSize + influence * 1.5;
        }

        ctx.beginPath();
        ctx.arc(
            x + offsetX,
            y + offsetY,
            radius,
            0,
            Math.PI * 2
        );
        ctx.fill();
        }
    }

    animationFrame = requestAnimationFrame(draw);
    };

    const handlePointerMove = (event: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();

        mouseX = event.clientX - rect.left;
        mouseY = event.clientY - rect.top;
    };

    const handlePointerLeave = () => {
        mouseX = -1000;
        mouseY = -1000;
    };

    resizeCanvas();
    draw();

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerleave", handlePointerLeave);

    return () => {
        cancelAnimationFrame(animationFrame);
        window.removeEventListener("resize", resizeCanvas);
        window.removeEventListener("pointermove", handlePointerMove);
        canvas.removeEventListener("pointerleave", handlePointerLeave);
    };

    resizeCanvas();

    window.addEventListener("resize", resizeCanvas);

    return () => {
    window.removeEventListener("resize", resizeCanvas);
    };


    return () => {
      // Cleanup will be added in the next steps.
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 h-full w-full pointer-events-none z-0  ${className}`}
    />
  );
}
