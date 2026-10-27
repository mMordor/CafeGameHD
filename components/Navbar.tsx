"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE } from "@/lib/config";
import Image from "next/image";
import logo from "@/public/images/Logo.png"

const LINKS = [
  { href: "/", label: "خانه" },
  { href: "/about", label: "درباره ما" },
  { href: "/cafe", label: "کافه" },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <header className="site-nav">
      <Link href="/" className="brand" aria-label={`${SITE.name}، صفحه اصلی`}>
        <Image src={logo} alt="Cafe HD" className="w-[50px] h-[50px]"/>
        <span className="brand-name mt-1">{SITE.name}</span>
      </Link>
      <nav className="nav-glass" aria-label="منوی اصلی">
        {LINKS.map((l) => {
          const active = pathname === l.href;
          return (
            <Link key={l.href} href={l.href} className={`nav-item${active ? " active" : ""}`} aria-current={active ? "page" : undefined}>
              {l.label}
            </Link>
          );
        })}
      </nav>
      <Link href="/?reserve=1" className="nav-cta" scroll={false}>
        رزرو کردن
      </Link>
    </header>
  );
}
