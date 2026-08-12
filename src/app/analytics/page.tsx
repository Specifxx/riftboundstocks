import type { Metadata } from "next";
import Link from "next/link";
import { CARDS, cardsInSet } from "@/lib/catalog";
import { latestQuote, moverSplit, pctChange, priceHistory, quoteDaysAgo } from "@/lib/prices";
import type { PriceSnapshot } from "@/lib/prices/source";
import { SETS } from "@/lib/riftbound";
import { formatDate } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { PriceChart } from "@/components/PriceChart";
import { Money } from "@/components/Prefs";
import { Delta, DeltaArrow, DemoPricesNotice, Panel, RarityPill, SectionTitle } from "@/components/Bits";

export const metadata: Metadata = {
  title: "Market Analytics",
  description:
    "The RiftboundStocks Index — a 150-card basket tracking the Riftbound TCG singles market over 120 days — plus per-set performance, median card values and the week's biggest gainers and losers.",
  alternates: { canonical: `${SITE_URL}/analytics` },
};

const DAY_MS = 86_400_000;
const WINDOW_DAYS = 120;
const BASKET_SIZE = 150;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Index constituents.
 *
 * A card can't trade before its set is out, so a set released inside the window
 * has no price on the window's early days. Admitting one mid-window would put a
 * step in the index that reads as a market move but is really just a card
 * appearing — so eligibility requires a full window of history.
 */
function eligibleSetCodes(): Set<string> {
  const now = Date.now();
  return new Set(
    SETS.filter((s) => (now - Date.parse(`${s.releasedOn}T00:00:00Z`)) / DAY_MS >= WINDOW_DAYS).map((s) => s.code),
  );
}

interface IndexSeries {
  points: PriceSnapshot[];
  constituents: number;
}

function buildIndex(): IndexSeries {
  const eligible = eligibleSetCodes();
  const basket = CARDS.filter((c) => eligible.has(c.setCode))
    .map((card) => ({ card, market: latestQuote(card).market }))
    .sort((a, b) => b.market - a.market)
    .slice(0, BASKET_SIZE)
    .map((x) => x.card);

  const byDay = new Map<string, { total: number; n: number }>();
  for (const card of basket) {
    for (const p of priceHistory(card).slice(-WINDOW_DAYS)) {
      const entry = byDay.get(p.day) ?? { total: 0, n: 0 };
      entry.total += p.market;
      entry.n += 1;
      byDay.set(p.day, entry);
    }
  }

  const points = [...byDay.entries()]
    // Only days every constituent priced — a partial day is a lower sum, not a drop.
    .filter(([, e]) => e.n === basket.length)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, e]): PriceSnapshot => ({ day, low: e.total, mid: e.total, market: e.total, foil: null, foilMarket: null }));

  return { points, constituents: basket.length };
}

function indexChange(points: PriceSnapshot[], daysAgo: number): number | null {
  const last = points[points.length - 1];
  const prior = points[points.length - 1 - daysAgo];
  if (!last || !prior) return null;
  return pctChange(last.market, prior.market);
}

interface SetPerformance {
  code: string;
  name: string;
  slug: string;
  setType: string;
  releasedOn: string;
  cards: number;
  medianCents: number;
  totalCents: number;
  pct7: number | null;
  pct30: number | null;
}

function setPerformance(): SetPerformance[] {
  return SETS.map((set) => {
    const cards = cardsInSet(set.code);
    const prices = cards.map((c) => latestQuote(c).market);
    const changes = (days: number) =>
      cards
        .map((c) => pctChange(latestQuote(c).market, quoteDaysAgo(c, days).market))
        .filter((p): p is number => p != null && isFinite(p));

    return {
      code: set.code,
      name: set.name,
      slug: set.slug,
      setType: set.setType,
      releasedOn: set.releasedOn,
      cards: cards.length,
      medianCents: median(prices),
      totalCents: prices.reduce((a, b) => a + b, 0),
      pct7: mean(changes(7)),
      pct30: mean(changes(30)),
    };
  }).sort((a, b) => b.totalCents - a.totalCents);
}

function MoverList({ title, rows, tone }: { title: string; rows: ReturnType<typeof moverSplit>["gainers"]; tone: "up" | "down" }) {
  return (
    <Panel>
      <h3 className={`eyebrow mb-3 ${tone === "up" ? "text-up" : "text-down"}`}>{title}</h3>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-ink-dim">Nothing moved enough to report this week.</p>
      ) : (
        <ol className="space-y-0.5">
          {rows.map((m, i) => (
            <li key={m.card.slug}>
              <Link
                href={`/card/${m.card.slug}`}
                className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 hover:bg-surface-2"
              >
                <span className="num w-4 shrink-0 text-right text-[11px] text-ink-dim">{i + 1}</span>
                <img
                  src={m.card.imageThumbUrl}
                  alt=""
                  width={28}
                  height={39}
                  loading="lazy"
                  className="h-9 w-7 shrink-0 rounded object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ink">{m.card.name}</span>
                  <span className="block truncate text-[11px] text-ink-dim">
                    {m.card.setName} · <span className="font-mono">{m.card.collectorLabel}</span>
                  </span>
                </span>
                <span className="hidden shrink-0 sm:block">
                  <RarityPill rarity={m.card.rarity} />
                </span>
                <span className="shrink-0 text-right">
                  <Money cents={m.now} className="num block text-[13px] font-semibold text-ink" />
                  <span className="block text-[11px]">
                    <DeltaArrow pct={m.pct} />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

export default function AnalyticsPage() {
  const { points, constituents } = buildIndex();
  const latest = points[points.length - 1];
  const first = points[0];

  const headline = [
    { label: "Index level", value: <Money cents={latest?.market ?? 0} className="num text-2xl font-bold text-accent" /> },
    { label: "7 days", value: <Delta pct={indexChange(points, 7)} className="text-2xl" /> },
    { label: "30 days", value: <Delta pct={indexChange(points, 30)} className="text-2xl" /> },
    {
      label: `${points.length} days`,
      value: <Delta pct={first && latest ? pctChange(latest.market, first.market) : null} className="text-2xl" />,
    },
  ];

  const sets = setPerformance();
  const { gainers, losers } = moverSplit("market", 7, 10, 300);

  return (
    <div>
      <header className="mb-5">
        <h1 className="font-display text-3xl uppercase tracking-wide text-ink sm:text-4xl">Market Analytics</h1>
        <p className="mt-1.5 max-w-3xl text-[14px] leading-relaxed text-ink-muted">
          One line for the whole singles market, then a breakdown of where the value actually sits — by set, and by the
          cards that moved this week.
        </p>
      </header>

      <section className="panel mb-4 p-4">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-b border-line pb-4">
          <div>
            <h2 className="font-display text-lg uppercase tracking-wide text-ink">RiftboundStocks Index</h2>
            <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-ink-dim">
              The combined market price of the {constituents} most valuable cards in the catalogue, one point per day.
              Constituents are fixed for the whole window and must have priced on every day in it, so the line moves only
              when prices move.
            </p>
          </div>
          <dl className="flex flex-wrap gap-x-7 gap-y-2">
            {headline.map((h) => (
              <div key={h.label} className="text-right">
                <dt className="eyebrow">{h.label}</dt>
                <dd>{h.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {points.length < 2 ? (
          <p className="py-8 text-center text-sm text-ink-dim">Not enough overlapping history to build the index.</p>
        ) : (
          <PriceChart
            points={points}
            sources={[{ id: "index", label: "RiftboundStocks Index" }]}
            activeSourceId="index"
          />
        )}

        <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-ink-dim">
          The index is a basket total, not a rebased score: the y-axis is what the {constituents} cards would cost
          together on that day. Low and Average are drawn on the same value as Market because a basket has one figure —
          the per-series split only exists on individual cards.
        </p>
        <DemoPricesNotice className="mt-2" />
      </section>

      <section id="sets" className="mb-4 scroll-mt-20">
        <SectionTitle href="/sets" linkLabel="All sets">
          Set Performance
        </SectionTitle>
        <Panel>
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead>
                <tr className="border-b border-line text-left text-ink-dim">
                  <th className="py-2 font-medium">Set</th>
                  <th className="py-2 font-medium">Released</th>
                  <th className="py-2 text-right font-medium">Cards</th>
                  <th className="py-2 text-right font-medium">Median</th>
                  <th className="py-2 text-right font-medium">Set value</th>
                  <th className="py-2 text-right font-medium">7d</th>
                  <th className="py-2 text-right font-medium">30d</th>
                </tr>
              </thead>
              <tbody>
                {sets.map((s) => (
                  <tr key={s.code} className="border-b border-line last:border-0 hover:bg-surface-2">
                    <td className="py-2">
                      <Link href={`/sets/${s.slug}`} className="font-medium text-ink hover:text-accent">
                        {s.name}
                      </Link>
                      <span className="ml-2 font-mono text-[10.5px] text-ink-dim">{s.code}</span>
                      <span className="block text-[11px] text-ink-dim">{s.setType}</span>
                    </td>
                    <td className="whitespace-nowrap py-2 text-ink-muted">
                      {formatDate(`${s.releasedOn}T00:00:00Z`)}
                    </td>
                    <td className="num py-2 text-right text-ink-muted">{s.cards}</td>
                    <td className="py-2 text-right">
                      <Money cents={s.medianCents} className="num text-ink-muted" />
                    </td>
                    <td className="py-2 text-right">
                      <Money cents={s.totalCents} className="num font-semibold text-ink" />
                    </td>
                    <td className="py-2 text-right">
                      <DeltaArrow pct={s.pct7} />
                    </td>
                    <td className="py-2 text-right">
                      <DeltaArrow pct={s.pct30} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-ink-dim">
            Set value is every printing in the catalogue added together at market price — a completionist&apos;s bill,
            not the cost of a playset. The 7d and 30d columns average the percentage change of each card in the set, so
            every card counts once regardless of price.
          </p>
          <DemoPricesNotice className="mt-2" />
        </Panel>
      </section>

      <section>
        <SectionTitle href="/interests" linkLabel="All movers">
          Weekly Movers
        </SectionTitle>
        <div className="grid gap-4 lg:grid-cols-2">
          <MoverList title="Top gainers · 7 days" rows={gainers} tone="up" />
          <MoverList title="Top losers · 7 days" rows={losers} tone="down" />
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-ink-dim">
          Cards under $3.00 are excluded: a bulk common drifting a few cents is a large percentage and no information.
        </p>
        <DemoPricesNotice className="mt-2" />
      </section>
    </div>
  );
}
