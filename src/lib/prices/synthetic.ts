// ─────────────────────────────────────────────────────────────────────────────
// DEMO PRICE DATA — NOT REAL MARKET PRICES.
// ─────────────────────────────────────────────────────────────────────────────
// Every number this file produces is generated. `npm run prices:import` has
// never populated src/data/prices.json in this build, so rather than ship
// empty charts the site renders a plausible synthetic market. Nothing here is
// a real valuation, and every surface that prints one of these figures
// carries the demo disclaimer (see PRICES_ARE_DEMO in lib/site.ts and the
// DemoPricesNotice component).
//
// Swap it for real data by running `npm run prices:import` (needs no
// credentials — see ./tcgplayer.ts) — see activeSource() in ./index.ts.
//
// CLOSED FORM, NOT A RANDOM WALK. Price on a day is a direct function of
// (card id, day index) rather than the accumulation of every day before it. That
// is what makes the movers tables and the ticker affordable: they need two days
// for each of 950 cards, and a cumulative walk would have to generate all ~400
// days of all 950 cards (~380k points) to answer "what changed since yesterday".
// Here it is two evaluations per card. The card page's chart pays 400 of the same
// O(1) evaluations, which is nothing.

import type { RiftCard } from "@/lib/catalog";
import { RARITIES, SET_BY_CODE } from "@/lib/riftbound";
import type { PriceQuote, PriceSnapshot, PriceSource } from "./source";

const DAY_MS = 86_400_000;
/** Chart window: ~13 months, enough for a "since last year" read. */
const MAX_DAYS = 400;
/** How long a spike keeps decaying. Bounds the event loop below to a fixed cost. */
const EVENT_TAIL = 16;

// ── deterministic noise ──────────────────────────────────────────────────────

function hash(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** Uniform [0,1) from a seed — mulberry32's mixing step, used one-shot. */
function rand(seed: number): number {
  let t = (seed + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), 1 | t);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function noise(seed: number, dayIndex: number, salt: number): number {
  return rand(seed ^ Math.imul(dayIndex + 1, 2654435761) ^ Math.imul(salt, 40503));
}

// ── per-card constants ───────────────────────────────────────────────────────

interface Profile {
  seed: number;
  anchor: number;
  drift: number;
  jitter: number;
  foilMult: number;
  hasFoil: boolean;
  originIndex: number;
  /** Phases + amplitudes for the three oscillation scales. */
  p1: number; p2: number; p3: number;
  a1: number; a2: number; a3: number;
}

const PROFILES = new Map<string, Profile>();

function profile(card: RiftCard): Profile {
  const cached = PROFILES.get(card.id);
  if (cached) return cached;

  const seed = hash(card.id);
  const weight = RARITIES[card.rarity].weight;

  // Heavy right tail: r³ keeps most cards near their tier floor and lets a few
  // run, which is how a real set's price distribution looks.
  const r = rand(seed ^ 0x9e3779b9);
  const spread = 0.45 + Math.pow(r, 3) * 7.5;
  const typeBump = card.type === "Legend" ? 1.7 : card.type === "Battlefield" ? 1.25 : 1;

  const release = SET_BY_CODE[card.setCode]?.releasedOn;
  const originIndex = release
    ? Math.floor(Date.parse(`${release}T00:00:00Z`) / DAY_MS)
    : Math.floor(Date.now() / DAY_MS) - MAX_DAYS;

  const built: Profile = {
    seed,
    anchor: Math.max(9, Math.round(weight * spread * typeBump * 42)),
    // Per-day log drift: some cards climb over the window, some bleed out.
    drift: (rand(seed ^ 0x1b873593) - 0.45) * 0.0022,
    jitter: 0.012 + rand(seed ^ 0x27d4eb2f) * 0.05,
    // Foil premium — wider on scarcer cards, as real foil markets are.
    foilMult: 1.8 + rand(seed ^ 0x51ed2701) * 2.4 + Math.min(2.4, weight / 12),
    // Runes are printed in every set at high volume; no foil treatment here.
    hasFoil: card.type !== "Rune",
    originIndex,
    p1: rand(seed ^ 0xa1), p2: rand(seed ^ 0xb2), p3: rand(seed ^ 0xc3),
    a1: 0.10 + rand(seed ^ 0xd4) * 0.20,
    a2: 0.05 + rand(seed ^ 0xe5) * 0.12,
    a3: 0.02 + rand(seed ^ 0xf6) * 0.06,
  };

  PROFILES.set(card.id, built);
  return built;
}

// ── the price function ───────────────────────────────────────────────────────

const TAU = Math.PI * 2;

/**
 * Market price in cents for one card on one UTC day.
 *
 * Three oscillation scales (a quarter, a month, a fortnight) give the line an
 * organic shape at every zoom level; a small per-day jitter stops it looking
 * drawn with a compass; and decaying event spikes give the movers tables real
 * things to report.
 */
function marketAt(p: Profile, dayIndex: number): number {
  const t = dayIndex - p.originIndex;

  const trend = Math.exp(p.drift * t);
  const wave =
    1 +
    p.a1 * Math.sin(TAU * (t / 91 + p.p1)) +
    p.a2 * Math.sin(TAU * (t / 37 + p.p2)) +
    p.a3 * Math.sin(TAU * (t / 11 + p.p3));

  const jitter = 1 + (noise(p.seed, dayIndex, 1) - 0.5) * p.jitter;

  // Spikes: ~1.5% of days start one, and it decays over EVENT_TAIL days. Summing
  // a bounded window keeps this O(1) while still letting yesterday's news show
  // up in today's price.
  let event = 0;
  for (let k = 0; k < EVENT_TAIL; k++) {
    const d = dayIndex - k;
    if (noise(p.seed, d, 2) < 0.015) {
      const size = (noise(p.seed, d, 3) - 0.4) * 0.5;
      event += size * Math.exp(-k / 5);
    }
  }

  return Math.max(9, Math.round(p.anchor * trend * wave * jitter * (1 + event)));
}

/** Derive the full quote for a day from that day's market price. */
function quoteAt(p: Profile, dayIndex: number): PriceQuote {
  const m = marketAt(p, dayIndex);

  // Low sits under market (the cheapest listed copy) and Mid above it (the mean
  // of asking prices, dragged up by optimistic sellers) — the ordering TCGplayer
  // itself shows. Per-day jitter keeps the three lines from running parallel.
  const low = Math.max(5, Math.round(m * (0.80 + noise(p.seed, dayIndex, 4) * 0.11)));
  const mid = Math.round(m * (1.03 + noise(p.seed, dayIndex, 5) * 0.14));

  const foilMarket = p.hasFoil
    ? Math.round(m * p.foilMult * (0.92 + noise(p.seed, dayIndex, 6) * 0.18))
    : null;
  // Average foil sits above foil market for the same reason mid sits above
  // market: it is an average of asks, not of sales.
  const foil =
    foilMarket == null ? null : Math.max(9, Math.round(foilMarket * (1.05 + noise(p.seed, dayIndex, 7) * 0.2)));

  return { low, mid, market: m, foil, foilMarket };
}

function dayString(dayIndex: number): string {
  return new Date(dayIndex * DAY_MS).toISOString().slice(0, 10);
}

export function todayIndex(): number {
  return Math.floor(Date.now() / DAY_MS);
}

export const syntheticSource: PriceSource = {
  id: "demo",
  label: "Demo market (generated)",
  isLive: false,

  history(card: RiftCard): PriceSnapshot[] {
    const p = profile(card);
    const end = todayIndex();
    // A card can't trade before its set is out.
    const start = Math.max(p.originIndex, end - MAX_DAYS);
    const out: PriceSnapshot[] = [];
    for (let d = start; d <= end; d++) out.push({ day: dayString(d), ...quoteAt(p, d) });
    return out;
  },

  latest(card: RiftCard): PriceQuote {
    return quoteAt(profile(card), todayIndex());
  },
};

/**
 * The quote N days back — the cheap path the movers tables and the ticker use.
 * Never generates a series.
 */
export function syntheticQuoteDaysAgo(card: RiftCard, daysAgo: number): PriceQuote {
  const p = profile(card);
  const d = Math.max(p.originIndex, todayIndex() - daysAgo);
  return quoteAt(p, d);
}
