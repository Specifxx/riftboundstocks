import type { Metadata } from "next";
import Link from "next/link";
import { CURRENCY_STORAGE_KEY, THEME_STORAGE_KEY } from "@/lib/currency";
import { CONTACT_EMAIL, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: `What ${SITE_NAME} stores and what it doesn't. No cookies, no analytics, no ad networks and no third-party scripts — theme and currency live in your browser's local storage.`,
  alternates: { canonical: `${SITE_URL}/privacy` },
};

// Every key this site writes. Two come from lib/currency.ts; the third is set by
// the storage notice in components/CookieNotice.tsx.
const STORAGE_KEYS: { key: string; purpose: string }[] = [
  { key: THEME_STORAGE_KEY, purpose: "Dark or light theme, so the site doesn't flash the wrong palette on the next page." },
  { key: CURRENCY_STORAGE_KEY, purpose: "Whether prices render in USD or EUR." },
  { key: "rbs.notice-seen", purpose: "That you dismissed the storage notice, so it stops appearing." },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="panel scroll-mt-20 p-5">
      <h2 className="font-display text-xl uppercase tracking-wide text-ink">{title}</h2>
      <div className="mt-2 space-y-2.5 text-[13.5px] leading-relaxed text-ink-muted">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-5">
        <h1 className="font-display text-3xl uppercase tracking-wide text-ink sm:text-4xl">Privacy</h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-muted">
          The short version: {SITE_NAME} sets no cookies, runs no analytics, loads no advertising and has no accounts.
          Two preferences are kept in your own browser. The one thing worth knowing is that card images come from someone
          else&apos;s server — details below.
        </p>
      </header>

      <div className="space-y-4">
        <Section id="cookies" title="Cookies">
          <p>
            <strong className="font-semibold text-ink">This site sets no cookies.</strong> Not for preferences, not for
            sessions, not for measurement. There is no consent banner because there is nothing to consent to — the
            notice you may have seen in the corner is a disclosure of the local storage below, and dismissing it is not
            consent to anything.
          </p>
        </Section>

        <Section id="storage" title="Local storage">
          <p>
            Three values are written to your browser&apos;s <code className="font-mono text-[12px] text-ink">localStorage</code>.
            They never leave your device — the server never receives them, and they are not identifiers.
          </p>
          <ul className="space-y-1.5 border-t border-line pt-2.5">
            {STORAGE_KEYS.map((s) => (
              <li key={s.key} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                <code className="shrink-0 font-mono text-[12px] text-accent sm:w-40">{s.key}</code>
                <span className="text-[13px]">{s.purpose}</span>
              </li>
            ))}
          </ul>
          <p className="text-[12.5px] text-ink-dim">
            Clearing site data in your browser removes all three. The site works fine without them; it just forgets your
            theme and currency.
          </p>
        </Section>

        <Section id="analytics" title="Analytics, ads and third-party scripts">
          <p>
            There are <strong className="font-semibold text-ink">none</strong>. No Google Analytics or any other
            measurement tool, no advertising network, no pixels, no tag manager, no embedded social widgets, no chat
            widget, no A/B testing script. No JavaScript from another company runs on this site.
          </p>
          <p>
            Web fonts are self-hosted: they are downloaded at build time and served from this site&apos;s own domain, so
            your browser makes no request to a font provider while you read a page.
          </p>
        </Section>

        <Section id="images" title="Card images (the one third party)">
          <p>
            Every card image on this site is <strong className="font-semibold text-ink">hot-linked</strong> from the
            RiftScribe card image CDN at <code className="font-mono text-[12px] text-ink">cdn.riftscribe.gg</code>. The
            files are not copied onto this server; your browser fetches them directly.
          </p>
          <p>
            That means <strong className="font-semibold text-ink">RiftScribe&apos;s CDN sees your IP address</strong>,
            your user agent, and which image files you requested — the same information any site you visit receives — on
            every page of this site that shows card art. We have no control over and no visibility into what that CDN
            logs or how long it keeps it.
          </p>
          <p className="text-[12.5px] text-ink-dim">
            Requests carry a <code className="font-mono text-[11.5px]">strict-origin-when-cross-origin</code> referrer
            policy, so the CDN is told which site the request came from but not which page you were reading.
          </p>
        </Section>

        <Section id="outbound" title="Outbound links">
          <p>
            &quot;Buy&quot; links on card pages point to TCGplayer search results. Following one takes you to
            TCGplayer&apos;s site, where their own privacy policy and cookies apply — nothing on this page covers what
            happens after you leave.
          </p>
          <p>
            Those links are marked <code className="font-mono text-[12px] text-ink">rel=&quot;sponsored&quot;</code>{" "}
            because the site is built to support affiliate links, but{" "}
            <strong className="font-semibold text-ink">no affiliate tag is attached in this build</strong> and no
            commission is earned. TCGplayer is not affiliated with this site.
          </p>
        </Section>

        <Section id="accounts" title="Accounts and data we hold">
          <p>
            There are no accounts. The{" "}
            <Link href="/login" className="text-accent hover:underline">
              log in
            </Link>{" "}
            and{" "}
            <Link href="/signup" className="text-accent hover:underline">
              sign up
            </Link>{" "}
            forms are disabled and accept nothing, so there is no email address, password or profile anywhere. No
            newsletter, no mailing list.
          </p>
          <p>
            Card search runs against this site&apos;s own{" "}
            <code className="font-mono text-[12px] text-ink">/api/search</code> endpoint, which reads an in-memory
            catalogue and writes nothing down. Search terms are not stored, profiled or shared. As with any website, the
            hosting provider handles the raw HTTP requests that reach it; that is outside this site&apos;s code.
          </p>
        </Section>

        <Section id="changes" title="Contact and changes">
          <p>
            Questions, corrections, or a request about anything on this page:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
          <p>
            If this site ever adds analytics, advertising or accounts, this page changes first and the corner notice is
            replaced with a real consent control that blocks those scripts until you choose. A dismissed disclosure is
            not consent and will never be treated as one.
          </p>
        </Section>
      </div>

      <p className="mt-5 text-[12px] leading-relaxed text-ink-dim">
        {SITE_NAME} is an unofficial fan project and is not affiliated with Riot Games, RiftScribe or TCGplayer. See{" "}
        <Link href="/about" className="text-accent hover:underline">
          About &amp; Disclaimers
        </Link>{" "}
        for the full attribution and data notes.
      </p>
    </div>
  );
}
