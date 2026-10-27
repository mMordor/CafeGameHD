import test from "node:test";
import assert from "node:assert/strict";
import { MENU } from "../lib/menu";
import { formatToman } from "../lib/format";

test("menu: item counts, integer toman prices, unique ids, and the figures from the brief (x1000)", () => {
  assert.deepEqual(MENU.map((c) => c.items.length), [6, 7, 7]);
  const ids = MENU.flatMap((c) => c.items.map((i) => i.id));
  assert.equal(new Set(ids).size, ids.length);
  for (const c of MENU) for (const i of c.items) assert.ok(Number.isInteger(i.price) && i.price >= 1000, i.name);
  const price = (name: string) => MENU.flatMap((c) => c.items).find((i) => i.name === name)!.price;
  assert.equal(price("آیس لاته"), 180000);
  assert.equal(price("انواع شیک"), 250000);
  assert.equal(price("آفاگاتو"), 210000);
  assert.equal(price("سیب سوسیس"), 485000);
  assert.equal(price("نودل"), 100000);
  assert.equal(formatToman(price("سیب سوسیس")), "۴۸۵٬۰۰۰ تومان");
  assert.deepEqual(MENU.map((c) => c.heroEn), ["CHILL & REFRESH", "WARMTH IN EVERY SIP", "CRAFTED BITES"]);
});
