import type { Metadata } from "next";
import Link from "next/link";
import { CURRENCY_STORAGE_KEY, THEME_STORAGE_KEY } from "@/lib/currency";
import { ACCOUNTS_ENABLED, CONTACT_EMAIL, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: `What ${SITE_NAME} stores and what it doesn't. No tracking, no analytics, no ad networks and no third-party scripts — theme and currency live in your browser's local storage.`,
  alternates: { canonical: `${SITE_URL}/privacy` },
};

// Every key this site writes. Two come from lib/currency.ts; the third is set by
// the storage notice in components/CookieNotice.tsx.
const STORAGE_KEYS: { key: string; purpose: string }[] = [
  { key: THEME_STORAGE_KEY, purpose: "Dark or light theme, so the site doesn't flash the wrong palette on the next page." },
  { key: CURRENCY_STORAGE_KEY, purpose: "Whether prices render in USD or EUR." },
  { key: "rl.notice-seen", purpose: "That you dismissed the storage notice, so it stops appearing." },
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
          The short version: {SITE_NAME} runs no analytics and loads no advertising.{" "}
          {ACCOUNTS_ENABLED
            ? "Two preferences are kept in your own browser, and the only cookie this site sets is the one that keeps you signed in if you create an account."
            : "Two preferences are kept in your own browser, and this deployment has no accounts system configured, so it sets no cookies at all."}{" "}
          The one thing worth knowing either way is that card images come from someone else&apos;s server — details
          below.
        </p>
      </header>

      <div className="space-y-4">
        <Section id="cookies" title="Cookies">
          {ACCOUNTS_ENABLED ? (
            <>
              <p>
                <strong className="font-semibold text-ink">One cookie, and only if you create an account.</strong>{" "}
                Signing in sets a single session cookie (<code className="font-mono text-[12px] text-ink">rl_session</code>)
                so the site remembers you&apos;re signed in. It is <code className="font-mono text-[12px] text-ink">httpOnly</code>{" "}
                (invisible to page JavaScript), holds nothing but your account id, and is never used for tracking,
                analytics or advertising. Nothing is set for anyone who doesn&apos;t sign in.
              </p>
              <p>
                There is no consent banner because there is nothing to consent to <em>for tracking</em> — the notice you
                may have seen in the corner discloses the local storage below plus this one functional cookie, and
                dismissing it is not consent to anything.
              </p>
            </>
          ) : (
            <p>
              <strong className="font-semibold text-ink">This site sets no cookies.</strong> Not for preferences, not
              for sessions, not for measurement. There is no consent banner because there is nothing to consent to —
              the notice you may have seen in the corner is a disclosure of the local storage below, and dismissing it
              is not consent to anything.
            </p>
          )}
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
            Those links are <strong className="font-semibold text-ink">affiliate links</strong>, marked{" "}
            <code className="font-mono text-[12px] text-ink">rel=&quot;sponsored&quot;</code> and labelled on screen. They
            route through Impact, TCGplayer&apos;s affiliate network, which redirects you to TCGplayer and records the
            click so any resulting purchase can be credited to this site. Impact sees the click and applies its own
            cookies at that point; neither this site nor Impact receives anything about you from us beyond the fact that
            a link on a particular page was followed. We earn a commission on qualifying purchases at no extra cost to
            you.
          </p>
          <p>
            The site also links to <strong className="font-semibold text-ink">RiftCompare</strong>, a sister site run by
            the same people. Those links are not affiliate links and earn nothing; they carry a{" "}
            <code className="font-mono text-[12px] text-ink">ref</code> parameter purely so RiftCompare can see how many
            visitors arrived from here. TCGplayer and Impact are not affiliated with this site.
          </p>
        </Section>

        <Section id="accounts" title="Accounts and data we hold">
          {ACCOUNTS_ENABLED ? (
            <>
              <p>
                Accounts are <strong className="font-semibold text-ink">Google or Discord sign-in only</strong> —
                there is no password to set or store. That provider authenticates you and hands us only your{" "}
                <strong className="font-semibold text-ink">email address</strong>,{" "}
                <strong className="font-semibold text-ink">display name</strong> and{" "}
                <strong className="font-semibold text-ink">avatar image</strong> (whatever their consent screen told
                you it would share), which we store against your account. We don&apos;t receive your Google or
                Discord password, contacts, or anything beyond that basic profile. Nothing else is collected: no
                address, no payment details, no phone number.
              </p>
              <p>
                Staying signed in uses the single functional cookie described above — see{" "}
                <Link href="#cookies" className="text-accent hover:underline">
                  Cookies
                </Link>
                .
              </p>
              <p className="text-[12.5px] text-ink-dim">
                Want your account and its data deleted? Email{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
                  {CONTACT_EMAIL}
                </a>{" "}
                from the address on the account and we&apos;ll remove it — there&apos;s no self-serve delete button yet.
              </p>
            </>
          ) : (
            <p>
              This deployment has no database configured, so accounts are switched off entirely — the{" "}
              <Link href="/login" className="text-accent hover:underline">
                log in
              </Link>{" "}
              and{" "}
              <Link href="/signup" className="text-accent hover:underline">
                sign up
              </Link>{" "}
              pages just say so, with no sign-in button to click, so there is no email address or profile stored
              anywhere. No newsletter, no mailing list.
            </p>
          )}
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
            If this site ever adds analytics or advertising, this page changes first and the corner notice is replaced
            with a real consent control that blocks those scripts until you choose. A dismissed disclosure is not
            consent and will never be treated as one.
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
