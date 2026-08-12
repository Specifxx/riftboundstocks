// TCGplayer ingestion — the real one.
//
// Two endpoints, because neither alone is enough:
//
//   1. mp-search-api  …/search/request      the catalogue. One paged sweep gives
//      every Riftbound product with its setCode, collector number, rarity, rules
//      text and lowest active listing. ~31 requests for the whole game.
//   2. mpapi          …/product/{id}/pricepoints   the prices. Market and Listed
//      Median PER PRINTING (Normal and Foil separately). The search payload
//      carries only ONE marketPrice — measured against pricepoints it is the
//      Normal one — so foil prices are invisible without this call. One request
//      per card, which is why the importer is a cron job and not a page load.
//
// Matching is on setCode + collector number. TCGEmpire has to infer the set from
// the "/NNN" denominator because its importer works from a different payload;
// this one carries `setCode` outright, so that inference is unnecessary here.
// Verified: 950/950 catalogue cards matched, 4 ambiguous keys in the whole
// product line and all four are tokens we don't carry.
//
// TERMS: TCGplayer's pricing data is licensed, not public domain. Attribution is
// required wherever it is displayed (PRICE_SOURCE_NOTE), it may not be presented
// as your own, and bulk redistribution is not permitted. These are the endpoints
// tcgplayer.com itself calls; they are unmetered and uncredentialed, so the
// pacing below is a courtesy that keeps this sustainable. Move to the official
// API (developer.tcgplayer.com) before running at higher frequency.

import type { RiftCard } from "@/lib/catalog";

const SEARCH_URL = "https://mp-search-api.tcgplayer.com/v1/search/request?q=&isList=false";
const PRICEPOINTS_URL = (productId: number) => `https://mpapi.tcgplayer.com/v2/product/${productId}/pricepoints`;
const PRODUCT_LINE = "riftbound-league-of-legends-trading-card-game";
const PAGE_SIZE = 50;

const HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  Origin: "https://www.tcgplayer.com",
  Referer: "https://www.tcgplayer.com/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── types ────────────────────────────────────────────────────────────────────

export interface TcgProduct {
  productId: number;
  productName: string;
  productUrlName: string;
  setUrlName: string;
  productLineUrlName: string;
  setName: string;
  setCode: string;
  rarityName: string | null;
  marketPrice: number | null;
  medianPrice: number | null;
  lowestPrice: number | null;
  totalListings: number;
  sealed: boolean;
  customAttributes?: {
    number?: string;
    description?: string | null;
    flavorText?: string | null;
    domain?: string | null;
    cardType?: string[] | null;
    energyCost?: string | null;
    might?: string | null;
    powerCost?: string | null;
    releaseDate?: string | null;
  };
}

export interface PricePoint {
  printingType: "Normal" | "Foil";
  marketPrice: number | null;
  listedMedianPrice: number | null;
  buylistMarketPrice: number | null;
}

/** All five series for one printing, in integer USD cents. */
export interface TcgQuote {
  low: number | null;
  mid: number | null;
  market: number | null;
  foil: number | null;
  foilMarket: number | null;
}

export interface TcgCardData {
  productId: number;
  url: string;
  quote: TcgQuote;
  /** TCGplayer's own rarity string, for cross-checking the catalogue. */
  rarity: string | null;
  /** Real rules text, tags stripped. Never invented — absent stays absent. */
  description: string | null;
  flavorText: string | null;
  totalListings: number;
}

// ── matching ─────────────────────────────────────────────────────────────────

/**
 * Normalise a collector-number segment: drop leading zeros, lowercase any letter
 * suffix, and mark a Signature print ("*") with a trailing "s". Same rule as
 * TCGEmpire's numKey, so a printing keys identically in both projects.
 *   "007a" → "7a"   "299*" → "299s"   "045" → "45"   "R04a" → "r04a"
 */
export function numKey(seg: string): string {
  // Trim first: a double-faced number splits as "T02 // T05" → "T02 " with a
  // trailing space, and the regex below can't strip it because it never matches
  // a leading letter.
  seg = seg.trim();
  const m = seg.match(/^0*(\d+)([a-z]*)/i);
  const base = m ? m[1] + m[2].toLowerCase() : seg.toLowerCase();
  return seg.includes("*") ? `${base}s` : base;
}

/**
 * Base set from a collector number's "/NNN" denominator.
 *
 * Only needed for PROMOS. A promo's own setCode says how it was distributed
 * (OPP, JDG…), not which set the card belongs to — an OPP card numbered 013/298
 * is an Origins card. The denominator is what places it, and what lets it borrow
 * the base card's art.
 *
 * Extends TCGEmpire's table (lib/tcgplayer.ts) with 166, 003 (Secret Garden) and
 * 006 (Vendetta's SP specials), which it lacks.
 */
export function setFromTotal(total?: string): string | null {
  switch (parseInt(total ?? "", 10)) {
    case 298: return "OGN";
    case 221: return "SFD";
    case 219: return "UNL";
    case 166: return "VEN";
    case 24: return "OGS";
    case 3: return "SGN";
    case 6: return "VEN";
    default: return null;
  }
}

/** Key a TCGplayer product. null ⇒ not a single (sealed products carry no number). */
export function productKey(p: TcgProduct): string | null {
  const num = p.customAttributes?.number;
  // The `sealed` flag is FALSE on sealed products in this payload — Booster
  // Displays, Champion Decks and Pre-Rift Kits all come through as sealed:false.
  // A missing collector number is the only reliable way to exclude them.
  if (!num || !p.setCode) return null;
  return `${p.setCode}:${numKey(num.split("/")[0])}`;
}

export function cardKey(card: RiftCard): string {
  return `${card.setCode}:${numKey(card.numberToken)}`;
}

/**
 * Loose name comparison, used only to CHECK a number match — never to make one.
 *
 * TCGplayer writes the same card differently: "Darius - Trifarian (Alternate
 * Art)" against our "Darius, Trifarian". Normalising away punctuation and the
 * treatment suffix makes the two comparable, so a number match that lands on a
 * completely different card can be caught and dropped instead of silently
 * publishing the wrong price.
 */
export function normaliseName(s: string): string {
  return s
    .toLowerCase()
    // Double-faced products are named "Front // Back"; only the front is the card.
    .split("//")[0]
    // Every parenthetical here is a treatment or a disambiguator, never part of
    // the card's identity: "(Alternate Art)", "(Signature)", "(Overnumbered)",
    // and TCGplayer's numeric tie-breakers like "Recruit (271)" against our
    // "Recruit (DE)".
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]/g, "")
    // Treatment words that one catalogue appends as plain text and the other as
    // a parenthetical: our "Dark Child - Starter" against their "Annie - Dark
    // Child (Starter)".
    .replace(/(starter|promo|signature|overnumbered|alternateart|fullart)$/, "");
}

/**
 * Do these two names plausibly describe the same card?
 *
 * Containment, not equality, because the two catalogues name Legends
 * differently: RiftScribe stores the title ("Daughter of the Void") while
 * TCGplayer prefixes the champion ("Kai'Sa - Daughter of the Void"). Requiring
 * equality rejected 146 correct matches, most of them the most valuable cards
 * in the game.
 *
 * This only ever VETOES a match already made on set + collector number, so
 * loose containment is safe — the candidate pool is a single printing. The
 * 4-character floor stops a stub like "Buff" agreeing with everything.
 */
export function namesAgree(ours: string, theirs: string): boolean {
  const a = normaliseName(ours);
  const b = normaliseName(theirs);
  if (!a || !b) return false;
  if (a === b) return true;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  return short.length >= 4 && long.includes(short);
}

// ── HTML → text ──────────────────────────────────────────────────────────────

/**
 * TCGplayer returns rules text as HTML fragments. Rather than sanitise and
 * render it, strip to plain text with newlines — the card page displays it as
 * text, so there is no markup to preserve and nothing that can inject.
 */
export function htmlToText(html: string | null | undefined): string | null {
  if (!html) return null;
  const text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text || null;
}

// ── fetching ─────────────────────────────────────────────────────────────────

function searchBody(from: number, productTypeName?: string[]) {
  // TCGplayer will split cards from sealed server-side, which beats every
  // client-side heuristic: the `sealed` boolean is false on all 1,533 products,
  // and "no collector number" quietly misfiles two real promo cards as boxes.
  const term: Record<string, string[]> = { productLineName: [PRODUCT_LINE] };
  if (productTypeName) term.productTypeName = productTypeName;
  return {
    algorithm: "sales_synonym_v2",
    from,
    size: PAGE_SIZE,
    filters: { term, range: {}, match: {} },
    listingSearch: {
      context: { cart: {} },
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

async function fetchSearchPage(from: number, productTypeName?: string[]): Promise<{ items: TcgProduct[]; total: number }> {
  const res = await fetch(SEARCH_URL, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(searchBody(from, productTypeName)),
  });
  if (!res.ok) throw new Error(`TCGplayer search ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { results?: Array<{ results?: TcgProduct[]; totalResults?: number }> };
  const r = data?.results?.[0];
  return { items: r?.results ?? [], total: r?.totalResults ?? 0 };
}

/** Every product of a given type, paged. Omit the type for the whole line. */
export async function fetchTcgplayerProducts(
  log: (s: string) => void = console.log,
  productTypeName?: string[],
): Promise<TcgProduct[]> {
  const first = await fetchSearchPage(0, productTypeName);
  const out: TcgProduct[] = [...first.items];
  for (let from = PAGE_SIZE; from < first.total; from += PAGE_SIZE) {
    await sleep(200);
    const pg = await fetchSearchPage(from, productTypeName);
    if (pg.items.length === 0) break;
    out.push(...pg.items);
  }
  log(`  ${productTypeName?.[0] ?? "all"}: ${out.length}/${first.total} products`);
  return out;
}

export const fetchTcgplayerCards = (log?: (s: string) => void) => fetchTcgplayerProducts(log, ["Cards"]);
export const fetchTcgplayerSealed = (log?: (s: string) => void) => fetchTcgplayerProducts(log, ["Sealed Products"]);

/**
 * Per-printing prices for one product. Retries, because there is no fallback:
 * a miss here means the card goes unpriced for the day rather than being priced
 * from a figure whose printing we can't identify.
 */
export async function fetchPricePoints(productId: number, attempts = 3): Promise<PricePoint[] | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(PRICEPOINTS_URL(productId), { headers: HEADERS });
      if (res.ok) return (await res.json()) as PricePoint[];
      // 429/5xx are worth waiting out; a 404 never becomes a 200.
      if (res.status === 404) return null;
    } catch {
      // network blip — fall through to the backoff
    }
    if (i < attempts - 1) await sleep(400 * (i + 1));
  }
  return null;
}

export function tcgProductUrl(p: Pick<TcgProduct, "productId" | "productLineUrlName" | "setUrlName" | "productUrlName">): string {
  const slug = `${p.productLineUrlName ?? PRODUCT_LINE}-${p.setUrlName ?? ""}-${p.productUrlName ?? ""}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `https://www.tcgplayer.com/product/${p.productId}/${slug}`;
}

/** Search-by-name link, for a card with no matched product. */
export function tcgSearchUrl(cardName: string): string {
  return `https://www.tcgplayer.com/search/${PRODUCT_LINE}/product?q=${encodeURIComponent(cardName)}`;
}

const toCents = (v: number | null | undefined): number | null =>
  v == null || !isFinite(v) ? null : Math.round(v * 100);

export interface SnapshotResult {
  data: Map<string, TcgCardData>;
  stats: {
    products: number;
    matched: number;
    unmatched: string[];
    nameRejected: string[];
    priced: number;
    pricepointFailures: number;
  };
}

/**
 * Build one day's real snapshot for the given cards.
 *
 * A card with no product match, or whose match fails the name check, is simply
 * ABSENT from the result. That is deliberate and load-bearing: "we could not
 * price this" and "this is worthless" are different facts, and writing a zero
 * would turn the first into the second everywhere downstream — movers, charts,
 * set totals and the index.
 */
export async function buildTcgSnapshot(
  cards: RiftCard[],
  opts: { pacingMs?: number; log?: (s: string) => void } = {},
): Promise<SnapshotResult> {
  const log = opts.log ?? console.log;
  const pacing = opts.pacingMs ?? 90;

  const products = await fetchTcgplayerProducts(log);

  const byKey = new Map<string, TcgProduct[]>();
  for (const p of products) {
    const key = productKey(p);
    if (!key) continue;
    const list = byKey.get(key);
    if (list) list.push(p);
    else byKey.set(key, [p]);
  }

  const byProductId = new Map<number, TcgProduct>();
  for (const p of products) byProductId.set(p.productId, p);

  const unmatched: string[] = [];
  const nameRejected: string[] = [];
  const pairs: { card: RiftCard; product: TcgProduct }[] = [];

  for (const card of cards) {
    // Promos carry their TCGplayer product id, so they join on it directly and
    // skip both the collector-number key and the name check. Their numbers are
    // ambiguous by construction (see RiftCard.tcgProductId), so number matching
    // would be actively wrong for them.
    if (card.tcgProductId != null) {
      const direct = byProductId.get(card.tcgProductId);
      if (direct) pairs.push({ card, product: direct });
      else unmatched.push(`${card.setCode} ${card.collectorLabel} ${card.name} (product ${card.tcgProductId} gone)`);
      continue;
    }

    const hits = byKey.get(cardKey(card));
    if (!hits?.length) {
      unmatched.push(`${card.setCode} ${card.collectorLabel} ${card.name}`);
      continue;
    }
    // Prefer a product whose name agrees; among several, the most-listed one is
    // the mainstream printing rather than a stray duplicate.
    const agreeing = hits.filter((h) => namesAgree(card.name, h.productName));
    const pool = agreeing.length ? agreeing : [];
    if (!pool.length) {
      nameRejected.push(`${card.setCode} ${card.collectorLabel} "${card.name}" vs "${hits[0].productName}"`);
      continue;
    }
    pool.sort((a, b) => (b.totalListings ?? 0) - (a.totalListings ?? 0));
    pairs.push({ card, product: pool[0] });
  }

  log(`  matched: ${pairs.length}/${cards.length} (unmatched ${unmatched.length}, name-rejected ${nameRejected.length})`);
  log(`  fetching price points for ${pairs.length} products…`);

  const data = new Map<string, TcgCardData>();
  let priced = 0;
  let pricepointFailures = 0;

  for (let i = 0; i < pairs.length; i++) {
    const { card, product } = pairs[i];
    const points = await fetchPricePoints(product.productId);
    if (points == null) pricepointFailures++;

    const normal = points?.find((p) => p.printingType === "Normal");
    const foil = points?.find((p) => p.printingType === "Foil");

    // ─────────────────────────────────────────────────────────────────────────
    // pricepoints is the ONLY source for per-printing prices. Do not "fall back"
    // to the search payload's marketPrice.
    // ─────────────────────────────────────────────────────────────────────────
    // That field is not printing-scoped: for a printing that exists only in foil
    // — which is most Showcase and alt-art cards — it IS the foil price. Using
    // it as a Normal fallback wrote the foil price into the Normal series for
    // 624 of 1,170 cards (53%), so a Showcase card reported the same figure as
    // both its Market and its Foil Market. A card with no Normal printing has no
    // Normal price, and that is a null.
    const market = toCents(normal?.marketPrice);
    const mid = toCents(normal?.listedMedianPrice);
    const foilMarket = toCents(foil?.marketPrice);

    if (market != null || foilMarket != null) priced++;

    data.set(card.id, {
      productId: product.productId,
      url: tcgProductUrl(product),
      quote: {
        // lowestPrice is the cheapest listing across every printing, so it only
        // belongs to the Normal series when a Normal printing exists. On a
        // foil-only card it would be the foil low wearing the wrong label.
        low: market != null ? toCents(product.lowestPrice) : null,
        mid,
        market,
        foil: toCents(foil?.listedMedianPrice),
        foilMarket,
      },
      rarity: product.rarityName ?? null,
      description: htmlToText(product.customAttributes?.description),
      flavorText: htmlToText(product.customAttributes?.flavorText),
      totalListings: product.totalListings ?? 0,
    });

    if (pacing) await sleep(pacing);
    if ((i + 1) % 200 === 0) log(`    ${i + 1}/${pairs.length}`);
  }

  return {
    data,
    stats: { products: products.length, matched: pairs.length, unmatched, nameRejected, priced, pricepointFailures },
  };
}
