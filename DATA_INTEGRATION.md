# Data integration: two real sources, one card page

RiftboundStocks reads real data from **two** independent sources, each responsible for a
different part of the page:

| | Source | Backs |
|---|---|---|
| **Headline prices** | TCGplayer, via `npm run prices:import` | Market/Low/Mid/Foil, price history, movers, set totals — everything in [README.md](./README.md)'s pricing section |
| **Multi-vendor + regional data** | RiftCompare (riftcompare.com), via its public read API | The "Compare stores" grid, the AU/NZ/UK/SG/CA regional prices, Watch/Alert baselines |

The first is covered in full in `README.md` and won't be repeated here. This document
covers the second — RiftCompare — plus the account features (Watch/Alert, Portfolio) and
engagement features (Riftle, pack sim) layered on top, none of which existed when the
TCGplayer pipeline was first built.

Written before the RiftCompare code, per the usual practice in this repo — updated once
during implementation when empirical testing (see the join-key section) contradicted part
of the original plan.

---

## Why two sources instead of one

RiftboundStocks and RiftCompare are sibling projects (same owner, same stack, same card
catalogue) but they answer different questions. RiftboundStocks is a **price history and
market-analysis** site — one number per printing per day, charted over time. RiftCompare
is a **shopping comparison** site — every store's current listing, ranked by delivered
cost, across six regional markets. Collapsing them into one pipeline would mean either
site inheriting complexity it doesn't need: RiftboundStocks doesn't want to track
per-store inventory and shipping policies, and RiftCompare's data model has no daily
history series to chart.

Rather than pick one and lose the other, the card page reads TCGplayer for the numbers it
already shows (unchanged) and adds a RiftCompare-sourced section for the numbers it never
had — full store comparison and non-US pricing. Both are additive: either one can go
offline and the page still renders everything the other provides.

## Architecture: public API, not a shared database

RiftCompare's data is reached over its existing public, credential-free REST API
(`https://riftcompare.com/api/v1`, see `src/lib/prices/riftcompare.ts`), not by connecting
to RiftCompare's database directly. Three reasons, in order of how much they mattered:

1. **Egress.** RiftCompare/TCGEmpire runs on Neon's free tier, which has a hard monthly
   egress cap — this has actually been exhausted before by unbounded per-request queries
   (see that repo's `src/lib/db.ts` / `db-history.ts` for the rotation logic that exists
   because of it). Giving a second, independently-deployed site direct query access to
   that database multiplies the risk of hitting that cap again, for a feature that isn't
   RiftCompare's own traffic. An HTTP API in front of it means RiftCompare controls its
   own caching (`Cache-Control: s-maxage=3600` / `s-maxage=900`) and can rate-limit or
   change its schema without coordinating a deploy on this side.
2. **Coupling.** A shared `DATABASE_URL` between two independently-deployed Next.js apps
   means a schema migration on either side can break the other at runtime, silently, with
   no build-time signal. An HTTP contract is a much smaller, versioned surface — the
   `/api/v1/*` routes are meant to be public and stable (they're documented at
   `/api/v1/openapi.json` and linked from RiftCompare's own `llms.txt`).
3. **No new credentials.** The task constraint is explicit: don't invent affiliate
   accounts or database credentials. The public API needs no key at all, and RiftCompare's
   own outbound "Buy" links already carry its existing TCGplayer/eBay affiliate tagging
   (`StoreListing.buyHref` — see `lib/affiliate.ts`'s comment on why this site's own
   TCGplayer links reuse RiftCompare's Impact base for the same reason).

Every RiftCompare read (`fetchCardListings`, `fetchRegionalPrices` in
`lib/prices/riftcompare.ts`) is wrapped in a try/catch that returns `null` on any failure —
network error, 404, timeout, RiftCompare down entirely. Every consumer of that data (the
`StoreListings` and `ShoppingRegions` components, the card page itself) already renders
around a `null`, so **a RiftCompare outage degrades the card page to exactly what it
looked like before this integration existed** — TCGplayer pricing intact, the extra
sections simply absent. Nothing on this site depends on RiftCompare being up.

`RIFTCOMPARE_API_URL` (`.env.example`) overrides the base URL for local development
against a non-production RiftCompare; unset, it defaults to production.

## The join key: reconstructed slug, not `externalId`

Every card in this catalogue carries an `externalId` (`lib/catalog.ts`, e.g.
`"ogn-001-298"`) that both projects' internal comments describe as the RiftScribe id
shared across both catalogues — the obvious choice for joining a RiftboundStocks card to
its RiftCompare counterpart. **It doesn't work.** Querying RiftCompare's API by
`externalId` returned `not_found` for every card tried (0/9 in the first pass). RiftCompare
doesn't expose its cards by that id at all.

What actually works is RiftCompare's own URL slug — reconstructed from this card's own
fields, not looked up anywhere. RiftCompare identifies a card by
`name + setCode + collectorNumber`, slugified; that formula lives in TCGEmpire's own
`src/lib/card-url.ts` as `cardSlug()`, and `riftcompareSlug()` in
`lib/prices/riftcompare.ts` is a byte-for-byte port of it:

```
"Vayne, Hunter" + "SFD" + "223*/221"
  -> lowercase, "*" -> "s", every run of non-alphanumerics -> "-"
  -> "vayne-hunter-sfd-223s-221"
```

This works *because* `collectorLabel` in this catalogue is already stored in RiftCompare's
own raw format — literal `*` for Signature prints, numerator/denominator together (e.g.
`"233*/221"`) — which is exactly what `cardSlug()` expects. That alignment isn't a
coincidence; both catalogues ultimately trace back to the same RiftScribe/TCGplayer
source data, normalised independently but consistently enough to reconstruct the same
slug without ever calling RiftCompare to ask.

**This was verified by curling production, not by reading the two code paths and assuming
they'd match** — and it's a good thing it was, because the first version of the formula
was subtly wrong twice:

- **Apostrophes.** The first draft pre-stripped `'`/`'` before slugifying, on the
  assumption that "cleaning" the input first was safer. It isn't: RiftCompare's own
  formula does *not* pre-strip, so `"Kai'Sa"` needs to collapse to `"kai-sa"` (the
  apostrophe becomes its own `-`, like a space would), not `"kaisa"`. Pre-stripping 404s
  every apostrophed name in the catalogue — 58 cards, including Kai'Sa and Kog'Maw.
  Confirmed by curling both versions.
- **Promos.** The first draft used this card's own `setCode` (the promo program's code,
  e.g. `"OPP"`) directly. RiftCompare slugs a promo under the set it was *originally
  printed in* (`baseSetCode` in this catalogue — already the right value, since it exists
  for exactly this reason) plus a `-promo` suffix. The `OPP`-coded slug 404s for every
  promo tried (0/6); the base-set-coded `...-promo` slug 200s for every one of the same 6.

Coverage after both fixes, measured across ~90 real cards spanning base prints, alt-art,
signature prints, promos and apostrophed names:

| Category | Hit rate | Notes |
|---|---|---|
| Base prints, alt-art, apostrophed names | ~90% | The bulk of the catalogue |
| Signature prints | ~50-65% | Lower in specific sets (see below) |
| Promos | ~50-83% | Lower for exotic treatments (see below) |

The remaining misses were individually checked, not assumed to be more formula bugs: for
every failing signature print sampled, **the base (non-signature) printing of the same
card in the same set also 404s** — meaning RiftCompare simply hasn't ingested that
specific card at all, in any variant. This is concentrated in particular sets (OGN, UNL)
and numbering ranges, consistent with a real, upstream catalogue-completeness gap rather
than a join-key problem. The remaining promo misses are split/token cards (`"Bird // Buff"`
— not a shape this formula, or arguably any single-slug formula, handles) and Prize
Wall/Metal event promos rare enough that they plausibly have zero online store listings to
aggregate in the first place, formula aside.

None of this needs handling beyond what already exists: a miss 404s, `fetchJson` returns
`null`, and the UI omits the section. The gap is bounded and understood, not silently
guessed around — which is the reason it was worth the extra curl round-trips instead of
shipping the first version that compiled.

## Currency

TCGplayer prices (the headline Market/Low/Mid figures) are USD-only, matching this site's
existing currency handling — the header's currency selector converts them at render time
for display, same as before this integration (`lib/currency.ts`).

RiftCompare's per-store listings (`StoreListings`) are also requested for the `US` market
specifically (`fetchCardListings`'s `market=US` query param) and rendered in USD, so they
sit consistently alongside the TCGplayer prices on the same page.

The regional cross-market prices (`ShoppingRegions`) are the one place this site shows a
non-USD figure natively: `fetchRegionalPrices` returns each region's price in **that
region's own local currency** (AUD, NZD, GBP, SGD, CAD) exactly as RiftCompare's API
returns it, because that's what those prices actually are — a live AU listing is quoted in
AUD by the AU store selling it, not converted from a US price. These are display-only,
never run through this site's own USD-based `convert()` — they're already denominated
correctly and converting them would be converting a converted number.

## Accounts, Watch/Alert, Portfolio

**Auth is not new.** By the time this integration was built, the base branch already had a
complete account system (Google/Discord OAuth, session cookies via `jose`, `lib/auth.ts`)
built for an unrelated reason (see `git log` — a separate, earlier change; email/password
sign-up was removed shortly after — accounts are OAuth-only). Building a second auth
system would mean two user tables and two sign-in flows on one site; instead, `PriceAlert`
and `CollectionCard` (`prisma/schema.prisma`) are new tables
that hang off the *existing* `User` model via a foreign key, and every new route
(`/api/alerts`, `/api/portfolio`, `/api/cron/price-alerts`) reuses the existing
`getCurrentUser()` / `accountsDisabledResponse()` / `ACCOUNTS_ENABLED` gating that every
other account-aware route on the site already uses. `ACCOUNTS_ENABLED` is `!!DATABASE_URL`
— set up per `DEPLOYMENT.md` step 5, nothing specific to Watch/Alert or Portfolio.

**Watch and Alert are the same feature**, not two. `CardActions.tsx`'s original stub had
separate "Alert" and "Watch" buttons, both pointing at nothing. There is exactly one
`PriceAlert` model — "watching" a card and "being alerted on it" are the same database
row, so shipping two buttons that both toggled the identical state would be confusing UI
for no real distinction. `CardActions` now has one "Watch" button; watching means you get
a digest email when the price drops.

**How the digest works** (`lib/price-alerts.ts`, run daily by `/api/cron/price-alerts` —
schedule in `vercel.json`, guarded by `CRON_SECRET`): each `PriceAlert` row stores the
price it last saw. Every run compares today's headline price (`primaryPrice(latestQuote(card))`
— the same TCGplayer-backed number every other page shows) against that baseline; a
lower price queues an email and the baseline advances either way, so a later dip is always
measured against the most recent price, not a stale one. Sends are grouped per recipient
(one digest, not one email per card) and go out via Resend, the same provider already used
for verification/reset email (`lib/email.ts`) — one `RESEND_API_KEY` covers both.

**Portfolio** (`/portfolio`) is a straightforward `CollectionCard` CRUD — condition, foil,
quantity, optional cost basis — priced against the same live headline price, with
unrealised gain/loss shown when a cost basis is on file. Adding a card from a card page
(`CardActions`'s "Inventory" button) links to `/portfolio?add=<cardId>`, which
`AddHoldingForm` picks up as a preselected card rather than duplicating the whole
add-a-card form inline on every card page.

**Why client-side fetches, not server props.** `CardActions` needs to know whether the
current visitor is watching this specific card, but the card page itself is statically
generated (`generateStaticParams` pre-renders the top 120 by value, `revalidate: 3600` —
see README) precisely so it doesn't do per-request work. Making the page a function of the
signed-in visitor would force it dynamic for everyone, including the ~950 other cards and
every anonymous visitor. Instead `CardActions` fetches its own watch-state client-side
after mount (`GET /api/alerts`), the same pattern `NavUser` already uses for session state
via `/api/me` — the page stays static, only the one small island hydrates per-visitor.

## Engagement features: linked, not ported

Riftle (daily word-guess game) and the pack-opening simulator are **not** reimplemented
here. Both are gameplay logic — RNG-driven pack contents, guess-state, daily puzzle
seeding — that already exists and is already maintained on RiftCompare. Porting it would
mean two copies of the same game logic drifting apart over time for a feature that isn't
this site's core purpose (price tracking). The navbar's new "Games" entry
(`Navbar.tsx`) links out to RiftCompare's `/games`, Riftle and the pack simulator directly,
tagged the same way the existing footer cross-links are (`riftcompareUrl()` — `ref`/`utm_*`
params for RiftCompare's own analytics, not an affiliate link).

## Decks

"Decks using this card" (`card/[slug]/page.tsx`) has no real data source on either side —
neither this catalogue nor RiftCompare's API tracks deck lists. This is a different thing
from the existing `/decks` page: that page mechanically assembles illustrative price
baskets (highest-priced cards per domain/tier, explicitly and repeatedly disclaimed on the
page itself as "not real competitive decklists — nobody plays these") to answer "what does
a slice of a domain cost", not "what decks is this specific card actually played in". A
card-page module answering the second question would need real tournament/decklist data
neither source has, so rather than fabricate it, link to `/decks`' unrelated baskets, or
silently drop the module the parity check asked for, it renders and says plainly that
nothing was found ("No recent decks found") — the same honesty standard the rest of this
codebase already holds price data to (see README's "What's real, and what isn't"). If a
real deck-list source appears later, this is the one place that needs to change.

## What was deliberately left out

- **Payment/billing.** Out of scope per the task. `/premium` itself was removed by a
  concurrent change (it showed pricing tiers with no billing behind them — pulled rather
  than shown unpurchasable now that accounts are real; `/premium` redirects to `/`). No
  billing was added in its place here either.
- **A second auth system.** Covered above — reusing the existing one avoids two
  parallel user tables.
- **Direct RiftCompare database access.** Covered above.
- **Deck data.** Covered above — no source exists to integrate.
