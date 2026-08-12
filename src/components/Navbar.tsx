"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandLogo, BrandWordmark } from "./BrandLogo";
import { SearchBox } from "./SearchBox";
import { CurrencySelector, ThemeToggle } from "./Prefs";
import { NavUser } from "./NavUser";

interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string; hint?: string }[];
}

// "Decks" is adapted to Riftbound's own vocabulary: the game's deckbuilding
// revolves around Legends and the six Domains, so the menu leads with those
// rather than borrowing Magic's format names.
const NAV: NavItem[] = [
  { label: "Sets", href: "/sets" },
  {
    label: "Sealed",
    href: "/sealed",
    children: [
      { label: "Booster Boxes", href: "/sealed#boxes", hint: "Sealed box pricing" },
      { label: "Booster Packs", href: "/sealed#packs", hint: "Single-pack market" },
      { label: "Starter Decks", href: "/sealed#starters", hint: "Proving Grounds & preconstructed" },
    ],
  },
  { label: "Interests", href: "/interests" },
  {
    label: "Analytics",
    href: "/analytics",
    children: [
      { label: "Market Index", href: "/analytics", hint: "The whole market in one line" },
      { label: "Set Performance", href: "/analytics#sets", hint: "Which sets are holding value" },
      { label: "Biggest Movers", href: "/interests", hint: "Today's gainers and losers" },
    ],
  },
  {
    label: "Decks",
    href: "/decks",
    children: [
      { label: "Deck Archetypes", href: "/decks", hint: "What a build costs to assemble" },
      { label: "Domains", href: "/domains", hint: "Fury, Calm, Mind, Body, Chaos, Order" },
      { label: "Legends", href: "/browse?type=Legend", hint: "Every Legend by price" },
    ],
  },
];

export function Navbar() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Any navigation closes everything — without this the dropdown stays open on
  // top of the page you just moved to.
  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!navRef.current?.contains(e.target as Node)) setOpenMenu(null);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <nav ref={navRef} className="sticky top-0 z-40 border-b border-line bg-surface-1/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-3 sm:px-5">
        {/* -mx-1/px-1 grows the touch target to 40px without moving the mark. */}
        <Link href="/" className="-mx-1 flex h-10 shrink-0 items-center gap-2 px-1" aria-label="RiftboundStocks home">
          <BrandLogo className="h-7 w-7" />
          <span className="hidden sm:block">
            <BrandWordmark />
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="ml-2 hidden items-center gap-0.5 lg:flex">
          {NAV.map((item) => (
            <li key={item.label} className="relative">
              {item.children ? (
                <>
                  <button
                    type="button"
                    onClick={() => setOpenMenu((m) => (m === item.label ? null : item.label))}
                    aria-expanded={openMenu === item.label}
                    aria-haspopup="menu"
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[13px] font-semibold transition-colors ${
                      isActive(item.href) ? "text-accent" : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {item.label}
                    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 fill-current opacity-60" aria-hidden>
                      <path d="M6 8.5 2 4.5h8z" />
                    </svg>
                  </button>
                  {openMenu === item.label && (
                    <div
                      role="menu"
                      className="absolute left-0 top-9 z-50 w-64 overflow-hidden rounded-lg border border-line-strong bg-surface-1 p-1 shadow-raised"
                    >
                      {item.children.map((c) => (
                        <Link
                          key={c.href}
                          href={c.href}
                          role="menuitem"
                          className="block rounded-md px-2.5 py-2 hover:bg-surface-2"
                        >
                          <span className="block text-[13px] font-semibold text-ink">{c.label}</span>
                          {c.hint && <span className="block text-[11px] text-ink-dim">{c.hint}</span>}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={`block rounded-md px-2.5 py-1.5 text-[13px] font-semibold transition-colors ${
                    isActive(item.href) ? "text-accent" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2">
          <SearchBox className="hidden w-40 md:block lg:w-56" />
          <div className="hidden items-center gap-2 sm:flex">
            <CurrencySelector />
            <ThemeToggle />
          </div>
          <div className="hidden items-center gap-1.5 xl:flex">
            <NavUser />
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-label="Menu"
            className="grid h-8 w-8 place-items-center rounded-md border border-line bg-surface-2 text-ink-muted lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-current" strokeWidth="2" strokeLinecap="round" fill="none" aria-hidden>
              {mobileOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-line bg-surface-1 px-3 py-3 lg:hidden">
          <SearchBox className="mb-3 md:hidden" />
          <ul className="space-y-0.5">
            {NAV.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="block rounded-md px-2 py-2 text-sm font-semibold text-ink hover:bg-surface-2">
                  {item.label}
                </Link>
                {item.children && (
                  <ul className="ml-3 border-l border-line pl-2">
                    {item.children.map((c) => (
                      <li key={c.href}>
                        <Link href={c.href} className="block rounded-md px-2 py-1.5 text-[13px] text-ink-muted hover:bg-surface-2">
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
            <CurrencySelector />
            <ThemeToggle />
            <NavUser mobile />
          </div>
        </div>
      )}
    </nav>
  );
}
