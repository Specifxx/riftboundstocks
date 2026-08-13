"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMe } from "@/lib/use-me";
import { SITE_NAME } from "@/lib/site";

// Alert/Watch collapse into one button: this app has a single PriceAlert
// model, so "watching" a card and "getting alerted" on it are the same
// state — two buttons doing the same thing would just be confusing.
//
// Fetching watch-state happens client-side (like NavUser's /api/me) rather
// than as a server prop, so the card page itself stays static/ISR
// (revalidate: 3600, generateStaticParams) instead of being forced dynamic
// per signed-in visitor.
export function CardActions({ cardId, cardName }: { cardId: string; cardName: string }) {
  const { user, loaded } = useMe();
  const [copied, setCopied] = useState(false);
  const [watching, setWatching] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!loaded || !user) return;
    let cancelled = false;
    fetch("/api/alerts", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { cardIds: [] }))
      .then((d: { cardIds?: string[] }) => {
        if (!cancelled) setWatching((d.cardIds ?? []).includes(cardId));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [loaded, user, cardId]);

  async function toggleWatch() {
    if (pending) return;
    setPending(true);
    const next = !watching;
    setWatching(next); // optimistic
    try {
      const res = await fetch("/api/alerts", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId }),
      });
      if (!res.ok) setWatching(!next); // revert on failure
    } catch {
      setWatching(!next);
    } finally {
      setPending(false);
    }
  }

  async function share() {
    const url = typeof window === "undefined" ? "" : window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${cardName} — ${SITE_NAME}`, url });
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
  const activeCls =
    "flex-1 rounded-md border border-accent bg-accent/10 px-2 py-2 text-center text-[12px] font-semibold text-accent transition-colors";

  // Signed-out (and still-loading, to avoid a flash) renders the same
  // sign-in prompt the stub always showed — NavUser makes the identical call
  // for the same reason: most visitors are anonymous, so that's the state
  // that should render without waiting on a client fetch.
  if (!loaded || !user) {
    const nextPath = typeof window === "undefined" ? "" : window.location.pathname;
    return (
      <div className="mt-3 flex gap-1.5">
        <Link href={`/login?next=${encodeURIComponent(nextPath)}`} title="Get emailed when this price drops — needs an account" className={base}>
          Watch
        </Link>
        <Link
          href={`/login?next=${encodeURIComponent(`/portfolio?add=${cardId}`)}`}
          title="Track copies you own — needs an account"
          className={base}
        >
          Inventory
        </Link>
        <button type="button" onClick={share} className={base}>
          {copied ? "Copied" : "Share"}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 flex gap-1.5">
      <button
        type="button"
        onClick={toggleWatch}
        disabled={pending}
        title={watching ? "Stop watching — no more price-drop emails for this card" : "Get emailed when this price drops"}
        className={watching ? activeCls : base}
      >
        {watching ? "Watching" : "Watch"}
      </button>
      <Link href={`/portfolio?add=${cardId}`} title="Track copies you own" className={base}>
        Inventory
      </Link>
      <button type="button" onClick={share} className={base}>
        {copied ? "Copied" : "Share"}
      </button>
    </div>
  );
}
