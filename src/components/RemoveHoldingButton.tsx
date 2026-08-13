"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RemoveHoldingButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function remove() {
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch("/api/portfolio", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button type="button" onClick={remove} disabled={pending} className="text-[11px] font-semibold text-ink-dim hover:text-down disabled:opacity-60">
      Remove
    </button>
  );
}
