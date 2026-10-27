"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

import FloatingDecor from "./FloatingDecor";

export default function Hero() {
  const handleMouseMove = (
    event: React.MouseEvent<HTMLElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    event.currentTarget.style.setProperty("--mouse-x", `${x}%`);
    event.currentTarget.style.setProperty("--mouse-y", `${y}%`);
  };

  return (
    <section onMouseMove={handleMouseMove} className="cafe-hero-bg relative isolate min-h-screen overflow-hidden bg-[#fa531d] px-5 text-white sm:px-8 lg:px-[5%]">
      <FloatingDecor />
      <div className="dots-hover" aria-hidden="true" />
      
      <div className="cafe-particles" aria-hidden="true">
        <span className="cafe-particle" />
        <span className="cafe-particle" />
        <span className="cafe-particle" />
        <span className="cafe-particle" />
        <span className="cafe-particle" />
      </div>
      <div className="relative mx-auto pt-18 sm:h-[900px] grid max-w-[1440px] grid-cols-1 items-center gap-4 pb-16 pt-8 md:grid-cols-2 md:pb-20 md:pt-10">
        {/* تصویرهای اصلی */}
        <div className="relative mx-auto flex aspect-square w-full max-w-[290px] items-center justify-center md:order-1 md:max-w-[450px]">
          <div className="absolute inset-[8%] rounded-full bg-[#ff7c43]" />

          <motion.div
            className="absolute inset-[3%] z-10"
            initial={{ opacity: 0, y: -25, rotate: -8 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <motion.div
              className="relative h-full w-full"
              animate={{ y: [0, -8, 0], rotate: [0, 1.5, 0] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Image
                src="/images/hero-cup.png"
                alt="لیوان قهوه بیرون‌بر"
                fill
                priority
                sizes="(max-width: 768px) 90vw, 450px"
                className="object-contain drop-shadow-2xl"
              />
            </motion.div>
          </motion.div>

          <motion.div
            className="absolute bottom-[4%] left-[2%] z-20 h-[36%] w-[32%]"
            initial={{ opacity: 0, x: -20, rotate: -12 }}
            animate={{ opacity: 1, x: 0, rotate: -8 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Image
              src="/images/hero-snack.png"
              alt="بسته اسنک"
              fill
              sizes="150px"
              className="object-contain drop-shadow-lg"
            />
          </motion.div>

          <motion.div
            className="absolute bottom-[12%] right-[4%] z-30 -rotate-6 rounded-full bg-[#fff8e9] px-4 py-2 text-xs font-bold text-[#4b2a1c] shadow-sm"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3.5, repeat: Infinity }}
          >
            به جرعه حال خوب!
          </motion.div>
        </div>

        {/* تیتر اصلی */}
        <motion.div
          className="relative z-20 order-first text-right md:order-2"
          initial={{ opacity: 0, x: 25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          <p className="text-xs font-medium text-white/90">
            اینجا، خوشمزه‌تره.
          </p>

          <h1 className="mt-5 text-3xl font-black leading-[1.65] tracking-tight sm:text-4xl lg:text-5xl">
            بازی کن،
            <br />
            با طعم‌های خوشمزه
            <br />
            لذت رو چند برابر کن!
          </h1>

          <p className="mt-5 max-w-lg text-xs leading-7 text-[#702d17] sm:text-sm">
            از اولین جرعه تا آخرین لقمه؛ طعم محبوبت رو پیدا کن،
            بی‌حاشیه، با ما.
          </p>
        </motion.div>

        {/* نوار پایین Hero */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 border-t border-white/15 py-4 text-[10px] text-white/90">
          <a
            href="#cold"
            className="flex items-center gap-2 transition hover:text-white"
          >
            <ArrowDown size={15} />
            خوشمزه‌گی از اینجا شروع می‌شه
          </a>

          <span>منوی کافه گیم‌نت؛ تازه، ساده، دوست‌داشتنی</span>
        </div>
      </div>
    </section>
  );
}