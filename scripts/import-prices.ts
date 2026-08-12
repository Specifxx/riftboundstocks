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
import { buildTcgSnapshot, type TcgCardData } from "../src/lib/prices/tcgplayer";
import { SERIES_ORDER, type PriceFile, type HistoryFile, type DetailsFile } from "../src/lib/prices/store";

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

  if (process.env.DATABASE_URL) {
    console.log("\nDATABASE_URL is set — mirroring the snapshot to Postgres…");
    const { writeSnapshotToPrisma } = await import("./prisma-sink");
    await writeSnapshotToPrisma(day, data);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
