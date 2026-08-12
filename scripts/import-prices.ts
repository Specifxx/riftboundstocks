/**
 * Fetch live TCGplayer prices and write one snapshot per printing per day.
 *
 * Usage: npm run prices:import
 * Requires DATABASE_URL. Safe to run repeatedly — a same-day re-run updates the
 * day's row rather than adding a second one.
 *
 * This is the bridge between the demo build and a real one. Once snapshots
 * exist, point activeSource() in src/lib/prices/index.ts at a Prisma-backed
 * reader and set TCGPLAYER_PUBLIC_KEY so the demo disclaimers come off.
 *
 * TCGplayer's data is licensed. Attribution is required wherever it is shown,
 * it may not be presented as your own, and bulk redistribution is not
 * permitted — read their API terms before running this at any volume.
 */
import { PrismaClient } from "@prisma/client";
import { CARDS } from "../src/lib/catalog";
import { fetchTcgplayerQuotes } from "../src/lib/prices/tcgplayer";

const prisma = new PrismaClient();

/** UTC calendar day, matching the day index the chart's x-axis uses. */
function today(): Date {
  return new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set — see .env.example.");
    process.exit(1);
  }

  console.log(`Matching ${CARDS.length} cards against the TCGplayer catalogue…`);
  const quotes = await fetchTcgplayerQuotes(CARDS);
  console.log(`Matched ${quotes.size} of ${CARDS.length}.`);

  if (quotes.size === 0) {
    // Writing nothing is right: an empty match set means the fetch or the
    // matcher broke, and zeroing every price would corrupt the history.
    console.error("No products matched. Not writing anything.");
    process.exit(1);
  }

  const day = today();
  let written = 0;

  for (const card of CARDS) {
    const match = quotes.get(card.id);
    if (!match) continue;
    const q = match.quote;

    const row = await prisma.card.upsert({
      where: { externalId: card.id },
      create: {
        externalId: card.id,
        slug: card.slug,
        name: card.name,
        setCode: card.setCode,
        setName: card.setName,
        collectorNumber: card.collectorNumber,
        collectorLabel: card.collectorLabel,
        variant: card.variant,
        rarity: card.rarity,
        domain: card.domain,
        type: card.type,
        imageUrl: card.imageUrl,
        imageThumbUrl: card.imageThumbUrl,
        marketCents: q.market,
        foilMarketCents: q.foilMarket,
        lastPricedAt: new Date(),
        tcgProductId: match.productId,
      },
      update: {
        marketCents: q.market,
        foilMarketCents: q.foilMarket,
        lastPricedAt: new Date(),
        tcgProductId: match.productId,
      },
      select: { id: true },
    });

    const values = {
      lowCents: q.low,
      midCents: q.mid,
      marketCents: q.market,
      foilCents: q.foil,
      foilMarketCents: q.foilMarket,
      source: "tcgplayer",
    };

    await prisma.priceSnapshot.upsert({
      where: { cardId_day: { cardId: row.id, day } },
      create: { cardId: row.id, day, ...values },
      update: values,
    });

    written++;
    if (written % 100 === 0) process.stdout.write(`\rWrote ${written} snapshots…`);
  }

  console.log(`\nWrote ${written} snapshots for ${day.toISOString().slice(0, 10)}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
