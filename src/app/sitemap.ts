import type { MetadataRoute } from "next";
import { CARDS } from "@/lib/catalog";
import { SETS } from "@/lib/riftbound";
import { ARTICLES } from "@/lib/content/articles";
import { SITE_URL } from "@/lib/site";
import { allChampions } from "@/lib/champions";
import { HISTORY_DAYS } from "@/lib/prices";
import { cardIndexable } from "@/lib/indexable";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  // Price-driven pages change when the prices do, so their lastmod is the
  // latest snapshot's date rather than the build time (every entry sharing
  // one build timestamp tells a crawler nothing). Static pages carry none.
  const lastDay = HISTORY_DAYS[HISTORY_DAYS.length - 1];
  const now = lastDay ? new Date(`${lastDay}T00:00:00Z`) : new Date();

  const staticPages: MetadataRoute.Sitemap = ([
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/sets`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/champions`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/interests`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/news`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/analytics`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/domains`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/decks`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/sealed`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/browse`, changeFrequency: "weekly", priority: 0.6 },
  ] as const).map((e) => ({ ...e, lastModified: now }));
  const policyPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  return [
    ...staticPages,
    ...policyPages,
    ...SETS.map((s) => ({
      url: `${SITE_URL}/sets/${s.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...allChampions().map((c) => ({
      url: `${SITE_URL}/champions/${c.slug}`,
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
    // Cards worth US$1+ only: the rest are noindex (lib/indexable.ts), and
    // listing 1,400 near-identical pages left 1,391 of them "Discovered – not indexed".
    ...CARDS.filter(cardIndexable).map((c) => ({
      url: `${SITE_URL}/card/${c.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.5,
    })),
  ];
}
