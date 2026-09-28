import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLES, articleBySlug, sortedArticles } from "@/lib/content/articles";
import { authorOr } from "@/lib/content/authors";
import { cardBySlug } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { ArticleBody } from "@/components/ArticleBody";
import { ArticleCard, AuthorByline, CategoryLabel } from "@/components/ArticleCard";
import { DemoPricesNotice } from "@/components/Notices";
import { JsonLd, breadcrumbLd } from "@/components/JsonLd";
import { RelatedReading } from "@/components/RiftComparePosts";
import { SyndicatedArticle } from "@/components/SyndicatedArticle";
import { rcPostBySlug } from "@/lib/riftcompare-feed";

// Two kinds of page live here: our data reports (prerendered below), and
// RiftCompare's articles, published here too and rendered on first request
// (see lib/riftcompare-feed.ts). Refreshed hourly, like the feed.
export const revalidate = 3600;

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = articleBySlug(params.slug);
  if (!article) {
    const post = await rcPostBySlug(params.slug);
    if (!post) return { title: "Article not found" };
    return {
      title: post.title,
      description: post.summary,
      // The original is RiftCompare's. Declaring it canonical keeps the two
      // copies from competing in search; this one is for reading here.
      alternates: { canonical: post.url },
      openGraph: {
        type: "article",
        title: post.title,
        description: post.summary,
        url: post.url,
        publishedTime: post.publishedAt,
        authors: ["RiftCompare"],
      },
    };
  }
  const hero = cardBySlug(article.heroCard);
  const author = authorOr(article.author);
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `${SITE_URL}/news/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      url: `${SITE_URL}/news/${article.slug}`,
      publishedTime: `${article.publishedOn}T00:00:00Z`,
      authors: [author.name],
      images: hero ? [{ url: hero.imageUrl, alt: hero.name }] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = articleBySlug(params.slug);
  if (!article) {
    const post = await rcPostBySlug(params.slug);
    if (!post) notFound();
    return <SyndicatedArticle post={post} />;
  }

  const author = authorOr(article.author);
  const related = sortedArticles()
    .filter((a) => a.slug !== article.slug)
    .slice(0, 2);
  const hero = cardBySlug(article.heroCard);
  // Cards the report discusses, for matching RiftCompare coverage of them.
  const mentioned = [
    ...new Set(
      article.body.flatMap((b) => (b.kind === "card" ? [b.slug] : b.kind === "cardTable" ? b.slugs : [])),
    ),
  ]
    .map((slug) => cardBySlug(slug)?.name.split(/,| - /)[0].trim())
    .filter((n): n is string => !!n);

  return (
    <article>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "News", path: "/news" },
            { name: article.title, path: `/news/${article.slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.title,
            description: article.excerpt,
            datePublished: `${article.publishedOn}T00:00:00Z`,
            dateModified: `${article.asOf ?? article.publishedOn}T00:00:00Z`,
            mainEntityOfPage: `${SITE_URL}/news/${article.slug}`,
            image: hero ? [hero.imageUrl] : undefined,
            author: { "@type": "Organization", name: author.name, url: SITE_URL },
            publisher: { "@id": `${SITE_URL}/#organization`, "@type": "Organization", name: SITE_NAME },
          },
        ]}
      />
      <nav className="mb-3 flex items-center gap-1.5 text-[11px] text-ink-dim">
        <Link href="/news" className="hover:text-accent">
          News
        </Link>
        <span>/</span>
        <span>{article.category}</span>
      </nav>

      <header className="mb-5 border-b border-line pb-5">
        <CategoryLabel category={article.category} />
        <h1 className="mt-2.5 max-w-[22ch] font-display text-3xl font-semibold leading-[1.15] text-ink sm:max-w-[24ch] sm:text-[44px]">
          {article.title}
        </h1>
        <p className="mt-3 max-w-[68ch] text-[15px] leading-relaxed text-ink-muted">{article.excerpt}</p>
        <div className="mt-4">
          <AuthorByline authorSlug={article.author} date={article.publishedOn} size="lg" />
        </div>
      </header>

      <ArticleBody blocks={article.body} />

      <aside className="mt-8 max-w-[68ch] rounded-xl border border-line bg-surface-1 p-4">
        <div className="flex items-start gap-3">
          <img src={author.avatar} alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-full" />
          <div>
            <p className="font-display text-[15px] font-semibold text-ink">
              {author.name} <span className="ml-1 text-[12px] font-normal text-ink-dim">{author.role}</span>
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{author.bio}</p>
            <p className="mt-2 text-[12px] leading-relaxed text-ink-dim">
              <strong className="font-semibold text-accent">This is a data report, not a written article.</strong>{" "}
              Every figure in it was computed from the TCGplayer price snapshot of{" "}
              {article.asOf ? formatDate(`${article.asOf}T00:00:00Z`) : "the day it was published"} and is re-derived
              from the source data on every build. It describes the market rather than predicting it, and it is not
              advice.
            </p>
          </div>
        </div>
      </aside>

      <DemoPricesNotice className="mt-4 max-w-[68ch]" />

      <RelatedReading terms={mentioned} title="In the news" className="mt-6 max-w-[68ch]" />

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-xl uppercase tracking-wide text-ink">More market reports</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:max-w-3xl">
            {related.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
