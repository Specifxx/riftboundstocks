"use client";

import { useState } from "react";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);
  return (
    <button
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
        // Hard navigation so the server re-renders with the cleared session cookie,
        // bypassing the App Router client cache that can otherwise keep showing the
        // signed-in UI until a manual refresh.
        window.location.assign("/");
      }}
      className="rounded-md border border-line bg-surface-2 px-3 py-1.5 text-[12.5px] font-semibold text-ink-muted hover:border-line-strong hover:text-ink disabled:opacity-60"
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}

