import test from "node:test";
import assert from "node:assert/strict";
import { quote } from "../lib/pricing";
import { formatToman, toPersianDigits, normalizeDigits } from "../lib/format";
import { TIERS, getTier } from "../lib/config";
import { draftFromInput, priceMismatch } from "../lib/domain/booking";
import { input } from "./helpers";

test("tier configuration matches the brief", () => {
  assert.equal(getTier("standard").pricePerSeatHour, 130000);
  assert.equal(getTier("standard").seats, 4);
  assert.equal(getTier("pro").pricePerSeatHour, 140000);
  assert.equal(getTier("pro").seats, 6);
  assert.equal(TIERS.length, 2);
});

test("price = hourly price x seats x hours (examples from the brief)", () => {
  assert.equal(quote("standard", 1, 3).total, 390000);
  assert.equal(quote("standard", 2, 3).total, 780000);
  assert.equal(quote("pro", 1, 2).total, 280000);
  assert.equal(quote("pro", 3, 2).total, 840000);
});

test("quote rejects non-positive or fractional inputs", () => {
  assert.throws(() => quote("standard", 0, 1));
  assert.throws(() => quote("standard", 1, 0));
  assert.throws(() => quote("standard", 1.5, 1));
  assert.throws(() => quote("standard", 1, 2.5));
});

test("historical unit price override is respected", () => {
  assert.equal(quote("standard", 2, 2, 100000).total, 400000);
});

test("draft price/total come from the server formula, not from input", () => {
  const d = draftFromInput({ ...input({ seats: [1, 2], hours: 3 }), total: 1, pricePerSeat: 1 } as never, { source: "online", status: "confirmed" });
  assert.equal(d.pricePerSeat, 130000);
  assert.equal(d.total, 780000);
});

test("client-supplied total that differs from the server total is detected", () => {
  assert.equal(priceMismatch(780000, 780000), false);
  assert.equal(priceMismatch("780000", 780000), false);
  assert.equal(priceMismatch(1, 780000), true);
  assert.equal(priceMismatch(undefined, 780000), false);
});

test("Persian digits and toman formatting", () => {
  assert.equal(toPersianDigits("18:00"), "۱۸:۰۰");
  assert.equal(formatToman(130000), "۱۳۰٬۰۰۰ تومان");
  assert.equal(normalizeDigits("۰۹۱۲٣٤٥"), "0912345");
});
