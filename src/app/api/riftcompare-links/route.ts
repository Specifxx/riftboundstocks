import { riftcompareMap } from "@/lib/riftcompare-map";
import { SITE_URL } from "@/lib/site";

// Link map for RiftCompare, our sister site: RiftCompare's own URL slugs →
// the matching page here. RiftCompare reads this once a day to link each of
// its card, champion and set pages to the same card's price history on this
// site — so the join lives in ONE place (lib/riftcompare-map.ts) instead of
// RiftCompare re-deriving this site's slugs and drifting.
//
// Static: rebuilt with every deploy, which is when the catalogue can change.
export const dynamic = "force-static";

export function GET() {
  return Response.json(
    { site: SITE_URL, generatedAt: new Date().toISOString(), ...riftcompareMap() },
    { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } },
  );
}
