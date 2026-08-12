// ─────────────────────────────────────────────────────────────────────────────
// DATA REPORTS — real analysis, unlike ./articles.ts
// ─────────────────────────────────────────────────────────────────────────────
// Every figure quoted in the prose below was computed from the TCGplayer price
// snapshot of 2026-08-12 and is re-derived by scripts/verify-reports.ts, which
// fails the build if any of them stops matching the data. If you edit a number
// here, run `npm run verify:reports`.
//
// Two things follow from that, and both are deliberate:
//
//  1. The byline is the "data desk", not one of the fictional personas in
//     ./authors.ts. Real analysis under an invented human byline would be worse
//     than the demo articles, not better.
//  2. Prose figures are DATED and frozen; the embedded card tables read LIVE
//     prices and will drift away from them as the market moves. Each report says
//     so. The alternative — recomputing the prose — is not something a static
//     article can honestly do.
//
// These describe structure (what the price distribution looks like, how
// treatments are priced relative to each other), not predictions. Nothing here
// is advice.

import type { Article } from "./types";

const AS_OF = "2026-08-12";

const DISCLAIMER =
  "Data report. Every figure in this piece was computed from the TCGplayer price snapshot of 12 August 2026 and is re-checked against the source data before each build. It is a description of the market, not a forecast and not advice. Embedded card tables show live prices and will drift from the figures quoted in the text.";

/** Every report shares the same header block, so build it once. */
const report = (a: Omit<Article, "category" | "author" | "dataReport" | "asOf">): Article => ({
  ...a,
  category: "Data Report",
  author: "data-desk",
  dataReport: true,
  asOf: AS_OF,
  body: [{ kind: "quote", text: DISCLAIMER }, ...a.body],
});

export const REPORTS: Article[] = [
  report({
    slug: "metal-promos-hold-the-top-of-the-market",
    title: "Forty-Six Metal Promos Hold The Top Of The Market",
    publishedOn: "2026-08-12",
    heroCard: "teemo-swift-scout-metal-prize-wall-opp-263",
    featured: true,
    excerpt:
      "The Organized Play set contains 184 priced printings. Forty-six of them carry the Metal treatment, and their median price is $1,375.00 against $3.71 for everything else in the same set.",
    body: [
      {
        kind: "p",
        text: "Organized Play Promos is the most expensive set in Riftbound by a distance, and almost all of that value sits in one treatment. Of the 184 OPP printings with a price on 12 August 2026, 46 carry the word Metal in their product name. Those 46 have a median market price of $1,375.00. The other 138 have a median of $3.71. That is not a premium; it is two different markets filed under one set code.",
      },
      {
        kind: "p",
        text: "The gap is wide enough that every set-level statistic for OPP is really a statement about the Metal prints. The set totals $83,294.45 across its priced cards — more than Origins, Spirit Forged, Unleashed and Vendetta combined — while its median card costs $11.69. Any average you compute over the whole set describes neither group.",
      },
      { kind: "h2", text: "The top of the list" },
      {
        kind: "cardTable",
        title: "Most expensive Metal promos",
        slugs: [
          "teemo-swift-scout-metal-prize-wall-opp-263",
          "ahri-nine-tailed-fox-metal-best-of-opp-255",
          "irelia-blade-dancer-metal-prize-wall-opp-195",
          "lux-lady-of-luminosity-metal-prize-wall-opp-021",
          "jinx-loose-cannon-metal-prize-wall-opp-251",
          "kaisa-daughter-of-the-void-metal-prize-wall-opp-247",
        ],
      },
      {
        kind: "p",
        text: "Two distribution tiers account for nearly all of them. Thirty Metal prints are Prize Wall cards, with a median of $1,499.98; sixteen are Best Of cards, median $1,362.50. The tiers price almost identically, which suggests the market is valuing the Metal treatment itself rather than distinguishing between the events that handed them out.",
      },
      {
        kind: "card",
        slug: "teemo-swift-scout-metal-prize-wall-opp-263",
        note: "The most expensive printing on the site. Read the listing count on the card page before reading the price.",
      },
      { kind: "h2", text: "The number you should not trust" },
      {
        kind: "p",
        text: "A market price is derived from completed sales, and these cards do not have many. Across the whole catalogue there are 43 printings priced at $50 or more with two or fewer active listings, and the Metal prints dominate that list. Several of the headline figures above sit on a single listing, or none at all.",
      },
      {
        kind: "p",
        text: "That does not make the prices wrong. It makes them thin: a figure derived from very few transactions moves a long way on one more sale, in either direction. Treat the ranking as reliable and the precision as not.",
      },
    ],
  }),

  report({
    slug: "foil-is-the-default-printing",
    title: "Foil Is The Default, Not The Premium",
    publishedOn: "2026-08-12",
    heroCard: "order-rune-ogn-214",
    excerpt:
      "788 of the 1,376 priced printings in the catalogue have no non-foil price at all. Foil is not a treatment applied to some cards — for most of the printings tracked here, it is the only version that exists.",
    body: [
      {
        kind: "p",
        text: "Riftbound's printing structure catches out anyone who assumes a card has a regular price and a foil price sitting above it. Of the 1,376 printings with a price on 12 August 2026, 788 have no Normal market price whatsoever. Seventy-eight have only a Normal price and no foil. Just 510 — 37% — carry both.",
      },
      {
        kind: "p",
        text: "The 788 are mostly Showcase and alt-art printings, which are issued in foil only, plus the promo sets, which are foil-only almost without exception. For those cards the foil price is the card's price, and a site that only showed the Normal series would show a dash on the most valuable cards in the game.",
      },
      { kind: "h2", text: "Where both printings exist" },
      {
        kind: "p",
        text: "Among the 510 printings that do have both, the median foil multiplier is 3.05×. That is the honest headline figure for what foiling is worth in this game — but the distribution around it is extremely wide, and the widest multiples are on the cheapest cards.",
      },
      {
        kind: "cardTable",
        title: "Widest foil multiples (both printings priced)",
        slugs: ["order-rune-ogn-214", "traveling-merchant-ogn-185", "pack-of-wonders-ogn-181", "adaptatron-ogn-56"],
      },
      {
        kind: "card",
        slug: "order-rune-ogn-214",
        note: "A thirteen-cent card whose foil trades above five dollars. The multiple is enormous; the money involved is not.",
      },
      {
        kind: "p",
        text: "This is arithmetic rather than a market signal. A common that bottoms out at $0.13 has nowhere further to fall, while its foil is priced as a collectable with its own floor — so the ratio between them explodes without either number moving much. The multiplier is most informative in the middle of the price range, where both printings are genuinely traded.",
      },
    ],
  }),

  report({
    slug: "the-alt-art-premium-across-102-pairs",
    title: "The Alt-Art Premium, Measured Across 102 Pairs",
    publishedOn: "2026-08-11",
    heroCard: "akali-silent-ven-38a",
    excerpt:
      "102 cards in the catalogue exist as both a base printing and an alt art at the same collector number. The median alt art costs 5.65× its base card, and the extremes reach past 60×.",
    body: [
      {
        kind: "p",
        text: "Riftbound's alt-art printings share their base card's collector number, which makes them directly comparable in a way most premium treatments are not: same card, same set, same number, one variant letter apart. On 12 August 2026 there were 102 such pairs where both sides carried a price.",
      },
      {
        kind: "p",
        text: "The median pair puts the alt art at 5.65× the base printing. That is a much larger and much more consistent premium than foiling alone commands, and it holds across sets rather than being an artefact of one release.",
      },
      { kind: "h2", text: "The extremes are all cheap base cards" },
      {
        kind: "cardTable",
        title: "Largest alt-art premiums",
        slugs: ["akali-silent-ven-38a", "chaos-rune-ogn-166a", "calm-rune-ogn-42a", "diana-lunari-unl-79a"],
      },
      {
        kind: "p",
        text: "Akali, Silent from Vendetta shows the pattern at its sharpest: a base printing at $0.30 against an alt art at $18.94, a ratio above 60×. Three of the six Origins runes sit in the same band. In every case the base card is bulk and the alt art is a collectable, so the ratio is measuring the distance between two different kinds of demand rather than a premium on one.",
      },
      {
        kind: "p",
        text: "The practical reading: the ratio is a poor guide to what an alt art will be worth, because it is dominated by how cheap the base card happens to be. The alt art's own price band — which for the pairs above clusters between four and twenty dollars — is the more useful number.",
      },
    ],
  }),

  report({
    slug: "thirty-six-signature-prints",
    title: "Thirty-Six Signature Prints Carry $32,445 Of The Catalogue",
    publishedOn: "2026-08-11",
    heroCard: "nine-tailed-fox-ogn-303s",
    excerpt:
      "The Signature printings — the ones TCGplayer writes with an asterisk — number just 36 across every booster set, and together they account for $32,445.22 at market. Their median card costs $642.60.",
    body: [
      {
        kind: "p",
        text: "Signature prints are the scarcest tier the booster sets produce, and the catalogue contains 36 of them. Their combined market value on 12 August 2026 was $32,445.22, against a median individual price of $642.60 — a tight, expensive group with no cheap tail at all.",
      },
      {
        kind: "cardTable",
        title: "The most valuable Signature prints",
        slugs: [
          "nine-tailed-fox-ogn-303s",
          "ahri-inquisitive-sfd-227s",
          "daughter-of-the-void-ogn-299s",
          "irelia-fervent-sfd-225s",
          "scorn-of-the-moon-unl-234s",
          "bounty-hunter-ogn-309s",
        ],
      },
      {
        kind: "card",
        slug: "nine-tailed-fox-ogn-303s",
        note: "The most valuable booster-set printing in the game — and, like every Signature, foil-only.",
      },
      { kind: "h2", text: "They are overnumbered, and that is the point" },
      {
        kind: "p",
        text: "Every Signature print sits above its set's stated card count — Nine-Tailed Fox is 303 in a 298-card set. That is how the treatment is identified rather than a numbering error, and it is also why a naive catalogue import misfiles them: they share a collector number with the base card they reprint, so anything keying on the number alone collapses the two together and prices a $3,195 card as a $1 one.",
      },
      {
        kind: "p",
        text: "Every Signature print is foil-only. None has a Normal market price, which is consistent with the wider structure of the game's printings and means their headline figure is always a foil figure.",
      },
    ],
  }),

  report({
    slug: "rarity-stops-predicting-price-at-the-top",
    title: "Rarity Predicts Price, Right Up Until It Doesn't",
    publishedOn: "2026-08-10",
    heroCard: "lonely-poro-unl-221",
    excerpt:
      "Across the five booster sets the median price rises cleanly with rarity — $0.08 for Common up to $59.38 for Showcase. Then a Common turns up at $191.96.",
    body: [
      {
        kind: "p",
        text: "The rarity ladder does what it should. Measured across Origins, Proving Grounds, Spirit Forged, Unleashed and Vendetta on 12 August 2026: Common has a median of $0.08 over 279 priced printings, Uncommon $0.13 over 257, Rare $0.30 over 326, Epic $3.13 over 192 and Showcase $59.38 over 120. Five tiers, five clean steps, no inversions.",
      },
      {
        kind: "p",
        text: "The maxima tell a different story. The most expensive Common in the catalogue is $191.96 — more than sixty times the median Epic, and comfortably above most Showcase cards.",
      },
      { kind: "h2", text: "The Poro cycle" },
      {
        kind: "cardTable",
        title: "Unleashed's overnumbered Poros — all rarity Common",
        slugs: [
          "lonely-poro-unl-221",
          "plundering-poro-unl-222",
          "pouty-poro-unl-220",
          "daring-poro-unl-225",
          "veteran-poro-unl-223",
          "mystic-poro-unl-224",
        ],
      },
      {
        kind: "p",
        text: "All six are numbered above Unleashed's 219-card total, and all six are labelled Common. The rarity symbol on the card describes the slot it would occupy in a normal print run; it says nothing about a card printed outside that run. Anyone filtering the catalogue by rarity to find cheap cards will pull these six in with the bulk.",
      },
      {
        kind: "card",
        slug: "lonely-poro-unl-221",
        note: "Rarity: Common. Collector number: 221 of 219.",
      },
      {
        kind: "p",
        text: "The same trap exists in reverse on the promo sets, where TCGplayer assigns a Promo rarity that carries no scarcity information at all — it records how a card was distributed, not how often it was pulled. On this site both are shown as given rather than reinterpreted, so the filters reflect what the printing actually says.",
      },
    ],
  }),

  report({
    slug: "unleashed-and-vendetta-dropped-showcase",
    title: "Unleashed And Vendetta Contain No Showcase Cards At All",
    publishedOn: "2026-08-10",
    heroCard: "rogue-assassin-ven-189",
    excerpt:
      "Origins has 54 Showcase printings and Spirit Forged has 66. Unleashed and Vendetta have zero between them — the chase slot moved to overnumbered Rares instead.",
    body: [
      {
        kind: "p",
        text: "Comparing the five booster sets by rarity turns up a structural change that is easy to miss card-by-card. Origins contains 54 Showcase printings, with a median of $17.93 and a top card at $3,195.28. Spirit Forged contains 66, median $61.10, top $3,089.05. Unleashed contains none. Vendetta contains none.",
      },
      {
        kind: "p",
        text: "The chase cards did not disappear with them. They were renumbered: Unleashed and Vendetta's most valuable printings are labelled Rare and numbered above their set totals, in the same overnumbered band the Signature prints occupy.",
      },
      { kind: "h2", text: "What the top of Vendetta looks like" },
      {
        kind: "cardTable",
        title: "Vendetta's most valuable printings — every one a Rare",
        slugs: [
          "rogue-assassin-ven-189",
          "heart-of-the-tempest-ven-197",
          "souls-reflection-ven-195",
          "master-of-shadows-ven-191",
          "defender-of-tomorrow-ven-194",
          "kayle-justified-ven-185",
        ],
      },
      {
        kind: "p",
        text: "Every card in that table is numbered above Vendetta's 166-card count. Filtering the set by Showcase returns nothing; filtering by Rare returns both the genuine commons-and-rares body of the set and its entire chase tier, mixed together.",
      },
      {
        kind: "p",
        text: "For anyone reading set-level statistics, this matters more than it sounds. A median Rare price computed over Origins and over Vendetta is measuring two different things, because in one set the expensive printings have been moved out of the Rare pool and in the other they have not.",
      },
    ],
  }),

  report({
    slug: "what-a-booster-box-costs-against-its-set",
    title: "What A Booster Box Costs, Against What Is In The Set",
    publishedOn: "2026-08-09",
    heroCard: "nine-tailed-fox-ogn-303s",
    excerpt:
      "Origins boxes trade at $275.22 and Unleashed at $155.03. Here is how those figures sit against each set's singles — and why the comparison is not an expected value.",
    body: [
      {
        kind: "p",
        text: "The site now tracks all 54 sealed products TCGplayer lists, at their own market prices rather than a figure derived from the singles inside. On 12 August 2026 the four booster displays priced as follows: Origins $275.22, Spirit Forged $211.71, Vendetta $160.00 and Unleashed $155.03. Single packs ran $14.43, $7.90, $6.73 and $6.29 respectively.",
      },
      {
        kind: "h2",
        text: "The comparison people want, and why it isn't here",
      },
      {
        kind: "p",
        text: "The obvious next step is to divide a set's total singles value by the number of boxes it takes to open it and call the result expected value. This site does not publish that number, because computing it requires pull rates — how often each rarity and each treatment appears per pack — and those are not published by Riot and not derivable from price data. Any EV figure built without them is an assumption wearing a decimal point.",
      },
      {
        kind: "p",
        text: "What can be said honestly is the shape. Origins' priced singles total $18,146.59 against a median single of $0.29; Spirit Forged totals $14,130.17 at a $0.23 median; Unleashed $11,117.39 at $0.17; Vendetta $4,213.73 at $0.17. In every set the total is dominated by a handful of chase printings while the median card is worth less than a quarter — which is the normal shape of a booster product, and the reason box economics rest almost entirely on hit rate rather than on bulk.",
      },
      {
        kind: "card",
        slug: "nine-tailed-fox-ogn-303s",
        note: "One card accounts for roughly a sixth of Origins' entire priced singles value.",
      },
      { kind: "h2", text: "A caveat on the sealed prices themselves" },
      {
        kind: "p",
        text: "Every one of the four booster displays is still flagged presale by TCGplayer, as are the display cases above them. A presale price is an asking price for something nobody has opened, and it is not the same class of number as a market price derived from completed sales of a product in circulation.",
      },
      {
        kind: "p",
        text: "The sealed pages also deliberately omit a Low column. The cheapest listing on a sealed product is routinely not that product: sellers file accessories, empty boxes and single packs under the box listing, which is how a $12 Vendetta Booster Display ends up sitting beneath a $160 market price.",
      },
    ],
  }),

  report({
    slug: "forty-three-thin-markets",
    title: "Forty-Three Expensive Cards Have Two Listings Or Fewer",
    publishedOn: "2026-08-09",
    heroCard: "irelia-blade-dancer-metal-prize-wall-opp-195",
    excerpt:
      "A market price needs a market. Forty-three printings priced at $50 or more currently have two active listings or fewer, and several of the site's headline figures have none at all.",
    body: [
      {
        kind: "p",
        text: "TCGplayer publishes an active listing count alongside each product, and reading it next to the price changes how much weight the price can carry. On 12 August 2026 there were 43 printings priced at $50 or above with two or fewer listings live.",
      },
      {
        kind: "cardTable",
        title: "Expensive printings with almost no listings",
        slugs: [
          "teemo-swift-scout-metal-prize-wall-opp-263",
          "ahri-nine-tailed-fox-metal-best-of-opp-255",
          "irelia-blade-dancer-metal-prize-wall-opp-195",
          "lux-lady-of-luminosity-metal-prize-wall-opp-021",
        ],
      },
      {
        kind: "p",
        text: "Several of those had zero live listings at the time of the snapshot. A market price still exists for them — it is derived from completed sales, not from what is currently for sale — but with no supply on the board there is nothing to test it against, and the next transaction sets the new number more or less on its own.",
      },
      { kind: "h2", text: "Read the listing count on every card page" },
      {
        kind: "p",
        text: "The card page shows Active listings in its data panel for exactly this reason. A $2,000 price backed by sixty listings and a $2,000 price backed by one are not the same claim, and no amount of decimal places distinguishes them.",
      },
      {
        kind: "p",
        text: "The pattern is concentrated rather than random: the thin end of the market is almost entirely Metal promos and Signature prints. The booster-set body of the game — the commons, uncommons and ordinary rares — is deep enough that its prices move smoothly.",
      },
    ],
  }),

  report({
    slug: "asking-prices-run-ahead-of-sales",
    title: "Where Asking Prices Run Furthest Ahead Of Sales",
    publishedOn: "2026-08-08",
    heroCard: "kaisa-daughter-of-the-void-metal-prize-wall-opp-247",
    excerpt:
      "TCGplayer publishes both a market price and a listed median. Across cards above $5, the median asking price sits 1.42× above market — and on the thinnest cards it reaches 4.88×.",
    body: [
      {
        kind: "p",
        text: "Two of the numbers this site stores measure different things. Market price is derived from completed sales: what cards actually changed hands for. Listed median is the middle of what sellers are currently asking. The gap between them is a rough gauge of how far seller expectations sit above buyer behaviour.",
      },
      {
        kind: "p",
        text: "Across the 28 printings priced above $5 where both figures exist, the median ratio was 1.42× on 12 August 2026 — asking prices typically about 40% above the last sales. That is unremarkable for a collectables market. The tail is not.",
      },
      { kind: "h2", text: "The widest gaps" },
      {
        kind: "cardTable",
        title: "Largest gaps between listed median and market",
        slugs: [
          "kaisa-daughter-of-the-void-metal-prize-wall-opp-247",
          "kaisa-daughter-of-the-void-metal-best-of-opp-247",
          "teemo-swift-scout-metal-prize-wall-opp-263",
        ],
      },
      {
        kind: "p",
        text: "The extreme case is Kai'Sa - Daughter of the Void in its Metal Prize Wall printing, where the market price was $2,739.20 and the listed median $11,100.00 — a ratio above 4×. Lee Sin's equivalent printing showed $1,024.98 against $4,999.99, close to 5×. In both cases a single optimistic listing is doing most of the work, because there are only one or two listings in total.",
      },
      {
        kind: "p",
        text: "This is the same thinness problem measured from the other side. Where a card has few listings, the listed median is not a median of anything — it is one seller's number. The market price is the more defensible figure on these cards, and the gap is best read as a warning about sample size rather than as a spread to trade against.",
      },
      {
        kind: "p",
        text: "On the deep end of the market the two figures track each other closely, which is what makes the divergence at the top informative at all.",
      },
    ],
  }),
];
