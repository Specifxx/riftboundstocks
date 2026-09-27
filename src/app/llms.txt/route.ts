import { SETS } from "@/lib/riftbound";
import { CARDS } from "@/lib/catalog";
import { allChampions } from "@/lib/champions";
import { sortedArticles } from "@/lib/content/articles";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { RIFTCOMPARE_URL } from "@/lib/affiliate";

// https://llmstxt.org — a plain-markdown map of the site for AI assistants and
// answer engines, which increasingly send visitors by citing a page. Same idea
// as RiftCompare's /llms.txt; built from the catalogue so it can't go stale.
export const dynamic = "force-static";

export function GET() {
  const body = `# ${SITE_NAME}

> Riftbound: League of Legends TCG price tracker. Daily TCGplayer market prices and price-history charts for all ${CARDS.length.toLocaleString("en-US")} printings across ${SETS.length} sets, plus sealed products, daily movers, a market index, set values and champion pages. Unofficial fan project, not affiliated with Riot Games. Prices are TCGplayer's (USD), updated once a day.

## Prices
- [Biggest movers](${SITE_URL}/interests): today's and this week's largest price rises and falls.
- [Market index](${SITE_URL}/analytics): the whole Riftbound singles market in one line, with set performance.
- [Sealed products](${SITE_URL}/sealed): booster boxes, packs, bundles and starter decks.
- [Browse all cards](${SITE_URL}/browse): every printing, filterable by set, rarity, domain and type.
- [Search](${SITE_URL}/search?q=): find a card by name or collector number.

## Sets
${SETS.map((s) => `- [${s.name} (${s.code})](${SITE_URL}/sets/${s.slug}): price list and set value.`).join("\n")}

## Champions
- [All champions](${SITE_URL}/champions): ${allChampions().length} League of Legends champions, each with every printing and its price.
- Champion pages live at ${SITE_URL}/champions/<name>, e.g. ${SITE_URL}/champions/ahri.

## Cards
- Every printing has a page at ${SITE_URL}/card/<slug> with current Market, Low, and Foil prices, a daily price chart, ban status and store comparison. Slugs are name-set-number, e.g. ${SITE_URL}/card/nine-tailed-fox-ogn-303s.

## Market reports
${sortedArticles()
  .map((a) => `- [${a.title}](${SITE_URL}/news/${a.slug}): ${a.excerpt}`)
  .join("\n")}

## Related
- [RiftCompare](${RIFTCOMPARE_URL}/llms.txt): sister site — live store prices in six markets, Riftbound news and guides.
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
