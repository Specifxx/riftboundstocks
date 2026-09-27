import { sortedArticles } from "@/lib/content/articles";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// RSS 2.0 for the market reports, so feed readers and aggregators can pick
// them up. Linked from <head> (layout.tsx) and the footer.
export const dynamic = "force-static";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function GET() {
  const items = sortedArticles()
    .map((a) => {
      const url = `${SITE_URL}/news/${a.slug}`;
      return `    <item>
      <title>${esc(a.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(`${a.publishedOn}T00:00:00Z`).toUTCString()}</pubDate>
      <category>${esc(a.category)}</category>
      <description>${esc(a.excerpt)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE_NAME)} — Riftbound Market Reports</title>
    <link>${SITE_URL}/news</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>Data reports on the Riftbound TCG card market, measured from TCGplayer prices.</description>
    <language>en</language>
${items}
  </channel>
</rss>
`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
