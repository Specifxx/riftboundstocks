"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  SetsIcon,
  DomainsIcon,
  InterestsIcon,
  AnalyticsIcon,
  SealedIcon,
  PortfolioIcon,
  AlertsIcon,
} from "./RailIcons";

interface RailItem {
  label: string;
  href: string;
  icon: (p: { className?: string }) => React.ReactElement;
}

// The structural break from a single top nav bar: primary, single-destination
// sections live here as a persistent icon rail (desktop only — the mobile
// menu in Navbar.tsx already lists everything in one place, so nothing is
// lost by keeping the rail off small screens). Sub-menus (Sealed, Decks,
// Games) stay in the top bar's mega-menu, where a hint line actually helps;
// a rail icon has no room for one.
const ITEMS: RailItem[] = [
  { label: "Home", href: "/", icon: HomeIcon },
  { label: "Sets", href: "/sets", icon: SetsIcon },
  { label: "Domains", href: "/domains", icon: DomainsIcon },
  { label: "Interests", href: "/interests", icon: InterestsIcon },
  { label: "Analytics", href: "/analytics", icon: AnalyticsIcon },
  { label: "Sealed", href: "/sealed", icon: SealedIcon },
  { label: "Portfolio", href: "/portfolio", icon: PortfolioIcon },
  { label: "Alerts", href: "/alerts", icon: AlertsIcon },
];

export function SideRail() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav
      aria-label="Primary sections"
      className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-[64px] shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-line bg-surface-1 py-3 lg:flex"
    >
      {ITEMS.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            aria-current={active ? "page" : undefined}
            className={`group relative flex w-12 flex-col items-center gap-1 rounded-lg py-2 text-[9.5px] font-semibold uppercase tracking-wide transition-colors ${
              active ? "bg-accent-soft text-accent" : "text-ink-dim hover:bg-surface-2 hover:text-ink"
            }`}
          >
            {active && <span aria-hidden className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-accent" />}
            <Icon className="h-5 w-5" />
            <span className="leading-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
