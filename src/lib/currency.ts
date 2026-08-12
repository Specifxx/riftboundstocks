// Display currencies, in selector order. USD first because it is the base:
// prices are STORED in USD cents (TCGplayer quotes USD, and converting on write
// would freeze one day's rate into permanent history). Everything else is a
// render-time conversion — a reference figure, never a price you can pay.
export const CURRENCIES = ["USD", "EUR", "GBP", "AUD", "CAD", "SGD", "NZD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const DEFAULT_CURRENCY: Currency = "USD";

export const CURRENCY_LABEL: Record<Currency, string> = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  AUD: "Australian Dollar",
  CAD: "Canadian Dollar",
  SGD: "Singapore Dollar",
  NZD: "New Zealand Dollar",
};

const rate = (v: string | undefined, fallback: number): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

/**
 * USD → currency multipliers. Ported from TCGEmpire's lib/fx.ts, including the
 * env-var names, so the two sites convert identically and a rate can be fixed on
 * both without a code change.
 *
 * Deliberately crude and hand-refreshed: every figure these produce is a
 * reference/market price, not a quote, so exact FX doesn't change what the
 * number means. Override any rate without a deploy via the env var.
 *
 * The vars are NEXT_PUBLIC_ because the conversion happens in a client component
 * (<Money>) — one rate table, no server/client drift. Next only inlines
 * statically-referenced process.env.NEXT_PUBLIC_* into the browser bundle, so
 * each var must be read by its literal name here, never via a computed key.
 *
 * TODO: fetch daily rates and cache them, the way a real market site would.
 */
export const USD_TO: Record<Currency, number> = {
  USD: 1,
  EUR: rate(process.env.NEXT_PUBLIC_USD_TO_EUR, 0.92),
  GBP: rate(process.env.NEXT_PUBLIC_USD_TO_GBP, 0.79),
  AUD: rate(process.env.NEXT_PUBLIC_USD_TO_AUD, 1.5),
  CAD: rate(process.env.NEXT_PUBLIC_USD_TO_CAD, 1.37),
  SGD: rate(process.env.NEXT_PUBLIC_USD_TO_SGD, 1.35),
  NZD: rate(process.env.NEXT_PUBLIC_USD_TO_NZD, 1.65),
};

/** Integer USD cents → integer cents of `to`. */
export function convert(cents: number, to: Currency): number {
  return Math.round(cents * (USD_TO[to] ?? 1));
}

export const CURRENCY_STORAGE_KEY = "rbs.currency";
export const THEME_STORAGE_KEY = "rbs.theme";
