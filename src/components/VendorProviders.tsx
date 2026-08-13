import type { VendorResult } from "@/lib/prices/providers";
import { formatMoney } from "@/lib/format";

/**
 * The `PriceProvider`-adapter vendor row — additional NAMED marketplaces
 * beyond TCGplayer (which already has its own detailed price-point section
 * above this on the card page) and beyond RiftCompare's broad store-comparison
 * grid (which covers many retailers but isn't a per-vendor adapter). An
 * unconfigured provider still renders, clearly labelled, rather than being
 * hidden — see lib/prices/providers/cardmarket.ts's TODO(config).
 */
export function VendorProviders({ results }: { results: VendorResult[] }) {
  const others = results.filter((r) => r.provider.id !== "tcgplayer");
  if (others.length === 0) return null;

  return (
    <div className="mt-3 border-t border-line pt-3">
      <h3 className="eyebrow mb-2">Other marketplaces</h3>
      <ul className="space-y-1.5">
        {others.map(({ provider, quote }) => (
          <li key={provider.id} className="flex items-center justify-between gap-2 text-[12.5px]">
            <span className="text-ink-muted">
              {provider.label} <span className="text-ink-dim">· {provider.currency}</span>
            </span>
            {quote ? (
              <a href={quote.url} target="_blank" rel="nofollow noopener noreferrer" className="num font-semibold text-accent hover:underline">
                {formatMoney(quote.priceCents, quote.currency)}
              </a>
            ) : (
              <span className="rounded border border-line px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-dim">
                Not connected
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
