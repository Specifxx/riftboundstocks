import { NextResponse } from "next/server";
import { cardBySlug, cardById } from "@/lib/catalog";
import { latestQuote, cardStats } from "@/lib/prices";
import { resolveApiKey } from "@/lib/api-key";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { PRICES_ARE_DEMO } from "@/lib/site";

// GET /api/v1/prices?slug=blazing-scorcher-ogn-1  (or ?id=<RiftScribe id>)
// One printing's latest quote plus the same stats the card page's Data panel
// shows (all-time high/low since first import, foil multiplier, deltas).
// Nullable fields mean exactly what they mean everywhere else on this site:
// "not priced", never zero. See docs/API.md.
export async function GET(req: Request) {
  const ctx = await resolveApiKey(req);
  if (!ctx) {
    return NextResponse.json({ error: "Missing or invalid API key. See /api-docs." }, { status: 401 });
  }

  const limit = rateLimit(`api:prices:${ctx.keyId}`, 300, 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  const id = url.searchParams.get("id");
  const card = slug ? cardBySlug(slug) : id ? cardById(id) : undefined;
  if (!card) return NextResponse.json({ error: "Unknown card. Pass ?slug= or ?id=." }, { status: 404 });

  const stats = cardStats(card);
  const q = latestQuote(card);

  return NextResponse.json({
    card: { id: card.id, slug: card.slug, name: card.name, setCode: card.setCode, collectorLabel: card.collectorLabel },
    isDemoData: PRICES_ARE_DEMO,
    latest: q,
    allTimeHigh: stats.allTimeHigh,
    allTimeLow: stats.allTimeLow,
    foilMultiplier: stats.foilMultiplier,
    spreadPct: stats.spreadPct,
    deltas: stats.deltas,
    historyPoints: stats.points,
  });
}
