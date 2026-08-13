import { SITE_NAME, SITE_URL } from "./site";

// Send a transactional email via Resend's REST API. Requires RESEND_API_KEY (and
// ideally a verified sender in EMAIL_FROM) to actually deliver; otherwise it
// no-ops and logs, so the rest of the app keeps working without email configured.
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[email] RESEND_API_KEY not set — "${subject}" to ${to} was NOT sent.`);
    return false;
  }
  // onboarding@resend.dev (Resend's shared test sender) only delivers to the
  // Resend account owner — set EMAIL_FROM to an address on a domain you've
  // verified with Resend once you want this to reach real users.
  const from = process.env.EMAIL_FROM ?? `${SITE_NAME} <onboarding@resend.dev>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) console.warn(`[email] Resend returned ${res.status} for "${subject}".`);
    return res.ok;
  } catch (e) {
    console.warn("[email] send failed:", e);
    return false;
  }
}

// ── Price-drop alerts ─────────────────────────────────────────────────────────
// A digest needs a table of rows and an unsubscribe-specific footer, hence its
// own shell rather than a shared single-CTA layout() — this is the only kind
// of transactional email the app sends now that accounts are Google/Discord
// OAuth only (verification/reset emails were removed along with the
// email/password sign-in path they served).
//
// Email clients don't support CSS custom properties, so these hex values are a
// hand-kept copy of the light "arcane parchment" tokens in globals.css
// (--surface-0/--accent/etc) — email always renders the light theme, since
// there is no reliable dark-mode signal to key off across clients.

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export interface PriceDropItem {
  name: string;
  setCode: string;
  collectorLabel: string;
  url: string; // absolute card-page link
  oldCents: number;
  newCents: number;
}

function emailShell(heading: string, inner: string, footer: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f3ead9;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3ead9;padding:32px 0"><tr><td align="center">
    <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#fdfaf4;border:1px solid #d6c9b0;border-radius:16px">
      <tr><td style="padding:28px 32px 6px"><div style="font-size:20px;font-weight:700;color:#281e14;text-transform:uppercase;letter-spacing:0.02em">Riftbound<span style="color:#0d6f61">Stocks</span></div></td></tr>
      <tr><td style="padding:6px 32px 4px"><h1 style="margin:0;font-size:20px;color:#281e14">${heading}</h1></td></tr>
      ${inner}
      ${footer}
    </table></td></tr></table></body></html>`;
}

function alertFooter(unsubUrl: string): string {
  return `<tr><td style="padding:16px 32px 26px;border-top:1px solid #d6c9b0;font-size:12px;color:#7a6a52">
    You're getting this because you set an alert on ${SITE_NAME}.<br/>
    <a href="${unsubUrl}" style="color:#5c4e3a;text-decoration:underline">Unsubscribe from price alerts</a> · ${SITE_NAME}</td></tr>`;
}

function dropRow(item: PriceDropItem): string {
  const pct = item.oldCents > 0 ? Math.round(((item.oldCents - item.newCents) / item.oldCents) * 100) : 0;
  return `<tr><td style="padding:12px 0;border-bottom:1px solid #d6c9b0">
    <a href="${item.url}" style="color:#281e14;font-weight:700;text-decoration:none;font-size:15px">${item.name}</a>
    <div style="font-size:12px;color:#7a6a52;margin-top:2px">${item.setCode} · ${item.collectorLabel}</div>
    <div style="margin-top:6px;font-size:14px;color:#5c4e3a">
      <span style="color:#7a6a52;text-decoration:line-through">${formatMoney(item.oldCents)}</span>
      &nbsp;→&nbsp;<span style="color:#0d6f61;font-weight:700">${formatMoney(item.newCents)}</span>
      ${pct > 0 ? `&nbsp;<span style="background:#e3f0ec;color:#1b7a3d;font-size:12px;font-weight:700;padding:2px 8px;border-radius:999px">-${pct}%</span>` : ""}
    </div>
  </td></tr>`;
}

// The daily "a card you're watching got cheaper" digest — one email per
// subscriber listing every card that dropped since the last check.
export async function sendPriceDropEmail(to: string, items: PriceDropItem[], unsubUrl: string): Promise<boolean> {
  const count = items.length;
  const heading = count === 1 ? "A watched card just got cheaper" : `${count} watched cards just got cheaper`;
  const intro = `Good news — ${count === 1 ? "a card you're watching" : "some cards you're watching"} dropped in price:`;
  const inner = `
    <tr><td style="padding:8px 32px 4px;font-size:14px;line-height:1.6;color:#5c4e3a">${intro}</td></tr>
    <tr><td style="padding:4px 32px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items.map(dropRow).join("")}</table></td></tr>
    <tr><td style="padding:4px 32px 24px"><a href="${SITE_URL}/interests" style="display:inline-block;background:#0d6f61;color:#ffffff;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:10px">See today's movers</a></td></tr>`;
  const subject = count === 1 ? `Price drop: ${items[0]!.name} is now ${formatMoney(items[0]!.newCents)}` : `Price drops on ${count} of your watched cards`;
  return sendEmail(to, subject, emailShell(heading, inner, alertFooter(unsubUrl)));
}
