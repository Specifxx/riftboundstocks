import { NextResponse } from "next/server";
import { searchCards } from "@/lib/catalog";
import { latestQuote } from "@/lib/prices";

// Search runs on the server so the client never downloads the 950-card index.
//
// Must stay force-dynamic: this route's entire output depends on `?q=`, and
// force-static previously prerendered it once at build time with no query
// string, then served that one cached `{results: []}` response to every
// request in production forever, regardless of what was typed. The lookup
// itself is an in-memory array scan (sub-millisecond), so there's no real
// cost to computing it per request — the "cacheable" premise was the bug.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const results = searchCards(q, 8).map((c) => ({
    id: c.id,
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
