// The vendor-provider boundary — distinct from PriceSource (../source.ts).
//
// PriceSource answers "what is this printing's HISTORICAL headline price
// series" (one series, used for the chart, movers, and rankings — TCGplayer
// today). VendorProvider answers "what does ONE MARKETPLACE currently list
// this printing for" — a snapshot, not a series, and there can be several at
// once. RiftCompare (../riftcompare.ts) already covers this for a wide set of
// real retailers; this interface is for adding a NAMED marketplace adapter
// directly (e.g. Cardmarket, the EU market RiftCompare doesn't track), with
// its own currency and its own configuration story.

import type { RiftCard } from "@/lib/catalog";
import type { Currency } from "@/lib/currency";

export interface VendorQuote {
  priceCents: number;
  currency: Currency;
  url: string;
  inStock: boolean;
  /** Buylist ("we pay you") vs retail ("you pay them"). Most adapters are retail-only. */
  kind: "retail" | "buylist";
}

export interface VendorProvider {
  readonly id: string;
  readonly label: string;
  readonly currency: Currency;
  /** False when the adapter has no credentials configured — see cardmarket.ts. */
  readonly configured: boolean;
  /** null = no listing found for this printing (or not configured). Never throws. */
  fetchQuote(card: RiftCard): Promise<VendorQuote | null>;
}
