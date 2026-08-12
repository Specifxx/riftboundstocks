// Editorial data model.
//
// ALL ARTICLES ON THIS SITE ARE DEMO CONTENT written to populate the templates.
// They describe real Riftbound cards but the analysis, the tournament results
// they cite and every price they quote are invented, and their bylines are
// fictional personas (see ./authors.ts). Nothing here is journalism or advice.

export const CATEGORIES = [
  "Weekly Winners",
  "Meta Report",
  "Hidden Gems",
  "Set Review",
  "Speculation",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Category → accent colour for the label overlay on article cards. */
export const CATEGORY_COLOR: Record<Category, string> = {
  "Weekly Winners": "#3fb950",
  "Meta Report": "#4da3ff",
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
