import Link from "next/link";
import { domainInfo, rarityInfo } from "@/lib/riftbound";
import { formatPct, formatDate } from "@/lib/format";
import { PRICES_ARE_DEMO, PRICE_SOURCE_NOTE } from "@/lib/site";
import { HAS_CHANGE_DATA, HISTORY_START, LIVE_FETCHED_AT } from "@/lib/prices";

/**
 * A percentage move. Green up, red down, neutral flat — this and the Sparkline
 * are the only places green and red are allowed to mean anything on this site.
 */
export function Delta({ pct, className = "" }: { pct: number | null; className?: string }) {
  if (pct == null || !isFinite(pct)) return <span className={`text-ink-dim ${className}`}>—</span>;
  const flat = Math.abs(pct) < 0.05;
  const tone = flat ? "text-ink-dim" : pct > 0 ? "text-up" : "text-down";
  return (
    <span className={`num font-semibold ${tone} ${className}`}>
      {flat ? "0.0%" : formatPct(pct)}
    </span>
  );
}

/** Delta with the little triangle, for tables where the sign needs to read fast. */
export function DeltaArrow({ pct }: { pct: number | null }) {
  if (pct == null || !isFinite(pct)) return <span className="text-ink-dim">—</span>;
  const flat = Math.abs(pct) < 0.05;
  if (flat) return <span className="num text-ink-dim">0.0%</span>;
  const up = pct > 0;
  return (
    <span className={`num font-semibold ${up ? "text-up" : "text-down"}`}>
      {up ? "▲" : "▼"} {formatPct(Math.abs(pct)).replace("+", "")}
    </span>
  );
}

export function RarityPill({ rarity }: { rarity: string }) {
  const info = rarityInfo(rarity);
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ color: info.color, backgroundColor: `${info.color}1f` }}
    >
      {info.label}
    </span>
  );
}

export function DomainPill({ domain }: { domain: string }) {
  const info = domainInfo(domain);
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ color: info.color, backgroundColor: `${info.color}1f` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: info.color }} />
      {info.label}
    </span>
  );
}

export function SectionTitle({
  children,
  href,
  linkLabel = "View all",
}: {
  children: React.ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <h2 className="font-display text-xl uppercase tracking-wide text-ink sm:text-2xl">{children}</h2>
      {href && (
        <Link href={href} className="shrink-0 text-xs font-semibold text-accent hover:underline">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

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

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`panel p-4 ${className}`}>{children}</section>;
}
