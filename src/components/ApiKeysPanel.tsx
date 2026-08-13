"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface KeyRow {
  id: string;
  label: string;
  keySuffix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

/** API key management for /profile — session-authed against /api/keys. */
export function ApiKeysPanel({ eligible }: { eligible: boolean }) {
  const [keys, setKeys] = useState<KeyRow[] | null>(null);
  const [label, setLabel] = useState("");
  const [pending, setPending] = useState(false);
  const [justCreated, setJustCreated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eligible) return;
    fetch("/api/keys", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { keys: [] }))
      .then((d: { keys?: KeyRow[] }) => setKeys(d.keys ?? []))
      .catch(() => setKeys([]));
  }, [eligible]);

  async function create() {
    if (!label.trim() || pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't create key.");
        return;
      }
      setJustCreated(data.key);
      setLabel("");
      const listRes = await fetch("/api/keys", { cache: "no-store" });
      setKeys((await listRes.json()).keys ?? []);
    } catch {
      setError("Couldn't create key — try again.");
    } finally {
      setPending(false);
    }
  }

  async function revoke(id: string) {
    setKeys((k) => k?.map((row) => (row.id === id ? { ...row, revokedAt: new Date().toISOString() } : row)) ?? k);
    await fetch("/api/keys", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }

  if (!eligible) {
    return (
      <div className="panel mt-4 p-5">
        <h2 className="eyebrow">API keys</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
          The public read-only API needs a Pro or Store plan.{" "}
          <Link href="/premium" className="text-accent hover:underline">
            Compare plans
          </Link>{" "}
          or read the{" "}
          <Link href="/api-docs" className="text-accent hover:underline">
            API docs
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="panel mt-4 p-5">
      <h2 className="eyebrow">API keys</h2>
      <p className="mt-1 text-[12px] text-ink-dim">
        See <Link href="/api-docs" className="text-accent hover:underline">API docs</Link> for endpoints and rate limits.
      </p>

      {justCreated && (
        <div className="mt-3 rounded-lg border border-accent/40 bg-accent-soft p-3">
          <p className="text-[12px] font-semibold text-ink">
            Copy this now — it won&apos;t be shown again.
          </p>
          <code className="mt-1.5 block break-all rounded bg-surface-0 p-2 font-mono text-[12px] text-ink">{justCreated}</code>
          <button
            type="button"
            onClick={() => setJustCreated(null)}
            className="mt-2 text-[11.5px] font-semibold text-ink-dim hover:text-ink"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder='Key label (e.g. "price bot")'
          maxLength={60}
          className="h-9 flex-1 rounded-md border border-line bg-surface-2 px-2.5 text-[13px] text-ink placeholder:text-ink-dim focus:border-accent"
        />
        <button
          type="button"
          onClick={create}
          disabled={pending || !label.trim()}
          className="rounded-md bg-accent px-3 text-[12.5px] font-semibold text-accent-ink disabled:opacity-60"
        >
          {pending ? "Creating…" : "New key"}
        </button>
      </div>
      {error && <p className="mt-1.5 text-[12px] text-down">{error}</p>}

      <ul className="mt-3 space-y-1.5">
        {(keys ?? []).map((k) => (
          <li key={k.id} className="flex items-center justify-between gap-2 border-t border-line pt-1.5 text-[12.5px]">
            <span className="min-w-0 flex-1">
              <span className={`font-medium ${k.revokedAt ? "text-ink-dim line-through" : "text-ink"}`}>{k.label}</span>
              <span className="ml-1.5 font-mono text-ink-dim">···{k.keySuffix}</span>
              {k.revokedAt && <span className="ml-1.5 text-[11px] text-ink-dim">revoked</span>}
            </span>
            {!k.revokedAt && (
              <button type="button" onClick={() => revoke(k.id)} className="shrink-0 text-[11.5px] font-semibold text-down hover:underline">
                Revoke
              </button>
            )}
          </li>
        ))}
        {keys?.length === 0 && <li className="text-[12.5px] text-ink-dim">No keys yet.</li>}
      </ul>
    </div>
  );
}
