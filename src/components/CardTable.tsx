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
  /** Current price on whichever series the table is showing. */
  now: number;
  /** The comparison baseline. Omit on tables that aren't showing a change. */
  then?: number;
  /** null when a baseline is missing (a card too new to compare). */
  pct?: number | null;
}

export type ColumnKey = "card" | "set" | "rarity" | "domain" | "type" | "now" | "then" | "pct";

type SortKey = "name" | "set" | "rarity" | "number" | "now" | "then" | "pct";

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
        case "now": return r.now;
        case "then": return r.then ?? 0;
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

  const Th = ({ label, sortKey, align = "left" }: { label: string; sortKey?: SortKey; align?: "left" | "right" }) => (
    <th className={`whitespace-nowrap py-2 font-medium ${align === "right" ? "text-right" : "text-left"}`}>
      {sortKey ? (
        <button
          type="button"
          onClick={() => toggle(sortKey)}
          className={`inline-flex items-center gap-1 hover:text-ink ${sort === sortKey ? "text-ink" : ""}`}
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
      <div className="-mx-4 overflow-x-auto px-4">
        <table className="w-full min-w-[560px] text-[13px]">
          <thead>
            <tr className="border-b border-line text-ink-dim">
              {columns.includes("card") && <Th label="Card" sortKey="name" />}
              {columns.includes("set") && <Th label="Set" sortKey="set" />}
              {columns.includes("rarity") && <Th label="Rarity" sortKey="rarity" />}
              {columns.includes("domain") && <Th label="Domain" />}
              {columns.includes("type") && <Th label="Type" />}
              {columns.includes("then") && <Th label={thenLabel} sortKey="then" align="right" />}
              {columns.includes("now") && <Th label={nowLabel} sortKey="now" align="right" />}
              {columns.includes("pct") && <Th label="Change" sortKey="pct" align="right" />}
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, shown).map((r) => (
              <tr key={r.slug} className="border-b border-line last:border-0 hover:bg-surface-2">
                {columns.includes("card") && (
                  <td className="py-1.5">
                    <Link href={`/card/${r.slug}`} className="flex items-center gap-2.5">
                      <img src={r.thumb} alt="" width={28} height={39} className="h-9 w-7 shrink-0 rounded object-cover" loading="lazy" />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-ink hover:text-accent">{r.name}</span>
                        <span className="block font-mono text-[10.5px] text-ink-dim">{r.collectorLabel}</span>
                      </span>
                    </Link>
                  </td>
                )}
                {columns.includes("set") && (
                  <td className="py-1.5 text-ink-muted">
                    <span className="whitespace-nowrap">{r.setName}</span>
                  </td>
                )}
                {columns.includes("rarity") && (
                  <td className="py-1.5">
                    <RarityPill rarity={r.rarity} />
                  </td>
                )}
                {columns.includes("domain") && (
                  <td className="py-1.5">
                    <DomainPill domain={r.domain} />
                  </td>
                )}
                {columns.includes("type") && <td className="py-1.5 text-ink-muted">{r.type}</td>}
                {columns.includes("then") && (
                  <td className="py-1.5 text-right">
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
