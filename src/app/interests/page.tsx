import type { Metadata } from "next";
import Link from "next/link";
import { movers, topByMarket, HAS_CHANGE_DATA, HISTORY_DAYS, type Mover } from "@/lib/prices";
import { SERIES_META, type SeriesKey } from "@/lib/prices/source";
import { setBySlug, SET_BY_CODE } from "@/lib/riftbound";
import { SITE_URL } from "@/lib/site";
import { formatDate } from "@/lib/format";
import { CardTable, type CardRow } from "@/components/CardTable";
import { DemoPricesNotice, HistoryNotice } from "@/components/Notices";
import { FilterBar } from "./FilterBar";

export const metadata: Metadata = {
  title: "Riftbound Price Movers — Biggest Gainers & Losers",
  description:
    "The Riftbound TCG cards that moved most today and this week. Gainers and losers by market price, average price and foil price, filterable by set, rarity and domain.",
  alternates: { canonical: `${SITE_URL}/interests` },
};

export const revalidate = 3600;

// Tabs map onto the four price series a printing carries. "Regular" and "Foil"
// are the average (mid) prices; "Market" and "Market Foil" are the sale-derived
// figures this site headlines.
const TABS: { key: SeriesKey; label: string }[] = [
  { key: "mid", label: "Regular" },
  { key: "foil", label: "Foil" },
  { key: "market", label: "Market" },
  { key: "foilMarket", label: "Market Foil" },
];

type Param = string | string[] | undefined;

interface Query {
  tab?: Param;
  set?: Param;
  setType?: Param;
  rarity?: Param;
  domain?: Param;
  min?: Param;
}

/** A repeated ?key= arrives as an array; take the first rather than crash. */
const one = (v: Param): string | undefined => (Array.isArray(v) ? v[0] : v);

// The FilterBar's floors. Anything else in ?min= is ignored: movers() caches
// per floor, so an arbitrary value would grow that cache without bound (and
// "abc" parsed to NaN, silently disabling the floor).
const PRICE_FLOORS = new Set(["1", "5", "20", "50"]);

function toRow(m: Mover): CardRow {
  return {
    slug: m.card.slug,
    name: m.card.name,
    setName: m.card.setName,
    setCode: m.card.setCode,
    collectorLabel: m.card.collectorLabel,
    rarity: m.card.rarity,
    domain: m.card.domain,
    type: m.card.type,
    thumb: m.card.imageThumbUrl,
    now: m.now,
    then: m.then,
    pct: m.pct,
  };
}

function MoverSection({
  title,
  subtitle,
  gainers,
  losers,
  seriesLabel,
}: {
  title: string;
  subtitle: string;
  gainers: CardRow[];
  losers: CardRow[];
  seriesLabel: string;
}) {
  return (
    <section className="mt-6">
      <div className="mb-3">
        <h2 className="font-display text-xl uppercase tracking-wide text-ink">{title}</h2>
        <p className="text-[12px] text-ink-dim">{subtitle}</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {(
          [
            ["Gainers", gainers],
            ["Losers", losers],
          ] as const
        ).map(([label, rows]) => (
          <div key={label} className="panel p-4">
            <h3 className="eyebrow mb-2">{label}</h3>
            <CardTable
              rows={rows}
              columns={["card", "set", "then", "now", "pct"]}
              nowLabel={`New ${seriesLabel}`}
              thenLabel="Old"
              initialSort="pct"
              initialDir={label === "Gainers" ? "desc" : "asc"}
              pageSize={25}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function InterestsPage({ searchParams: raw }: { searchParams: Query }) {
  const searchParams = {
    tab: one(raw.tab),
    set: one(raw.set),
    setType: one(raw.setType),
    rarity: one(raw.rarity),
    domain: one(raw.domain),
    min: one(raw.min),
  };
  const tab = (TABS.find((t) => t.key === searchParams.tab)?.key ?? "market") as SeriesKey;
  const seriesLabel = SERIES_META[tab].label;

  const setCode = searchParams.set ? setBySlug(searchParams.set)?.code : undefined;
  const minCents = searchParams.min && PRICE_FLOORS.has(searchParams.min) ? Number(searchParams.min) * 100 : 100;

  const matches = (m: Mover) => {
    const c = m.card;
    if (setCode && c.setCode !== setCode) return false;
    if (searchParams.setType && SET_BY_CODE[c.setCode]?.setType !== searchParams.setType) return false;
    if (searchParams.rarity && c.rarity !== searchParams.rarity) return false;
    if (searchParams.domain && c.domain !== searchParams.domain) return false;
    return true;
  };

  function split(days: number) {
    const all = movers(tab, days, minCents).filter(matches);
    return {
      gainers: all.filter((m) => m.pct > 0).slice(0, 25).map(toRow),
      losers: all.filter((m) => m.pct < 0).slice(-25).reverse().map(toRow),
    };
  }

  const daily = split(1);
  const weekly = split(7);
  const monthly = split(30);
  // The day the prices are FROM, not today's date: the snapshot lands in the
  // morning UTC, so "today" was a day ahead of the data for most of the world.
  const asOf = HISTORY_DAYS.length ? `${HISTORY_DAYS[HISTORY_DAYS.length - 1]}T00:00:00Z` : new Date();

  const qs = (key: SeriesKey) => {
    const next = new URLSearchParams(
      Object.entries(searchParams).filter((e): e is [string, string] => typeof e[1] === "string"),
    );
    next.set("tab", key);
    return `/interests?${next.toString()}`;
  };

  return (
    <div>
      <header className="mb-4">
        <h1 className="font-display text-3xl uppercase tracking-wide text-ink sm:text-4xl">
          Riftbound Price Movers — {formatDate(asOf)}
        </h1>
        <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-ink-muted">
          The Riftbound cards that moved most, ranked by percentage change. Cards under the selected price floor are
          excluded — a bulk common doubling from ten cents to twenty is noise, not a move.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-1 border-b border-line">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={qs(t.key)}
            scroll={false}
            className={`-mb-px border-b-2 px-3 py-2 text-[13px] font-semibold transition-colors ${
              tab === t.key ? "border-accent text-accent" : "border-transparent text-ink-dim hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <FilterBar />

      {!HAS_CHANGE_DATA && (
        <div className="mt-6">
          <HistoryNotice />
          <div className="panel mt-4 p-4">
            <h2 className="eyebrow mb-2">Most valuable cards today</h2>
            <CardTable
              rows={topByMarket(50).map(({ card, cents }) => ({
                slug: card.slug,
                name: card.name,
                setName: card.setName,
                setCode: card.setCode,
                collectorLabel: card.collectorLabel,
                rarity: card.rarity,
                domain: card.domain,
                type: card.type,
                thumb: card.imageThumbUrl,
                now: cents,
              }))}
              columns={["card", "set", "rarity", "now"]}
              nowLabel="Market"
              initialSort="now"
            />
          </div>
        </div>
      )}

      {HAS_CHANGE_DATA && (
      <MoverSection
        title="Since yesterday"
        subtitle={`${seriesLabel} price, 24-hour change`}
        gainers={daily.gainers}
        losers={daily.losers}
        seriesLabel={seriesLabel}
      />
      )}

      {HAS_CHANGE_DATA && (
      <MoverSection
        title="Since last week"
        subtitle={`${seriesLabel} price, 7-day change`}
        gainers={weekly.gainers}
        losers={weekly.losers}
        seriesLabel={seriesLabel}
      />
      )}

      {HAS_CHANGE_DATA && (
      <MoverSection
        title="Since last month"
        subtitle={`${seriesLabel} price, 30-day change`}
        gainers={monthly.gainers}
        losers={monthly.losers}
        seriesLabel={seriesLabel}
      />
      )}

      <DemoPricesNotice className="mt-6" />
    </div>
  );
}
