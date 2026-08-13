import type { BreakdownSlice } from "@/lib/portfolio";
import { Money } from "./Prefs";

export function PortfolioBreakdown({ title, slices }: { title: string; slices: BreakdownSlice[] }) {
  if (slices.length === 0) return null;
  const total = slices.reduce((s, x) => s + x.valueCents, 0) || 1;

  return (
    <div className="panel p-4">
      <h2 className="eyebrow mb-3">{title}</h2>
      <ul className="space-y-2.5">
        {slices.map((s) => {
          const pct = (s.valueCents / total) * 100;
          return (
            <li key={s.key}>
              <div className="flex items-center justify-between gap-2 text-[12.5px]">
                <span className="flex min-w-0 items-center gap-1.5 truncate text-ink-muted">
                  {s.color && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />}
                  <span className="truncate">{s.label}</span>
                  <span className="shrink-0 text-ink-dim">×{s.count}</span>
                </span>
                <Money cents={s.valueCents} className="num shrink-0 font-semibold text-ink" />
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: s.color || "rgb(var(--accent))" }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
