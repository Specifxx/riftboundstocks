import type { Metadata } from "next";
import Link from "next/link";
import { CARDS, type RiftCard } from "@/lib/catalog";
import {
  HAS_CHANGE_DATA,
  HISTORY_START,
  latestQuote,
  pctChange,
  pricedCount,
  quoteDaysAgo,
  totalMarketValue,
} from "@/lib/prices";
import { DOMAINS, DOMAIN_KEYS, type DomainKey } from "@/lib/riftbound";
import { formatDate } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { CardGridTile } from "@/components/CardTile";
import { Money } from "@/components/Prefs";
import { Delta, DemoPricesNotice } from "@/components/Bits";

export const metadata: Metadata = {
  title: "Riftbound Domains",
  description:
    "All seven Riftbound domains — Fury, Calm, Mind, Body, Chaos, Order and Colorless — with card counts, median and total market value across every priced printing, the most valuable cards in each, and 30-day performance once enough daily history exists.",
  alternates: { canonical: `${SITE_URL}/domains` },
};

/** Median of the priced cards only; null when the domain has none. */
function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

interface DomainSummary {
  key: DomainKey;
  cards: number;
  priced: number;
  medianCents: number | null;
  totalCents: number;
  pct30: number | null;
  top: RiftCard[];
}

function summarise(key: DomainKey): DomainSummary {
  const cards = CARDS.filter((c) => c.domain === key);
  // Unpriced printings are dropped here rather than counted as zero: they would
  // pull the median down and sit at the top of a cheapest-first sort.
  const priced = cards
    .flatMap((card) => {
      const market = latestQuote(card).market;
      return market == null ? [] : [{ card, market }];
    })
    .sort((a, b) => b.market - a.market);

  const changes = HAS_CHANGE_DATA
    ? cards
        .map((c) => pctChange(latestQuote(c).market, quoteDaysAgo(c, 30).market))
        .filter((p): p is number => p != null && isFinite(p))
    : [];

  return {
    key,
    cards: cards.length,
    priced: pricedCount(cards),
    medianCents: median(priced.map((p) => p.market)),
    totalCents: totalMarketValue(cards),
    pct30: changes.length ? changes.reduce((a, b) => a + b, 0) / changes.length : null,
    top: priced.slice(0, 3).map((p) => p.card),
  };
}

export default function DomainsPage() {
  const summaries = DOMAIN_KEYS.map(summarise);

  return (
    <div>
      <header className="mb-5">
        <h1 className="font-display text-3xl uppercase tracking-wide text-ink sm:text-4xl">Domains</h1>
        <p className="mt-1.5 max-w-3xl text-[14px] leading-relaxed text-ink-muted">
          Riftbound&apos;s seven domains, sized by what their cards are worth. Each panel shows how many printings the
          catalogue holds, what the middle of that pile costs, and the three most valuable cards carrying the domain.
        </p>
        {!HAS_CHANGE_DATA && (
          <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-ink-dim">
            No 30-day column yet: price history
            begins{HISTORY_START ? ` ${formatDate(`${HISTORY_START}T00:00:00Z`)}` : " with the first import"}, so there
            is no earlier day to measure a domain against. Totals and medians below cover only the cards TCGplayer
            prices.
          </p>
        )}
      </header>

      <div className="grid gap-4 xl:grid-cols-2">
        {summaries.map((d) => {
          const info = DOMAINS[d.key];
          return (
            // Anchor target for the homepage Domain Heat board's per-domain links.
            <section key={d.key} id={d.key.toLowerCase()} className="panel scroll-mt-20 p-4">
              <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 border-b border-line pb-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden
                    className="h-10 w-10 shrink-0 rounded-lg border border-line"
                    style={{ backgroundColor: info.color }}
                  />
                  <div className="min-w-0">
                    <h2 className="font-display text-xl uppercase tracking-wide" style={{ color: info.color }}>
                      {info.label}
                    </h2>
                    <p className="text-[12px] text-ink-muted">{info.tagline}</p>
                  </div>
                </div>
                <Link
                  href={`/browse?domain=${d.key}`}
                  className="shrink-0 rounded-md border border-line px-2.5 py-1.5 text-[12px] font-semibold text-accent hover:border-accent"
                >
                  Browse {d.cards} cards →
                </Link>
              </header>

              <dl
                className={`grid grid-cols-2 gap-3 border-b border-line py-3 ${
                  HAS_CHANGE_DATA ? "sm:grid-cols-4" : "sm:grid-cols-3"
                }`}
              >
                <div>
                  <dt className="eyebrow">Cards</dt>
                  <dd className="num text-[15px] font-semibold text-ink">{d.cards}</dd>
                </div>
                <div>
                  <dt className="eyebrow">Median</dt>
                  <dd>
                    <Money cents={d.medianCents} className="num text-[15px] font-semibold text-ink" />
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow">Total value</dt>
                  <dd>
                    <Money cents={d.totalCents} className="num text-[15px] font-semibold text-ink" />
                  </dd>
                  <dd className="text-[10.5px] text-ink-dim">
                    {d.priced === d.cards ? "all cards priced" : `${d.priced} of ${d.cards} priced`}
                  </dd>
                </div>
                {HAS_CHANGE_DATA && (
                  <div>
                    <dt className="eyebrow">30 days</dt>
                    <dd>
                      <Delta pct={d.pct30} className="text-[15px]" />
                    </dd>
                  </div>
                )}
              </dl>

              <h3 className="eyebrow mb-2.5 mt-3">Most valuable</h3>
              <ul className="grid grid-cols-3 gap-3">
                {d.top.map((card) => (
                  <li key={card.slug}>
                    <CardGridTile card={card} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <DemoPricesNotice className="mt-5" />
    </div>
  );
}
