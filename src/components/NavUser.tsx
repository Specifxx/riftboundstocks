"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useMe, type MeUser } from "@/lib/use-me";

// Signed-out and loading render the exact same CTAs the navbar always showed
// (Log In / Sign Up) so there's no layout shift and no flash for anonymous
// visitors — only a signed-in user sees anything swap, once /api/me resolves.
function SignedOutLinks({ mobile }: { mobile?: boolean }) {
  return (
    <>
      <Link
        href="/login"
        className={`rounded-md px-2.5 py-1.5 text-[13px] font-semibold text-ink-muted ${mobile ? "" : "hover:text-ink"}`}
      >
        Log In
      </Link>
      <Link
        href="/signup"
        className={`rounded-md bg-accent px-3 py-1.5 text-[13px] font-semibold text-accent-ink ${mobile ? "" : "hover:opacity-90"}`}
      >
        Sign Up
      </Link>
    </>
  );
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"
  );
}

function Avatar({ user }: { user: MeUser }) {
  if (user.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.avatarUrl} alt="" aria-hidden="true" className="h-full w-full object-cover" referrerPolicy="no-referrer" />;
  }
  return <>{initials(user.displayName)}</>;
}

// Desktop: avatar button that opens a small dropdown (profile / sign out).
function DesktopMenu({ user }: { user: MeUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  async function signOut() {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    // Hard navigation so the server-rendered chrome re-renders signed-out.
    window.location.assign("/");
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        className="grid h-8 w-8 place-items-center overflow-hidden rounded-full border border-line bg-surface-2 text-[11px] font-bold text-ink hover:border-line-strong"
      >
        <Avatar user={user} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-10 z-50 w-56 overflow-hidden rounded-lg border border-line-strong bg-surface-1 shadow-raised"
        >
          <div className="border-b border-line px-3.5 py-2.5">
            <div className="truncate text-[13px] font-semibold text-ink">{user.displayName}</div>
            <div className="truncate text-[11.5px] text-ink-dim">{user.email}</div>
          </div>
          {!user.emailVerified && (
            <div className="border-b border-line bg-surface-2 px-3.5 py-2 text-[11.5px] text-ink-muted">
              Email not confirmed —{" "}
              <Link href="/profile" className="font-semibold text-accent hover:underline" onClick={() => setOpen(false)}>
                resend
              </Link>
            </div>
          )}
          <div className="py-1">
            <Link
              href="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-3.5 py-2 text-[13px] font-semibold text-ink hover:bg-surface-2"
            >
              Profile
            </Link>
          </div>
          <div className="border-t border-line py-1">
            <button
              onClick={signOut}
              className="block w-full px-3.5 py-2 text-left text-[13px] text-ink-muted hover:bg-surface-2 hover:text-ink"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Mobile: the slide-down panel is already an open menu, so signed-in state is
// inline links rather than a popup nested inside a popup.
function MobileSignedIn({ user }: { user: MeUser }) {
  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.location.assign("/");
  }
  return (
    <>
      <Link href="/profile" className="ml-auto flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] font-semibold text-ink">
        <span className="grid h-6 w-6 place-items-center overflow-hidden rounded-full border border-line bg-surface-2 text-[10px] font-bold">
          <Avatar user={user} />
        </span>
        Profile
      </Link>
      <button onClick={signOut} className="rounded-md px-2.5 py-1.5 text-[13px] font-semibold text-ink-muted">
        Sign out
      </button>
    </>
  );
}

export function NavUser({ mobile = false }: { mobile?: boolean }) {
  const { user, loaded } = useMe();
  if (!loaded || !user) return <SignedOutLinks mobile={mobile} />;
  return mobile ? <MobileSignedIn user={user} /> : <DesktopMenu user={user} />;
}
