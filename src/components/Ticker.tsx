import Link from "next/link";
import { tickerMovers } from "@/lib/prices";
import { Money } from "./Prefs";
import { formatPct } from "@/lib/format";

/**
 * The movers ticker under the nav.
 *
 * The list is rendered TWICE and the track translated -50%, which is what makes
 * the loop seamless with a pure CSS animation — no JS timer, no measurement, and
 * it keeps working if hydration is slow. `.ticker-track` pauses on hover (so a
 * row can actually be clicked) and is disabled outright under
 * prefers-reduced-motion — see globals.css.
 */
export function Ticker() {
  const movers = tickerMovers(28);
  if (movers.length === 0) return null;

  const row = (m: (typeof movers)[number], key: string) => {
    const up = m.pct >= 0;
    return (
      <Link
        key={key}
        href={`/card/${m.card.slug}`}
        className="group inline-flex shrink-0 items-center gap-2 border-r border-line px-4 py-1.5"
      >
        <span className="max-w-[190px] truncate text-[12px] font-medium text-ink-muted group-hover:text-ink">
          {m.card.name}
        </span>
        <Money cents={m.now} className="num text-[12px] font-semibold text-ink" />
        <span className={`num text-[12px] font-bold ${up ? "text-up" : "text-down"}`}>
          {up ? "▲" : "▼"} {formatPct(Math.abs(m.pct)).replace("+", "")}
        </span>
      </Link>
    );
  };

  return (
    <div className="relative overflow-hidden border-b border-line bg-surface-0">
      <div className="ticker-track flex w-max animate-ticker">
        {movers.map((m, i) => row(m, `a${i}`))}
        {/* Duplicate pass — aria-hidden so a screen reader doesn't read the same
            28 cards twice. */}
        <div className="flex" aria-hidden>
          {movers.map((m, i) => row(m, `b${i}`))}
        </div>
      </div>
    </div>
  );
}
