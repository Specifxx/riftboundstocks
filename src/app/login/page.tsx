import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OAuthButtons } from "@/components/OAuthButtons";
import { getCurrentUser } from "@/lib/auth";
import { enabledProviders } from "@/lib/oauth";
import { ACCOUNTS_ENABLED, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Log In",
  description: `Sign in to ${SITE_NAME} with Google or Discord.`,
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

      {ACCOUNTS_ENABLED ? <OAuthButtons mode="login" providers={enabledProviders()} /> : <DisabledNotice />}

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
// missing rather than showing buttons that would fail.
function DisabledNotice() {
  return (
    <div className="panel border-l-4 border-l-down p-5">
      <h2 className="font-display text-[15px] uppercase tracking-wide text-ink">Accounts aren&apos;t configured</h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
        This deployment has <strong className="font-semibold text-ink">no database configured</strong>, so there is
        nowhere to store an account. See <code className="font-mono text-[12px] text-ink">DEPLOYMENT.md</code> to
        enable it.
      </p>
    </div>
  );
}
