# RiftboundStocks

Price tracking, daily movers and market analysis for **Riftbound: League of Legends Trading Card Game** — an MTGStocks-style financial dashboard for a card game.

Sibling project to [RiftCompare](https://riftcompare.com); it shares that codebase's stack, conventions and card catalogue so code moves between the two without translation.

> **Unofficial fan project.** Not affiliated with, endorsed or approved by Riot Games. Riftbound, League of Legends and all card artwork are the property of Riot Games.

---

## ⚠️ This build ships DEMO prices

Read this before doing anything with the numbers on the site.

| What | Real? |
|---|---|
| Card names, sets, collector numbers, rarities, domains, types, stats | ✅ Real — 950 cards, 4 sets |
| Card artwork | ✅ Real — official art via the RiftScribe CDN |
| **Prices and price history** | ❌ **Generated.** No TCGplayer key is configured |
| **Articles and authors** | ❌ **Invented.** All 13 articles are demo content; all 5 bylines are fictional personas |
| Ability text, artist credits | ⛔ Not included — the site links to Riot's official card database rather than inventing them |

The demo prices come from `src/lib/prices/synthetic.ts`, a deterministic function of the card and the calendar date. Every surface that prints one of these figures renders `<DemoPricesNotice />`, and the disclaimers disappear automatically once `TCGPLAYER_PUBLIC_KEY` is set — see [Going live with real prices](#going-live-with-real-prices).

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
    catalog.ts            the 950-card in-memory index
    riftbound.ts          domains, rarities, card types, sets, formats
    prices/
      source.ts           the PriceSource adapter interface
      synthetic.ts        the demo generator (default)
      tcgplayer.ts        live TCGplayer ingestion
      index.ts            public pricing API + movers/stats analytics
    content/              articles, fictional authors, editorial types
  data/riftbound-cards.json   the bundled catalogue
scripts/
  build-catalog.ts        refresh the catalogue from RiftScribe
  import-prices.ts        fetch TCGplayer prices → Postgres snapshots
  gen-avatars.ts          regenerate author avatars
  smoke-pages.ts          route smoke test
prisma/schema.prisma      optional snapshot storage
```

### Why there is no database by default

950 cards is small enough that an in-process index beats a database round-trip on every page, and it means the site deploys to Vercel with zero infrastructure. Postgres becomes worth adding at exactly one point: when you want **real** daily snapshots to accumulate instead of being recomputed.

### The pricing adapter

Every page reads prices through `src/lib/prices/index.ts` and never touches a vendor API. Swapping sources is a change to `activeSource()` and nothing else:

```ts
export function activeSource(): PriceSource {
  return syntheticSource;   // ← the one line that changes
}
```

`PriceSource` (in `prices/source.ts`) exposes `history(card)` and `latest(card)`, returning `low`, `mid` (Average), `market`, `foil` and `foilMarket` in **integer USD cents**. Market price — not the lowest listing — is the headline figure, for the reason TCGEmpire's importer documents: the cheapest listing on a TCG marketplace is routinely a damaged or foreign-language copy.

The generator is closed-form rather than a random walk, so pricing 950 cards for the movers tables costs two evaluations per card instead of generating every card's full history.

## Going live with real prices

1. Provision Postgres (Neon is the path of least resistance) and set `DATABASE_URL`.
2. `npm run db:push` — creates `Card` and `PriceSnapshot`.
3. `npm run prices:import` — matches the catalogue against TCGplayer and writes one snapshot per printing per day. Re-running on the same day updates rather than duplicating.
4. Schedule step 3 daily (Vercel Cron → an API route, or a GitHub Action).
5. Point `activeSource()` at a Prisma-backed reader.
6. Set `TCGPLAYER_PUBLIC_KEY`, which flips `PRICES_ARE_DEMO` to `false` and removes the demo disclaimers site-wide.

**Do not do step 6 before steps 1–5 actually work** — that flag is the only thing standing between a visitor and generated numbers presented as real ones.

### TCGplayer terms

TCGplayer's pricing data is licensed, not public domain. Attribution is required on every surface that displays it (`PRICE_SOURCE_NOTE` in `lib/site.ts`), the data may not be presented as your own, and bulk redistribution is not permitted. `lib/prices/tcgplayer.ts` currently reads their public search endpoint with deliberate 250 ms pacing; move to the [official API](https://developer.tcgplayer.com/) before running at any volume.

## Refreshing the catalogue

```bash
npm run seed:catalog
```

Pulls the full card list from the [RiftScribe](https://riftscribe.gg) community API into `src/data/riftbound-cards.json`. Images stay on their CDN and are hot-linked — re-hosting hundreds of megabytes of Riot's artwork would be both wasteful and a far larger copyright ask than referencing it.

If a **new set** appears, add it to `SETS` in `src/lib/riftbound.ts` and to `setFromTotal()` in `lib/prices/tcgplayer.ts`. Cards in an unknown set render without a set name or release date.

> Alt-art (`ogn-007a-298`) and Signature (`ogn-299-star-298`) printings share their base card's `collector_number` in the raw feed. `variantFromId()` in `catalog.ts` parses the token back out — without it, 156 cards collide and vanish from the index.

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
