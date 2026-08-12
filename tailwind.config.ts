import type { Config } from "tailwindcss";

// Every colour is a CSS custom property resolved at runtime (see globals.css),
// so the light/dark toggle is a single `data-theme` swap on <html> rather than a
// `dark:` variant on every element. Ported from TCGEmpire's token approach and
// re-pitched from its green marketplace palette to this site's navy trading-desk
// look: deep navy surfaces, a blue accent, and green/red reserved exclusively for
// price movement so a colour never means two things at once.
const withAlpha = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Page background → raised panel. `surface-0` is the deep navy (#0d1b2a).
        surface: {
          0: withAlpha("--surface-0"),
          1: withAlpha("--surface-1"),
          2: withAlpha("--surface-2"),
          3: withAlpha("--surface-3"),
        },
        line: {
          DEFAULT: withAlpha("--line"),
          strong: withAlpha("--line-strong"),
        },
        ink: {
          DEFAULT: withAlpha("--ink"),
          muted: withAlpha("--ink-muted"),
          dim: withAlpha("--ink-dim"),
        },
        // The single blue accent: links, active states, primary actions.
        accent: {
          DEFAULT: withAlpha("--accent"),
          soft: withAlpha("--accent-soft"),
          ink: withAlpha("--accent-ink"),
        },
        // Market deltas. These two NEVER appear as decoration — if something is
        // green on this site it went up, and if it is red it went down.
        up: withAlpha("--up"),
        down: withAlpha("--down"),
        // Foil / premium printings only.
        foil: withAlpha("--foil"),
      },
      fontFamily: {
        // Body/UI — clean humanist sans.
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
        // Section titles — a condensed grotesque, the "financial broadsheet" voice.
        display: ["var(--font-display)", "Oswald", "Arial Narrow", "sans-serif"],
        // Prices, tickers, tabular figures — the terminal voice.
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      borderRadius: {
        md: "6px",
        lg: "8px",
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        card: "0 1px 0 rgb(255 255 255 / 0.03), 0 1px 3px rgb(0 0 0 / 0.35)",
        raised: "0 4px 16px rgb(0 0 0 / 0.35)",
      },
      keyframes: {
        // The movers ticker. Translating -50% of a list rendered TWICE gives a
        // seamless loop with no JS timer.
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        ticker: "ticker 60s linear infinite",
        "fade-up": "fade-up 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
