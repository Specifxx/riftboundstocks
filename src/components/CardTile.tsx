import Link from "next/link";
import type { RiftCard } from "@/lib/catalog";
import { latestQuote, quoteDaysAgo, pctChange } from "@/lib/prices";
import { CardImage } from "./CardImage";
import { Money } from "./Prefs";
import { Delta, DomainPill, RarityPill } from "./Bits";

/**
 * Vendor badge. A neutral monogram rather than TCGplayer's actual logo — their
 * mark is a trademark with its own usage rules, and this site has no licence to
 * reproduce it. The attribution that matters is the text one in the footer.
 */
export function VendorBadge({ label = "TCG" }: { label?: string }) {
  return (
    <span className="inline-grid h-4 w-7 place-items-center rounded-sm bg-surface-3 font-mono text-[9px] font-bold tracking-tight text-ink-dim">
      {label}
    </span>
  );
}

/** Large homepage tile: full art plus the three headline prices. */
export function TrendingTile({ card, pct }: { card: RiftCard; pct?: number | null }) {
  const q = latestQuote(card);
  return (
    <Link
      href={`/card/${card.slug}`}
      className="panel group flex flex-col overflow-hidden transition-colors hover:border-line-strong"
    >
      <div className="relative aspect-[5/7] w-full overflow-hidden bg-surface-2">
        <CardImage card={card} className="h-full w-full" />
        {pct != null && (
          <span
            className={`absolute right-2 top-2 rounded px-1.5 py-0.5 font-mono text-[11px] font-bold ${
              pct >= 0 ? "bg-up/20 text-up" : "bg-down/20 text-down"
            }`}
          >
            {pct >= 0 ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="truncate font-display text-[15px] font-semibold text-ink group-hover:text-accent">{card.name}</h3>
        <p className="mt-0.5 truncate text-[11px] text-ink-dim">
          {card.setName} · {card.collectorLabel}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <RarityPill rarity={card.rarity} />
          <DomainPill domain={card.domain} />
        </div>

        <dl className="mt-3 space-y-1 border-t border-line pt-2.5">
          {(
            [
              ["Low", q.low],
              ["Market", q.market],
              ["Foil", q.foilMarket],
            ] as const
          ).map(([label, cents]) => (
            <div key={label} className="flex items-center gap-2">
              <VendorBadge />
              <dt className="text-[11px] text-ink-dim">{label}</dt>
              <dd className="ml-auto">
                <Money
                  cents={cents}
                  className={`num text-[13px] font-semibold ${label === "Foil" ? "text-foil" : "text-ink"}`}
                />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Link>
  );
}

/** Compact grid tile for set pages and browse results. */
export function CardGridTile({ card }: { card: RiftCard }) {
  const q = latestQuote(card);
  const pct = pctChange(q.market, quoteDaysAgo(card, 7).market);
  return (
    <Link href={`/card/${card.slug}`} className="group flex flex-col">
      <div className="aspect-[5/7] w-full overflow-hidden rounded-lg border border-line bg-surface-2 transition-colors group-hover:border-accent">
        <CardImage card={card} className="h-full w-full" />
      </div>
      <h3 className="mt-1.5 truncate text-[12.5px] font-medium text-ink group-hover:text-accent">{card.name}</h3>
      <div className="flex items-baseline justify-between gap-2">
        <Money cents={q.market} className="num text-[13px] font-semibold text-ink" />
        <Delta pct={pct} className="text-[11px]" />
      </div>
      <p className="truncate font-mono text-[10px] text-ink-dim">{card.collectorLabel}</p>
    </Link>
  );
}
