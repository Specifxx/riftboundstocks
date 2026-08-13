// A small original icon set, hand-drawn as plain stroke paths on a 24×24 grid
// for the left rail (see SideRail.tsx). Built from the site's own rune/hex
// vocabulary (the hexagon frame from BrandLogo.tsx, six-tick rune marks) —
// nothing here is traced from an icon font or another product's glyph set.

type IconProps = { className?: string };
const base = "h-5 w-5";

export function HomeIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
      <path d="M12 2.5 21 8v13H3V8Z" />
      <circle cx="12" cy="13.5" r="2.4" />
    </svg>
  );
}

export function SetsIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="7" y="3" width="12" height="16" rx="1.5" transform="rotate(6 13 11)" />
      <rect x="5" y="5" width="12" height="16" rx="1.5" className="fill-surface-1" />
    </svg>
  );
}

export function DomainsIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19" />
      <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function InterestsIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 17 9.5 10l4 4L21 6" />
      <path d="M15 6h6v6" />
    </svg>
  );
}

export function AnalyticsIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M4 20V10M11 20V4M18 20v-7" />
    </svg>
  );
}

export function SealedIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" aria-hidden>
      <path d="M12 3 21 7.5v9L12 21 3 16.5v-9Z" />
      <path d="M3 7.5 12 12l9-4.5M12 12v9" />
    </svg>
  );
}

export function PortfolioIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 5h13a3 3 0 0 1 3 3v11H7a3 3 0 0 1-3-3Z" />
      <path d="M4 5v13" />
      <path d="M9 10h7" />
    </svg>
  );
}

export function AlertsIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3 20 7v6c0 4-3.4 6.5-8 8-4.6-1.5-8-4-8-8V7Z" />
      <path d="M12 8v4.5M12 15.5h.01" />
    </svg>
  );
}

export function PremiumIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m4 8 3.5 3L12 5l4.5 6L20 8l-1.6 10H5.6Z" />
    </svg>
  );
}
