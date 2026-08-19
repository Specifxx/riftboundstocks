import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { PLAN_TIERS } from "@/lib/plans";
import { formatDateShort } from "@/lib/format";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

// Every registered user is real account data, so this is capped rather than
// dumping an unbounded table — the stat tiles above already give the true
// total regardless of the cap.
const USER_TABLE_LIMIT = 500;

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel p-3.5">
      <dt className="text-[10px] uppercase tracking-wide text-ink-dim">{label}</dt>
      <dd className="num mt-1 text-xl font-bold text-ink">{value.toLocaleString()}</dd>
    </div>
  );
}

export default async function AdminPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login?next=/admin");
  // A 404 rather than a "Forbidden" page — a signed-in non-admin gets no
  // signal that this route exists or does anything.
  if (!isAdminEmail(me.email)) notFound();

  const [total, google, discord, withAlerts, withCollection, planCounts, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { googleId: { not: null } } }),
    prisma.user.count({ where: { discordId: { not: null } } }),
    prisma.user.count({ where: { priceAlerts: { some: {} } } }),
    prisma.user.count({ where: { collection: { some: {} } } }),
    Promise.all(PLAN_TIERS.map((tier) => prisma.user.count({ where: { planTier: tier } }))),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: USER_TABLE_LIMIT,
      select: { id: true, email: true, displayName: true, createdAt: true, planTier: true, googleId: true, discordId: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl py-6">
      <h1 className="font-display text-2xl uppercase tracking-wide text-ink">Admin</h1>
      <p className="mt-1 text-[13px] text-ink-dim">Visible only to {me.email}.</p>

      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total users" value={total} />
        <Stat label="Signed in with Google" value={google} />
        <Stat label="Signed in with Discord" value={discord} />
        <Stat label="With a price alert" value={withAlerts} />
        <Stat label="With a collection card" value={withCollection} />
        {PLAN_TIERS.map((tier, i) => (
          <Stat key={tier} label={`Plan: ${tier}`} value={planCounts[i]} />
        ))}
      </dl>

      <div className="panel mt-6 overflow-hidden">
        <h2 className="eyebrow border-b border-line px-4 py-3">
          Registered users {total > USER_TABLE_LIMIT ? `(most recent ${USER_TABLE_LIMIT} of ${total})` : `(${total})`}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-ink-dim">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Provider</th>
                <th className="px-4 py-2 font-medium">Plan</th>
                <th className="px-4 py-2 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-2 text-ink">{u.displayName}</td>
                  <td className="px-4 py-2 text-ink-muted">{u.email}</td>
                  <td className="px-4 py-2 text-ink-muted">
                    {[u.googleId && "Google", u.discordId && "Discord"].filter(Boolean).join(" + ") || "—"}
                  </td>
                  <td className="px-4 py-2 text-ink-muted">{u.planTier}</td>
                  <td className="px-4 py-2 text-ink-muted">{formatDateShort(u.createdAt)}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-ink-dim">
                    No registered users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
