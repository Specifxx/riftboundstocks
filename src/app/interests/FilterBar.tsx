"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { SETS, RARITY_KEYS, DOMAIN_KEYS } from "@/lib/riftbound";

const SET_TYPES = ["Core Set", "Starter", "Expansion"];
const PRICE_FLOORS = [
  { value: "1", label: "Over $1" },
  { value: "5", label: "Over $5" },
  { value: "20", label: "Over $20" },
  { value: "50", label: "Over $50" },
];

/**
 * Filters live in the URL rather than component state so a filtered movers view
 * is linkable and server-rendered — the alternative is shipping all 950 cards'
 * movement to the browser so it can filter locally.
 */
export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (!value || value === "all") next.delete(key);
      else next.set(key, value);
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  const Select = ({ name, label, options }: { name: string; label: string; options: { value: string; label: string }[] }) => (
    <label className="flex items-center gap-1.5 text-[11.5px] text-ink-dim">
      {label}
      <select
        value={params.get(name) ?? "all"}
        onChange={(e) => setParam(name, e.target.value)}
        className="h-8 rounded-md border border-line bg-surface-2 px-2 text-[12px] font-semibold text-ink-muted focus:border-accent"
      >
        <option value="all">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );

  const hasFilters = ["set", "setType", "rarity", "domain", "min"].some((k) => params.get(k));

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-line bg-surface-1 p-2.5">
      <Select name="set" label="Set" options={SETS.map((s) => ({ value: s.slug, label: s.name }))} />
      <Select name="setType" label="Set types" options={SET_TYPES.map((t) => ({ value: t, label: t }))} />
      <Select name="rarity" label="Rarity" options={RARITY_KEYS.map((r) => ({ value: r, label: r }))} />
      <Select name="domain" label="Domain" options={DOMAIN_KEYS.map((d) => ({ value: d, label: d }))} />
      <Select name="min" label="Prices" options={PRICE_FLOORS} />

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push(pathname, { scroll: false })}
          className="ml-auto rounded-md border border-line px-2 py-1 text-[11.5px] font-semibold text-ink-dim hover:text-ink"
        >
          Clear
        </button>
      )}
    </div>
  );
}
