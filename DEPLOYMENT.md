# Deploying RiftboundStocks

Written in the order you should actually do it. **Steps 1–3 get you a live site in about ten minutes** and need no database and no API keys. Everything after that is optional and can wait.

---

## Step 1 — Push the repo

Already done if you're reading this in GitHub. The default branch is `main`.

## Step 2 — Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and sign in with GitHub.
2. **Import** the `riftboundstocks` repository. Grant access to it if Vercel asks.
3. Vercel detects Next.js on its own. **Change nothing** — the defaults are correct:
   - Framework preset: `Next.js`
   - Build command: `npm run build`
   - Output directory: *(leave blank)*
   - Install command: `npm install`
4. Skip environment variables for now.
5. **Deploy.** First build takes roughly 2–4 minutes (it pre-renders 120 card pages plus every set and article).

You now have a working site at `riftboundstocks-<hash>.vercel.app`.

> **Node version:** Vercel defaults to Node 20+, which is what this project expects. Only touch Settings → General → Node.js Version if a build complains.

## Step 3 — Point your domain at it

1. Buy the domain wherever you like (Cloudflare, Namecheap, Porkbun — Vercel also sells them, which skips this whole step).
2. In Vercel: **Project → Settings → Domains → Add**, enter `riftboundstocks.com`.
3. Vercel shows you the DNS records to create. At your registrar, add:
   - **A** record, name `@`, value `76.76.21.21`
   - **CNAME** record, name `www`, value `cname.vercel-dns.com`
   *(Use whatever Vercel's panel actually shows — these values are its current defaults, not a promise.)*
4. Wait for propagation (usually minutes, up to a few hours). Vercel issues the TLS certificate automatically.
5. Pick which host is canonical — `riftboundstocks.com` or `www.riftboundstocks.com` — and set the other to redirect. Vercel offers this in the same panel.

### Then set the site URL

**Project → Settings → Environment Variables**, add for *Production*:

```
NEXT_PUBLIC_SITE_URL = https://riftboundstocks.com
NEXT_PUBLIC_CONTACT_EMAIL = you@yourdomain.com
```

**Redeploy after adding these.** Without `NEXT_PUBLIC_SITE_URL`, canonical URLs, OpenGraph tags and `sitemap.xml` all point at the `*.vercel.app` host, which quietly wrecks SEO.

### Tell search engines

- [Google Search Console](https://search.google.com/search-console) → add the domain → verify via DNS TXT → submit `https://riftboundstocks.com/sitemap.xml`.
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
5. Locally, put the same line in `.env.local`, then create the tables:
   ```bash
   npm run db:push
   ```

> Neon's free tier suspends a database that has been idle for a few minutes; the first query after that takes a second or two to wake it. Fine for this workload.

## Step 5 — Import real TCGplayer prices

```bash
npm run prices:import
```

This matches all 950 catalogue cards against TCGplayer's product list and writes one snapshot per printing for today. Run it once to check the match rate — expect most cards to match; anything near zero means the matcher needs attention, and the script deliberately refuses to write in that case.

**Read TCGplayer's [API terms](https://developer.tcgplayer.com/) before you run this regularly.** Their pricing data is licensed: attribution is required wherever it appears, it can't be presented as your own, and bulk redistribution isn't permitted.

### Schedule it daily

Add to `vercel.json`:

```json
{
  "crons": [{ "path": "/api/cron/refresh-prices", "schedule": "0 6 * * *" }]
}
```

…then write `src/app/api/cron/refresh-prices/route.ts` to call the same import logic, guarded by a `CRON_SECRET` check so the endpoint can't be triggered by anyone who guesses the path. (Vercel Cron is once-a-day on the Hobby plan, which is exactly what daily snapshots need.)

## Step 6 — Switch the site off demo data

Two changes, in this order:

1. In `src/lib/prices/index.ts`, point `activeSource()` at a Prisma-backed reader instead of `syntheticSource`.
2. Set `TCGPLAYER_PUBLIC_KEY` in Vercel.

That second variable is what flips `PRICES_ARE_DEMO` to `false` and strips the demo disclaimers from every page. **Do not set it until step 1 is genuinely working** — it is the only thing stopping the site presenting generated numbers as real market data.

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

**Prices look identical to yesterday** — expected on the demo generator, which advances one point per real day. Real movement needs steps 4–6.
