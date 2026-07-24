/**
 * Subscription / free-trial configuration.
 *
 * Plan: 1-day free trial, then a monthly payment to keep using the AI chat.
 * QPay charges in MNT, so the price is configured in MNT (overridable via env).
 */

/** Length of the free trial, in days. */
export const TRIAL_DAYS = 1;

/** Length of one paid subscription period, in days. */
export const PERIOD_DAYS = 30;

/**
 * Actual amount charged through QPay, in MNT.
 * Temporarily defaults to 10₮ for live QPay flow testing.
 * Set SUBSCRIPTION_PRICE_MNT back to the production price after testing.
 */
export const PRICE_MNT = Number(process.env.SUBSCRIPTION_PRICE_MNT ?? 10);

export const CURRENCY = "MNT";

export type SubscriptionStatus = "trialing" | "active" | "expired";
