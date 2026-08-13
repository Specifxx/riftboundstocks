import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/ProfileActions";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "Profile", robots: { index: false, follow: true } };

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { googleId: true, discordId: true, createdAt: true },
  });

  const methods = [
    { label: "Google", on: !!account?.googleId },
    { label: "Discord", on: !!account?.discordId },
  ];

  return (
    <div className="mx-auto max-w-2xl py-6">
      <div className="panel flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt=""
              aria-hidden="true"
              className="h-14 w-14 rounded-full border border-line object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="grid h-14 w-14 place-items-center rounded-full bg-accent text-xl font-bold text-accent-ink">
              {user.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="font-display text-xl uppercase tracking-wide text-ink">{user.displayName}</h1>
            <p className="text-[13px] text-ink-muted">{user.email}</p>
          </div>
        </div>
        <LogoutButton />
      </div>

      <div className="panel mt-4 p-5">
        <h2 className="eyebrow">Account &amp; security</h2>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[13px]">
          <span className="text-ink-muted">Sign-in methods</span>
          <span className="flex gap-1.5">
            {methods.map((m) => (
              <span
                key={m.label}
                className={`rounded border px-1.5 py-0.5 text-[11px] font-semibold ${
                  m.on ? "border-line-strong text-ink" : "border-line text-ink-dim"
                }`}
              >
                {m.on ? "✓ " : ""}
                {m.label}
              </span>
            ))}
          </span>
        </div>
        <p className="mt-3 text-[12px] text-ink-dim">
          Link another provider to this account any time from the{" "}
          <Link href="/login" className="text-accent hover:underline">
            log in page
          </Link>{" "}
          — signing in with a different provider using this same email links it automatically.
        </p>
      </div>

      <p className="mt-4 text-center text-[12px] leading-relaxed text-ink-dim">
        {SITE_NAME} stores your email, display name and how you signed in — nothing else. See{" "}
        <Link href="/privacy" className="text-accent hover:underline">
          Privacy
        </Link>{" "}
        for the full account data this site holds.
      </p>
    </div>
  );
}
