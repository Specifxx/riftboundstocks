"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SetSymbol } from "@/components/SetSymbol";
import { Money } from "@/components/Prefs";
import { Delta } from "@/components/Bits";
import { formatDate, normalizeSearch } from "@/lib/format";

export interface SetSummary {
  code: string;
  name: string;
  slug: string;
  setType: string;
  releasedOn: string;
  cardCount: number;
  /** How many of cardCount TCGplayer actually prices. */
  pricedCount: number;
  totalCents: number;
  /** null when nothing in the set is priced. */
  medianCents: number | null;
  topCents: number | null;
  pct30: number | null;
}

const SORTS = [
  { key: "alpha", label: "Alphabetical" },
  { key: "newest", label: "Newest first" },
  { key: "value", label: "Total value" },
  { key: "size", label: "Card count" },
] as const;

type SortKey = (typeof SORTS)[number]["key"];

export function SetsIndex({ sets }: { sets: SetSummary[] }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("All");
  const [sort, setSort] = useState<SortKey>("alpha");

  const types = useMemo(() => ["All", ...Array.from(new Set(sets.map((s) => s.setType)))], [sets]);

  const visible = useMemo(() => {
    const term = normalizeSearch(q);
    const filtered = sets.filter(
      (s) =>
        (type === "All" || s.setType === type) &&
        (!term || normalizeSearch(s.name).includes(term) || normalizeSearch(s.code).includes(term)),
    );
    const sorted = [...filtered];
    switch (sort) {
      case "alpha": sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "newest": sorted.sort((a, b) => b.releasedOn.localeCompare(a.releasedOn)); break;
      case "value": sorted.sort((a, b) => b.totalCents - a.totalCents); break;
      case "size": sorted.sort((a, b) => b.cardCount - a.cardCount); break;
    }
    return sorted;
  }, [sets, q, type, sort]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <span className="sr-only">Search sets</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            placeholder="Search sets"
            className="h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink outline-none placeholder:text-ink-dim focus:border-accent"
          />
        </label>

        <label className="flex items-center gap-1.5 text-[12px] text-ink-dim">
          Set Types
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-9 rounded-md border border-line bg-surface-2 px-2 text-[12.5px] font-semibold text-ink-muted"
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-[12px] text-ink-dim">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-9 rounded-md border border-line bg-surface-2 px-2 text-[12.5px] font-semibold text-ink-muted"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-dim">No sets match that search.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((s) => (
            <li key={s.code}>
              <Link href={`/sets/${s.slug}`} className="panel flex h-full gap-3 p-3.5 transition-colors hover:border-line-strong">
                <SetSymbol code={s.code} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="truncate font-display text-[16px] font-semibold text-ink">{s.name}</h2>
                    <Delta pct={s.pct30} className="shrink-0 text-[11px]" />
                  </div>
                  <p className="mt-0.5 text-[11px] text-ink-dim">
                    {s.setType} · {s.cardCount} cards
                    {s.pricedCount < s.cardCount && (
                      <span title="TCGplayer has no price for the remainder"> ({s.pricedCount} priced)</span>
                    )}{" "}
                    · {formatDate(`${s.releasedOn}T00:00:00Z`)}
                  </p>
                  <dl className="mt-2.5 grid grid-cols-3 gap-2 border-t border-line pt-2">
                    {(
                      [
                        ["Set value", s.totalCents],
                        ["Median", s.medianCents],
                        ["Top card", s.topCents],
                      ] as const
                    ).map(([label, cents]) => (
                      <div key={label}>
                        <dt className="text-[10px] uppercase tracking-wide text-ink-dim">{label}</dt>
                        <dd>
                          <Money cents={cents} className="num text-[13px] font-semibold text-ink" />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
