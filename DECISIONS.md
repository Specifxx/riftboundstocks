# Decisions

Non-obvious decisions, newest at the bottom. Each entry: date, title, what was
decided and why.

## 2026-10-23 — Detail pages leave ISR for the CDN

`/card/[slug]` (~1,400 printings), `/champions/[slug]` and `/news/[slug]` were
ISR with `revalidate = 3600`, so every page a crawler touched was re-rendered
and re-written to the ISR cache every hour, although the prices behind them
change once a day (the committed snapshot). They are now
`dynamic = "force-dynamic"` and cached by Vercel's CDN through
`Vercel-CDN-Cache-Control: public, s-maxage=21600, stale-while-revalidate=86400`
(the `CDN_PAGES` list in `next.config.js`), the same move as CompareEmpire's
"Card pages leave ISR for the CDN". `generateStaticParams` went with it, so the
build no longer prerenders the top 120 cards. These trees must stay identical
for every visitor: `npm run verify:cdn` (`scripts/verify-cdn-pages.ts`) fails
if one imports `next/headers` or the session. Watch state stays client-side
(`CardActions`). RiftCompare store listings on a card page can now be up to six
hours old instead of one.

## 2026-10-23 — Landing pages revalidate every six hours

`/`, `/news` and `/champions` moved from `revalidate = 3600` to `21600`. The
data changes daily and each deploy rebuilds them anyway; hourly regeneration
was ISR writes with no new content. Never go below 21600.

## 2026-10-23 — robots.txt turns away bulk scrapers

Googlebot and Bingbot keep full access (minus `/api/` and `/search`, as
before). SEO-tool crawlers (AhrefsBot, SemrushBot, MJ12bot, DotBot, PetalBot,
Bytespider, DataForSeoBot, BLEXBot) and bulk AI-training crawlers (CCBot,
GPTBot, Google-Extended) are disallowed: they bring no visitors and each page
they fetch is a billed render. Answer engines that cite and link
(OAI-SearchBot, PerplexityBot, ClaudeBot) fall under `*`, which stays allowed
with `Crawl-delay: 10`. robots.txt is advisory; enforcement belongs in the
Vercel Firewall (see COST.md).

## 2026-10-23 — Analytics skips bots, previews and the owner

Web Analytics bills per event. `<Analytics />` is mounted once, in the root
layout, through `components/SiteAnalytics.tsx`, whose `beforeSend` drops
events from localhost, 127.0.0.1 and `*.vercel.app`, from `navigator.webdriver`
browsers, from bot-like user agents, and when `localStorage["va-disable"]` is
`"1"` (set by visiting any page with `?notrack=1`, cleared by `?notrack=0`).
There are no custom `track()` calls and no Speed Insights.

## 2026-10-23 — Builds: main only, docs-only commits skipped

`vercel.json` gained `ignoreCommand: bash scripts/vercel-ignore-build.sh`. It
skips every branch but `main` (no preview builds) and any commit that changes
only Markdown, `docs/` or `_revamp-evidence/`. The daily
`chore(prices): snapshot` commit touches `src/data/` and still deploys, which
is how prices go live; the 13:00 UTC price-alert cron runs against the
production deployment and is unaffected. A deploy with no git metadata (CLI)
always builds.
