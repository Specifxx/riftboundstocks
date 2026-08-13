import type { Metadata } from "next";
import Link from "next/link";
import { CARDS, type RiftCard } from "@/lib/catalog";
import { HAS_CHANGE_DATA, HISTORY_START, latestQuote, pctChange, pricedCount, quoteDaysAgo } from "@/lib/prices";
import { CARD_TYPES, DOMAIN_KEYS, RARITY_KEYS, SETS } from "@/lib/riftbound";
import { formatDate, normalizeSearch } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { CardTable, type CardRow, type ColumnKey } from "@/components/CardTable";
import { DemoPricesNotice } from "@/components/Bits";

export const metadata: Metadata = {
  title: "Browse Cards",
  description:
    "Filter all 950 Riftbound TCG printings by domain, card type, rarity and set, then sort by market price or 7-day movement. Every card in Origins, Proving Grounds, Spirit Forged and Unleashed.",
  alternates: { canonical: `${SITE_URL}/browse` },
};

/** The whole catalogue is 950 rows; a cap keeps the client payload sane. */
const MAX_ROWS = 300;

const SORTS = {
  value: { label: "Highest value", key: "now", dir: "desc" },
  change: { label: "7-day gainers", key: "pct", dir: "desc" },
  name: { label: "Name A–Z", key: "name", dir: "asc" },
  number: { label: "Collector number", key: "number", dir: "asc" },
} as const;

type SortId = keyof typeof SORTS;
/** Sorting by change needs a baseline day, so that chip only exists once one does. */
const SORT_IDS = (Object.keys(SORTS) as SortId[]).filter((id) => id !== "change" || HAS_CHANGE_DATA);

const TABLE_COLUMNS: ColumnKey[] = HAS_CHANGE_DATA
  ? ["card", "set", "rarity", "domain", "type", "now", "pct"]
  : ["card", "set", "rarity", "domain", "type", "now"];

type SearchParams = { [key: string]: string | string[] | undefined };

interface Filters {
  domain?: string;
  type?: string;
  rarity?: string;
  set?: string;
  sort: SortId;
  q?: string;
}

function one(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s?.trim() || undefined;
}

function pick(v: string | string[] | undefined, allowed: readonly string[]): string | undefined {
  const s = one(v);
  return s && allowed.includes(s) ? s : undefined;
}

function readFilters(sp: SearchParams): Filters {
  return {
    domain: pick(sp.domain, DOMAIN_KEYS),
    type: pick(sp.type, CARD_TYPES),
    rarity: pick(sp.rarity, RARITY_KEYS),
    set: pick(sp.set, SETS.map((s) => s.code)),
    sort: (pick(sp.sort, SORT_IDS) as SortId | undefined) ?? "value",
    q: one(sp.q)?.slice(0, 60),
  };
}

/**
 * Chip links toggle: clicking the active value removes it rather than re-applying
 * it. Sort is exempt — a list always has an order, so its chips only ever set one.
 */
function hrefWith(f: Filters, key: keyof Filters, value: string | undefined): string {
  const next: Record<string, string> = {};
  for (const [k, v] of Object.entries(f)) {
    if (v && !(k === "sort" && v === "value")) next[k] = String(v);
  }
  if (value == null || (key !== "sort" && next[key] === value)) delete next[key];
  else if (key === "sort" && value === "value") delete next[key];
  else next[key] = value;
  const qs = new URLSearchParams(next).toString();
  return qs ? `/browse?${qs}` : "/browse";
}

/** Descending, with unpriced/unknown rows last in either case — null is missing, not zero. */
function desc(a: number | null, b: number | null): number {
  if (a == null) return b == null ? 0 : 1;
  if (b == null) return -1;
  return b - a;
}

function matches(card: RiftCard, f: Filters, term: string): boolean {
  if (f.domain && card.domain !== f.domain) return false;
  if (f.type && card.type !== f.type) return false;
  if (f.rarity && card.rarity !== f.rarity) return false;
  if (f.set && card.setCode !== f.set) return false;
  if (term && !card.nameNormalized.includes(term)) return false;
  return true;
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[34px] items-center rounded-md border px-2.5 py-1 text-[12px] font-semibold transition-colors sm:min-h-0 sm:px-2 ${
        active
          ? "border-accent bg-accent-soft text-accent"
          : "border-line bg-surface-2 text-ink-muted hover:border-line-strong hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function ChipRow({
  label,
  options,
  active,
  f,
  param,
}: {
  label: string;
  options: { value: string; label: string }[];
  active: string | undefined;
  f: Filters;
  param: keyof Filters;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-1.5 border-b border-line py-2 last:border-0">
      <span className="eyebrow w-20 shrink-0">{label}</span>
      <Chip href={hrefWith(f, param, undefined)} active={!active}>
        All
      </Chip>
      {options.map((o) => (
        <Chip key={o.value} href={hrefWith(f, param, o.value)} active={active === o.value}>
          {o.label}
        </Chip>
      ))}
    </div>
  );
}

export default function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  const f = readFilters(searchParams);
  const term = f.q ? normalizeSearch(f.q) : "";

  const matchedCards = CARDS.filter((c) => matches(c, f, term));
  const matched = matchedCards.map((card) => {
    const now = latestQuote(card).market;
    const then = HAS_CHANGE_DATA ? quoteDaysAgo(card, 7).market : null;
    return { card, now, then, pct: pctChange(now, then) };
  });

  switch (f.sort) {
    case "value": matched.sort((a, b) => desc(a.now, b.now)); break;
    case "change": matched.sort((a, b) => desc(a.pct, b.pct)); break;
    case "name": matched.sort((a, b) => a.card.name.localeCompare(b.card.name)); break;
    case "number":
      matched.sort((a, b) => a.card.setCode.localeCompare(b.card.setCode) || a.card.collectorNumber - b.card.collectorNumber);
      break;
  }

  const rows: CardRow[] = matched.slice(0, MAX_ROWS).map(({ card, now, then, pct }) => ({
    slug: card.slug,
    name: card.name,
    setName: card.setName,
    setCode: card.setCode,
    collectorLabel: card.collectorLabel,
    rarity: card.rarity,
    domain: card.domain,
    type: card.type,
    thumb: card.imageThumbUrl,
    now,
    then,
    pct,
  }));

  const activeCount = [f.domain, f.type, f.rarity, f.set, f.q].filter(Boolean).length;
  const priced = pricedCount(matchedCards);

  return (
    <div>
      <header className="mb-4">
        <h1 className="font-display text-3xl uppercase tracking-wide text-ink sm:text-4xl">Browse Cards</h1>
        <p className="mt-1.5 max-w-3xl text-[14px] leading-relaxed text-ink-muted">
          Every printing in the catalogue, filtered on the server and sortable in the table.{" "}
          {HAS_CHANGE_DATA
            ? "Market price and 7-day change on each row."
            : "Market price on each row; a card TCGplayer does not price shows a dash rather than a zero."}
        </p>
      </header>

      <div className="panel mb-4 p-4">
        {/* A plain GET form — the filters are URL state, so search works with no JS. */}
        <form action="/browse" className="mb-2 flex flex-wrap items-center gap-2">
          {f.domain && <input type="hidden" name="domain" value={f.domain} />}
          {f.type && <input type="hidden" name="type" value={f.type} />}
          {f.rarity && <input type="hidden" name="rarity" value={f.rarity} />}
          {f.set && <input type="hidden" name="set" value={f.set} />}
          {f.sort !== "value" && <input type="hidden" name="sort" value={f.sort} />}
          <label className="min-w-[180px] flex-1 sm:max-w-sm">
            <span className="sr-only">Search card names</span>
            <input
              type="search"
              name="q"
              defaultValue={f.q ?? ""}
              placeholder="Search card names"
              className="h-9 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink outline-none placeholder:text-ink-dim focus:border-accent"
            />
          </label>
          <button
            type="submit"
            className="h-9 rounded-md bg-accent px-3 text-[13px] font-semibold text-accent-ink hover:opacity-90"
          >
            Search
          </button>
          {activeCount > 0 && (
            <Link href="/browse" className="text-[12px] font-semibold text-ink-dim hover:text-accent">
              Clear {activeCount} filter{activeCount === 1 ? "" : "s"}
            </Link>
          )}
        </form>

        <ChipRow
          label="Domain"
          param="domain"
          active={f.domain}
          f={f}
          options={DOMAIN_KEYS.map((d) => ({ value: d, label: d }))}
        />
        <ChipRow
          label="Type"
          param="type"
          active={f.type}
          f={f}
          options={CARD_TYPES.map((t) => ({ value: t, label: t }))}
        />
        <ChipRow
          label="Rarity"
          param="rarity"
          active={f.rarity}
          f={f}
          options={RARITY_KEYS.map((r) => ({ value: r, label: r }))}
        />
        <ChipRow
          label="Set"
          param="set"
          active={f.set}
          f={f}
          options={SETS.map((s) => ({ value: s.code, label: s.name }))}
        />
        <div className="flex flex-wrap items-baseline gap-1.5 py-2">
          <span className="eyebrow w-20 shrink-0">Sort</span>
          {SORT_IDS.map((id) => (
            <Chip key={id} href={hrefWith(f, "sort", id)} active={f.sort === id}>
              {SORTS[id].label}
            </Chip>
          ))}
        </div>
      </div>

      <section className="panel p-4">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg uppercase tracking-wide text-ink">
            {matched.length} card{matched.length === 1 ? "" : "s"}
            {f.q && <span className="ml-2 text-[13px] font-normal normal-case text-ink-dim">matching “{f.q}”</span>}
          </h2>
          <span className="flex flex-wrap gap-x-3 text-[11px] text-ink-dim">
            {priced < matched.length && (
              <span>
                {priced} of {matched.length} priced — TCGplayer lists no price for the rest.
              </span>
            )}
            {matched.length > MAX_ROWS && (
              <span>
                Showing the top {MAX_ROWS} by {SORTS[f.sort].label.toLowerCase()} — narrow the filters to see the rest.
              </span>
            )}
          </span>
        </div>

        <CardTable
          rows={rows}
          columns={TABLE_COLUMNS}
          nowLabel="Market"
          initialSort={SORTS[f.sort].key}
          initialDir={SORTS[f.sort].dir}
        />

        {!HAS_CHANGE_DATA && (
          <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-ink-dim">
            No change column yet: price history begins
            {HISTORY_START ? ` ${formatDate(`${HISTORY_START}T00:00:00Z`)}` : " with the first import"}, and a 7-day
            move needs a second day of prices to compare against.
          </p>
        )}

        <DemoPricesNotice className="mt-3 border-t border-line pt-3" />
      </section>
    </div>
  );
}
