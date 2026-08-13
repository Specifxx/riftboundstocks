// Delivery-channel abstraction for price alerts. Email is real (wraps
// lib/email.ts's Resend integration); SMS/Telegram/webhook are stubbed —
// each checks its own env var and, unconfigured, logs and returns false
// rather than pretending to send. runPriceAlerts() in lib/price-alerts.ts
// only calls the channels a user has actually enabled once account-level
// channel preferences exist (currently: email only, always on for a
// watched card — see the TODO(config) below for what per-channel opt-in
// would need).

import { sendPriceDropEmail, type PriceDropItem } from "@/lib/email";

export interface DeliveryChannel {
  readonly id: string;
  readonly label: string;
  readonly configured: boolean;
  /** `destination` is channel-specific: an email address, phone number, chat id, or webhook URL. */
  send(destination: string, items: PriceDropItem[], unsubUrl: string): Promise<boolean>;
}

export const emailChannel: DeliveryChannel = {
  id: "email",
  label: "Email",
  configured: !!process.env.RESEND_API_KEY,
  send: (to, items, unsubUrl) => sendPriceDropEmail(to, items, unsubUrl),
};

// TODO(config): SMS via Twilio. Set TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN /
// TWILIO_FROM_NUMBER, and add a `phone` column to User (there isn't one
// today — only email exists as a contact channel) before this can do
// anything but log.
export const smsChannel: DeliveryChannel = {
  id: "sms",
  label: "SMS",
  configured: !!process.env.TWILIO_ACCOUNT_SID,
  async send(to, items) {
    if (!this.configured) {
      console.warn(`[alerts] SMS channel not configured — "${items.length} price drop(s)" to ${to} was NOT sent.`);
      return false;
    }
    // Unreachable until TWILIO_ACCOUNT_SID is set.
    return false;
  },
};

// TODO(config): Telegram via a bot. Set TELEGRAM_BOT_TOKEN, and add a way for
// a user to link their chat id (e.g. a `/start` deep link that POSTs their
// chat id back to this site) before this can send anything — there is
// currently no per-user Telegram identity stored.
export const telegramChannel: DeliveryChannel = {
  id: "telegram",
  label: "Telegram",
  configured: !!process.env.TELEGRAM_BOT_TOKEN,
  async send(chatId, items) {
    if (!this.configured) {
      console.warn(`[alerts] Telegram channel not configured — "${items.length} price drop(s)" to ${chatId} was NOT sent.`);
      return false;
    }
    return false;
  },
};

// TODO(config): generic outbound webhook, for a user's own automation (a
// Discord/Slack incoming webhook, a Zapier catch hook, etc). No env var
// gates this one globally — it would be configured per-alert (a `webhookUrl`
// column on PriceAlert, which doesn't exist yet), since the whole point is
// pointing at a URL the user supplies rather than one this deployment owns.
export const webhookChannel: DeliveryChannel = {
  id: "webhook",
  label: "Webhook",
  configured: false,
  async send(url, items) {
    console.warn(`[alerts] Webhook channel not implemented — "${items.length} price drop(s)" to ${url} was NOT sent.`);
    return false;
  },
};

export const DELIVERY_CHANNELS: DeliveryChannel[] = [emailChannel, smsChannel, telegramChannel, webhookChannel];
