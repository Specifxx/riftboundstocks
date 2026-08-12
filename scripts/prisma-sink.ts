/**
 * Mirror a day's snapshot into Postgres.
 *
 * Only reached when DATABASE_URL is set — the default deployment keeps its
 * history in the repo (see import-prices.ts). This exists so the JSON history
 * can be migrated to a database once it gets long enough that committing it on
 * every run stops being reasonable.
 *
 * Imported dynamically by the importer so `@prisma/client` never has to load
 * for the file-only path.
 */
import { PrismaClient } from "@prisma/client";
import { CARDS } from "../src/lib/catalog";
import type { TcgCardData } from "../src/lib/prices/tcgplayer";

export async function writeSnapshotToPrisma(day: string, data: Map<string, TcgCardData>): Promise<void> {
  const prisma = new PrismaClient();
  const dayDate = new Date(`${day}T00:00:00Z`);
  const byId = new Map(CARDS.map((c) => [c.id, c]));
  let written = 0;

  try {
    for (const [cardId, d] of data) {
      const card = byId.get(cardId);
      if (!card || d.quote.market == null) continue;

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
          marketCents: d.quote.market,
          foilMarketCents: d.quote.foilMarket,
          lastPricedAt: new Date(),
          tcgProductId: d.productId,
        },
        update: {
          marketCents: d.quote.market,
          foilMarketCents: d.quote.foilMarket,
          lastPricedAt: new Date(),
          tcgProductId: d.productId,
        },
        select: { id: true },
      });

      const values = {
        lowCents: d.quote.low ?? d.quote.market,
        midCents: d.quote.mid ?? d.quote.market,
        marketCents: d.quote.market,
        foilCents: d.quote.foil,
        foilMarketCents: d.quote.foilMarket,
        source: "tcgplayer",
      };

      await prisma.priceSnapshot.upsert({
        where: { cardId_day: { cardId: row.id, day: dayDate } },
        create: { cardId: row.id, day: dayDate, ...values },
        update: values,
      });
      written++;
    }
    console.log(`  mirrored ${written} snapshots to Postgres.`);
  } finally {
    await prisma.$disconnect();
  }
}
