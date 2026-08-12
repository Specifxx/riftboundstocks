"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  CURRENCIES,
  CURRENCY_STORAGE_KEY,
  DEFAULT_CURRENCY,
  THEME_STORAGE_KEY,
  convert,
  type Currency,
} from "@/lib/currency";
import { formatMoney } from "@/lib/format";

type Theme = "dark" | "light";

interface Prefs {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  theme: Theme;
  toggleTheme: () => void;
}

const Ctx = createContext<Prefs>({
  currency: DEFAULT_CURRENCY,
  setCurrency: () => {},
  theme: "dark",
  toggleTheme: () => {},
});

/**
 * Currency and theme, persisted in localStorage.
 *
 * localStorage rather than a cookie on purpose: neither preference needs to
 * reach the server, so keeping them client-side means no per-request rendering
 * (every page stays statically cacheable) and no cookie to disclose in a banner.
 * The trade-off is a first paint in the default state, which the inline script in
 * layout.tsx fixes for theme — the part a visitor would actually notice.
 */
export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(DEFAULT_CURRENCY);
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    try {
      const c = localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (c && (CURRENCIES as readonly string[]).includes(c)) setCurrencyState(c as Currency);
      setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    } catch {
      // Private-mode / blocked storage — defaults are fine.
    }
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, c);
    } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {}
      return next;
    });
  }, []);

  return <Ctx.Provider value={{ currency, setCurrency, theme, toggleTheme }}>{children}</Ctx.Provider>;
}

export function usePrefs(): Prefs {
  return useContext(Ctx);
}

/**
 * A price. Always give it USD cents — it converts for display.
 *
 * Server components render this freely; it is a client component so the currency
 * switch updates every figure on the page without a refetch.
 */
export function Money({ cents, className }: { cents: number | null | undefined; className?: string }) {
  const { currency } = usePrefs();
  if (cents == null) return <span className={className}>—</span>;
  return (
    <span className={className} suppressHydrationWarning>
      {formatMoney(convert(cents, currency), currency)}
    </span>
  );
}

/**
 * The card page's "Other printings" table shows a hard USD column (the stored,
 * canonical price) plus a converted one. These two render the converted column's
 * header and cells, and BOTH return null when USD is selected — which removes
 * the whole column rather than printing the same figure twice.
 */
export function AltCurrencyHeader({ className }: { className?: string }) {
  const { currency } = usePrefs();
  if (currency === "USD") return null;
  return <th className={className}>{currency}</th>;
}

export function AltCurrencyCell({ cents, className }: { cents: number; className?: string }) {
  const { currency } = usePrefs();
  if (currency === "USD") return null;
  return <td className={className}>{formatMoney(convert(cents, currency), currency)}</td>;
}

export function CurrencySelector() {
  const { currency, setCurrency } = usePrefs();
  return (
    <label className="relative">
      <span className="sr-only">Currency</span>
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as Currency)}
        className="h-8 cursor-pointer appearance-none rounded-md border border-line bg-surface-2 pl-2 pr-6 text-xs font-semibold text-ink-muted hover:text-ink"
      >
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <svg aria-hidden viewBox="0 0 12 12" className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 fill-ink-dim">
        <path d="M6 8.5 2 4.5h8z" />
      </svg>
    </label>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme } = usePrefs();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="grid h-8 w-8 place-items-center rounded-md border border-line bg-surface-2 text-ink-muted hover:text-ink"
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
          <path d="M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.41-1.41M4.93 19.07l1.41-1.41m0-11.32L4.93 4.93m14.14 14.14-1.41-1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      )}
    </button>
  );
}
