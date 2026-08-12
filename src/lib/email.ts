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

// On-brand HTML wrapper for transactional emails — same navy/blue palette as
// the site itself (see the --surface-0/--accent tokens in globals.css).
function layout(heading: string, body: string, cta: { label: string; url: string }): string {
  return `<!doctype html><html><body style="margin:0;background:#0d1b2a;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d1b2a;padding:32px 0"><tr><td align="center">
    <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#122333;border:1px solid #22374e;border-radius:16px">
      <tr><td style="padding:28px 32px 6px"><div style="font-size:20px;font-weight:700;color:#e9eef5;text-transform:uppercase;letter-spacing:0.02em">Riftbound<span style="color:#4da3ff">Stocks</span></div></td></tr>
      <tr><td style="padding:6px 32px 4px"><h1 style="margin:0;font-size:20px;color:#e9eef5">${heading}</h1></td></tr>
      <tr><td style="padding:8px 32px 16px;font-size:14px;line-height:1.6;color:#9eb0c4">${body}</td></tr>
      <tr><td style="padding:4px 32px 26px"><a href="${cta.url}" style="display:inline-block;background:#4da3ff;color:#08121e;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:10px">${cta.label}</a></td></tr>
      <tr><td style="padding:16px 32px 26px;border-top:1px solid #22374e;font-size:12px;color:#7c95a8">RiftboundStocks · Riftbound TCG price tracking.<br/>If you didn't request this, you can safely ignore this email.</td></tr>
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
