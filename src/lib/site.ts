// Single source of truth for the site's brand identity. Every user-facing
// mention of the product name reads from SITE_NAME rather than being spelled
// out at the call site, so the whole site is a one-line rename.
export const SITE_NAME = "RiftLedger";
export const SITE_TAGLINE = "Riftbound TCG price tracking, movers and market history";

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

// TODO(config): riftledger.app is a placeholder — no domain has been
// registered yet. Buy the real domain and set NEXT_PUBLIC_CONTACT_EMAIL /
// NEXT_PUBLIC_SITE_URL in Vercel before launch (see DEPLOYMENT.md).
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@riftledger.app";

// Riot's official Riftbound card database — the authoritative source every card
// page links out to, since this site publishes prices, not rules text.
export const OFFICIAL_CARD_DB_URL = "https://riftbound.leagueoflegends.com/en-us/cards/";

// Shown wherever prices appear. TCGplayer's API terms require attribution and
// forbid presenting their data as your own, so this string is not decorative.
export const PRICE_SOURCE_NOTE = "Prices sourced from TCGplayer.";

// True only when the site is falling back to the generator in
// lib/prices/synthetic.ts — i.e. the price data files are empty because
// `npm run prices:import` has never run. Every surface that prints a number
// reads this, so the demo disclaimer can never be left off a build that is
// showing generated figures.
//
// Derived from the DATA, not from an env var. It was previously
// `!process.env.TCGPLAYER_PUBLIC_KEY`, which is a flag someone has to remember
// to set — and it was already wrong: real prices are imported by the public
// endpoints, which need no key, so the disclaimers would have stayed up over
// genuine market data.
export { PRICES_ARE_DEMO } from "./prices/demo-flag";

// Accounts (src/lib/auth.ts) need somewhere to put a User row, so the whole
// feature is off — /login and /signup render their forms disabled, same
// treatment as an unconfigured OAuth provider — until DATABASE_URL is set. A
// fresh clone with zero env config must still build and run.
export const ACCOUNTS_ENABLED = !!process.env.DATABASE_URL;
