import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";
import { enabledProviders } from "@/lib/oauth";
import { ACCOUNTS_ENABLED, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sign Up",
  description: `Create a free ${SITE_NAME} account.`,
  alternates: { canonical: `${SITE_URL}/signup` },
  robots: { index: false, follow: true },
};

function safe(next?: string): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/profile";
}

export default async function SignupPage({ searchParams }: { searchParams: { next?: string } }) {
  const user = ACCOUNTS_ENABLED ? await getCurrentUser() : null;
  if (user) redirect(safe(searchParams.next));

  return (
    <div className="mx-auto max-w-md py-6">
      <header className="mb-4 text-center">
        <p className="eyebrow">{SITE_NAME}</p>
      </header>

      {ACCOUNTS_ENABLED ? <AuthForm mode="signup" providers={enabledProviders()} /> : <DisabledNotice />}

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
    </div>
  );
}

// This deployment has no DATABASE_URL configured — same treatment as an
// unconfigured OAuth provider or the demo-price disclaimer.
function DisabledNotice() {
  return (
    <>
      <div className="panel mb-4 border-l-4 border-l-down p-4">
        <h2 className="font-display text-[15px] uppercase tracking-wide text-ink">Accounts aren&apos;t configured</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
          This deployment has <strong className="font-semibold text-ink">no database configured</strong>, so there is
          nowhere to store an account. The form below is disabled on purpose — nothing typed here is sent, stored or
          emailed. See <code className="font-mono text-[12px] text-ink">DEPLOYMENT.md</code> to enable it.
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
          If you came from{" "}
          <Link href="/premium" className="text-accent hover:underline">
            Premium
          </Link>
          : that tier isn&apos;t purchasable regardless — there is no billing behind this site yet.
        </p>
      </div>
      <form aria-describedby="signup-disabled" className="panel p-5">
        <fieldset disabled className="space-y-3 opacity-60">
          <legend className="sr-only">Create an account</legend>
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
              placeholder="At least 8 characters"
              className="h-10 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-ink-dim"
            />
          </label>
          <button type="submit" className="h-10 w-full cursor-not-allowed rounded-md bg-accent text-[13px] font-semibold text-accent-ink">
            Create Account
          </button>
        </fieldset>
        <p id="signup-disabled" className="mt-3 border-t border-line pt-3 text-[12px] leading-relaxed text-ink-dim">
          Disabled — no database is configured on this deployment.
        </p>
      </form>
    </>
  );
}
