import type { MenuCategory } from "@/lib/menu";
import { formatToman, toPersianDigits } from "@/lib/format";
import Reveal from "../Reveal";
import { ColdArt, FoodArt, HotArt } from "./CafeArt";

export default function CafeSection({ category, index }: { category: MenuCategory; index: number }) {
  const Art = category.id === "cold" ? ColdArt : category.id === "hot" ? HotArt : FoodArt;
  return (
    <section id={category.id} className={`cf-section cf-${category.id}`} aria-labelledby={`cf-title-${category.id}`}>
      <div className="cf-hero">
        <div className="cf-copy">
          <p className="cf-index">{toPersianDigits(`0${index + 1}`)}</p>
          <p className="cf-big ltr" aria-hidden="true">{category.heroEn}</p>
          <h2 id={`cf-title-${category.id}`} className="cf-title">{category.title}</h2>
          <p className="cf-tagline">{category.tagline}</p>
        </div>
        <div className="cf-art-wrap">
          <Art />
        </div>
      </div>

      <ul className="cf-grid">
        {category.items.map((item, i) => (
          <li key={item.id}>
            <Reveal delay={i * 70}>
              <article className="cf-card">
                <span className="cf-card-no" aria-hidden="true">{toPersianDigits(`${i + 1}`.padStart(2, "0"))}</span>
                <h3>{item.name}</h3>
                {item.description && <p className="cf-desc">{item.description}</p>}
                <p className="cf-price">{formatToman(item.price)}</p>
              </article>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
