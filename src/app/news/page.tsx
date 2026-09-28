import type { Metadata } from "next";
import Link from "next/link";
import { sortedArticles } from "@/lib/content/articles";
import { fetchRiftComparePosts } from "@/lib/riftcompare-feed";
import { riftcompareUrl } from "@/lib/affiliate";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { ArticleCard } from "@/components/ArticleCard";
import { PostList, RiftCompareCredit } from "@/components/RiftComparePosts";
import { SectionTitle } from "@/components/Bits";
import { JsonLd, breadcrumbLd } from "@/components/JsonLd";

// Static and refreshed hourly: the RiftCompare feed is the only moving part.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Riftbound News, Guides & Market Reports",
  description:
    "The latest Riftbound TCG news, spoilers and buying guides, plus data reports on the Riftbound card market measured from real TCGplayer prices.",
  alternates: { canonical: `${SITE_URL}/news` },
  openGraph: {
    title: `Riftbound News, Guides & Market Reports — ${SITE_NAME}`,
    description: "Latest Riftbound news and guides, plus measured reports on the card market.",
    url: `${SITE_URL}/news`,
  },
};

export default async function NewsPage() {
  const posts = await fetchRiftComparePosts();
  // Every post is readable here, so the hub is the whole archive: the latest
  // dozen of each kind with summaries, the rest as a compact list.
  const news = posts.filter((p) => p.kind === "News");
  const guides = posts.filter((p) => p.kind === "Guide");
  const SHOWN = 12;
  const reports = sortedArticles();

  return (
    <div>
      <JsonLd data={breadcrumbLd([{ name: "News", path: "/news" }])} />
      <header className="mb-6">
        <h1 className="font-display text-3xl uppercase tracking-wide text-ink sm:text-4xl">News &amp; Analysis</h1>
        <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-ink-muted">
          What&apos;s happening in Riftbound, and what it&apos;s doing to prices. News and guides are written by{" "}
          <a href={riftcompareUrl("/blog", "news-intro")} target="_blank" rel="noopener" className="text-accent hover:underline">
            RiftCompare
          </a>
          , our sister site, and each comes with today&apos;s prices for the cards it mentions; the market reports are
          measured here, from real TCGplayer prices.
        </p>
      </header>

      {posts.length > 0 && (
        <div className="mb-10 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {(
            [
              ["Latest News", news, "/blog"],
              ["Guides", guides, "/guides"],
            ] as const
          ).map(([title, list, rcPath]) =>
            list.length > 0 ? (
              <section key={title} className="min-w-0">
                <SectionTitle href={riftcompareUrl(rcPath, "news-hub")} linkLabel="On RiftCompare">
                  {title}
                </SectionTitle>
                <div className="panel p-4">
                  <PostList posts={list.slice(0, SHOWN)} />
                  {list.length > SHOWN && (
                    <details className="mt-3 border-t border-line pt-2.5">
                      <summary className="cursor-pointer text-[12.5px] font-semibold text-accent">
                        {list.length - SHOWN} more {title === "Guides" ? "guides" : "stories"}
                      </summary>
                      <div className="mt-2.5">
                        <PostList posts={list.slice(SHOWN)} showSummary={false} />
                      </div>
                    </details>
                  )}
                </div>
              </section>
            ) : null,
          )}
          <RiftCompareCredit className="lg:col-span-2" />
        </div>
      )}

      <section>
        <SectionTitle>Market Reports</SectionTitle>
        <p className="mb-4 max-w-2xl text-[13px] leading-relaxed text-ink-muted">
          Every figure in these reports was computed from the TCGplayer price snapshot on the date shown, and is
          re-checked against the source data on every build. They describe the market — they don&apos;t predict it, and
          they aren&apos;t advice. For today&apos;s numbers, see{" "}
          <Link href="/interests" className="text-accent hover:underline">
            the biggest movers
          </Link>{" "}
          and the{" "}
          <Link href="/analytics" className="text-accent hover:underline">
            market index
          </Link>
          .
        </p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {reports.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      </section>
    </div>
  );
}
