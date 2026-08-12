import Link from "next/link";
import { CARDS, type RiftCard } from "@/lib/catalog";
import {
  movers,
  trendingCards,
  topByMarket,
  totalMarketValue,
  pricedCount,
  latestQuote,
  quoteDaysAgo,
  pctChange,
  HAS_CHANGE_DATA,
  HISTORY_LENGTH,
} from "@/lib/prices";
import { sortedArticles, featuredArticles } from "@/lib/content/articles";
import { SETS } from "@/lib/riftbound";
import { TrendingTile } from "@/components/CardTile";
import { ArticleCard } from "@/components/ArticleCard";
import { CardTable, type CardRow } from "@/components/CardTable";
import { Money } from "@/components/Prefs";
import { Delta, DemoPricesNotice, HistoryNotice, SectionTitle } from "@/components/Bits";

export const revalidate = 3600;

/**
 * Percentage move of the whole market over `days`.
 *
 * Sums only cards priced on BOTH days. Comparing today's full basket against
 * whatever happened to be priced a week ago would report new listings as market
 * growth — the index has to move because prices moved, not because coverage did.
 */
function basketChange(days: number): number | null {
  if (!HAS_CHANGE_DATA) return null;
  let now = 0;
  let then = 0;
  for (const c of CARDS) {
    const a = latestQuote(c).market;
    const b = quoteDaysAgo(c, days).market;
    if (a == null || b == null) continue;
    now += a;
    then += b;
  }
  return pctChange(now, then);
}

function MarketSummary() {
  // Unpriced cards are excluded from the total rather than counted as zero, so
  // "Catalogue value" is the value of what we can actually price — which is why
  // the priced count sits next to it.
  const now = totalMarketValue();
  const priced = pricedCount();
  const day = movers("market", 1, 100);
  const up = day.filter((m) => m.pct > 0).length;
  const down = day.filter((m) => m.pct < 0).length;

  const items = [
    { label: "Catalogue value", node: <Money cents={now} className="num text-xl font-bold text-ink" /> },
    {
      label: "Cards priced",
      node: (
        <span className="num text-xl font-bold text-ink">
          {priced}
          <span className="ml-1 text-[13px] font-normal text-ink-dim">/ {CARDS.length}</span>
        </span>
      ),
    },
    { label: "Sets", node: <span className="num text-xl font-bold text-ink">{SETS.length}</span> },
    {
      label: HAS_CHANGE_DATA ? "7-day change" : "History",
      node: HAS_CHANGE_DATA ? (
        <Delta pct={basketChange(7)} className="text-xl" />
      ) : (
        <span className="num text-xl font-bold text-ink">
          {HISTORY_LENGTH}
          <span className="ml-1 text-[13px] font-normal text-ink-dim">day{HISTORY_LENGTH === 1 ? "" : "s"}</span>
        </span>
      ),
    },
    {
      label: "Up / down today",
      node: HAS_CHANGE_DATA ? (
        <span className="num text-xl font-bold">
          <span className="text-up">{up}</span>
          <span className="mx-1 text-ink-dim">/</span>
          <span className="text-down">{down}</span>
        </span>
      ) : (
        <span className="text-[13px] text-ink-dim">from tomorrow</span>
      ),
    },
  ];

  return (
    <dl className="panel mb-6 grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((i) => (
        <div key={i.label}>
          <dt className="eyebrow">{i.label}</dt>
          <dd className="mt-0.5">{i.node}</dd>
        </div>
      ))}
    </dl>
  );
}

const toRow = (card: RiftCard, now: number | null, then?: number | null, pct?: number | null): CardRow => ({
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
});

export default function HomePage() {
  const articles = sortedArticles();
  const featured = featuredArticles(1)[0];
  const rest = articles.filter((a) => a.slug !== featured?.slug).slice(0, 6);

  // Movement needs two days of history. Until the importer has run twice, the
  // trending row and the movers table fall back to the most valuable cards —
  // real prices, honestly labelled, instead of an empty panel or a fake move.
  const trending = trendingCards(4);
  const topValue = topByMarket(10);

  const moverRows: CardRow[] = HAS_CHANGE_DATA
    ? movers("market", 1, 300).slice(0, 10).map((m) => toRow(m.card, m.now, m.then, m.pct))
    : topValue.map(({ card, cents }) => toRow(card, cents));

  return (
    <div>
      <MarketSummary />

      <section className="mb-8">
        <SectionTitle href="/interests" linkLabel={HAS_CHANGE_DATA ? "All movers" : "Browse all"}>
          {HAS_CHANGE_DATA ? "Trending Cards" : "Most Valuable Cards"}
        </SectionTitle>
        {!HAS_CHANGE_DATA && <HistoryNotice className="mb-3" />}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {HAS_CHANGE_DATA
            ? trending.map((m) => <TrendingTile key={m.card.id} card={m.card} pct={m.pct} />)
            : topValue.slice(0, 4).map(({ card }) => <TrendingTile key={card.id} card={card} />)}
        </div>
        <DemoPricesNotice className="mt-3" />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <SectionTitle href="/news" linkLabel="All articles">
            News &amp; Articles
          </SectionTitle>

          {featured && (
            <div className="mb-4">
              <ArticleCard article={featured} />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {rest.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </section>

        <aside>
          <SectionTitle href="/interests">{HAS_CHANGE_DATA ? "Today's Movers" : "Top by Market"}</SectionTitle>
          <div className="panel p-3.5">
            <CardTable
              rows={moverRows}
              columns={HAS_CHANGE_DATA ? ["card", "now", "pct"] : ["card", "now"]}
              nowLabel="Market"
              initialSort="now"
              pageSize={10}
            />
          </div>

          {/* Ad slot placeholder. Nothing is loaded here — there is no ad network
              wired up, and the site currently sets no cookies at all. If one is
              ever added, CookieNotice has to become a real consent gate first. */}
          <div className="panel mt-4 flex flex-col items-center gap-2 border-dashed p-5 text-center">
            <span className="eyebrow">Advertisement</span>
            <p className="text-[13px] leading-relaxed text-ink-muted">
              This slot is a placeholder — no ads are served on this build.
            </p>
            <Link
              href="/premium"
              className="mt-1 rounded-md bg-accent px-3 py-1.5 text-[12.5px] font-semibold text-accent-ink hover:opacity-90"
            >
              Remove ads with Premium
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
