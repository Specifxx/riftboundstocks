"use client";

import { useEffect, useState } from "react";

const OAUTH_ERRORS: Record<string, string> = {
  provider_unavailable: "That sign-in option isn't available right now.",
  oauth_state: "Sign-in expired or was interrupted. Please try again.",
  oauth_token: "Couldn't complete sign-in with that provider. Please try again.",
  oauth_profile: "Couldn't read your profile from that provider. Please try again.",
  oauth_noemail: "That provider didn't share an email address, which we need to create your account.",
};

// Google/Discord only — no email/password. The whole flow is: click a
// button, land back at /profile signed in. See lib/oauth.ts and
// api/auth/oauth/[provider]/{route,callback/route}.ts for the mechanics.
export function OAuthButtons({ mode, providers }: { mode: "login" | "signup"; providers: ("google" | "discord")[] }) {
  const isSignup = mode === "signup";
  const [error, setError] = useState<string | null>(null);

  // Surface OAuth failures redirected back as ?error=…
  useEffect(() => {
    const e = new URLSearchParams(window.location.search).get("error");
    if (e) setError(OAUTH_ERRORS[e] ?? "Sign-in failed — please try again.");
  }, []);

  return (
    <div className="panel p-5">
      <h1 className="font-display text-xl uppercase tracking-wide text-ink">
        {isSignup ? "Create your account" : "Log In"}
      </h1>
      <p className="mt-1 text-[13px] text-ink-muted">
        {isSignup ? "Free — track prices your way, no ads, ever." : "Welcome back."}
      </p>

      {providers.length > 0 ? (
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
      ) : (
        <p className="mt-4 rounded-md bg-down/10 px-3 py-2 text-[12.5px] text-down">
          Sign-in isn&apos;t configured on this deployment yet — see{" "}
          <code className="font-mono text-[12px]">DEPLOYMENT.md</code>.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-md bg-down/10 px-3 py-2 text-[12.5px] text-down">
          {error}
        </p>
      )}
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
