import type { RiftCard } from "@/lib/catalog";

/**
 * Real Riftbound card art from the RiftScribe CDN, over a blurred backdrop of
 * itself so portrait and landscape cards both fill their tile without letterbox
 * bars. Ported from TCGEmpire's components/CardImage.tsx.
 *
 * A plain <img>, not next/image, for the same reason TCGEmpire uses one: these
 * are already-optimised remote WebP thumbnails, and routing ~950 of them through
 * the Next image optimiser would spend transform quota to make them bigger.
 */
export function CardImage({
  card,
  full = false,
  priority = false,
  className,
}: {
  card: RiftCard;
  /** Full-resolution art — for the card page hero only. */
  full?: boolean;
  /** Set on the LCP image so it isn't lazy-loaded. */
  priority?: boolean;
  className?: string;
}) {
  const src = full ? card.imageUrl : card.imageThumbUrl;

  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-surface-2 ${className ?? ""}`}
      style={
        card.blurDataUrl
          ? { backgroundImage: `url(${card.blurDataUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
          : undefined
      }
    >
      {/* Darkens the already-blurred backdrop. No backdrop-filter: with hundreds
          of tiles in a set grid it makes scrolling janky, and the blur is baked
          into the placeholder anyway. */}
      <div className="absolute inset-0 bg-surface-0/40" />
      <img
        src={src}
        alt={`${card.name} — ${card.setName} ${card.collectorLabel}, ${card.rarity} ${card.domain} ${card.type}`}
        width={card.orientation === "landscape" ? 1040 : 744}
        height={card.orientation === "landscape" ? 744 : 1040}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className="relative h-full w-full object-contain"
      />
    </div>
  );
}
