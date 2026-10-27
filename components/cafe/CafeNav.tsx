"use client";

import { useEffect, useState } from "react";
import type { MenuCategory } from "@/lib/menu";

// Sticky category switcher that highlights the section currently in view.
export default function CafeNav({ categories }: { categories: Pick<MenuCategory, "id" | "navLabel">[] }) {
  const [active, setActive] = useState<string>(categories[0]?.id ?? "");
  useEffect(() => {
    const els = categories.map((c) => document.getElementById(c.id)).filter((e): e is HTMLElement => !!e);
    if (els.length === 0 || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: [0, 0.2, 0.5] }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [categories]);

  return (
    <nav className="cf-nav" aria-label="دسته‌بندی منو">
      {categories.map((c) => (
        <a key={c.id} href={`#${c.id}`} className={active === c.id ? "is-active" : ""} aria-current={active === c.id ? "true" : undefined}>
          {c.navLabel}
        </a>
      ))}
    </nav>
  );
}
