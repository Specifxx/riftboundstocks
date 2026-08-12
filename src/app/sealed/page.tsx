import type { Metadata } from "next";
import Link from "next/link";
import { cardsInSet, type RiftCard } from "@/lib/catalog";
import {
  HAS_CHANGE_DATA,
  HISTORY_START,
  latestQuote,
  pctChange,
  pricedCount,
  quoteDaysAgo,
  totalMarketValue,
} from "@/lib/prices";
import { SETS, RARITIES, type RarityKey, type SetInfo } from "@/lib/riftbound";
import { formatDate } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { Money } from "@/components/Prefs";
import { Delta, DeltaArrow, DemoPricesNotice, Panel, RarityPill, SectionTitle } from "@/components/Bits";

export const metadata: Metadata = {
  title: "Sealed Products",
  description:
    "Modelled singles value for Riftbound booster boxes, booster packs and starter decks. Every figure is the expected value of a pack's contents at market prices — a model, not a sealed market quote.",
  alternates: { canonical: `${SITE_URL}/sealed` },
};

// ─────────────────────────────────────────────────────────────────────────────
// THE PACK MODEL. This site has no sealed price data of any kind, so nothing on
// this page is a sealed product price. What it computes is the expected market
// value of the SINGLES a pack of this shape would contain, from the catalogue's
// own card prices. The slot counts and the rare-slot odds below are assumptions
// made here for the model — they are not published pull rates.
// ─────────────────────────────────────────────────────────────────────────────
const FIXED_SLOTS: { rarity: RarityKey; count: number }[] = [
  { rarity: "Common", count: 8 },
  { rarity: "Uncommon", count: 3 },
];

/** The twelfth card: rare or better, with the odds this model assumes. */
const RARE_SLOT: { rarity: RarityKey; chance: number }[] = [
  { rarity: "Rare", chance: 0.7 },
  { rarity: "Epic", chance: 0.22 },
  { rarity: "Showcase", chance: 0.08 },
];

const CARDS_PER_PACK = FIXED_SLOTS.reduce((n, s) => n + s.count, 0) + 1;
const PACKS_PER_BOX = 24;

/**
 * Mean market price of a rarity tier, over the priced printings only — an
 * unpriced card is one TCGplayer has no figure for, and averaging it in as zero
 * would understate every slot it appears in. null when the tier has no prices.
 */
function meanMarket(cards: RiftCard[]): { cents: number | null; priced: number } {
  const values = cards.flatMap((c) => {
    const m = latestQuote(c).market;
    return m == null ? [] : [m];
  });
  if (values.length === 0) return { cents: null, priced: 0 };
  return { cents: values.reduce((a, b) => a + b, 0) / values.length, priced: values.length };
}

interface SlotLine {
  label: string;
  rarity: RarityKey;
  detail: string;
  meanCents: number | null;
  contributionCents: number | null;
}

interface SetModel {
  set: SetInfo;
  cards: number;
  priced: number;
  slots: SlotLine[];
  packCents: number | null;
  boxCents: number | null;
  setTotalCents: number;
  pct30: number | null;
}

function modelSet(set: SetInfo): SetModel {
  const cards = cardsInSet(set.code);
  const byRarity = (r: RarityKey) => cards.filter((c) => c.rarity === r);

  const tierDetail = (r: RarityKey, priced: number) => {
    const total = byRarity(r).length;
    return priced === total ? `${total} printings in set` : `${priced} of ${total} printings priced`;
  };

  const slots: SlotLine[] = [
    ...FIXED_SLOTS.map((slot) => {
      const { cents, priced } = meanMarket(byRarity(slot.rarity));
      return {
        label: `${slot.count} × ${slot.rarity}`,
        rarity: slot.rarity,
        detail: tierDetail(slot.rarity, priced),
        meanCents: cents == null ? null : Math.round(cents),
        contributionCents: cents == null ? null : Math.round(cents * slot.count),
      };
    }),
    ...RARE_SLOT.map((slot) => {
      const { cents, priced } = meanMarket(byRarity(slot.rarity));
      return {
        label: `Rare slot → ${slot.rarity}`,
        rarity: slot.rarity,
        detail: `${Math.round(slot.chance * 100)}% of packs, assumed · ${tierDetail(slot.rarity, priced)}`,
        meanCents: cents == null ? null : Math.round(cents),
        contributionCents: cents == null ? null : Math.round(cents * slot.chance),
      };
    }),
  ];

  const contributions = slots.map((s) => s.contributionCents).filter((c): c is number => c != null);
  const packCents = contributions.length ? contributions.reduce((a, b) => a + b, 0) : null;

  const changes = HAS_CHANGE_DATA
    ? cards
        .map((c) => pctChange(latestQuote(c).market, quoteDaysAgo(c, 30).market))
        .filter((p): p is number => p != null && isFinite(p))
    : [];

  return {
    set,
    cards: cards.length,
    priced: pricedCount(cards),
    slots,
    packCents,
    boxCents: packCents == null ? null : packCents * PACKS_PER_BOX,
    setTotalCents: totalMarketValue(cards),
    pct30: changes.length ? changes.reduce((a, b) => a + b, 0) / changes.length : null,
  };
}

function ModelWarning({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[11px] leading-relaxed text-ink-dim ${className}`}>
      <span className="mr-1.5 inline-flex items-center rounded bg-accent-soft px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-accent">
        Modelled
      </span>
      Not a sealed price. This is the expected market value of the singles inside, computed from card prices — sealed
      product trades on its own supply and demand and routinely sits well above or below the value of its contents.
      Printings TCGplayer does not price are left out of the slot averages rather than averaged in as zero.
    </p>
  );
}

function NoHistoryNote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[11px] leading-relaxed text-ink-dim ${className}`}>
      No 30-day column yet: price history begins
      {HISTORY_START ? ` ${formatDate(`${HISTORY_START}T00:00:00Z`)}` : " with the first import"}, and a change needs a
      second day of prices to compare against.
    </p>
  );
}

export default function SealedPage() {
  const boosterSets = SETS.filter((s) => s.setType !== "Starter").map(modelSet);
  const starterSets = SETS.filter((s) => s.setType === "Starter").map(modelSet);

  return (
    <div>
      <header className="mb-4">
        <h1 className="font-display text-3xl uppercase tracking-wide text-ink sm:text-4xl">Sealed</h1>
        <p className="mt-1.5 max-w-3xl text-[14px] leading-relaxed text-ink-muted">
          What the cards inside a pack are worth, set by set.
        </p>
      </header>

      <div className="panel mb-5 border-l-4 border-l-down p-4">
        <h2 className="font-display text-[15px] uppercase tracking-wide text-ink">No sealed prices are tracked here</h2>
        <p className="mt-1.5 max-w-4xl text-[13px] leading-relaxed text-ink-muted">
          This site tracks singles. It has{" "}
          <strong className="font-semibold text-ink">no booster box, pack or starter deck price data at all</strong>, so
          rather than print a number it cannot source, every figure below is <em>derived</em>: the expected market value
          of the cards a pack of that set would contain, using this catalogue&apos;s own prices and the pack shape stated
          under each table. Real sealed product is priced by collectors and speculators, not by its contents — treat
          these as a floor-ish reference and nothing more.
        </p>
        <p className="mt-2 max-w-4xl text-[13px] leading-relaxed text-ink-muted">
          The slot counts ({CARDS_PER_PACK} cards per pack, {PACKS_PER_BOX} packs per box) and the rare-slot odds are{" "}
          <strong className="font-semibold text-ink">assumptions made for this model</strong>, not published pull rates.
        </p>
      </div>

      {/* ── Boxes ───────────────────────────────────────────────────────────── */}
      <section id="boxes" className="mb-6 scroll-mt-20">
        <SectionTitle>Booster Boxes</SectionTitle>
        <Panel>
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[620px] text-[13px]">
              <thead>
                <tr className="border-b border-line text-left text-ink-dim">
                  <th className="py-2 font-medium">Set</th>
                  <th className="py-2 font-medium">Released</th>
                  <th className="py-2 text-right font-medium">Packs</th>
                  <th className="py-2 text-right font-medium">Per pack</th>
                  <th className="py-2 text-right font-medium">Modelled box value</th>
                  {HAS_CHANGE_DATA && <th className="py-2 text-right font-medium">Singles 30d</th>}
                </tr>
              </thead>
              <tbody>
                {boosterSets.map((m) => (
                  <tr key={m.set.code} className="border-b border-line last:border-0 hover:bg-surface-2">
                    <td className="py-2">
                      <Link href={`/sets/${m.set.slug}`} className="font-medium text-ink hover:text-accent">
                        {m.set.name}
                      </Link>
                      <span className="ml-2 font-mono text-[10.5px] text-ink-dim">{m.set.code}</span>
                    </td>
                    <td className="whitespace-nowrap py-2 text-ink-muted">
                      {formatDate(`${m.set.releasedOn}T00:00:00Z`)}
                    </td>
                    <td className="num py-2 text-right text-ink-muted">{PACKS_PER_BOX}</td>
                    <td className="py-2 text-right">
                      <Money cents={m.packCents} className="num text-ink-muted" />
                    </td>
                    <td className="py-2 text-right">
                      <Money cents={m.boxCents} className="num font-semibold text-ink" />
                    </td>
                    {HAS_CHANGE_DATA && (
                      <td className="py-2 text-right">
                        <DeltaArrow pct={m.pct30} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ModelWarning className="mt-3 border-t border-line pt-3" />
          {!HAS_CHANGE_DATA && <NoHistoryNote className="mt-2" />}
          <DemoPricesNotice className="mt-2" />
        </Panel>
      </section>

      {/* ── Packs ───────────────────────────────────────────────────────────── */}
      <section id="packs" className="mb-6 scroll-mt-20">
        <SectionTitle>Booster Packs</SectionTitle>
        <div className="grid gap-4 lg:grid-cols-3">
          {boosterSets.map((m) => (
            <Panel key={m.set.code}>
              <header className="flex items-baseline justify-between gap-3 border-b border-line pb-2.5">
                <div className="min-w-0">
                  <h3 className="truncate font-display text-[16px] uppercase tracking-wide text-ink">{m.set.name}</h3>
                  <p className="text-[11px] text-ink-dim">
                    {m.priced === m.cards ? `${m.cards} printings` : `${m.priced} of ${m.cards} printings priced`} ·{" "}
                    {CARDS_PER_PACK} cards per pack
                  </p>
                </div>
                <Money cents={m.packCents} className="num shrink-0 text-xl font-bold text-accent" />
              </header>

              <table className="mt-2 w-full text-[12px]">
                <thead>
                  <tr className="text-left text-ink-dim">
                    <th className="py-1.5 font-medium">Slot</th>
                    <th className="py-1.5 text-right font-medium">Mean card</th>
                    <th className="py-1.5 text-right font-medium">Adds</th>
                  </tr>
                </thead>
                <tbody>
                  {m.slots.map((s) => (
                    <tr key={s.label} className="border-t border-line">
                      <td className="py-1.5">
                        <span className="flex items-center gap-1.5">
                          <RarityPill rarity={s.rarity} />
                          <span className="text-ink-muted">{s.label}</span>
                        </span>
                        <span className="block text-[10.5px] text-ink-dim">{s.detail}</span>
                      </td>
                      <td className="py-1.5 text-right">
                        <Money cents={s.meanCents} className="num text-ink-dim" />
                      </td>
                      <td className="py-1.5 text-right">
                        <Money cents={s.contributionCents} className="num font-semibold text-ink" />
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-line-strong">
                    <td className="py-1.5 font-semibold text-ink">Modelled pack value</td>
                    <td />
                    <td className="py-1.5 text-right">
                      <Money cents={m.packCents} className="num font-bold text-accent" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </Panel>
          ))}
        </div>
        <ModelWarning className="mt-3" />
        <DemoPricesNotice className="mt-2" />
      </section>

      {/* ── Starters ────────────────────────────────────────────────────────── */}
      <section id="starters" className="scroll-mt-20">
        <SectionTitle>Starter Decks</SectionTitle>
        {starterSets.length === 0 ? (
          <Panel>
            <p className="py-6 text-center text-[13px] text-ink-dim">No starter products in the catalogue.</p>
          </Panel>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {starterSets.map((m) => {
              // Unpriced printings stay in the list and render a dash — the list is
              // the deck's contents, not a valuation — but sort to the bottom.
              const contents = cardsInSet(m.set.code)
                .map((card) => ({ card, market: latestQuote(card).market }))
                .sort((a, b) => (b.market ?? -1) - (a.market ?? -1));
              return (
                <Panel key={m.set.code}>
                  <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-line pb-3">
                    <div className="min-w-0">
                      <h3 className="font-display text-lg uppercase tracking-wide text-ink">{m.set.name}</h3>
                      <p className="text-[11px] text-ink-dim">
                        {m.set.setType} · {m.cards} cards · {formatDate(`${m.set.releasedOn}T00:00:00Z`)}
                      </p>
                    </div>
                    <dl className="flex gap-x-6">
                      <div className="text-right">
                        <dt className="eyebrow">Contents at market</dt>
                        <dd>
                          <Money cents={m.setTotalCents} className="num text-xl font-bold text-accent" />
                        </dd>
                        <dd className="text-[10.5px] text-ink-dim">
                          {m.priced === m.cards ? "all cards priced" : `${m.priced} of ${m.cards} priced`}
                        </dd>
                      </div>
                      {HAS_CHANGE_DATA && (
                        <div className="text-right">
                          <dt className="eyebrow">30 days</dt>
                          <dd>
                            <Delta pct={m.pct30} className="text-xl" />
                          </dd>
                        </div>
                      )}
                    </dl>
                  </header>

                  <p className="mt-3 text-[12px] leading-relaxed text-ink-muted">
                    A starter product is a fixed list, so no pack model is needed — this is every printing in{" "}
                    {m.set.name} that TCGplayer prices, added up once at market price. A real sealed starter still
                    trades on its own terms.
                  </p>

                  <ul className="mt-3 space-y-0.5">
                    {contents.slice(0, 8).map(({ card, market }) => (
                      <li key={card.slug}>
                        <Link
                          href={`/card/${card.slug}`}
                          className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-surface-2"
                        >
                          <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{card.name}</span>
                          <RarityPill rarity={card.rarity} />
                          <span className="shrink-0 font-mono text-[10.5px] text-ink-dim">{card.collectorLabel}</span>
                          <Money cents={market} className="num w-16 shrink-0 text-right font-semibold text-ink" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {contents.length > 8 && (
                    <Link
                      href={`/sets/${m.set.slug}`}
                      className="mt-2 inline-block text-[12px] font-semibold text-accent hover:underline"
                    >
                      All {contents.length} cards in {m.set.name} →
                    </Link>
                  )}
                </Panel>
              );
            })}
          </div>
        )}
        {!HAS_CHANGE_DATA && starterSets.length > 0 && <NoHistoryNote className="mt-3" />}
        <DemoPricesNotice className="mt-3" />
      </section>

      <p className="mt-6 text-[11px] leading-relaxed text-ink-dim">
        Rarity tiers used by the model: {Object.values(RARITIES).map((r) => r.label).join(", ")}. Mean card values are
        computed across every printing of that rarity in the set, including alt arts and Signature prints, which pulls
        the Showcase tier upward.
      </p>
    </div>
  );
}
