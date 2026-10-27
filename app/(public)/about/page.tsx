import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/images/Logo2.png";
import AboutCarousel from "@/components/about/AboutCarousel";
import type { AboutItem } from "@/components/about/AboutCarousel";
import { SITE, TIERS } from "@/lib/config";
import type { Tier } from "@/lib/config";
import { formatHour } from "@/lib/format";
import { CONTACT } from "@/lib/siteContent";
import "./about.css";
import DotGridWarp from "@/components/DotGridWarp";

export const metadata: Metadata = {
  title: "درباره ما | GameZone",
  description: "با سیستم‌های Standard و Pro، تجهیزات گیمینگ و کافه GameZone آشنا شوید.",
};

const spec = (t: Tier, key: string) => t.specs.find((s) => s.key === key)?.value ?? "";

const tierText = (t: Tier) =>
  `پردازنده ${spec(t, "cpu")}، کارت گرافیک ${spec(t, "gpu")}، رم ${spec(t, "ram")} و مانیتور ${spec(t, "monitor")}.`;

export default function AboutPage() {
  const [standard, pro] = TIERS;
  const items: AboutItem[] = [
    { id: "standard", eyebrow: "سیستم‌های Standard", title: "اجرای روان", text: tierText(standard), glyph: "gpu", color: "#FFD6EB" },
    { id: "pro", eyebrow: "سیستم‌های Pro", title: "قدرت بیشتر", text: tierText(pro), glyph: "chip", color: "#CFF8F1" },
    { id: "gear", eyebrow: "تجهیزات", title: "کیبورد، ماوس، هدست", text: "هر سیستم با تجهیزات گیمینگ همراه است. جزئیات هر نوع سیستم را در صفحه اصلی ببینید.", glyph: "keycap", color: "#E6E1FF" },
    { id: "cafe", eyebrow: "کافه", title: "نوشیدنی و تنقلات", text: "نوشیدنی‌های سرد و گرم و غذاهای سبک. منوی کامل را ببینید.", glyph: "cup", color: "#FFE9C7", href: "/cafe", cta: "مشاهده منو" },
    { id: "space", eyebrow: "فضا", title: "بازی و دورهمی", text: "جایی برای بازی، رقابت و وقت‌گذراندن با دوستان.", glyph: "controller", color: "#D8ECFF" },
  ];

  const hasContact = CONTACT.address || CONTACT.phone || CONTACT.instagram || CONTACT.mapUrl;

  return (
    <div className="ab-page">
      <section className="ab-stage z-10" aria-labelledby="ab-title">
        <DotGridWarp />
        <div className="ab-top">
          <div className="ab-" aria-hidden="true">
            
          </div>
          <h1 id="ab-title" className="ab-headline">
            درباره
            <br />
            <span className="ltr">{SITE.name}</span>
          </h1>
        </div>

        <AboutCarousel items={items} />
        <div className="ab-bottom flex justify-center items-center">
          <Image src={logo} alt="Cafe HD" className="  w-[300px] sm:w-[350px]"/>
        </div>

      </section>

      <section className="ab-info" aria-labelledby="ab-info-title">
        <h2 id="ab-info-title">اطلاعات و رزرو</h2>
        <ul>
          <li>
            ساعات رزرو آنلاین: {formatHour(SITE.openHour)} تا {formatHour(SITE.closeHour)}
          </li>
          {CONTACT.address && <li>نشانی: {CONTACT.address}</li>}
          {CONTACT.phone && (
            <li>
              تلفن: <a href={`tel:${CONTACT.phone}`} className="ltr">{CONTACT.phone}</a>
            </li>
          )}
          {CONTACT.instagram && (
            <li>
              <a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer">اینستاگرام</a>
            </li>
          )}
          {CONTACT.mapUrl && (
            <li>
              <a href={CONTACT.mapUrl} target="_blank" rel="noopener noreferrer">مسیریابی روی نقشه</a>
            </li>
          )}
          {!hasContact && <li className="ab-muted">نشانی و راه‌های تماس به‌زودی در همین بخش قرار می‌گیرد.</li>}
        </ul>
        <Link href="/?reserve=1" className="ab-cta">
          رزرو کردن
        </Link>
      </section>
    </div>
  );
}
