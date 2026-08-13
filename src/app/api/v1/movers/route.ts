import { NextResponse } from "next/server";
import { moverSplit, HAS_CHANGE_DATA } from "@/lib/prices";
import type { SeriesKey } from "@/lib/prices/source";
import { resolveApiKey } from "@/lib/api-key";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";

const VALID_SERIES: SeriesKey[] = ["low", "mid", "market", "foil", "foilMarket"];

// GET /api/v1/movers?series=market&days=1&limit=25
// Today's (or the last N days') biggest gainers/losers, the same computation
// the /interests page reads. Empty gainers/losers (with hasChangeData:false)
// until two days of price history exist — see docs/API.md.
export async function GET(req: Request) {
  const ctx = await resolveApiKey(req);
  if (!ctx) {
    return NextResponse.json({ error: "Missing or invalid API key. See /api-docs." }, { status: 401 });
  }

  const limit = rateLimit(`api:movers:${ctx.keyId}`, 60, 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const url = new URL(req.url);
  const seriesParam = url.searchParams.get("series") ?? "market";
  const series = (VALID_SERIES as string[]).includes(seriesParam) ? (seriesParam as SeriesKey) : "market";
  const days = Math.min(90, Math.max(1, parseInt(url.searchParams.get("days") ?? "1", 10) || 1));
  const resultLimit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "25", 10) || 25));

  const { gainers, losers } = moverSplit(series, days, resultLimit);
  const toJson = (m: (typeof gainers)[number]) => ({
    slug: m.card.slug,
    name: m.card.name,
    setCode: m.card.setCode,
    nowCents: m.now,
    thenCents: m.then,
    pct: m.pct,
  });

  return NextResponse.json({
    series,
    days,
    hasChangeData: HAS_CHANGE_DATA,
    gainers: gainers.map(toJson),
    losers: losers.map(toJson),
  });
}
