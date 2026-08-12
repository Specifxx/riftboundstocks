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
    <label className="flex flex-col gap-1 text-[11px] text-ink-dim sm:flex-row sm:items-center sm:gap-1.5 sm:text-[11.5px]">
      <span className="uppercase tracking-wide sm:normal-case sm:tracking-normal">{label}</span>
      <select
        value={params.get(name) ?? "all"}
        onChange={(e) => setParam(name, e.target.value)}
        className="h-9 w-full rounded-md border border-line bg-surface-2 px-2 text-[12px] font-semibold text-ink-muted focus:border-accent sm:h-8 sm:w-auto"
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
    <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg border border-line bg-surface-1 p-2.5 sm:flex sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2">
      <Select name="set" label="Set" options={SETS.map((s) => ({ value: s.slug, label: s.name }))} />
      <Select name="setType" label="Set types" options={SET_TYPES.map((t) => ({ value: t, label: t }))} />
      <Select name="rarity" label="Rarity" options={RARITY_KEYS.map((r) => ({ value: r, label: r }))} />
      <Select name="domain" label="Domain" options={DOMAIN_KEYS.map((d) => ({ value: d, label: d }))} />
      <Select name="min" label="Prices" options={PRICE_FLOORS} />

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push(pathname, { scroll: false })}
          className="col-span-2 h-9 rounded-md border border-line px-2 text-[11.5px] font-semibold text-ink-dim hover:text-ink sm:ml-auto sm:h-auto sm:w-auto sm:py-1"
        >
          Clear
        </button>
      )}
    </div>
  );
}
