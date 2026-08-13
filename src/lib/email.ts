import { SITE_NAME, SITE_URL } from "./site";

export function isEmailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY;
}

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

// On-brand HTML wrapper for transactional emails — same near-black/mint-green
// palette as the site itself (see the --surface-0/--accent tokens in globals.css).
function layout(heading: string, body: string, cta: { label: string; url: string }): string {
  return `<!doctype html><html><body style="margin:0;background:#0b0e14;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0e14;padding:32px 0"><tr><td align="center">
    <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#0e1116;border:1px solid #252b38;border-radius:16px">
      <tr><td style="padding:28px 32px 6px"><div style="font-size:20px;font-weight:700;color:#e8eaee;text-transform:uppercase;letter-spacing:0.02em">Riftbound<span style="color:#34d17e">Stocks</span></div></td></tr>
      <tr><td style="padding:6px 32px 4px"><h1 style="margin:0;font-size:20px;color:#e8eaee">${heading}</h1></td></tr>
      <tr><td style="padding:8px 32px 16px;font-size:14px;line-height:1.6;color:#94a3b8">${body}</td></tr>
      <tr><td style="padding:4px 32px 26px"><a href="${cta.url}" style="display:inline-block;background:#34d17e;color:#060f0b;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:10px">${cta.label}</a></td></tr>
      <tr><td style="padding:16px 32px 26px;border-top:1px solid #252b38;font-size:12px;color:#64748b">RiftboundStocks · Riftbound TCG price tracking.<br/>If you didn't request this, you can safely ignore this email.</td></tr>
    </table></td></tr></table></body></html>`;
}

export async function sendVerificationEmail(to: string, token: string): Promise<boolean> {
  return sendEmail(
    to,
    `Confirm your ${SITE_NAME} email`,
    layout(
      "Confirm your email",
      "Thanks for signing up — confirm your email address to finish setting up your account.",
      { label: "Confirm email", url: `${SITE_URL}/verify?token=${encodeURIComponent(token)}` }
    )
  );
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
  return sendEmail(
    to,
    `Reset your ${SITE_NAME} password`,
    layout(
      "Reset your password",
      `We received a request to reset your ${SITE_NAME} password. This link expires in 1 hour.`,
      { label: "Reset password", url: `${SITE_URL}/reset?token=${encodeURIComponent(token)}` }
    )
  );
}

// ── Price-drop alerts ─────────────────────────────────────────────────────────
// A digest needs a table of rows and an unsubscribe-specific footer, which
// layout()'s single-CTA shape doesn't fit — same palette, more flexible frame.

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
  return `<!doctype html><html><body style="margin:0;background:#0b0e14;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0e14;padding:32px 0"><tr><td align="center">
    <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#0e1116;border:1px solid #252b38;border-radius:16px">
      <tr><td style="padding:28px 32px 6px"><div style="font-size:20px;font-weight:700;color:#e8eaee;text-transform:uppercase;letter-spacing:0.02em">Riftbound<span style="color:#34d17e">Stocks</span></div></td></tr>
      <tr><td style="padding:6px 32px 4px"><h1 style="margin:0;font-size:20px;color:#e8eaee">${heading}</h1></td></tr>
      ${inner}
      ${footer}
    </table></td></tr></table></body></html>`;
}

function alertFooter(unsubUrl: string): string {
  return `<tr><td style="padding:16px 32px 26px;border-top:1px solid #252b38;font-size:12px;color:#64748b">
    You're getting this because you set an alert on ${SITE_NAME}.<br/>
    <a href="${unsubUrl}" style="color:#94a3b8;text-decoration:underline">Unsubscribe from price alerts</a> · ${SITE_NAME}</td></tr>`;
}

function dropRow(item: PriceDropItem): string {
  const pct = item.oldCents > 0 ? Math.round(((item.oldCents - item.newCents) / item.oldCents) * 100) : 0;
  return `<tr><td style="padding:12px 0;border-bottom:1px solid #252b38">
    <a href="${item.url}" style="color:#e8eaee;font-weight:700;text-decoration:none;font-size:15px">${item.name}</a>
    <div style="font-size:12px;color:#64748b;margin-top:2px">${item.setCode} · ${item.collectorLabel}</div>
    <div style="margin-top:6px;font-size:14px;color:#94a3b8">
      <span style="color:#64748b;text-decoration:line-through">${formatMoney(item.oldCents)}</span>
      &nbsp;→&nbsp;<span style="color:#34d17e;font-weight:700">${formatMoney(item.newCents)}</span>
      ${pct > 0 ? `&nbsp;<span style="background:#132a1e;color:#3fb950;font-size:12px;font-weight:700;padding:2px 8px;border-radius:999px">-${pct}%</span>` : ""}
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
    <tr><td style="padding:8px 32px 4px;font-size:14px;line-height:1.6;color:#94a3b8">${intro}</td></tr>
    <tr><td style="padding:4px 32px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items.map(dropRow).join("")}</table></td></tr>
    <tr><td style="padding:4px 32px 24px"><a href="${SITE_URL}/interests" style="display:inline-block;background:#34d17e;color:#060f0b;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:10px">See today's movers</a></td></tr>`;
  const subject = count === 1 ? `Price drop: ${items[0]!.name} is now ${formatMoney(items[0]!.newCents)}` : `Price drops on ${count} of your watched cards`;
  return sendEmail(to, subject, emailShell(heading, inner, alertFooter(unsubUrl)));
}
