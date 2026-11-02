// Which card pages ask Google to index them (Search Console, 31 Oct 2026: 1,391
// of ~1,416 card pages "Discovered – currently not indexed"). Google found every
// printing and chose to crawl almost none: hundreds of bulk commons with a
// templated page each read as thin, and the same cards already rank on
// RiftCompare. So a card worth under US$1 (or with no price) stays reachable
// from its set, champion and browse pages but is noindex, follow and out of the
// sitemap, and Google's crawl goes to the cards people search prices for.
import type { RiftCard } from "@/lib/catalog";
import { latestQuote, primaryPrice } from "@/lib/prices";

export const INDEX_MIN_CENTS = 100;

export function cardIndexable(card: RiftCard): boolean {
  const p = primaryPrice(latestQuote(card));
  return p != null && p >= INDEX_MIN_CENTS;
}
