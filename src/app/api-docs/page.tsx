import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "API",
  description: `Read-only public API for cards, prices and movers on ${SITE_NAME}. Pro and Store plans.`,
  alternates: { canonical: `${SITE_URL}/api-docs` },
};

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-lg border border-line bg-surface-2 p-3 font-mono text-[12px] leading-relaxed text-ink-muted">
      <code>{children}</code>
    </pre>
  );
}

export default function ApiDocsPage() {
  return (
    <div className="max-w-[72ch]">
      <p className="eyebrow text-accent">{SITE_NAME}</p>
      <h1 className="mt-1 font-display text-3xl uppercase tracking-wide text-ink sm:text-4xl">Public API</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
        Read-only access to the card catalogue, prices and movers — for your own tools, spreadsheets or bots. Requires
        an API key on a <strong className="font-semibold text-ink">Pro</strong> or{" "}
        <strong className="font-semibold text-ink">Store</strong> plan (see{" "}
        <Link href="/premium" className="text-accent hover:underline">
          Premium
        </Link>
        ). Create and manage keys from{" "}
        <Link href="/profile" className="text-accent hover:underline">
          your profile
        </Link>{" "}
        once signed in on an eligible plan. Full reference with example payloads lives in{" "}
        <code className="font-mono text-[13px] text-ink">docs/API.md</code> in the repository.
      </p>

      <h2 className="mt-6 font-display text-lg uppercase tracking-wide text-ink">Authenticating</h2>
      <p className="mt-1.5 text-[13px] text-ink-muted">Send your key as either header on every request:</p>
      <Code>{`x-api-key: rl_live_...\n# or\nAuthorization: Bearer rl_live_...`}</Code>

      <h2 className="mt-6 font-display text-lg uppercase tracking-wide text-ink">Endpoints</h2>
      <div className="mt-2 space-y-4">
        <div>
          <p className="font-mono text-[13px] font-semibold text-ink">GET /api/v1/cards</p>
          <p className="mt-1 text-[13px] text-ink-muted">
            The card catalogue. Filter with <code className="font-mono text-ink">set</code>,{" "}
            <code className="font-mono text-ink">domain</code>, <code className="font-mono text-ink">rarity</code>,{" "}
            <code className="font-mono text-ink">type</code>; paginate with{" "}
            <code className="font-mono text-ink">limit</code>/<code className="font-mono text-ink">offset</code>.
          </p>
        </div>
        <div>
          <p className="font-mono text-[13px] font-semibold text-ink">GET /api/v1/prices?slug=...</p>
          <p className="mt-1 text-[13px] text-ink-muted">
            One printing&apos;s latest quote, all-time high/low, foil multiplier and day/week/month deltas. Every price
            is integer cents and nullable — <code className="font-mono text-ink">null</code> means unpriced, never
            zero.
          </p>
        </div>
        <div>
          <p className="font-mono text-[13px] font-semibold text-ink">GET /api/v1/movers?series=market&amp;days=1</p>
          <p className="mt-1 text-[13px] text-ink-muted">
            Today&apos;s (or the last N days&apos;) biggest gainers/losers, the same computation{" "}
            <Link href="/interests" className="text-accent hover:underline">
              /interests
            </Link>{" "}
            renders. Returns empty lists with <code className="font-mono text-ink">hasChangeData: false</code> until
            two days of history exist — not an error.
          </p>
        </div>
      </div>

      <h2 className="mt-6 font-display text-lg uppercase tracking-wide text-ink">Rate limits</h2>
      <p className="mt-1.5 text-[13px] text-ink-muted">
        Per key, per minute: 200 requests to <code className="font-mono text-ink">/cards</code>, 300 to{" "}
        <code className="font-mono text-ink">/prices</code>, 60 to <code className="font-mono text-ink">/movers</code>.
        A <code className="font-mono text-ink">429</code> response includes a{" "}
        <code className="font-mono text-ink">Retry-After</code> header.
      </p>
    </div>
  );
}
