import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CARDS, cardBySlug, otherPrintings } from "@/lib/catalog";
import { activeSource, cardStats, priceHistory, latestQuote, topByMarket, primaryPrice } from "@/lib/prices";
import { cardDetail } from "@/lib/card-details";
import { tcgSearchUrl } from "@/lib/prices/tcgplayer";
import { affiliateUrl, outboundRel, riftcompareCardUrl } from "@/lib/affiliate";
import { FORMATS, SET_BY_CODE, domainInfo } from "@/lib/riftbound";
import { formatMoney, formatDate } from "@/lib/format";
import { OFFICIAL_CARD_DB_URL, SITE_NAME, SITE_URL } from "@/lib/site";
import { CardImage } from "@/components/CardImage";
import { PriceChart } from "@/components/PriceChart";
import { CardActions } from "@/components/CardActions";
import { AltCurrencyCell, AltCurrencyHeader, Money } from "@/components/Prefs";
import { Delta, DemoPricesNotice, DomainPill, RarityPill } from "@/components/Bits";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";

// Pre-render the most valuable cards at build time and stream the rest on first
// request. Building all 1,180 would multiply build time for pages nobody opens.
export function generateStaticParams() {
  return topByMarket(120).map(({ card }) => ({ slug: card.slug }));
}

export const dynamicParams = true;
export const revalidate = 3600;

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const card = cardBySlug(params.slug);
  if (!card) return { title: "Card not found" };
  const q = latestQuote(card);
  const title = `${card.name} (${card.setCode} ${card.collectorLabel}) Price History`;
  // An unpriced card gets a description with no price claim in it, rather than
  // "$0.00" in a search result.
  const priceLine =
    q.market != null
      ? `TCGplayer market price ${formatMoney(q.market)}${q.low != null ? `, from ${formatMoney(q.low)}` : ""}.`
      : "Live TCGplayer pricing and daily history.";
  const description = `${card.name} from ${card.setName} — ${card.rarity} ${card.domain} ${card.type}. ${priceLine} Price history and market data on ${SITE_NAME}.`;
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
  const detail = cardDetail(card.id);
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

            {/* Real rules text, from TCGplayer's product data. Rendered as plain
                text (the importer strips their HTML), so there is no markup to
                trust. Absent stays absent — nothing here is generated. */}
            {detail?.description && (
              <div className="mt-3 border-t border-line pt-3">
                <h3 className="eyebrow mb-1.5">Card text</h3>
                <p className="whitespace-pre-line text-[13px] leading-relaxed text-ink-muted">{detail.description}</p>
                {detail.flavorText && (
                  <p className="mt-2 whitespace-pre-line border-l-2 border-line pl-2.5 text-[12.5px] italic leading-relaxed text-ink-dim">
                    {detail.flavorText}
                  </p>
                )}
              </div>
            )}

            <p className="mt-3 border-t border-line pt-3 text-[12px] leading-relaxed text-ink-dim">
              {detail?.description ? "Card text via TCGplayer. " : "Card text isn't published for this printing. "}
              Artist credits aren&apos;t available from either source and are not guessed at. For authoritative rules
              and legality see{" "}
              <a
                href={OFFICIAL_CARD_DB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Riot&apos;s official Riftbound card database
              </a>
              .
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
                        href={affiliateUrl(detail?.url ?? tcgSearchUrl(card.name), "card-prices", `/card/${card.slug}`)}
                        target="_blank"
                        rel={outboundRel()}
                        className="shrink-0 rounded-md border border-line px-2 py-1 text-[11px] font-semibold text-accent hover:border-accent"
                      >
                        Buy →
                      </a>
                    </li>
                  ),
                )}
              </ul>

              {/* Immediately under the links it describes — see the placement
                  rules in AffiliateDisclosure. */}
              <AffiliateDisclosure className="mt-3 border-t border-line pt-2.5" />

              {/* The sister site covers what this one doesn't: live store prices
                  in six markets, where this page is TCGplayer history only. */}
              <p className="mt-2 text-[11px] leading-relaxed text-ink-dim">
                Shopping outside the US?{" "}
                <a
                  href={riftcompareCardUrl(card.name, "card-prices")}
                  target="_blank"
                  rel="noopener"
                  className="font-semibold text-accent hover:underline"
                >
                  Compare {card.name} across AU, NZ, UK, SG and CA stores on RiftCompare →
                </a>
              </p>
            </section>

            {/* Data panel */}
            <section className="panel p-4">
              <h2 className="eyebrow mb-3">Data</h2>
              <dl className="text-[13px]">
                {/* "Since <date>", not "All-Time": the series starts at the first
                    import because TCGplayer publishes no price history, and
                    calling one week's high an all-time high would be a lie. */}
                <StatRow label={`High${stats.points > 1 ? ` (${stats.points}d)` : ""}`}>
                  {stats.allTimeHigh ? (
                    <>
                      <Money cents={stats.allTimeHigh.cents} className="num font-semibold text-up" />
                      <span className="ml-2 text-[11px] text-ink-dim">
                        {formatDate(`${stats.allTimeHigh.day}T00:00:00Z`)}
                      </span>
                    </>
                  ) : (
                    <span className="text-ink-dim">—</span>
                  )}
                </StatRow>
                <StatRow label={`Low${stats.points > 1 ? ` (${stats.points}d)` : ""}`}>
                  {stats.allTimeLow ? (
                    <>
                      <Money cents={stats.allTimeLow.cents} className="num font-semibold text-down" />
                      <span className="ml-2 text-[11px] text-ink-dim">
                        {formatDate(`${stats.allTimeLow.day}T00:00:00Z`)}
                      </span>
                    </>
                  ) : (
                    <span className="text-ink-dim">—</span>
                  )}
                </StatRow>
                <StatRow label="Foil Multiplier">
                  <span className="num font-semibold text-foil">
                    {stats.foilMultiplier ? `${stats.foilMultiplier.toFixed(2)}×` : "—"}
                  </span>
                </StatRow>
                <StatRow label="Spread (Median − Low)">
                  <span className="num font-semibold text-ink">
                    {stats.spreadPct != null ? `${stats.spreadPct.toFixed(1)}%` : "—"}
                  </span>
                </StatRow>
                {detail && (
                  <StatRow label="Active listings">
                    <span className="num font-semibold text-ink">{detail.listings.toLocaleString("en-US")}</span>
                  </StatRow>
                )}
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
                          {/* Headline price, so a foil-only printing shows its
                              foil market rather than an empty cell. */}
                          <td className="num py-2 text-right font-semibold text-ink">
                            {primaryPrice(pq) != null ? formatMoney(primaryPrice(pq)!, "USD") : "—"}
                            {pq.market == null && pq.foilMarket != null && (
                              <span className="ml-1 text-[10px] font-normal text-foil">foil</span>
                            )}
                          </td>
                          <AltCurrencyCell cents={primaryPrice(pq)} className="num py-2 text-right text-ink-muted" />
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
