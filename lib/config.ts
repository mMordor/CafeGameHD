// Single source of truth for business data: hours, tiers, prices, capacities, specs, themes.
// Edit here, not in components.

const intEnv = (v: string | undefined, fallback: number) => {
  if (v === undefined || v.trim() === "") return fallback;
  const n = Number(v);
  return Number.isInteger(n) ? n : fallback;
};

export const SITE = {
  name: "Cafe HD",
  // Business timezone. The default is a PLACEHOLDER (assumed from the Persian/Toman audience).
  // Set NEXT_PUBLIC_BUSINESS_TIMEZONE to the real one. All "today / past hour" decisions use it,
  // never the server's or the visitor's own clock.
  timeZone: process.env.NEXT_PUBLIC_BUSINESS_TIMEZONE || "Asia/Tehran",
  // Bookable hours (24h) and longest booking. PLACEHOLDER defaults, not confirmed business rules.
  // Bookings cannot cross midnight: start + duration must be <= closeHour (24 = midnight).
  openHour: intEnv(process.env.NEXT_PUBLIC_OPEN_HOUR, 10),
  closeHour: intEnv(process.env.NEXT_PUBLIC_CLOSE_HOUR, 24),
  maxHours: intEnv(process.env.NEXT_PUBLIC_MAX_HOURS, 5),
  onlineWindowDays: 14, // how far ahead customers may book online
  staffWindowDays: 180, // how far ahead staff may book
  maxActiveBookingsPerPhone: 3, // anti-abuse cap for online bookings
  pcModelUrl: process.env.NEXT_PUBLIC_PC_MODEL_URL ?? "",
};

export type TierId = "standard" | "pro";
export type Status = "confirmed" | "checked_in" | "completed" | "no_show" | "cancelled";
export type Source = "online" | "phone";

export const STATUSES: { id: Status; label: string }[] = [
  { id: "confirmed", label: "تأیید شده" },
  { id: "checked_in", label: "حاضر شد" },
  { id: "completed", label: "پایان یافته" },
  { id: "no_show", label: "عدم حضور" },
  { id: "cancelled", label: "لغو شده" },
];

export const SOURCE_LABELS: Record<Source, string> = { online: "آنلاین", phone: "تلفنی" };

export type SpecRow = { key: string; label: string; value: string };

export type Tier = {
  id: TierId;
  nameEn: string;
  nameFa: string;
  description: string;
  pricePerSeatHour: number; // toman, integer
  seats: number; // total capacity of this tier
  specs: SpecRow[];
  // CSS custom properties applied to the home page when this tier is selected.
  theme: Record<string, string>;
};

const DESCRIPTION = "اجرای روان با کیفیت 1080p برای تمام عناوین محبوب";

export const TIERS: Tier[] = [
  {
    id: "standard",
    nameEn: "Standard",
    nameFa: "استاندارد",
    description: DESCRIPTION,
    pricePerSeatHour: 130000,
    seats: 4,
    specs: [
      { key: "cpu", label: "پردازنده", value: "Intel Core i5-12400F" },
      { key: "gpu", label: "کارت گرافیک", value: "NVIDIA RTX 3060 8GB" },
      { key: "ram", label: "رم", value: "16GB DDR4 3200" },
      { key: "storage", label: "حافظه", value: "1TB NVMe SSD" },
      { key: "monitor", label: "مانیتور", value: "24-inch 180Hz VA" },
      { key: "gear", label: "تجهیزات", value: "Mechanical keyboard, Logitech 6400 DPI mouse, headset" },
    ],
    // Neon pink / magenta dominant, cyan highlight, dark purple + near black background.
    theme: {
      "--glow": "rgba(255,0,127,0.34)",
      "--bg-mid": "#120A1F",
      "--bg-outer": "#0D0D12",
      "--fg": "#FFFFFF",
      "--fg-muted": "rgba(255,255,255,0.74)",
      "--panel-bg": "rgba(18,10,31,0.58)",
      "--panel-border": "rgba(255,255,255,0.16)",
      "--card-bg": "rgba(255,255,255,0.06)",
      "--accent": "#FF007F",
      "--accent-soft": "#FF1493",
      "--accent-2": "#00E5FF",
      "--accent-text": "#00FFFF",
      "--accent-fg": "#0D0D12",
      "--glyph": "#FFFFFF",
    },
  },
  {
    id: "pro",
    nameEn: "Pro",
    nameFa: "پرو",
    description: DESCRIPTION,
    pricePerSeatHour: 140000,
    seats: 6,
    specs: [
      { key: "cpu", label: "پردازنده", value: "Intel Core i5-12400F" },
      { key: "gpu", label: "کارت گرافیک", value: "NVIDIA RTX 5060 8GB" },
      { key: "ram", label: "رم", value: "32GB DDR4 3200" },
      { key: "storage", label: "حافظه", value: "2TB NVMe Gen4" },
      { key: "monitor", label: "مانیتور", value: "27-inch 180Hz" },
      { key: "gear", label: "تجهیزات", value: "Esports keyboard, Logitech 26K DPI mouse, 7.1 headset" },
    ],
    // White / off-white dominant, mint + cyan accents, silver / light-grey depth. Dark text for contrast.
    theme: {
      "--glow": "rgba(0,229,255,0.40)",
      "--bg-mid": "#F8F9FA",
      "--bg-outer": "#E9ECEF",
      "--fg": "#0D0D12",
      "--fg-muted": "rgba(13,13,18,0.72)",
      "--panel-bg": "rgba(255,255,255,0.66)",
      "--panel-border": "#CED4DA",
      "--card-bg": "rgba(255,255,255,0.6)",
      "--accent": "#00E5FF",
      "--accent-soft": "#4DF0D6",
      "--accent-2": "#4DF0D6",
      "--accent-text": "#0D0D12",
      "--accent-fg": "#0D0D12",
      "--glyph": "#0D0D12",
    },
  },
];

export const getTier = (id: string): Tier => {
  const t = TIERS.find((x) => x.id === id);
  if (!t) throw new RangeError(`Unknown tier: ${id}`);
  return t;
};

export const isTierId = (v: unknown): v is TierId => TIERS.some((t) => t.id === v);
