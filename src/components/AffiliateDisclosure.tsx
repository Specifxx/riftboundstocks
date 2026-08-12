import { SITE_NAME } from "@/lib/site";

// The VISIBLE affiliate disclosure, rendered immediately adjacent to every
// affiliate link on the site.
//
// Ported from TCGEmpire, which added it after the eBay Partner Network Quality
// Team flagged (Jul 2026) that correctly-worded disclosure text placed too far
// from the actual links did not satisfy "clear and prominent". The same
// FTC-derived requirement applies to the TCGplayer/Impact program, so the
// lesson carries over even though this site only runs TCGplayer.
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
      <span className="font-semibold text-ink-muted">Affiliate link:</span> {SITE_NAME} earns a commission from
      qualifying TCGplayer purchases — at no extra cost to you.
    </p>
  );
}
