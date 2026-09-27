import Link from "next/link";
import { domainInfo, rarityInfo } from "@/lib/riftbound";
import { formatPct } from "@/lib/format";

// Everything in this file is pure presentation and safe to import from client
// components (CardTable, SearchBox, SetBrowser…). Keep it that way: anything
// that reads the pricing layer belongs in ./Notices, because importing
// lib/prices here drags the multi-megabyte price and catalogue JSON into the
// browser bundle of every page that renders a table.

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

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`panel p-4 ${className}`}>{children}</section>;
}

/**
 * A small card thumbnail for table rows. 14 promo printings have no art at
 * all; an empty `src` rendered the browser's broken-image icon, so those get
 * a plain placeholder of the same size instead.
 */
export function Thumb({ src, width, height, className }: { src: string; width: number; height: number; className: string }) {
  if (!src) return <span aria-hidden className={`inline-block bg-surface-3 ${className}`} />;
  return <img src={src} alt="" width={width} height={height} className={className} loading="lazy" />;
}
