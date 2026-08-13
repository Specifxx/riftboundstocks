import { formatMoney } from "@/lib/format";
import { riftcompareCardUrl } from "@/lib/affiliate";
import type { RegionalPrices } from "@/lib/prices/riftcompare";

// Sibling-site cross-link, upgraded from a bare search link to the actual
// lowest tracked price in each market when RiftCompare has one — see
// lib/prices/riftcompare.ts's fetchRegionalPrices(). Not an affiliate link
// (same owner as RiftCompare, no commission), so no outboundRel()/sponsored
// tagging here — see lib/affiliate.ts's riftcompareCardUrl() doc comment.
const REGIONS: { code: keyof RegionalPrices; place: string; currency: string }[] = [
  { code: "AU", place: "Australia", currency: "AUD" },
  { code: "NZ", place: "New Zealand", currency: "NZD" },
  { code: "UK", place: "United Kingdom", currency: "GBP" },
  { code: "SG", place: "Singapore", currency: "SGD" },
  { code: "CA", place: "Canada", currency: "CAD" },
];

export function ShoppingRegions({ cardName, prices }: { cardName: string; prices: RegionalPrices | null }) {
  const known = prices ? REGIONS.filter((r) => prices[r.code] != null) : [];

  if (known.length === 0) {
    // No real regional data for this printing (RiftCompare doesn't track it,
    // or the fetch failed) — fall back to the honest search link rather than
    // showing five empty rows or, worse, guessing a price.
    return (
      <p className="mt-2 text-[11px] leading-relaxed text-ink-dim">
        Shopping outside the US?{" "}
        <a
          href={riftcompareCardUrl(cardName, "card-prices")}
          target="_blank"
          rel="noopener"
          className="font-semibold text-accent hover:underline"
        >
          Compare {cardName} across AU, NZ, UK, SG and CA stores on RiftCompare →
        </a>
      </p>
    );
  }

  return (
    <div className="mt-2 border-t border-line pt-2.5">
      <p className="mb-1.5 text-[11px] font-semibold text-ink-muted">Shopping outside the US — lowest tracked price:</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
        {known.map((r) => (
          <li key={r.code} className="flex items-baseline gap-1">
            <span className="text-ink-dim">{r.place}</span>
            <span className="num font-semibold text-ink">{formatMoney(prices![r.code]!, r.currency)}</span>
          </li>
        ))}
      </ul>
      <a
        href={riftcompareCardUrl(cardName, "card-prices")}
        target="_blank"
        rel="noopener"
        className="mt-1.5 inline-block text-[11px] font-semibold text-accent hover:underline"
      >
        See stores on RiftCompare →
      </a>
    </div>
  );
}
