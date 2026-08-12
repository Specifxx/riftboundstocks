import Link from "next/link";
import { BrandLogo, BrandWordmark } from "./BrandLogo";
import { SETS } from "@/lib/riftbound";
import { CONTACT_EMAIL, PRICES_ARE_DEMO, SITE_NAME } from "@/lib/site";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Market",
    links: [
      { label: "Biggest Movers", href: "/interests" },
      { label: "Market Index", href: "/analytics" },
      { label: "Sealed", href: "/sealed" },
      { label: "Deck Archetypes", href: "/decks" },
    ],
  },
  {
    title: "Browse",
    links: [
      { label: "All Sets", href: "/sets" },
      { label: "Domains", href: "/domains" },
      { label: "Legends", href: "/browse?type=Legend" },
      { label: "Search", href: "/search" },
    ],
  },
  {
    title: "Read",
    links: [
      { label: "News & Articles", href: "/news" },
      { label: "Weekly Winners", href: "/news?category=Weekly+Winners" },
      { label: "Meta Report", href: "/news?category=Meta+Report" },
      { label: "Hidden Gems", href: "/news?category=Hidden+Gems" },
    ],
  },
  {
    title: "Site",
    links: [
      { label: "About & Disclaimers", href: "/about" },
      { label: "Premium", href: "/premium" },
      { label: "Privacy", href: "/privacy" },
      { label: "Sitemap", href: "/sitemap.xml" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-12 border-t border-line bg-surface-1">
      <div className="mx-auto max-w-[1400px] px-3 py-10 sm:px-5">
        <div className="grid gap-8 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <BrandLogo className="h-7 w-7" />
              <BrandWordmark />
            </Link>
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-ink-muted">
              Price tracking, movers and market analysis for Riftbound: League of Legends Trading Card Game.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {SETS.map((s) => (
                <Link
                  key={s.code}
                  href={`/sets/${s.slug}`}
                  className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink-dim hover:border-line-strong hover:text-ink"
                >
                  {s.code}
                </Link>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="eyebrow mb-2.5">{col.title}</h3>
              <ul className="space-y-1.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[13px] text-ink-muted hover:text-accent">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ───────────────────────────────────────────────────────────────────
            The disclaimers. These are load-bearing, not boilerplate: this site
            uses Riot's game data and card art, publishes prices attributed to
            TCGplayer, and — in this build — shows generated numbers under
            fictional bylines. Each of those needs saying plainly and in a place
            every page reaches.
            ─────────────────────────────────────────────────────────────────── */}
        <div className="mt-10 space-y-2.5 border-t border-line pt-6 text-[11.5px] leading-relaxed text-ink-dim">
          <p>
            <strong className="font-semibold text-ink-muted">Unofficial fan project.</strong> {SITE_NAME} is not
            affiliated with, endorsed, sponsored or approved by Riot Games, Inc. Riftbound, League of Legends and all
            related marks, logos and card images are the property of Riot Games. Card art is shown for identification
            and reference.
          </p>
          <p>
            <strong className="font-semibold text-ink-muted">Pricing.</strong> Prices are sourced from TCGplayer and are
            provided for reference only — they are not offers to buy or sell, and they will differ from what any
            individual seller charges. TCGplayer is not affiliated with this site.
          </p>
          {PRICES_ARE_DEMO && (
            <p>
              <strong className="font-semibold text-down">Demo content.</strong> This build ships{" "}
              <strong className="font-semibold text-ink-muted">generated sample prices</strong>, not live market data,
              and every article and author on the site is{" "}
              <strong className="font-semibold text-ink-muted">fictional demo content written to fill the templates</strong>.
              The authors are invented personas, not real people, and nothing published here is real analysis, a real
              tournament result or financial advice. See{" "}
              <Link href="/about" className="text-accent hover:underline">
                About &amp; Disclaimers
              </Link>
              .
            </p>
          )}
          <p className="pt-1.5">
            © {new Date().getUTCFullYear()} {SITE_NAME} ·{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-accent">
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
