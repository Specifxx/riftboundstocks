"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const inputClass =
  "h-10 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-ink-dim";
const labelClass = "mb-1 block text-[12px] font-semibold text-ink-muted";
const buttonClass =
  "h-10 w-full rounded-md bg-accent text-[13px] font-semibold text-accent-ink hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";

// --- Forgot password: enter email, we send a reset link --------------------------
export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="panel p-5 text-[13px] text-ink-muted">
        <h1 className="font-display text-xl uppercase tracking-wide text-ink">Check your email</h1>
        <p className="mt-2 leading-relaxed">
          If an account exists for <span className="text-ink">{email}</span>, we&apos;ve sent a link to reset your
          password. It expires in 1 hour.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-flex rounded-md border border-line bg-surface-2 px-3 py-1.5 text-[12px] font-semibold text-ink-muted hover:border-line-strong hover:text-ink"
        >
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="panel p-5">
      <h1 className="font-display text-xl uppercase tracking-wide text-ink">Reset your password</h1>
      <p className="mt-1 text-[13px] text-ink-muted">Enter your email and we&apos;ll send you a reset link.</p>
      <label className="mt-4 block">
        <span className={labelClass}>Email</span>
        <input
          type="email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
      </label>
      <button type="submit" className={`${buttonClass} mt-4`} disabled={loading}>
        {loading ? "Sending…" : "Send reset link"}
      </button>
      <p className="mt-4 text-center text-[13px] text-ink-muted">
        <Link href="/login" className="text-accent hover:underline">
          Back to log in
        </Link>
      </p>
    </form>
  );
}

// --- Reset password: set a new password from the emailed token -------------------
export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="panel p-5 text-[13px] text-ink-muted">
        <h1 className="font-display text-xl uppercase tracking-wide text-ink">Invalid link</h1>
        <p className="mt-2 leading-relaxed">This reset link is missing or malformed. Request a new one.</p>
        <Link
          href="/forgot"
          className="mt-4 inline-flex rounded-md bg-accent px-3 py-1.5 text-[12px] font-semibold text-accent-ink hover:opacity-90"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Couldn't reset your password.");
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="panel p-5">
      <h1 className="font-display text-xl uppercase tracking-wide text-ink">Choose a new password</h1>
      <label className="mt-4 block">
        <span className={labelClass}>New password</span>
        <input
          type="password"
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
          autoFocus
          autoComplete="new-password"
        />
      </label>
      {error && <p role="alert" className="mt-3 rounded-md bg-down/10 px-3 py-2 text-[12.5px] text-down">{error}</p>}
      <button type="submit" className={`${buttonClass} mt-4`} disabled={loading}>
        {loading ? "Saving…" : "Set password & log in"}
      </button>
    </form>
  );
}

// --- Verify email: confirm the token on load -------------------------------------
export function VerifyClient({ token }: { token: string }) {
  const [state, setState] = useState<"loading" | "ok" | "error">(token ? "loading" : "error");

  useEffect(() => {
    if (!token) return;
    fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => setState(r.ok ? "ok" : "error"))
      .catch(() => setState("error"));
  }, [token]);

  return (
    <div className="panel p-5 text-center">
      {state === "loading" && <p className="py-6 text-[13px] text-ink-muted">Confirming your email…</p>}
      {state === "ok" && (
        <>
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-up/15 text-up">✓</div>
          <h1 className="mt-3 font-display text-xl uppercase tracking-wide text-ink">Email confirmed</h1>
          <p className="mt-1 text-[13px] text-ink-muted">Your email is verified — you can log in now.</p>
          <Link
            href="/login"
            className="mt-4 inline-flex rounded-md bg-accent px-3 py-1.5 text-[12px] font-semibold text-accent-ink hover:opacity-90"
          >
            Log In
          </Link>
        </>
      )}
      {state === "error" && (
        <>
          <h1 className="font-display text-xl uppercase tracking-wide text-ink">Link expired</h1>
          <p className="mt-1 text-[13px] text-ink-muted">
            This confirmation link is invalid or has expired. Log in and resend it from your profile.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex rounded-md bg-accent px-3 py-1.5 text-[12px] font-semibold text-accent-ink hover:opacity-90"
          >
            Log In
          </Link>
        </>
      )}
    </div>
  );
}
