// The RiftboundStocks mark: RiftCompare's own "R" (sibling site, same
// ownership — see Footer.tsx), recoloured from its flat source PNG through a
// CSS mask so it always matches the current theme's accent/foil gradient
// rather than needing a second asset per palette. The small "S" tucked after
// the R is what distinguishes this site from RiftCompare at a glance; the
// mark itself is deliberately identical. Decorative (aria-hidden) everywhere
// it's used — a Link with its own accessible name, or a visible wordmark
// alongside it, or a purely decorative watermark — so it's never announced
// redundantly.
export function BrandLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span className="relative inline-flex shrink-0 items-center" aria-hidden>
      <span
        className={`inline-block ${className}`}
        style={{
          backgroundImage: "linear-gradient(in oklch, rgb(var(--accent)), rgb(var(--foil)))",
          WebkitMaskImage: "url(/logo-r.png)",
          maskImage: "url(/logo-r.png)",
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />
      <span className="-ml-1 self-start font-display text-[13px] font-bold leading-none text-accent">S</span>
    </span>
  );
}

export function BrandWordmark() {
  return (
    <span className="font-display text-[19px] font-semibold uppercase tracking-tight text-ink">
      Riftbound<span className="text-accent">Stocks</span>
    </span>
  );
}
