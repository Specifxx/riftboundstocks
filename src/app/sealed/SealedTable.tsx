"use client";

import { useMemo, useState } from "react";
import { Money } from "@/components/Prefs";
import { outboundRel } from "@/lib/affiliate";

/**
 * One sealed product, flattened for the client boundary — everything here has to
 * survive JSON. `buyUrl` arrives pre-wrapped because the Impact deep-link base is
 * a server-only env var; building the affiliate URL in the browser would silently
 * fall back to the hard-coded default and mis-attribute the click.
 */
export interface SealedTableRow {
  productId: number;
  name: string;
  setName: string;
  typeLabel: string;
  presale: boolean;
  /** TCGplayer listed median, in USD cents. null = unpriced, never zero. */
  mid: number | null;
  /** TCGplayer market price, in USD cents. null = unpriced, never zero. */
  market: number | null;
  buyUrl: string;
}

type SortKey = "name" | "set" | "type" | "mid" | "market";

const NUMERIC: SortKey[] = ["mid", "market"];

export function SealedTable({ rows }: { rows: SealedTableRow[] }) {
  const [sort, setSort] = useState<SortKey>("market");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const mul = dir === "asc" ? 1 : -1;
    const numeric = NUMERIC.includes(sort);
    const text = (r: SealedTableRow) => (sort === "set" ? r.setName : sort === "type" ? r.typeLabel : r.name);
    const num = (r: SealedTableRow) => (sort === "mid" ? r.mid : r.market);

    return [...rows].sort((a, b) => {
      if (!numeric) return text(a).localeCompare(text(b)) * mul || a.name.localeCompare(b.name);
      const va = num(a);
      const vb = num(b);
      // Unpriced products stay at the bottom whichever way the column is sorted.
      // They are not worth nothing; they have no figure at all, and sorting them
      // as zero would put them at the top of an ascending price sort.
      if (va == null || vb == null) return va == null ? (vb == null ? 0 : 1) : -1;
      return (va - vb) * mul || a.name.localeCompare(b.name);
    });
  }, [rows, sort, dir]);

  function toggle(key: SortKey) {
    if (sort === key) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSort(key);
    // Prices read best biggest-first; names and labels read best A–Z.
    setDir(NUMERIC.includes(key) ? "desc" : "asc");
  }

  const Th = ({
    label,
    sortKey,
    align = "left",
    cls = "",
  }: {
    label: string;
    sortKey: SortKey;
    align?: "left" | "right";
    cls?: string;
  }) => (
    <th
      scope="col"
      aria-sort={sort === sortKey ? (dir === "asc" ? "ascending" : "descending") : "none"}
      className={`whitespace-nowrap py-2 font-medium ${align === "right" ? "text-right" : "text-left"} ${cls}`}
    >
      <button
        type="button"
        onClick={() => toggle(sortKey)}
        className={`-my-1.5 inline-flex items-center gap-1 py-1.5 hover:text-ink ${sort === sortKey ? "text-ink" : ""}`}
      >
        {label}
        <span aria-hidden className={sort === sortKey ? "text-accent" : "opacity-0"}>
          {dir === "asc" ? "▲" : "▼"}
        </span>
      </button>
    </th>
  );

  return (
    <div className="w-full">
      <table className="w-full table-fixed text-[13px]">
        <thead>
          <tr className="border-b border-line text-ink-dim">
            <Th label="Product" sortKey="name" />
            <Th label="Set" sortKey="set" cls="hidden sm:table-cell" />
            <Th label="Type" sortKey="type" cls="hidden md:table-cell" />
            <Th label="Median" sortKey="mid" align="right" />
            <Th label="Market" sortKey="market" align="right" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.productId} className="border-b border-line last:border-0 hover:bg-surface-2">
              <td className="py-2">
                <a
                  href={r.buyUrl}
                  target="_blank"
                  rel={outboundRel()}
                  className="font-medium text-ink hover:text-accent"
                >
                  {r.name}
                </a>
                {r.presale && (
                  <span className="ml-1.5 rounded bg-accent-soft px-1 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-accent">
                    Presale
                  </span>
                )}
              </td>
              <td className="hidden truncate py-2 pr-2 text-ink-muted sm:table-cell">{r.setName}</td>
              <td className="hidden truncate py-2 pr-2 text-ink-muted md:table-cell">{r.typeLabel}</td>
              <td className="py-2 text-right">
                <Money cents={r.mid} className="num text-ink-dim" />
              </td>
              <td className="py-2 text-right">
                <Money cents={r.market} className="num font-semibold text-ink" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
