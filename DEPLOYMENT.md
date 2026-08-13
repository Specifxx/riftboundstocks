# Deploying RiftLedger

Written in the order you should actually do it. **Steps 1–3 get you a live site in about ten minutes** and need no database and no API keys. Everything after that is optional and can wait.

---

## Step 1 — Push the repo

Already done if you're reading this in GitHub. The default branch is `main`.

## Step 2 — Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and sign in with GitHub.
2. **Import** the `riftledger` repository. Grant access to it if Vercel asks.
3. Vercel detects Next.js on its own. **Change nothing** — the defaults are correct:
   - Framework preset: `Next.js`
   - Build command: `npm run build`
   - Output directory: *(leave blank)*
   - Install command: `npm install`
4. Skip environment variables for now.
5. **Deploy.** First build takes roughly 2–4 minutes (it pre-renders 120 card pages plus every set and article).

You now have a working site at `riftledger-<hash>.vercel.app`.

> **Node version:** Vercel defaults to Node 20+, which is what this project expects. Only touch Settings → General → Node.js Version if a build complains.

## Step 3 — Point your domain at it

1. Buy the domain wherever you like (Cloudflare, Namecheap, Porkbun — Vercel also sells them, which skips this whole step).
2. In Vercel: **Project → Settings → Domains → Add**, enter `riftledger.app`.
3. Vercel shows you the DNS records to create. At your registrar, add:
   - **A** record, name `@`, value `76.76.21.21`
   - **CNAME** record, name `www`, value `cname.vercel-dns.com`
   *(Use whatever Vercel's panel actually shows — these values are its current defaults, not a promise.)*
4. Wait for propagation (usually minutes, up to a few hours). Vercel issues the TLS certificate automatically.
5. Pick which host is canonical — `riftledger.app` or `www.riftledger.app` — and set the other to redirect. Vercel offers this in the same panel.

### Then set the site URL

**Project → Settings → Environment Variables**, add for *Production*:

```
NEXT_PUBLIC_SITE_URL = https://riftledger.app
NEXT_PUBLIC_CONTACT_EMAIL = you@yourdomain.com
```

**Redeploy after adding these.** Without `NEXT_PUBLIC_SITE_URL`, canonical URLs, OpenGraph tags and `sitemap.xml` all point at the `*.vercel.app` host, which quietly wrecks SEO.

### Tell search engines

- [Google Search Console](https://search.google.com/search-console) → add the domain → verify via DNS TXT → submit `https://riftledger.app/sitemap.xml`.
- [Bing Webmaster Tools](https://www.bing.com/webmasters) → import from Google, which is two clicks.

---

Everything below is optional. **The site is fully live and functional after step 3** — it just shows generated prices.

---

## Step 4 — Postgres on Neon (only when you want real price history)

You need this the moment you want prices that *accumulate* rather than being recomputed on every request.

1. Sign up at [neon.tech](https://neon.tech) (the free tier is enough to start).
2. **Create a project** — pick the region closest to your Vercel region (Vercel's default is `iad1`/US East, so `AWS us-east-2` or `us-east-1` is a good match). A cross-continent database will make every query slow.
3. Copy the **pooled** connection string. It looks like:
   ```
   postgresql://USER:PASSWORD@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   Use the **pooler** host, not the direct one — serverless functions open a lot of short-lived connections and will exhaust a direct Postgres connection limit.
4. In Vercel, add the environment variable for Production, Preview and Development:
   ```
   DATABASE_URL = <the pooled connection string>
   ```
5. Create the tables. Two ways — same effect, pick whichever you have:
   - **Locally**, if you have Node installed: put the same connection string in `.env.local`, then `npm run db:push`.
   - **No local setup needed**: add the connection string as a repository secret named `DATABASE_URL` (repo **Settings → Secrets and variables → Actions → New repository secret**), then **Actions** tab → **"Push database schema"** → **Run workflow**. Re-run it any time a commit adds to `prisma/schema.prisma`, before the feature that needs the new table goes live.

> Neon's free tier suspends a database that has been idle for a few minutes; the first query after that takes a second or two to wake it. Fine for this workload.
>
> **Setting `DATABASE_URL` in Vercel is not the same as running this step.** Vercel's build only runs `prisma generate` (which generates client *code*, not tables) — nothing deploy-time ever pushes the schema itself. Skipping this step is the single most common cause of a working-looking `/login` that 500s the moment someone actually signs in.

## Step 5 — Turn on accounts (optional)

**Google or Discord sign-in only — there is no email/password option.** Needs Step 4 done first — accounts store a `User` row, so there's nowhere to put one without a database. Until then `/login` and `/signup` just say accounts aren't configured, same as every other feature below that needs a key.

1. Add the tables — same two options as step 4 (`npm run db:push` locally, or the "Push database schema" GitHub Action if you'd rather not touch a terminal). If you already did this in step 4, the accounts tables (`User`, `AuthToken`) came along for free — `db push` applies the whole schema at once, not per-feature.
2. Set a session secret in Vercel (Production, Preview and Development):
   ```
   AUTH_SECRET = <output of: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
   ```
   This alone is **not** enough to sign anyone in — you also need at least one of steps 3/4 below. `AUTH_SECRET` only signs the session cookie once someone's already authenticated.
3. **Google sign-in** — [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → **Create OAuth client ID**. Application type must be **Web application** — Desktop or Android client types can't use this flow and will fail. Authorised redirect URI, exactly:
   ```
   https://riftledger.app/api/auth/oauth/google/callback
   ```
   Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Vercel.

   **`Error 401: invalid_client` / "The OAuth client was not found"** means the `client_id` Vercel is sending doesn't match any real client in Google's system — the client was never finished being created, was deleted, or `GOOGLE_CLIENT_ID` still holds a placeholder. This is a Cloud Console / env var problem, not a code bug: recreate the client (or find the real one), confirm the redirect URI above is registered on it *exactly* (no trailing slash, right protocol), paste the real ID/secret into Vercel, and redeploy.
4. **Discord sign-in** — [Discord Developer Portal](https://discord.com/developers/applications) → New Application → OAuth2. Redirect:
   ```
   https://riftledger.app/api/auth/oauth/discord/callback
   ```
   Scopes `identify` and `email`. Add `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` in Vercel.
5. **Price-drop digest email** (optional, not needed for sign-in) — [resend.com](https://resend.com) → API Keys → add `RESEND_API_KEY` in Vercel. This only powers the Watch/Alert digest (step 8 below); OAuth accounts need no verification email and there's no password to reset.

**Redeploy after adding these.** A provider button (Google/Discord) only appears once *both* its env vars are set — a half-configured provider stays hidden rather than showing a button that fails. If neither provider is configured, `/login` and `/signup` show "accounts aren't configured" even with `DATABASE_URL` and `AUTH_SECRET` set — there's nothing to click without at least one.

## Step 6 — Import real TCGplayer prices

```bash
npm run prices:import
```

This matches all 950 catalogue cards against TCGplayer's product list and writes one snapshot per printing for today into `src/data/prices.json` (plus a day's column in `src/data/price-history.json`). Run it once to check the match rate — expect most cards to match; anything near zero means the matcher needs attention, and the script deliberately refuses to write in that case. Needs no credentials — it reads TCGplayer's own public search endpoint, the same one their website uses.

**Read TCGplayer's [API terms](https://developer.tcgplayer.com/) before you run this regularly.** Their pricing data is licensed: attribution is required wherever it appears, it can't be presented as your own, and bulk redistribution isn't permitted.

### It's already scheduled daily — as a GitHub Action, not a Vercel cron

`.github/workflows/refresh-prices.yml` runs this import at 06:10 UTC every day and **commits the new snapshot straight to the repo** — the commit is what triggers Vercel's redeploy, not a cron hitting a route. This works out of the box on a fork with no setup; the only thing worth knowing is that `git push` in that workflow needs the repo's default `GITHUB_TOKEN` to have write access (Settings → Actions → General → Workflow permissions → **Read and write**), which is on by default for a repo you created yourself.

If you'd rather also mirror snapshots into Postgres (for querying outside the site itself), set the `DATABASE_URL` repository secret in GitHub — see `scripts/prisma-sink.ts`. The site itself never reads prices from Postgres either way; `src/data/prices.json` is the only source `activeSource()` reads at request time.

## Step 7 — Demo banners disappear on their own

Nothing to configure here. `PRICES_ARE_DEMO` (see `lib/prices/demo-flag.ts`) is `true` exactly when `src/data/prices.json` is empty — it flips to `false`, and every "demo data" banner disappears, the moment step 6's import has run once and been committed. There is no env var that controls this and nothing to set in Vercel; redeploying after the GitHub Action's first commit is enough.

## Step 8 — Price-drop watch alerts (optional, needs step 5)

"Watch" on a card page emails a subscriber when the price drops — needs accounts (step 5) plus a cron trigger, which unlike step 6 genuinely does run through Vercel:

1. `vercel.json` already declares the schedule (`/api/cron/price-alerts`, daily). Nothing to add there.
2. Set `CRON_SECRET` in Vercel (Production) — any long random string. Vercel Cron sends it as a bearer token automatically once the var exists; the route rejects any request without a matching one.
3. `RESEND_API_KEY` (step 5) covers the digest email too — no separate key.

Without `CRON_SECRET` the route still runs (anyone who finds the path could trigger a check early), so set it before pointing real users at Watch.

---

## Cost

| | Free tier | When you'd pay |
|---|---|---|
| **Vercel** | Hobby: plenty for this | Commercial use requires Pro (~$20/mo) |
| **Neon** | 0.5 GB, autosuspend | Daily snapshots for 950 cards ≈ 350k rows/year — comfortably inside free for a long while |
| **Domain** | — | ~$10–15/yr |

A non-commercial deployment on your own domain costs about **$12/year**. Vercel's Hobby plan forbids commercial use, so the moment there are ads or a paid Premium tier, budget for Pro.

## Troubleshooting

**Build fails on `@prisma/client`** — `postinstall` runs `prisma generate`. If your install skipped postinstall scripts, run `npx prisma generate` and redeploy.

**Card images don't load** — they're hot-linked from `cdn.riftscribe.gg`. Check that host is up; the site has no local copies by design.

**Canonicals / sitemap point at `*.vercel.app`** — `NEXT_PUBLIC_SITE_URL` isn't set, or you didn't redeploy after setting it.

**Prices look identical to yesterday** — expected on the demo generator, which advances one point per real day. Real movement needs step 6 (which needs no database — `src/data/prices.json` is a repo file, not a table); step 4 is only needed for accounts and the optional Postgres price mirror, not for prices themselves.

**`/login` and `/signup` say accounts aren't configured** — `DATABASE_URL` isn't set (step 4), or `AUTH_SECRET` isn't, or neither OAuth provider is fully configured (step 3/4 — a provider needs *both* its client id and secret set, or it stays hidden rather than showing a button that fails). Redeploy after fixing whichever one it was.

**Google sign-in fails with `Error 401: invalid_client`** — see step 5's note. This is a Google Cloud Console / env var mismatch, not a code issue.

**Sign-in gets as far as the provider, then the site throws a 500 (or, since that's now caught, redirects to `/login` with "couldn't finish setting up your account")** — `DATABASE_URL` is set but the tables were never created. This is easy to hit because nothing in the deploy pipeline runs `db push` automatically — see the note at the end of step 4. Run it (locally or via the "Push database schema" Action) and try again. If it still fails afterward, check the Vercel function logs for the `/api/auth/oauth/[provider]/callback` route — the real error is logged there (most likely `AUTH_SECRET` missing next).

**"Compare stores" grid or regional prices missing from a card page** — expected for a lot of cards, not a bug: that section is sourced live from RiftCompare (see `DATA_INTEGRATION.md`) and only renders when RiftCompare has a match for that exact printing. No setup needed either way — it isn't gated by an env var, only by `RIFTCOMPARE_API_URL` being reachable (it defaults to production RiftCompare) and that specific card having a match there.

**Watch emails never arrive** — check `RESEND_API_KEY` first (step 5), then confirm the Vercel Cron is actually configured (step 8) — `vercel.json` declares the schedule, but Vercel only registers crons that were present in the **Production** deployment, so a first deploy without `CRON_SECRET` set still needs a redeploy once it's added.
