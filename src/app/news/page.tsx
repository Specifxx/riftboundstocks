import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES, type Category } from "@/lib/content/types";
import { sortedArticles } from "@/lib/content/articles";
import { SITE_URL } from "@/lib/site";
import { ArticleCard } from "@/components/ArticleCard";

export const metadata: Metadata = {
  title: "Riftbound News & Market Articles",
  description:
    "Weekly winners, meta reports, hidden gems, set reviews and speculation for the Riftbound TCG singles market. Demo editorial content written to illustrate the site.",
  alternates: { canonical: `${SITE_URL}/news` },
};

const PER_PAGE = 8;

export default function NewsPage({ searchParams }: { searchParams: { category?: string; page?: string } }) {
  const category = CATEGORIES.includes(searchParams.category as Category)
    ? (searchParams.category as Category)
    : null;

  const all = sortedArticles().filter((a) => !category || a.category === category);
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const pages = Math.max(1, Math.ceil(all.length / PER_PAGE));
  const visible = all.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const href = (c: Category | null, p = 1) => {
    const params = new URLSearchParams();
    if (c) params.set("category", c);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/news?${qs}` : "/news";
  };

  return (
    <div>
      <header className="mb-5">
        <h1 className="font-display text-3xl uppercase tracking-wide text-ink sm:text-4xl">News &amp; Articles</h1>
        <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-ink-muted">
          Two kinds of writing sit here, and every card says which it is.{" "}
          <strong className="font-semibold text-accent">Measured</strong> pieces are data reports: every figure in them
          is computed from the TCGplayer price snapshot and re-checked against the source data on every build.{" "}
          <strong className="font-semibold text-down">Demo</strong> pieces are illustrative content written by fictional
          personas to fill the templates — the market events they describe did not happen. See{" "}
          <Link href="/about" className="text-accent hover:underline">
            About &amp; Disclaimers
          </Link>
          .
        </p>
      </header>

      <div className="mb-5 flex flex-wrap gap-1.5">
        <Link
          href={href(null)}
          className={`rounded-md border px-2.5 py-1 text-[12px] font-semibold ${
            !category ? "border-accent bg-accent text-accent-ink" : "border-line text-ink-dim hover:text-ink"
          }`}
        >
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={href(c)}
            className={`rounded-md border px-2.5 py-1 text-[12px] font-semibold ${
              category === c ? "border-accent bg-accent text-accent-ink" : "border-line text-ink-dim hover:text-ink"
            }`}
          >
            {c}
          </Link>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="py-12 text-center text-sm text-ink-dim">No articles in this category yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {visible.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-1.5" aria-label="Pagination">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={href(category, p)}
              aria-current={p === page ? "page" : undefined}
              className={`min-w-9 rounded-md border px-3 py-1.5 text-center text-[13px] font-semibold ${
                p === page ? "border-accent bg-accent text-accent-ink" : "border-line text-ink-muted hover:text-ink"
              }`}
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
