import { CARDS } from "@/lib/catalog";
import { movers, trendingCards, latestQuote, quoteDaysAgo, pctChange } from "@/lib/prices";
import { sortedArticles, featuredArticles } from "@/lib/content/articles";
import { SETS } from "@/lib/riftbound";
import { TrendingTile } from "@/components/CardTile";
import { ArticleCard } from "@/components/ArticleCard";
import { CardTable, type CardRow } from "@/components/CardTable";
import { Money } from "@/components/Prefs";
import { Delta, DemoPricesNotice, SectionTitle } from "@/components/Bits";

export const revalidate = 3600;

function MarketSummary() {
  // A one-line read on the whole market: what the catalogue is worth today
  // versus a week ago, and how the day's moves split.
  const now = CARDS.reduce((sum, c) => sum + latestQuote(c).market, 0);
  const then = CARDS.reduce((sum, c) => sum + quoteDaysAgo(c, 7).market, 0);
  const day = movers("market", 1, 100);
  const up = day.filter((m) => m.pct > 0).length;
  const down = day.filter((m) => m.pct < 0).length;

  const items = [
    { label: "Catalogue value", node: <Money cents={now} className="num text-xl font-bold text-ink" /> },
    { label: "7-day change", node: <Delta pct={pctChange(now, then)} className="text-xl" /> },
    { label: "Cards tracked", node: <span className="num text-xl font-bold text-ink">{CARDS.length}</span> },
    { label: "Sets", node: <span className="num text-xl font-bold text-ink">{SETS.length}</span> },
    {
      label: "Up / down today",
      node: (
        <span className="num text-xl font-bold">
          <span className="text-up">{up}</span>
          <span className="mx-1 text-ink-dim">/</span>
          <span className="text-down">{down}</span>
        </span>
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

export default function HomePage() {
  const trending = trendingCards(4);
  const articles = sortedArticles();
  const featured = featuredArticles(1)[0];
  const rest = articles.filter((a) => a.slug !== featured?.slug).slice(0, 6);

  const topMovers: CardRow[] = movers("market", 1, 300)
    .slice(0, 10)
    .map((m) => ({
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
    }));

  return (
    <div>
      <MarketSummary />

      <section className="mb-8">
        <SectionTitle href="/interests" linkLabel="All movers">
          Trending Cards
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {trending.map((m) => (
            <TrendingTile key={m.card.id} card={m.card} pct={m.pct} />
          ))}
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
          <SectionTitle href="/interests">Today&apos;s Movers</SectionTitle>
          <div className="panel p-3.5">
            <CardTable rows={topMovers} columns={["card", "now", "pct"]} nowLabel="Market" pageSize={10} />
          </div>
        </aside>
      </div>
    </div>
  );
}
