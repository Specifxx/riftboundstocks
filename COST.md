# Vercel cost audit (2026-10-23)

## What could and couldn't be measured

No Vercel token or dashboard access was available, so per-project usage
(function invocations, ISR writes, transfer) for this site **could not be
measured**, and the team bill could not be split by project. This is a code
audit plus a local production build; the figures below come from that build only.

## Findings

- **ISR on high-cardinality pages.** `/card/[slug]` (1,416 printings),
  `/champions/[slug]` and `/news/[slug]` used `revalidate = 3600`, so each
  crawled page was re-rendered and written to the ISR cache hourly while the
  data changes once a day (committed snapshot + redeploy). `/card/[slug]` also
  prerendered 120 cards per build.
- **Landing pages** (`/`, `/news`, `/champions`) regenerated hourly for daily data.
- **No `revalidateTag` / `revalidatePath` / `unstable_cache`** anywhere: the
  import commits JSON and redeploys, so nothing needed to become diff-aware.
- **No middleware** exists, so there was nothing to narrow.
- **Builds:** no `ignoreCommand`; every branch push built a preview.
- **robots.txt** allowed every crawler.
- **Analytics:** `@vercel/analytics` only (no Speed Insights, no `track()`
  calls), with no filtering of bots, previews or the owner.
- **Images:** no `next/image` use (plain `<img>` to the RiftScribe/TCGplayer
  CDNs), so no Image Optimization cost.

## Measured page sizes (local `next build` + `next start`)

| Page | HTML | RSC |
|---|---|---|
| `/` | 119,681 B | 55,809 B |
| `/card/blazing-scorcher-ogn-1` | 187,278 B | 91,356 B |
| one `/champions/[slug]` page | 131,316 B | not measured |
| `/champions` | 482,709 B | not measured |
| `/sealed` | 371,446 B | not measured |
| `/sets/origins` (largest set) | 291,711 B | not measured |
| `/news` | 285,600 B | not measured |

The card page's flight payload is ordinary rendered markup (its largest chunk,
~69 KB, is the page body); no embedded full dataset was found, so nothing was
cut. `/champions` and `/sealed` are the largest, but they are static, rebuilt
once per deploy and served from the CDN, so they cost transfer, not renders.
Trimming them is a possible follow-up.

## Changes

1. Card, champion and news detail pages: `force-dynamic` +
   `Vercel-CDN-Cache-Control: public, s-maxage=21600, stale-while-revalidate=86400`
   (`CDN_PAGES` in `next.config.js`); `generateStaticParams` removed.
   `npm run verify:cdn` pins that their import trees read no cookies, headers or session.
2. `/`, `/news`, `/champions`: `revalidate` 3600 → 21600.
3. `robots.txt`: disallow SEO scrapers and bulk AI crawlers, `Crawl-delay: 10` for the rest.
4. Analytics `beforeSend` filter + `?notrack=1` owner opt-out.
5. `vercel.json` `ignoreCommand`: main only, docs-only commits skipped. Cron kept.
6. `images.minimumCacheTTL = 2678400` for any future `next/image` use.

## Expected effect (qualitative, not measured)

ISR writes and reads for detail pages should drop to roughly zero. Function
invocations and Active CPU for crawled pages fall to at most one render per
page per CDN region per six hours instead of per hour. Build CPU falls with no
preview builds and no 120-card prerender. Web Analytics events fall by
whatever share bots and previews were.

## Recommended Vercel Firewall rules (dashboard, not in code)

1. Enable **Bot Protection** (managed ruleset): log first, then challenge.
2. Custom rule: User-Agent matches
   `AhrefsBot|SemrushBot|MJ12bot|DotBot|PetalBot|Bytespider|DataForSeoBot|BLEXBot|CCBot|GPTBot`
   → **Deny**.
3. Rate limit `/card/*`, `/champions/*`, `/sets/*` to about 60 requests per
   minute per IP → **Deny**, with verified search bots (Googlebot, Bingbot) exempt.
4. Rate limit `/api/v1/*` to about 30 requests per minute per IP.
