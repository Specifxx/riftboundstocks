import type { Metadata } from "next";
import Link from "next/link";
import { movers, type Mover } from "@/lib/prices";
import { SERIES_META, type SeriesKey } from "@/lib/prices/source";
import { setBySlug, SET_BY_CODE } from "@/lib/riftbound";
import { SITE_URL } from "@/lib/site";
import { formatDate } from "@/lib/format";
import { CardTable, type CardRow } from "@/components/CardTable";
import { DemoPricesNotice } from "@/components/Bits";
import { FilterBar } from "./FilterBar";

export const metadata: Metadata = {
  title: "Interests — Biggest Riftbound Movers",
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

interface Query {
  tab?: string;
  set?: string;
  setType?: string;
  rarity?: string;
  domain?: string;
  min?: string;
}

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

export default function InterestsPage({ searchParams }: { searchParams: Query }) {
  const tab = (TABS.find((t) => t.key === searchParams.tab)?.key ?? "market") as SeriesKey;
  const seriesLabel = SERIES_META[tab].label;

  const setCode = searchParams.set ? setBySlug(searchParams.set)?.code : undefined;
  const minCents = searchParams.min ? Math.max(100, parseInt(searchParams.min, 10) * 100) : 100;

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
  const today = new Date();

  const qs = (key: SeriesKey) => {
    const next = new URLSearchParams(searchParams as Record<string, string>);
    next.set("tab", key);
    return `/interests?${next.toString()}`;
  };

  return (
    <div>
      <header className="mb-4">
        <h1 className="font-display text-3xl uppercase tracking-wide text-ink sm:text-4xl">
          Interests of {formatDate(today)}
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

      <MoverSection
        title="Since yesterday"
        subtitle={`${seriesLabel} price, 24-hour change`}
        gainers={daily.gainers}
        losers={daily.losers}
        seriesLabel={seriesLabel}
      />

      <MoverSection
        title="Since last week"
        subtitle={`${seriesLabel} price, 7-day change`}
        gainers={weekly.gainers}
        losers={weekly.losers}
        seriesLabel={seriesLabel}
      />

      <DemoPricesNotice className="mt-6" />
    </div>
  );
}
