import { runPriceAlerts } from "@/lib/price-alerts";
import { ACCOUNTS_ENABLED } from "@/lib/site";

// Daily price-drop check — see vercel.json for the schedule. Protected by
// CRON_SECRET so the endpoint can't be triggered by anyone who guesses the
// path; Vercel Cron sets this header automatically when CRON_SECRET is
// configured as a project env var (https://vercel.com/docs/cron-jobs).
//
// force-dynamic: without it, a deployment with no CRON_SECRET never reads the
// request, so Next treats this GET as static — it would run the alert job once
// during `next build` and serve that cached response to every later cron call.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret && process.env.VERCEL_ENV === "production") {
    // Open in production would let anyone trigger (and spam) the digest run.
    console.error("[cron/price-alerts] CRON_SECRET is not set — refusing to run. Add it in Vercel's env vars.");
    return Response.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // No DATABASE_URL ⇒ there are no accounts and therefore no alerts to check —
  // return early rather than let Prisma throw a connection error (this also
  // keeps `next build`'s route-check pass quiet in an environment with no DB).
  if (!ACCOUNTS_ENABLED) {
    return Response.json({ ok: true, alerts: 0, drops: 0, emails: 0, updated: 0, note: "accounts not configured" });
  }

  try {
    const summary = await runPriceAlerts();
    return Response.json({ ok: true, ...summary });
  } catch (e) {
    console.error("[cron/price-alerts] failed:", e);
    return Response.json({ ok: false, error: "Alert run failed." }, { status: 500 });
  }
}
