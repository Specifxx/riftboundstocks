// TCGplayer ingestion — ported from TCGEmpire's src/lib/tcgplayer.ts.
//
// This is the LIVE side of the pricing adapter. It is not wired into rendering:
// pages read through lib/prices/index.ts, which serves the synthetic source until
// a key is configured. Running scripts/import-prices.ts fetches the real
// catalogue and writes one PriceSnapshot row per printing per day, after which
// the Prisma-backed reader can take over.
//
// Terms: TCGplayer's pricing data is licensed, not public domain. Attribution is
// required on every surface that displays it (see PRICE_SOURCE_NOTE), the data
// may not be presented as this site's own, and bulk redistribution is not
// permitted. Get a key at https://developer.tcgplayer.com/ before enabling this.

import type { RiftCard } from "@/lib/catalog";
import type { PriceQuote } from "./source";

const SEARCH_URL = "https://mp-search-api.tcgplayer.com/v1/search/request?q=&isList=false";
const PRODUCT_LINE = "riftbound-league-of-legends-trading-card-game";
const PAGE_SIZE = 50;

export interface TcgListing {
  price: number;
  languageId: number; // 1 = English
  quantity: number;
  condition?: string;
}

export interface TcgProduct {
  productId: number;
  productName: string;
  productUrlName: string;
  setUrlName: string;
  productLineUrlName: string;
  setName: string;
  marketPrice: number | null;
  lowestPrice: number | null;
  marketPriceFoil?: number | null;
  foilOnly: boolean;
  sealed: boolean;
  customAttributes?: { number?: string };
  listings?: TcgListing[];
}

// ── card matching (verbatim port — keep in sync with TCGEmpire) ──────────────

/**
 * Strip leading zeros and lowercase any letter suffix so "001" and "1" match, and
 * mark a Signature print (a "*" in the number) with a trailing "s" so the
 * Signature and base prints of 223/221 stay distinct rather than collapsing
 * onto one card.
 */
export function numKey(seg: string): string {
  const m = seg.match(/^0*(\d+)([a-z]*)/i);
  const base = m ? m[1] + m[2].toLowerCase() : seg.toLowerCase();
  return seg.includes("*") ? `${base}s` : base;
}

/** Set code from the "/NNN" denominator — authoritative, prevents cross-set bleed. */
export function setFromTotal(total?: string): string | null {
  switch (parseInt(total ?? "", 10)) {
    case 298: return "OGN";
    case 221: return "SFD";
    case 219: return "UNL";
    case 24: return "OGS";
    default: return null;
  }
}

/**
 * Set code from a TCGplayer set name — the only set signal for printings whose
 * collector number carries no "/NNN" denominator. That is the whole rune cycle
 * ("R01".."R06"), which reuses the same numbers in every set.
 */
export function setCodeFromSetName(setName?: string): string | null {
  const s = (setName ?? "").toLowerCase();
  if (/proving\s*grounds/.test(s)) return "OGS";
  if (/spiritforged|spirit\s*forged/.test(s)) return "SFD";
  if (/unleashed/.test(s)) return "UNL";
  if (/origins/.test(s)) return "OGN";
  return null;
}

const CJK_RE = /[㐀-鿿぀-ヿ가-힯]/;

/**
 * A non-English printing. It shares our collector numbers but is a different
 * product, so it must never be priced as our card.
 */
export function isNonEnglishProduct(p: TcgProduct): boolean {
  const s = `${p.productName ?? ""} ${p.setName ?? ""}`;
  return CJK_RE.test(s) || /\b(chinese|simplified|traditional|japanese|korean)\b/i.test(s);
}

/** Cheapest in-stock English Near-Mint listing, or null. */
export function englishNmLowest(p: TcgProduct): number | null {
  const ls = (p.listings ?? []).filter(
    (l) => l.languageId === 1 && (l.quantity ?? 0) > 0 && /near mint/i.test(l.condition ?? ""),
  );
  return ls.length ? Math.min(...ls.map((l) => l.price)) : null;
}

/** Cheapest in-stock English listing of any condition. */
export function englishAnyLowest(p: TcgProduct): number | null {
  const ls = (p.listings ?? []).filter((l) => l.languageId === 1 && (l.quantity ?? 0) > 0);
  return ls.length ? Math.min(...ls.map((l) => l.price)) : null;
}

export function tcgProductUrl(p: TcgProduct): string {
  const slug = `${p.productLineUrlName ?? PRODUCT_LINE}-${p.setUrlName ?? ""}-${p.productUrlName ?? ""}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `https://www.tcgplayer.com/product/${p.productId}/${slug}`;
}

/** Search-by-name fallback link, used when a card has no matched product id. */
export function tcgSearchUrl(cardName: string): string {
  return `https://www.tcgplayer.com/search/riftbound-league-of-legends-trading-card-game/product?q=${encodeURIComponent(cardName)}`;
}

// ── fetching ─────────────────────────────────────────────────────────────────

function searchBody(from: number) {
  return {
    algorithm: "sales_synonym_v2",
    from,
    size: PAGE_SIZE,
    filters: { term: { productLineName: [PRODUCT_LINE] }, range: {}, match: {} },
    listingSearch: {
      context: { cart: {} },
      // English-only preview, so the lowest price we read can't be a
      // foreign-language copy listed under the English product.
      filters: {
        term: { sellerStatus: "Live", channelId: 0, language: ["English"] },
        range: { quantity: { gte: 1 } },
        exclude: { channelExclusion: 0 },
      },
    },
    context: { cart: {}, shippingCountry: "US", userProfile: {} },
    settings: { useFuzzySearch: true, didYouMean: {} },
    sort: {},
  };
}

async function fetchPage(from: number): Promise<{ items: TcgProduct[]; total: number }> {
  const res = await fetch(SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: "https://www.tcgplayer.com",
      Referer: "https://www.tcgplayer.com/",
      "User-Agent": "RiftboundStocks/0.1 (+https://riftboundstocks.com)",
    },
    body: JSON.stringify(searchBody(from)),
  });
  if (!res.ok) throw new Error(`TCGplayer search ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { results?: Array<{ results?: TcgProduct[]; totalResults?: number }> };
  const r = data?.results?.[0];
  return { items: r?.results ?? [], total: r?.totalResults ?? 0 };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Every Riftbound single (paginated, sealed products excluded). */
export async function fetchTcgplayerProducts(): Promise<TcgProduct[]> {
  const first = await fetchPage(0);
  const out: TcgProduct[] = [...first.items];
  for (let from = PAGE_SIZE; from < first.total; from += PAGE_SIZE) {
    // Deliberate pacing — this is an unmetered public endpoint and hammering it
    // is both rude and the fastest way to get blocked.
    await sleep(250);
    try {
      const pg = await fetchPage(from);
      if (pg.items.length === 0) break;
      out.push(...pg.items);
    } catch (e) {
      console.warn(`TCGplayer page from=${from} failed:`, (e as Error).message);
      break;
    }
  }
  return out.filter((p) => !p.sealed);
}

/** Key a card the same way a TCGplayer product is keyed, so the two can be joined. */
function cardKey(setCode: string, collectorNumber: number): string {
  return `${setCode}:${numKey(String(collectorNumber))}`;
}

function productKey(p: TcgProduct): string | null {
  const num = p.customAttributes?.number;
  if (!num) return null;
  const [seg, total] = num.split("/");
  const setCode = setFromTotal(total) ?? setCodeFromSetName(p.setName);
  if (!setCode) return null;
  return `${setCode}:${numKey(seg)}`;
}

const toCents = (v: number | null | undefined) => (v == null ? null : Math.round(v * 100));

export interface TcgMatch {
  quote: PriceQuote;
  productId: number;
  url: string;
}

/**
 * Join the live TCGplayer catalogue onto our cards.
 *
 * Returns one quote per matched card. Cards with no match are absent from the map
 * — callers keep whatever they had rather than writing a zero, because a missing
 * product is "we didn't find it", not "it's worthless".
 */
export async function fetchTcgplayerQuotes(cards: RiftCard[]): Promise<Map<string, TcgMatch>> {
  const products = await fetchTcgplayerProducts();
  const byKey = new Map<string, TcgProduct>();

  for (const p of products) {
    if (isNonEnglishProduct(p)) continue;
    const key = productKey(p);
    if (!key) continue;
    const existing = byKey.get(key);
    // When an English and a non-English print share a number, keep the higher
    // market price — that is the English one (TCGEmpire's rule).
    if (!existing || (p.marketPrice ?? 0) > (existing.marketPrice ?? 0)) byKey.set(key, p);
  }

  const out = new Map<string, TcgMatch>();
  for (const card of cards) {
    const p = byKey.get(cardKey(card.setCode, card.collectorNumber));
    if (!p) continue;
    const market = toCents(p.marketPrice);
    if (market == null) continue;
    const low = toCents(englishNmLowest(p) ?? englishAnyLowest(p) ?? p.lowestPrice) ?? market;
    out.set(card.id, {
      quote: {
        low,
        // TCGplayer's search payload carries no separate "mid"; approximate it
        // from the two figures we do get rather than inventing a third number.
        mid: Math.round((market + Math.max(market, low)) / 2),
        market,
        foil: null,
        foilMarket: toCents(p.marketPriceFoil),
      },
      productId: p.productId,
      url: tcgProductUrl(p),
    });
  }
  return out;
}
