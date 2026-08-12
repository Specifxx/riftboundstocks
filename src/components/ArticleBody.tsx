import Link from "next/link";
import type { Block } from "@/lib/content/types";
import { cardBySlug } from "@/lib/catalog";
import { latestQuote, priceHistory, quoteDaysAgo, pctChange } from "@/lib/prices";
import { CardImage } from "./CardImage";
import { Sparkline } from "./PriceChart";
import { Money } from "./Prefs";
import { Delta, DomainPill, RarityPill } from "./Bits";
import { AffiliateDisclosure } from "./AffiliateDisclosure";
import { affiliateUrl, outboundRel } from "@/lib/affiliate";
import { tcgSearchUrl } from "@/lib/prices/tcgplayer";

/** Embedded card panel: art, live prices and a 60-day sparkline. */
function CardBlock({ slug, note }: { slug: string; note?: string }) {
  const card = cardBySlug(slug);
  if (!card) return null;

  const q = latestQuote(card);
  const pct = pctChange(q.market, quoteDaysAgo(card, 7).market);
  const spark = priceHistory(card).slice(-60).map((p) => p.market);

  return (
    <figure className="my-5 not-prose">
      <div className="panel flex gap-3.5 p-3.5">
        <Link href={`/card/${card.slug}`} className="w-[104px] shrink-0 sm:w-[132px]">
          <CardImage card={card} className="aspect-[5/7] w-full" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/card/${card.slug}`} className="font-display text-[17px] font-semibold text-ink hover:text-accent">
            {card.name}
          </Link>
          <p className="mt-0.5 text-[11.5px] text-ink-dim">
            {card.setName} · {card.collectorLabel}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <RarityPill rarity={card.rarity} />
            <DomainPill domain={card.domain} />
          </div>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-2.5">
            <dl className="flex gap-4">
              {(
                [
                  ["Market", q.market, "text-ink"],
                  ["Low", q.low, "text-ink-muted"],
                  ["Foil", q.foilMarket, "text-foil"],
                ] as const
              ).map(([label, cents, tone]) => (
                <div key={label}>
                  <dt className="text-[10px] uppercase tracking-wide text-ink-dim">{label}</dt>
                  <dd>
                    <Money cents={cents} className={`num text-[14px] font-bold ${tone}`} />
                  </dd>
                </div>
              ))}
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-ink-dim">7d</dt>
                <dd>
                  <Delta pct={pct} className="text-[14px]" />
                </dd>
              </div>
            </dl>
            <div className="flex shrink-0 items-center gap-2.5">
              <Sparkline points={spark} className="h-8 w-24" />
              <a
                href={affiliateUrl(tcgSearchUrl(card.name), "article-card", "/news")}
                target="_blank"
                rel={outboundRel()}
                className="rounded-md border border-line px-2 py-1 text-[11px] font-semibold text-accent hover:border-accent"
              >
                Buy →
              </a>
            </div>
          </div>

          {/* Adjacent to the link, per the placement rules in AffiliateDisclosure. */}
          <AffiliateDisclosure className="mt-2" />
        </div>
      </div>
      {note && <figcaption className="mt-1.5 text-[12px] italic text-ink-dim">{note}</figcaption>}
    </figure>
  );
}

function CardTableBlock({ title, slugs }: { title: string; slugs: string[] }) {
  const cards = slugs.map(cardBySlug).filter((c): c is NonNullable<typeof c> => c != null);
  if (cards.length === 0) return null;

  return (
    <div className="my-5 not-prose panel overflow-hidden">
      <h3 className="border-b border-line px-3.5 py-2.5 font-display text-[13px] uppercase tracking-wide text-ink">
        {title}
      </h3>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-ink-dim">
            <th className="px-3.5 py-1.5 font-medium">Card</th>
            <th className="px-2 py-1.5 text-right font-medium">Market</th>
            <th className="px-3.5 py-1.5 text-right font-medium">7d</th>
          </tr>
        </thead>
        <tbody>
          {cards.map((c) => {
            const q = latestQuote(c);
            return (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="px-3.5 py-1.5">
                  <Link href={`/card/${c.slug}`} className="flex items-center gap-2">
                    <img src={c.imageThumbUrl} alt="" width={24} height={34} className="h-8 w-6 shrink-0 rounded object-cover" loading="lazy" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink hover:text-accent">{c.name}</span>
                      <span className="block text-[10.5px] text-ink-dim">
                        {c.setCode} {c.collectorLabel}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-2 py-1.5 text-right">
                  <Money cents={q.market} className="num font-semibold text-ink" />
                </td>
                <td className="px-3.5 py-1.5 text-right">
                  <Delta pct={pctChange(q.market, quoteDaysAgo(c, 7).market)} className="text-[12px]" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ArticleBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="max-w-[68ch]">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "h2":
            return (
              <h2 key={i} className="mt-8 font-display text-[22px] uppercase tracking-wide text-ink">
                {b.text}
              </h2>
            );
          case "p":
            return (
              <p key={i} className="mt-4 text-[15px] leading-[1.75] text-ink-muted">
                {b.text}
              </p>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="my-5 border-l-2 border-accent bg-surface-1 px-4 py-3 text-[13.5px] italic leading-relaxed text-ink-muted"
              >
                {b.text}
              </blockquote>
            );
          case "card":
            return <CardBlock key={i} slug={b.slug} note={b.note} />;
          case "cardTable":
            return <CardTableBlock key={i} title={b.title} slugs={b.slugs} />;
        }
      })}
    </div>
  );
}
