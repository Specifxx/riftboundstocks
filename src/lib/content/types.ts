// Editorial data model. Every article on the site is a data report (see
// ./reports.ts) computed from the real price snapshot.

export const CATEGORIES = ["Data Report"] as const;

export type Category = (typeof CATEGORIES)[number];

/** Category → accent colour for the label overlay on article cards. */
export const CATEGORY_COLOR: Record<Category, string> = {
  "Data Report": "#12897a",
};

/**
 * A block of article body content.
 *
 * Deliberately a small block union rather than raw markdown: the body has to be
 * able to embed a live card — image, current price and an inline sparkline that
 * reads from the pricing adapter at render time — and a markdown string can't
 * carry a reference the price layer can resolve.
 */
export type Block =
  | { kind: "p"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "quote"; text: string }
  /** Pull-out card panel: art, live prices and a mini chart. `slug` is a card slug. */
  | { kind: "card"; slug: string; note?: string }
  /** A compact table of cards with their current price and weekly move. */
  | { kind: "cardTable"; title: string; slugs: string[] };

export interface Article {
  slug: string;
  /**
   * A DATA REPORT: every figure in it was computed from the price snapshot on
   * `asOf`, and scripts/verify-reports.ts re-derives them on every build.
   *
   * Every article on the site is one of these now; the flag is kept so the
   * UI can keep saying so explicitly.
   */
  dataReport?: boolean;
  /** Snapshot date the figures were computed from (yyyy-mm-dd). Data reports only. */
  asOf?: string;
  title: string;
  category: Category;
  /** Author slug — see ./authors.ts. */
  author: string;
  /** ISO date, yyyy-mm-dd. */
  publishedOn: string;
  /** 1–2 sentences, used on cards and as the meta description. */
  excerpt: string;
  /**
   * Card slug whose art is used as the hero/thumbnail. Using real card art keeps
   * the grid looking like the product it is, with no stock photography.
   */
  heroCard: string;
  featured?: boolean;
  body: Block[];
}
