// RiftCompare's blog and guides, published here too.
//
// RiftCompare (same owner — see DATA_INTEGRATION.md) publishes real, dated
// Riftbound news and guides: spoilers, ban-list reaction, set guides, buying
// guides. Each one is also readable on this site at /news/<slug>, rendered
// from RiftCompare's own markdown (/llm/<section>/<slug>) with a panel of our
// prices for the cards it mentions. Those copies declare RiftCompare's page as
// canonical: two sites publishing the same text would otherwise compete in
// search, and neither should be penalised for it. Readers stay here; search
// credit stays with the original.
//
// Read from RiftCompare's public JSON Feed (https://jsonfeed.org), cached for
// an hour by Next's data cache, so the whole site costs one request an hour no
// matter how many card pages render. On ANY failure this returns [] and every
// consumer renders nothing — the same degrade-to-absent rule as the store
// listings in lib/prices/riftcompare.ts.

import * as React from "react";
import { RIFTCOMPARE_URL, riftcompareUrl } from "./affiliate";

// See lib/prices/riftcompare.ts for why `cache` is feature-detected: scripts
// run this module outside Next, where React's server `cache` isn't exported.
const cache: <T extends (...args: never[]) => unknown>(fn: T) => T =
  typeof (React as { cache?: unknown }).cache === "function" ? (React as unknown as { cache: typeof cache }).cache : (fn) => fn;

const FEED_URL = process.env.RIFTCOMPARE_FEED_URL || `${RIFTCOMPARE_URL}/feed.json`;

export interface RcPost {
  /** Canonical URL on riftcompare.com — the original, and our copy's canonical. */
  url: string;
  /** Link to the original, with RiftCompare's referral params. */
  href: string;
  /** "riftbound-heartsteel-cards" — also our copy's path: /news/<slug>. */
  slug: string;
  /** Path on riftcompare.com, e.g. "/blog/riftbound-heartsteel-cards". */
  path: string;
  title: string;
  summary: string;
  /** ISO timestamp. */
  publishedAt: string;
  kind: "News" | "Guide";
}

interface JsonFeedItem {
  url?: string;
  id?: string;
  title?: string;
  summary?: string;
  content_text?: string;
  date_published?: string;
  tags?: string[];
}

export const fetchRiftComparePosts = cache(async (): Promise<RcPost[]> => {
  try {
    const res = await fetch(FEED_URL, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const feed = (await res.json()) as { items?: JsonFeedItem[] };
    const posts: RcPost[] = [];
    for (const it of feed.items ?? []) {
      const url = it.url ?? it.id;
      if (!url || !it.title || !it.date_published) continue;
      // Only ever link back to RiftCompare itself — a feed is external input.
      let path: string;
      try {
        const u = new URL(url);
        if (u.origin !== new URL(RIFTCOMPARE_URL).origin) continue;
        path = u.pathname;
      } catch {
        continue;
      }
      const m = path.match(/^\/(blog|guides)\/([a-z0-9-]+)\/?$/);
      if (!m) continue;
      // First wins if a blog post and a guide ever share a slug.
      if (posts.some((p) => p.slug === m[2])) continue;
      posts.push({
        url,
        href: riftcompareUrl(path, "news-feed"),
        slug: m[2],
        path: `/${m[1]}/${m[2]}`,
        title: it.title,
        summary: it.summary ?? it.content_text ?? "",
        publishedAt: it.date_published,
        kind: it.tags?.includes("guide") || path.startsWith("/guides/") ? "Guide" : "News",
      });
    }
    return posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  } catch {
    return [];
  }
});

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const fold = (s: string) => s.replace(/[’‘]/g, "'");

/**
 * Posts that mention any of `terms` as a whole word, best match first.
 *
 * A title hit outranks a summary-only hit, and ties go to the newer post.
 * Whole-word so "Vi" doesn't match "Vision" and "Jax" doesn't match "Jaxson".
 */
export function postsMentioning(posts: RcPost[], terms: string[], limit = 4): RcPost[] {
  const patterns = [...new Set(terms.filter((t) => t && t.length >= 2))].map(
    (t) => new RegExp(`(^|[^\\p{L}\\p{N}])${escape(fold(t))}(?=$|[^\\p{L}\\p{N}])`, "iu"),
  );
  if (patterns.length === 0) return [];
  const scored: { post: RcPost; score: number }[] = [];
  for (const post of posts) {
    const title = fold(post.title);
    const summary = fold(post.summary);
    let score = 0;
    for (const re of patterns) {
      if (re.test(title)) score += 2;
      else if (re.test(summary)) score += 1;
    }
    if (score > 0) scored.push({ post, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || b.post.publishedAt.localeCompare(a.post.publishedAt))
    .slice(0, limit)
    .map((s) => s.post);
}

export async function rcPostBySlug(slug: string): Promise<RcPost | null> {
  return (await fetchRiftComparePosts()).find((p) => p.slug === slug) ?? null;
}

/**
 * The article's markdown, from RiftCompare's /llm/ mirror of it. Cached for
 * six hours — articles are edited far less often than they're read — and null
 * on any failure, in which case our page falls back to the summary and a link.
 */
export const fetchRiftCompareArticle = cache(async (post: RcPost): Promise<string | null> => {
  try {
    const res = await fetch(`${RIFTCOMPARE_URL}/llm${post.path}`, {
      next: { revalidate: 21600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    // A real article starts with its "# Title"; anything else (an error page,
    // a redirect body) isn't rendered.
    return text.startsWith("# ") ? text : null;
  } catch {
    return null;
  }
});
