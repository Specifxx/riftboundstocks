"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Money } from "./Prefs";

export interface AlertRowData {
  cardId: string;
  slug: string;
  name: string;
  setName: string;
  collectorLabel: string;
  currentCents: number | null;
  lastPriceCents: number | null;
  targetCents: number | null;
  direction: "below" | "above";
}

/** One row of /alerts — view + edit a single card's alert threshold. */
export function AlertRow({ data }: { data: AlertRowData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [target, setTarget] = useState(data.targetCents != null ? (data.targetCents / 100).toFixed(2) : "");
  const [direction, setDirection] = useState<"below" | "above">(data.direction);
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    try {
      const cents = target.trim() === "" ? null : Math.round(parseFloat(target) * 100);
      const res = await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: data.cardId, targetCents: Number.isFinite(cents) ? cents : null, direction }),
      });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  async function unwatch() {
    setPending(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: data.cardId }),
      });
      if (res.ok) router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <tr className="border-b border-line last:border-0">
      <td className="py-2 pr-2">
        <Link href={`/card/${data.slug}`} className="font-medium text-accent hover:underline">
          {data.name}
        </Link>
        <div className="text-[11px] text-ink-dim">
          {data.setName} · {data.collectorLabel}
        </div>
      </td>
      <td className="py-2 text-right">
        <Money cents={data.currentCents} className="num text-ink" />
      </td>
      <td className="py-2">
        {editing ? (
          <div className="flex items-center justify-end gap-1.5">
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as "below" | "above")}
              className="h-8 rounded-md border border-line bg-surface-2 px-1.5 text-[12px] text-ink-muted"
            >
              <option value="below">drops to</option>
              <option value="above">rises to</option>
            </select>
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="any drop"
              inputMode="decimal"
              className="h-8 w-20 rounded-md border border-line bg-surface-2 px-2 text-[12px] text-ink"
            />
            <button type="button" onClick={save} disabled={pending} className="rounded-md bg-accent px-2 py-1 text-[11px] font-semibold text-accent-ink disabled:opacity-60">
              Save
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="block w-full text-right text-[12px] text-ink-muted hover:text-accent">
            {data.targetCents != null ? (
              <>
                {data.direction === "below" ? "≤" : "≥"} <Money cents={data.targetCents} className="num" />
              </>
            ) : (
              <span className="text-ink-dim">any drop — edit</span>
            )}
          </button>
        )}
      </td>
      <td className="py-2 pl-2 text-right">
        <button type="button" onClick={unwatch} disabled={pending} className="text-[11px] font-semibold text-ink-dim hover:text-down disabled:opacity-60">
          Unwatch
        </button>
      </td>
    </tr>
  );
}
