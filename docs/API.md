# Public API

Read-only access to the card catalogue, prices and movers — for your own tools, spreadsheets or bots. Requires an API key on a **Pro** or **Store** plan (see `/premium` and `src/lib/plans.ts`). Free and Plus accounts can still use the site fully; they just can't mint API keys.

**No billing is connected yet** (`src/lib/plans.ts`'s `TODO(config)`), so there is currently no self-serve way to reach Pro/Store other than setting `User.planTier` by hand. The API itself is fully functional once a key exists.

## Getting a key

1. Sign in, and have an account on a Pro or Store plan.
2. `POST /api/keys` with `{ "label": "my script" }`, authenticated by your normal session cookie (i.e. from the browser, via the key-management UI on `/profile`).
3. The response's `key` field is shown **once**. Store it — the server keeps only a hash and cannot show it again. If you lose it, revoke it and create a new one.

## Authenticating

Send the key as either header on every request:

```
x-api-key: rl_live_...
```

or

```
Authorization: Bearer rl_live_...
```

## Rate limits

Per key, per minute: 200 requests to `/cards`, 300 to `/prices`, 60 to `/movers`. A `429` includes a `Retry-After` header.

## Endpoints

### `GET /api/v1/cards`

The card catalogue. Query params (all optional): `set` (code, e.g. `OGN`), `domain`, `rarity`, `type`, `limit` (default 50, max 200), `offset`.

```json
{
  "total": 950,
  "limit": 50,
  "offset": 0,
  "cards": [
    { "id": "ogn-001-298", "slug": "blazing-scorcher-ogn-1", "name": "Blazing Scorcher",
      "setCode": "OGN", "setName": "Origins", "collectorLabel": "001/298",
      "rarity": "Common", "domain": "Fury", "type": "Unit", "imageUrl": "https://..." }
  ]
}
```

### `GET /api/v1/prices`

One printing's latest quote and stats. Pass `slug` (the URL slug, e.g. `blazing-scorcher-ogn-1`) or `id` (the RiftScribe id, e.g. `ogn-001-298`).

Every price field is **cents, and nullable** — `null` means "not priced," never zero. See the "Two traps this codebase has already hit" section of the repo README before assuming a `null` is a bug.

```json
{
  "card": { "id": "ogn-001-298", "slug": "blazing-scorcher-ogn-1", "name": "Blazing Scorcher", "setCode": "OGN", "collectorLabel": "001/298" },
  "isDemoData": false,
  "latest": { "low": 45, "mid": 62, "market": 58, "foil": null, "foilMarket": null },
  "allTimeHigh": { "cents": 71, "day": "2026-06-01" },
  "allTimeLow": { "cents": 40, "day": "2026-05-12" },
  "foilMultiplier": null,
  "spreadPct": 27.4,
  "deltas": { "day": { "regular": 1.2, "foil": null }, "week": { "regular": -3.1, "foil": null }, "month": { "regular": null, "foil": null } },
  "historyPoints": 60
}
```

### `GET /api/v1/movers`

Today's (or the last N days') biggest gainers/losers. Query params: `series` (`low`|`mid`|`market`|`foil`|`foilMarket`, default `market`), `days` (default 1, max 90), `limit` (default 25, max 100).

```json
{
  "series": "market", "days": 1, "hasChangeData": true,
  "gainers": [{ "slug": "...", "name": "...", "setCode": "OGN", "nowCents": 120, "thenCents": 100, "pct": 20 }],
  "losers": [ ... ]
}
```

`hasChangeData: false` (and empty `gainers`/`losers`) means fewer than two days of price history exist yet — see the repo README's "Price history is not backfilled" note. This is not an error.

## Errors

| Status | Meaning |
|---|---|
| 401 | Missing/invalid/revoked key, or the key's plan doesn't include API access |
| 404 | `/prices` — no card matches the given `slug`/`id` |
| 429 | Rate limit exceeded — see `Retry-After` |

## What's not here yet

- Write endpoints (portfolio, alerts) — the API is read-only by design for now.
- Webhooks / push notifications for price changes — see `/alerts` for the pull-based (email digest) equivalent in the meantime.
- Bulk/paginated cursor for `/cards` beyond `limit`/`offset` — fine at the catalogue's current size (~950 printings), revisit if that grows enough for offset pagination to get slow.
