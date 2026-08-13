"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { PortfolioValuePoint } from "@/lib/portfolio";
import { convert } from "@/lib/currency";
import { formatMoney, formatMoneyCompact } from "@/lib/format";
import { usePrefs } from "./Prefs";

/**
 * A single-series value-over-time line, for the portfolio page. Deliberately
 * simpler than PriceChart (no range brush, no series toggles) since there is
 * one line to show — same hand-rolled-SVG approach for the same reason: less
 * code than pulling in a charting library for one line and a tooltip.
 */
export function PortfolioValueChart({ points }: { points: PortfolioValuePoint[] }) {
  const { currency } = usePrefs();
  const clipId = useId();
  const sizeRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(900);
  const [hover, setHover] = useState<number | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sizeRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      if (w > 0) setW(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (points.length < 2) {
    return <p className="text-sm text-ink-dim">Not enough overlapping price history yet to chart portfolio value.</p>;
  }

  const narrow = W < 520;
  const H = narrow ? 160 : 200;
  const PAD = { l: narrow ? 44 : 56, r: 12, t: 12, b: 22 };
  const n = points.length;

  const values = points.map((p) => p.cents);
  const min = Math.max(0, Math.min(...values) * 0.95);
  const max = Math.max(...values) * 1.05 || 1;
  const span = Math.max(1, max - min);

  const x = (i: number) => PAD.l + (n <= 1 ? 0 : (i / (n - 1)) * (W - PAD.l - PAD.r));
  const y = (v: number) => PAD.t + (1 - (v - min) / span) * (H - PAD.t - PAD.b);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.cents).toFixed(1)}`).join("");

  const money = (cents: number) => formatMoney(convert(cents, currency), currency);
  const axisMoney = (cents: number) => (narrow ? formatMoneyCompact(convert(cents, currency), currency) : money(cents));
  const gridVals = [min, min + span * 0.5, max];
  const fmtDate = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const hp = hover != null ? points[Math.min(hover, n - 1)] : null;

  function onMove(clientX: number) {
    const el = plotRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const leftPx = rect.left + (PAD.l / W) * rect.width;
    const plotPx = ((W - PAD.l - PAD.r) / W) * rect.width;
    const ratio = Math.min(1, Math.max(0, (clientX - leftPx) / plotPx));
    setHover(Math.round(ratio * (n - 1)));
  }

  return (
    <div ref={sizeRef}>
      <div
        ref={plotRef}
        className="relative select-none"
        onMouseMove={(e) => onMove(e.clientX)}
        onMouseLeave={() => setHover(null)}
        onTouchStart={(e) => onMove(e.touches[0].clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="w-full" style={{ height: H }} role="img" aria-label="Portfolio value over time">
          <defs>
            <clipPath id={clipId}>
              <rect x={PAD.l} y={PAD.t} width={W - PAD.l - PAD.r} height={H - PAD.t - PAD.b} />
            </clipPath>
          </defs>
          {gridVals.map((gv, i) => (
            <g key={i}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(gv)} y2={y(gv)} stroke="rgb(var(--line))" strokeWidth="1" />
              <text x={PAD.l - 6} y={y(gv) + 3.5} textAnchor="end" fontSize={narrow ? 9 : 10} fill="rgb(var(--ink-dim))">
                {axisMoney(gv)}
              </text>
            </g>
          ))}
          <g clipPath={`url(#${clipId})`}>
            <path d={path} fill="none" stroke="rgb(var(--accent))" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
          </g>
          <text x={PAD.l} y={H - 6} fontSize={narrow ? 9 : 10} fill="rgb(var(--ink-dim))">
            {fmtDate(points[0].day)}
          </text>
          <text x={W - PAD.r} y={H - 6} textAnchor="end" fontSize={narrow ? 9 : 10} fill="rgb(var(--ink-dim))">
            {fmtDate(points[n - 1].day)}
          </text>
          {hp && hover != null && (
            <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} stroke="rgb(var(--accent))" strokeOpacity="0.5" strokeDasharray="3 3" />
          )}
        </svg>
        {hp && hover != null && (
          <div
            className="pointer-events-none absolute top-1 z-10 rounded-lg border border-line-strong bg-surface-1/97 p-2 shadow-raised"
            style={{ left: `${(x(hover) / W) * 100}%`, transform: hover > n * 0.6 ? "translateX(-105%)" : "translateX(5%)" }}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-dim">{fmtDate(hp.day)}</div>
            <div className="num text-[13px] font-bold text-ink">{money(hp.cents)}</div>
          </div>
        )}
      </div>
      <p className="mt-1.5 text-[11px] text-ink-dim">
        Today&apos;s quantities projected across each card&apos;s own price history — not a record of what you held on
        past dates, since purchase dates aren&apos;t tracked. A day only counts holdings priced that day.
      </p>
    </div>
  );
}
