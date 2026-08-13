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

import { cache } from "react";
import type { RiftCard } from "@/lib/catalog";

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
function riftcompareSlug(card: RiftCard): string {
  const setCode = card.baseSetCode ?? card.setCode;
  const suffix = card.kind === "promo" ? "-promo" : "";
  return (
    `${card.name} ${setCode} ${card.collectorLabel.replace(/\*/g, "s")}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") + suffix
  );
}

async function fetchJson<T>(path: string, revalidate: number): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate } });
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
  const slug = riftcompareSlug(card);
  const data = await fetchJson<RCListingsResponse>(`/card/${encodeURIComponent(slug)}/listings.json?market=${MARKET}`, 3600);
  if (!data) return null;
  return {
    currency: data.currency,
    storeCount: data.storeCount,
    hasEbay: data.hasEbay,
    listings: [...data.listings].sort((a, b) => a.delivered - b.delivered),
  };
});

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
  const slug = riftcompareSlug(card);
  // 900s, not 3600 — matches prices.json's own revalidate window (listings.json's
  // is the one that's actually 3600), so this doesn't lag behind the source.
  const data = await fetchJson<RCPricesResponse>(`/card/${encodeURIComponent(slug)}/prices.json`, 900);
  if (!data) return null;
  return {
    AU: data.prices.AU?.lowestCents ?? null,
    NZ: data.prices.NZ?.lowestCents ?? null,
    UK: data.prices.UK?.lowestCents ?? null,
    SG: data.prices.SG?.lowestCents ?? null,
    CA: data.prices.CA?.lowestCents ?? null,
  };
});
