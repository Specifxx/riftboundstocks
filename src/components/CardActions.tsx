"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * Alert / Watch / Inventory / Share.
 *
 * Share genuinely works. The other three need an account and a database, which
 * this MVP has neither of, so they link to sign-up rather than pretending to
 * save something — a button that silently does nothing is worse than one that
 * says what it needs.
 *
 * TODO: wire Alert/Watch/Inventory to the user tables once auth exists
 * (TCGEmpire's PriceAlert + CollectionCard models are the shape to copy).
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
        <Link key={label} href="/signup" title={`${hint} — needs an account`} className={base}>
          {label}
        </Link>
      ))}
      <button type="button" onClick={share} className={base}>
        {copied ? "Copied" : "Share"}
      </button>
    </div>
  );
}
