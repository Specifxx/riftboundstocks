// The public pricing API. Pages import from here and never from a specific
// source, so the demo/live switch happens in one place.

import { CARDS, type RiftCard } from "@/lib/catalog";
import { DOMAIN_KEYS, type DomainKey } from "@/lib/riftbound";
import { syntheticSource, syntheticQuoteDaysAgo } from "./synthetic";
import { HAS_LIVE_PRICES, HISTORY_DAYS, LIVE_FETCHED_AT, liveSource, liveQuoteDaysAgo, EMPTY_QUOTE } from "./live";
import type { PriceQuote, PriceSnapshot, PriceSource, SeriesKey } from "./source";

export * from "./source";
export { HAS_LIVE_PRICES, HISTORY_DAYS, LIVE_FETCHED_AT } from "./live";
// RiftCompare supplementary data (multi-vendor comparison + regional prices) —
// NOT the headline price, see riftcompare.ts's own header comment. Re-exported
// here so pages only ever import from "@/lib/prices".
export { fetchCardListings, fetchRegionalPrices } from "./riftcompare";
export type { CardListings, StoreListing, RegionalPrices } from "./riftcompare";

/**
 * The source backing every price on the site.
 *
 * Live TCGplayer data as soon as a snapshot has been imported; the demo
 * generator only when the data files are still empty, so a fresh clone renders
 * something before the first `npm run prices:import`.
 */
export function activeSource(): PriceSource {
  return HAS_LIVE_PRICES ? liveSource : syntheticSource;
}

export function priceHistory(card: RiftCard): PriceSnapshot[] {
  return activeSource().history(card);
}

export function latestQuote(card: RiftCard): PriceQuote {
  return activeSource().latest(card);
}

export function quoteDaysAgo(card: RiftCard, daysAgo: number): PriceQuote {
  return HAS_LIVE_PRICES ? liveQuoteDaysAgo(card, daysAgo) : syntheticQuoteDaysAgo(card, daysAgo);
}

export function seriesValue(q: PriceQuote, key: SeriesKey): number | null {
  return q[key];
}

/**
 * The card's headline price.
 *
 * Normal market price, falling back to FOIL market for a printing that only
 * exists in foil — which is most Showcase and alt-art cards, and includes the
 * most valuable cards in the game. Ranking on `market` alone silently dropped
 * all of them.
 *
 * This is a DISPLAY/RANKING concept only. It is never written into the stored
 * series, so the card page still shows an honest "—" for a Normal price that
 * doesn't exist.
 */
export function primaryPrice(q: PriceQuote): number | null {
  return q.market ?? q.foilMarket;
}

/**
 * How many days of real history exist.
 *
 * There is no public TCGplayer endpoint for historical prices, so the series
 * genuinely begins at the first import — it is not backfilled. Surfaces that
 * compare two days (movers, the ticker, % change columns) have nothing to say
 * until this reaches 2, and they say so rather than inventing a baseline.
 */
export const HISTORY_LENGTH = HAS_LIVE_PRICES ? HISTORY_DAYS.length : 400;
export const HAS_CHANGE_DATA = HISTORY_LENGTH >= 2;
export const HISTORY_START: string | null = HAS_LIVE_PRICES ? (HISTORY_DAYS[0] ?? null) : null;

/** Percentage change; null when either side is missing. */
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
  /** null until at least one day of history carries a market price. */
  allTimeHigh: Extreme | null;
  allTimeLow: Extreme | null;
  foilMultiplier: number | null;
  spreadPct: number | null;
  deltas: {
    day: { regular: number | null; foil: number | null };
    week: { regular: number | null; foil: number | null };
    month: { regular: number | null; foil: number | null };
  };
  points: number;
}

export function cardStats(card: RiftCard): CardStats {
  const history = priceHistory(card);
  const latest = history.length ? history[history.length - 1] : latestQuote(card);

  // Tracked on the headline price, so a foil-only printing (which has no Normal
  // market price at all) still gets a high/low rather than a pair of dashes.
  let hi: Extreme | null = null;
  let lo: Extreme | null = null;
  for (const p of history) {
    const v = primaryPrice(p);
    if (v == null) continue;
    if (!hi || v > hi.cents) hi = { cents: v, day: p.day };
    if (!lo || v < lo.cents) lo = { cents: v, day: p.day };
  }

  const delta = (days: number) => {
    const then = quoteDaysAgo(card, days);
    return {
      regular: pctChange(latest.market, then.market),
      foil: pctChange(latest.foilMarket, then.foilMarket),
    };
  };

  const foilMult =
    latest.foilMarket != null && latest.market != null && latest.market > 0
      ? latest.foilMarket / latest.market
      : null;

  return {
    latest,
    allTimeHigh: hi,
    allTimeLow: lo,
    foilMultiplier: foilMult,
    spreadPct: latest.mid != null && latest.low != null && latest.mid > 0 ? ((latest.mid - latest.low) / latest.mid) * 100 : null,
    deltas: { day: delta(1), week: delta(7), month: delta(30) },
    // Any priced day counts — a foil-only printing has data even though its
    // Normal series is empty throughout.
    points: history.filter((p) => primaryPrice(p) != null).length,
  };
}

// ── movers ───────────────────────────────────────────────────────────────────

export interface Mover {
  card: RiftCard;
  now: number;
  then: number;
  pct: number;
}

/**
 * Cards whose price moved most over `days`.
 *
 * Returns EMPTY until two days of history exist — there is no baseline to
 * compare against, and manufacturing one is how a price site starts lying.
 * Callers check HAS_CHANGE_DATA and show a fallback instead.
 *
 * `minCents` keeps the list signal-rich: a bulk common going from $0.10 to $0.14
 * is a 40% "gain" that tells nobody anything.
 */
function computeMovers(series: SeriesKey, days: number, minCents: number): Mover[] {
  if (!HAS_CHANGE_DATA) return [];
  const out: Mover[] = [];
  for (const card of CARDS) {
    const now = seriesValue(latestQuote(card), series);
    const then = seriesValue(quoteDaysAgo(card, days), series);
    if (now == null || then == null || now < minCents) continue;
    const pct = pctChange(now, then);
    if (pct == null || !isFinite(pct) || pct === 0) continue;
    out.push({ card, now, then, pct });
  }
  out.sort((a, b) => b.pct - a.pct);
  return out;
}

const MOVER_CACHE = new Map<string, Mover[]>();

export function movers(series: SeriesKey = "market", days = 1, minCents = 100): Mover[] {
  const key = `${series}:${days}:${minCents}`;
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
    losers: all.filter((m) => m.pct < 0).slice(-limit).reverse(),
  };
}

// ── value rankings (always available, no history required) ───────────────────

export interface Ranked {
  card: RiftCard;
  cents: number;
}

/** Most valuable priced cards. Works on day one, unlike anything change-based. */
export function topByMarket(limit = 12, series?: SeriesKey): Ranked[] {
  const out: Ranked[] = [];
  for (const card of CARDS) {
    const q = latestQuote(card);
    const v = series ? seriesValue(q, series) : primaryPrice(q);
    if (v == null) continue;
    out.push({ card, cents: v });
  }
  out.sort((a, b) => b.cents - a.cents);
  return out.slice(0, limit);
}

/** Sum across every priced card. Unpriced cards are excluded, never counted as zero. */
export function totalMarketValue(cards: RiftCard[] = CARDS, series?: SeriesKey): number {
  let sum = 0;
  for (const c of cards) {
    const q = latestQuote(c);
    const v = series ? seriesValue(q, series) : primaryPrice(q);
    if (v != null) sum += v;
  }
  return sum;
}

export function pricedCount(cards: RiftCard[] = CARDS): number {
  return cards.reduce((n, c) => n + (primaryPrice(latestQuote(c)) != null ? 1 : 0), 0);
}

/**
 * The ticker's payload: the day's biggest absolute moves, gainers and losers
 * interleaved. Falls back to the most valuable cards while history is too short,
 * so the bar shows real prices rather than nothing.
 */
export function tickerMovers(limit = 28): Mover[] {
  const all = movers("market", 1, 200);
  if (all.length === 0) return [];
  const top = all.slice(0, Math.ceil(limit / 2));
  const bottom = all.slice(-Math.floor(limit / 2));
  const mixed: Mover[] = [];
  for (let i = 0; i < Math.max(top.length, bottom.length); i++) {
    if (top[i]) mixed.push(top[i]);
    if (bottom[i]) mixed.push(bottom[i]);
  }
  return mixed;
}

/** Homepage "Trending": valuable cards that are also moving. */
export function trendingCards(limit = 4): Mover[] {
  return movers("market", 7, 500)
    .filter((m) => Math.abs(m.pct) > 1)
    .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
    .slice(0, limit);
}

// ── domain heat (replaces the ticker) ────────────────────────────────────────

export interface DomainHeatEntry {
  domain: DomainKey;
  /** Average 1-day % move across priced cards in this domain. Null before HAS_CHANGE_DATA. */
  avgPct: number | null;
  /** Priced cards in this domain, not the full catalogue count. */
  cardCount: number;
  /** Sum of headline price across priced cards in this domain. */
  totalValue: number;
  /** Biggest single move in the domain today, for the tile's caption. */
  topMover: Mover | null;
}

/**
 * One row per Domain (Fury/Calm/Mind/Body/Chaos/Order — Colorless excluded,
 * it isn't a Domain a card is IN, it's the absence of one), for the homepage
 * "Domain Heat" board. Real aggregates over the same catalogue and price data
 * every other page reads — nothing here is generated for the board itself.
 *
 * `avgPct` is null until HAS_CHANGE_DATA (two days of history) — the board
 * still renders card counts and catalogue value on day one, just without a
 * heat reading, the same "real data, honestly partial" rule as the ticker it
 * replaces.
 */
export function domainHeat(): DomainHeatEntry[] {
  type Bucket = { sumPct: number; nPct: number; count: number; value: number; top: Mover | null };
  const buckets = new Map<DomainKey, Bucket>();
  for (const key of DOMAIN_KEYS) buckets.set(key, { sumPct: 0, nPct: 0, count: 0, value: 0, top: null });

  for (const card of CARDS) {
    const b = buckets.get(card.domain);
    if (!b) continue;
    const v = primaryPrice(latestQuote(card));
    if (v != null) {
      b.count++;
      b.value += v;
    }
  }

  if (HAS_CHANGE_DATA) {
    for (const m of movers("market", 1, 100)) {
      const b = buckets.get(m.card.domain);
      if (!b) continue;
      b.sumPct += m.pct;
      b.nPct++;
      if (!b.top || Math.abs(m.pct) > Math.abs(b.top.pct)) b.top = m;
    }
  }

  return DOMAIN_KEYS.filter((k) => k !== "Colorless").map((domain) => {
    const b = buckets.get(domain)!;
    return {
      domain,
      avgPct: HAS_CHANGE_DATA && b.nPct > 0 ? b.sumPct / b.nPct : null,
      cardCount: b.count,
      totalValue: b.value,
      topMover: b.top,
    };
  });
}

export { EMPTY_QUOTE };
