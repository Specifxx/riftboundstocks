// Bylines. There is exactly one: the automated data desk that produces the
// data reports. The site previously carried five invented personas for demo
// articles; both were removed together.

export interface Author {
  slug: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  /**
   * Not a person at all — the site's own automated desk.
   *
   * Data reports are arithmetic over the price snapshot. This byline says
   * plainly that a script wrote them rather than implying a human analyst.
   */
  isDesk?: boolean;
}

export const AUTHORS: Author[] = [
  {
    slug: "data-desk",
    name: "RiftboundStocks Data Desk",
    role: "Automated analysis",
    bio: "Not a person. Data reports are generated from the daily TCGplayer price snapshot, and every figure in them is re-derived from the data by scripts/verify-reports.ts before the site builds. Where a number appears, it was measured — not estimated, and not written by hand.",
    avatar: "/authors/data-desk.svg",
    isDesk: true,
  },
];

const BY_SLUG = new Map(AUTHORS.map((a) => [a.slug, a]));

export function authorBySlug(slug: string): Author | undefined {
  return BY_SLUG.get(slug);
}

/** Falls back to the desk so a typo'd byline can't crash an article page. */
export function authorOr(slug: string): Author {
  return BY_SLUG.get(slug) ?? AUTHORS[0];
}
