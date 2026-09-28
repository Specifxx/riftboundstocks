// RiftCompare's URL slugs → this site's pages. Built once per process from the
// catalogue; served to RiftCompare at /api/riftcompare-links, and used here to
// point links inside syndicated RiftCompare articles at our own pages.

import { CARDS } from "./catalog";
import { SETS } from "./riftbound";
import { allChampions, championOf } from "./champions";
import { riftcompareSlugCandidates } from "./prices/riftcompare";

export interface RiftCompareMap {
  /** RiftCompare card slug → our card slug. */
  cards: Record<string, string>;
  /** RiftCompare champion slug ("kai-sa") → ours ("kaisa"). */
  champions: Record<string, string>;
  /** Set code → our set slug. */
  sets: Record<string, string>;
}

let built: RiftCompareMap | null = null;

export function riftcompareMap(): RiftCompareMap {
  if (built) return built;
  // Claimed tier by tier (see riftcompareSlugCandidates): every printing's
  // exact slug first, then renamed spellings, and so on — so a closer match
  // always beats a looser one, whichever card comes first. Within a tier the
  // first printing in catalogue order (base before promo tiers) wins.
  const cards: Record<string, string> = {};
  const all = CARDS.flatMap((c) => riftcompareSlugCandidates(c, championOf(c)?.name).map((k) => ({ ...k, card: c.slug })));
  all.sort((a, b) => a.tier - b.tier); // stable: catalogue order within a tier
  for (const k of all) if (!(k.slug in cards)) cards[k.slug] = k.card;

  // RiftCompare slugs every non-alphanumeric run to "-" ("kai-sa"); this site
  // drops apostrophes and dots first ("kaisa").
  const champions: Record<string, string> = {};
  for (const ch of allChampions()) {
    champions[ch.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")] = ch.slug;
  }

  const sets: Record<string, string> = Object.fromEntries(SETS.map((s) => [s.code, s.slug]));
  built = { cards, champions, sets };
  return built;
}
