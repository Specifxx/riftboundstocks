/**
 * Hit every route against a running server and report status + timing.
 *
 * Usage:
 *   npm run dev            # in one terminal
 *   npm run smoke          # in another
 *
 * Set BASE_URL to smoke a deployed environment instead of localhost.
 * Exits non-zero if anything is not 200, so it can gate a deploy.
 */
import { CARDS } from "../src/lib/catalog";
import { SETS } from "../src/lib/riftbound";
import { ARTICLES } from "../src/lib/content/articles";

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

function routes(): string[] {
  return [
    "/",
    "/sets",
    "/interests",
    "/interests?tab=foil&rarity=Epic",
    "/news",
    "/news?category=Meta+Report",
    "/analytics",
    "/domains",
    "/decks",
    "/sealed",
    "/browse",
    "/browse?type=Legend",
    "/premium",
    "/login",
    "/signup",
    "/portfolio",
    "/about",
    "/privacy",
    "/search?q=jinx",
    "/sitemap.xml",
    "/robots.txt",
    "/api/search?q=ahri",
    ...SETS.map((s) => `/sets/${s.slug}`),
    ...ARTICLES.map((a) => `/news/${a.slug}`),
    // A spread of card pages rather than all 950: one per set, plus the two
    // variant forms, which are the printings most likely to route wrong.
    ...SETS.map((s) => CARDS.find((c) => c.setCode === s.code)).filter(Boolean).map((c) => `/card/${c!.slug}`),
    ...[CARDS.find((c) => c.variant === "a"), CARDS.find((c) => c.variant === "s")]
      .filter(Boolean)
      .map((c) => `/card/${c!.slug}`),
    // Must 404, not 500.
    "/card/does-not-exist",
    "/sets/does-not-exist",
  ];
}

async function main() {
  const all = routes();
  console.log(`Smoking ${all.length} routes against ${BASE}\n`);

  const failures: string[] = [];

  for (const route of all) {
    const expect404 = route.endsWith("does-not-exist");
    // Removed page, kept as a redirect rather than a 404 — it was indexed and
    // may be bookmarked. See src/app/premium/page.tsx's history.
    const expectRedirect = route === "/premium";
    const started = Date.now();
    try {
      const res = await fetch(`${BASE}${route}`, { redirect: "manual" });
      const ms = Date.now() - started;
      const ok = expect404 ? res.status === 404 : expectRedirect ? res.status === 307 : res.status === 200;
      if (!ok) failures.push(`${route} → ${res.status}`);
      console.log(`${ok ? "  ok " : "FAIL "} ${String(res.status).padEnd(4)} ${String(ms).padStart(5)}ms  ${route}`);
    } catch (e) {
      failures.push(`${route} → ${(e as Error).message}`);
      console.log(`FAIL  ---        —  ${route}  (${(e as Error).message})`);
    }
  }

  console.log();
  if (failures.length) {
    console.error(`${failures.length} route(s) failed:`);
    for (const f of failures) console.error(`  ${f}`);
    process.exit(1);
  }
  console.log(`All ${all.length} routes OK.`);
}

main();
