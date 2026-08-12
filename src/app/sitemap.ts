import type { MetadataRoute } from "next";
import { CARDS } from "@/lib/catalog";
import { SETS } from "@/lib/riftbound";
import { ARTICLES } from "@/lib/content/articles";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = ([
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/sets`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/interests`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/news`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/analytics`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/domains`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/decks`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/sealed`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/browse`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/premium`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ] as const).map((e) => ({ ...e, lastModified: now }));

  return [
    ...staticPages,
    ...SETS.map((s) => ({
      url: `${SITE_URL}/sets/${s.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...ARTICLES.map((a) => ({
      url: `${SITE_URL}/news/${a.slug}`,
      lastModified: new Date(`${a.publishedOn}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    // Every card gets an entry — these are the pages the site exists to serve,
    // and at 950 URLs the file stays far inside the 50k/50MB sitemap limits.
    ...CARDS.map((c) => ({
      url: `${SITE_URL}/card/${c.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.5,
    })),
  ];
}
