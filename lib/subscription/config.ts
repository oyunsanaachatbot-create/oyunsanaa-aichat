/**
 * Subscription / free-trial configuration.
 *
 * Plan: 1-day free trial, then 20$ / month to keep using the AI chat.
 * QPay charges in MNT, so the price is configured in MNT (overridable via env).
 */

/** Length of the free trial, in days. */
export const TRIAL_DAYS = 1;

/** Length of one paid subscription period, in days. */
export const PERIOD_DAYS = 30;

/** Nominal price in USD (display only). */
export const PRICE_USD = 20;

/**
 * Actual amount charged through QPay, in MNT.
 * 20$ ≈ 70,000₮ — override with SUBSCRIPTION_PRICE_MNT when the rate moves.
 */
export const PRICE_MNT = Number(process.env.SUBSCRIPTION_PRICE_MNT ?? 70000);

export const CURRENCY = "MNT";

export type SubscriptionStatus = "trialing" | "active" | "expired";
