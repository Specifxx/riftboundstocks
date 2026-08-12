import Link from "next/link";
import type { Article } from "@/lib/content/types";
import { CATEGORY_COLOR } from "@/lib/content/types";
import { authorOr } from "@/lib/content/authors";
import { cardBySlug } from "@/lib/catalog";
import { formatDate } from "@/lib/format";

export function CategoryLabel({ category, className = "" }: { category: Article["category"]; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 font-display text-[10px] font-semibold uppercase tracking-[0.1em] ${className}`}
      style={{ backgroundColor: CATEGORY_COLOR[category], color: "#08121e" }}
    >
      {category}
    </span>
  );
}

export function AuthorByline({ authorSlug, date, size = "sm" }: { authorSlug: string; date: string; size?: "sm" | "lg" }) {
  const author = authorOr(authorSlug);
  const px = size === "lg" ? "h-9 w-9" : "h-6 w-6";
  return (
    <div className="flex items-center gap-2">
      {/* Procedurally generated abstract mark, not a photograph — see
          lib/content/authors.ts for why these personas have no faces. */}
      <img src={author.avatar} alt="" width={36} height={36} className={`${px} shrink-0 rounded-full bg-surface-3`} loading="lazy" />
      <div className="min-w-0 leading-tight">
        <span className={`block truncate font-medium text-ink-muted ${size === "lg" ? "text-[13px]" : "text-[11.5px]"}`}>
          {author.name}
        </span>
        <span className={`block text-ink-dim ${size === "lg" ? "text-[12px]" : "text-[11px]"}`}>{formatDate(date)}</span>
      </div>
    </div>
  );
}

export function ArticleCard({ article }: { article: Article }) {
  const hero = cardBySlug(article.heroCard);
  return (
    <article className="panel group flex flex-col overflow-hidden transition-colors hover:border-line-strong">
      <Link href={`/news/${article.slug}`} className="relative block aspect-[16/9] overflow-hidden bg-surface-2">
        {hero && (
          <img
            src={hero.imageThumbUrl}
            alt=""
            className="h-full w-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-surface-0/85 via-surface-0/10 to-transparent" />
        <CategoryLabel category={article.category} className="absolute left-2.5 top-2.5" />
        {/* The grid mixes measured reports with invented demo pieces. Without a
            marker on the card itself a reader picks between them blind. */}
        <span
          className={`absolute right-2.5 top-2.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
            article.dataReport ? "bg-accent/25 text-accent" : "bg-down/20 text-down"
          }`}
        >
          {article.dataReport ? "Measured" : "Demo"}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="font-display text-[17px] font-semibold leading-snug text-ink">
          <Link href={`/news/${article.slug}`} className="group-hover:text-accent">
            {article.title}
          </Link>
        </h3>
        <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-ink-muted">{article.excerpt}</p>
        <div className="mt-auto pt-3">
          <AuthorByline authorSlug={article.author} date={article.publishedOn} />
        </div>
      </div>
    </article>
  );
}
