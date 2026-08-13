"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CardTable, type CardRow } from "@/components/CardTable";
import { Money } from "@/components/Prefs";
import { Delta } from "@/components/Bits";
import { DOMAIN_KEYS, RARITY_KEYS, domainInfo } from "@/lib/riftbound";
import { normalizeSearch } from "@/lib/format";

function Chip({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-[34px] items-center rounded-md border px-2.5 py-1 text-[11.5px] font-semibold transition-colors sm:min-h-0 sm:px-2 ${
        active ? "border-transparent text-surface-0" : "border-line text-ink-dim hover:text-ink"
      }`}
      style={active ? { backgroundColor: color ?? "rgb(var(--accent))", color: "rgb(var(--accent-ink))" } : undefined}
    >
      {children}
    </button>
  );
}

export function SetBrowser({ rows }: { rows: CardRow[] }) {
  const [rarity, setRarity] = useState<string | null>(null);
  const [domain, setDomain] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [view, setView] = useState<"grid" | "table">("table");

  const visible = useMemo(() => {
    const term = normalizeSearch(q);
    return rows.filter(
      (r) =>
        (!rarity || r.rarity === rarity) &&
        (!domain || r.domain === domain) &&
        (!term || normalizeSearch(r.name).includes(term)),
    );
  }, [rows, rarity, domain, q]);

  return (
    <div>
      <div className="mb-3 space-y-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] uppercase tracking-wide text-ink-dim">Rarity</span>
          <Chip active={!rarity} onClick={() => setRarity(null)}>
            All
          </Chip>
          {RARITY_KEYS.map((r) => (
            <Chip key={r} active={rarity === r} onClick={() => setRarity(rarity === r ? null : r)}>
              {r}
            </Chip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] uppercase tracking-wide text-ink-dim">Domain</span>
          <Chip active={!domain} onClick={() => setDomain(null)}>
            All
          </Chip>
          {DOMAIN_KEYS.map((d) => (
            <Chip
              key={d}
              active={domain === d}
              onClick={() => setDomain(domain === d ? null : d)}
              color={domainInfo(d).color}
            >
              {d}
            </Chip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="min-w-[160px] flex-1 sm:max-w-xs">
            <span className="sr-only">Search this set</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="search"
              placeholder="Search this set"
              className="h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink outline-none placeholder:text-ink-dim focus:border-accent"
            />
          </label>
          <span className="text-[12px] text-ink-dim">{visible.length} cards</span>
          <div className="ml-auto flex gap-1 rounded-md border border-line p-0.5">
            {(["table", "grid"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`inline-flex min-h-[32px] items-center rounded px-3 py-1 text-[11.5px] font-semibold capitalize sm:min-h-0 sm:px-2.5 ${
                  view === v ? "bg-surface-3 text-ink" : "text-ink-dim hover:text-ink"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "table" ? (
        <CardTable
          rows={visible}
          columns={["card", "rarity", "domain", "type", "now", "pct"]}
          nowLabel="Market"
          initialSort="now"
        />
      ) : visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-dim">No cards match these filters.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {visible.map((r) => (
            <li key={r.slug}>
              <Link href={`/card/${r.slug}`} className="group flex flex-col">
                <div className="aspect-[5/7] overflow-hidden rounded-lg border border-line bg-surface-2 group-hover:border-accent">
                  <img src={r.thumb} alt={r.name} className="h-full w-full object-cover" loading="lazy" />
                </div>
                <span className="mt-1.5 truncate text-[12.5px] font-medium text-ink group-hover:text-accent">{r.name}</span>
                <span className="flex items-baseline justify-between gap-2">
                  <Money cents={r.now} className="num text-[13px] font-semibold text-ink" />
                  <Delta pct={r.pct ?? null} className="text-[11px]" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
