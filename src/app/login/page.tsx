import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Log In",
  description: `Sign-in for ${SITE_NAME}. Accounts are not implemented in this build — the form is shown disabled and no credentials are accepted or stored.`,
  alternates: { canonical: `${SITE_URL}/login` },
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md py-6">
      <header className="mb-4 text-center">
        <p className="eyebrow">{SITE_NAME}</p>
        <h1 className="mt-1 font-display text-3xl uppercase tracking-wide text-ink">Log In</h1>
      </header>

      {/* Disabled, not decorative. A form that looked live would be collecting a
          password people reuse, with nothing on the other end to receive it. */}
      <div className="panel mb-4 border-l-4 border-l-down p-4">
        <h2 className="font-display text-[15px] uppercase tracking-wide text-ink">Accounts aren&apos;t implemented</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
          This build has{" "}
          <strong className="font-semibold text-ink">no authentication backend, no user database and no sessions</strong>.
          The form below is disabled on purpose: there is nowhere for a password to go, and a working-looking login that
          silently discards credentials would be worse than no login at all. Nothing you could type here would be sent,
          stored or checked.
        </p>
      </div>

      <form aria-describedby="login-disabled" className="panel p-5">
        <fieldset disabled className="space-y-3 opacity-60">
          <legend className="sr-only">Sign in</legend>

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
              placeholder="••••••••"
              className="h-10 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-ink-dim"
            />
          </label>

          <button
            type="submit"
            className="h-10 w-full cursor-not-allowed rounded-md bg-accent text-[13px] font-semibold text-accent-ink"
          >
            Log In
          </button>
        </fieldset>

        <p id="login-disabled" className="mt-3 border-t border-line pt-3 text-[12px] leading-relaxed text-ink-dim">
          Disabled — no account system exists in this build.
        </p>
      </form>

      <p className="mt-4 text-center text-[13px] text-ink-muted">
        The whole site works without an account:{" "}
        <Link href="/browse" className="text-accent hover:underline">
          browse every card
        </Link>
        ,{" "}
        <Link href="/analytics" className="text-accent hover:underline">
          read the market index
        </Link>{" "}
        or see{" "}
        <Link href="/premium" className="text-accent hover:underline">
          what Premium would add
        </Link>
        .
      </p>
      <p className="mt-2 text-center text-[12px] text-ink-dim">
        Curious what a sign-up would collect?{" "}
        <Link href="/signup" className="text-accent hover:underline">
          Sign Up
        </Link>{" "}
        ·{" "}
        <Link href="/privacy" className="text-accent hover:underline">
          Privacy
        </Link>
      </p>
    </div>
  );
}
