"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Money } from "./Prefs";
import { RarityPill } from "./Bits";

interface Hit {
  slug: string;
  name: string;
  setName: string;
  setCode: string;
  collectorLabel: string;
  rarity: string;
  thumb: string;
  market: number;
}

export function SearchBox({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // "/" focuses the search box, the way every developer tool has trained people
  // to expect. Skipped while a field already has focus so typing a slash into a
  // form doesn't get swallowed.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = document.activeElement;
      const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || (el as HTMLElement)?.isContentEditable;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
    // Debounced so a fast typist fires one request, not eight.
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
        const data = (await res.json()) as { results: Hit[] };
        setHits(data.results ?? []);
        setActive(0);
        setOpen(true);
      } catch {
        setHits([]);
      }
    }, 160);
    return () => clearTimeout(id);
  }, [q]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = hits[active];
      if (hit) {
        setOpen(false);
        setQ("");
        router.push(`/card/${hit.slug}`);
      } else if (q.trim()) {
        router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      }
    }
  }

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div className="flex h-8 items-center gap-2 rounded-md border border-line bg-surface-2 px-2.5 focus-within:border-accent">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 fill-none stroke-ink-dim" strokeWidth="2.2" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => hits.length && setOpen(true)}
          onKeyDown={onKeyDown}
          type="search"
          placeholder="Search cards"
          aria-label="Search cards"
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-dim"
        />
        <kbd className="hidden shrink-0 rounded border border-line bg-surface-3 px-1.5 py-0.5 font-mono text-[10px] text-ink-dim sm:block">
          /
        </kbd>
      </div>

      {open && hits.length > 0 && (
        <div className="absolute left-0 right-0 top-10 z-50 overflow-hidden rounded-lg border border-line-strong bg-surface-1 shadow-raised">
          {hits.map((h, i) => (
            <Link
              key={h.slug}
              href={`/card/${h.slug}`}
              onClick={() => {
                setOpen(false);
                setQ("");
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex items-center gap-2.5 px-2.5 py-2 ${i === active ? "bg-surface-2" : ""}`}
            >
              <img src={h.thumb} alt="" width={28} height={39} className="h-9 w-7 shrink-0 rounded object-cover" loading="lazy" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">{h.name}</span>
                <span className="block truncate text-[11px] text-ink-dim">
                  {h.setName} · {h.collectorLabel}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <Money cents={h.market} className="num text-sm font-semibold text-ink" />
                <RarityPill rarity={h.rarity} />
              </span>
            </Link>
          ))}
          <Link
            href={`/search?q=${encodeURIComponent(q.trim())}`}
            onClick={() => setOpen(false)}
            className="block border-t border-line px-2.5 py-2 text-center text-[11px] font-semibold text-accent hover:bg-surface-2"
          >
            See all results for “{q.trim()}”
          </Link>
        </div>
      )}
    </div>
  );
}
