import type { Metadata } from "next";
import Link from "next/link";
import { searchCards } from "@/lib/catalog";
import { latestQuote, quoteDaysAgo, pctChange } from "@/lib/prices";
import { SITE_URL } from "@/lib/site";
import { CardTable, type CardRow } from "@/components/CardTable";
import { DemoPricesNotice } from "@/components/Bits";

export const metadata: Metadata = {
  title: "Search Riftbound Cards",
  description: "Search every Riftbound TCG card by name and see its current market price and recent movement.",
  alternates: { canonical: `${SITE_URL}/search` },
  robots: { index: false, follow: true },
};

export default function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? "").trim();
  const results = q ? searchCards(q, 200) : [];

  const rows: CardRow[] = results.map((c) => {
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

  return (
    <div>
      <h1 className="font-display text-3xl uppercase tracking-wide text-ink sm:text-4xl">
        {q ? <>Results for &ldquo;{q}&rdquo;</> : "Search"}
      </h1>
      <p className="mt-1.5 text-[13.5px] text-ink-muted">
        {q ? `${results.length} card${results.length === 1 ? "" : "s"} found.` : "Use the search box in the header, or press / from anywhere."}
      </p>

      {q && results.length === 0 && (
        <div className="mt-8 rounded-xl border border-line bg-surface-1 p-6 text-center">
          <p className="text-sm text-ink-muted">Nothing matched that name.</p>
          <p className="mt-1.5 text-[13px] text-ink-dim">
            Try a shorter term, or{" "}
            <Link href="/sets" className="text-accent hover:underline">
              browse by set
            </Link>
            .
          </p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="panel mt-5 p-4">
          <CardTable rows={rows} columns={["card", "set", "rarity", "domain", "now", "pct"]} initialSort="now" />
        </div>
      )}

      {rows.length > 0 && <DemoPricesNotice className="mt-4" />}
    </div>
  );
}
