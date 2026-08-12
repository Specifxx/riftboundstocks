import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sign Up",
  description: `Account creation for ${SITE_NAME}. Accounts are not implemented in this build — the form is shown disabled, and no email address or password is accepted or stored.`,
  alternates: { canonical: `${SITE_URL}/signup` },
  robots: { index: false, follow: true },
};

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md py-6">
      <header className="mb-4 text-center">
        <p className="eyebrow">{SITE_NAME}</p>
        <h1 className="mt-1 font-display text-3xl uppercase tracking-wide text-ink">Create Account</h1>
      </header>

      {/* Disabled, not decorative — see the note on /login. Collecting an address
          for a mailing list that does not exist would be the dishonest option. */}
      <div className="panel mb-4 border-l-4 border-l-down p-4">
        <h2 className="font-display text-[15px] uppercase tracking-wide text-ink">Accounts aren&apos;t implemented</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
          This build has{" "}
          <strong className="font-semibold text-ink">no authentication backend, no user database and no mailing list</strong>.
          The form below is disabled on purpose. Nothing you could type here would be sent, stored or emailed, and no
          account would be created — so it is shown inert rather than pretending to succeed.
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
          If you came from{" "}
          <Link href="/premium" className="text-accent hover:underline">
            Premium
          </Link>
          : that tier isn&apos;t purchasable either. There is no billing behind this site.
        </p>
      </div>

      <form aria-describedby="signup-disabled" className="panel p-5">
        <fieldset disabled className="space-y-3 opacity-60">
          <legend className="sr-only">Create an account</legend>

          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-ink-muted">Email</span>
            <input
              type="email"
              name="email"
              autoComplete="off"
              placeholder="you@example.com"
              className="h-10 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-ink-dim"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-ink-muted">Password</span>
            <input
              type="password"
              name="password"
              autoComplete="off"
              placeholder="At least 12 characters"
              className="h-10 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-ink-dim"
            />
          </label>

          <button
            type="submit"
            className="h-10 w-full cursor-not-allowed rounded-md bg-accent text-[13px] font-semibold text-accent-ink"
          >
            Create Account
          </button>
        </fieldset>

        <p id="signup-disabled" className="mt-3 border-t border-line pt-3 text-[12px] leading-relaxed text-ink-dim">
          Disabled — no account system exists in this build.
        </p>
      </form>

      <p className="mt-4 text-center text-[13px] text-ink-muted">
        Nothing on this site is behind a login. Start with{" "}
        <Link href="/browse" className="text-accent hover:underline">
          the catalogue
        </Link>{" "}
        or{" "}
        <Link href="/analytics" className="text-accent hover:underline">
          the market index
        </Link>
        .
      </p>
      <p className="mt-2 text-center text-[12px] text-ink-dim">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Log In
        </Link>{" "}
        ·{" "}
        <Link href="/privacy" className="text-accent hover:underline">
          Privacy
        </Link>
      </p>
    </div>
  );
}
