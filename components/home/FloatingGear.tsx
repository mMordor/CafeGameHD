import { Glyph, GLYPH_KINDS } from "../Glyphs";
import type { TierId } from "@/lib/config";

// Decorative floating gear. Positions/sizes come from the .b1 ... .b9 CSS classes.
// The glyph set rotates when the tier changes, so the swap is visible during the implode/explode.
export const kindFor = (tier: TierId, slot: number) =>
  GLYPH_KINDS[(slot + (tier === "pro" ? 3 : 0)) % GLYPH_KINDS.length];

export default function FloatingGear({ slots, tier }: { slots: number[]; tier: TierId }) {
  return (
    <>
      {slots.map((slot) => (
        <div key={slot} className={`berry b${slot + 1}`}>
          <Glyph kind={kindFor(tier, slot)} />
        </div>
      ))}
    </>
  );
}
