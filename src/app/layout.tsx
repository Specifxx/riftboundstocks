import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Cinzel } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { DomainHeat } from "@/components/DomainHeat";
import { SideRail } from "@/components/SideRail";
import { Footer } from "@/components/Footer";
import { PrefsProvider } from "@/components/Prefs";
import { CookieNotice } from "@/components/CookieNotice";
import { THEME_STORAGE_KEY } from "@/lib/currency";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";
import { IMPACT_SITE_VERIFICATION } from "@/lib/affiliate";

// Body/UI: a clean humanist sans, for readability. Section titles: Cinzel, an
// angular heroic display serif — the "illuminated ledger" voice the identity
// is built around. Prices and movers are monospaced so digits align down a
// table.
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const cinzel = Cinzel({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Riftbound TCG Card Prices & Market Movers`,
    template: `%s — ${SITE_NAME}`,
  },
  description:
    "Track Riftbound: League of Legends TCG card prices. Daily market movers, price history charts, set indexes and market analysis for every card across Origins, Proving Grounds, Spirit Forged and Unleashed.",
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: "Daily price movers, history charts and market analysis for every Riftbound TCG card.",
    url: SITE_URL,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  // Impact needs a verification token in <head> to confirm this domain belongs
  // to the partner account before TCGplayer commissions pay out. Omitted
  // entirely until the token is configured — an empty meta tag verifies nothing
  // and just looks like a bug.
  ...(IMPACT_SITE_VERIFICATION ? { other: { "impact-site-verification": IMPACT_SITE_VERIFICATION } } : {}),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f0e3" },
    { media: "(prefers-color-scheme: dark)", color: "#14111a" },
  ],
  width: "device-width",
  initialScale: 1,
};

// Applies the saved theme before first paint. Without it a dark-mode visitor
// gets a flash of the light palette on every navigation that isn't client-side.
// Reads one key and sets one attribute — deliberately tiny, because it blocks
// rendering. Falls back to light ("Arcane Parchment", the design's home state)
// on any error.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="dark")document.documentElement.dataset.theme="dark"}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${cinzel.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen">
        <PrefsProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-accent-ink"
          >
            Skip to content
          </a>
          <Navbar />
          <DomainHeat />
          <div className="mx-auto flex max-w-[1400px]">
            <SideRail />
            <main id="main" className="min-w-0 flex-1 px-3 py-6 sm:px-5">
              {children}
            </main>
          </div>
          <Footer />
          <CookieNotice />
        </PrefsProvider>
      </body>
    </html>
  );
}
