import type { Metadata } from "next";
import Link from "next/link";
import { allChampions, cardsForChampion } from "@/lib/champions";
import { latestQuote, primaryPrice } from "@/lib/prices";
import { SITE_URL } from "@/lib/site";
import { CardImage } from "@/components/CardImage";
import { Money } from "@/components/Prefs";
import { DemoPricesNotice } from "@/components/Notices";
import { JsonLd, breadcrumbLd } from "@/components/JsonLd";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Riftbound Champions — Cards & Prices by Champion",
  description:
    "Browse Riftbound: League of Legends TCG cards by champion — Ahri, Jinx, Yasuo, Teemo and every other champion's Legends, units, alt arts, Signatures and promos, with daily prices.",
  alternates: { canonical: `${SITE_URL}/champions` },
};

export default function ChampionsPage() {
  const champions = allChampions().map((c) => {
    const ranked = cardsForChampion(c.slug)
      .map((card) => ({ card, cents: primaryPrice(latestQuote(card)) }))
      .sort((a, b) => (b.cents ?? -1) - (a.cents ?? -1));
    return { ...c, top: ranked[0] };
  });

  return (
    <div>
      <JsonLd data={breadcrumbLd([{ name: "Champions", path: "/champions" }])} />
      <header className="mb-5">
        <h1 className="font-display text-3xl uppercase tracking-wide text-ink sm:text-4xl">Champions</h1>
        <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-ink-muted">
          Every League of Legends champion in Riftbound, with all of their printings — Legends, champion units, alt
          arts, Signatures and promos — priced daily. {champions.length} champions so far.
        </p>
      </header>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {champions.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/champions/${c.slug}`}
              className="panel group flex h-full flex-col overflow-hidden transition-colors hover:border-line-strong"
            >
              {c.top && (
                <div className="overflow-hidden bg-surface-2">
                  <CardImage card={c.top.card} className="aspect-[5/7] w-full transition-transform duration-300 group-hover:scale-105" />
                </div>
              )}
              <div className="flex flex-1 flex-col p-2.5">
                <span className="font-display text-[15px] font-semibold leading-tight text-ink group-hover:text-accent">
                  {c.name}
                </span>
                <span className="mt-0.5 text-[11.5px] text-ink-dim">
                  {c.count} printing{c.count === 1 ? "" : "s"}
                  {c.top?.cents != null && (
                    <>
                      {" · top "}
                      <Money cents={c.top.cents} className="num font-semibold text-ink-muted" />
                    </>
                  )}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <DemoPricesNotice className="mt-5" />
    </div>
  );
}
