"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Money } from "./Prefs";
import { DeltaArrow, DomainPill, RarityPill } from "./Bits";

/**
 * One row of a card table. Deliberately a flat, serialisable shape rather than a
 * RiftCard — this is a client component, so everything it receives crosses the
 * server/client boundary and has to survive JSON.
 */
export interface CardRow {
  slug: string;
  name: string;
  setName: string;
  setCode: string;
  collectorLabel: string;
  rarity: string;
  domain: string;
  type: string;
  thumb: string;
  /** Current price on the series the table is showing. null = TCGplayer has no price. */
  now: number | null;
  /** The comparison baseline. Omit on tables that aren't showing a change. */
  then?: number | null;
  /** null when there is no baseline to compare against. */
  pct?: number | null;
}

export type ColumnKey = "card" | "set" | "rarity" | "domain" | "type" | "now" | "then" | "pct";

type SortKey = "name" | "set" | "rarity" | "number" | "now" | "then" | "pct";

const SM = "sm:table-cell";
const MD = "md:table-cell";
const LG = "lg:table-cell";
const XL = "xl:table-cell";
const NOW_W = "w-[30%] sm:w-[18%]";

const RARITY_ORDER: Record<string, number> = { Common: 0, Uncommon: 1, Rare: 2, Epic: 3, Showcase: 4 };

export function CardTable({
  rows,
  columns = ["card", "set", "now", "pct"],
  nowLabel = "Market",
  thenLabel = "Old",
  initialSort = "pct",
  initialDir = "desc",
  pageSize = 60,
}: {
  rows: CardRow[];
  columns?: ColumnKey[];
  nowLabel?: string;
  thenLabel?: string;
  initialSort?: SortKey;
  initialDir?: "asc" | "desc";
  pageSize?: number;
}) {
  const [sort, setSort] = useState<SortKey>(initialSort);
  const [dir, setDir] = useState<"asc" | "desc">(initialDir);
  const [shown, setShown] = useState(pageSize);

  const sorted = useMemo(() => {
    const mul = dir === "asc" ? 1 : -1;
    const value = (r: CardRow): number | string => {
      switch (sort) {
        case "name": return r.name;
        case "set": return `${r.setCode}${r.collectorLabel}`;
        case "rarity": return RARITY_ORDER[r.rarity] ?? 0;
        case "number": return parseInt(r.collectorLabel, 10) || 0;
        // Unpriced rows sort to the bottom in either direction rather than
        // pretending to be worth zero.
        case "now": return r.now ?? -1;
        case "then": return r.then ?? -1;
        case "pct": return r.pct ?? 0;
      }
    };
    return [...rows].sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      if (typeof va === "string" || typeof vb === "string") return String(va).localeCompare(String(vb)) * mul;
      return (va - vb) * mul;
    });
  }, [rows, sort, dir]);

  function toggle(key: SortKey) {
    if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      // Prices and percentages are far more useful biggest-first; names are not.
      setDir(key === "name" || key === "set" ? "asc" : "desc");
    }
  }

  const Th = ({
    label,
    sortKey,
    align = "left",
    cls = "",
  }: {
    label: string;
    sortKey?: SortKey;
    align?: "left" | "right";
    cls?: string;
  }) => (
    <th className={`whitespace-nowrap py-2 font-medium ${align === "right" ? "text-right" : "text-left"} ${cls}`}>
      {sortKey ? (
        <button
          type="button"
          onClick={() => toggle(sortKey)}
          // Negative margin lets the hit area grow into the cell's own padding,
          // so the header stays as tall as it looks but is thumb-sized.
          className={`-my-1.5 inline-flex items-center gap-1 py-1.5 hover:text-ink ${sort === sortKey ? "text-ink" : ""}`}
        >
          {label}
          <span aria-hidden className={sort === sortKey ? "text-accent" : "opacity-0"}>
            {dir === "asc" ? "▲" : "▼"}
          </span>
        </button>
      ) : (
        label
      )}
    </th>
  );

  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-ink-dim">No cards match these filters.</p>;
  }

  return (
    <div>
      {/* No min-width and no horizontal scroll. A phone-width table that has to
          be swiped sideways hides exactly the column people came for — the price
          — so secondary columns are dropped as the viewport narrows instead, and
          the set name folds into the card cell where it would otherwise vanish. */}
      <div className="w-full">
        <table className="w-full table-fixed text-[13px]">
          <thead>
            <tr className="border-b border-line text-ink-dim">
              {columns.includes("card") && <Th label="Card" sortKey="name" />}
              {columns.includes("set") && <Th label="Set" sortKey="set" cls={`hidden ${MD} w-[26%]`} />}
              {columns.includes("rarity") && <Th label="Rarity" sortKey="rarity" cls={`hidden ${LG} w-[13%]`} />}
              {columns.includes("domain") && <Th label="Domain" cls={`hidden ${LG} w-[13%]`} />}
              {columns.includes("type") && <Th label="Type" cls={`hidden ${XL} w-[11%]`} />}
              {columns.includes("then") && <Th label={thenLabel} sortKey="then" align="right" cls={`hidden ${SM} w-[18%]`} />}
              {columns.includes("now") && <Th label={nowLabel} sortKey="now" align="right" cls={NOW_W} />}
              {columns.includes("pct") && <Th label="Change" sortKey="pct" align="right" cls="w-[22%] sm:w-[16%]" />}
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, shown).map((r) => (
              <tr key={r.slug} className="border-b border-line last:border-0 hover:bg-surface-2">
                {columns.includes("card") && (
                  <td className="py-1.5 pr-2">
                    <Link href={`/card/${r.slug}`} className="flex items-center gap-2 sm:gap-2.5">
                      <img
                        src={r.thumb}
                        alt=""
                        width={28}
                        height={39}
                        className="h-8 w-[23px] shrink-0 rounded object-cover sm:h-9 sm:w-7"
                        loading="lazy"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium leading-tight text-ink hover:text-accent">{r.name}</span>
                        <span className="block truncate font-mono text-[10.5px] leading-tight text-ink-dim">
                          {/* The Set column is hidden on phones, so it rides
                              along here rather than being lost. */}
                          {columns.includes("set") && <span className="md:hidden">{r.setCode} </span>}
                          {r.collectorLabel}
                        </span>
                      </span>
                    </Link>
                  </td>
                )}
                {columns.includes("set") && (
                  <td className={`hidden ${MD} py-1.5 pr-2 text-ink-muted`}>
                    <span className="block truncate">{r.setName}</span>
                  </td>
                )}
                {columns.includes("rarity") && (
                  <td className={`hidden ${LG} py-1.5`}>
                    <RarityPill rarity={r.rarity} />
                  </td>
                )}
                {columns.includes("domain") && (
                  <td className={`hidden ${LG} py-1.5`}>
                    <DomainPill domain={r.domain} />
                  </td>
                )}
                {columns.includes("type") && <td className={`hidden ${XL} py-1.5 text-ink-muted`}>{r.type}</td>}
                {columns.includes("then") && (
                  <td className={`hidden ${SM} py-1.5 text-right`}>
                    <Money cents={r.then} className="num text-ink-dim" />
                  </td>
                )}
                {columns.includes("now") && (
                  <td className="py-1.5 text-right">
                    <Money cents={r.now} className="num font-semibold text-ink" />
                  </td>
                )}
                {columns.includes("pct") && (
                  <td className="py-1.5 text-right">
                    <DeltaArrow pct={r.pct ?? null} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {shown < sorted.length && (
        <button
          type="button"
          onClick={() => setShown((s) => s + pageSize)}
          className="mt-3 w-full rounded-md border border-line bg-surface-2 py-2 text-[13px] font-semibold text-ink-muted hover:border-line-strong hover:text-ink"
        >
          Show more ({sorted.length - shown} remaining)
        </button>
      )}
    </div>
  );
}
