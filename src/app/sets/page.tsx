import type { Metadata } from "next";
import { SETS } from "@/lib/riftbound";
import { cardsInSet } from "@/lib/catalog";
import { latestQuote, quoteDaysAgo, pctChange } from "@/lib/prices";
import { SITE_URL } from "@/lib/site";
import { SetsIndex, type SetSummary } from "./SetsIndex";
import { DemoPricesNotice } from "@/components/Bits";

export const metadata: Metadata = {
  title: "Riftbound Sets",
  description:
    "Every Riftbound: League of Legends TCG set — Origins, Proving Grounds, Spirit Forged, Unleashed and Vendetta, plus the Organized Play, Judge and Secret Garden promo distributions. Card counts, set values and market performance for each.",
  alternates: { canonical: `${SITE_URL}/sets` },
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

export default function SetsPage() {
  const summaries: SetSummary[] = SETS.map((set) => {
    const cards = cardsInSet(set.code);
    // Unpriced cards are dropped, never counted as zero — a set total that
    // silently includes $0 for cards TCGplayer has no price for is wrong.
    const prices = cards.map((c) => latestQuote(c).market).filter((v): v is number => v != null);
    const changes = cards
      .map((c) => pctChange(latestQuote(c).market, quoteDaysAgo(c, 30).market))
      .filter((p): p is number => p != null);

    return {
      code: set.code,
      name: set.name,
      slug: set.slug,
      setType: set.setType,
      releasedOn: set.releasedOn,
      cardCount: cards.length,
      pricedCount: prices.length,
      totalCents: prices.reduce((a, b) => a + b, 0),
      medianCents: median(prices),
      topCents: prices.length ? Math.max(...prices) : null,
      pct30: changes.length ? changes.reduce((a, b) => a + b, 0) / changes.length : null,
    };
  });

  return (
    <div>
      <header className="mb-5">
        <h1 className="font-display text-3xl uppercase tracking-wide text-ink sm:text-4xl">Sets</h1>
        <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-ink-muted">
          Every Riftbound release in the catalogue, with the total value of the set at market, the median card price and
          how the set has moved over the last 30 days.
        </p>
      </header>

      <SetsIndex sets={summaries} />
      <DemoPricesNotice className="mt-5" />
    </div>
  );
}
