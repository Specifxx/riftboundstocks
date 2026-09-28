import { CARDS } from "@/lib/catalog";
import { SETS } from "@/lib/riftbound";
import { allChampions, championOf } from "@/lib/champions";
import { riftcompareSlugCandidates } from "@/lib/prices/riftcompare";
import { SITE_URL } from "@/lib/site";

// Link map for RiftCompare, our sister site: RiftCompare's own URL slugs →
// the matching page here. RiftCompare reads this once a day to link each of
// its card, champion and set pages to the same card's price history on this
// site — so the join lives in ONE place (riftcompareSlugCandidates, built on
// the same port of RiftCompare's cardSlug() that backs the store listings)
// instead of RiftCompare re-deriving this site's slugs and drifting.
//
// Static: rebuilt with every deploy, which is when the catalogue can change.
export const dynamic = "force-static";

export function GET() {
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

  return Response.json(
    { site: SITE_URL, generatedAt: new Date().toISOString(), cards, champions, sets },
    { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } },
  );
}
