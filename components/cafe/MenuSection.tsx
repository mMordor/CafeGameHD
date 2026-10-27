"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import type { MenuCategory } from "@/lib/menu";
import ProductCard from "./ProductCard";

type MenuSectionProps = {
  category: MenuCategory;
  index: number;
};

const themes = {
  cold: {
    background: "bg-[#e0ebcf]",
    accent: "text-[#4c7357]",
    circle: "bg-[#edf3df]",
  },
  hot: {
    background: "bg-[#f2e6d4]",
    accent: "text-[#a45d39]",
    circle: "bg-[#f7eddf]",
  },
  food: {
    background: "bg-[#f8d879]",
    accent: "text-[#87501f]",
    circle: "bg-[#ffe8a0]",
  },
};

export default function MenuSection({
  category,
  index,
}: MenuSectionProps) {
  const theme = themes[category.theme];

  return (
    <section
      id={category.id}
      className={`${theme.background} overflow-hidden px-5 py-12 transition-colors duration-500 sm:px-8 sm:py-16 lg:px-[5%]`}
    >
      <div className="mx-auto max-w-[1440px]">
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[0.9fr_1.1fr] md:gap-12">
            {/* تصویر دسته‌بندی */}
            <div className="relative mx-auto flex aspect-square w-full max-w-[330px] items-center justify-center md:max-w-[380px]">
              <div
                className={`absolute inset-[10%] rounded-full ${theme.circle}`}
              />

              <motion.div
                className="relative z-10 h-[85%] w-[85%]"
                whileHover={{ rotate: -3, scale: 1.04 }}
                transition={{ duration: 0.35 }}
              >
                <Image
                  src={category.image}
                  alt={category.imageLabel}
                  fill
                  sizes="(max-width: 768px) 85vw, 380px"
                  className="object-contain drop-shadow-xl"
                />
              </motion.div>

              <div className="absolute bottom-[10%] left-0 z-20 max-w-[190px] -rotate-6 rounded-2xl bg-[#fffdf7] px-4 py-3 shadow-sm">
                <p className={`text-xs font-extrabold ${theme.accent}`}>
                  {category.imageLabel}
                </p>

                <p className="mt-1 text-[10px] text-[#8b7b6a]">
                  {category.imageDescription}
                </p>
              </div>
            </div>

            {/* عنوان و توضیحات */}
            <div className="text-right">
              <div className={`flex items-center gap-2 text-xs ${theme.accent}`}>
                <span className="rounded-full border border-current px-3 py-1">
                  {category.number}
                </span>

                <span>{category.subtitle}</span>
              </div>

              <h2 className="mt-5 text-3xl font-black tracking-tight text-[#35251c] sm:text-4xl lg:text-5xl">
                {category.title}
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-8 text-[#817565] sm:mr-auto sm:text-base">
                {category.description}
              </p>
            </div>
          </div>
        </motion.div>

        {/* کارت‌های محصولات */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {category.products.map((product, productIndex) => (
            <motion.div
              key={product.name}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{
                duration: 0.45,
                delay: productIndex * 0.09,
              }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>

        <div className={`mt-5 flex items-center justify-between gap-3 text-[10px] ${theme.accent}`}>
          <Sparkles size={15} />

          <p>
            با حوصله آماده می‌کنیم؛ با عشق سرو می‌کنیم.
          </p>
        </div>
      </div>
    </section>
  );
}