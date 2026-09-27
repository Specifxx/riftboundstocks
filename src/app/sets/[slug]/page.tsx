import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SETS, setBySlug } from "@/lib/riftbound";
import { cardsInSet } from "@/lib/catalog";
import { latestQuote, quoteDaysAgo, pctChange, primaryPrice } from "@/lib/prices";
import { formatDate } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { JsonLd, breadcrumbLd } from "@/components/JsonLd";
import { RelatedReading } from "@/components/RiftComparePosts";
import { SetSymbol } from "@/components/SetSymbol";
import { Money } from "@/components/Prefs";
import { Delta } from "@/components/Bits";
import { DemoPricesNotice } from "@/components/Notices";
import { SetBrowser } from "./SetBrowser";
import type { CardRow } from "@/components/CardTable";

export function generateStaticParams() {
  return SETS.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const set = setBySlug(params.slug);
  if (!set) return { title: "Set not found" };
  const count = cardsInSet(set.code).length;
  return {
    title: `Riftbound ${set.name} Price List — All ${count} Cards`,
    description: `Prices for all ${count} cards in Riftbound ${set.name} (${set.code}), the ${set.setType.toLowerCase()} released ${formatDate(`${set.releasedOn}T00:00:00Z`)}: market and foil prices, the most valuable cards, set value and weekly movement.`,
    alternates: { canonical: `${SITE_URL}/sets/${set.slug}` },
  };
}

export default function SetPage({ params }: { params: { slug: string } }) {
  const set = setBySlug(params.slug);
  if (!set) notFound();

  const cards = cardsInSet(set.code);
  // Headline price (lib/prices primaryPrice): Normal market, or foil market for
  // a printing that only exists in foil. Reading `.market` alone left every
  // Showcase, Signature and most promo printings unpriced — which dropped the
  // most valuable cards out of the set total and "Most valuable" entirely.
  const rows: CardRow[] = cards.map((c) => {
    const now = primaryPrice(latestQuote(c));
    const then = primaryPrice(quoteDaysAgo(c, 7));
    return {
      slug: c.slug,
      name: c.name,
      setName: c.setName,
      setCode: c.setCode,
      collectorLabel: c.collectorLabel,
      rarity: c.rarity,
      domain: c.domain,
      type: c.type,
      thumb: c.imageThumbUrl,
      now,
      then,
      pct: pctChange(now, then),
    };
  });

  // Unpriced cards drop out of the aggregates entirely rather than counting as
  // zero, which is why the header reports the priced count alongside the total.
  const prices = rows.map((r) => r.now).filter((v): v is number => v != null);
  const total = prices.reduce((a, b) => a + b, 0);
  const changes = rows.map((r) => r.pct).filter((p): p is number => p != null);
  const avg30 = (() => {
    const ch = cards
      .map((c) => pctChange(primaryPrice(latestQuote(c)), primaryPrice(quoteDaysAgo(c, 30))))
      .filter((p): p is number => p != null);
    return ch.length ? ch.reduce((a, b) => a + b, 0) / ch.length : null;
  })();

  const stats = [
    {
      label: "Cards",
      value: prices.length === cards.length ? String(cards.length) : `${prices.length} / ${cards.length}`,
    },
    { label: "Set value", cents: total },
    { label: "Most valuable", cents: prices.length ? Math.max(...prices) : null },
    { label: "7d average", pct: changes.length ? changes.reduce((a, b) => a + b, 0) / changes.length : null },
    { label: "30d average", pct: avg30 },
  ];

  // Set names as articles write them: "Spirit Forged" is also "Spiritforged".
  const setTerms = [set.name, set.name.replace(/\s+/g, ""), set.name.replace(/^Origins: /, "")];

  return (
    <div>
      <JsonLd
        data={breadcrumbLd([
          { name: "Sets", path: "/sets" },
          { name: set.name, path: `/sets/${set.slug}` },
        ])}
      />
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <SetSymbol code={set.code} size={48} />
          <div>
            <h1 className="font-display text-3xl uppercase tracking-wide text-ink sm:text-4xl">{set.name}</h1>
            <p className="mt-0.5 text-[13px] text-ink-muted">
              {set.setType} · Released {formatDate(`${set.releasedOn}T00:00:00Z`)} · {cards.length} cards
            </p>
          </div>
        </div>

        <dl className="flex flex-wrap gap-x-6 gap-y-2">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="eyebrow">{s.label}</dt>
              <dd className="mt-0.5">
                {"cents" in s && s.cents != null ? (
                  <Money cents={s.cents} className="num text-lg font-bold text-ink" />
                ) : "pct" in s ? (
                  <Delta pct={s.pct ?? null} className="text-lg" />
                ) : (
                  <span className="num text-lg font-bold text-ink">{s.value}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </header>

      <SetBrowser rows={rows} />
      <DemoPricesNotice className="mt-5" />
      {set.setType !== "Promo" && (
        <RelatedReading terms={setTerms} title={`${set.name} news & guides`} limit={5} className="mt-6 max-w-3xl" />
      )}
    </div>
  );
}
