// Cardmarket (cardmarket.com) — the dominant EU marketplace for physical TCG
// singles, priced in EUR. Stubbed: Riftbound isn't listed as a product line
// on Cardmarket at the time this adapter was written (they add games slowly,
// and Riftbound is new), and even once it is, their API needs an approved
// application (see below). Rather than skip the integration point entirely,
// this ships the real interface with an honest "not configured" state, so
// wiring up a live feed later is a config change, not a rewrite — the same
// shape as PRICES_ARE_DEMO / HAS_LIVE_PRICES for the primary source.

import type { RiftCard } from "@/lib/catalog";
import type { VendorProvider, VendorQuote } from "./provider";

// TODO(config): Cardmarket gates their API behind an approved application
// (https://www.cardmarket.com/en/Magic/MKM/API — the process is the same
// across their game verticals) using OAuth1-style signed requests, not a
// simple bearer key. To go live:
//   1. Apply for API access and get an App Token + App Secret.
//   2. Confirm Riftbound has a Cardmarket product line — as of writing it
//      does not, and there is nothing this adapter can fetch until it does.
//   3. Build a productId map: Cardmarket's ids are their own, not TCGplayer's
//      or RiftScribe's — same join-key problem lib/prices/riftcompare.ts
//      solved for RiftCompare's slugs, needs solving again here on whatever
//      key Cardmarket's product search returns.
//   4. Set CARDMARKET_APP_TOKEN / CARDMARKET_APP_SECRET and replace the
//      body of fetchQuote below with a real request.
const CONFIGURED = !!process.env.CARDMARKET_APP_TOKEN;

export const cardmarketProvider: VendorProvider = {
  id: "cardmarket",
  label: "Cardmarket",
  currency: "EUR",
  configured: CONFIGURED,

  async fetchQuote(_card: RiftCard): Promise<VendorQuote | null> {
    if (!CONFIGURED) return null;
    // Unreachable until CARDMARKET_APP_TOKEN is set — see the TODO(config)
    // above for what actually has to happen before this can return real data.
    return null;
  },
};
