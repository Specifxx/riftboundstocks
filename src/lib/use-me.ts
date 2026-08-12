"use client";

import { useEffect, useState } from "react";

// Client-side session hook. One /api/me fetch per page load, shared by every
// consumer via a module-level promise cache — the navbar renders session-less
// on the server (so pages stay statically cacheable) and hydrates the
// signed-in state from here. See src/app/api/me/route.ts for why.
export interface MeUser {
  displayName: string;
  email: string;
  avatarUrl: string | null;
  emailVerified: boolean;
}

const EMPTY: MeUser | null = null;

let mePromise: Promise<MeUser | null> | null = null;

function fetchMe(): Promise<MeUser | null> {
  if (!mePromise) {
    mePromise = fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { user: EMPTY }))
      .then((d) => d.user ?? EMPTY)
      .catch(() => EMPTY);
  }
  return mePromise;
}

// Re-fetch on next use (e.g. after login/logout navigation re-mounts the chrome).
export function invalidateMe() {
  mePromise = null;
}

export function useMe(): { user: MeUser | null; loaded: boolean } {
  const [state, setState] = useState<{ user: MeUser | null; loaded: boolean }>({ user: EMPTY, loaded: false });

  useEffect(() => {
    let cancelled = false;
    fetchMe().then((user) => {
      if (!cancelled) setState({ user, loaded: true });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
