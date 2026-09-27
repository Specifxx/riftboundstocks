import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allChampions, cardsForChampion, championBySlug } from "@/lib/champions";
import { latestQuote, primaryPrice, quoteDaysAgo, pctChange, HAS_CHANGE_DATA } from "@/lib/prices";
import { banFor } from "@/lib/banlist";
import { riftcompareUrl } from "@/lib/affiliate";
import { formatMoney } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import type { RiftCard } from "@/lib/catalog";
import { CardTable, type CardRow } from "@/components/CardTable";
import { CardImage } from "@/components/CardImage";
import { Money } from "@/components/Prefs";
import { Delta } from "@/components/Bits";
import { DemoPricesNotice } from "@/components/Notices";
import { JsonLd, breadcrumbLd } from "@/components/JsonLd";
import { RelatedReading } from "@/components/RiftComparePosts";

export const revalidate = 3600;

export function generateStaticParams() {
  return allChampions().map((c) => ({ slug: c.slug }));
}
export const dynamicParams = false;

// RiftCompare slugs champions with every non-alphanumeric run → "-", so
// "Kai'Sa" is "kai-sa" there (and "kaisa" here).
const rcSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const byPrice = (cards: RiftCard[]) =>
  cards
    .map((card) => ({ card, cents: primaryPrice(latestQuote(card)) }))
    .sort((a, b) => (b.cents ?? -1) - (a.cents ?? -1));

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const champ = championBySlug(params.slug);
  if (!champ) return { title: "Champion not found" };
  const ranked = byPrice(cardsForChampion(champ.slug));
  const top = ranked[0];
  const priced = ranked.filter((r) => r.cents != null);
  const title = `${champ.name} Riftbound Cards — Every Printing & Price`;
  const description =
    `All ${ranked.length} ${champ.name} printings in Riftbound: League of Legends TCG — Legends, champion units, alt arts, ` +
    `Signatures and promos, with daily TCGplayer prices.` +
    (top?.cents != null && priced.length > 1
      ? ` Most valuable: ${top.card.name} (${top.card.setCode}) at ${formatMoney(top.cents)}; cheapest from ${formatMoney(priced[priced.length - 1].cents!)}.`
      : "");
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/champions/${champ.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/champions/${champ.slug}`,
      images: top ? [{ url: top.card.imageUrl, alt: top.card.name }] : undefined,
    },
  };
}

export default function ChampionPage({ params }: { params: { slug: string } }) {
  const champ = championBySlug(params.slug);
  if (!champ) notFound();

  const cards = cardsForChampion(champ.slug);
  const ranked = byPrice(cards);
  const priced = ranked.filter((r) => r.cents != null);
  const hero = ranked[0]?.card;
  const legends = cards.filter((c) => c.type === "Legend");
  const sets = [...new Set(cards.map((c) => c.setName))];
  const banned = cards.filter((c) => banFor(c));

  // One of each printing, and how that basket moved over a week — summed over
  // printings priced on BOTH days so a new listing doesn't read as a rise.
  const basket = priced.reduce((s, r) => s + r.cents!, 0);
  let now7 = 0;
  let then7 = 0;
  for (const c of cards) {
    const a = primaryPrice(latestQuote(c));
    const b = primaryPrice(quoteDaysAgo(c, 7));
    if (a == null || b == null) continue;
    now7 += a;
    then7 += b;
  }
  const weekPct = HAS_CHANGE_DATA ? pctChange(now7, then7) : null;

  const rows: CardRow[] = cards.map((card) => {
    const now = primaryPrice(latestQuote(card));
    const then = HAS_CHANGE_DATA ? primaryPrice(quoteDaysAgo(card, 7)) : null;
    return {
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
      pct: pctChange(now, then),
    };
  });

  const others = allChampions().filter((c) => c.slug !== champ.slug);

  return (
    <div>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Champions", path: "/champions" },
            { name: champ.name, path: `/champions/${champ.slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `${champ.name} Riftbound cards`,
            url: `${SITE_URL}/champions/${champ.slug}`,
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: ranked.length,
              itemListElement: ranked.slice(0, 30).map((r, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: `${SITE_URL}/card/${r.card.slug}`,
                name: `${r.card.name} (${r.card.setCode} ${r.card.collectorLabel})`,
              })),
            },
          },
        ]}
      />

      <nav className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-dim">
        <Link href="/champions" className="hover:text-accent">
          Champions
        </Link>
        <span>/</span>
        <span>{champ.name}</span>
      </nav>

      <header className="mb-5 flex flex-wrap items-start gap-5 border-b border-line pb-5">
        {hero && (
          <div className="hidden w-[120px] shrink-0 overflow-hidden rounded-lg bg-surface-2 sm:block">
            <CardImage card={hero} priority className="aspect-[5/7] w-full" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-[40px]">
            {champ.name} Riftbound Cards
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-muted">
            Every {champ.name} printing in Riftbound: League of Legends TCG — {cards.length} in all
            {legends.length > 0 && <> including {legends.length} Legend{legends.length === 1 ? "" : "s"}</>}, across{" "}
            {sets.join(", ")}. Prices are TCGplayer market (foil market for foil-only printings), updated daily.
          </p>
          <dl className="mt-4 flex flex-wrap gap-x-7 gap-y-3">
            <div>
              <dt className="eyebrow">One of each</dt>
              <dd>
                <Money cents={basket} className="num text-2xl font-bold text-ink" />
              </dd>
            </div>
            {ranked[0]?.cents != null && (
              <div>
                <dt className="eyebrow">Most valuable</dt>
                <dd>
                  <Money cents={ranked[0].cents} className="num text-2xl font-bold text-accent" />
                </dd>
              </div>
            )}
            {priced.length > 1 && (
              <div>
                <dt className="eyebrow">Cheapest</dt>
                <dd>
                  <Money cents={priced[priced.length - 1].cents} className="num text-2xl font-bold text-ink" />
                </dd>
              </div>
            )}
            {weekPct != null && (
              <div>
                <dt className="eyebrow">7-day change</dt>
                <dd>
                  <Delta pct={weekPct} className="text-2xl" />
                </dd>
              </div>
            )}
          </dl>
          {banned.length > 0 && (
            <p className="mt-3 text-[12.5px] text-ink-muted">
              <strong className="font-semibold text-down">Banned:</strong>{" "}
              {[...new Set(banned.map((c) => c.name.replace(/\s*\([^)]*\)/g, "")))].join(", ")} — see the card page for
              which formats.
            </p>
          )}
        </div>
      </header>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0">
          <h2 className="mb-3 font-display text-xl uppercase tracking-wide text-ink">All printings</h2>
          <div className="panel p-3.5">
            <CardTable
              rows={rows}
              columns={HAS_CHANGE_DATA ? ["card", "set", "rarity", "now", "pct"] : ["card", "set", "rarity", "now"]}
              nowLabel="Price"
              initialSort="now"
              pageSize={60}
            />
          </div>
          <DemoPricesNotice className="mt-3" />
        </section>

        <aside className="min-w-0 space-y-4">
          <RelatedReading terms={[champ.name]} title={`${champ.name} in the news`} limit={5} />
          <section className="panel p-4">
            <h2 className="eyebrow mb-2">Shop {champ.name}</h2>
            <p className="text-[13px] leading-relaxed text-ink-muted">
              Compare live store prices for every {champ.name} card in the US, UK, EU, Australia, Canada and Singapore.
            </p>
            <a
              href={riftcompareUrl(`/champions/${rcSlug(champ.name)}`, "champion")}
              target="_blank"
              rel="noopener"
              className="mt-2.5 inline-block rounded-md border border-line px-2.5 py-1 text-[12px] font-semibold text-accent hover:border-accent"
            >
              {champ.name} on RiftCompare ↗
            </a>
          </section>
        </aside>
      </div>

      <section className="mt-10">
        <h2 className="mb-3 font-display text-xl uppercase tracking-wide text-ink">Other champions</h2>
        <p className="flex flex-wrap gap-x-3 gap-y-1.5 text-[13px]">
          {others.map((c) => (
            <Link key={c.slug} href={`/champions/${c.slug}`} className="text-ink-muted hover:text-accent">
              {c.name}
            </Link>
          ))}
        </p>
      </section>
    </div>
  );
}
