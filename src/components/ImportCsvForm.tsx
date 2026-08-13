"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface ImportResult {
  imported: number;
  skipped: number;
  errors?: { line: number; raw: string; reason: string }[];
  error?: string;
}

export function ImportCsvForm({ eligible }: { eligible: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function submit() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setPending(true);
    setResult(null);
    try {
      const text = await file.text();
      const res = await fetch("/api/portfolio/import", { method: "POST", headers: { "Content-Type": "text/csv" }, body: text });
      const data: ImportResult = await res.json();
      setResult(data);
      if (res.ok && data.imported > 0) router.refresh();
    } catch {
      setResult({ imported: 0, skipped: 0, error: "Import failed — try again." });
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-line px-3 py-1.5 text-[12.5px] font-semibold text-ink-muted hover:border-line-strong hover:text-ink"
      >
        Import CSV
      </button>
    );
  }

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between">
        <h2 className="eyebrow">Import CSV</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-[11.5px] font-semibold text-ink-dim hover:text-ink">
          Close
        </button>
      </div>
      {!eligible ? (
        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
          CSV import needs a Plus, Pro or Store plan — see <a href="/premium" className="text-accent hover:underline">Premium</a>.
        </p>
      ) : (
        <>
          <p className="mt-1.5 text-[12px] leading-relaxed text-ink-dim">
            Header row with <code className="font-mono text-ink">slug</code> (or{" "}
            <code className="font-mono text-ink">cardId</code>), then optionally{" "}
            <code className="font-mono text-ink">quantity</code>, <code className="font-mono text-ink">condition</code>,{" "}
            <code className="font-mono text-ink">foil</code>, <code className="font-mono text-ink">costBasis</code> (dollars).
            Re-importing corrects existing rows rather than duplicating them.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="text-[12px] text-ink-muted" />
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="rounded-md bg-accent px-3 py-1.5 text-[12.5px] font-semibold text-accent-ink disabled:opacity-60"
            >
              {pending ? "Importing…" : "Import"}
            </button>
          </div>
          {result && (
            <div className="mt-2.5 rounded-lg border border-line bg-surface-2 p-2.5 text-[12px]">
              {result.error ? (
                <p className="text-down">{result.error}</p>
              ) : (
                <>
                  <p className="text-ink">
                    Imported <strong>{result.imported}</strong>, skipped <strong>{result.skipped}</strong>.
                  </p>
                  {result.errors && result.errors.length > 0 && (
                    <ul className="mt-1.5 max-h-32 space-y-0.5 overflow-y-auto text-[11px] text-ink-dim">
                      {result.errors.map((e, i) => (
                        <li key={i}>
                          Line {e.line}: {e.reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
