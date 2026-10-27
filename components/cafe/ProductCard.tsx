import {
  Coffee,
  CupSoda,
  Sandwich,
} from "lucide-react";

import type { Product } from "@/lib/menu";

type ProductCardProps = {
  product: Product;
};

const icons = {
  drink: CupSoda,
  coffee: Coffee,
  food: Sandwich,
};

export default function ProductCard({
  product,
}: ProductCardProps) {
  const Icon = icons[product.icon];

  return (
    <article className="group flex min-h-[130px] flex-col justify-between rounded-2xl bg-[#fffdf7] p-4 text-right shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:min-h-[150px] sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-[#9a795f] sm:text-xs">
          {product.label}
        </span>

        <Icon
          size={17}
          strokeWidth={1.5}
          className="shrink-0 text-[#55785d]"
          aria-hidden="true"
        />
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-extrabold text-[#38271e] sm:text-base">
          {product.name}
        </h3>

        <p className="mt-2 line-clamp-2 text-[10px] leading-5 text-[#8b7b6a] sm:text-xs">
          {product.description}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-[10px] text-[#8b7b6a]">
          تومان
        </span>

        <span className="text-sm font-black text-[#466c4d] sm:text-base">
          {product.price.toLocaleString("fa-IR")}
        </span>
      </div>
    </article>
  );
}