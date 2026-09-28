// RiftCompare supplementary data — NOT the headline price (that's real
// TCGplayer data now, see ./live.ts and ./index.ts's activeSource()). This
// file backs two additions layered onto the card page:
//   - the full multi-vendor store comparison (every store RiftCompare tracks,
//     ranked by total delivered cost);
//   - real per-market prices for the "shopping outside the US" cross-link
//     (upgraded from a bare search link to actual AU/NZ/UK/SG/CA numbers).
//
// Reads RiftCompare's public, read-only data API over plain HTTPS — no API
// key, CORS-open by design. See DATA_INTEGRATION.md for the full contract,
// including the join-key story below.

import * as React from "react";
import type { RiftCard } from "@/lib/catalog";
import { championOf } from "@/lib/champions";

// React's `cache()` is only wired up under Next's own module resolution (it
// aliases "react" to a build that exports it for Server Components); a bare
// `import { cache } from "react"` throws "is not a function" the moment this
// module loads outside Next — which every tsx-run script under scripts/
// does, since lib/prices/index.ts re-exports from this file. Feature-detect
// instead of hard-importing: identical de-duping inside the Next app, and a
// same-shape passthrough (no request memoisation, which no script here needs)
// when run standalone.
const cache: <T extends (...args: never[]) => unknown>(fn: T) => T =
  typeof (React as { cache?: unknown }).cache === "function" ? (React as unknown as { cache: typeof cache }).cache : (fn) => fn;

const API_BASE = (process.env.RIFTCOMPARE_API_URL || "https://riftcompare.com/api/v1").replace(/\/$/, "");
const MARKET = "US"; // this site is USD-only; see DATA_INTEGRATION.md's currency section.

// JOIN KEY: RiftCompare's own URL slug (e.g. "vayne-hunter-sfd-223s-221"),
// RECONSTRUCTED from this card's own fields — not RiftCompare's `externalId`
// field, and not this card's own `.id`/`.slug`. Verified empirically (curling
// riftcompare.com directly, ~90 real cards across several passes) before
// relying on it, and again after each fix below to confirm the fix actually
// moved the hit rate rather than assuming it did. `externalId` is sparse in
// practice (0/9 resolved by it). The slug below hits ~90% of base/alt-art
// prints and apostrophed names (the bulk of the catalogue) and ~50-65% of
// signature/promo prints — lower there, but confirmed to be RiftCompare's own
// catalogue coverage (their base print of the same card 404s too, not just
// the variant), not this formula: exotic subtypes (Prize Wall metal promos,
// split token cards, and OGN/UNL's high-numbered signature range
// specifically) come back genuinely untracked on their end. Either way a miss
// 404s cleanly into the null-return path below — worth knowing the shape of
// the gap, not worth chasing further.
//
// The formula is a byte-for-byte port of RiftCompare's own cardSlug()
// (TCGEmpire's src/lib/card-url.ts): name + setCode + collectorNumber,
// lowercased, "*" -> "s", every run of non-alphanumerics collapsed to one
// "-", "-promo" appended for promo printings. Two details that are easy to
// get wrong and were caught by curling rather than assumed:
//   - No apostrophe pre-strip. "Kai'Sa" must collapse to "kai-sa" (the
//     apostrophe becomes its own "-", same as a space would) — stripping it
//     first gives "kaisa" instead and silently mismatches all 58 apostrophed
//     names in the catalogue (confirmed: pre-stripping 404s, not pre-stripping
//     200s).
//   - Promo printings use their ORIGINAL set's code, not the promo program's
//     own "OPP"/"PR" code — e.g. a Worlds promo of an Origins card slugs under
//     "ogn", not "opp" — plus a "-promo" suffix. Confirmed against 6 promo
//     cards: the OPP-coded slug 404s every time, the base-set-coded
//     "...-promo" slug 200s every time. `RiftCard.baseSetCode`'s doc comment
//     in lib/catalog.ts already carries exactly this value for promo-kind
//     cards and is undefined for everything else, so `?? card.setCode` is a
//     no-op there.
export function riftcompareSlug(card: RiftCard): string {
  return rcSlug(card.name, card.baseSetCode ?? card.setCode, card.collectorLabel, card.kind === "promo");
}

function rcSlug(name: string, setCode: string, label: string, promo: boolean): string {
  return (
    `${name} ${setCode} ${label.replace(/\*/g, "s")}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") + (promo ? "-promo" : "")
  );
}

/**
 * Every slug RiftCompare might file this printing under, best guess first.
 *
 * `riftcompareSlug` is right for most cards, but measured against
 * RiftCompare's own card sitemap it misses whole classes where the two
 * catalogues name or number a printing differently:
 *   - Legends: RiftCompare puts the champion first ("kai-sa-daughter-of-the-
 *     void-ogn-299s-298"); this catalogue names them by title alone.
 *   - Proving Grounds: RiftCompare pads the denominator ("019/024").
 *   - Metal promos: RiftCompare has one "-promo" page per card; this catalogue
 *     keeps the tier in the name ("… (Metal) (Prize Wall)").
 *   - Vendetta numbers drop the set total ("…-ven-189"); special printings
 *     (SP1…) have no number at all; alt-art promos are base-set cards.
 * Same set, same number, same card in every case — only the spelling differs.
 */
export interface SlugCandidate {
  slug: string;
  /**
   * How much the spelling was changed to produce it. 0 = exact; 1 = renamed
   * (champion prefix, promo tier dropped); 2 = renumbered (padded or dropped
   * set total, unnumbered special); 3 = promo filed as a base-set card. A
   * lower tier must always win a contested slug.
   *
   * Deliberately NOT generated: guessing that an overnumbered printing is
   * RiftCompare's Signature ("307" → "307s"). Measured against RiftCompare's
   * catalogue, 8 of the 9 slugs it matched belonged to a DIFFERENT printing
   * (RiftCompare lists both 307 and 307*), so it linked the wrong card.
   */
  tier: number;
}

export function riftcompareSlugCandidates(card: RiftCard, champion?: string | null): SlugCandidate[] {
  const setCode = card.baseSetCode ?? card.setCode;
  const promo = card.kind === "promo";
  const untiered = card.name.replace(/\s*\([^)]*\)/g, "").trim();

  const names = [card.name];
  if (untiered !== card.name) names.push(untiered);
  if (card.type === "Legend" && champion && !card.name.includes(",") && !card.name.startsWith(`${champion} -`)) {
    names.push(`${champion} ${untiered}`);
    // RiftCompare is dropping the " - Starter" label from Proving Grounds
    // Legends (its DECISIONS.md, 2026-09-27), so cover the renamed spelling too.
    const unlabelled = untiered.replace(/\s+-\s+Starter$/i, "");
    if (unlabelled !== untiered) names.push(`${champion} ${unlabelled}`);
  }

  const renumbered: string[] = [];
  const m = card.collectorLabel.match(/^([^/]+)\/(\d+)$/);
  if (m) {
    const [, num, total] = m;
    if (total.length < 3) renumbered.push(`${num}/${total.padStart(3, "0")}`);
    // Vendetta is numbered without its set total over there ("…-ven-189").
    renumbered.push(num);
  }
  // Special printings (SP1…) carry no number at all over there.
  if (card.kind === "special") renumbered.push("");

  const out: SlugCandidate[] = [];
  const add = (slug: string, tier: number) => {
    if (!out.some((c) => c.slug === slug)) out.push({ slug, tier });
  };
  add(rcSlug(card.name, setCode, card.collectorLabel, promo), 0);
  for (const n of names.slice(1)) add(rcSlug(n, setCode, card.collectorLabel, promo), 1);
  for (const n of names) for (const l of renumbered) add(rcSlug(n, setCode, l, promo), 2);
  // Alt-art promos ("Teemo - Swift Scout (Alternate Art)", PR 263a/298) are
  // ordinary base-set printings there: "teemo-swift-scout-ogn-263a-298".
  if (promo) for (const l of [card.collectorLabel, ...renumbered]) add(rcSlug(untiered, setCode, l, false), 3);
  return out.sort((x, y) => x.tier - y.tier);
}

/**
 * Try the card's likeliest RiftCompare slugs in order until one answers. Most
 * cards hit on the first; Legends (champion-prefixed over there) on the
 * second, Vendetta Legends (champion-prefixed AND no set total) on the fourth.
 * Capped at four so a card RiftCompare doesn't carry costs a bounded number of
 * cached 404s.
 */
async function fetchForCard<T>(card: RiftCard, path: (slug: string) => string, revalidate: number): Promise<T | null> {
  for (const { slug } of riftcompareSlugCandidates(card, championOf(card)?.name).slice(0, 4)) {
    const data = await fetchJson<T>(path(encodeURIComponent(slug)), revalidate);
    if (data) return data;
  }
  return null;
}

async function fetchJson<T>(path: string, revalidate: number): Promise<T | null> {
  try {
    // Bounded: this runs inside the card page and homepage render, so a SLOW
    // RiftCompare (not a down one — that fails fast) would otherwise hold the
    // whole page, and on-demand card pages would hit the function timeout.
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate }, signal: AbortSignal.timeout(2500) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export interface StoreListing {
  id: string;
  retailer: string;
  retailerName: string;
  priceCents: number;
  /** null = unknown / shown "at checkout" by the store, not $0. */
  ship: number | null;
  delivered: number;
  condition: string | null;
  isFoil: boolean;
  inStock: boolean;
  /** Already affiliate-tagged by RiftCompare where applicable. */
  buyHref: string;
  policyUrl: string | null;
}

export interface CardListings {
  currency: string;
  storeCount: number;
  hasEbay: boolean;
  /** Ranked by total delivered cost (item + shipping), in-stock only. */
  listings: StoreListing[];
}

interface RCListingsResponse {
  currency: string;
  storeCount: number;
  hasEbay: boolean;
  listings: StoreListing[];
}

/** The full per-store comparison grid for one card, US market. null on any
 * fetch failure (network, 404, RiftCompare down, or no match for this card) —
 * callers render the existing TCGplayer section either way rather than
 * blocking on this. */
export const fetchCardListings = cache(async (card: RiftCard): Promise<CardListings | null> => {
  const data = await fetchForCard<RCListingsResponse>(card, (slug) => `/card/${slug}/listings.json?market=${MARKET}`, 3600);
  if (!data) return null;
  return {
    currency: data.currency,
    storeCount: data.storeCount,
    hasEbay: data.hasEbay,
    listings: [...data.listings].sort((a, b) => a.delivered - b.delivered),
  };
});

/**
 * Cheapest eBay listing price from an already-fetched listings grid, in cents —
 * null when RiftCompare has no listings for this printing, or none of the ones
 * it does have are from eBay.
 *
 * Deliberately reads the SAME grid `fetchCardListings` already fetches rather
 * than a dedicated eBay lookup: RiftCompare refreshes eBay on its own schedule
 * against its own quota and this just reads the cached result back over the
 * public API, so showing an eBay price here never spends an eBay API call.
 * `listings` is already sorted by delivered cost ascending (see
 * `fetchCardListings`), so the first eBay match is the cheapest one.
 */
export function cheapestEbayCents(data: CardListings | null): number | null {
  if (!data) return null;
  return data.listings.find((l) => l.retailer.startsWith("ebay"))?.priceCents ?? null;
}

export interface RegionalPrices {
  AU: number | null;
  NZ: number | null;
  UK: number | null;
  SG: number | null;
  CA: number | null;
}

interface RCPricesResponse {
  prices: Record<"AU" | "NZ" | "US" | "UK" | "SG" | "CA", { lowestCents: number | null; currency: string }>;
}

/** Lowest live price in each of RiftCompare's non-US markets, for the
 * "shopping outside the US" links. null on fetch failure or no match. */
export const fetchRegionalPrices = cache(async (card: RiftCard): Promise<RegionalPrices | null> => {
  // 900s, not 3600 — matches prices.json's own revalidate window (listings.json's
  // is the one that's actually 3600), so this doesn't lag behind the source.
  const data = await fetchForCard<RCPricesResponse>(card, (slug) => `/card/${slug}/prices.json`, 900);
  if (!data) return null;
  return {
    AU: data.prices.AU?.lowestCents ?? null,
    NZ: data.prices.NZ?.lowestCents ?? null,
    UK: data.prices.UK?.lowestCents ?? null,
    SG: data.prices.SG?.lowestCents ?? null,
    CA: data.prices.CA?.lowestCents ?? null,
  };
});
