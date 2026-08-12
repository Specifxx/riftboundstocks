# RiftboundStocks

Price tracking, daily movers and market analysis for **Riftbound: League of Legends Trading Card Game** — an MTGStocks-style financial dashboard for a card game.

Sibling project to [RiftCompare](https://riftcompare.com); it shares that codebase's stack, conventions and card catalogue so code moves between the two without translation.

> **Unofficial fan project.** Not affiliated with, endorsed or approved by Riot Games. Riftbound, League of Legends and all card artwork are the property of Riot Games.

---

## What's real, and what isn't

Read this before doing anything with the numbers on the site.

| What | Real? |
|---|---|
| Card names, sets, collector numbers, rarities, domains, types, stats | ✅ Real — 1,416 printings across 9 sets |
| Card artwork | ✅ Real — RiftScribe CDN, plus TCGplayer product images for promos |
| **Prices** | ✅ **Real TCGplayer Market and Listed Median, per printing** |
| Sealed products | ✅ Real — 54 boxes, packs, decks, kits and bundles |
| Rules and flavour text | ✅ Real — from TCGplayer's product data |
| **Price history** | ⏳ Accumulates daily from the first import. TCGplayer publishes none, so it is **not** backfilled |
| **Articles and authors** | ❌ **Invented.** All 13 articles are demo content; all 5 bylines are fictional personas |
| Artist credits | ⛔ Not published by either source — not guessed at |

Prices are imported from TCGplayer by `npm run prices:import` and committed to the repo. The **editorial is still invented** — 13 demo articles under 5 fictional bylines — and says so on every article, in the footer and on `/about`.

A fresh clone with no imported data falls back to `src/lib/prices/synthetic.ts`, a generator, and every surface then renders a prominent demo-data warning. That switch is driven by the data itself (`PRICES_ARE_DEMO` in `lib/prices/demo-flag.ts`), not by an env var someone has to remember to set.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

That's it. **No database, no API keys, no configuration.** The card catalogue is committed to the repo and prices fall back to the generator, so a fresh clone runs immediately.

```bash
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run lint
npm run smoke        # hit every route against a running server
```

## Stack

Matches RiftCompare/TCGEmpire so code is portable:

- **Next.js 14** (App Router) + **React 18** + **TypeScript** (strict)
- **Tailwind CSS 3**, themed entirely through CSS custom properties
- **Prisma 5** + Postgres — *optional*, only for persisting real price snapshots
- No charting library: the price chart is hand-rolled SVG (~350 lines) because five line series, a crosshair and a brush is less code than configuring a library to do it

## Layout

```
src/
  app/                    routes (App Router)
    card/[slug]/          card detail — the most important page
    sets/, sets/[slug]/   set index + set detail
    interests/            biggest movers, the /interests tabs
    news/, news/[slug]/   editorial
    analytics/, domains/, decks/, sealed/, browse/
    about/, privacy/, premium/, login/, signup/
    sitemap.ts, robots.ts
  components/             shared UI (Navbar, Ticker, PriceChart, CardTable, …)
  lib/
    catalog.ts            the 1,416-printing in-memory index (RiftScribe + promos)
    riftbound.ts          domains, rarities, card types, sets, formats
    prices/
      source.ts           the PriceSource adapter interface
      live.ts             real prices, read from the committed snapshots
      synthetic.ts        the generator, used only before the first import
      tcgplayer.ts        TCGplayer ingestion (search + pricepoints)
      sealed.ts           sealed product types + the ordered classifier
      store.ts            the on-disk file shapes
      index.ts            public pricing API + movers/stats analytics
    content/              articles, fictional authors, editorial types
  data/
    riftbound-cards.json  booster-set catalogue (RiftScribe)
    promo-cards.json      OPP/PR/SGN/JDG printings (TCGplayer)
    prices.json           today's quote per printing
    price-history.json    one column per day — the chart series
    card-details.json     product ids, rules text, flavour
    sealed.json           54 sealed products
    sealed-prices.json, sealed-history.json
scripts/
  build-catalog.ts        refresh booster-set cards from RiftScribe
  build-promos.ts         build the promo catalogue from TCGplayer
  build-sealed.ts         build the sealed catalogue from TCGplayer
  import-prices.ts        daily: prices for every printing + sealed product
  prisma-sink.ts          optional Postgres mirror
  gen-avatars.ts          regenerate author avatars
  smoke-pages.ts          route smoke test
prisma/schema.prisma      optional snapshot storage
```

### Why there is no database by default

1,416 printings is small enough that an in-process index beats a database round-trip on every page, and it means the site deploys to Vercel with zero infrastructure. **The repo is the price database**: the daily GitHub Action commits each snapshot, and the commit triggers a redeploy. Postgres becomes worth adding when the history file gets long enough that committing it daily stops being reasonable — the schema and the mirror script are already there.

### The pricing adapter

Every page reads prices through `src/lib/prices/index.ts` and never touches a vendor API. Swapping sources is a change to `activeSource()` and nothing else:

```ts
export function activeSource(): PriceSource {
  return HAS_LIVE_PRICES ? liveSource : syntheticSource;
}
```

`PriceSource` exposes `history(card)` and `latest(card)`, returning `low`, `mid`, `market`, `foil` and `foilMarket` in **integer USD cents**. **Every field is nullable, and null never means zero** — it means TCGplayer has no price for that printing. Coercing it to 0 would sort the card to the top of "cheapest", drag down set totals and read as a real valuation.

### Two traps this codebase has already hit

**`pricepoints` has no fallback.** The search payload's `marketPrice` is not printing-scoped: on a foil-only printing it *is* the foil price. Using it as a Normal fallback wrote foil prices into the Normal series for 624 of 1,170 cards. 626 printings are foil-only (most Showcase and alt-art cards), so a card with no Normal listing gets a null Normal price and rankings read through `primaryPrice()`.

**Promos are matched by product id, not collector number.** OPP draws from five base sets so numerators repeat, and the same card ships at several event tiers — `Annie - Dark Child 017/024` exists at $39.44, $1,850.00 and $2,210.34. `build-promos.ts` stores each printing's TCGplayer `productId` so the importer joins on it directly.

## Refreshing prices

```bash
npm run prices:import     # ~5 min: every printing + all 54 sealed products
```

Runs daily via `.github/workflows/refresh-prices.yml`, which commits the diff. Re-running on the same day replaces that day's column rather than appending a second one, so the job is safe to retry.

The importer **refuses to write** if fewer than half the cards price — a collapsed match rate means the endpoint changed shape, and overwriting good prices with near-nothing is worse than doing nothing.

**Price history is not backfilled.** TCGplayer publishes no historical prices, so the series starts at the first import and grows a day at a time. Until two days exist, every change-based surface (movers, the ticker, `/interests`, the index chart) degrades to a labelled "most valuable" view rather than showing dashes or a fabricated baseline.

Set `DATABASE_URL` to additionally mirror each snapshot into Postgres (`scripts/prisma-sink.ts`).

### TCGplayer terms

TCGplayer's pricing data is licensed, not public domain. Attribution is required on every surface that displays it (`PRICE_SOURCE_NOTE` in `lib/site.ts`), the data may not be presented as your own, and bulk redistribution is not permitted. `lib/prices/tcgplayer.ts` currently reads their public search endpoint with deliberate 250 ms pacing; move to the [official API](https://developer.tcgplayer.com/) before running at any volume.

## Refreshing the catalogue

```bash
npm run seed:catalog   # booster-set cards, from RiftScribe
npm run seed:promos    # OPP/PR/SGN/JDG printings, from TCGplayer
npm run seed:sealed    # 54 sealed products, from TCGplayer
```

RiftScribe carries only booster-set cards, so promos come from TCGplayer, which is also where their art comes from — for the ~22% of promos it has an image for. The rest borrow the **base card's** illustration, flagged with `borrowedArt` and labelled "Base-set art" in the UI, because a Metal or alt-art promo does not look like the card it reprints. 14 have no art at all and render a typed placeholder, never a broken image.

If a **new set** appears, add it to `SETS` in `src/lib/riftbound.ts`, and its card total to `setFromTotal()` in `lib/prices/tcgplayer.ts` so promos of it can be placed.

> **The RiftScribe id is authoritative, not `collector_number`.** The feed's numeric field strips the R/T/SP prefix, so Vendetta's Fury Rune (`ven-r01`) and Baccai Sandspinner (`ven-001-166`) both arrive as number `1`. `parseId()` in `catalog.ts` recovers the real token — without it the rune is priced as the unit.

> **The sealed classifier's rule order is load-bearing.** 22 of 54 products match more than one rule. `Origins - Sleeved Booster Pack Art Bundle [Set of 3]` contains "Bundle", "Sleeved Booster" *and* "Booster Pack"; reordering types a $58 collector item as a $6 pack. Don't alphabetise it.

## Theming

Every colour is a CSS custom property in `globals.css`; Tailwind maps tokens onto them. The light/dark toggle sets one `data-theme` attribute on `<html>`, and an inline script in `layout.tsx` applies the saved theme before first paint.

**Use the semantic tokens** (`surface-0..3`, `line`, `ink`, `ink-muted`, `ink-dim`, `accent`, `up`, `down`, `foil`) — never raw Tailwind colours like `bg-slate-800`, which break light mode. `up`/`down` mean price movement and nothing else.

## Privacy

The site sets **no cookies**. Theme and currency live in `localStorage`; there is no analytics, no ad network and no third-party script. `CookieNotice` is a disclosure, not a consent gate — **if you add analytics or ads, replace it with a real consent manager first.** A dismissal is not consent.

Card images are hot-linked from the RiftScribe CDN, so that CDN sees visitors' IP addresses. `/privacy` says so.

## Content and attribution

The `src/lib/content/` articles and authors are **fictional demo content**, labelled as such in the source, on every article page, on `/about` and in the footer. If you replace them with real editorial, the disclaimers in `Footer.tsx` and `/about` need updating to match — they are load-bearing, not boilerplate.

Author avatars are procedurally generated abstract SVG, not faces. No real person's photograph, name, likeness or work appears anywhere in this project.

## Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full Vercel + Neon + domain walkthrough.
