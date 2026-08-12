// The on-disk shape of the price data, shared by the importer (which writes it)
// and the live source (which reads it).
//
// Quotes are stored as a fixed-order TUPLE rather than an object. It looks less
// friendly, but price-history.json holds one tuple per card per day forever, and
// object keys would repeat `"foilMarket":` ~1,180 times a day — several times the
// size of the numbers themselves. SERIES_ORDER is the contract that makes the
// tuples readable; changing it invalidates every stored row, so append to the
// end if it ever needs to grow.

import type { SeriesKey } from "./source";

export const SERIES_ORDER = ["low", "mid", "market", "foil", "foilMarket"] as const satisfies readonly SeriesKey[];

/** [low, mid, market, foil, foilMarket] in integer USD cents; null = not priced. */
export type QuoteTuple = (number | null)[];

export interface PriceFile {
  /** UTC day this snapshot represents (yyyy-mm-dd). */
  day: string;
  fetchedAt: string;
  source: string;
  /** Keyed by RiftScribe card id. A card absent here has no price, which is NOT zero. */
  cards: Record<string, QuoteTuple>;
}

export interface HistoryFile {
  /** Ascending UTC days. Every card row is index-aligned with this. */
  days: string[];
  cards: Record<string, (QuoteTuple | null)[]>;
}

export interface CardDetail {
  productId: number;
  url: string;
  rarity: string | null;
  /** Real TCGplayer rules text. null when they don't publish it. Never invented. */
  description: string | null;
  flavorText: string | null;
  listings: number;
}

export interface DetailsFile {
  updatedAt: string;
  cards: Record<string, CardDetail>;
}
