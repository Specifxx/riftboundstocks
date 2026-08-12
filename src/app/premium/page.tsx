import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Premium",
  description: `What a ${SITE_NAME} Premium tier would offer — price alerts, portfolio tracking, full history export and an ad-free site. Premium is not purchasable in this demo build.`,
  alternates: { canonical: `${SITE_URL}/premium` },
};

const FEATURES = [
  {
    title: "Price alerts",
    body: "Set a target on any printing and get an email when the market price crosses it. Alerts on the foil and non-foil series independently, because they rarely move together.",
  },
  {
    title: "Portfolio tracking",
    body: "Log what you own with the price you paid, and see cost basis against current market across the whole collection. Sorted by unrealised gain, by set, or by what has moved this week.",
  },
  {
    title: "Full history export",
    body: "Every daily snapshot for every printing as CSV or JSON — the same series the charts draw, without the 400-day window the site renders.",
  },
  {
    title: "No ads",
    body: "There are no ads on this site today and no analytics either. Premium is the commitment that the free tier stays that way rather than being backfilled with them later.",
  },
];

const TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "always",
    lines: ["Every card page and chart", "Daily movers and set indexes", "400-day price history", "No account required"],
    highlight: false,
  },
  {
    name: "Premium",
    price: "$4",
    period: "per month, indicative",
    lines: ["Everything in Free", "Unlimited price alerts", "Portfolio with cost basis", "Full history export"],
    highlight: true,
  },
];

export default function PremiumPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-5 text-center">
        <p className="eyebrow">{SITE_NAME}</p>
        <h1 className="mt-1 font-display text-3xl uppercase tracking-wide text-ink sm:text-4xl">Premium</h1>
        <p className="mx-auto mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-muted">
          The tools that turn a price tracker into something you check on purpose: alerts when a card hits your number,
          a portfolio that knows what you paid, and the raw series behind every chart.
        </p>
      </header>

      {/* The honest bit, above the sales pitch rather than buried under it. */}
      <div className="panel mb-5 border-l-4 border-l-down p-4">
        <h2 className="font-display text-[15px] uppercase tracking-wide text-ink">
          Premium is not purchasable in this build
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
          There is <strong className="font-semibold text-ink">no payment processing, no billing and no subscription</strong>{" "}
          behind this page, and no accounts system to attach one to. Nothing here can be bought, and the price shown
          below is an illustration of what a tier like this might cost — not an offer. This page describes a feature set,
          which is all it does.
        </p>
      </div>

      <section className="mb-5 grid gap-4 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.title} className="panel p-4">
            <h2 className="font-display text-[17px] uppercase tracking-wide text-ink">{f.title}</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{f.body}</p>
          </div>
        ))}
      </section>

      <section className="mb-5 grid gap-4 sm:grid-cols-2">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={`panel flex flex-col p-5 ${t.highlight ? "border-accent" : ""}`}
          >
            <h2 className="font-display text-xl uppercase tracking-wide text-ink">{t.name}</h2>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="num text-3xl font-bold text-ink">{t.price}</span>
              <span className="text-[12px] text-ink-dim">{t.period}</span>
            </p>
            <ul className="mt-3 flex-1 space-y-1.5 border-t border-line pt-3">
              {t.lines.map((line) => (
                <li key={line} className="flex gap-2 text-[13px] text-ink-muted">
                  <span aria-hidden className="text-accent">
                    ✓
                  </span>
                  {line}
                </li>
              ))}
            </ul>
            {t.highlight ? (
              <Link
                href="/signup"
                className="mt-4 block rounded-md bg-accent px-3 py-2 text-center text-[13px] font-semibold text-accent-ink hover:opacity-90"
              >
                Create an account
              </Link>
            ) : (
              <Link
                href="/browse"
                className="mt-4 block rounded-md border border-line bg-surface-2 px-3 py-2 text-center text-[13px] font-semibold text-ink-muted hover:border-line-strong hover:text-ink"
              >
                Browse the catalogue
              </Link>
            )}
          </div>
        ))}
      </section>

      <p className="text-center text-[12px] leading-relaxed text-ink-dim">
        The sign-up form is also inert in this build — see{" "}
        <Link href="/signup" className="text-accent hover:underline">
          /signup
        </Link>{" "}
        for what it does and does not do, and{" "}
        <Link href="/privacy" className="text-accent hover:underline">
          Privacy
        </Link>{" "}
        for what this site stores about you (very little).
      </p>
    </div>
  );
}
