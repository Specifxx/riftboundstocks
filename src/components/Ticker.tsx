import Link from "next/link";
import { tickerMovers, topByMarket, HAS_CHANGE_DATA } from "@/lib/prices";
import { Money } from "./Prefs";
import { formatPct } from "@/lib/format";

interface Row {
  slug: string;
  name: string;
  cents: number;
  pct: number | null;
}

/**
 * The movers ticker under the nav.
 *
 * The list is rendered TWICE and the track translated -50%, which is what makes
 * the loop seamless with a pure CSS animation — no JS timer, no measurement, and
 * it keeps working if hydration is slow. `.ticker-track` pauses on hover (so a
 * row can actually be clicked) and is disabled outright under
 * prefers-reduced-motion — see globals.css.
 *
 * Until two days of price history exist there are no percentage moves to show,
 * so it runs the most valuable cards with prices only. Real data, no % column,
 * rather than an empty bar or a fabricated change.
 */
export function Ticker() {
  const rows: Row[] = HAS_CHANGE_DATA
    ? tickerMovers(28).map((m) => ({ slug: m.card.slug, name: m.card.name, cents: m.now, pct: m.pct }))
    : topByMarket(28).map(({ card, cents }) => ({ slug: card.slug, name: card.name, cents, pct: null }));

  if (rows.length === 0) return null;

  const row = (r: Row, key: string) => (
    <Link
      key={key}
      href={`/card/${r.slug}`}
      className="group inline-flex h-10 shrink-0 items-center gap-2 border-r border-line px-4"
    >
      <span className="max-w-[190px] truncate text-[12px] font-medium text-ink-muted group-hover:text-ink">
        {r.name}
      </span>
      <Money cents={r.cents} className="num text-[12px] font-semibold text-ink" />
      {r.pct != null && (
        <span className={`num text-[12px] font-bold ${r.pct >= 0 ? "text-up" : "text-down"}`}>
          {r.pct >= 0 ? "▲" : "▼"} {formatPct(Math.abs(r.pct)).replace("+", "")}
        </span>
      )}
    </Link>
  );

  return (
    <div className="relative overflow-hidden border-b border-line bg-surface-0">
      <div className="ticker-track flex w-max animate-ticker">
        {rows.map((r, i) => row(r, `a${i}`))}
        {/* Duplicate pass — aria-hidden so a screen reader doesn't read the same
            cards twice. */}
        <div className="flex" aria-hidden>
          {rows.map((r, i) => row(r, `b${i}`))}
        </div>
      </div>
    </div>
  );
}
