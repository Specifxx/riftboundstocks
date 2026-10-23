// Demo articles that were removed (they were invented pieces under fictional
// bylines — see lib/content/articles.ts). They were in the sitemap, so search
// engines know them; a permanent redirect hands that equity to the news hub
// instead of serving 404s.
const RETIRED_ARTICLES = [
  "weekly-winners-showcase-legends-carry-a-thin-tape",
  "weekly-winners-battlefields-finally-wake-up",
  "weekly-winners-origins-epics-catch-a-bid",
  "meta-report-the-fury-shelf-is-doing-something-odd",
  "meta-report-body-domains-quiet-consolidation",
  "meta-report-order-is-the-cheapest-domain-on-the-board",
  "hidden-gems-the-uncommons-that-are-not-bulk",
  "hidden-gems-battlefield-bulk-that-is-not-bulk",
  "hidden-gems-spirit-forgeds-overlooked-middle",
  "set-review-unleashed-at-ninety-days",
  "set-review-spirit-forged-revisited",
  "speculation-the-case-for-boring-base-art-legends",
  "speculation-what-the-letter-after-the-number-is-worth",
  "speculation-the-charizard-case-for-nine-tailed-fox",
];

// Detail pages rendered per request (force-dynamic) and cached by Vercel's CDN
// instead of ISR, so a crawl of 1,400 card pages writes nothing to the ISR
// cache. Six hours fresh, a day stale-while-revalidate; a deploy (the daily
// price snapshot) starts a fresh CDN cache anyway. See DECISIONS.md, "Detail
// pages leave ISR for the CDN". Every page listed must read no cookie, header
// or session (scripts/verify-cdn-pages.ts).
const CDN_PAGES = ["/card/:slug", "/champions/:slug", "/news/:slug"];
const CDN_CACHE = "public, s-maxage=21600, stale-while-revalidate=86400";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      ...RETIRED_ARTICLES.map((slug) => ({ source: `/news/${slug}`, destination: "/news", permanent: true })),
    ];
  },
  eslint: {
    // Lint is a separate `npm run lint` step; a style nit shouldn't fail a deploy.
    ignoreDuringBuilds: true,
  },
  images: {
    // next/image is not used today (card art is a plain <img>, see
    // components/CardImage.tsx); if it ever is, cache optimised images a month.
    minimumCacheTTL: 2678400,
  },
  async headers() {
    return [
      ...CDN_PAGES.map((source) => ({
        source,
        headers: [{ key: "Vercel-CDN-Cache-Control", value: CDN_CACHE }],
      })),
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
