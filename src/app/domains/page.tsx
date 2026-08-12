import type { Metadata } from "next";
import Link from "next/link";
import { CARDS, type RiftCard } from "@/lib/catalog";
import { latestQuote, pctChange, quoteDaysAgo } from "@/lib/prices";
import { DOMAINS, DOMAIN_KEYS, type DomainKey } from "@/lib/riftbound";
import { SITE_URL } from "@/lib/site";
import { CardGridTile } from "@/components/CardTile";
import { Money } from "@/components/Prefs";
import { Delta, DemoPricesNotice } from "@/components/Bits";

export const metadata: Metadata = {
  title: "Riftbound Domains",
  description:
    "All seven Riftbound domains — Fury, Calm, Mind, Body, Chaos, Order and Colorless — with card counts, median and total market value, 30-day performance and the most valuable card in each.",
  alternates: { canonical: `${SITE_URL}/domains` },
};

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

interface DomainSummary {
  key: DomainKey;
  cards: number;
  medianCents: number;
  totalCents: number;
  pct30: number | null;
  top: RiftCard[];
}

function summarise(key: DomainKey): DomainSummary {
  const cards = CARDS.filter((c) => c.domain === key);
  const priced = cards
    .map((card) => ({ card, market: latestQuote(card).market }))
    .sort((a, b) => b.market - a.market);

  const changes = cards
    .map((c) => pctChange(latestQuote(c).market, quoteDaysAgo(c, 30).market))
    .filter((p): p is number => p != null && isFinite(p));

  return {
    key,
    cards: cards.length,
    medianCents: median(priced.map((p) => p.market)),
    totalCents: priced.reduce((a, b) => a + b.market, 0),
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
      </header>

      <div className="grid gap-4 xl:grid-cols-2">
        {summaries.map((d) => {
          const info = DOMAINS[d.key];
          return (
            <section key={d.key} className="panel p-4">
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

              <dl className="grid grid-cols-2 gap-3 border-b border-line py-3 sm:grid-cols-4">
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
                </div>
                <div>
                  <dt className="eyebrow">30 days</dt>
                  <dd>
                    <Delta pct={d.pct30} className="text-[15px]" />
                  </dd>
                </div>
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
