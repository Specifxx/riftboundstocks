import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";
import { enabledProviders } from "@/lib/oauth";
import { ACCOUNTS_ENABLED, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Log In",
  description: `Sign in to ${SITE_NAME}.`,
  alternates: { canonical: `${SITE_URL}/login` },
  robots: { index: false, follow: true },
};

function safe(next?: string): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/profile";
}

export default async function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  const user = ACCOUNTS_ENABLED ? await getCurrentUser() : null;
  if (user) redirect(safe(searchParams.next));

  return (
    <div className="mx-auto max-w-md py-6">
      <header className="mb-4 text-center">
        <p className="eyebrow">{SITE_NAME}</p>
      </header>

      {ACCOUNTS_ENABLED ? (
        <AuthForm mode="login" providers={enabledProviders()} />
      ) : (
        <DisabledNotice />
      )}

      <p className="mt-4 text-center text-[13px] text-ink-muted">
        The whole site works without an account:{" "}
        <Link href="/browse" className="text-accent hover:underline">
          browse every card
        </Link>{" "}
        or{" "}
        <Link href="/analytics" className="text-accent hover:underline">
          read the market index
        </Link>
        .
      </p>
    </div>
  );
}

// This deployment has no DATABASE_URL configured — same treatment as an
// unconfigured OAuth provider or the demo-price disclaimer: say plainly what's
// missing rather than showing a form with nowhere for the data to go.
function DisabledNotice() {
  return (
    <>
      <div className="panel mb-4 border-l-4 border-l-down p-4">
        <h2 className="font-display text-[15px] uppercase tracking-wide text-ink">Accounts aren&apos;t configured</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
          This deployment has <strong className="font-semibold text-ink">no database configured</strong>, so there is
          nowhere to store an account. The form below is disabled on purpose. See{" "}
          <code className="font-mono text-[12px] text-ink">DEPLOYMENT.md</code> to enable it.
        </p>
      </div>
      <form aria-describedby="login-disabled" className="panel p-5">
        <fieldset disabled className="space-y-3 opacity-60">
          <legend className="sr-only">Sign in</legend>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-ink-muted">Email</span>
            <input
              type="email"
              autoComplete="off"
              placeholder="you@example.com"
              className="h-10 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-ink-dim"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-ink-muted">Password</span>
            <input
              type="password"
              autoComplete="off"
              placeholder="••••••••"
              className="h-10 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-ink-dim"
            />
          </label>
          <button type="submit" className="h-10 w-full cursor-not-allowed rounded-md bg-accent text-[13px] font-semibold text-accent-ink">
            Log In
          </button>
        </fieldset>
        <p id="login-disabled" className="mt-3 border-t border-line pt-3 text-[12px] leading-relaxed text-ink-dim">
          Disabled — no database is configured on this deployment.
        </p>
      </form>
    </>
  );
}
