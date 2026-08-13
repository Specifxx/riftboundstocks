import { NextResponse } from "next/server";
import { CARDS } from "@/lib/catalog";
import { resolveApiKey } from "@/lib/api-key";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";

const MAX_LIMIT = 200;

// GET /api/v1/cards?set=OGN&domain=Fury&rarity=Rare&type=Unit&limit=50&offset=0
// Public read-only card catalogue lookup. Requires an API key (Pro/Store
// plans — see lib/plans.ts) sent as `x-api-key`. See docs/API.md.
export async function GET(req: Request) {
  const ctx = await resolveApiKey(req);
  if (!ctx) {
    return NextResponse.json(
      { error: "Missing or invalid API key. Create one from /profile on a Pro or Store plan — see /api-docs." },
      { status: 401 },
    );
  }

  const limit = rateLimit(`api:cards:${ctx.keyId}`, 120, 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const url = new URL(req.url);
  const set = url.searchParams.get("set")?.toUpperCase();
  const domain = url.searchParams.get("domain");
  const rarity = url.searchParams.get("rarity");
  const type = url.searchParams.get("type");
  const limitParam = Math.min(MAX_LIMIT, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50", 10) || 50));
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10) || 0);

  let results = CARDS as typeof CARDS;
  if (set) results = results.filter((c) => c.setCode === set);
  if (domain) results = results.filter((c) => c.domain === domain);
  if (rarity) results = results.filter((c) => c.rarity === rarity);
  if (type) results = results.filter((c) => c.type === type);

  const page = results.slice(offset, offset + limitParam).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    setCode: c.setCode,
    setName: c.setName,
    collectorLabel: c.collectorLabel,
    rarity: c.rarity,
    domain: c.domain,
    type: c.type,
    imageUrl: c.imageUrl,
  }));

  return NextResponse.json({
    total: results.length,
    limit: limitParam,
    offset,
    cards: page,
  });
}
