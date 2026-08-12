import type { RiftCard } from "@/lib/catalog";
import { domainInfo } from "@/lib/riftbound";

/**
 * Real Riftbound card art, over a blurred backdrop of itself so portrait and
 * landscape cards both fill their tile without letterbox bars. Ported from
 * TCGEmpire's components/CardImage.tsx.
 *
 * A plain <img>, not next/image, for the same reason TCGEmpire uses one: these
 * are already-optimised remote thumbnails, and routing ~1,400 of them through
 * the Next image optimiser would spend transform quota to make them bigger.
 *
 * Three art states, and the difference matters:
 *   • the printing's own picture           — booster-set cards, ~22% of promos
 *   • the BASE card's art, borrowed        — most promos; flagged, because a
 *     Metal or alt-art promo does not look like the card it reprints
 *   • none at all                          — 14 promos; a typed placeholder
 *     rather than a broken image
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
  const src = (full ? card.imageUrl : card.imageThumbUrl) || card.imageUrl;

  if (!src) {
    const domain = domainInfo(card.domain);
    return (
      <div
        className={`relative grid place-items-center overflow-hidden rounded-lg bg-surface-2 p-3 text-center ${className ?? ""}`}
        style={{ boxShadow: `inset 0 0 0 1px ${domain.color}40` }}
        role="img"
        aria-label={`${card.name} — no image available`}
      >
        <span>
          <span className="block font-display text-[13px] font-semibold leading-tight text-ink-muted">{card.name}</span>
          <span className="mt-1 block font-mono text-[10px] text-ink-dim">{card.collectorLabel}</span>
          <span className="mt-2 block text-[10px] uppercase tracking-wide" style={{ color: domain.color }}>
            No image
          </span>
        </span>
      </div>
    );
  }

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
        alt={
          card.borrowedArt
            ? `${card.name} — base-set artwork shown; this promo printing may look different`
            : `${card.name} — ${card.setName} ${card.collectorLabel}, ${card.rarity} ${card.domain} ${card.type}`
        }
        width={card.orientation === "landscape" ? 1040 : 744}
        height={card.orientation === "landscape" ? 744 : 1040}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className="relative h-full w-full object-contain"
      />
      {card.borrowedArt && (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-surface-0/85 px-1.5 py-1 text-center text-[9px] font-semibold uppercase tracking-wide text-ink-dim">
          Base-set art
        </span>
      )}
    </div>
  );
}
