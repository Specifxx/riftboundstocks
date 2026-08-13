// Editorial data model.
//
// ALL ARTICLES ON THIS SITE ARE DEMO CONTENT written to populate the templates.
// They describe real Riftbound cards but the analysis, the tournament results
// they cite and every price they quote are invented, and their bylines are
// fictional personas (see ./authors.ts). Nothing here is journalism or advice.

export const CATEGORIES = [
  "Data Report",
  "Weekly Winners",
  "Meta Report",
  "Hidden Gems",
  "Set Review",
  "Speculation",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Category → accent colour for the label overlay on article cards. */
export const CATEGORY_COLOR: Record<Category, string> = {
  "Data Report": "#12897a",
  "Weekly Winners": "#3fb950",
  "Meta Report": "#12897a",
  "Hidden Gems": "#caa85a",
  "Set Review": "#a855f7",
  Speculation: "#f0506e",
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
   * The distinction from the demo articles is not cosmetic. Those are invented
   * — fictional bylines describing market events that never happened. These are
   * arithmetic over real TCGplayer data. Mixing the two without a visible marker
   * would let a reader take an invented claim for a measured one.
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
