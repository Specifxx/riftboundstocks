import type { RiftCard } from "@/lib/catalog";
import type { VendorProvider, VendorQuote } from "./provider";
import { tcgplayerProvider } from "./tcgplayer-provider";
import { cardmarketProvider } from "./cardmarket";

export type { VendorProvider, VendorQuote } from "./provider";

/** Every named vendor adapter, configured or not. Add a new marketplace here. */
export const VENDOR_PROVIDERS: VendorProvider[] = [tcgplayerProvider, cardmarketProvider];

export interface VendorResult {
  provider: VendorProvider;
  quote: VendorQuote | null;
}

/**
 * Every provider's quote for one card, run in parallel. Unconfigured
 * providers resolve to `{ provider, quote: null }` immediately rather than
 * being filtered out — the card page renders them as a visible "not
 * connected" row instead of silently having one fewer vendor, which is the
 * whole point of shipping the adapter before the credentials exist.
 */
export async function fetchVendorQuotes(card: RiftCard): Promise<VendorResult[]> {
  return Promise.all(
    VENDOR_PROVIDERS.map(async (provider) => ({
      provider,
      quote: await provider.fetchQuote(card).catch(() => null),
    })),
  );
}
