import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

// Every page view is a billed render, so crawlers that bring no visitors are
// turned away (DECISIONS.md, "robots.txt turns away bulk scrapers"). Search
// engines and answer engines that cite and link back stay allowed.
const SEO_SCRAPERS = ["AhrefsBot", "SemrushBot", "MJ12bot", "DotBot", "PetalBot", "Bytespider", "DataForSeoBot", "BLEXBot"];
const BULK_AI_SCRAPERS = ["CCBot", "GPTBot", "Google-Extended"];
// /search is user-generated query space with no unique content of its own.
const DISALLOW = ["/api/", "/search"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: ["Googlebot", "Bingbot"], allow: "/", disallow: DISALLOW },
      { userAgent: [...SEO_SCRAPERS, ...BULK_AI_SCRAPERS], disallow: "/" },
      { userAgent: "*", allow: "/", disallow: DISALLOW, crawlDelay: 10 },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
