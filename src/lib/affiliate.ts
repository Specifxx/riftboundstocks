// Affiliate identifiers and outbound-link tagging.
//
// These values are PUBLIC by design — they appear in outbound URLs and in the
// page HTML — so they are safe as code defaults. Override via env to rotate.
//
// Ported from TCGEmpire's lib/affiliate.ts, trimmed to the one network this site
// actually uses. TCGplayer's affiliate program runs through Impact; there is no
// eBay or Amazon integration here.

import { SITE_URL } from "./site";

/**
 * The approved Impact deep-link base. Every tcgplayer.com URL is wrapped through
 * it to earn commission.
 *
 * ⚠ This is RiftCompare's approved base, reused because both sites belong to the
 * same Impact account — so clicks credit correctly from day one. Two things still
 * need doing in the Impact dashboard:
 *   1. TODO(config): Add the real riftboundstocks.com domain (once registered — see
 *      SITE_URL in lib/site.ts) as a PROPERTY on the account. Driving traffic
 *      from a domain the program hasn't been told about is how partnerships
 *      get suspended, even when the account is right.
 *   2. TODO(config): Get this domain's own verification token (see
 *      IMPACT_SITE_VERIFICATION).
 * Once TCGplayer issues a base specific to this site, set TCGPLAYER_IMPACT_LINK.
 *
 * `||` not `??`, so an env var accidentally set to "" still falls back — an empty
 * base would silently un-monetise every click rather than failing loudly.
 */
export const TCGPLAYER_IMPACT_LINK =
  process.env.TCGPLAYER_IMPACT_LINK || "https://partner.tcgplayer.com/c/7385758/1780961/21018";

/**
 * Impact site-ownership verification token, rendered as a <meta> in <head>.
 *
 * Deliberately NO fallback. The token is per-domain, and RiftCompare's would be
 * wrong here — pasting it would claim ownership of the wrong property. Impact
 * issues one once this site's real domain is added (TODO(config)); put it in
 * NEXT_PUBLIC_IMPACT_SITE_VERIFICATION and the meta tag appears.
 */
export const IMPACT_SITE_VERIFICATION = process.env.NEXT_PUBLIC_IMPACT_SITE_VERIFICATION || "";

// ── Attribution ──────────────────────────────────────────────────────────────
// Impact gives exactly one free-text field per click (`sharedid`, shown as
// "SubId1"/"Shared ID" in TCGplayer's partner reports). It is the only way to
// learn WHERE revenue comes from. Without it every click reports the same id and
// the reports can answer "did TCGplayer earn?" but never "did the card page's
// price table earn, or the article card panels?" — which is the question that
// decides where the next placement goes.
//
// The `rbs-` prefix is what separates this site's revenue from RiftCompare's
// (`rc-`) inside the SAME Impact account. Without it the two sites' earnings are
// one undifferentiated number.
//
// Format: rbs-<placement>-<page>, e.g. `rbs-card-prices-card`, `rbs-article-news`.
// Sanitised hard: a sub-id containing unexpected characters can be dropped, and a
// dropped click is unattributed revenue that looks exactly like no revenue.
const SUBID_MAX = 60;

export function affiliateSubId(...parts: (string | null | undefined)[]): string {
  const s = parts
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
  return s ? `rbs-${s}`.slice(0, SUBID_MAX) : "rbs";
}

/**
 * Wrap an outbound TCGplayer URL in the Impact deep link.
 *
 * `placement` segments the reporting (e.g. "card-prices", "article-card").
 * `loc` is the page path it was rendered on; only the first path segment is
 * used, because a full URL would blow the sub-id length and leak query strings
 * into a third party's reports.
 *
 * Non-TCGplayer URLs pass through untouched, so this is safe to call on anything.
 */
export function affiliateUrl(url: string | null | undefined, placement = "link", loc?: string): string {
  if (!url) return "#";

  const page = (() => {
    if (!loc) return undefined;
    try {
      return new URL(loc, SITE_URL).pathname.split("/").filter(Boolean)[0] ?? "home";
    } catch {
      return undefined;
    }
  })();

  try {
    const u = new URL(url);
    if (TCGPLAYER_IMPACT_LINK && /(?:^|\.)tcgplayer\.com$/i.test(u.hostname)) {
      return (
        `${TCGPLAYER_IMPACT_LINK}?u=${encodeURIComponent(url)}` +
        `&sharedid=${encodeURIComponent(affiliateSubId(placement, page))}`
      );
    }
  } catch {
    // Not an absolute URL — leave it alone rather than mangling it.
  }
  return url;
}

/**
 * rel for outbound merchant anchors.
 *
 * This is the MACHINE-READABLE half of the affiliate disclosure. The visible
 * half is <AffiliateDisclosure />. Both are required; neither substitutes for
 * the other.
 */
export function outboundRel(): string {
  return "nofollow sponsored noopener noreferrer";
}

// ── Sibling site ─────────────────────────────────────────────────────────────
// RiftCompare is this project's sister site: it compares live prices across
// stores in six markets (AU/NZ/US/UK/SG/CA), where RiftboundStocks tracks TCGplayer
// market history. Genuinely complementary, so the cross-links point at
// something a reader on this page actually wants.
//
// NOT an affiliate link — same owner, no commission, so it carries no
// `sponsored` rel. The `ref` param is for RiftCompare's own analytics.
export const RIFTCOMPARE_URL = "https://riftcompare.com";

function tagged(url: string, source: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}ref=riftboundstocks&utm_source=riftboundstocks&utm_medium=referral&utm_campaign=${encodeURIComponent(source)}`;
}

export function riftcompareUrl(path = "", source = "footer"): string {
  const clean = path.startsWith("/") ? path : path ? `/${path}` : "";
  return tagged(`${RIFTCOMPARE_URL}${clean}`, source);
}

/**
 * Deep-link to a card on RiftCompare, via SEARCH rather than a reproduced slug.
 *
 * Their slug is `name-setcode-collectornumber`, which is close enough to ours to
 * be tempting — but reproducing it is wrong often enough to matter. Spot-checking
 * live URLs, base prints resolve and Signature prints 404 (their catalogue
 * handles variants differently, and carries a set this one doesn't). With 156
 * variant printings here, that is a lot of cross-links into a 404.
 *
 * Search always lands on something useful, so it is the honest choice even
 * though it costs a click.
 */
export function riftcompareCardUrl(cardName: string, source = "card"): string {
  return tagged(`${RIFTCOMPARE_URL}/browse?q=${encodeURIComponent(cardName)}`, source);
}
