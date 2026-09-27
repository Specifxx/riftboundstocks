import Link from "next/link";
import { BrandLogo, BrandWordmark } from "./BrandLogo";
import { SETS } from "@/lib/riftbound";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";
import { PRICES_ARE_DEMO } from "@/lib/prices/demo-flag";
import { riftcompareUrl } from "@/lib/affiliate";

const COLUMNS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
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
      { label: "Champions", href: "/champions" },
      { label: "Domains", href: "/domains" },
      { label: "Legends", href: "/browse?type=Legend" },
      { label: "Search", href: "/search" },
    ],
  },
  {
    title: "Read",
    links: [
      { label: "News & Analysis", href: "/news" },
      { label: "Riftbound Guides", href: riftcompareUrl("/guides", "footer"), external: true },
      { label: "Ban List", href: riftcompareUrl("/guides/riftbound-banlist-explained", "footer"), external: true },
      { label: "Market Reports (RSS)", href: "/feed.xml" },
    ],
  },
  {
    title: "Site",
    links: [
      { label: "About & Disclaimers", href: "/about" },
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
                  className="inline-flex min-h-[32px] items-center rounded border border-line px-2 py-0.5 font-mono text-[10px] font-semibold text-ink-dim hover:border-line-strong hover:text-ink sm:min-h-0 sm:px-1.5"
                >
                  {s.code}
                </Link>
              ))}
            </div>

            {/* Sister site. Complementary rather than competing: this site tracks
                TCGplayer history, RiftCompare compares live store prices across
                six markets. */}
            <a
              href={riftcompareUrl("", "footer-card")}
              target="_blank"
              rel="noopener"
              className="mt-4 flex items-start gap-2.5 rounded-lg border border-line bg-surface-2 p-2.5 transition-colors hover:border-accent"
            >
              {/* The bare R (no "S") in RiftCompare's own green — same shared
                  mark as BrandLogo, minus the suffix that's specific to this
                  site, since this card represents linking to RiftCompare itself. */}
              <span
                className="mt-0.5 inline-block h-6 w-6 shrink-0"
                style={{
                  backgroundImage: "linear-gradient(in oklch, #34d17e, #1ea65c)",
                  WebkitMaskImage: "url(/logo-r.png)",
                  maskImage: "url(/logo-r.png)",
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                }}
                aria-hidden
              />
              <span className="min-w-0">
                <span className="block text-[12.5px] font-semibold text-ink">
                  RiftCompare <span className="text-ink-dim">— our sister site</span>
                </span>
                <span className="block text-[11.5px] leading-relaxed text-ink-muted">
                  Compare live Riftbound prices across stores in the US, UK, EU, Australia, Canada and Singapore.
                </span>
              </span>
            </a>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="eyebrow mb-2.5">{col.title}</h3>
              {/* On phones each link gets a 32px row so the list is tappable;
                  desktop keeps the tighter 1.5 spacing. */}
              <ul className="sm:space-y-1.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    {l.external ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex min-h-[32px] items-center text-[13px] text-ink-muted hover:text-accent sm:min-h-0"
                      >
                        {l.label} <span className="ml-1 text-ink-dim">↗</span>
                      </a>
                    ) : (
                      <Link
                        href={l.href}
                        className="inline-flex min-h-[32px] items-center text-[13px] text-ink-muted hover:text-accent sm:min-h-0"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ───────────────────────────────────────────────────────────────────
            The disclaimers. These are load-bearing, not boilerplate: this site
            uses Riot's game data and card art, publishes prices attributed to
            TCGplayer, and links to a sister site under the same ownership. Each
            of those needs saying plainly and in a place every page reaches.
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
          <p>
            <strong className="font-semibold text-ink-muted">Affiliate disclosure.</strong> {SITE_NAME} is a TCGplayer
            affiliate. Links to TCGplayer on this site are affiliate links, and we earn a commission from qualifying
            purchases made through them — at no extra cost to you. Commission never influences which prices are shown
            or how cards are ranked; the figures come from the pricing data, not from what pays.
          </p>
          {PRICES_ARE_DEMO && (
            <p>
              <strong className="font-semibold text-down">Demo prices.</strong> This build ships{" "}
              <strong className="font-semibold text-ink-muted">generated sample prices</strong>, not live market data.
              Do not make a buying or selling decision on them.
            </p>
          )}
          <p>
            <strong className="font-semibold text-ink-muted">Editorial.</strong> Market reports on this site are
            computed from the price data and re-checked against it on every build. News and guides are published by
            RiftCompare, our sister site under the same ownership, and open there. Nothing here is financial advice.
            See{" "}
            <Link href="/about" className="text-accent hover:underline">
              About &amp; Disclaimers
            </Link>
            .
          </p>
          <p className="pt-1.5">
            © {new Date().getUTCFullYear()} {SITE_NAME}, a RiftCompare site ·{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-accent">
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
