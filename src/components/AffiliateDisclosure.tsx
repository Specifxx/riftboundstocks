import { SITE_NAME } from "@/lib/site";

// The VISIBLE affiliate disclosure, rendered immediately adjacent to every
// affiliate link on the site.
//
// Ported from TCGEmpire, which added it after the eBay Partner Network Quality
// Team flagged (Jul 2026) that correctly-worded disclosure text placed too far
// from the actual links did not satisfy "clear and prominent". The same
// FTC-derived requirement applies to every affiliate program a "Buy" link on
// this page might route through — this site's own TCGplayer/Impact links, and
// the RiftCompare-sourced multi-store grid, which carries its own mix of
// TCGplayer, eBay/EPN and other store links, already tagged by RiftCompare
// where a program exists. Deliberately worded to not name a single network,
// since naming one and then adding another silently makes the disclosure
// technically-false-by-omission for the links that came from the other one.
//
// RULES FOR EDITING:
//  - Never hide this behind a hover, tooltip, `sr-only`, collapsed <details>, or
//    anything that renders only after interaction. It must be visible on first
//    paint, next to the link it describes.
//  - Never render it for only some visitors (e.g. skipping it for Premium). If
//    an affiliate link renders, its disclosure renders.
//  - Keep the word "affiliate" and the earning relationship explicit.
//
// The machine-readable half lives in lib/affiliate.ts's outboundRel()
// (rel="sponsored nofollow"). Both halves are required; neither replaces the other.
export function AffiliateDisclosure({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[11px] leading-relaxed text-ink-dim ${className}`}>
      <span className="font-semibold text-ink-muted">Affiliate link:</span> {SITE_NAME} may earn a commission from
      qualifying purchases made through links on this page — at no extra cost to you.
    </p>
  );
}
