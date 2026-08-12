"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Hit {
  id: string;
  name: string;
  setName: string;
  collectorLabel: string;
}

const CONDITIONS = ["NM", "LP", "MP", "HP", "DMG"] as const;

/** Add-to-portfolio form: search a card, then log condition/foil/qty/cost paid. */
export function AddHoldingForm({ initial }: { initial?: { id: string; name: string; setName: string; collectorLabel: string } }) {
  const router = useRouter();
  const [picked, setPicked] = useState<Hit | null>(initial ? { ...initial } : null);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [condition, setCondition] = useState<(typeof CONDITIONS)[number]>("NM");
  const [isFoil, setIsFoil] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [paid, setPaid] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
        if (res.ok) {
          const data = await res.json();
          setHits(data.results ?? []);
          setOpen(true);
        }
      } catch {
        /* transient — the user can just keep typing */
      }
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!picked) {
      setError("Search for a card first.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const costBasisCents = paid.trim() ? Math.round(parseFloat(paid) * 100) : null;
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: picked.id, condition, isFoil, quantity, costBasisCents }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't save that.");
        setSaving(false);
        return;
      }
      setPicked(null);
      setQ("");
      setPaid("");
      setQuantity(1);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="panel space-y-3 p-4">
      <h2 className="eyebrow">Add a card</h2>

      {picked ? (
        <div className="flex items-center justify-between rounded-md border border-line bg-surface-2 px-3 py-2">
          <span className="text-[13px] text-ink">
            {picked.name} <span className="text-ink-dim">— {picked.setName} {picked.collectorLabel}</span>
          </span>
          <button type="button" onClick={() => setPicked(null)} className="text-[11px] font-semibold text-accent hover:underline">
            Change
          </button>
        </div>
      ) : (
        <div ref={wrapRef} className="relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => hits.length > 0 && setOpen(true)}
            placeholder="Search a card by name…"
            className="h-10 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-ink-dim"
          />
          {open && hits.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-line bg-surface-1 shadow-lg">
              {hits.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setPicked(h);
                      setOpen(false);
                    }}
                    className="block w-full px-3 py-2 text-left text-[13px] text-ink hover:bg-surface-2"
                  >
                    {h.name} <span className="text-ink-dim">— {h.setName} {h.collectorLabel}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-ink-muted">Condition</span>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as (typeof CONDITIONS)[number])}
            className="h-9 w-full rounded-md border border-line bg-surface-2 px-2 text-[13px] text-ink"
          >
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-end gap-1.5 pb-1.5">
          <input type="checkbox" checked={isFoil} onChange={(e) => setIsFoil(e.target.checked)} className="h-4 w-4" />
          <span className="text-[13px] text-ink-muted">Foil</span>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-ink-muted">Quantity</span>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="h-9 w-full rounded-md border border-line bg-surface-2 px-2 text-[13px] text-ink"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-ink-muted">Paid per copy (USD)</span>
          <input
            type="number"
            step="0.01"
            min={0}
            value={paid}
            onChange={(e) => setPaid(e.target.value)}
            placeholder="optional"
            className="h-9 w-full rounded-md border border-line bg-surface-2 px-2 text-[13px] text-ink placeholder:text-ink-dim"
          />
        </label>
      </div>

      {error && <p className="text-[12px] font-medium text-down">{error}</p>}

      <button type="submit" disabled={saving || !picked} className="h-9 rounded-md bg-accent px-4 text-[13px] font-semibold text-accent-ink disabled:opacity-60">
        {saving ? "Saving…" : "Add to portfolio"}
      </button>
    </form>
  );
}
