import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLES, articleBySlug, sortedArticles } from "@/lib/content/articles";
import { authorOr } from "@/lib/content/authors";
import { cardBySlug } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { ArticleBody } from "@/components/ArticleBody";
import { ArticleCard, AuthorByline, CategoryLabel } from "@/components/ArticleCard";
import { DemoPricesNotice } from "@/components/Bits";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const article = articleBySlug(params.slug);
  if (!article) return { title: "Article not found" };
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

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = articleBySlug(params.slug);
  if (!article) notFound();

  const author = authorOr(article.author);
  const related = sortedArticles()
    .filter((a) => a.slug !== article.slug && a.category === article.category)
    .slice(0, 2);

  return (
    <article>
      <nav className="mb-3 flex items-center gap-1.5 text-[11px] text-ink-dim">
        <Link href="/news" className="hover:text-accent">
          News
        </Link>
        <span>/</span>
        <Link href={`/news?category=${encodeURIComponent(article.category)}`} className="hover:text-accent">
          {article.category}
        </Link>
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

      {/* Restated at the foot of the piece as well as in the opening quote: a
          reader who lands mid-article and scrolls to the end should not be able
          to miss that the author does not exist. */}
      <aside className="mt-8 max-w-[68ch] rounded-xl border border-line bg-surface-1 p-4">
        <div className="flex items-start gap-3">
          <img src={author.avatar} alt="" width={44} height={44} className="h-11 w-11 shrink-0 rounded-full" />
          <div>
            <p className="font-display text-[15px] font-semibold text-ink">
              {author.name} <span className="ml-1 text-[12px] font-normal text-ink-dim">{author.role}</span>
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{author.bio}</p>
            {/* Two different disclosures, because these are two different kinds
                of article. Applying the "fictional persona" line to a data report
                would be false; applying the "measured" line to a demo article
                would be far worse. */}
            {author.isDesk ? (
              <p className="mt-2 text-[12px] leading-relaxed text-ink-dim">
                <strong className="font-semibold text-accent">This is a data report, not a written article.</strong>{" "}
                Every figure in it was computed from the TCGplayer price snapshot of{" "}
                {article.asOf ? formatDate(`${article.asOf}T00:00:00Z`) : "the day it was published"} and is re-derived
                from the source data on every build. It describes the market rather than predicting it, and it is not
                advice. See{" "}
                <Link href="/about" className="text-accent hover:underline">
                  About &amp; Disclaimers
                </Link>
                .
              </p>
            ) : (
              <p className="mt-2 text-[12px] leading-relaxed text-ink-dim">
                <strong className="font-semibold text-down">{author.name} is a fictional demo persona</strong> — not a
                real person, and not based on one. This article is illustrative content written to populate the site, and
                the prices, results and analysis in it are invented. See{" "}
                <Link href="/about" className="text-accent hover:underline">
                  About &amp; Disclaimers
                </Link>
                .
              </p>
            )}
          </div>
        </div>
      </aside>

      <DemoPricesNotice className="mt-4 max-w-[68ch]" />

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-xl uppercase tracking-wide text-ink">More {article.category}</h2>
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
