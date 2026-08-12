"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

// Only allow same-site relative redirects (no open-redirect to external URLs).
function safeNext(): string {
  if (typeof window === "undefined") return "/";
  const n = new URLSearchParams(window.location.search).get("next");
  return n && n.startsWith("/") && !n.startsWith("//") ? n : "/profile";
}

const OAUTH_ERRORS: Record<string, string> = {
  provider_unavailable: "That sign-in option isn't available yet — try email, or another option.",
  oauth_state: "Sign-in expired or was interrupted. Please try again.",
  oauth_token: "Couldn't complete sign-in with that provider. Please try again.",
  oauth_profile: "Couldn't read your profile from that provider. Please try again.",
  oauth_noemail: "That provider didn't share an email address, which we need to create your account.",
};

const inputClass =
  "h-10 w-full rounded-md border border-line bg-surface-2 px-3 text-sm text-ink placeholder:text-ink-dim";
const labelClass = "mb-1 block text-[12px] font-semibold text-ink-muted";

export function AuthForm({ mode, providers }: { mode: "login" | "signup"; providers: ("google" | "discord")[] }) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false); // show "check your email" after signup
  const [needsVerify, setNeedsVerify] = useState(false); // login blocked: email not verified
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  // Surface OAuth failures redirected back as ?error=…
  useEffect(() => {
    const e = new URLSearchParams(window.location.search).get("error");
    if (e) setError(OAUTH_ERRORS[e] ?? "Sign-in failed — please try again.");
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsVerify(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${isSignup ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isSignup ? { email, password, displayName } : { email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        if (data.needsVerify) setNeedsVerify(true); // login: unverified email
        setLoading(false);
        return;
      }
      // New accounts must verify their email before they can sign in.
      if (isSignup) {
        setRegistered(true);
        setLoading(false);
        return;
      }
      router.push(safeNext());
      router.refresh();
    } catch {
      setError("Network error — please try again.");
      setLoading(false);
    }
  }

  async function resendVerification() {
    setResendMsg(null);
    try {
      const res = await fetch("/api/auth/resend-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResendMsg(
        res.ok ? "Verification email sent — check your inbox (and spam)." : "Couldn't resend right now — try again shortly."
      );
    } catch {
      setResendMsg("Network error — try again.");
    }
  }

  const nextQ =
    typeof window !== "undefined" ? window.location.search.replace(/[?&]error=[^&]*/g, "").replace(/^&/, "?") : "";

  // After signup: the account exists but can't sign in until the email is verified.
  if (registered) {
    return (
      <div className="panel p-5 text-center">
        <h1 className="font-display text-xl uppercase tracking-wide text-ink">Check your email</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
          We&apos;ve sent a verification link to <span className="font-semibold text-ink">{email}</span>. Click it to
          activate your account, then log in.
        </p>
        <button
          onClick={resendVerification}
          className="mt-4 rounded-md border border-line bg-surface-2 px-3 py-1.5 text-[12px] font-semibold text-ink-muted hover:border-line-strong hover:text-ink"
        >
          Resend verification email
        </button>
        {resendMsg && <p className="mt-2 text-[12px] text-ink-dim">{resendMsg}</p>}
        <p className="mt-4 text-[13px]">
          <Link href={`/login${nextQ}`} className="text-accent hover:underline">
            Go to log in →
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="panel p-5">
      <h1 className="font-display text-xl uppercase tracking-wide text-ink">
        {isSignup ? "Create your account" : "Log In"}
      </h1>
      <p className="mt-1 text-[13px] text-ink-muted">
        {isSignup ? "Free — track prices your way, no ads, ever." : "Welcome back."}
      </p>

      {/* OAuth — only render a provider's button when its env keys are configured,
          so we never show a button that just redirects back with an error. */}
      {providers.length > 0 && (
        <>
          <div className="mt-4 flex flex-col gap-2">
            {providers.includes("google") && (
              <a
                href="/api/auth/oauth/google"
                className="flex h-10 items-center justify-center gap-2.5 rounded-md border border-line bg-surface-1 text-[13px] font-semibold text-ink hover:border-line-strong"
              >
                <GoogleIcon /> Continue with Google
              </a>
            )}
            {providers.includes("discord") && (
              <a
                href="/api/auth/oauth/discord"
                className="flex h-10 items-center justify-center gap-2.5 rounded-md bg-[#5865F2] text-[13px] font-semibold text-white hover:brightness-110"
              >
                <DiscordIcon /> Continue with Discord
              </a>
            )}
          </div>
          <div className="my-4 flex items-center gap-3 text-[11px] text-ink-dim">
            <span className="h-px flex-1 bg-line" /> or with email <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      <form onSubmit={submit} className="flex flex-col gap-3">
        {isSignup && (
          <label className="block">
            <span className={labelClass}>Display name</span>
            <input
              className={inputClass}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. StockPicker"
              autoComplete="nickname"
              minLength={2}
              maxLength={24}
              required
            />
          </label>
        )}
        <label className="block">
          <span className={labelClass}>Email</span>
          <input
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>
        <label className="block">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-ink-muted">Password</span>
            {!isSignup && (
              <Link href="/forgot" className="text-[12px] text-accent hover:underline">
                Forgot password?
              </Link>
            )}
          </div>
          <input
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={isSignup ? "new-password" : "current-password"}
            minLength={isSignup ? 8 : 1}
            required
          />
        </label>

        {error && <p role="alert" className="rounded-md bg-down/10 px-3 py-2 text-[12.5px] text-down">{error}</p>}
        {needsVerify && (
          <p className="text-[12px] text-ink-muted">
            <button type="button" onClick={resendVerification} className="font-semibold text-accent hover:underline">
              Resend verification email
            </button>
            {resendMsg && <span className="ml-2">{resendMsg}</span>}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="h-10 w-full rounded-md bg-accent text-[13px] font-semibold text-accent-ink hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Please wait…" : isSignup ? "Create Account" : "Log In"}
        </button>
      </form>

      <p className="mt-4 text-center text-[13px] text-ink-muted">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href={`/login${nextQ}`} className="text-accent hover:underline">
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href={`/signup${nextQ}`} className="text-accent hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.4 5.4 2.6 13.3l7.8 6.1C12.2 13.2 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7C43.9 38 46.5 31.8 46.5 24.5z" />
      <path fill="#FBBC05" d="M10.4 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.8-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.7l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.5l-7.4-5.7c-2 1.4-4.7 2.3-7.9 2.3-6.4 0-11.8-3.7-13.6-8.9l-7.8 6.1C6.4 42.6 14.6 48 24 48z" />
    </svg>
  );
}
function DiscordIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.2.4a18 18 0 0 1 4.3 1.4 16.7 16.7 0 0 0-14.8 0A18 18 0 0 1 9 3.4L8.7 3a19.8 19.8 0 0 0-5 1.4A20.6 20.6 0 0 0 .2 18.4 19.9 19.9 0 0 0 6.3 21l.4-.6a13 13 0 0 1-2-1l.5-.4a14 14 0 0 0 12 0l.5.4c-.6.4-1.3.7-2 1l.4.6a19.9 19.9 0 0 0 6-2.6 20.6 20.6 0 0 0-3.5-14zM8.4 15.3c-1 0-1.7-.9-1.7-2s.8-2 1.7-2 1.7.9 1.7 2-.8 2-1.7 2zm7.2 0c-1 0-1.7-.9-1.7-2s.8-2 1.7-2 1.7.9 1.7 2-.7 2-1.7 2z" />
    </svg>
  );
}
