"use client";

import { useState } from "react";

/**
 * Alert / Watch / Inventory / Share.
 *
 * Share genuinely works. The other three still have no backend — accounts
 * exist now, but nothing persists a watchlist, an alert threshold or a
 * collection yet, so they're shown honestly disabled rather than linking
 * somewhere that can't fulfil them. A button that silently does nothing (or
 * worse, redirects a signed-in user in a circle) is worse than one that says
 * what it needs.
 *
 * TODO: wire these up (TCGEmpire's PriceAlert + CollectionCard models are the
 * shape to copy) — needs new Prisma models on top of the User/AuthToken pair
 * already in prisma/schema.prisma.
 */
export function CardActions({ cardName }: { cardName: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window === "undefined" ? "" : window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${cardName} — RiftboundStocks`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // User dismissed the share sheet, or the clipboard is blocked. Nothing to do.
    }
  }

  const base =
    "flex-1 rounded-md border border-line bg-surface-2 px-2 py-2 text-center text-[12px] font-semibold text-ink-muted transition-colors hover:border-line-strong hover:text-ink";

  return (
    <div className="mt-3 flex gap-1.5">
      {(
        [
          ["Alert", "Get told when this price moves"],
          ["Watch", "Add to your watchlist"],
          ["Inventory", "Track copies you own"],
        ] as const
      ).map(([label, hint]) => (
        <button
          key={label}
          type="button"
          disabled
          title={`${hint} — not built yet`}
          className={`${base} cursor-not-allowed opacity-60`}
        >
          {label}
        </button>
      ))}
      <button type="button" onClick={share} className={base}>
        {copied ? "Copied" : "Share"}
      </button>
    </div>
  );
}
