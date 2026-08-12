// The RiftCompare "R" mark, reused here as the sibling-site lockup and recoloured
// from its flat source PNG through a CSS mask — the underlying asset is a single
// flat colour on transparency, so masking recolours it without shipping a second
// file. The small "S" tucked after the R is what distinguishes RiftboundStocks
// from RiftCompare at a glance; the mark itself is deliberately identical.
export function BrandLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span className="relative inline-flex shrink-0 items-center" aria-hidden>
      <span
        className={`inline-block ${className}`}
        style={{
          backgroundImage: "linear-gradient(in oklch, #6cb8ff, #2b7fd6)",
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
