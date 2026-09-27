import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";
import { RIFTCOMPARE_URL } from "@/lib/affiliate";

// schema.org structured data. Search engines read it to show breadcrumbs,
// prices and article dates in results; it has no visual effect on the page.
//
// `<` is escaped so a card name or article title can never close the script
// tag early — the JSON is still identical once parsed.
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

const abs = (path: string) => (path.startsWith("http") ? path : `${SITE_URL}${path}`);

/** A BreadcrumbList. "Home" is prepended, so pass only the trail below it. */
export function breadcrumbLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...trail].map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: abs(t.path),
    })),
  };
}

export function siteLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_TAGLINE,
      inLanguage: "en",
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/logo-r.png`,
      // Same owner — tells search engines the two sites belong together.
      sameAs: [RIFTCOMPARE_URL],
    },
  ];
}
