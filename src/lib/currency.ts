export const CURRENCIES = ["USD", "EUR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const DEFAULT_CURRENCY: Currency = "USD";

/**
 * Display-only FX. Prices are STORED in USD cents because TCGplayer quotes USD
 * and converting on write would freeze one day's rate into the history; EUR is
 * applied at render time and is a reference figure, not a price you can pay.
 *
 * TODO: replace with a daily rate fetched from an FX provider (TCGEmpire does
 * this in lib/fx.ts) once there's somewhere to cache it. A hard-coded rate is
 * honest enough for a demo but will drift.
 */
export const USD_TO: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
};

export function convert(cents: number, to: Currency): number {
  return Math.round(cents * USD_TO[to]);
}

export const CURRENCY_STORAGE_KEY = "rbs.currency";
export const THEME_STORAGE_KEY = "rbs.theme";
