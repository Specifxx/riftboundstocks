import { prisma } from "@/lib/db";
import { ACCOUNTS_ENABLED, SITE_NAME } from "@/lib/site";

// One-click unsubscribe from a price-drop email — no login required, per
// CAN-SPAM/GDPR norms. The token identifies the account; clicking it removes
// EVERY watch for that account (not just the one card the email happened to
// carry the token from), since "unsubscribe" should mean "stop emailing me",
// not "un-watch one specific card".
export async function GET(req: Request) {
  const page = (message: string) =>
    new Response(
      `<!doctype html><html><head><meta charset="utf-8"><title>Unsubscribe — ${SITE_NAME}</title></head>` +
        `<body style="font-family:system-ui,sans-serif;background:#0d1b2a;color:#e9eef5;display:grid;place-items:center;height:100vh;margin:0">` +
        `<div style="max-width:420px;text-align:center;padding:24px"><h1 style="font-size:20px">${SITE_NAME}</h1><p>${message}</p>` +
        `<a href="/" style="color:#4da3ff">Back to ${SITE_NAME} →</a></div></body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );

  // No DATABASE_URL ⇒ no accounts, no PriceAlert rows, and this email was
  // never sent — but the route can still be hit directly (a bot, a stale
  // bookmark), so it needs to fail into the same "not valid" page rather than
  // let Prisma throw a raw connection error.
  if (!ACCOUNTS_ENABLED) return page("That unsubscribe link isn't valid — it may already have been used.");

  const token = new URL(req.url).searchParams.get("token") ?? "";
  const row = token ? await prisma.priceAlert.findUnique({ where: { unsubToken: token }, select: { userId: true } }) : null;

  if (!row) return page("That unsubscribe link isn't valid — it may already have been used.");

  await prisma.priceAlert.deleteMany({ where: { userId: row.userId } });
  return page("You've been unsubscribed from all price alerts on this account.");
}
