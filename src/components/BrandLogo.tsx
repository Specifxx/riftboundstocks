import { SITE_NAME } from "@/lib/site";

// The RiftboundStocks mark: an original hex-and-rift glyph, not a letterform.
//
// A hexagon (Riftbound's card-frame and rune motif — see the hex-cornered card
// tiles in CardTile.tsx) split by a jagged diagonal "rift" fracture, the two
// halves picked out in the accent gradient against a filled void. It is drawn
// as plain inline SVG paths — no external asset, no mask, nothing shared with
// any other product's mark — so it recolours for free in both themes via
// `currentColor`/CSS variables and never needs a second file kept in sync.
export function BrandLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label={`${SITE_NAME} mark`}>
      <defs>
        <linearGradient id="rl-mark-grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="rgb(var(--accent))" />
          <stop offset="1" stopColor="rgb(var(--foil))" />
        </linearGradient>
      </defs>
      {/* Hexagon frame, echoing the card-tile hex corners used across the site. */}
      <path
        d="M16 1.5 29 9v14L16 30.5 3 23V9Z"
        fill="none"
        stroke="url(#rl-mark-grad)"
        strokeWidth="2.1"
        strokeLinejoin="round"
      />
      {/* The rift: a jagged fracture through the frame, splitting it into two
          plates — the mark's namesake, a line torn open down the middle. */}
      <path
        d="M13.5 5.5 17 13l-3.4 2.6L17.5 19 14 26.5"
        fill="none"
        stroke="url(#rl-mark-grad)"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandWordmark() {
  return (
    <span className="font-display text-[19px] font-semibold uppercase tracking-tight text-ink">
      Riftbound<span className="text-accent">Stocks</span>
    </span>
  );
}
