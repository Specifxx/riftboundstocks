import type { Metadata } from "next";
import { HAS_SEALED, SEALED, SEALED_PRICED, SEALED_UPDATED_AT, sealedInGroup, type SealedRow } from "@/lib/sealed-data";
import { affiliateUrl, outboundRel } from "@/lib/affiliate";
import { formatDate } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { Money } from "@/components/Prefs";
import { DemoPricesNotice, HistoryNotice, Panel, SectionTitle } from "@/components/Bits";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";
import { SealedTable, type SealedTableRow } from "./SealedTable";

export const metadata: Metadata = {
  title: "Sealed Products",
  description: `TCGplayer market prices for all ${SEALED.length} Riftbound sealed products — booster boxes and display cases, booster, sleeved and promo packs, Champion Decks, Pre-Rift Kits and bundles. Market price and listed median for ${SEALED_PRICED} of them, refreshed daily.`,
  alternates: { canonical: `${SITE_URL}/sealed` },
};

const SECTIONS = [
  {
    id: "boxes",
    group: "boxes",
    title: "Boxes & Cases",
    blurb: "Booster displays, sealed cases, Champion Deck displays and Pre-Rift Event Kits — the wholesale end.",
  },
  {
    id: "packs",
    group: "packs",
    title: "Packs",
    blurb: "Single booster packs, sleeved packs and their art bundles, plus Nexus Night promo packs.",
  },
  {
    id: "starters",
    group: "starters",
    title: "Decks & Bundles",
    blurb: "Champion Decks, Showdown Decks, Pre-Rift Kits, box sets and bundles — fixed, ready-to-play product.",
  },
] as const;

/**
 * Grouped by product type rather than by set: it lines the four sets' Booster
 * Displays up side by side, which is the comparison a buyer actually makes.
 * Grouping by set would file a $1,999 display case and a $30 promo pack under
 * one heading and compare nothing.
 */
function byType(rows: SealedRow[]): { label: string; items: SealedRow[] }[] {
  const groups = new Map<string, SealedRow[]>();
  for (const row of rows) {
    const existing = groups.get(row.typeLabel);
    if (existing) existing.push(row);
    else groups.set(row.typeLabel, [row]);
  }
  // Dearest type first. sealedInGroup() already sorted by market descending, so
  // each list's first item carries its top price.
  return [...groups.entries()]
    .map(([label, items]) => ({ label, items }))
    .sort((a, b) => (b.items[0].market ?? -1) - (a.items[0].market ?? -1));
}

function priceRange(items: SealedRow[]): { low: number; high: number } | null {
  const priced = items.map((i) => i.market).filter((v): v is number => v != null);
  if (priced.length < 2) return null;
  return { low: Math.min(...priced), high: Math.max(...priced) };
}

function ProductImage({ product }: { product: SealedRow }) {
  // 5 of the 54 products have no TCGplayer image. A typed tile, never an <img>
  // pointed at a URL that was guessed.
  if (!product.image) {
    return (
      <div
        role="img"
        aria-label={`${product.name} — no image available`}
        className="grid h-[76px] w-[76px] shrink-0 place-items-center rounded-md border border-line bg-surface-3 p-1.5 text-center"
      >
        <span className="font-display text-[9.5px] uppercase leading-tight tracking-wide text-ink-dim">
          {product.typeLabel}
        </span>
      </div>
    );
  }
  return (
    <img
      src={product.image}
      alt={`${product.name} — sealed ${product.typeLabel}`}
      width={76}
      height={76}
      loading="lazy"
      decoding="async"
      className="h-[76px] w-[76px] shrink-0 rounded-md bg-surface-3 object-contain"
    />
  );
}

/**
 * Median − Market. Deliberately uncoloured: on this site green and red mean a
 * price moved, and a spread between two same-day figures is not a move.
 */
function Spread({ product }: { product: SealedRow }) {
  if (product.mid == null || product.market == null) return null;
  const diff = product.mid - product.market;
  if (diff === 0) return null;
  return (
    <p className="mt-1 text-[11px] text-ink-dim">
      <Money cents={Math.abs(diff)} className="num" /> {diff > 0 ? "under" : "over"} median
    </p>
  );
}

function ProductCard({ product }: { product: SealedRow }) {
  return (
    <li className="flex gap-3 rounded-lg border border-line bg-surface-2 p-3">
      <ProductImage product={product} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h4 className="min-w-0 text-[13.5px] font-semibold leading-tight text-ink">{product.shortName}</h4>
          {product.presale && (
            <span className="shrink-0 rounded bg-accent-soft px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-accent">
              Presale
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-ink-dim">
          {product.setName} · {product.typeLabel}
        </p>

        <dl className="mt-2 flex items-baseline gap-5">
          <div>
            <dt className="eyebrow">Market</dt>
            <dd>
              <Money cents={product.market} className="num text-[17px] font-bold text-accent" />
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Median</dt>
            <dd>
              <Money cents={product.mid} className="num text-[13px] font-semibold text-ink-muted" />
            </dd>
          </div>
        </dl>
        <Spread product={product} />

        <a
          href={affiliateUrl(product.url, "sealed", "/sealed")}
          target="_blank"
          rel={outboundRel()}
          className="mt-2 inline-flex min-h-[34px] w-fit items-center rounded-md border border-line px-2.5 py-1 text-[11px] font-semibold text-accent hover:border-accent sm:min-h-0 sm:px-2"
        >
          Buy on TCGplayer →
        </a>
      </div>
    </li>
  );
}

export default function SealedPage() {
  const updated = SEALED_UPDATED_AT ? formatDate(SEALED_UPDATED_AT) : null;
  const setCount = new Set(SEALED.map((p) => p.setCode)).size;

  const tableRows: SealedTableRow[] = SEALED.map((p) => ({
    productId: p.productId,
    name: p.shortName,
    setName: p.setName,
    typeLabel: p.typeLabel,
    presale: p.presale,
    mid: p.mid,
    market: p.market,
    // Wrapped here, on the server, where the Impact base env var exists.
    buyUrl: affiliateUrl(p.url, "sealed", "/sealed"),
  }));

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="mb-5 border-b border-line pb-4">
        <h1 className="font-display text-3xl uppercase tracking-wide text-ink sm:text-4xl">Sealed</h1>
        <p className="mt-1.5 max-w-3xl text-[14px] leading-relaxed text-ink-muted">
          Every Riftbound sealed product TCGplayer lists, at its own market price — booster boxes, cases, packs, decks
          and bundles. These are real sealed quotes, not the value of the singles inside.
        </p>

        <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-3">
          <div>
            <dt className="eyebrow">Products</dt>
            <dd className="num text-2xl font-bold text-ink">{SEALED.length}</dd>
          </div>
          <div>
            <dt className="eyebrow">Priced</dt>
            <dd className="num text-2xl font-bold text-ink">
              {SEALED_PRICED}
              <span className="ml-1 text-[13px] font-normal text-ink-dim">of {SEALED.length}</span>
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Sets</dt>
            <dd className="num text-2xl font-bold text-ink">{setCount}</dd>
          </div>
          <div>
            <dt className="eyebrow">Updated</dt>
            <dd className="text-[15px] font-semibold text-ink">{updated ?? "—"}</dd>
          </div>
        </dl>
      </header>

      {!HAS_SEALED ? (
        <Panel>
          <p className="py-6 text-center text-[13px] text-ink-dim">
            No sealed catalogue has been imported yet. Run the sealed build and price import to populate this page.
          </p>
        </Panel>
      ) : (
        <>
          <Panel className="mb-6">
            <h2 className="eyebrow mb-1.5">What&apos;s shown, and what isn&apos;t</h2>
            <p className="max-w-4xl text-[13px] leading-relaxed text-ink-muted">
              Sealed carries a market price and a listed median only. There is deliberately{" "}
              <strong className="font-semibold text-ink">no Low column</strong>: the cheapest sealed listing is rarely a
              price for the product, because sellers file accessories, empty boxes and single packs under the box SKU —
              which is how a $12 &ldquo;Vendetta Booster Display&rdquo; ends up sitting under a $160 market. Sealed has
              no foil either, so there is no foil column to show.
            </p>
            <p className="mt-2 max-w-4xl text-[13px] leading-relaxed text-ink-muted">
              Products TCGplayer has no figure for render a dash rather than a zero, and presale product is flagged —
              its price is an asking price for something nobody has opened yet.
            </p>
            <DemoPricesNotice className="mt-3 border-t border-line pt-3" />
          </Panel>

          {/* ── Boxes / Packs / Decks ─────────────────────────────────────────
              Anchor ids are linked from the navbar; keep them. */}
          {SECTIONS.map((section) => {
            const groups = byType(sealedInGroup(section.group));
            return (
              <section key={section.id} id={section.id} className="mb-8 scroll-mt-20">
                <SectionTitle>{section.title}</SectionTitle>
                <p className="-mt-1 mb-3 max-w-3xl text-[12.5px] leading-relaxed text-ink-muted">{section.blurb}</p>

                {groups.length === 0 ? (
                  <Panel>
                    <p className="py-6 text-center text-[13px] text-ink-dim">Nothing in this group yet.</p>
                  </Panel>
                ) : (
                  <div className="space-y-4">
                    {groups.map((group) => {
                      const range = priceRange(group.items);
                      return (
                        <Panel key={group.label}>
                          <header className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line pb-2">
                            <h3 className="font-display text-[15px] uppercase tracking-wide text-ink">{group.label}</h3>
                            <p className="text-[11px] text-ink-dim">
                              {group.items.length} {group.items.length === 1 ? "product" : "products"}
                              {range && (
                                <>
                                  {" · "}
                                  <Money cents={range.low} className="num" /> –{" "}
                                  <Money cents={range.high} className="num" /> at market
                                </>
                              )}
                            </p>
                          </header>

                          <ul className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                            {group.items.map((product) => (
                              <ProductCard key={product.productId} product={product} />
                            ))}
                          </ul>

                          {/* One disclosure per panel of Buy links, immediately
                              below them — the placement the card page uses. */}
                          <AffiliateDisclosure className="mt-3 border-t border-line pt-2.5" />
                        </Panel>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}

          {/* ── Everything, side by side ─────────────────────────────────────── */}
          <section className="scroll-mt-20">
            <SectionTitle>Compare all {SEALED.length} products</SectionTitle>
            <Panel>
              {/* Where a 24h/30d change column would sit. Sealed history is one
                  day old, so there is nothing yet to compare against. */}
              <HistoryNotice className="mb-3" />
              <SealedTable rows={tableRows} />
              <AffiliateDisclosure className="mt-3 border-t border-line pt-2.5" />
              <DemoPricesNotice className="mt-2" />
            </Panel>
          </section>
        </>
      )}
    </div>
  );
}
