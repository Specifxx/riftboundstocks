// ─────────────────────────────────────────────────────────────────────────────
// EVERY ARTICLE IN THIS FILE IS INVENTED DEMO CONTENT.
// ─────────────────────────────────────────────────────────────────────────────
// These pieces exist to give the editorial templates something to render. They
// are not journalism, not market analysis and not advice.
//
//   • The bylines are FICTIONAL PERSONAS (see ./authors.ts). No real writer,
//     analyst or content creator is named, quoted or alluded to.
//   • No real person, organisation, store, league or tournament appears here.
//     Where a piece needs an occasion it invents a deliberately generic one
//     ("the July regional circuit", "last weekend's open").
//   • The market activity described — moves, spreads, volumes, "weeks" — did
//     not happen. Any price band mentioned in the prose is illustrative.
//     Live figures rendered by `card` and `cardTable` blocks come from the
//     pricing adapter and are demo data, not a real market feed.
//   • The CARDS are real: every slug resolves against the catalogue, so the
//     name, set, collector number, rarity, domain and type attached to each one
//     are accurate. Nothing here describes what a card DOES — no rules text or
//     ability is asserted anywhere in this file, because this is a price site.
//
// The first body block of every article repeats the disclaimer to the reader,
// so the framing survives being deep-linked, syndicated or screenshotted.

import type { Article, Category } from "./types";
import { REPORTS } from "./reports";

const DEMO_ARTICLES: Article[] = [
  // ───────────────────────────────────────────────────────────── Weekly Winners
  {
    slug: "weekly-winners-showcase-legends-carry-a-thin-tape",
    title: "Weekly Winners: Showcase Legends Carry a Thin Tape",
    category: "Weekly Winners",
    author: "mira-castellan",
    publishedOn: "2026-05-22",
    excerpt:
      "Almost every dollar of upward movement this week came from Showcase Legends above the hundred-dollar line. Everything under twenty sat perfectly still.",
    heroCard: "virtuoso-unl-226s",
    body: [
      {
        kind: "quote",
        text: "Demo article. RiftboundStocks is an unofficial fan project; this piece, its author and the market activity it describes are illustrative and not real analysis.",
      },
      {
        kind: "p",
        text: "Weeks like this one are the reason the movers list carries a dollar column and a percentage column side by side. Nearly all of the board's upward movement came from a handful of Showcase Legends in the top price band, where a drift of a few per cent is worth more in cash terms than a doubling anywhere in the uncommon tier. Below roughly twenty dollars the tape was flat enough to be dull. That is not a market in trouble, it is a market with nothing in front of it to react to.",
      },
      { kind: "h2", text: "The top of the board did all the work" },
      {
        kind: "p",
        text: "The starred Unleashed printing of Virtuoso (UNL 226*/219) sits at the head of the list, and it has been the reference price for the set's Fury Legends since it decisively separated from the unstarred 226 in the spring. The interesting number is not either price on its own but the spread between them. When a starred variant and its base printing move in lockstep, buyers are treating them as one card with two frames; when the spread widens, they have stopped doing that, and the two printings start behaving like different assets with different buyer pools.",
      },
      {
        kind: "cardTable",
        title: "Largest dollar moves, week ending Friday",
        slugs: [
          "virtuoso-unl-226s",
          "bashful-bloom-unl-230",
          "nine-tailed-fox-ogn-303s",
          "green-father-unl-233",
          "deceiver-unl-235s",
        ],
      },
      {
        kind: "p",
        text: "Three of the five are Calm Legends, which reads like a domain story and almost certainly is not one. Calm simply has more Showcase Legends printed above the hundred-dollar line than any other domain across Origins and Unleashed, so any week that lifts the top band mechanically lifts Calm with it. Domain-level conclusions drawn from a five-row table are how people talk themselves into buying the fourth-best card in a run.",
      },
      {
        kind: "card",
        slug: "virtuoso-unl-226s",
        note: "The reference price for Unleashed Fury Legends. Watch the spread against the unstarred UNL 226 rather than the absolute figure.",
      },
      { kind: "h2", text: "What refused to move" },
      {
        kind: "p",
        text: "The base-rarity Legends were inert. Herald of the Arcane at OGN 265/298 and Relentless Storm at OGN 249/298 are both Rare printings of characters whose Showcase versions sit several multiples higher, and neither did anything at all this week. That is normal for this part of the board. Rare Legends are the most liquid, most reprinted, most evenly distributed cards in the catalogue, and they are the last thing to move when the buying is collector-led.",
      },
      {
        kind: "cardTable",
        title: "Flat on the week",
        slugs: [
          "herald-of-the-arcane-ogn-265",
          "relentless-storm-ogn-249",
          "green-father-unl-195",
          "emperor-of-the-sands-sfd-197",
        ],
      },
      {
        kind: "p",
        text: "None of this changes the shape of the market, and I would be careful reading a thin week as a trend in either direction. The honest summary is that supply at the top is genuinely scarce and gets marked up whenever two buyers turn up in the same week, while everything below it is deep enough that nothing short of a format change will shift it. Check back when there is an event on the calendar.",
      },
      {
        kind: "quote",
        text: "A flat week at the bottom of the board is information, not an absence of it. It usually means the buying is collector-led — and collector demand climbs the rarity ladder long before it spreads sideways.",
      },
    ],
  },

  {
    slug: "weekly-winners-battlefields-finally-wake-up",
    title: "Weekly Winners: Battlefields Finally Wake Up",
    category: "Weekly Winners",
    author: "mira-castellan",
    publishedOn: "2026-06-11",
    excerpt:
      "The Colorless Battlefield shelf moved as a block this week for the first time since spring, which says more about supply than about demand.",
    heroCard: "the-arenas-greatest-ogn-290",
    body: [
      {
        kind: "quote",
        text: "Demo article. RiftboundStocks is an unofficial fan project; this piece, its author and the market activity it describes are illustrative and not real analysis.",
      },
      {
        kind: "p",
        text: "Battlefields are the strangest shelf in this catalogue and the one I get asked about least. Every Battlefield printing tracked here is Uncommon and Colorless, which means they occupy a rarity slot that ordinarily guarantees a card is worth nothing, while trading in a five-to-twelve-dollar band that ordinarily belongs to Rares. This week the whole shelf moved together, and moves that are that correlated are almost always about supply rather than about anyone deciding they want the cards.",
      },
      { kind: "h2", text: "The shelf, in order" },
      {
        kind: "cardTable",
        title: "Colorless Battlefields, highest to lowest",
        slugs: [
          "the-arenas-greatest-ogn-290",
          "trapping-grounds-unl-217",
          "reckoners-arena-ogn-286",
          "the-dreaming-tree-ogn-292",
          "reavers-row-ogn-285",
          "black-flame-altar-unl-208",
          "the-candlelit-sanctum-ogn-291",
          "back-alley-bar-ogn-277",
          "ornns-forge-sfd-213",
          "emperors-dais-sfd-207",
          "vaults-of-helia-unl-219",
        ],
      },
      {
        kind: "p",
        text: "The Arena's Greatest at OGN 290/298 has been the top of this shelf for as long as the site has tracked it, and the gap between it and the next name has been widening slowly rather than in jumps. That is the signature of a card that is quietly being absorbed rather than one that is being chased. Nothing about the week suggests a sudden change of heart; the entire shelf simply repriced up by a similar proportion, which is what happens when the cheapest listings clear and the next tier of asks becomes the market.",
      },
      {
        kind: "card",
        slug: "the-arenas-greatest-ogn-290",
        note: "Top of the Battlefield shelf and the only one meaningfully clear of the pack. Uncommon rarity, Colorless, Origins 290/298.",
      },
      { kind: "h2", text: "Why the bottom of the shelf matters more" },
      {
        kind: "p",
        text: "Vaults of Helia closes out Unleashed at 219/219, and cards that sit on the last collector number of a set behave oddly for reasons that have nothing to do with the card. End-of-set numbers get opened less carefully, get set aside as filler more often, and are disproportionately the ones people cannot be bothered to list individually. Over a long enough window that thins the graded and near-mint supply in a way the raw print run does not predict. I would not buy on that alone, but it is a genuine asymmetry and it is free to watch.",
      },
      {
        kind: "p",
        text: "The Spirit Forged pair — Ornn's Forge at 213/221 and Emperor's Dais at 207/221 — remain the cheapest way to own a Battlefield, and they have been the laggards all quarter. Spirit Forged is the most recently opened of the three sets represented on this shelf, so that discount is mostly an age discount. It will compress on its own if supply behaves the way Origins supply did, and it will compress faster if the set stops being printed. Neither of those is a reason to load up today.",
      },
      {
        kind: "cardTable",
        title: "The three cheapest Battlefields",
        slugs: ["ornns-forge-sfd-213", "emperors-dais-sfd-207", "vaults-of-helia-unl-219"],
      },
      {
        kind: "p",
        text: "The one thing I would push back on is the framing I keep seeing, that Battlefields are underpriced because they are Uncommon. Rarity is not a valuation input on its own, it is a supply input, and an Uncommon from a heavily opened set can be more common than a Rare from a thin one. What makes this shelf interesting is that it is small, homogeneous and easy to price against itself — eleven cards you can rank on a single screen, which is more than can be said for the Epic tier.",
      },
    ],
  },

  {
    slug: "weekly-winners-origins-epics-catch-a-bid",
    title: "Weekly Winners: Origins Epics Catch a Bid",
    category: "Weekly Winners",
    author: "mira-castellan",
    publishedOn: "2026-07-23",
    excerpt:
      "The Origins Epic tier had its best week of the summer, led by the Chaos cards. The spread between the top Epic and the median one is now uncomfortably wide.",
    heroCard: "seal-of-discord-ogn-204",
    body: [
      {
        kind: "quote",
        text: "Demo article. RiftboundStocks is an unofficial fan project; this piece, its author and the market activity it describes are illustrative and not real analysis.",
      },
      {
        kind: "p",
        text: "Origins is the oldest set on the board and its Epic tier is the deepest single rarity band in the catalogue, which normally makes it the least exciting place to look for a weekly winner. Not this week. The tier moved as a group, the Chaos cards led it, and the distance between the top of the tier and its middle widened rather than closed. When a rarity band moves and the leaders pull away from the pack at the same time, the buying is selective, not indiscriminate.",
      },
      { kind: "h2", text: "The Chaos pair set the tone" },
      {
        kind: "p",
        text: "Seal of Discord is a Chaos Gear at OGN 204/298 and has been the most expensive Origins Epic on this site all year, comfortably clear of the field. Yasuo, Windrider sits directly behind it at 205/298 — adjacent collector numbers, same domain, and a persistent price relationship that has held through two quarters. Adjacent-number pairs like this get bought together by people completing a run, which is a real and underrated source of correlated demand that has nothing to do with how either card is used.",
      },
      {
        kind: "cardTable",
        title: "Origins Epics, top of the tier",
        slugs: [
          "seal-of-discord-ogn-204",
          "yasuo-windrider-ogn-205",
          "zenith-blade-ogn-262",
          "mystic-reversal-ogn-80",
          "noxian-guillotine-ogn-254",
          "dragons-rage-ogn-258",
        ],
      },
      {
        kind: "card",
        slug: "seal-of-discord-ogn-204",
        note: "Chaos Gear, Origins 204/298. The most expensive Origins Epic tracked here and the anchor the rest of the tier prices against.",
      },
      { kind: "h2", text: "The middle of the tier is where the value is" },
      {
        kind: "p",
        text: "Below the leaders, Origins Epics bunch into a tight band that has barely moved all year. Showstopper, Stormbringer, Super Mega Death Rocket! and Baited Hook are separated by small single-digit differences, and I would treat their ordering within that band as noise rather than as a ranking. That kind of clustering is what a mature, well-supplied rarity tier looks like. It also means any one of them can jump to the front of the pack on very little volume, which is the risk and the opportunity in the same sentence.",
      },
      {
        kind: "cardTable",
        title: "The clustered middle",
        slugs: [
          "showstopper-ogn-270",
          "stormbringer-ogn-250",
          "super-mega-death-rocket-ogn-252",
          "baited-hook-ogn-242",
          "miss-fortune-captain-ogn-162",
          "leona-zealot-ogn-79",
        ],
      },
      {
        kind: "p",
        text: "It is worth noting what did not participate. The Origins Rares — Falling Star at 029/298, Convergent Mutation at 108/298, King's Edict at 237/298 — sat out the week entirely, and so did the set's Uncommons. A rarity tier moving without the tier directly beneath it is the clearest available sign that the buying is coming from people completing a specific band rather than from anyone acquiring the set broadly. Those two behaviours have very different half-lives.",
      },
      {
        kind: "cardTable",
        title: "The Origins Rares, which did nothing",
        slugs: ["falling-star-ogn-29", "convergent-mutation-ogn-108", "kings-edict-ogn-237"],
      },
      {
        kind: "p",
        text: "One caution before anyone extrapolates. A single strong week in the oldest set on the board is much more likely to be a supply event than a demand event — a large collection breaking up, a store clearing stock, a run of listings expiring — and those look identical to enthusiasm on a seven-day chart. The test is whether the tier holds its new level through a quiet fortnight. If it gives it all back by the middle of August, this was inventory, not interest.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────── Meta Report
  {
    slug: "meta-report-the-fury-shelf-is-doing-something-odd",
    title: "Meta Report: The Fury Shelf Is Doing Something Odd",
    category: "Meta Report",
    author: "devon-okafor",
    publishedOn: "2026-05-29",
    excerpt:
      "Fury has more expensive Legends than any other domain and the widest internal spreads. Both of those facts have the same cause, and it is not demand.",
    heroCard: "loose-cannon-ogn-301",
    body: [
      {
        kind: "quote",
        text: "Demo article. RiftboundStocks is an unofficial fan project; this piece, its author and the market activity it describes are illustrative and not real analysis.",
      },
      {
        kind: "p",
        text: "If you sort the whole catalogue by price and colour the rows by domain, Fury is the first thing you notice. It has more entries in the top fifty than any other domain, it appears in all four sets at the top of the board, and it contains the widest gaps between a base printing and its starred counterpart anywhere in the data. It is tempting to read that as Fury being the strongest domain. I think it is mostly an artefact of how the Legends were distributed across sets, and it is worth walking through why.",
      },
      { kind: "h2", text: "The Origins pairs tell the story" },
      {
        kind: "p",
        text: "Loose Cannon exists as a Showcase Legend at OGN 301/298 and again as a starred printing at 301*/298, and the base sits above the star. Hand of Noxus, one number later at 302, does the opposite by a wide margin: the star trades at multiples of the base. Same domain, same set, adjacent collector numbers, same rarity tier, and opposite spreads. Whatever is driving those gaps, it is not a property of Fury and it is not a property of the star.",
      },
      {
        kind: "cardTable",
        title: "Fury Showcase Legends, Origins",
        slugs: [
          "loose-cannon-ogn-301",
          "loose-cannon-ogn-301s",
          "hand-of-noxus-ogn-302s",
          "hand-of-noxus-ogn-302",
          "daughter-of-the-void-ogn-299s",
          "relentless-storm-ogn-300",
        ],
      },
      {
        kind: "p",
        text: "The most defensible explanation is per-printing scarcity that is invisible from the outside. Two printings of the same character can have very different surviving populations depending on how each was distributed, and the market prices what it can actually find. Anyone who tells you they know the relative print runs here is guessing. What we can observe is that the spreads are stable over months, which means the market has settled on an answer even if it cannot articulate one.",
      },
      { kind: "h2", text: "Unleashed inverted the pattern" },
      {
        kind: "p",
        text: "In Unleashed, the Fury top end is led by Virtuoso, where the starred 226*/219 sits above the base 226/219 — the reverse of Loose Cannon. Bloodharbor Ripper at 228/219 and Piltover Enforcer at 229/219 fill in beneath them with no starred counterpart tracked at all, and the drop from Bloodharbor Ripper to Piltover Enforcer is one of the steepest single steps in the domain. A shelf with a cliff in the middle of it usually means the cards below the cliff are being valued as set-completion filler rather than as objects anyone specifically wants.",
      },
      {
        kind: "card",
        slug: "bloodharbor-ripper-unl-228",
        note: "Unleashed 228/219, Showcase Fury Legend. The last card above the cliff in the Unleashed Fury run.",
      },
      {
        kind: "p",
        text: "Spirit Forged's Fury Legends — Glorious Executioner at 242/221, Purifier at 241/221, Void Burrower at 243/221 — sit in a tight cluster well below the Origins and Unleashed leaders. That is what you would expect from the newest set with the most open supply, and I would not read anything into their ordering yet. Ninety days is not enough time for a Legend run to find its levels.",
      },
      {
        kind: "cardTable",
        title: "Fury Legends, Spirit Forged",
        slugs: ["glorious-executioner-sfd-242", "purifier-sfd-241", "void-burrower-sfd-243"],
      },
      {
        kind: "p",
        text: "The practical takeaway is narrow. Fury's apparent strength at the top of the board is a composition effect, and the domain's cheap end — the Fury Epics and Uncommons in Origins — has not participated in any of it. If Fury were genuinely bid as a domain you would see that turn up in the Gear and the Uncommons first, because that is where marginal buyers with a budget go. It has not, and until it does I would treat the top of the Fury shelf as a collectibles story rather than a format one.",
      },
    ],
  },

  {
    slug: "meta-report-body-domains-quiet-consolidation",
    title: "Meta Report: Body Domain's Quiet Consolidation",
    category: "Meta Report",
    author: "devon-okafor",
    publishedOn: "2026-06-26",
    excerpt:
      "Body has the shortest top-end run of any coloured domain and the flattest distribution beneath it. That combination usually precedes a repricing.",
    heroCard: "the-boss-ogn-310",
    body: [
      {
        kind: "quote",
        text: "Demo article. RiftboundStocks is an unofficial fan project; this piece, its author and the market activity it describes are illustrative and not real analysis.",
      },
      {
        kind: "p",
        text: "Body is the domain I would call the most orderly on the board, which is a compliment and a warning at once. Its Showcase Legends occupy a narrower price range than Fury's or Calm's, its Epics are tightly bunched, and its Uncommons sit almost on top of one another. Orderly shelves are pleasant to look at and easy to price, but they also give a single unexpected buyer far more leverage over the visible market than a shelf with real depth would.",
      },
      { kind: "h2", text: "The top end is three cards deep" },
      {
        kind: "p",
        text: "The Boss at OGN 310/298 leads, Keeper of the Hammer occupies both a base and a starred slot in Unleashed at 237/219, and Bounty Hunter at OGN 309/298 sits some way behind. Battle Mistress at SFD 250/221 rounds out the Showcase Legends and is the cheapest of them by a comfortable margin, consistent with Spirit Forged's later release. Four names across three sets, and that is the entire Body top end. By comparison Calm has roughly twice the entries above the hundred-dollar line and Fury has more than that. The practical consequence is that there is no second tier to fall back on: if one of these four is unavailable, a buyer's next option is a card at a third of the price, not a close substitute.",
      },
      {
        kind: "cardTable",
        title: "Body Showcase Legends",
        slugs: [
          "the-boss-ogn-310",
          "keeper-of-the-hammer-unl-237s",
          "keeper-of-the-hammer-unl-237",
          "bounty-hunter-ogn-309",
          "battle-mistress-sfd-250",
        ],
      },
      {
        kind: "card",
        slug: "the-boss-ogn-310",
        note: "Origins 310/298, Showcase Body Legend, and the highest collector number tracked in the set.",
      },
      { kind: "h2", text: "Sivir is the interesting case" },
      {
        kind: "p",
        text: "Sivir, Ambitious appears twice in Spirit Forged: as an Epic Unit at 120/221 and as a Showcase at 120a/221. The Showcase trades at roughly four times the Epic, which is a wider multiple than most base-to-alt pairs in this data and considerably wider than the Body Legends' own spreads. Rengar, Trophy Hunter at UNL 120/219 — same collector number, different set — sits between the two, which is a coincidence but a useful one for anyone trying to hold three price points in their head at once.",
      },
      {
        kind: "cardTable",
        title: "Body Epics and their alt-art counterparts",
        slugs: [
          "sivir-ambitious-sfd-120a",
          "rengar-trophy-hunter-unl-120",
          "sivir-ambitious-sfd-120",
          "miss-fortune-captain-ogn-162",
          "riposte-sfd-206",
          "grand-duelist-sfd-205",
        ],
      },
      {
        kind: "p",
        text: "Beneath the Epics, Body's Uncommons are the flattest group in the catalogue. Kinkou Monk at OGN 141/298 and Herald of Scales at OGN 140/298 are adjacent numbers within cents of each other, and Ruin Runner and Fae Dragon from Spirit Forged bracket them closely. There is no ranking to be extracted from differences that small; they are one round of listings away from swapping places in either direction.",
      },
      {
        kind: "cardTable",
        title: "Body Uncommons, effectively tied",
        slugs: [
          "ruin-runner-sfd-105",
          "kinkou-monk-ogn-141",
          "herald-of-scales-ogn-140",
          "fae-dragon-sfd-101",
        ],
      },
      {
        kind: "p",
        text: "My working view is that Body is priced as a domain nobody has an opinion about, and that state does not last. The shallow top end means a modest change in demand gets expressed as a large percentage move on very little volume, and the flat bottom means there is nothing underneath to cushion it. I am not predicting a direction here. I am saying the domain is set up so that whatever happens next will look dramatic on a chart, and readers should discount the drama accordingly.",
      },
    ],
  },

  {
    slug: "meta-report-order-is-the-cheapest-domain-on-the-board",
    title: "Meta Report: Order Is the Cheapest Domain on the Board",
    category: "Meta Report",
    author: "devon-okafor",
    publishedOn: "2026-08-04",
    excerpt:
      "Order has no Showcase Legend anywhere in the tracked catalogue. Its most expensive card is a Rune, and that single structural fact explains most of its price behaviour.",
    heroCard: "baited-hook-ogn-242",
    featured: true,
    body: [
      {
        kind: "quote",
        text: "Demo article. RiftboundStocks is an unofficial fan project; this piece, its author and the market activity it describes are illustrative and not real analysis.",
      },
      {
        kind: "p",
        text: "Every column about domain pricing eventually runs into Order and has to explain it away. Fury, Calm, Mind and Body all have Showcase Legends anchoring their top ends at three-figure prices. Order does not have one in the tracked catalogue at all. Its most expensive entry is a Rune, and after that it drops straight into the Epic tier. That is a structural gap, not a demand signal, and almost every strange thing about Order's price behaviour follows from it.",
      },
      { kind: "h2", text: "A Rune at the top is unusual" },
      {
        kind: "p",
        text: "Order Rune at OGN 214a/298 is a Showcase printing of a Rune, and it carries the domain on its own. Runes are a type that ordinarily lives in the cheap end of a catalogue, so a Showcase Rune sitting where another domain would have a Legend creates an odd shelf: one expensive card with nothing structurally similar beneath it to price against. Cards without comparables are the hardest to value and the easiest to mismark in both directions.",
      },
      {
        kind: "card",
        slug: "order-rune-ogn-214a",
        note: "Origins 214a/298, Showcase Rune. The most expensive Order card tracked here, and the only one above the Epic tier.",
      },
      {
        kind: "p",
        text: "Below it, the Order Epics form a small and fairly rational group. Baited Hook is a Gear at OGN 242/298, Corina Veraza is a Unit at SFD 179/221, and The Ruination is a Spell at UNL 180/219 — three sets, three types, and a spread narrow enough that they clearly price against one another rather than against the Rune. King's Edict at OGN 237/298 is the Rare that sits just underneath and functions as the floor for the whole domain.",
      },
      {
        kind: "cardTable",
        title: "The entire Order shelf above five dollars",
        slugs: [
          "order-rune-ogn-214a",
          "baited-hook-ogn-242",
          "corina-veraza-sfd-179",
          "the-ruination-unl-180",
          "kings-edict-ogn-237",
          "noxian-drummer-ogn-222",
          "deathgrip-sfd-163",
          "salvage-ogn-224",
        ],
      },
      { kind: "h2", text: "What a missing top end does to everything else" },
      {
        kind: "p",
        text: "Domains with expensive Legends get a steady trickle of attention from collectors working down from the top, and that attention supports the Epics and Rares underneath. Order has no such trickle, so its mid-tier is priced almost entirely by whatever players are doing, with no collector bid layered on top. In practice that makes Order the most honest domain on the board and also the most vulnerable: when interest fades, there is nothing structural holding the prices up.",
      },
      {
        kind: "p",
        text: "It also means the domain's Uncommons behave differently from the others. Noxian Drummer, Deathgrip and Salvage are all within about a dollar and a half of each other, which is normal, but they have been more responsive to short-term movement than the equivalent Body or Calm Uncommons over the same period. Thin collector interest cuts both ways; it removes the ceiling as well as the floor.",
      },
      {
        kind: "p",
        text: "I would not call Order cheap in the sense of being a bargain — a domain can be inexpensive for perfectly good structural reasons and stay that way indefinitely. What I would say is that Order is the one domain where price movement is likely to reflect actual play patterns rather than the collectibles market, which makes it the most useful domain to watch if what you care about is format demand. That is a narrow use, but it is a real one.",
      },
      {
        kind: "quote",
        text: "A domain with no chase card is a domain with no collector floor. That makes Order's chart the closest thing on this site to a pure demand signal — and the least forgiving one.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────── Hidden Gems
  {
    slug: "hidden-gems-the-uncommons-that-are-not-bulk",
    title: "Hidden Gems: The Uncommons That Are Not Bulk",
    category: "Hidden Gems",
    author: "renata-suarez",
    publishedOn: "2026-06-03",
    excerpt:
      "Nineteen Uncommons in this catalogue trade above five dollars. That is not what an Uncommon is supposed to do, and the reasons vary card by card.",
    heroCard: "stacked-deck-ogn-183",
    body: [
      {
        kind: "quote",
        text: "Demo article. RiftboundStocks is an unofficial fan project; this piece, its author and the market activity it describes are illustrative and not real analysis.",
      },
      {
        kind: "p",
        text: "The word bulk does a lot of unearned work in this hobby. It usually means Common and Uncommon, sorted by rarity symbol and priced by the pound, and for most of any set that is a perfectly sensible way to handle inventory. But there is a group of Uncommons here that trades in the same band as some Rares, and if you are pulling them out of boxes by rarity symbol you are throwing away real money in a way that compounds over a few hundred boxes.",
      },
      { kind: "h2", text: "The list, and what it has in common" },
      {
        kind: "cardTable",
        title: "Uncommons above five dollars",
        slugs: [
          "stacked-deck-ogn-183",
          "back-off-unl-42",
          "mosstomper-unl-47",
          "deadly-flourish-unl-73",
          "ruin-runner-sfd-105",
          "noxian-drummer-ogn-222",
          "deathgrip-sfd-163",
          "kinkou-monk-ogn-141",
          "herald-of-scales-ogn-140",
          "iron-ballista-ogn-17",
        ],
      },
      {
        kind: "p",
        text: "What strikes me about that table is how little the entries have in common. They span all four sets, six domains and four card types — Spells, Units and Gear are all represented, and the spread from top to bottom is under four dollars. There is no single explanation available. Some of these are almost certainly format staples with genuine ongoing demand, some are almost certainly low-print-run oddities, and from the outside those two look identical.",
      },
      {
        kind: "card",
        slug: "stacked-deck-ogn-183",
        note: "Origins 183/298, Chaos Spell, Uncommon — and the most expensive Uncommon in the catalogue outside the Battlefield shelf.",
      },
      { kind: "h2", text: "The Origins Gear pair" },
      {
        kind: "p",
        text: "Iron Ballista at OGN 017/298 and Unlicensed Armory at OGN 023/298 are both Fury Gear from the low collector numbers of the oldest set, and they have held a stable relationship to each other for months. Low collector numbers matter more than people expect: they are the first cards out of a box, the first ones sorted, and the ones most likely to end up in a binder rather than a bulk bin. That tends to preserve condition and thin the near-mint supply less than the numbers alone would suggest.",
      },
      {
        kind: "p",
        text: "At the bottom of the group, Treasure Trove, Dangerous Duo and Fae Dragon are all hovering just under six dollars, and I would treat that as the practical boundary of the shelf rather than a meaningful ranking. Below about five and a half dollars an Uncommon is competing with shipping costs and seller attention, and prices in that region are as much about the friction of listing a cheap card as about the card.",
      },
      {
        kind: "cardTable",
        title: "The bottom of the shelf",
        slugs: [
          "soul-shepherd-unl-77",
          "stellacorn-herder-sfd-48",
          "salvage-ogn-224",
          "treasure-trove-ogn-186",
          "dangerous-duo-ogn-16",
          "fae-dragon-sfd-101",
        ],
      },
      {
        kind: "p",
        text: "One pattern does hold across the whole list, and it is worth stating because it cuts against the usual advice. Unleashed and Spirit Forged contribute a disproportionate share of the expensive Uncommons relative to how many cards they contain, while Origins — much the largest set here — contributes fewer than its size would predict. The straightforward reading is that Origins has simply been opened for longer, and time is the thing that grinds an Uncommon down to bulk. Newer sets have not had that done to them yet.",
      },
      {
        kind: "p",
        text: "The operational advice is dull and I stand by it. If you open sealed product in any quantity, keep a printed list of the Uncommons above your bulk threshold taped inside the sorting box, and update it quarterly. It costs nothing, it takes ten seconds per box, and it is the single highest-return habit available to someone who is not trying to time the market. Everything else in this column is speculation; that part is just arithmetic.",
      },
    ],
  },

  {
    slug: "hidden-gems-battlefield-bulk-that-is-not-bulk",
    title: "Hidden Gems: Battlefield Bulk That Is Not Bulk",
    category: "Hidden Gems",
    author: "renata-suarez",
    publishedOn: "2026-07-09",
    excerpt:
      "Every Battlefield in this catalogue is an Uncommon, and every one of them trades above five dollars. The rarity symbol is lying to you.",
    heroCard: "reckoners-arena-ogn-286",
    body: [
      {
        kind: "quote",
        text: "Demo article. RiftboundStocks is an unofficial fan project; this piece, its author and the market activity it describes are illustrative and not real analysis.",
      },
      {
        kind: "p",
        text: "I wrote last month about Uncommons that are not bulk, and the single largest category of them is one I deliberately left out because it deserves its own piece. Every Battlefield tracked on this site is an Uncommon, every one of them is Colorless, and not one of them trades below five dollars. That is a rarity symbol comprehensively failing to describe what a card is worth, and it is the clearest example of the phenomenon anywhere in the catalogue.",
      },
      { kind: "h2", text: "Eleven cards, three sets" },
      {
        kind: "cardTable",
        title: "The full Battlefield shelf",
        slugs: [
          "the-arenas-greatest-ogn-290",
          "trapping-grounds-unl-217",
          "reckoners-arena-ogn-286",
          "the-dreaming-tree-ogn-292",
          "reavers-row-ogn-285",
          "black-flame-altar-unl-208",
          "the-candlelit-sanctum-ogn-291",
          "back-alley-bar-ogn-277",
          "ornns-forge-sfd-213",
          "emperors-dais-sfd-207",
          "vaults-of-helia-unl-219",
        ],
      },
      {
        kind: "p",
        text: "Origins supplies six of the eleven, which makes sense for the largest and oldest set, and the Origins entries cluster in a run of high collector numbers from 277 to 292. Unleashed contributes three and Spirit Forged two. What that distribution means in practice is that anyone building a complete Battlefield collection is buying across three sets simultaneously, and cross-set completion demand is stickier than single-set demand because it does not go away when one set falls out of fashion.",
      },
      {
        kind: "card",
        slug: "reckoners-arena-ogn-286",
        note: "Origins 286/298. Sits in the middle of the shelf and has tracked the group average more closely than any other Battlefield.",
      },
      { kind: "h2", text: "Why the whole shelf sits above five dollars" },
      {
        kind: "p",
        text: "The obvious explanation is that Battlefields are a distinct card type that any collection needs some of, and that demand is spread across a much smaller pool of printings than Units or Spells. Eleven tracked cards against hundreds of Units means each Battlefield absorbs a proportionally larger share of type-completion buying. The less obvious factor is that they are landscape-oriented in a portrait-oriented catalogue, which affects how they are stored, sleeved and shipped — and anything that adds handling friction thins the well-preserved supply over time.",
      },
      {
        kind: "p",
        text: "The Spirit Forged pair are the cheapest on the shelf and have been all quarter. Ornn's Forge at 213/221 and Emperor's Dais at 207/221 carry the standard newest-set discount, and I have watched that discount narrow slowly rather than collapse. If you want exposure to this shelf and are not in a hurry, that is where the arithmetic is friendliest, with the obvious caveat that a set still in print can stay discounted for a long time.",
      },
      {
        kind: "cardTable",
        title: "The newest-set discount",
        slugs: ["ornns-forge-sfd-213", "emperors-dais-sfd-207", "black-flame-altar-unl-208"],
      },
      {
        kind: "p",
        text: "The thing I would not do is treat the ordering within this shelf as a quality ranking. The gap between the third card and the eighth is under two dollars, and at that scale you are measuring listing behaviour, not desirability. Buy the ones you are missing, ignore the ones you already have, and stop refreshing the page. The shelf as a whole is the interesting object here; the individual rows mostly are not.",
      },
      {
        kind: "quote",
        text: "A rarity symbol tells you how a card was inserted into packs. It does not tell you how many survived, how many were sleeved, or how many people need one — and Battlefields fail all three of those tests in the collector's favour.",
      },
    ],
  },

  {
    slug: "hidden-gems-spirit-forgeds-overlooked-middle",
    title: "Hidden Gems: Spirit Forged's Overlooked Middle",
    category: "Hidden Gems",
    author: "renata-suarez",
    publishedOn: "2026-08-07",
    excerpt:
      "Everyone priced the Spirit Forged Showcase Legends on release and then stopped looking. The set's Epic and Uncommon tiers are still trading at opening levels.",
    heroCard: "ruin-runner-sfd-105",
    body: [
      {
        kind: "quote",
        text: "Demo article. RiftboundStocks is an unofficial fan project; this piece, its author and the market activity it describes are illustrative and not real analysis.",
      },
      {
        kind: "p",
        text: "Spirit Forged got the attention any new set gets for about six weeks, almost all of it directed at the Showcase Legends in the 240s. Emperor of the Sands and Fire Below the Mountain were priced, argued about and then left alone, and the rest of the set has been drifting sideways ever since. That is the normal life cycle of a release and it is also where the least competitive part of the market lives, because nobody is watching the middle of a set once the chase cards have settled.",
      },
      { kind: "h2", text: "The Epic tier never repriced" },
      {
        kind: "p",
        text: "Spirit Forged's Epics sit in a band that has barely moved since the set's first month. Rabadon's Deathcrown is a Calm Gear at 191/221, Irelia, Fervent is a Calm Unit at 057/221, and Riposte, Arcane Shift and Downwell fill in beneath them across three different domains. Compare that spread to the equivalent Origins Epic tier, which has had two years to sort itself out and now shows a much clearer top-to-bottom ordering. Spirit Forged's Epics still look like a set that has not been priced by anyone, only listed.",
      },
      {
        kind: "cardTable",
        title: "Spirit Forged Epics",
        slugs: [
          "rabadons-deathcrown-sfd-191",
          "irelia-fervent-sfd-57",
          "riposte-sfd-206",
          "sivir-ambitious-sfd-120",
          "corina-veraza-sfd-179",
          "reksai-breacher-sfd-29",
          "arcane-shift-sfd-200",
          "downwell-sfd-147",
        ],
      },
      {
        kind: "card",
        slug: "irelia-fervent-sfd-57",
        note: "Spirit Forged 057/221, Epic Calm Unit. One of the few low-collector-number Epics in the set.",
      },
      { kind: "h2", text: "The Uncommons are the actual gems" },
      {
        kind: "p",
        text: "Four Spirit Forged Uncommons trade above five dollars: Ruin Runner at 105/221, Deathgrip at 163/221, Stellacorn Herder at 048/221 and Fae Dragon at 101/221. They span Body, Order and Calm, which rules out a domain explanation, and they are separated by well under two dollars, which rules out any confident ranking. What they share is that they are from the newest set on the board and are therefore the most likely of any Uncommons here to still be sitting in unsorted boxes.",
      },
      {
        kind: "cardTable",
        title: "Spirit Forged Uncommons above five dollars",
        slugs: [
          "ruin-runner-sfd-105",
          "deathgrip-sfd-163",
          "stellacorn-herder-sfd-48",
          "fae-dragon-sfd-101",
        ],
      },
      {
        kind: "p",
        text: "There is a real asymmetry in newest-set Uncommons and it is not a clever one. Sorting standards slip when a set is fresh, because nobody has memorised which cards matter yet, and the cards that end up mis-sorted into bulk are disproportionately the ones with no obvious visual signal of value. By the time the community has learned the list, most of the mis-sorted copies have been sold at bulk rates. That window is measured in months, and for Spirit Forged it is closing.",
      },
      {
        kind: "p",
        text: "I want to be clear about the limits of this. None of these cards is going to make anyone's year, the total spread across the group is a few dollars, and the transaction costs on a five-dollar card are brutal if you are buying singles one at a time. This is a piece about not throwing money away while sorting, not a buy recommendation. The correct action is to know the list, not to go shopping.",
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────── Set Review
  {
    slug: "set-review-unleashed-at-ninety-days",
    title: "Set Review: Unleashed at Ninety Days",
    category: "Set Review",
    author: "priya-raghunathan",
    publishedOn: "2026-06-17",
    excerpt:
      "Unleashed has the steepest top end of any set tracked here and almost nothing between its Legends and its Uncommons. The ninety-day review is less flattering than the release one was.",
    heroCard: "bashful-bloom-unl-230",
    featured: true,
    body: [
      {
        kind: "quote",
        text: "Demo article. RiftboundStocks is an unofficial fan project; this piece, its author and the market activity it describes are illustrative and not real analysis.",
      },
      {
        kind: "p",
        text: "I review every set twice, at release and ninety days later, on the theory that the second review is the one worth reading. The release review is written against hype and preorder prices; the ninety-day review is written against whatever the market actually decided. Unleashed is a set where those two documents disagree substantially, and the disagreement is almost entirely about shape rather than about level.",
      },
      { kind: "h2", text: "The Legend run is the whole set" },
      {
        kind: "p",
        text: "Unleashed's Showcase Legends occupy collector numbers 226 through 237 in a run of 219, and they contain the top of the set by a very large margin. Virtuoso in both its starred and unstarred printings, Bashful Bloom at 230, Green Father at 233, Deceiver at 235*, Gloomist at 232* and Scorn of the Moon at 234 all sit above the hundred-dollar line. No other tier in the set comes close. This is a set whose value is concentrated in about a dozen printings.",
      },
      {
        kind: "cardTable",
        title: "Unleashed Showcase Legends",
        slugs: [
          "virtuoso-unl-226s",
          "bashful-bloom-unl-230",
          "green-father-unl-233",
          "deceiver-unl-235s",
          "virtuoso-unl-226",
          "gloomist-unl-232s",
          "scorn-of-the-moon-unl-234",
          "bloodharbor-ripper-unl-228",
          "keeper-of-the-hammer-unl-237s",
          "keeper-of-the-hammer-unl-237",
        ],
      },
      {
        kind: "card",
        slug: "bashful-bloom-unl-230",
        note: "Unleashed 230/219, Showcase Calm Legend. The set's most stable high-end printing over the review window.",
      },
      { kind: "h2", text: "The middle is thinner than it looked" },
      {
        kind: "p",
        text: "Below the Legends, Unleashed's Epic tier is small and its ordering is unstable. Rengar, Trophy Hunter at 120/219 leads it, with Death from Below, Inviolus Vox, Shadow and Vi, Hotheaded following in a band narrow enough that their order has changed more than once since April. Master Yi, Unstoppable and The Ruination bring up the rear. A set with a dozen expensive Legends and an Epic tier this compressed is a set that rewards buying singles and punishes buying boxes.",
      },
      {
        kind: "cardTable",
        title: "Unleashed Epics",
        slugs: [
          "rengar-trophy-hunter-unl-120",
          "death-from-below-unl-186",
          "inviolus-vox-unl-27",
          "shadow-unl-194",
          "vi-hotheaded-unl-30",
          "master-yi-unstoppable-unl-59",
          "the-ruination-unl-180",
        ],
      },
      {
        kind: "p",
        text: "The starred-versus-base question is more confused in Unleashed than in any other set. Virtuoso's star trades above its base and Keeper of the Hammer's star does too, but Green Father's base trades at several times its star at 233*/219, and Scorn of the Moon's base does the same against 234*/219. Four pairs, two in each direction, from one set. Whatever determines those relationships, it is clearly assigned per printing rather than by any rule that applies to the set as a whole, and I would treat anyone who claims otherwise with suspicion.",
      },
      {
        kind: "p",
        text: "The ninety-day verdict is that Unleashed is a strong set for collectors and an expensive one for everyone else. Its Uncommons — Back Off, Mosstomper, Deadly Flourish, Soul Shepherd — are perfectly reasonable and cheap, its Battlefields are the standard three, and its middle is thin enough that there is very little to buy between five dollars and thirty. Sets with that profile tend to look better in retrospect than they do at ninety days, because the concentration at the top ages well. I would still rather buy the singles than the boxes.",
      },
      {
        kind: "quote",
        text: "Concentration at the top is not a flaw, it is a business model. It just means the honest way to describe the set is by naming the dozen printings that are it.",
      },
    ],
  },

  {
    slug: "set-review-spirit-forged-revisited",
    title: "Set Review: Spirit Forged, Revisited",
    category: "Set Review",
    author: "priya-raghunathan",
    publishedOn: "2026-07-15",
    excerpt:
      "Spirit Forged is the flattest set on the board, with no printing above the low hundreds and a remarkably even distribution beneath. That is unusual and probably temporary.",
    heroCard: "emperor-of-the-sands-sfd-247",
    body: [
      {
        kind: "quote",
        text: "Demo article. RiftboundStocks is an unofficial fan project; this piece, its author and the market activity it describes are illustrative and not real analysis.",
      },
      {
        kind: "p",
        text: "Spirit Forged is the most evenly priced set tracked on this site, and after a full review pass I still find that surprising. Origins and Unleashed both have printings well above the two-hundred-dollar line and long tails beneath them. Spirit Forged's most expensive entries sit in the low hundreds and the drop from there to the middle of the set is gradual rather than cliff-like. Flat sets are rare and they usually do not stay flat.",
      },
      { kind: "h2", text: "The Legend run has no runaway" },
      {
        kind: "p",
        text: "Emperor of the Sands at 247/221 leads the Showcase Legends and Fire Below the Mountain at 244/221 follows, with Glorious Executioner, Purifier, Battle Mistress, Void Burrower and Chem-Baroness spread beneath in steady steps. Ahri, Inquisitive at 227*/221 is a Showcase Unit rather than a Legend and sits above most of them, which is the one genuine irregularity in the set's shape. Nothing here dominates the way Virtuoso dominates Unleashed.",
      },
      {
        kind: "cardTable",
        title: "Spirit Forged, top of the set",
        slugs: [
          "sivir-ambitious-sfd-120a",
          "ahri-inquisitive-sfd-227s",
          "emperor-of-the-sands-sfd-247",
          "fire-below-the-mountain-sfd-244",
          "glorious-executioner-sfd-242",
          "purifier-sfd-241",
          "battle-mistress-sfd-250",
          "void-burrower-sfd-243",
          "chem-baroness-sfd-249",
        ],
      },
      {
        kind: "card",
        slug: "emperor-of-the-sands-sfd-247",
        note: "Spirit Forged 247/221, Showcase Calm Legend. Also exists as a Rare at 197/221 — one of the cleanest base-versus-Showcase comparisons available.",
      },
      { kind: "h2", text: "The Rare Legends give you a clean comparison" },
      {
        kind: "p",
        text: "Two Spirit Forged characters appear at both Rare and Showcase rarity, which is the most useful thing about the set for anyone trying to understand treatment premiums. Emperor of the Sands at 197/221 is the Rare against the Showcase at 247, and Grand Duelist at 205/221 is a Rare Legend with no Showcase counterpart tracked. The multiple between the Rare and the Showcase Emperor is around three, which is at the low end of what comparable pairs show in Origins.",
      },
      {
        kind: "cardTable",
        title: "Rare Legends and the Showcase gap",
        slugs: [
          "emperor-of-the-sands-sfd-197",
          "grand-duelist-sfd-205",
          "emperor-of-the-sands-sfd-247",
        ],
      },
      {
        kind: "p",
        text: "The set's Epic tier is broad and cheap, which is the other half of why the distribution looks so even. Rabadon's Deathcrown, Irelia, Riposte, Corina Veraza, Rek'Sai, Arcane Shift and Downwell cover five domains between them and sit within a range of about twenty dollars top to bottom. Origins took roughly a year to develop the kind of internal ordering that Spirit Forged's Epics still lack. I read that as time rather than as a judgement about the cards.",
      },
      {
        kind: "p",
        text: "The bottom of the set deserves a sentence too, because it is where the evenness is most obvious. Spirit Forged's Battlefields — Ornn's Forge at 213/221 and Emperor's Dais at 207/221 — are the two cheapest on that shelf, and its Uncommons sit in a band barely a dollar and a half wide. A set whose Uncommons, Epics and Legends all cluster this tightly within their own tiers is a set nobody has yet formed strong opinions about. Origins looked much the same at this age.",
      },
      {
        kind: "p",
        text: "My ninety-day verdict is that Spirit Forged is the friendliest set on the board to actually collect and the least interesting one to speculate on. The absence of a runaway chase card removes the lottery-ticket element that makes Unleashed boxes tempting, and the even distribution means completing the set costs a predictable amount rather than one enormous amount plus change. That is a genuinely good product and a genuinely boring market, and I do not think those two things are in tension.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────── Speculation
  {
    slug: "speculation-the-case-for-boring-base-art-legends",
    title: "Speculation: The Case for Boring Base-Art Legends",
    category: "Speculation",
    author: "tobias-lindqvist",
    publishedOn: "2026-07-01",
    excerpt:
      "Five Legends in this catalogue exist as ordinary Rares. They are liquid, cheap relative to their Showcase counterparts, and nobody writes about them. That is the whole thesis.",
    heroCard: "green-father-unl-195",
    body: [
      {
        kind: "quote",
        text: "Demo article. RiftboundStocks is an unofficial fan project; this piece, its author and the market activity it describes are illustrative and not real analysis.",
      },
      {
        kind: "p",
        text: "I keep a public record of the calls in this column that went wrong, and the pattern in that record is embarrassingly consistent: the losers are the scarce, illiquid, exciting cards and the survivors are the boring ones. So this month's piece is about the most boring cards on the board. There are five Legends in the tracked catalogue that exist as plain Rares, with no star and no alternate frame, and I think they are structurally more interesting than their expensive counterparts.",
      },
      { kind: "h2", text: "The five" },
      {
        kind: "cardTable",
        title: "Rare-rarity Legends",
        slugs: [
          "relentless-storm-ogn-249",
          "emperor-of-the-sands-sfd-197",
          "herald-of-the-arcane-ogn-265",
          "green-father-unl-195",
          "grand-duelist-sfd-205",
        ],
      },
      {
        kind: "p",
        text: "Four of the five have a Showcase counterpart somewhere in the catalogue, and in every case the Showcase trades at a multiple of the Rare. Green Father is the extreme example: the Unleashed Showcase at 233/219 sits at roughly eight times the Rare at 195/219. Relentless Storm shows a smaller multiple, Herald of the Arcane a smaller one still. Grand Duelist has no Showcase counterpart tracked at all, which makes it the odd one out and the one I am least confident about.",
      },
      {
        kind: "card",
        slug: "green-father-unl-195",
        note: "Unleashed 195/219, Rare Calm Legend. The widest Rare-to-Showcase multiple among the five.",
      },
      { kind: "h2", text: "Why boring is the point" },
      {
        kind: "p",
        text: "A Rare Legend has three properties that a Showcase does not. It is liquid, so you can exit at something close to the quoted price rather than waiting weeks for the one buyer. It is condition-tolerant, because the price is low enough that a soft corner costs proportionally less. And it is the printing that gets bought when someone wants the card rather than the object, which is a larger and steadier population of buyers than the collector bid at the top.",
      },
      {
        kind: "p",
        text: "The counterargument is straightforward and I want to state it fairly. Rares are the printings most likely to be reprinted, and a reprint into a supplemental product would flatten these prices without touching the Showcase versions at all. The Origins line has already demonstrated that the same character can appear at multiple rarities and collector numbers, so this is not a theoretical risk. If you think a reprint wave is coming, the entire thesis here is wrong.",
      },
      {
        kind: "cardTable",
        title: "The same characters, two rarities",
        slugs: [
          "green-father-unl-195",
          "green-father-unl-233",
          "relentless-storm-ogn-249",
          "relentless-storm-ogn-300",
          "herald-of-the-arcane-ogn-265",
          "herald-of-the-arcane-ogn-308",
        ],
      },
      {
        kind: "p",
        text: "My position, stated with the hedging it deserves: I would rather own three Rare Legends than a third of a Showcase one, and I would rather own either than a card whose entire case is that very few exist. That is a preference about liquidity and about how badly I handle being wrong, not a prediction that these five will outperform. If you need a number to be excited about, this is not the column for you, and that has always been the point of it.",
      },
      {
        kind: "quote",
        text: "The cards I have lost money on were all interesting. The cards I have quietly done fine on were all things nobody wanted to write eight hundred words about.",
      },
    ],
  },

  {
    slug: "speculation-what-the-letter-after-the-number-is-worth",
    title: "Speculation: What the Letter After the Number Is Worth",
    category: "Speculation",
    author: "tobias-lindqvist",
    publishedOn: "2026-08-11",
    excerpt:
      "Starred and lettered variants are supposed to carry a premium over their base printings. In this catalogue they do so barely half the time, and the exceptions are not random.",
    heroCard: "teemo-strategist-ogn-121a",
    featured: true,
    body: [
      {
        kind: "quote",
        text: "Demo article. RiftboundStocks is an unofficial fan project; this piece, its author and the market activity it describes are illustrative and not real analysis.",
      },
      {
        kind: "p",
        text: "The folk wisdom is simple: the fancy printing is worth more than the plain one. It gets repeated in every discussion of alternate treatments and it is wrong often enough in this catalogue that I want to lay the counterexamples out properly. Across the base-and-variant pairs tracked here, the variant carries a premium in roughly half of them, and in several cases the base printing trades at multiples of its starred sibling. Whatever the star denotes, it is not a reliable price signal on its own.",
      },
      { kind: "h2", text: "The pairs that go the wrong way" },
      {
        kind: "p",
        text: "Green Father in Unleashed is the starkest case: the base 233/219 trades at several times the starred 233*/219. Scorn of the Moon at 234 does the same thing, Blind Monk at OGN 304 does it, and Loose Cannon at OGN 301 does it more mildly. Meanwhile Hand of Noxus at OGN 302 goes decisively the other way, with the star well clear of the base, and Virtuoso, Keeper of the Hammer and Herald of the Arcane also favour the star. That is four pairs in each direction from the same handful of sets.",
      },
      {
        kind: "cardTable",
        title: "Base above star",
        slugs: [
          "green-father-unl-233",
          "green-father-unl-233s",
          "scorn-of-the-moon-unl-234",
          "scorn-of-the-moon-unl-234s",
          "blind-monk-ogn-304",
          "blind-monk-ogn-304s",
          "loose-cannon-ogn-301",
          "loose-cannon-ogn-301s",
        ],
      },
      {
        kind: "cardTable",
        title: "Star above base",
        slugs: [
          "hand-of-noxus-ogn-302s",
          "hand-of-noxus-ogn-302",
          "virtuoso-unl-226s",
          "virtuoso-unl-226",
          "keeper-of-the-hammer-unl-237s",
          "keeper-of-the-hammer-unl-237",
          "herald-of-the-arcane-ogn-308s",
          "herald-of-the-arcane-ogn-308",
        ],
      },
      { kind: "h2", text: "The lettered variants behave differently" },
      {
        kind: "p",
        text: "The cards carrying a letter rather than a star are a separate population and they behave far more predictably. Teemo, Strategist at OGN 121a, Kai'Sa, Evolutionary at OGN 112a, Sivir, Ambitious at SFD 120a and Order Rune at OGN 214a are all Showcase printings sitting well above anything comparable at base rarity. Where a direct comparison exists — Sivir appears as an Epic at 120/221 and a Showcase at 120a/221 — the multiple is large and has been stable for months.",
      },
      {
        kind: "card",
        slug: "teemo-strategist-ogn-121a",
        note: "Origins 121a/298, Showcase Mind Unit. The highest-priced lettered variant tracked and the clearest example of the letter carrying a real premium.",
      },
      {
        kind: "cardTable",
        title: "Lettered Showcase variants",
        slugs: [
          "teemo-strategist-ogn-121a",
          "kaisa-evolutionary-ogn-112a",
          "sivir-ambitious-sfd-120a",
          "order-rune-ogn-214a",
          "sivir-ambitious-sfd-120",
        ],
      },
      {
        kind: "p",
        text: "The most plausible reading is that the two notations are not the same kind of thing and should never have been discussed together. Lettered variants appear to mark a distinct Showcase printing of a card that also exists at a normal rarity, which is a clean scarcity story. Starred printings sit inside the Showcase run itself, where both printings are already scarce and the relative populations are opaque from outside. I cannot verify either claim and I am not going to pretend otherwise, but the price data is consistent with it.",
      },
      {
        kind: "p",
        text: "The actionable version, such as it is: stop paying a premium for a star as a matter of reflex, and check the specific pair before you buy. Half the time the market has decided the base is the desirable printing, and if you are working from the general rule you will be systematically overpaying on exactly those. That is a small edge, it requires no forecasting at all, and it is the only kind of edge this column has ever been any good at.",
      },
    ],
  },
];

/**
 * Every article on the site: the invented demo pieces above, plus the data
 * reports in ./reports.ts whose figures are computed from the real price
 * snapshot. `dataReport` distinguishes them, and the UI marks them — a reader
 * must never have to guess which kind they are reading.
 */
export const ARTICLES: Article[] = [...DEMO_ARTICLES, ...REPORTS];

// ─────────────────────────────────────────────────────────────────────────────
// Lookup helpers
// ─────────────────────────────────────────────────────────────────────────────

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

export function articlesByCategory(c: Category): Article[] {
  return sortedArticles().filter((a) => a.category === c);
}

export function articlesByAuthor(authorSlug: string): Article[] {
  return sortedArticles().filter((a) => a.author === authorSlug);
}
