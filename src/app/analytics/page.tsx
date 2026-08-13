import type { Metadata } from "next";
import Link from "next/link";
import { CARDS, cardsInSet } from "@/lib/catalog";
import {
  HAS_CHANGE_DATA,
  HISTORY_LENGTH,
  HISTORY_START,
  latestQuote,
  moverSplit,
  pctChange,
  priceHistory,
  pricedCount,
  quoteDaysAgo,
  totalMarketValue,
} from "@/lib/prices";
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
    "The RiftboundStocks Index — a basket tracking the Riftbound TCG singles market — plus per-set performance and median card values across every priced printing, and the week's biggest gainers and losers once enough daily history exists.",
  alternates: { canonical: `${SITE_URL}/analytics` },
};

const DAY_MS = 86_400_000;
const WINDOW_DAYS = 120;
const BASKET_SIZE = 150;

/** Median of the priced cards only; null when a set has no prices at all. */
function median(values: number[]): number | null {
  if (values.length === 0) return null;
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
  // Only cards TCGplayer prices can join the basket — an unpriced constituent
  // would either drop the level to zero or fail the full-coverage filter below.
  const basket = CARDS.filter((c) => eligible.has(c.setCode))
    .flatMap((card) => {
      const market = latestQuote(card).market;
      return market == null ? [] : [{ card, market }];
    })
    .sort((a, b) => b.market - a.market)
    .slice(0, BASKET_SIZE)
    .map((x) => x.card);

  const byDay = new Map<string, { total: number; n: number }>();
  for (const card of basket) {
    for (const p of priceHistory(card).slice(-WINDOW_DAYS)) {
      if (p.market == null) continue;
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
  priced: number;
  medianCents: number | null;
  totalCents: number;
  pct7: number | null;
  pct30: number | null;
}

function setPerformance(): SetPerformance[] {
  return SETS.map((set) => {
    const cards = cardsInSet(set.code);
    const prices = cards.flatMap((c) => {
      const m = latestQuote(c).market;
      return m == null ? [] : [m];
    });
    const changes = (days: number) =>
      HAS_CHANGE_DATA
        ? cards
            .map((c) => pctChange(latestQuote(c).market, quoteDaysAgo(c, days).market))
            .filter((p): p is number => p != null && isFinite(p))
        : [];

    return {
      code: set.code,
      name: set.name,
      slug: set.slug,
      setType: set.setType,
      releasedOn: set.releasedOn,
      cards: cards.length,
      priced: pricedCount(cards),
      medianCents: median(prices),
      totalCents: totalMarketValue(cards),
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
  // A one-day series can't be plotted, so the whole basket build is skipped and
  // the section reports today's level instead of an empty chart.
  const { points, constituents } = HAS_CHANGE_DATA ? buildIndex() : { points: [], constituents: 0 };
  const hasSeries = points.length >= 2;
  const latest = points[points.length - 1];
  const first = points[0];

  const headline = [
    { label: "Index level", value: <Money cents={latest?.market ?? null} className="num text-lg font-bold text-accent sm:text-2xl" /> },
    { label: "7 days", value: <Delta pct={indexChange(points, 7)} className="text-lg sm:text-2xl" /> },
    { label: "30 days", value: <Delta pct={indexChange(points, 30)} className="text-lg sm:text-2xl" /> },
    {
      label: `${points.length} days`,
      value: <Delta pct={first && latest ? pctChange(latest.market, first.market) : null} className="text-lg sm:text-2xl" />,
    },
  ];

  const marketTotal = totalMarketValue();
  const priced = pricedCount();
  const historyStarted = HISTORY_START ? formatDate(`${HISTORY_START}T00:00:00Z`) : null;

  const sets = setPerformance();
  const { gainers, losers } = moverSplit("market", 7, 10, 300);

  return (
    <div>
      <header className="mb-5">
        <h1 className="font-display text-3xl uppercase tracking-wide text-ink sm:text-4xl">Market Analytics</h1>
        <p className="mt-1.5 max-w-3xl text-[14px] leading-relaxed text-ink-muted">
          One figure for the whole singles market, then a breakdown of where the value actually sits — by
          set{HAS_CHANGE_DATA ? ", and by the cards that moved this week." : "."}
        </p>
      </header>

      <section className="panel mb-4 p-4">
        {hasSeries ? (
          <>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-b border-line pb-4">
              <div>
                <h2 className="font-display text-lg uppercase tracking-wide text-ink">RiftboundStocks Index</h2>
                <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-ink-dim">
                  The combined market price of the {constituents} most valuable cards in the catalogue, one point per
                  day. Constituents are fixed for the whole window and must have priced on every day in it, so the line
                  moves only when prices move.
                </p>
              </div>
              {/* Right-aligned only once it sits at the right of the header row.
                  Wrapped onto its own rows on a phone, right alignment leaves
                  each label floating over a value of a different width. */}
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-7 sm:gap-y-2">
                {headline.map((h) => (
                  <div key={h.label} className="min-w-0 sm:text-right">
                    <dt className="eyebrow">{h.label}</dt>
                    <dd>{h.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <PriceChart
              points={points}
              sources={[{ id: "index", label: "RiftboundStocks Index" }]}
              activeSourceId="index"
            />

            <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-ink-dim">
              The index is a basket total, not a rebased score: the y-axis is what the {constituents} cards would cost
              together on that day. Low and Average are drawn on the same value as Market because a basket has one
              figure — the per-series split only exists on individual cards.
            </p>
          </>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-b border-line pb-4">
              <div>
                <h2 className="font-display text-lg uppercase tracking-wide text-ink">RiftboundStocks Index</h2>
                <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-ink-dim">
                  Every printing TCGplayer prices, added together at market price. That is where the market stands
                  today; the tracked line starts once there is a second day to plot it against.
                </p>
              </div>
              {/* Right-aligned only once it sits at the right of the header row.
                  Wrapped onto its own rows on a phone, right alignment leaves
                  each label floating over a value of a different width. */}
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-7 sm:gap-y-2">
                <div className="min-w-0 sm:text-right">
                  <dt className="eyebrow">Index level</dt>
                  <dd>
                    <Money cents={marketTotal} className="num text-lg font-bold text-accent sm:text-2xl" />
                  </dd>
                </div>
                <div className="min-w-0 sm:text-right">
                  <dt className="eyebrow">Cards priced</dt>
                  <dd className="num text-lg font-bold text-ink sm:text-2xl">
                    {priced}
                    <span className="text-[13px] font-normal text-ink-dim"> / {CARDS.length}</span>
                  </dd>
                </div>
                <div className="min-w-0 sm:text-right">
                  <dt className="eyebrow">History</dt>
                  <dd className="num text-lg font-bold text-ink sm:text-2xl">
                    {HISTORY_LENGTH} day{HISTORY_LENGTH === 1 ? "" : "s"}
                  </dd>
                </div>
              </dl>
            </div>

            <p className="py-6 text-center text-[13px] leading-relaxed text-ink-dim">
              The index chart needs at least two days of prices to draw a line. TCGplayer publishes no price history, so
              this series is not backfilled — it starts at the first
              snapshot{historyStarted ? `, taken ${historyStarted},` : ""} and gains a point every day from here.
            </p>

            <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-ink-dim">
              The level above is a basket total, not a rebased score: it is what one of every priced printing in the
              catalogue would cost today. The {CARDS.length - priced} printings TCGplayer has no price for are left out
              rather than counted as zero.
            </p>
          </>
        )}
        <DemoPricesNotice className="mt-2" />
      </section>

      <section id="sets" className="mb-4 scroll-mt-20">
        <SectionTitle href="/sets" linkLabel="All sets">
          Set Performance
        </SectionTitle>
        <Panel>
          <div className="w-full">
            <table className="w-full table-fixed text-[13px]">
              <thead>
                <tr className="border-b border-line text-left text-ink-dim">
                  <th className="py-2 font-medium">Set</th>
                  <th className="hidden py-2 font-medium md:table-cell">Released</th>
                  <th className="hidden py-2 text-right font-medium sm:table-cell">Cards</th>
                  <th className="py-2 text-right font-medium">Median</th>
                  <th className="py-2 text-right font-medium">Set value</th>
                  {HAS_CHANGE_DATA && (
                    <>
                      <th className="py-2 text-right font-medium">7d</th>
                      <th className="py-2 text-right font-medium">30d</th>
                    </>
                  )}
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
                    <td className="hidden whitespace-nowrap py-2 text-ink-muted md:table-cell">
                      {formatDate(`${s.releasedOn}T00:00:00Z`)}
                    </td>
                    <td className="num hidden py-2 text-right text-ink-muted sm:table-cell">
                      {s.cards}
                      {s.priced < s.cards && (
                        <span className="block text-[10.5px] text-ink-dim">{s.priced} priced</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <Money cents={s.medianCents} className="num text-ink-muted" />
                    </td>
                    <td className="py-2 text-right">
                      <Money cents={s.totalCents} className="num font-semibold text-ink" />
                    </td>
                    {HAS_CHANGE_DATA && (
                      <>
                        <td className="py-2 text-right">
                          <DeltaArrow pct={s.pct7} />
                        </td>
                        <td className="py-2 text-right">
                          <DeltaArrow pct={s.pct30} />
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-ink-dim">
            Set value is every printing TCGplayer prices added together at market price — a completionist&apos;s bill,
            not the cost of a playset. Printings with no TCGplayer price are excluded from both the value and the
            median, and the Cards column shows how many of the set that leaves.{" "}
            {HAS_CHANGE_DATA
              ? "The 7d and 30d columns average the percentage change of each card in the set, so every card counts once regardless of price."
              : `Change columns start once a second day of prices exists${historyStarted ? ` — the first was collected ${historyStarted}` : ""}.`}
          </p>
          <DemoPricesNotice className="mt-2" />
        </Panel>
      </section>

      <section>
        <SectionTitle href={HAS_CHANGE_DATA ? "/interests" : undefined} linkLabel="All movers">
          Weekly Movers
        </SectionTitle>
        {HAS_CHANGE_DATA ? (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <MoverList title="Top gainers · 7 days" rows={gainers} tone="up" />
              <MoverList title="Top losers · 7 days" rows={losers} tone="down" />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-ink-dim">
              Cards under $3.00 are excluded: a bulk common drifting a few cents is a large percentage and no
              information.
            </p>
          </>
        ) : (
          <Panel>
            <p className="text-[13px] leading-relaxed text-ink-muted">
              Daily movers begin once a second day of prices has been collected. Only one day exists so
              far{historyStarted ? `, collected ${historyStarted}` : ""}, and there is no earlier price to measure it
              against — so there are no gainers or losers to report yet.
            </p>
          </Panel>
        )}
        <DemoPricesNotice className="mt-2" />
      </section>
    </div>
  );
}
