import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CARDS, cardBySlug, otherPrintings } from "@/lib/catalog";
import { activeSource, cardStats, priceHistory, latestQuote } from "@/lib/prices";
import { tcgSearchUrl } from "@/lib/prices/tcgplayer";
import { FORMATS, SET_BY_CODE, domainInfo } from "@/lib/riftbound";
import { formatMoney, formatDate } from "@/lib/format";
import { OFFICIAL_CARD_DB_URL, SITE_NAME, SITE_URL } from "@/lib/site";
import { CardImage } from "@/components/CardImage";
import { PriceChart } from "@/components/PriceChart";
import { CardActions } from "@/components/CardActions";
import { AltCurrencyCell, AltCurrencyHeader, Money } from "@/components/Prefs";
import { Delta, DemoPricesNotice, DomainPill, RarityPill } from "@/components/Bits";

// Pre-render the most valuable cards at build time and stream the rest on first
// request. Building all 950 would triple build time for pages nobody opens.
export function generateStaticParams() {
  return [...CARDS]
    .sort((a, b) => latestQuote(b).market - latestQuote(a).market)
    .slice(0, 120)
    .map((c) => ({ slug: c.slug }));
}

export const dynamicParams = true;
export const revalidate = 3600;

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const card = cardBySlug(params.slug);
  if (!card) return { title: "Card not found" };
  const q = latestQuote(card);
  const title = `${card.name} (${card.setCode} ${card.collectorLabel}) Price History`;
  const description = `${card.name} from ${card.setName} — ${card.rarity} ${card.domain} ${card.type}. Market price ${formatMoney(q.market)}, low ${formatMoney(q.low)}. Daily price history and market data on ${SITE_NAME}.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/card/${card.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `${SITE_URL}/card/${card.slug}`,
      images: [{ url: card.imageUrl, alt: card.name }],
    },
  };
}

function StatRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-1.5 last:border-0">
      <dt className="text-[12px] text-ink-dim">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

export default function CardPage({ params }: { params: { slug: string } }) {
  const card = cardBySlug(params.slug);
  if (!card) notFound();

  const stats = cardStats(card);
  const history = priceHistory(card);
  const q = stats.latest;
  const printings = otherPrintings(card);
  const set = SET_BY_CODE[card.setCode];
  const source = activeSource();
  const domain = domainInfo(card.domain);

  const summary = [
    { label: "Low", cents: q.low, tone: "text-ink" },
    { label: "Average", cents: q.mid, tone: "text-ink" },
    { label: "Market", cents: q.market, tone: "text-accent" },
    { label: "✨ Foil", cents: q.foilMarket, tone: "text-foil" },
  ];

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-line pb-4">
        <div className="min-w-0">
          <nav className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-dim">
            <Link href="/sets" className="hover:text-accent">
              Sets
            </Link>
            <span>/</span>
            {set && (
              <>
                <Link href={`/sets/${set.slug}`} className="hover:text-accent">
                  {card.setName}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="font-mono">{card.collectorLabel}</span>
          </nav>
          <h1 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-[40px]">{card.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-ink-muted">
            <span>
              {card.setName} · <span className="font-mono">{card.collectorLabel}</span>
            </span>
            <RarityPill rarity={card.rarity} />
            <DomainPill domain={card.domain} />
          </p>
        </div>

        <dl className="flex flex-wrap gap-x-7 gap-y-2">
          {summary.map((s) => (
            <div key={s.label} className="text-right">
              <dt className="eyebrow">{s.label}</dt>
              <dd>
                <Money cents={s.cents} className={`num text-xl font-bold sm:text-2xl ${s.tone}`} />
              </dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="grid gap-4 lg:grid-cols-[290px_minmax(0,1fr)]">
        {/* ── Left: art, quick prices, actions ─────────────────────────────── */}
        <div className="lg:sticky lg:top-[72px] lg:self-start">
          <div className="panel overflow-hidden p-3">
            <div className="overflow-hidden rounded-lg bg-surface-2">
              <CardImage card={card} full priority className="aspect-[5/7] w-full" />
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
              {summary.map((s) => (
                <div key={s.label} className="flex items-baseline justify-between gap-2">
                  <dt className="text-[11px] text-ink-dim">{s.label}</dt>
                  <dd>
                    <Money cents={s.cents} className={`num text-[13px] font-semibold ${s.tone}`} />
                  </dd>
                </div>
              ))}
            </dl>

            <CardActions cardName={card.name} />
          </div>

          <div className="panel mt-4 p-4">
            <h2 className="eyebrow mb-2">Card details</h2>
            <dl className="text-[13px]">
              <StatRow label="Type">
                <span className="text-ink">
                  {card.type}
                  {card.variant === "s" ? " · Signature" : card.variant ? " · Alt art" : ""}
                </span>
              </StatRow>
              <StatRow label="Domain">
                <span style={{ color: domain.color }}>{domain.label}</span>
              </StatRow>
              <StatRow label="Rarity">
                <span className="text-ink">{card.rarity}</span>
              </StatRow>
              {card.energy != null && (
                <StatRow label="Energy">
                  <span className="num text-ink">{card.energy}</span>
                </StatRow>
              )}
              {card.might != null && (
                <StatRow label="Might">
                  <span className="num text-ink">{card.might}</span>
                </StatRow>
              )}
              {card.power != null && (
                <StatRow label="Power">
                  <span className="num text-ink">{card.power}</span>
                </StatRow>
              )}
              <StatRow label="Set">
                <span className="text-ink">
                  {card.setName}
                  {set && <span className="ml-1 text-ink-dim">({formatDate(`${set.releasedOn}T00:00:00Z`)})</span>}
                </span>
              </StatRow>
              <StatRow label="Legal formats">
                <span className="text-ink">{FORMATS.join(", ")}</span>
              </StatRow>
            </dl>

            {/* This site tracks prices, not rules. Inventing ability text or an
                artist credit for a real card would be fabrication, so the card's
                own database is linked instead. */}
            <p className="mt-3 border-t border-line pt-3 text-[12px] leading-relaxed text-ink-dim">
              Ability text and artist credits aren&apos;t part of this dataset. Check{" "}
              <a
                href={OFFICIAL_CARD_DB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Riot&apos;s official Riftbound card database
              </a>{" "}
              for the authoritative card text.
            </p>
          </div>
        </div>

        {/* ── Right: chart, prices, data ───────────────────────────────────── */}
        <div className="min-w-0 space-y-4">
          <section className="panel p-4">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-lg uppercase tracking-wide text-ink">Price History</h2>
              <span className="text-[11px] text-ink-dim">{stats.points} daily points</span>
            </div>
            <PriceChart points={history} sources={[{ id: source.id, label: source.label }]} activeSourceId={source.id} />
            <DemoPricesNotice className="mt-3 border-t border-line pt-3" />
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Vendor prices */}
            <section className="panel p-4">
              <h2 className="eyebrow mb-3">Prices</h2>
              <ul className="space-y-2">
                {(
                  [
                    ["TCGplayer", "Market", q.market, false],
                    ["TCGplayer", "Low", q.low, false],
                    ["TCGplayer", "Foil Market", q.foilMarket, true],
                    ["TCGplayer", "Foil Average", q.foil, true],
                  ] as const
                ).map(([vendor, kind, cents, isFoil]) =>
                  cents == null ? null : (
                    <li key={kind} className="flex items-center gap-2 border-b border-line pb-2 last:border-0 last:pb-0">
                      <span className="inline-grid h-5 w-8 shrink-0 place-items-center rounded-sm bg-surface-3 font-mono text-[9px] font-bold text-ink-dim">
                        TCG
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-ink">{vendor}</span>
                        <span className="block text-[11px] text-ink-dim">{kind}</span>
                      </span>
                      <Money
                        cents={cents}
                        className={`num text-[15px] font-bold ${isFoil ? "text-foil" : "text-ink"}`}
                      />
                      <a
                        href={tcgSearchUrl(card.name)}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="shrink-0 rounded-md border border-line px-2 py-1 text-[11px] font-semibold text-accent hover:border-accent"
                      >
                        Buy →
                      </a>
                    </li>
                  ),
                )}
              </ul>
              <p className="mt-3 text-[11px] leading-relaxed text-ink-dim">
                Outbound links go to TCGplayer search. They are marked{" "}
                <code className="font-mono text-[10px]">rel=&quot;sponsored&quot;</code> so they are honest about being
                affiliate-ready, though no affiliate tag is attached in this build.
              </p>
            </section>

            {/* Data panel */}
            <section className="panel p-4">
              <h2 className="eyebrow mb-3">Data</h2>
              <dl className="text-[13px]">
                <StatRow label="All-Time High">
                  <Money cents={stats.allTimeHigh.cents} className="num font-semibold text-up" />
                  <span className="ml-2 text-[11px] text-ink-dim">{formatDate(`${stats.allTimeHigh.day}T00:00:00Z`)}</span>
                </StatRow>
                <StatRow label="All-Time Low">
                  <Money cents={stats.allTimeLow.cents} className="num font-semibold text-down" />
                  <span className="ml-2 text-[11px] text-ink-dim">{formatDate(`${stats.allTimeLow.day}T00:00:00Z`)}</span>
                </StatRow>
                <StatRow label="Foil Multiplier">
                  <span className="num font-semibold text-foil">
                    {stats.foilMultiplier ? `${stats.foilMultiplier.toFixed(2)}×` : "—"}
                  </span>
                </StatRow>
                <StatRow label="Spread">
                  <span className="num font-semibold text-ink">{stats.spreadPct.toFixed(1)}%</span>
                </StatRow>
                <StatRow label="Buy List (indicative)">
                  <Money cents={stats.buylistCents} className="num font-semibold text-ink" />
                </StatRow>
              </dl>

              <table className="mt-3 w-full border-t border-line pt-2 text-[12px]">
                <thead>
                  <tr className="text-ink-dim">
                    <th className="py-1.5 text-left font-medium">Change</th>
                    <th className="py-1.5 text-right font-medium">Regular</th>
                    <th className="py-1.5 text-right font-medium">Foil</th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      ["24 hours", stats.deltas.day],
                      ["7 days", stats.deltas.week],
                      ["30 days", stats.deltas.month],
                    ] as const
                  ).map(([label, d]) => (
                    <tr key={label} className="border-t border-line">
                      <td className="py-1.5 text-ink-muted">{label}</td>
                      <td className="py-1.5 text-right">
                        <Delta pct={d.regular} />
                      </td>
                      <td className="py-1.5 text-right">
                        <Delta pct={d.foil} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>

          {/* Other printings */}
          <section className="panel p-4">
            <h2 className="eyebrow mb-3">Other printings</h2>
            {printings.length === 0 ? (
              <p className="text-[13px] text-ink-dim">
                This is the only printing of {card.name} in the catalogue.
              </p>
            ) : (
              <div className="-mx-4 overflow-x-auto px-4">
                <table className="w-full min-w-[440px] text-[13px]">
                  <thead>
                    <tr className="border-b border-line text-left text-ink-dim">
                      <th className="py-2 font-medium">Set</th>
                      <th className="py-2 font-medium">Number</th>
                      <th className="py-2 text-right font-medium">USD</th>
                      <AltCurrencyHeader className="py-2 text-right font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {printings.map((p) => {
                      const pq = latestQuote(p);
                      return (
                        <tr key={p.id} className="border-b border-line last:border-0">
                          <td className="py-2">
                            <Link href={`/card/${p.slug}`} className="font-medium text-accent hover:underline">
                              {p.setName}
                            </Link>
                            {p.variant && (
                              <span className="ml-1.5 text-[11px] text-ink-dim">
                                {p.variant === "s" ? "Signature" : "Alt art"}
                              </span>
                            )}
                          </td>
                          <td className="py-2 font-mono text-[12px] text-ink-muted">{p.collectorLabel}</td>
                          <td className="num py-2 text-right font-semibold text-ink">{formatMoney(pq.market, "USD")}</td>
                          <AltCurrencyCell cents={pq.market} className="num py-2 text-right text-ink-muted" />
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
