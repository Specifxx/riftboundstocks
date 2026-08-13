import Link from "next/link";
import { domainHeat } from "@/lib/prices";
import { domainInfo } from "@/lib/riftbound";
import { Money } from "./Prefs";
import { formatPct } from "@/lib/format";

/**
 * The homepage/global "Domain Heat" board — replaces the scrolling ticker.
 *
 * Same underlying data (today's price moves), a wholly different visual
 * language: six hex-cornered domain tiles instead of a scrolling stock-style
 * marquee, coloured by the game's own six Domains rather than a generic
 * up/down bar. No infinite-loop animation to disable for prefers-reduced-motion
 * — the only motion is a hover lift, which the global reduced-motion media
 * query in globals.css already zeroes out.
 */
export function DomainHeat() {
  const entries = domainHeat();
  if (entries.length === 0) return null;

  return (
    <div className="border-b border-line bg-surface-1">
      <div className="mx-auto max-w-[1400px] px-3 py-2 sm:px-5">
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {entries.map((e) => {
            const info = domainInfo(e.domain);
            return (
              <Link
                key={e.domain}
                href={`/domains#${e.domain.toLowerCase()}`}
                className="group relative flex h-14 w-[132px] shrink-0 items-center gap-2 overflow-hidden border border-line bg-surface-2 px-2.5 py-1.5 transition-transform hover:-translate-y-0.5 hover:border-line-strong"
                style={{ clipPath: "polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)" }}
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1 opacity-80 transition-opacity group-hover:opacity-100"
                  style={{ backgroundColor: info.color }}
                />
                <span className="min-w-0 flex-1 pl-1">
                  <span className="block truncate text-[11px] font-semibold uppercase tracking-wide" style={{ color: info.color }}>
                    {info.label}
                  </span>
                  {e.avgPct != null ? (
                    <span className={`num block text-[13px] font-bold ${e.avgPct >= 0 ? "text-up" : "text-down"}`}>
                      {e.avgPct >= 0 ? "▲" : "▼"} {formatPct(Math.abs(e.avgPct)).replace("+", "")}
                    </span>
                  ) : e.topMover ? (
                    <span className="block truncate text-[11px] text-ink-dim">{e.topMover.card.name}</span>
                  ) : (
                    <Money cents={e.totalValue} className="num block text-[12px] font-semibold text-ink-muted" />
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
