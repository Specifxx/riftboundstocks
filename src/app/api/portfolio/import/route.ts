import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { accountsDisabledResponse, getCurrentUser } from "@/lib/auth";
import { rateLimit, clientIp, tooManyRequests } from "@/lib/rate-limit";
import { planLimits } from "@/lib/plans";
import { parsePortfolioCsv, type CsvRowError } from "@/lib/portfolio-csv";

// POST: text/plain or text/csv body. Upserts each row through the same
// (userId, cardId, condition, isFoil) key as the manual add form, so
// re-importing an updated export corrects existing rows instead of
// duplicating them. Stops adding NEW rows once the plan's watchlist cap is
// hit but keeps processing (as corrections to already-owned rows) — a
// partial import is more useful than an all-or-nothing failure. Parsing
// itself lives in lib/portfolio-csv.ts, exercised directly by
// scripts/verify-logic.ts.
export async function POST(req: Request) {
  const disabled = accountsDisabledResponse();
  if (disabled) return disabled;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const limit = rateLimit(`portfolio:import:${clientIp(req)}`, 5, 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const account = await prisma.user.findUnique({ where: { id: user.id }, select: { planTier: true } });
  const limits = planLimits(account?.planTier);
  if (!limits.csvImport) {
    return NextResponse.json({ error: `CSV import needs a Plus, Pro or Store plan. See /premium.` }, { status: 403 });
  }

  const text = await req.text();
  if (!text || text.length > 1_000_000) {
    return NextResponse.json({ error: "Empty or oversized file (max 1MB)." }, { status: 400 });
  }

  const { rows, errors } = parsePortfolioCsv(text);
  if (rows.length === 0) {
    return NextResponse.json({ imported: 0, skipped: errors.length, errors: errors.slice(0, 50) });
  }

  const existingKeys = new Set(
    (await prisma.collectionCard.findMany({ where: { userId: user.id }, select: { cardId: true, condition: true, isFoil: true } })).map(
      (r) => `${r.cardId}:${r.condition}:${r.isFoil}`,
    ),
  );

  let capacity = limits.maxWatchlist == null ? Infinity : Math.max(0, limits.maxWatchlist - existingKeys.size);
  let imported = 0;
  const capped: CsvRowError[] = [];

  for (const row of rows) {
    const key = `${row.cardId}:${row.condition}:${row.isFoil}`;
    const isNew = !existingKeys.has(key);
    if (isNew) {
      if (capacity <= 0) {
        capped.push({ line: row.line, raw: row.cardId, reason: `Skipped — over the ${limits.label} plan's ${limits.maxWatchlist} entry limit.` });
        continue;
      }
      capacity--;
      existingKeys.add(key);
    }
    await prisma.collectionCard.upsert({
      where: { userId_cardId_condition_isFoil: { userId: user.id, cardId: row.cardId, condition: row.condition, isFoil: row.isFoil } },
      update: { quantity: row.quantity, costBasisCents: row.costBasisCents },
      create: { userId: user.id, cardId: row.cardId, condition: row.condition, isFoil: row.isFoil, quantity: row.quantity, costBasisCents: row.costBasisCents },
    });
    imported++;
  }

  return NextResponse.json({
    imported,
    skipped: errors.length + capped.length,
    errors: [...errors, ...capped].slice(0, 50),
  });
}
