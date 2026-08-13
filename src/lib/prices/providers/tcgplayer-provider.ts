// TCGplayer as a VendorProvider — a thin wrapper over the existing headline
// price data in ../index.ts, so the card page's vendor list has TCGplayer as
// just another row rather than a hardcoded special case.

import type { RiftCard } from "@/lib/catalog";
import { latestQuote, primaryPrice } from "@/lib/prices";
import { tcgSearchUrl } from "@/lib/prices/tcgplayer";
import type { VendorProvider, VendorQuote } from "./provider";

export const tcgplayerProvider: VendorProvider = {
  id: "tcgplayer",
  label: "TCGplayer",
  currency: "USD",
  configured: true,

  async fetchQuote(card: RiftCard): Promise<VendorQuote | null> {
    const cents = primaryPrice(latestQuote(card));
    if (cents == null) return null;
    return { priceCents: cents, currency: "USD", url: tcgSearchUrl(card.name), inStock: true, kind: "retail" };
  },
};
