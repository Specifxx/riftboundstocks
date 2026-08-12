"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";
import { SERIES_KEYS, SERIES_META, type PriceSnapshot, type SeriesKey } from "@/lib/prices/source";
import { convert } from "@/lib/currency";
import { formatMoney } from "@/lib/format";
import { usePrefs } from "./Prefs";

// Pure SVG + a thin pointer layer, no charting library — the same choice
// TCGEmpire's PriceChart makes, and for the same reason: five line series, a
// crosshair and a brush is less code than configuring a library to do it, and it
// ships no extra kilobytes to every card page.

const W = 900;
const H = 300;
const PAD = { l: 56, r: 14, t: 16, b: 26 };
const NAV_H = 52;
const NAV_PAD = { l: 56, r: 14, t: 6, b: 14 };

const QUICK_RANGES = [
  { key: "1M", days: 30 },
  { key: "3M", days: 91 },
  { key: "6M", days: 182 },
  { key: "1Y", days: 365 },
  { key: "ALL", days: Infinity },
] as const;

interface Props {
  points: PriceSnapshot[];
  sources: { id: string; label: string }[];
  activeSourceId: string;
}

export function PriceChart({ points, sources, activeSourceId }: Props) {
  const { currency } = usePrefs();
  const clipId = useId();

  // Foil series are hidden by default: on most cards they sit several times
  // above the non-foil lines, and leaving them on squashes the three series a
  // visitor actually came to read into the bottom fifth of the chart.
  const [visible, setVisible] = useState<Record<SeriesKey, boolean>>({
    low: true,
    mid: true,
    market: true,
    foil: false,
    foilMarket: false,
  });

  const n = points.length;
  const [range, setRange] = useState<[number, number]>([0, Math.max(0, n - 1)]);
  const [hover, setHover] = useState<number | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ mode: "left" | "right" | "move"; grabOffset: number } | null>(null);

  const [lo, hi] = range;
  const view = useMemo(() => points.slice(lo, hi + 1), [points, lo, hi]);

  const activeKeys = useMemo(
    () => SERIES_KEYS.filter((k) => visible[k] && view.some((p) => p[k] != null)),
    [visible, view],
  );

  // y-domain across every visible series in the current window.
  const { min, max } = useMemo(() => {
    let mn = Infinity;
    let mx = -Infinity;
    for (const p of view) {
      for (const k of activeKeys) {
        const v = p[k];
        if (v == null) continue;
        if (v < mn) mn = v;
        if (v > mx) mx = v;
      }
    }
    if (!isFinite(mn) || !isFinite(mx)) return { min: 0, max: 1 };
    // Breathing room so the top line isn't welded to the frame.
    const pad = Math.max(1, (mx - mn) * 0.08);
    return { min: Math.max(0, mn - pad), max: mx + pad };
  }, [view, activeKeys]);

  const span = Math.max(1, max - min);
  const m = view.length;

  const x = useCallback((i: number) => PAD.l + (m <= 1 ? 0 : (i / (m - 1)) * (W - PAD.l - PAD.r)), [m]);
  const y = useCallback((v: number) => PAD.t + (1 - (v - min) / span) * (H - PAD.t - PAD.b), [min, span]);

  const money = useCallback((cents: number) => formatMoney(convert(cents, currency), currency), [currency]);

  const linePath = useCallback(
    (key: SeriesKey) => {
      let d = "";
      let penDown = false;
      view.forEach((p, i) => {
        const v = p[key];
        if (v == null) {
          penDown = false;
          return;
        }
        d += `${penDown ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
        penDown = true;
      });
      return d;
    },
    [view, x, y],
  );

  // ── interactions ───────────────────────────────────────────────────────────

  function onPlotMove(clientX: number) {
    const el = plotRef.current;
    if (!el || m === 0) return;
    const rect = el.getBoundingClientRect();
    // The plot area is inset by PAD inside the viewBox, so undo that before
    // mapping the pointer to an index or the crosshair lags the cursor.
    const leftPx = rect.left + (PAD.l / W) * rect.width;
    const plotPx = ((W - PAD.l - PAD.r) / W) * rect.width;
    const ratio = Math.min(1, Math.max(0, (clientX - leftPx) / plotPx));
    setHover(Math.round(ratio * (m - 1)));
  }

  const navRatio = useCallback((clientX: number) => {
    const el = navRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const leftPx = rect.left + (NAV_PAD.l / W) * rect.width;
    const plotPx = ((W - NAV_PAD.l - NAV_PAD.r) / W) * rect.width;
    return Math.min(1, Math.max(0, (clientX - leftPx) / plotPx));
  }, []);

  const onNavPointerMove = useCallback(
    (clientX: number) => {
      const drag = dragRef.current;
      if (!drag || n === 0) return;
      const idx = Math.round(navRatio(clientX) * (n - 1));
      setRange(([a, b]) => {
        // Keep at least a week visible; a zero-width window has nothing to draw.
        const MIN_SPAN = Math.min(7, n - 1);
        if (drag.mode === "left") return [Math.min(idx, b - MIN_SPAN), b];
        if (drag.mode === "right") return [a, Math.max(idx, a + MIN_SPAN)];
        const width = b - a;
        const start = Math.max(0, Math.min(n - 1 - width, idx - drag.grabOffset));
        return [start, start + width];
      });
    },
    [n, navRatio],
  );

  function startDrag(e: React.PointerEvent, mode: "left" | "right" | "move") {
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const idx = Math.round(navRatio(e.clientX) * (n - 1));
    dragRef.current = { mode, grabOffset: mode === "move" ? idx - lo : 0 };
  }

  function applyQuickRange(days: number) {
    if (days === Infinity || days >= n) {
      setRange([0, n - 1]);
      return;
    }
    setRange([Math.max(0, n - 1 - days), n - 1]);
  }

  if (n < 2) {
    return <p className="text-sm text-ink-dim">Not enough price history yet for this printing.</p>;
  }

  const hp = hover != null ? view[Math.min(hover, m - 1)] : null;
  const gridVals = [min, min + span * 0.25, min + span * 0.5, min + span * 0.75, max];

  // Navigator geometry, drawn against the FULL series so the window shows where
  // the visible slice sits in the card's whole history.
  const navX = (i: number) => NAV_PAD.l + (i / (n - 1)) * (W - NAV_PAD.l - NAV_PAD.r);
  const navMarket = points.map((p) => p.market);
  const navMin = Math.min(...navMarket);
  const navMax = Math.max(...navMarket);
  const navSpan = Math.max(1, navMax - navMin);
  const navY = (v: number) => NAV_PAD.t + (1 - (v - navMin) / navSpan) * (NAV_H - NAV_PAD.t - NAV_PAD.b);
  const navLine = points.map((p, i) => `${navX(i).toFixed(1)},${navY(p.market).toFixed(1)}`).join(" ");

  const fmtDate = (day: string) =>
    new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

  return (
    <div>
      {/* Controls: series toggles + price source */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {SERIES_KEYS.map((k) => {
            const meta = SERIES_META[k];
            const has = points.some((p) => p[k] != null);
            const on = visible[k] && has;
            return (
              <button
                key={k}
                type="button"
                disabled={!has}
                onClick={() => setVisible((v) => ({ ...v, [k]: !v[k] }))}
                aria-pressed={on}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors ${
                  on ? "border-line-strong bg-surface-2 text-ink" : "border-line text-ink-dim hover:text-ink-muted"
                } ${has ? "" : "cursor-not-allowed opacity-40"}`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: on ? meta.color : "transparent", boxShadow: `inset 0 0 0 1.5px ${meta.color}` }}
                />
                {meta.label}
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-2 text-[11px] text-ink-dim">
          Source
          <select
            defaultValue={activeSourceId}
            // Only one source is wired up in this build; the control exists
            // because the adapter supports more (see lib/prices/index.ts).
            disabled={sources.length < 2}
            className="h-7 rounded-md border border-line bg-surface-2 px-2 text-[11px] font-semibold text-ink-muted disabled:opacity-70"
          >
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Main plot */}
      <div
        ref={plotRef}
        className="relative select-none"
        onMouseMove={(e) => onPlotMove(e.clientX)}
        onMouseLeave={() => setHover(null)}
        onTouchStart={(e) => onPlotMove(e.touches[0].clientX)}
        onTouchMove={(e) => onPlotMove(e.touches[0].clientX)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="h-[260px] w-full sm:h-[300px]" role="img" aria-label="Price history">
          <defs>
            <clipPath id={clipId}>
              <rect x={PAD.l} y={PAD.t} width={W - PAD.l - PAD.r} height={H - PAD.t - PAD.b} />
            </clipPath>
          </defs>

          {gridVals.map((gv, i) => (
            <g key={i}>
              <line
                x1={PAD.l}
                x2={W - PAD.r}
                y1={y(gv)}
                y2={y(gv)}
                stroke="rgb(var(--line))"
                strokeWidth="1"
              />
              <text x={PAD.l - 8} y={y(gv) + 3.5} textAnchor="end" fontSize="10" fill="rgb(var(--ink-dim))">
                {money(gv)}
              </text>
            </g>
          ))}

          <g clipPath={`url(#${clipId})`}>
            {activeKeys.map((k) => (
              <path
                key={k}
                d={linePath(k)}
                fill="none"
                stroke={SERIES_META[k].color}
                strokeWidth={k === "market" ? 2.4 : 1.6}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={k === "market" ? 1 : 0.85}
              />
            ))}
          </g>

          <text x={PAD.l} y={H - 8} textAnchor="start" fontSize="10" fill="rgb(var(--ink-dim))">
            {fmtDate(view[0].day)}
          </text>
          <text x={W - PAD.r} y={H - 8} textAnchor="end" fontSize="10" fill="rgb(var(--ink-dim))">
            {fmtDate(view[m - 1].day)}
          </text>

          {hp && hover != null && (
            <g>
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={PAD.t}
                y2={H - PAD.b}
                stroke="rgb(var(--accent))"
                strokeOpacity="0.5"
                strokeDasharray="3 3"
              />
              {activeKeys.map((k) => {
                const v = hp[k];
                return v == null ? null : (
                  <circle key={k} cx={x(hover)} cy={y(v)} r="3.5" fill={SERIES_META[k].color} stroke="rgb(var(--surface-1))" strokeWidth="1.5" />
                );
              })}
            </g>
          )}
        </svg>

        {hp && hover != null && (
          <div
            className="pointer-events-none absolute top-1 z-10 min-w-[132px] rounded-lg border border-line-strong bg-surface-1/97 p-2 shadow-raised"
            style={{
              left: `${(x(hover) / W) * 100}%`,
              transform: hover > m * 0.6 ? "translateX(-105%)" : "translateX(5%)",
            }}
          >
            <div className="mb-1 border-b border-line pb-1 text-[10px] font-semibold uppercase tracking-wide text-ink-dim">
              {new Date(`${hp.day}T00:00:00Z`).toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: "UTC",
              })}
            </div>
            {activeKeys.map((k) => (
              <div key={k} className="flex items-center justify-between gap-3 text-[11px]">
                <span className="flex items-center gap-1.5 text-ink-muted">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: SERIES_META[k].color }} />
                  {SERIES_META[k].label}
                </span>
                <span className="num font-semibold text-ink">{money(hp[k]!)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Range navigator — drag the window or its edges, like a stock chart */}
      <div className="mt-1">
        <svg
          ref={navRef}
          viewBox={`0 0 ${W} ${NAV_H}`}
          className="h-[52px] w-full touch-none"
          role="group"
          aria-label="Date range selector"
          onPointerMove={(e) => onNavPointerMove(e.clientX)}
          onPointerUp={() => (dragRef.current = null)}
          onPointerLeave={() => (dragRef.current = null)}
        >
          <polyline points={navLine} fill="none" stroke="rgb(var(--ink-dim))" strokeWidth="1.2" opacity="0.75" />

          {/* Masked-out regions outside the window */}
          <rect x={NAV_PAD.l} y="0" width={Math.max(0, navX(lo) - NAV_PAD.l)} height={NAV_H} fill="rgb(var(--surface-0))" opacity="0.72" />
          <rect x={navX(hi)} y="0" width={Math.max(0, W - NAV_PAD.r - navX(hi))} height={NAV_H} fill="rgb(var(--surface-0))" opacity="0.72" />

          <rect
            x={navX(lo)}
            y="0"
            width={Math.max(2, navX(hi) - navX(lo))}
            height={NAV_H}
            fill="rgb(var(--accent))"
            fillOpacity="0.08"
            stroke="rgb(var(--accent))"
            strokeOpacity="0.5"
            className="cursor-move"
            onPointerDown={(e) => startDrag(e, "move")}
          />

          {([["left", lo], ["right", hi]] as const).map(([side, idx]) => (
            <rect
              key={side}
              x={navX(idx) - 4}
              y="0"
              width="8"
              height={NAV_H}
              rx="2"
              fill="rgb(var(--accent))"
              fillOpacity="0.85"
              className="cursor-ew-resize"
              onPointerDown={(e) => startDrag(e, side)}
            />
          ))}
        </svg>

        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-ink-dim">
            {fmtDate(points[lo].day)} – {fmtDate(points[hi].day)}
            <span className="ml-2 text-ink-dim/70">({hi - lo + 1} days)</span>
          </span>
          <div className="flex gap-1">
            {QUICK_RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => applyQuickRange(r.days)}
                className="rounded-md px-2 py-1 text-[11px] font-semibold text-ink-dim hover:bg-surface-2 hover:text-ink"
              >
                {r.key}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Tiny non-interactive line, for tables and article card panels. */
export function Sparkline({ points, className = "h-8 w-24" }: { points: number[]; className?: string }) {
  if (points.length < 2) return <div className={className} />;
  const w = 96;
  const h = 32;
  const pad = 3;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = Math.max(1, max - min);
  const xx = (i: number) => pad + (i / (points.length - 1)) * (w - 2 * pad);
  const yy = (v: number) => pad + (1 - (v - min) / span) * (h - 2 * pad);
  const up = points[points.length - 1] >= points[0];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} preserveAspectRatio="none" aria-hidden>
      <polyline
        points={points.map((v, i) => `${xx(i).toFixed(1)},${yy(v).toFixed(1)}`).join(" ")}
        fill="none"
        stroke={up ? "rgb(var(--up))" : "rgb(var(--down))"}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
