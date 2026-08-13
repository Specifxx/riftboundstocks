import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cardById, type RiftCard } from "@/lib/catalog";
import { latestQuote, primaryPrice } from "@/lib/prices";
import { ACCOUNTS_ENABLED, SITE_NAME, SITE_URL } from "@/lib/site";
import { planLimits } from "@/lib/plans";
import { portfolioValueHistory, breakdownByDomain, breakdownBySet } from "@/lib/portfolio";
import { Money } from "@/components/Prefs";
import { Delta } from "@/components/Bits";
import { AddHoldingForm } from "@/components/AddHoldingForm";
import { RemoveHoldingButton } from "@/components/RemoveHoldingButton";
import { ImportCsvForm } from "@/components/ImportCsvForm";
import { PortfolioBreakdown } from "@/components/PortfolioBreakdown";
import { PortfolioValueChart } from "@/components/PortfolioValueChart";

export const metadata: Metadata = {
  title: "Portfolio",
  description: `Track the Riftbound cards you own and see unrealised gain or loss against live ${SITE_NAME} market prices.`,
  alternates: { canonical: `${SITE_URL}/portfolio` },
  robots: { index: false, follow: true },
};

interface HoldingRow {
  id: string;
  name: string;
  slug: string;
  setName: string;
  collectorLabel: string;
  condition: string;
  isFoil: boolean;
  quantity: number;
  costBasisCents: number | null;
  marketCents: number | null;
  valueCents: number | null;
  plCents: number | null;
  plPct: number | null;
}

export default async function PortfolioPage({ searchParams }: { searchParams: { add?: string } }) {
  const user = ACCOUNTS_ENABLED ? await getCurrentUser() : null;

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <p className="eyebrow">{SITE_NAME}</p>
        <h1 className="mt-1 font-display text-3xl uppercase tracking-wide text-ink">Portfolio</h1>
        <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
          Log what you own with the price you paid, and see unrealised gain or loss against the live market price.
          Sign in to get started — it&apos;s free.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Link href="/signup" className="rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-accent-ink">
            Sign Up
          </Link>
          <Link href="/login" className="rounded-md border border-line px-4 py-2 text-[13px] font-semibold text-ink hover:border-line-strong">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  const holdings = await prisma.collectionCard.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });

  const rows: HoldingRow[] = holdings
    .map((h): HoldingRow | null => {
      const card = cardById(h.cardId);
      if (!card) return null; // catalogue changed under us — skip rather than crash
      const market = primaryPrice(latestQuote(card));
      const value = market != null ? market * h.quantity : null;
      const invested = h.costBasisCents != null ? h.costBasisCents * h.quantity : null;
      const pl = market != null && invested != null ? value! - invested : null;
      const plPct = pl != null && invested! > 0 ? Math.round((pl / invested!) * 1000) / 10 : null;
      return {
        id: h.id,
        name: card.name,
        slug: card.slug,
        setName: card.setName,
        collectorLabel: card.collectorLabel,
        condition: h.condition,
        isFoil: h.isFoil,
        quantity: h.quantity,
        costBasisCents: h.costBasisCents,
        marketCents: market,
        valueCents: value,
        plCents: pl,
        plPct,
      };
    })
    .filter((r): r is HoldingRow => r != null);

  const totalValueCents = rows.reduce((sum, r) => sum + (r.valueCents ?? 0), 0);
  const costedRows = rows.filter((r) => r.plCents != null);
  const totalPlCents = costedRows.reduce((sum, r) => sum + (r.plCents ?? 0), 0);
  const totalInvestedCents = costedRows.reduce((sum, r) => sum + (r.costBasisCents ?? 0) * r.quantity, 0);
  const totalPlPct = totalInvestedCents > 0 ? Math.round((totalPlCents / totalInvestedCents) * 1000) / 10 : null;

  const account = await prisma.user.findUnique({ where: { id: user.id }, select: { planTier: true } });
  const limits = planLimits(account?.planTier);

  const holdingsLite = holdings.map((h) => ({ cardId: h.cardId, quantity: h.quantity }));
  const valueOf = (c: RiftCard): number | null => primaryPrice(latestQuote(c));
  const valueHistory = portfolioValueHistory(holdingsLite);
  const domainSlices = breakdownByDomain(holdingsLite, valueOf);
  const setSlices = breakdownBySet(holdingsLite, valueOf);

  let preselect: { id: string; name: string; setName: string; collectorLabel: string } | undefined;
  if (searchParams.add) {
    const c = cardById(searchParams.add);
    if (c) preselect = { id: c.id, name: c.name, setName: c.setName, collectorLabel: c.collectorLabel };
  }

  return (
    <div>
      <header className="mb-4 border-b border-line pb-4">
        <p className="eyebrow">{SITE_NAME}</p>
        <h1 className="mt-1 font-display text-3xl uppercase tracking-wide text-ink">Portfolio</h1>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-ink-muted">
          What you own, priced against the live market. Unrealised gain/loss needs a cost basis — add what you paid
          when you log a card, or leave it blank to just track value.
        </p>
      </header>

      {rows.length > 0 && (
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="panel p-3 text-center">
            <p className="eyebrow">Value</p>
            <Money cents={totalValueCents} className="num mt-1 block text-xl font-bold text-ink" />
          </div>
          <div className="panel p-3 text-center">
            <p className="eyebrow">Unrealised P&amp;L</p>
            <Money cents={totalPlCents} className={`num mt-1 block text-xl font-bold ${totalPlCents >= 0 ? "text-up" : "text-down"}`} />
          </div>
          <div className="panel p-3 text-center">
            <p className="eyebrow">Return</p>
            <div className="mt-1">
              <Delta pct={totalPlPct} className="text-xl" />
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <AddHoldingForm initial={preselect} />
        </div>
        <ImportCsvForm eligible={limits.csvImport} />
      </div>

      {rows.length > 0 && (
        <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="panel p-4">
            <h2 className="eyebrow mb-3">Value over time</h2>
            <PortfolioValueChart points={valueHistory} />
          </section>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <PortfolioBreakdown title="By domain" slices={domainSlices} />
            <PortfolioBreakdown title="By set" slices={setSlices} />
          </div>
        </div>
      )}

      <section className="panel p-4">
        <h2 className="eyebrow mb-3">Your cards ({rows.length})</h2>
        {rows.length === 0 ? (
          <p className="text-[13px] text-ink-dim">Nothing logged yet — search for a card above to add your first one.</p>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead>
                <tr className="border-b border-line text-left text-ink-dim">
                  <th className="py-2 font-medium">Card</th>
                  <th className="py-2 font-medium">Cond.</th>
                  <th className="py-2 text-right font-medium">Qty</th>
                  <th className="py-2 text-right font-medium">Paid</th>
                  <th className="py-2 text-right font-medium">Market</th>
                  <th className="py-2 text-right font-medium">Value</th>
                  <th className="py-2 text-right font-medium">P&amp;L</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-line last:border-0">
                    <td className="py-2">
                      <Link href={`/card/${r.slug}`} className="font-medium text-accent hover:underline">
                        {r.name}
                      </Link>
                      <div className="text-[11px] text-ink-dim">
                        {r.setName} · {r.collectorLabel}
                        {r.isFoil && <span className="ml-1 text-foil">· Foil</span>}
                      </div>
                    </td>
                    <td className="py-2 text-ink-muted">{r.condition}</td>
                    <td className="num py-2 text-right text-ink">{r.quantity}</td>
                    <td className="num py-2 text-right text-ink-muted">
                      {r.costBasisCents == null ? "—" : <Money cents={r.costBasisCents} />}
                    </td>
                    <td className="num py-2 text-right text-ink"><Money cents={r.marketCents} /></td>
                    <td className="num py-2 text-right font-semibold text-ink"><Money cents={r.valueCents} /></td>
                    <td className="num py-2 text-right">
                      {r.plCents == null ? (
                        <span className="text-ink-dim">—</span>
                      ) : (
                        <span className={r.plCents >= 0 ? "text-up" : "text-down"}>
                          <Money cents={r.plCents} className="font-semibold" /> <Delta pct={r.plPct} />
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <RemoveHoldingButton id={r.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
