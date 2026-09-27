// Every article hosted on this site.
//
// These are the data reports in ./reports.ts: arithmetic over the real
// TCGplayer price snapshot, re-derived by scripts/verify-reports.ts on every
// build. Written news and guides live on RiftCompare, our sister site, and are
// linked rather than copied — see lib/riftcompare-feed.ts.
//
// This file used to also hold fourteen invented "demo" pieces under fictional
// bylines. They were removed: invented market analysis next to real prices
// helped nobody, and their old URLs redirect to /news (next.config.js).

import type { Article } from "./types";
import { REPORTS } from "./reports";

export const ARTICLES: Article[] = [...REPORTS];

const BY_SLUG = new Map(ARTICLES.map((a) => [a.slug, a]));

export function articleBySlug(slug: string): Article | undefined {
  return BY_SLUG.get(slug);
}

/** Newest `publishedOn` first. ISO dates sort correctly as strings. */
export function sortedArticles(): Article[] {
  return [...ARTICLES].sort((a, b) => b.publishedOn.localeCompare(a.publishedOn));
}

export function featuredArticles(limit?: number): Article[] {
  const featured = sortedArticles().filter((a) => a.featured);
  return typeof limit === "number" ? featured.slice(0, limit) : featured;
}
