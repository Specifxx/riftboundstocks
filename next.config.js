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
  async headers() {
    return [
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
