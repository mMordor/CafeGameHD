// Single source of truth for the café menu. Prices are integer toman (the brief gave thousands).
// "description" is optional and editable; leave it out rather than inventing ingredients.
export type MenuItem = { id: string; name: string; price: number; description?: string };
export type MenuCategory = {
  id: "cold" | "hot" | "food";
  navLabel: string;
  title: string;
  heroEn: string;
  tagline: string;
  items: MenuItem[];
  // CSS custom properties applied to the café page when this category is selected.
  theme: Record<string, string>;
};

export const MENU: MenuCategory[] = [
  {
    id: "cold",
    navLabel: "نوشیدنی سرد",
    title: "نوشیدنی‌های سرد",
    heroEn: "CHILL & REFRESH",
    tagline: "نوشیدنی‌های خنک برای وسط بازی",
    // Ice blue, mint, crisp white, deep slate typography.
    theme: {
      "--glow": "rgba(143,227,207,0.60)", "--bg-mid": "#E6F6FB", "--bg-outer": "#F7FEFF",
      "--fg": "#1E2B37", "--fg-muted": "rgba(30,43,55,0.74)",
      "--panel-bg": "rgba(255,255,255,0.66)", "--panel-border": "rgba(30,43,55,0.14)", "--card-bg": "rgba(255,255,255,0.72)",
      "--accent": "#8FE3CF", "--accent-soft": "#BDEFF7", "--accent-2": "#2BB7B0", "--accent-text": "#0F766E", "--accent-fg": "#1E2B37", "--glyph": "#1E2B37",
    },
    items: [
      { id: "ice-latte", name: "آیس لاته", price: 180000 },
      { id: "ice-americano", name: "آیس آمریکانو", price: 140000 },
      { id: "cantaloupe-juice", name: "آب طالبی", price: 140000 },
      { id: "mojito", name: "موهیتو", price: 170000 },
      { id: "banana-milk", name: "شیر موز", price: 200000 },
      { id: "shakes", name: "انواع شیک", price: 250000 },
    ],
  },
  {
    id: "hot",
    navLabel: "نوشیدنی گرم",
    title: "نوشیدنی‌های گرم",
    heroEn: "WARMTH IN EVERY SIP",
    tagline: "قهوه و چای برای ساعت‌های طولانی",
    // Espresso brown, cream and warm beige, dark-brown typography.
    theme: {
      "--glow": "rgba(217,190,156,0.70)", "--bg-mid": "#F6EBDD", "--bg-outer": "#E8D5BA",
      "--fg": "#2A170E", "--fg-muted": "rgba(42,23,14,0.76)",
      "--panel-bg": "rgba(251,244,234,0.7)", "--panel-border": "rgba(59,36,24,0.18)", "--card-bg": "rgba(251,244,234,0.78)",
      "--accent": "#3B2418", "--accent-soft": "#6B4630", "--accent-2": "#D9BE9C", "--accent-text": "#6B3F23", "--accent-fg": "#F6EBDD", "--glyph": "#3B2418",
    },
    items: [
      { id: "double-espresso", name: "اسپرسو دوبل", price: 130000 },
      { id: "latte", name: "لته", price: 180000 },
      { id: "americano", name: "آمریکانو", price: 150000 },
      { id: "cappuccino", name: "کاپوچینو", price: 175000 },
      { id: "masala-chai", name: "چای ماسالا", price: 180000 },
      { id: "affogato", name: "آفاگاتو", price: 210000 },
      { id: "karak-chai", name: "چای کرک", price: 180000 },
    ],
  },
  {
    id: "food",
    navLabel: "غذا و تنقلات",
    title: "غذاها و تنقلات",
    heroEn: "CRAFTED BITES",
    tagline: "غذاهای سبک و تنقلات",
    // Warm terracotta, soft amber, dark charcoal typography.
    theme: {
      "--glow": "rgba(242,169,59,0.60)", "--bg-mid": "#FBE3B8", "--bg-outer": "#F2C27A",
      "--fg": "#2B2B2E", "--fg-muted": "rgba(43,43,46,0.78)",
      "--panel-bg": "rgba(255,243,218,0.7)", "--panel-border": "rgba(43,43,46,0.18)", "--card-bg": "rgba(255,243,218,0.8)",
      "--accent": "#A8402B", "--accent-soft": "#C8553D", "--accent-2": "#F2A93B", "--accent-text": "#A8402B", "--accent-fg": "#FFF6E8", "--glyph": "#2B2B2E",
    },
    items: [
      { id: "omelette", name: "املت", price: 380000 },
      { id: "special-potato", name: "سیب ویژه", price: 320000 },
      { id: "sausage-potato", name: "سیب سوسیس", price: 485000 },
      { id: "nugget-plate", name: "ظرف ناگت", price: 285000 },
      { id: "snack", name: "اسنک", price: 150000 },
      { id: "noodle", name: "نودل", price: 100000 },
      { id: "tiramisu", name: "تیرامیسو", price: 200000 },
    ],
  },
];
