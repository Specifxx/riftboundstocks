/**
 * Fetch real TCGplayer prices and write them into the repo.
 *
 *   npm run prices:import
 *
 * Writes three files, split by how often each actually changes:
 *   src/data/card-details.json   product id, URL, rules text, flavour — static
 *                                per printing, so it is not rewritten daily
 *   src/data/prices.json         today's quote for every priced card
 *   src/data/price-history.json  one appended column per day, the chart series
 *
 * There is no database in the default deployment, so the repo IS the store: a
 * scheduled GitHub Action runs this, commits the diff, and the commit triggers a
 * redeploy. When DATABASE_URL is set the same snapshot is also written to
 * Postgres (see prisma/schema.prisma), which is the better home once history
 * gets long.
 *
 * Re-running on the same day REPLACES that day's column rather than appending a
 * second one, so the job is safe to retry.
 *
 * TCGplayer's data is licensed — see the terms note in src/lib/prices/tcgplayer.ts.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { CARDS } from "../src/lib/catalog";
import { buildTcgSnapshot, fetchPricePoints, type TcgCardData } from "../src/lib/prices/tcgplayer";
import { SERIES_ORDER, type PriceFile, type HistoryFile, type DetailsFile } from "../src/lib/prices/store";
import type { SealedFile } from "../src/lib/prices/sealed";

const path = (name: string) => fileURLToPath(new URL(`../src/data/${name}`, import.meta.url));

function readJson<T>(name: string, fallback: T): T {
  const p = path(name);
  if (!existsSync(p)) return fallback;
  try {
    return JSON.parse(readFileSync(p, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const started = Date.now();
  console.log(`Importing TCGplayer prices for ${CARDS.length} cards…`);

  const { data, stats } = await buildTcgSnapshot(CARDS);

  console.log(`\n  products seen      ${stats.products}`);
  console.log(`  matched            ${stats.matched}`);
  console.log(`  priced             ${stats.priced}`);
  console.log(`  unmatched          ${stats.unmatched.length}`);
  console.log(`  name-rejected      ${stats.nameRejected.length}`);
  console.log(`  pricepoint misses  ${stats.pricepointFailures}`);

  if (stats.unmatched.length) console.log(`\n  unmatched sample:\n    ${stats.unmatched.slice(0, 10).join("\n    ")}`);
  if (stats.nameRejected.length) console.log(`\n  name-rejected sample:\n    ${stats.nameRejected.slice(0, 10).join("\n    ")}`);

  // A collapsed match rate means the endpoint changed shape or the matcher
  // broke. Overwriting good prices with near-nothing is worse than doing
  // nothing, so bail out and leave the last good files in place.
  const rate = stats.priced / CARDS.length;
  if (rate < 0.5) {
    console.error(`\nOnly ${(rate * 100).toFixed(1)}% of cards priced — refusing to write. Existing data left untouched.`);
    process.exit(1);
  }

  const day = today();

  // ── details (static per printing) ──────────────────────────────────────────
  const details: DetailsFile = { updatedAt: new Date().toISOString(), cards: {} };
  for (const [cardId, d] of data) {
    details.cards[cardId] = {
      productId: d.productId,
      url: d.url,
      rarity: d.rarity,
      description: d.description,
      flavorText: d.flavorText,
      listings: d.totalListings,
    };
  }
  writeFileSync(path("card-details.json"), JSON.stringify(details));

  // ── latest prices ──────────────────────────────────────────────────────────
  const prices: PriceFile = { day, fetchedAt: new Date().toISOString(), source: "tcgplayer", cards: {} };
  const quoteTuple = (d: TcgCardData) => SERIES_ORDER.map((k) => d.quote[k]);
  for (const [cardId, d] of data) {
    // A foil-only printing has no Normal market price but is still priced —
    // requiring `market` would have dropped every Showcase card.
    if (d.quote.market == null && d.quote.foilMarket == null) continue;
    prices.cards[cardId] = quoteTuple(d);
  }
  writeFileSync(path("prices.json"), JSON.stringify(prices));

  // ── history (append or replace today's column) ─────────────────────────────
  const history = readJson<HistoryFile>("price-history.json", { days: [], cards: {} });
  let col = history.days.indexOf(day);
  if (col === -1) {
    history.days.push(day);
    col = history.days.length - 1;
  }
  const width = history.days.length;

  for (const cardId of Object.keys(prices.cards)) {
    const row = (history.cards[cardId] ??= []);
    // Pad with nulls for days before this card was first priced, so every row
    // stays index-aligned with `days`.
    while (row.length < width) row.push(null);
    row[col] = prices.cards[cardId];
  }
  // Cards that dropped out today get an explicit null rather than a stale value
  // carried forward — a gap is a fact, a repeated price is a fiction.
  for (const [cardId, row] of Object.entries(history.cards)) {
    while (row.length < width) row.push(null);
    if (!(cardId in prices.cards)) row[col] = null;
  }
  writeFileSync(path("price-history.json"), JSON.stringify(history));

  console.log(
    `\nWrote ${Object.keys(prices.cards).length} prices for ${day}. ` +
      `History now spans ${history.days.length} day(s): ${history.days[0]} → ${history.days[history.days.length - 1]}.`,
  );
  console.log(`Done in ${((Date.now() - started) / 1000).toFixed(0)}s.`);

  await importSealed(day);

  if (process.env.DATABASE_URL) {
    console.log("\nDATABASE_URL is set — mirroring the snapshot to Postgres…");
    // The JSON files above are the source of truth and are already written to
    // disk at this point; Postgres is a secondary mirror (see prisma-sink.ts's
    // header comment). The scheduled workflow commits those files as its very
    // next step, gated on this process's exit code — an unexpected failure in
    // the optional mirror must never take that commit down with it.
    try {
      const { writeSnapshotToPrisma } = await import("./prisma-sink");
      await writeSnapshotToPrisma(day, data);
    } catch (e) {
      console.error("Postgres mirror failed — snapshot files were already written, continuing.", e);
    }
  }
}

/**
 * Prices for the 54 sealed products.
 *
 * Same pricepoints call as the singles, and for the same reason: the search
 * payload returns `medianPrice: null` for every sealed product, so a real "Mid"
 * series only exists through the per-product endpoint. `low` is deliberately NOT
 * stored — the lowest sealed listing is routinely nonsense (a $12 "Vendetta
 * Booster Display" against a $160 market, a $2,039 Pre-Rift Event Kit against
 * $275), so market is the only figure worth publishing here.
 */
async function importSealed(day: string) {
  const catalogue = readJson<SealedFile>("sealed.json", { updatedAt: "", products: [] });
  if (catalogue.products.length === 0) {
    console.log("\nNo sealed catalogue — run `npm run seed:sealed` first. Skipping sealed prices.");
    return;
  }

  console.log(`\nPricing ${catalogue.products.length} sealed products…`);
  const prices: PriceFile = { day, fetchedAt: new Date().toISOString(), source: "tcgplayer", cards: {} };
  let priced = 0;

  for (const p of catalogue.products) {
    const points = await fetchPricePoints(p.productId);
    const normal = points?.find((x) => x.printingType === "Normal");
    const market = normal?.marketPrice == null ? null : Math.round(normal.marketPrice * 100);
    const mid = normal?.listedMedianPrice == null ? null : Math.round(normal.listedMedianPrice * 100);
    if (market == null && mid == null) continue;
    // Same tuple shape as the singles, so the charts and movers components work
    // on sealed with no changes. Foil is meaningless for a box.
    prices.cards[String(p.productId)] = [null, mid, market, null, null];
    priced++;
    await sleep(90);
  }

  writeFileSync(path("sealed-prices.json"), JSON.stringify(prices));

  const history = readJson<HistoryFile>("sealed-history.json", { days: [], cards: {} });
  let col = history.days.indexOf(day);
  if (col === -1) {
    history.days.push(day);
    col = history.days.length - 1;
  }
  const width = history.days.length;
  for (const key of Object.keys(prices.cards)) {
    const row = (history.cards[key] ??= []);
    while (row.length < width) row.push(null);
    row[col] = prices.cards[key];
  }
  for (const [key, row] of Object.entries(history.cards)) {
    while (row.length < width) row.push(null);
    if (!(key in prices.cards)) row[col] = null;
  }
  writeFileSync(path("sealed-history.json"), JSON.stringify(history));

  console.log(`  priced ${priced}/${catalogue.products.length} sealed products.`);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
