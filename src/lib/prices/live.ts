// The live price source: real TCGplayer data, read from the snapshot files the
// importer commits (see scripts/import-prices.ts).
//
// A card that TCGplayer doesn't price is ABSENT here, not zero. Every caller has
// to handle that — `latest()` returns an all-null quote and the card renders a
// dash. Publishing 0.00 for "we couldn't find it" would be a wrong price, and it
// would poison the movers tables and set totals as well as the card page.
//
// History is only as long as the importer has been running: there is no public
// TCGplayer endpoint for historical prices, so the series genuinely starts on the
// first import rather than being backfilled with anything invented.

import type { RiftCard } from "@/lib/catalog";
import priceFile from "@/data/prices.json";
import historyFile from "@/data/price-history.json";
import type { PriceFile, HistoryFile, QuoteTuple } from "./store";
import { SERIES_ORDER } from "./store";
import type { PriceQuote, PriceSnapshot, PriceSource } from "./source";

const PRICES = priceFile as unknown as PriceFile;
const HISTORY = historyFile as unknown as HistoryFile;

export const EMPTY_QUOTE: PriceQuote = { low: null, mid: null, market: null, foil: null, foilMarket: null };

function toQuote(t: QuoteTuple | null | undefined): PriceQuote {
  if (!t) return EMPTY_QUOTE;
  const q = { ...EMPTY_QUOTE } as Record<string, number | null>;
  SERIES_ORDER.forEach((key, i) => {
    q[key] = t[i] ?? null;
  });
  return q as unknown as PriceQuote;
}

/** True once a real snapshot exists — what flips the site off demo data. */
export const HAS_LIVE_PRICES = Object.keys(PRICES.cards ?? {}).length > 0;

export const LIVE_PRICED_COUNT = Object.keys(PRICES.cards ?? {}).length;
export const LIVE_FETCHED_AT: string | null = PRICES.fetchedAt ?? null;
export const HISTORY_DAYS: string[] = HISTORY.days ?? [];

const quoteCache = new Map<string, PriceQuote>();

function latest(card: RiftCard): PriceQuote {
  const hit = quoteCache.get(card.id);
  if (hit) return hit;
  const q = toQuote(PRICES.cards?.[card.id]);
  quoteCache.set(card.id, q);
  return q;
}

const historyCache = new Map<string, PriceSnapshot[]>();

function history(card: RiftCard): PriceSnapshot[] {
  const hit = historyCache.get(card.id);
  if (hit) return hit;

  const row = HISTORY.cards?.[card.id];
  const out: PriceSnapshot[] = [];
  if (row) {
    HISTORY.days.forEach((day, i) => {
      const t = row[i];
      // Gaps stay gaps. Carrying the previous day forward would draw a flat line
      // through days we have no data for, which reads as "the price held".
      if (!t) return;
      out.push({ day, ...toQuote(t) });
    });
  }
  historyCache.set(card.id, out);
  return out;
}

/**
 * The quote N days before the latest snapshot.
 *
 * Walks back through the history to the newest day at or before the target,
 * because the importer can miss a day (a failed run, a rate limit) and the
 * movers tables must not silently compare against nothing. Returns an empty
 * quote when the history doesn't reach back that far — which is the honest
 * answer for a card first seen yesterday, and renders as "—" rather than a
 * fabricated 0% move.
 */
export function liveQuoteDaysAgo(card: RiftCard, daysAgo: number): PriceQuote {
  const h = history(card);
  if (h.length === 0) return EMPTY_QUOTE;

  const newest = h[h.length - 1];
  const targetMs = Date.parse(`${newest.day}T00:00:00Z`) - daysAgo * 86_400_000;

  for (let i = h.length - 1; i >= 0; i--) {
    if (Date.parse(`${h[i].day}T00:00:00Z`) <= targetMs) return h[i];
  }
  return EMPTY_QUOTE;
}

export const liveSource: PriceSource = {
  id: "tcgplayer",
  label: "TCGplayer",
  isLive: true,
  history,
  latest,
};
