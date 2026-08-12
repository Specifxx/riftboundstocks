import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SETS, setBySlug } from "@/lib/riftbound";
import { cardsInSet } from "@/lib/catalog";
import { latestQuote, quoteDaysAgo, pctChange } from "@/lib/prices";
import { formatDate } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { SetSymbol } from "@/components/SetSymbol";
import { Money } from "@/components/Prefs";
import { Delta, DemoPricesNotice } from "@/components/Bits";
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
    title: `${set.name} — Card Prices`,
    description: `All ${count} cards in ${set.name} (${set.code}), the Riftbound TCG ${set.setType.toLowerCase()} released ${formatDate(`${set.releasedOn}T00:00:00Z`)}. Market prices, rarities and weekly movement for every card.`,
    alternates: { canonical: `${SITE_URL}/sets/${set.slug}` },
  };
}

export default function SetPage({ params }: { params: { slug: string } }) {
  const set = setBySlug(params.slug);
  if (!set) notFound();

  const cards = cardsInSet(set.code);
  const rows: CardRow[] = cards.map((c) => {
    const now = latestQuote(c).market;
    const then = quoteDaysAgo(c, 7).market;
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

  const prices = rows.map((r) => r.now);
  const total = prices.reduce((a, b) => a + b, 0);
  const changes = rows.map((r) => r.pct).filter((p): p is number => p != null);
  const avg30 = (() => {
    const ch = cards
      .map((c) => pctChange(latestQuote(c).market, quoteDaysAgo(c, 30).market))
      .filter((p): p is number => p != null);
    return ch.length ? ch.reduce((a, b) => a + b, 0) / ch.length : null;
  })();

  const stats = [
    { label: "Cards", value: String(cards.length) },
    { label: "Set value", cents: total },
    { label: "Most valuable", cents: prices.length ? Math.max(...prices) : 0 },
    { label: "7d average", pct: changes.length ? changes.reduce((a, b) => a + b, 0) / changes.length : null },
    { label: "30d average", pct: avg30 },
  ];

  return (
    <div>
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
    </div>
  );
}
