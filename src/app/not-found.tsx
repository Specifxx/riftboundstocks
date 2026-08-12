import type { Metadata } from "next";
import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Page not found",
  description: `That page doesn't exist on ${SITE_NAME}. Search the Riftbound catalogue by card name, or jump to the sets, movers and news indexes.`,
  robots: { index: false, follow: true },
};

const DESTINATIONS = [
  { href: "/sets", title: "Sets", body: "Origins, Proving Grounds, Spirit Forged and Unleashed — card counts and set values." },
  { href: "/interests", title: "Biggest Movers", body: "What gained and what bled today, ranked by percentage." },
  { href: "/news", title: "News & Articles", body: "Weekly winners, meta reports and hidden gems." },
];

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl py-10 text-center">
      <p className="num font-display text-6xl font-bold text-accent sm:text-7xl">404</p>
      <h1 className="mt-2 font-display text-2xl uppercase tracking-wide text-ink sm:text-3xl">Page not found</h1>
      <p className="mx-auto mt-2 max-w-lg text-[14px] leading-relaxed text-ink-muted">
        No page lives at that address. If you were after a card, the fastest way there is its name — the catalogue holds
        every printing across all four sets.
      </p>

      <div className="mx-auto mt-5 max-w-sm text-left">
        <p className="eyebrow mb-1.5 text-center">Search cards</p>
        <SearchBox />
        <p className="mt-1.5 text-center text-[11px] text-ink-dim">
          Punctuation is ignored — &quot;kaisa&quot; finds Kai&apos;Sa. Press{" "}
          <kbd className="rounded border border-line bg-surface-3 px-1 py-0.5 font-mono text-[10px]">/</kbd> anywhere on
          the site to jump to search.
        </p>
      </div>

      <ul className="mt-6 grid gap-3 text-left sm:grid-cols-3">
        {DESTINATIONS.map((d) => (
          <li key={d.href}>
            <Link href={d.href} className="panel block h-full p-3.5 transition-colors hover:border-line-strong">
              <h2 className="font-display text-[15px] uppercase tracking-wide text-ink">{d.title}</h2>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">{d.body}</p>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-[13px] text-ink-muted">
        Or start from{" "}
        <Link href="/" className="text-accent hover:underline">
          the front page
        </Link>{" "}
        ·{" "}
        <Link href="/browse" className="text-accent hover:underline">
          browse with filters
        </Link>{" "}
        ·{" "}
        <Link href="/analytics" className="text-accent hover:underline">
          market analytics
        </Link>
      </p>
    </div>
  );
}
