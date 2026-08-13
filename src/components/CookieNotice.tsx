"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ACCOUNTS_ENABLED } from "@/lib/site";

const KEY = "rbs.notice-seen";

/**
 * A disclosure, not a consent gate.
 *
 * This site sets no TRACKING cookies at all: theme and currency live in
 * localStorage, there is no analytics script, no advertising pixel and no
 * third-party embed that could set one. The one exception — a session cookie,
 * and only once you create an account — is strictly functional (it just keeps
 * you signed in) and never used for tracking, so it doesn't change the
 * consent story: there's still nothing here to obtain consent FOR, and a
 * banner with "Accept"/"Reject" buttons would be theatre.
 *
 * So this says what the site actually stores and goes away. If an analytics or
 * ads integration is ever added, this component must be replaced with a real
 * consent manager that blocks those scripts until a choice is made — a dismissal
 * here is NOT consent and must never be treated as one.
 */
export function CookieNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      // Storage blocked — showing it every visit is better than crashing.
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-lg rounded-xl border border-line-strong bg-surface-1 p-3.5 shadow-raised sm:inset-x-auto sm:right-4">
      <p className="text-[12.5px] leading-relaxed text-ink-muted">
        <strong className="font-semibold text-ink">No tracking, ever.</strong> This site stores your theme and currency
        choice in your browser&apos;s local storage.{" "}
        {ACCOUNTS_ENABLED && "Creating an account adds one functional sign-in cookie — nothing else changes. "}
        No analytics, no ads, no third parties.{" "}
        <Link href="/privacy" className="text-accent hover:underline">
          Privacy
        </Link>
      </p>
      <button
        type="button"
        onClick={() => {
          try {
            localStorage.setItem(KEY, "1");
          } catch {}
          setShow(false);
        }}
        className="mt-2.5 w-full rounded-md bg-accent px-3 py-1.5 text-[13px] font-semibold text-accent-ink hover:opacity-90"
      >
        Got it
      </button>
    </div>
  );
}
