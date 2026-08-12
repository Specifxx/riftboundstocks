export const SITE_NAME = "RiftboundStocks";
export const SITE_TAGLINE = "Riftbound TCG price tracking, movers and market analysis";

// Set NEXT_PUBLIC_SITE_URL in Vercel once the domain is attached; the fallback
// keeps local dev and preview builds working with absolute URLs (sitemap, OG tags).
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
).replace(/\/$/, "");

export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@riftboundstocks.com";

// Riot's official Riftbound card database — the authoritative source every card
// page links out to, since this site publishes prices, not rules text.
export const OFFICIAL_CARD_DB_URL = "https://riftbound.leagueoflegends.com/en-us/cards/";

// Shown wherever prices appear. TCGplayer's API terms require attribution and
// forbid presenting their data as your own, so this string is not decorative.
export const PRICE_SOURCE_NOTE = "Prices sourced from TCGplayer.";

// This build ships a SYNTHETIC price history (see lib/prices/synthetic.ts) because
// no TCGplayer API key is wired up yet. Every surface that prints a number reads
// this flag so the demo disclaimer can never be accidentally left off in a build
// that is showing generated numbers.
export const PRICES_ARE_DEMO = !process.env.TCGPLAYER_PUBLIC_KEY;
