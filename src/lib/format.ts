// Money is stored as integer cents everywhere, in USD — TCGplayer prices in USD
// and converting on write would bake today's rate into history. EUR is a display
// conversion applied at render time only (see currency.ts).

const SYMBOL: Record<string, string> = { USD: "$", EUR: "€" };

export function formatMoney(cents: number, currency: string = "USD"): string {
  const n = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
  return `${SYMBOL[currency] ?? "$"}${n}`;
}

export function formatMoneyCompact(cents: number, currency: string = "USD"): string {
  const sym = SYMBOL[currency] ?? "$";
  const dollars = cents / 100;
  if (dollars >= 1_000_000) return `${sym}${(dollars / 1_000_000).toFixed(2)}M`;
  if (dollars >= 1_000) return `${sym}${(dollars / 1_000).toFixed(1)}k`;
  return formatMoney(cents, currency);
}

// Signed percentage for a price delta, e.g. "+12.4%" / "-3.1%".
export function formatPct(pct: number): string {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

// Lets "kaisa" match "Kai'Sa" and "jinxloosecannon" match "Jinx, Loose Cannon".
export function normalizeSearch(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

export function formatDateShort(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
