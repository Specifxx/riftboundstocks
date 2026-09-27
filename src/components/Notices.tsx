import Link from "next/link";
import { formatDate } from "@/lib/format";
import { PRICE_SOURCE_NOTE } from "@/lib/site";
import { PRICES_ARE_DEMO } from "@/lib/prices/demo-flag";
import { HAS_CHANGE_DATA, HISTORY_START, LIVE_FETCHED_AT } from "@/lib/prices";

// Server-only notices: these read the pricing layer, so they must never be
// imported by a "use client" component (see the note at the top of ./Bits).

/**
 * The demo-data disclaimer.
 *
 * Rendered on every surface that displays a price. It is not decoration and it
 * is not optional: the figures on this site are generated (see
 * lib/prices/synthetic.ts), and a price-tracking site that doesn't say so is
 * actively misleading. It disappears on its own once a real source is wired up,
 * because PRICES_ARE_DEMO goes false when a TCGplayer key is configured.
 */
export function DemoPricesNotice({ className = "" }: { className?: string }) {
  if (!PRICES_ARE_DEMO) {
    return (
      <p className={`text-[11px] leading-relaxed text-ink-dim ${className}`}>
        {PRICE_SOURCE_NOTE} Market and Median are TCGplayer&apos;s own figures per printing; Low is the lowest active
        listing, which can be a damaged or non-English copy.
        {LIVE_FETCHED_AT && <> Updated {formatDate(LIVE_FETCHED_AT)}.</>}
      </p>
    );
  }
  return (
    <p className={`text-[11px] leading-relaxed text-ink-dim ${className}`}>
      <span className="mr-1.5 inline-flex items-center rounded bg-down/15 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-down">
        Demo data
      </span>
      Prices on this page are <strong className="font-semibold text-ink-muted">generated sample data</strong>, not real
      market prices. {PRICE_SOURCE_NOTE}{" "}
      <Link href="/about" className="text-accent hover:underline">
        What this means
      </Link>
    </p>
  );
}

/**
 * Shown wherever a surface would normally report price MOVEMENT but can't yet.
 *
 * TCGplayer publishes no historical prices, so this site's history genuinely
 * starts at its first import and grows a day at a time. Saying so is better than
 * a table of dashes, and far better than comparing against a fabricated baseline.
 */
export function HistoryNotice({ className = "" }: { className?: string }) {
  if (HAS_CHANGE_DATA) return null;
  return (
    <p className={`rounded-lg border border-line bg-surface-2 px-3 py-2 text-[12px] leading-relaxed text-ink-muted ${className}`}>
      <strong className="font-semibold text-ink">Daily movers start tomorrow.</strong> Prices are live from TCGplayer,
      but percentage change needs two days to compare and history only began{" "}
      {HISTORY_START ? <>on {formatDate(`${HISTORY_START}T00:00:00Z`)}</> : "with the first import"}. Showing the most
      valuable cards until then.
    </p>
  );
}
