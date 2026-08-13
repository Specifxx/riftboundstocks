import { formatMoney } from "@/lib/format";
import { outboundRel } from "@/lib/affiliate";
import { AffiliateDisclosure } from "./AffiliateDisclosure";
import type { CardListings } from "@/lib/prices/riftcompare";

// Full multi-vendor comparison grid, sourced from RiftCompare (see
// lib/prices/riftcompare.ts) — every store RiftCompare tracks for this card,
// ranked by TOTAL delivered cost (item + shipping), not sticker price alone,
// so a store with cheap shipping can rank above a nominally-lower price with
// expensive postage. Renders nothing when RiftCompare has no listings for
// this printing (a real, expected gap — see riftcompareSlug()'s doc comment)
// rather than an empty section with a misleading header.
export function StoreListings({ data }: { data: CardListings }) {
  if (data.listings.length === 0) return null;

  return (
    <section className="panel p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="eyebrow">Compare stores ({data.storeCount})</h2>
        <span className="text-[11px] text-ink-dim">via RiftCompare · ranked by total delivered cost</span>
      </div>
      <ul className="space-y-2">
        {data.listings.map((l) => (
          <li key={l.id} className="flex items-center gap-2 border-b border-line pb-2 last:border-0 last:pb-0">
            <span className="inline-grid h-5 min-w-[36px] shrink-0 place-items-center rounded-sm bg-surface-3 px-1 font-mono text-[9px] font-bold text-ink-dim">
              {l.retailer.replace(/-(us|uk|au|nz|sg|ca)$/i, "").slice(0, 4).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-ink">
                {l.retailerName}
                {l.isFoil && <span className="ml-1.5 text-[10px] font-normal text-foil">Foil</span>}
                {!l.inStock && <span className="ml-1.5 text-[10px] font-normal text-ink-dim">Out of stock</span>}
              </span>
              <span className="block text-[11px] text-ink-dim">
                {l.condition ?? "NM"} · {formatMoney(l.priceCents, data.currency)}
                {l.ship != null
                  ? l.ship > 0
                    ? ` + ${formatMoney(l.ship, data.currency)} ship`
                    : " · free ship"
                  : " + ship at checkout"}
              </span>
            </span>
            <span className="num shrink-0 text-[15px] font-bold text-ink">{formatMoney(l.delivered, data.currency)}</span>
            <a
              href={l.buyHref}
              target="_blank"
              rel={outboundRel()}
              className="shrink-0 rounded-md border border-line px-2 py-1 text-[11px] font-semibold text-accent hover:border-accent"
            >
              Buy →
            </a>
          </li>
        ))}
      </ul>
      {data.hasEbay && <p className="mt-2 text-[11px] text-ink-dim">Includes live eBay listings.</p>}
      <AffiliateDisclosure className="mt-3 border-t border-line pt-2.5" />
    </section>
  );
}
