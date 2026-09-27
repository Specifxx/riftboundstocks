import { prisma } from "@/lib/db";
import { ACCOUNTS_ENABLED, SITE_NAME } from "@/lib/site";

// One-click unsubscribe from a price-drop email — no login required, per
// CAN-SPAM/GDPR norms. The token identifies the account; clicking it removes
// EVERY watch for that account (not just the one card the email happened to
// carry the token from), since "unsubscribe" should mean "stop emailing me",
// not "un-watch one specific card".
//
// GET only CONFIRMS; the delete happens on POST. Mail providers' link
// scanners (Outlook Safe Links, corporate gateways) fetch every URL in an
// email, so a GET that deleted would unsubscribe people who never clicked.
// The POST also accepts RFC 8058 one-click unsubscribe from mail clients.
export const dynamic = "force-dynamic";

const INVALID = "That unsubscribe link isn't valid — it may already have been used.";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function page(inner: string, status = 200) {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<meta name="robots" content="noindex"><title>Unsubscribe — ${SITE_NAME}</title></head>` +
      `<body style="font-family:system-ui,sans-serif;background:#f3ead9;color:#281e14;display:grid;place-items:center;min-height:100vh;margin:0">` +
      `<div style="max-width:420px;text-align:center;padding:24px"><h1 style="font-size:20px">${SITE_NAME}</h1>${inner}` +
      `<p><a href="/" style="color:#0d6f61">Back to ${SITE_NAME} →</a></p></div></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

async function ownerOf(token: string) {
  if (!ACCOUNTS_ENABLED || !token) return null;
  return prisma.priceAlert.findUnique({ where: { unsubToken: token }, select: { userId: true } });
}

export async function GET(req: Request) {
  // No DATABASE_URL ⇒ no accounts and no PriceAlert rows, but the route can
  // still be hit directly (a bot, a stale bookmark) — fail into the same
  // "not valid" page rather than let Prisma throw a connection error.
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (!(await ownerOf(token))) return page(`<p>${INVALID}</p>`);
  return page(
    `<p>Stop all price-drop emails for this account?</p>` +
      `<form method="post"><input type="hidden" name="token" value="${escapeHtml(token)}">` +
      `<button type="submit" style="font:inherit;font-weight:600;padding:8px 16px;border-radius:6px;border:0;background:#0d6f61;color:#fff;cursor:pointer">Unsubscribe</button></form>`,
  );
}

export async function POST(req: Request) {
  let token = new URL(req.url).searchParams.get("token") ?? "";
  if (!token) {
    try {
      const form = await req.formData();
      token = String(form.get("token") ?? "");
    } catch {
      // Not a form post — fall through to "not valid".
    }
  }
  const row = await ownerOf(token);
  if (!row) return page(`<p>${INVALID}</p>`, 400);
  await prisma.priceAlert.deleteMany({ where: { userId: row.userId } });
  return page("<p>You've been unsubscribed from all price alerts on this account.</p>");
}
