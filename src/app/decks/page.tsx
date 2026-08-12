import type { Metadata } from "next";
import Link from "next/link";
import { CARDS, type RiftCard } from "@/lib/catalog";
import {
  HAS_CHANGE_DATA,
  HISTORY_START,
  latestQuote,
  pctChange,
  quoteDaysAgo,
  totalMarketValue,
} from "@/lib/prices";
import { DOMAINS, type CardType, type DomainKey, type RarityKey } from "@/lib/riftbound";
import { formatDate } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { CardGridTile } from "@/components/CardTile";
import { Money } from "@/components/Prefs";
import { Delta, DemoPricesNotice, DomainPill, RarityPill } from "@/components/Bits";

export const metadata: Metadata = {
  title: "Deck Archetypes",
  description:
    "What a Riftbound basket costs to assemble. Six illustrative 12-card baskets — one per domain, spread across every rarity tier — with total market cost, and 7-day price movement once enough daily history exists.",
  alternates: { canonical: `${SITE_URL}/decks` },
};

const BASKET_SIZE = 12;

/** One card from each tier's top end, so a basket spans the whole rarity ladder. */
const RARITY_PLAN: { rarity: RarityKey; count: number }[] = [
  { rarity: "Showcase", count: 1 },
  { rarity: "Epic", count: 2 },
  { rarity: "Rare", count: 3 },
  { rarity: "Uncommon", count: 3 },
  { rarity: "Common", count: 3 },
];

interface ArchetypeSpec {
  slug: string;
  name: string;
  domain: DomainKey;
  types: CardType[];
}

// Names describe the basket's contents and its domain's own tagline. They are
// labels for a price basket, not claimed strategies — see the note on the page.
const ARCHETYPES: ArchetypeSpec[] = [
  { slug: "fury-aggression", name: "Fury Aggression", domain: "Fury", types: ["Unit", "Spell"] },
  { slug: "calm-growth", name: "Calm Growth", domain: "Calm", types: ["Unit", "Gear"] },
  { slug: "mind-knowledge", name: "Mind Knowledge", domain: "Mind", types: ["Spell", "Unit"] },
  { slug: "body-endurance", name: "Body Endurance", domain: "Body", types: ["Unit", "Gear"] },
  { slug: "chaos-disruption", name: "Chaos Disruption", domain: "Chaos", types: ["Unit", "Spell"] },
  { slug: "order-structure", name: "Order Structure", domain: "Order", types: ["Unit", "Spell"] },
];

interface Basket extends ArchetypeSpec {
  cards: RiftCard[];
  totalCents: number;
  pct7: number | null;
  rarityMix: { rarity: RarityKey; count: number }[];
}

/**
 * The basket's change, measured over the cards priced on BOTH days. Comparing a
 * total against a differently-composed total would report a change in coverage
 * as a change in price.
 */
function basketChange(cards: RiftCard[], days: number): number | null {
  if (!HAS_CHANGE_DATA) return null;
  let now = 0;
  let then = 0;
  for (const c of cards) {
    const a = latestQuote(c).market;
    const b = quoteDaysAgo(c, days).market;
    if (a == null || b == null) continue;
    now += a;
    then += b;
  }
  return pctChange(now, then);
}

/**
 * Deterministic pick: highest market price first, slug breaking ties, so the same
 * catalogue always yields the same basket. Short tiers are topped up from what is
 * left rather than shrinking the basket. The pool is priced cards only, so the
 * basket cost is the cost of exactly the twelve cards shown.
 */
function build(spec: ArchetypeSpec): Basket {
  const pool = CARDS.filter((c) => c.domain === spec.domain && spec.types.includes(c.type))
    .flatMap((card) => {
      const market = latestQuote(card).market;
      return market == null ? [] : [{ card, market }];
    })
    .sort((a, b) => b.market - a.market || a.card.slug.localeCompare(b.card.slug))
    .map((x) => x.card);

  const picked: RiftCard[] = [];
  for (const tier of RARITY_PLAN) {
    for (const card of pool) {
      if (picked.length >= BASKET_SIZE) break;
      if (card.rarity !== tier.rarity) continue;
      if (picked.filter((p) => p.rarity === tier.rarity).length >= tier.count) break;
      picked.push(card);
    }
  }
  for (const card of pool) {
    if (picked.length >= BASKET_SIZE) break;
    if (!picked.includes(card)) picked.push(card);
  }

  const counts = new Map<RarityKey, number>();
  for (const c of picked) counts.set(c.rarity, (counts.get(c.rarity) ?? 0) + 1);

  return {
    ...spec,
    cards: picked,
    totalCents: totalMarketValue(picked),
    pct7: basketChange(picked, 7),
    rarityMix: RARITY_PLAN.map((t) => ({ rarity: t.rarity, count: counts.get(t.rarity) ?? 0 })).filter((t) => t.count > 0),
  };
}

export default function DecksPage() {
  const baskets = ARCHETYPES.map(build);

  return (
    <div>
      <header className="mb-4">
        <h1 className="font-display text-3xl uppercase tracking-wide text-ink sm:text-4xl">Deck Archetypes</h1>
        <p className="mt-1.5 max-w-3xl text-[14px] leading-relaxed text-ink-muted">
          Six themed baskets of twelve cards each, priced as a group so you can see what a domain costs to buy
          into{HAS_CHANGE_DATA ? " and how that number is moving." : "."}
        </p>
        {!HAS_CHANGE_DATA && (
          <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-ink-dim">
            Basket movement begins once a second day of prices has been collected — price history
            starts{HISTORY_START ? ` ${formatDate(`${HISTORY_START}T00:00:00Z`)}` : " with the first import"}, so there
            is nothing yet to measure today&apos;s cost against.
          </p>
        )}
      </header>

      {/* This has to be unmissable: these are price baskets, and presenting them
          as playable lists would be inventing competitive information. */}
      <div className="panel mb-5 border-l-4 border-l-down p-4">
        <h2 className="font-display text-[15px] uppercase tracking-wide text-ink">
          These are illustrative baskets, not decklists
        </h2>
        <p className="mt-1.5 max-w-4xl text-[13px] leading-relaxed text-ink-muted">
          Each basket is assembled mechanically from this catalogue — the highest-priced cards of a single domain and
          card type, taken one tier at a time so every rarity is represented. Only cards TCGplayer actually prices are
          eligible, so the basket cost is the cost of exactly the cards shown. They are{" "}
          <strong className="font-semibold text-ink">not real competitive decklists</strong>, not tested builds, and not
          legal deck constructions. Nobody plays these. They exist to answer one question: what does a slice of a domain
          cost right now, and which way is it going? For actual deckbuilding rules and card text, use{" "}
          <Link href="/about" className="text-accent hover:underline">
            the sources listed on our about page
          </Link>
          .
        </p>
      </div>

      <div className="space-y-4">
        {baskets.map((b) => {
          const info = DOMAINS[b.domain];
          return (
            <section key={b.slug} className="panel p-4">
              <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-line pb-3">
                <div className="min-w-0">
                  <h2 className="font-display text-xl uppercase tracking-wide text-ink">{b.name}</h2>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-ink-dim">
                    <DomainPill domain={b.domain} />
                    <span>{info.tagline}</span>
                    <span>·</span>
                    <span>
                      {b.cards.length} cards · {b.types.join(" + ")}
                    </span>
                  </p>
                  <p className="mt-2 flex flex-wrap gap-1.5">
                    {b.rarityMix.map((t) => (
                      <span key={t.rarity} className="inline-flex items-center gap-1">
                        <RarityPill rarity={t.rarity} />
                        <span className="num text-[11px] text-ink-dim">×{t.count}</span>
                      </span>
                    ))}
                  </p>
                </div>

                <dl className="flex gap-x-7 gap-y-2">
                  <div className="text-right">
                    <dt className="eyebrow">Basket cost</dt>
                    <dd>
                      <Money cents={b.totalCents} className="num text-xl font-bold text-accent sm:text-2xl" />
                    </dd>
                    <dd className="text-[10.5px] text-ink-dim">all {b.cards.length} cards priced</dd>
                  </div>
                  {HAS_CHANGE_DATA && (
                    <div className="text-right">
                      <dt className="eyebrow">7 days</dt>
                      <dd>
                        <Delta pct={b.pct7} className="text-xl sm:text-2xl" />
                      </dd>
                    </div>
                  )}
                </dl>
              </header>

              <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {b.cards.map((card) => (
                  <li key={card.slug}>
                    <CardGridTile card={card} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <DemoPricesNotice className="mt-5" />
    </div>
  );
}
