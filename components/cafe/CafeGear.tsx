import type { MenuCategory } from "@/lib/menu";
import CafeGlyph from "./CafeGlyph";
import type { CafeGlyphKind } from "./CafeGlyph";

type CategoryId = MenuCategory["id"];

// Eight floating items per category (slot -> shape). They swap when the category changes,
// during the implode/explode transition.
export const GEAR: Record<CategoryId, CafeGlyphKind[]> = {
  cold: ["ice", "drop", "leaf", "ice", "drop", "leaf", "ice", "drop"],
  hot: ["bean", "swirl", "bean", "spark", "bean", "swirl", "bean", "spark"],
  food: ["wedge", "ring", "spark", "wedge", "ring", "wedge", "spark", "ring"],
};

export default function CafeGear({ category, slots }: { category: CategoryId; slots: number[] }) {
  return (
    <>
      {slots.map((slot) => (
        <div key={slot} className={`berry cx-b${slot + 1}`}>
          <CafeGlyph kind={GEAR[category][slot]} />
        </div>
      ))}
    </>
  );
}
