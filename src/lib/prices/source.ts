// The pricing adapter boundary.
//
// Every page reads prices through this interface and never touches a vendor API
// directly, so swapping the demo generator for live TCGplayer data is a one-line
// change in `activeSource()` with no page edits. Mirrors how TCGEmpire keeps its
// importers behind lib/price-import.ts rather than calling vendors from routes.

import type { RiftCard } from "@/lib/catalog";

/**
 * One printing's price set at a point in time. All values are integer USD cents.
 *
 * `market` is the headline figure this site displays — TCGplayer's Market Price,
 * the fair-market value derived from completed sales. It is deliberately NOT the
 * lowest listing: the cheapest listing on a TCG marketplace is routinely a
 * damaged or foreign-language copy, which is why TCGEmpire's lib/tcgplayer.ts
 * records market price too (see its Dazzling Aurora note).
 */
/**
 * EVERY FIELD IS NULLABLE, and that is the whole point.
 *
 * With real data, "TCGplayer has no price for this printing" is a routine fact —
 * a card too new to have sold, a token nobody lists, a printing the matcher
 * couldn't confidently identify. null means exactly that. It does NOT mean zero:
 * a zero would sort to the top of "cheapest", drag down set totals and the market
 * index, and read as a real valuation. Callers must render null as "—".
 */
export interface PriceQuote {
  /** Lowest active listing. Any condition and language, so it can sit well under market. */
  low: number | null;
  /** TCGplayer "Listed Median" — the average of current asking prices. */
  mid: number | null;
  /** TCGplayer Market Price for the Normal printing — the headline figure. */
  market: number | null;
  /** Listed Median for the Foil printing. */
  foil: number | null;
  /** Market Price for the Foil printing. */
  foilMarket: number | null;
}

/** A quote pinned to a calendar day (UTC, yyyy-mm-dd) — one row of the chart. */
export interface PriceSnapshot extends PriceQuote {
  day: string;
}

/** The five plottable series on the card page's price-history chart. */
export const SERIES_KEYS = ["low", "mid", "market", "foil", "foilMarket"] as const;
export type SeriesKey = (typeof SERIES_KEYS)[number];

export const SERIES_META: Record<SeriesKey, { label: string; color: string; foil: boolean }> = {
  low: { label: "Low", color: "#7f9bb8", foil: false },
  mid: { label: "Average", color: "#4da3ff", foil: false },
  market: { label: "Market", color: "#3fb950", foil: false },
  foil: { label: "Foil", color: "#caa85a", foil: true },
  foilMarket: { label: "Market Foil", color: "#e0b978", foil: true },
};

export interface PriceSource {
  /** Stable key used in the card page's price-source dropdown. */
  readonly id: string;
  readonly label: string;
  /** false ⇒ the numbers are generated demo data and must be labelled as such. */
  readonly isLive: boolean;
  /** Daily snapshots, oldest → newest. */
  history(card: RiftCard): PriceSnapshot[];
  /** The most recent snapshot. */
  latest(card: RiftCard): PriceQuote;
}
