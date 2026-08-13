import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { ACCOUNTS_ENABLED, SITE_NAME, SITE_URL } from "@/lib/site";
import { PLAN_TIERS, PLANS, BILLING_CONFIGURED, planLimits } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Premium",
  description: `Compare ${SITE_NAME} plans — alerts, watchlist size, history depth, CSV import and public API access.`,
  alternates: { canonical: `${SITE_URL}/premium` },
};

function limitLabel(n: number | null, unit: string): string {
  return n == null ? `Unlimited ${unit}` : `${n} ${unit}`;
}

export default async function PremiumPage() {
  const user = ACCOUNTS_ENABLED ? await getCurrentUser() : null;
  // planTier isn't on SessionUser (kept minimal — see lib/auth.ts), so a
  // signed-in visitor's current tier is looked up separately rather than
  // growing the session payload for a value only this page needs.
  const currentTier = user
    ? await import("@/lib/db").then(({ prisma }) =>
        prisma.user.findUnique({ where: { id: user.id }, select: { planTier: true } }).then((r) => r?.planTier ?? "FREE"),
      )
    : null;

  return (
    <div>
      <header className="mb-6 border-b border-line pb-4">
        <p className="eyebrow text-accent">{SITE_NAME} Premium</p>
        <h1 className="mt-1 font-display text-3xl uppercase tracking-wide text-ink sm:text-4xl">Plans</h1>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-ink-muted">
          Free covers real price tracking with no catch. Paid tiers add depth — more alerts, a bigger watchlist, CSV
          import and, on Pro and Store, a read-only API for your own tools.
        </p>
      </header>

      {!BILLING_CONFIGURED && (
        <div className="mb-6 rounded-xl border border-down/40 bg-down/10 p-4">
          <p className="text-[13px] leading-relaxed text-ink-muted">
            <strong className="font-semibold text-down">Billing isn&apos;t connected yet.</strong> Every tier below is
            real — the limits it lists are enforced today — but there is no payment flow to move a Free account onto
            it. <code className="font-mono text-[12px] text-ink">TODO(config)</code>: wire a payment processor; see the
            comment at the top of <code className="font-mono text-[12px] text-ink">src/lib/plans.ts</code>.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLAN_TIERS.map((tier) => {
          const p = PLANS[tier];
          const isCurrent = currentTier === tier;
          return (
            <div key={tier} className={`panel flex flex-col p-4 ${isCurrent ? "border-accent" : ""}`}>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg uppercase tracking-wide text-ink">{p.label}</h2>
                {isCurrent && (
                  <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                    Current
                  </span>
                )}
              </div>
              <p className="num mt-1 text-2xl font-bold text-ink">
                {p.priceUsdMonthly == null ? (
                  <span className="text-[17px]">Contact us</span>
                ) : p.priceUsdMonthly === 0 ? (
                  "$0"
                ) : (
                  <>
                    ${p.priceUsdMonthly}
                    <span className="text-[13px] font-normal text-ink-dim">/mo</span>
                  </>
                )}
              </p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">{p.blurb}</p>
              <ul className="mt-3 flex-1 space-y-1.5 border-t border-line pt-3 text-[12.5px] text-ink-muted">
                <li>{limitLabel(p.maxAlerts, "price alerts")}</li>
                <li>{limitLabel(p.maxWatchlist, "watchlist cards")}</li>
                <li>{p.historyDays == null ? "Full price history" : `${p.historyDays}-day history`}</li>
                <li className={p.csvImport ? "" : "text-ink-dim"}>{p.csvImport ? "✓" : "—"} CSV portfolio import</li>
                <li className={p.extendedVendors ? "" : "text-ink-dim"}>{p.extendedVendors ? "✓" : "—"} Extended vendor prices</li>
                <li className={p.publicApi ? "" : "text-ink-dim"}>{p.publicApi ? "✓" : "—"} Public read-only API</li>
              </ul>
              <button
                type="button"
                disabled
                title={!BILLING_CONFIGURED ? "Billing isn't configured yet" : undefined}
                className="mt-4 rounded-md border border-line bg-surface-2 py-2 text-[12.5px] font-semibold text-ink-dim disabled:cursor-not-allowed"
              >
                {isCurrent ? "Current plan" : tier === "STORE" ? "Contact us" : "Upgrade — coming soon"}
              </button>
            </div>
          );
        })}
      </div>

      <section className="panel mt-6 p-4">
        <h2 className="eyebrow mb-2">Public API</h2>
        <p className="text-[13px] leading-relaxed text-ink-muted">
          Pro and Store include key-authenticated read access to cards, prices and movers —{" "}
          <Link href="/api-docs" className="text-accent hover:underline">
            see the API docs
          </Link>
          . Manage keys from{" "}
          <Link href="/profile" className="text-accent hover:underline">
            your profile
          </Link>{" "}
          once signed in.
        </p>
      </section>

      {!user && ACCOUNTS_ENABLED && (
        <p className="mt-6 text-center text-[13px] text-ink-muted">
          <Link href="/signup" className="text-accent hover:underline">
            Sign up
          </Link>{" "}
          — Free, no card required.
        </p>
      )}
      <p className="mt-3 text-center text-[11px] text-ink-dim">
        Limits shown are what {SITE_NAME} enforces today, not marketing figures — see{" "}
        <code className="font-mono">src/lib/plans.ts</code>.
      </p>
    </div>
  );
}
