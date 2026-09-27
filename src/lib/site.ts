// Single source of truth for the site's brand identity. Every user-facing
// mention of the product name reads from SITE_NAME rather than being spelled
// out at the call site, so the whole site is a one-line rename.
export const SITE_NAME = "RiftboundStocks";
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

// riftcompare@gmail.com per confirmed common ownership with the sister site
// (see Footer.tsx) — real, not a placeholder.
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "riftcompare@gmail.com";

// Riot's official Riftbound card database — the authoritative source every card
// page links out to, since this site publishes prices, not rules text.
export const OFFICIAL_CARD_DB_URL = "https://riftbound.leagueoflegends.com/en-us/cards/";

// Shown wherever prices appear. TCGplayer's API terms require attribution and
// forbid presenting their data as your own, so this string is not decorative.
export const PRICE_SOURCE_NOTE = "Prices sourced from TCGplayer.";

// PRICES_ARE_DEMO lives in ./prices/demo-flag and is imported from there
// directly. It used to be re-exported from this file, but site.ts is imported
// by client components (Navbar, CardActions, CookieNotice) and the flag's
// module reads the price JSON — so the re-export was a path for megabytes of
// data into the browser bundle. Server code imports it from the flag module.

// Accounts (src/lib/auth.ts) need somewhere to put a User row, so the whole
// feature is off — /login and /signup render their forms disabled, same
// treatment as an unconfigured OAuth provider — until DATABASE_URL is set. A
// fresh clone with zero env config must still build and run.
export const ACCOUNTS_ENABLED = !!process.env.DATABASE_URL;

/**
 * A post-login destination, or `fallback` if it isn't a same-site path.
 *
 * `startsWith("/") && !startsWith("//")` isn't enough on its own: browsers read
 * "/\evil.com" as "//evil.com", so a backslash anywhere is refused and the
 * result is resolved against SITE_URL and origin-checked. Arrays (a repeated
 * ?next=) take the first value instead of crashing the page.
 */
export function safeNext(next: unknown, fallback = "/profile"): string {
  const v = Array.isArray(next) ? next[0] : next;
  if (typeof v !== "string" || !v.startsWith("/") || v.startsWith("//") || v.includes("\\")) return fallback;
  try {
    const base = new URL(SITE_URL);
    const u = new URL(v, base);
    return u.origin === base.origin ? `${u.pathname}${u.search}${u.hash}` : fallback;
  } catch {
    return fallback;
  }
}
