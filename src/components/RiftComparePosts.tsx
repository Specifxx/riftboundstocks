import { fetchRiftComparePosts, postsMentioning, type RcPost } from "@/lib/riftcompare-feed";
import { riftcompareUrl } from "@/lib/affiliate";
import { formatDateShort } from "@/lib/format";

// Links out to RiftCompare's articles. These open on riftcompare.com — they
// are the sister site's writing, not this site's — so every list says so, and
// the links are plain referrals (same owner, no commission: no `sponsored`).

function KindBadge({ kind }: { kind: RcPost["kind"] }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide ${
        kind === "Guide" ? "bg-accent/15 text-accent" : "bg-foil/15 text-foil"
      }`}
    >
      {kind}
    </span>
  );
}

export function PostList({ posts, showSummary = true }: { posts: RcPost[]; showSummary?: boolean }) {
  return (
    <ul className="divide-y divide-line">
      {posts.map((p) => (
        <li key={p.url} className="py-2.5 first:pt-0 last:pb-0">
          <a href={p.href} target="_blank" rel="noopener" className="group block">
            <span className="flex items-center gap-2 text-[11px] text-ink-dim">
              <KindBadge kind={p.kind} />
              <time dateTime={p.publishedAt}>{formatDateShort(p.publishedAt)}</time>
            </span>
            <span className="mt-1 block text-[14px] font-semibold leading-snug text-ink group-hover:text-accent">
              {p.title} <span className="text-[11px] font-normal text-ink-dim">↗</span>
            </span>
            {showSummary && p.summary && (
              <span className="mt-0.5 line-clamp-2 block text-[12.5px] leading-relaxed text-ink-muted">{p.summary}</span>
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function RiftCompareCredit({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[11px] leading-relaxed text-ink-dim ${className}`}>
      Articles open on{" "}
      <a href={riftcompareUrl("/blog", "news-credit")} target="_blank" rel="noopener" className="text-accent hover:underline">
        RiftCompare
      </a>
      , our sister site for live store prices, news and guides.
    </p>
  );
}

/**
 * RiftCompare posts that mention any of `terms` — renders NOTHING when none
 * match or the feed is unreachable, so it is safe to drop onto any page.
 */
export async function RelatedReading({
  terms,
  title = "News & guides",
  limit = 4,
  className = "",
}: {
  terms: string[];
  title?: string;
  limit?: number;
  className?: string;
}) {
  const posts = postsMentioning(await fetchRiftComparePosts(), terms, limit);
  if (posts.length === 0) return null;
  return (
    <section className={`panel min-w-0 p-4 ${className}`}>
      <h2 className="eyebrow mb-3">{title}</h2>
      <PostList posts={posts} />
      <RiftCompareCredit className="mt-3 border-t border-line pt-2.5" />
    </section>
  );
}
