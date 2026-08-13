import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cardById } from "@/lib/catalog";
import { latestQuote, primaryPrice } from "@/lib/prices";
import { ACCOUNTS_ENABLED, SITE_NAME, SITE_URL } from "@/lib/site";
import { DELIVERY_CHANNELS } from "@/lib/alerts/delivery";
import { AlertRow, type AlertRowData } from "@/components/AlertRow";

export const metadata: Metadata = {
  title: "Price Alerts",
  description: `Manage your ${SITE_NAME} price alerts — get notified when a watched card drops, rises, or crosses a target price.`,
  alternates: { canonical: `${SITE_URL}/alerts` },
  robots: { index: false, follow: true },
};

export default async function AlertsPage() {
  const user = ACCOUNTS_ENABLED ? await getCurrentUser() : null;

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <p className="eyebrow">{SITE_NAME}</p>
        <h1 className="mt-1 font-display text-3xl uppercase tracking-wide text-ink">Price Alerts</h1>
        <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
          Watch a card from its page and get emailed when the price drops — or set a target and get notified when it
          crosses. Sign in to get started — it&apos;s free.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Link href="/signup" className="rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-accent-ink">
            Sign Up
          </Link>
          <Link href="/login" className="rounded-md border border-line px-4 py-2 text-[13px] font-semibold text-ink hover:border-line-strong">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  const alerts = await prisma.priceAlert.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });

  const rows: AlertRowData[] = alerts
    .map((a): AlertRowData | null => {
      const card = cardById(a.cardId);
      if (!card) return null;
      return {
        cardId: a.cardId,
        slug: card.slug,
        name: card.name,
        setName: card.setName,
        collectorLabel: card.collectorLabel,
        currentCents: primaryPrice(latestQuote(card)),
        lastPriceCents: a.lastPriceCents,
        targetCents: a.targetCents,
        direction: (a.direction as "below" | "above") ?? "below",
      };
    })
    .filter((r): r is AlertRowData => r != null);

  return (
    <div>
      <header className="mb-4 border-b border-line pb-4">
        <p className="eyebrow">{SITE_NAME}</p>
        <h1 className="mt-1 font-display text-3xl uppercase tracking-wide text-ink">Price Alerts</h1>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-ink-muted">
          Every card you&apos;re watching. Leave the target blank for &quot;notify on any drop&quot;, or set a price
          and direction to be notified only when it crosses. Checked daily against the same real prices every other
          page shows.
        </p>
      </header>

      <section className="panel p-4">
        <h2 className="eyebrow mb-3">Watching ({rows.length})</h2>
        {rows.length === 0 ? (
          <p className="text-[13px] text-ink-dim">
            Nothing watched yet — find a card and hit{" "}
            <Link href="/search" className="text-accent hover:underline">
              Watch
            </Link>{" "}
            on its page.
          </p>
        ) : (
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[520px] text-[13px]">
              <thead>
                <tr className="border-b border-line text-left text-ink-dim">
                  <th className="py-2 font-medium">Card</th>
                  <th className="py-2 text-right font-medium">Current</th>
                  <th className="py-2 text-right font-medium">Alert when</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <AlertRow key={r.cardId} data={r} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel mt-4 p-4">
        <h2 className="eyebrow mb-2">Delivery</h2>
        <ul className="space-y-1">
          {DELIVERY_CHANNELS.map((c) => (
            <li key={c.id} className="flex items-center justify-between text-[12.5px]">
              <span className="text-ink-muted">{c.label}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  c.configured ? "bg-up/15 text-up" : "border border-line text-ink-dim"
                }`}
              >
                {c.configured ? "Active" : "Not connected"}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-ink-dim">
          Email sends to your account address. SMS, Telegram and webhook delivery are scaffolded but need
          configuration — see <code className="font-mono">src/lib/alerts/delivery.ts</code>.
        </p>
      </section>
    </div>
  );
}
