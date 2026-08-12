// The public pricing API. Pages import from here and never from a specific
// source, so switching to live TCGplayer data is a change to activeSource() alone.

import { CARDS, type RiftCard } from "@/lib/catalog";
import { syntheticSource, syntheticQuoteDaysAgo, todayIndex } from "./synthetic";
import type { PriceQuote, PriceSnapshot, PriceSource, SeriesKey } from "./source";

export * from "./source";

/**
 * The source backing every price on the site.
 *
 * Returns the demo generator until TCGPLAYER_PUBLIC_KEY is set. Wiring the live
 * reader in is deliberately left as the one edit needed here: run
 * `npm run prices:import` to populate snapshots, then return the Prisma-backed
 * source. Nothing outside this file has to change.
 */
export function activeSource(): PriceSource {
  return syntheticSource;
}

export function priceHistory(card: RiftCard): PriceSnapshot[] {
  return activeSource().history(card);
}

export function latestQuote(card: RiftCard): PriceQuote {
  return activeSource().latest(card);
}

export function quoteDaysAgo(card: RiftCard, daysAgo: number): PriceQuote {
  // The demo source can answer any single day without building a series; a
  // database-backed source would query one day's rows here instead.
  return syntheticQuoteDaysAgo(card, daysAgo);
}

export function seriesValue(q: PriceQuote, key: SeriesKey): number | null {
  return q[key];
}

/** Percentage change between two prices; null when the baseline is missing or zero. */
export function pctChange(now: number | null, then: number | null): number | null {
  if (now == null || then == null || then === 0) return null;
  return ((now - then) / then) * 100;
}

// ── per-card statistics (the card page's Data panel) ─────────────────────────

export interface Extreme {
  cents: number;
  day: string;
}

export interface CardStats {
  latest: PriceQuote;
  allTimeHigh: Extreme;
  allTimeLow: Extreme;
  /** Foil market ÷ non-foil market. null when the card has no foil printing. */
  foilMultiplier: number | null;
  /** (Mid − Low) ÷ Mid, as a percentage — how wide the bid/ask sits. */
  spreadPct: number;
  /**
   * Indicative buylist (what a shop pays). Vendors buy well under market; this is
   * a flat fraction, NOT a quoted offer from any real buyer.
   */
  buylistCents: number;
  deltas: {
    day: { regular: number | null; foil: number | null };
    week: { regular: number | null; foil: number | null };
    month: { regular: number | null; foil: number | null };
  };
  points: number;
}

export function cardStats(card: RiftCard): CardStats {
  const history = priceHistory(card);
  const latest = history[history.length - 1];

  let hi = history[0];
  let lo = history[0];
  for (const p of history) {
    if (p.market > hi.market) hi = p;
    if (p.market < lo.market) lo = p;
  }

  const delta = (days: number) => {
    const then = quoteDaysAgo(card, days);
    return {
      regular: pctChange(latest.market, then.market),
      foil: pctChange(latest.foilMarket, then.foilMarket),
    };
  };

  return {
    latest,
    allTimeHigh: { cents: hi.market, day: hi.day },
    allTimeLow: { cents: lo.market, day: lo.day },
    foilMultiplier: latest.foilMarket == null ? null : latest.foilMarket / latest.market,
    spreadPct: latest.mid > 0 ? ((latest.mid - latest.low) / latest.mid) * 100 : 0,
    buylistCents: Math.round(latest.market * 0.55),
    deltas: { day: delta(1), week: delta(7), month: delta(30) },
    points: history.length,
  };
}

// ── movers (the ticker, the homepage and /interests) ─────────────────────────

export interface Mover {
  card: RiftCard;
  now: number;
  then: number;
  pct: number;
}

/**
 * Cards whose price moved most over `days`, on the given series.
 *
 * `minCents` keeps the lists signal-rich: a bulk common going from $0.10 to $0.14
 * is a 40% "gain" that tells nobody anything, and without a floor those dominate
 * every percentage-ranked table.
 */
function computeMovers(series: SeriesKey, days: number, minCents: number): Mover[] {
  const out: Mover[] = [];
  for (const card of CARDS) {
    const now = seriesValue(latestQuote(card), series);
    const then = seriesValue(quoteDaysAgo(card, days), series);
    if (now == null || then == null || now < minCents) continue;
    const pct = pctChange(now, then);
    if (pct == null || !isFinite(pct)) continue;
    out.push({ card, now, then, pct });
  }
  out.sort((a, b) => b.pct - a.pct);
  return out;
}

// Movers only change when the day does, and several surfaces ask for the same
// window on one render, so key the memo by day.
const MOVER_CACHE = new Map<string, Mover[]>();

export function movers(series: SeriesKey = "market", days = 1, minCents = 100): Mover[] {
  const key = `${series}:${days}:${minCents}:${todayIndex()}`;
  const hit = MOVER_CACHE.get(key);
  if (hit) return hit;
  const built = computeMovers(series, days, minCents);
  MOVER_CACHE.set(key, built);
  return built;
}

export interface MoverSplit {
  gainers: Mover[];
  losers: Mover[];
}

export function moverSplit(series: SeriesKey = "market", days = 1, limit = 25, minCents = 100): MoverSplit {
  const all = movers(series, days, minCents);
  return {
    gainers: all.filter((m) => m.pct > 0).slice(0, limit),
    losers: all
      .filter((m) => m.pct < 0)
      .slice(-limit)
      .reverse(),
  };
}

/** The ticker's payload: the day's largest absolute moves, gainers and losers mixed. */
export function tickerMovers(limit = 28): Mover[] {
  const all = movers("market", 1, 200);
  const top = all.slice(0, Math.ceil(limit / 2));
  const bottom = all.slice(-Math.floor(limit / 2));
  // Interleave so the bar doesn't read as a block of green followed by a block
  // of red — a real ticker mixes them.
  const mixed: Mover[] = [];
  for (let i = 0; i < Math.max(top.length, bottom.length); i++) {
    if (top[i]) mixed.push(top[i]);
    if (bottom[i]) mixed.push(bottom[i]);
  }
  return mixed;
}

/** Highest-value cards — the homepage's "Trending" tiles draw from these. */
export function topByMarket(limit = 12): RiftCard[] {
  return [...CARDS]
    .map((card) => ({ card, v: latestQuote(card).market }))
    .sort((a, b) => b.v - a.v)
    .slice(0, limit)
    .map((x) => x.card);
}

/**
 * Homepage "Trending": cards that are both valuable and moving, so the tiles show
 * something with a story rather than the same four chase cards every day.
 */
export function trendingCards(limit = 4): Mover[] {
  return movers("market", 7, 500)
    .filter((m) => Math.abs(m.pct) > 1)
    .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
    .slice(0, limit);
}
