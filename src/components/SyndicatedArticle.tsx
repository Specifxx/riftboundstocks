import Link from "next/link";
import { fetchRiftComparePosts, fetchRiftCompareArticle, type RcPost } from "@/lib/riftcompare-feed";
import { resolveArticleHref, resolveArticleImage } from "@/lib/article-links";
import { cardsMentioned } from "@/lib/article-cards";
import { championOf, printingsNamed } from "@/lib/champions";
import { latestQuote, primaryPrice, quoteDaysAgo, pctChange, HAS_CHANGE_DATA } from "@/lib/prices";
import { formatDate } from "@/lib/format";
import { riftcompareUrl } from "@/lib/affiliate";
import { Markdown } from "./Markdown";
import { Money } from "./Prefs";
import { DeltaArrow, Thumb } from "./Bits";
import type { RiftCard } from "@/lib/catalog";
import { PostList } from "./RiftComparePosts";
import { DemoPricesNotice } from "./Notices";
import { JsonLd, breadcrumbLd } from "./JsonLd";

// A RiftCompare article, published here (see lib/riftcompare-feed.ts for why
// its canonical stays on RiftCompare). What this page adds to the original is
// ours: a panel of today's prices for every card the article names, linked to
// the card pages, and links inside the article pointed at our own pages.

const MAX_CARDS = 12;
const MAX_ROWS = 40;

interface PriceRow {
  card: RiftCard;
  now: number | null;
  pct: number | null;
}

/** Every printing of the named cards, most valuable first; unpriced last. */
function priceRows(rulesNames: string[]): PriceRow[] {
  const rows: PriceRow[] = [];
  for (const rules of rulesNames.slice(0, MAX_CARDS)) {
    for (const card of printingsNamed(rules)) {
      const now = primaryPrice(latestQuote(card));
      const then = HAS_CHANGE_DATA ? primaryPrice(quoteDaysAgo(card, 7)) : null;
      rows.push({ card, now, pct: pctChange(now, then) });
    }
  }
  return rows.sort((a, b) => (b.now ?? -1) - (a.now ?? -1)).slice(0, MAX_ROWS);
}

function PriceRowItem({ row }: { row: PriceRow }) {
  const { card } = row;
  return (
    <li>
      <Link href={`/card/${card.slug}`} className="flex items-center gap-2.5 rounded-md px-1 py-1.5 hover:bg-surface-2">
        <Thumb src={card.imageThumbUrl} width={28} height={39} className="h-9 w-7 shrink-0 rounded object-cover" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-ink">{card.name}</span>
          <span className="block truncate font-mono text-[10.5px] text-ink-dim">
            {card.setCode} {card.collectorLabel}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <Money cents={row.now} className="num block text-[13px] font-semibold text-ink" />
          {HAS_CHANGE_DATA && (
            <span className="block text-[11px]">
              <DeltaArrow pct={row.pct} />
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}

export async function SyndicatedArticle({ post }: { post: RcPost }) {
  const [posts, markdown] = await Promise.all([fetchRiftComparePosts(), fetchRiftCompareArticle(post)]);
  const carried = new Set(posts.map((p) => p.slug));
  const mentioned = markdown ? cardsMentioned(markdown) : [];
  const rows = priceRows(mentioned);
  const champions = [
    ...new Map(
      mentioned
        .flatMap((r) => printingsNamed(r).slice(0, 1))
        .map((c) => championOf(c))
        .filter((c): c is NonNullable<typeof c> => !!c)
        .map((c) => [c.slug, c]),
    ).values(),
  ];
  const more = posts.filter((p) => p.slug !== post.slug).slice(0, 5);
  const original = (
    <a href={post.href} target="_blank" rel="noopener" className="text-accent hover:underline">
      RiftCompare
    </a>
  );

  return (
    <article>
      <JsonLd
        data={breadcrumbLd([
          { name: "News", path: "/news" },
          { name: post.title, path: `/news/${post.slug}` },
        ])}
      />
      <nav className="mb-3 flex items-center gap-1.5 text-[11px] text-ink-dim">
        <Link href="/news" className="hover:text-accent">
          News
        </Link>
        <span>/</span>
        <span>{post.kind === "Guide" ? "Guides" : "Latest news"}</span>
      </nav>

      <header className="mb-2 border-b border-line pb-5">
        <span
          className={`inline-flex items-center rounded px-2 py-0.5 font-display text-[10px] font-semibold uppercase tracking-[0.1em] ${
            post.kind === "Guide" ? "bg-accent/15 text-accent" : "bg-foil/15 text-foil"
          }`}
        >
          {post.kind}
        </span>
        <h1 className="mt-2.5 max-w-[26ch] font-display text-3xl font-semibold leading-[1.15] text-ink sm:text-[40px]">
          {post.title}
        </h1>
        {/* The markdown opens with this summary as its first paragraph, so it
            is only repeated here when the article itself couldn't be loaded. */}
        {!markdown && post.summary && (
          <p className="mt-3 max-w-[68ch] text-[15px] leading-relaxed text-ink-muted">{post.summary}</p>
        )}
        <p className="mt-3 text-[12.5px] text-ink-dim">
          By RiftCompare · <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time> · Originally published on{" "}
          {original}
        </p>
      </header>

      <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          {markdown ? (
            <Markdown
              source={markdown}
              resolveHref={(href) => resolveArticleHref(href, carried)}
              resolveImage={resolveArticleImage}
            />
          ) : (
            <p className="mt-5 max-w-[68ch] text-[14px] text-ink-muted">
              The full article couldn&apos;t be loaded just now.{" "}
              <a href={post.href} target="_blank" rel="noopener" className="text-accent hover:underline">
                Read it on RiftCompare ↗
              </a>
            </p>
          )}

          <aside className="mt-10 max-w-[70ch] rounded-xl border border-line bg-surface-1 p-4 text-[12.5px] leading-relaxed text-ink-muted">
            <strong className="font-semibold text-ink">From RiftCompare, our sister site.</strong> This article was
            written and first published by {original}, which compares live Riftbound prices across stores in six
            markets. Links inside it open our own card, set and champion pages where we have them. Prices in the panel
            are ours: TCGplayer market prices, updated daily.
          </aside>
        </div>

        <aside className="min-w-0 space-y-4">
          {rows.length > 0 && (
            <section className="panel min-w-0 p-3.5">
              <h2 className="eyebrow mb-1">Prices for the cards in this article</h2>
              <p className="mb-2.5 text-[11.5px] leading-relaxed text-ink-dim">
                Every printing, most valuable first, at today&apos;s TCGplayer price
                {HAS_CHANGE_DATA ? " and 7-day change" : ""}.
              </p>
              <ol className="divide-y divide-line">
                {rows.slice(0, 12).map((r) => (
                  <PriceRowItem key={r.card.id} row={r} />
                ))}
              </ol>
              {rows.length > 12 && (
                <details className="mt-1 border-t border-line pt-2">
                  <summary className="cursor-pointer text-[12px] font-semibold text-accent">
                    {rows.length - 12} more printing{rows.length - 12 === 1 ? "" : "s"}
                  </summary>
                  <ol className="mt-1 divide-y divide-line">
                    {rows.slice(12).map((r) => (
                      <PriceRowItem key={r.card.id} row={r} />
                    ))}
                  </ol>
                </details>
              )}
              <DemoPricesNotice className="mt-2.5 border-t border-line pt-2.5" />
            </section>
          )}

          {champions.length > 0 && (
            <section className="panel p-4">
              <h2 className="eyebrow mb-2">Champions in this article</h2>
              <p className="flex flex-wrap gap-1.5">
                {champions.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/champions/${c.slug}`}
                    className="rounded-md border border-line px-2 py-1 text-[12px] font-semibold text-accent hover:border-accent"
                  >
                    {c.name}
                  </Link>
                ))}
              </p>
            </section>
          )}

          {more.length > 0 && (
            <section className="panel p-4">
              <h2 className="eyebrow mb-3">More news &amp; guides</h2>
              <PostList posts={more} showSummary={false} />
              <p className="mt-3 border-t border-line pt-2.5 text-[11.5px]">
                <a href={riftcompareUrl("/blog", "article-more")} target="_blank" rel="noopener" className="text-accent hover:underline">
                  Everything on RiftCompare ↗
                </a>
              </p>
            </section>
          )}
        </aside>
      </div>
    </article>
  );
}
