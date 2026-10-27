import type { Metadata } from "next";
import { Galada, Vazirmatn } from "next/font/google";
import "./globals.css";
import CustomCursor from "@/components/CustomCursor";
import InitialLoading from "@/components/InitialLoading";

// Vazirmatn: Persian body font (it also covers Latin). Galada: English display headings only.
// If the font cannot be fetched at build time, Next falls back to the stack below.
const vazir = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazir",
  display: "swap",
  fallback: ["Tahoma", "Arial", "sans-serif"],
});
const galada = Galada({ subsets: ["latin"], weight: "400", variable: "--font-galada", display: "swap" });

export const metadata: Metadata = {
  title: "GameZone | رزرو سیستم گیمینگ",
  description: "مشخصات دقیق سیستم‌های Standard و Pro را ببینید و جای خود را آنلاین رزرو کنید.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={`${vazir.variable} ${galada.variable}`}>
      <body>
        <CustomCursor/>
        <InitialLoading />
        {children}
      </body>
    </html>
  );
}
