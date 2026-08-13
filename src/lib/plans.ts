// Plan tiers. Scaffolding only — see the TODO(config) below for what's needed
// to take a payment. The tiers themselves are real and enforced (watchlist and
// alert caps below actually gate the routes that use them), the billing that
// would move a user between them is not.

export type PlanTier = "FREE" | "PLUS" | "PRO" | "STORE";
export const PLAN_TIERS: PlanTier[] = ["FREE", "PLUS", "PRO", "STORE"];

export interface PlanLimits {
  tier: PlanTier;
  label: string;
  priceUsdMonthly: number | null; // null = "Contact us" (STORE)
  maxAlerts: number | null; // null = unlimited
  maxWatchlist: number | null;
  historyDays: number | null; // null = full history
  csvImport: boolean;
  publicApi: boolean;
  blurb: string;
}

export const PLANS: Record<PlanTier, PlanLimits> = {
  FREE: {
    tier: "FREE",
    label: "Free",
    priceUsdMonthly: 0,
    maxAlerts: 5,
    maxWatchlist: 25,
    historyDays: 90,
    csvImport: false,
    publicApi: false,
    blurb: "Track prices, set a handful of alerts, and watch up to 25 cards.",
  },
  PLUS: {
    tier: "PLUS",
    label: "Plus",
    priceUsdMonthly: 4,
    maxAlerts: 50,
    maxWatchlist: 250,
    historyDays: null,
    csvImport: true,
    publicApi: false,
    blurb: "Unlimited history, CSV import, and room for a real collection.",
  },
  PRO: {
    tier: "PRO",
    label: "Pro",
    priceUsdMonthly: 12,
    maxAlerts: null,
    maxWatchlist: null,
    historyDays: null,
    csvImport: true,
    publicApi: true,
    blurb: "Unlimited alerts and watchlist, plus API access for your own tools.",
  },
  STORE: {
    tier: "STORE",
    label: "Store",
    priceUsdMonthly: null,
    maxAlerts: null,
    maxWatchlist: null,
    historyDays: null,
    csvImport: true,
    publicApi: true,
    blurb: "Bulk API access and inventory tooling for shops. Talk to us for pricing.",
  },
};

export function planLimits(tier: string | null | undefined): PlanLimits {
  return PLANS[(tier as PlanTier) ?? "FREE"] ?? PLANS.FREE;
}

// TODO(config): no payment processor is wired up. `User.planTier` can be set
// by hand (or via a future admin route) but nothing currently moves a user
// between tiers automatically. To go live:
//   1. Add a Stripe (or similar) account + STRIPE_SECRET_KEY / STRIPE_PRICE_*
//      env vars.
//   2. Add a checkout route that creates a Checkout Session for the selected
//      price and a webhook route that updates User.planTier on
//      checkout.session.completed / customer.subscription.deleted.
//   3. Wire the "Upgrade" buttons on /premium to the checkout route instead of
//      the current disabled state.
export const BILLING_CONFIGURED = !!process.env.STRIPE_SECRET_KEY;
