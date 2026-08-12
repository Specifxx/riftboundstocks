import { NextResponse } from "next/server";
import { searchCards } from "@/lib/catalog";
import { latestQuote } from "@/lib/prices";

// Search runs on the server so the client never downloads the 950-card index.
// The catalogue is static for the life of a deploy, so responses are cacheable.
export const dynamic = "force-static";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const results = searchCards(q, 8).map((c) => ({
    slug: c.slug,
    name: c.name,
    setName: c.setName,
    setCode: c.setCode,
    collectorLabel: c.collectorLabel,
    rarity: c.rarity,
    thumb: c.imageThumbUrl,
    market: latestQuote(c).market,
  }));
  return NextResponse.json({ results });
}
