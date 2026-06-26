import { PERIOD_DAYS, type SubscriptionStatus, TRIAL_DAYS } from "./config";

const DAY_MS = 24 * 60 * 60 * 1000;

/** The subscription-relevant fields of a User row. */
export type SubscriptionRow = {
  trialStartedAt: Date | string | null;
  subscriptionStatus: SubscriptionStatus | null;
  currentPeriodEnd: Date | string | null;
};

export type SubscriptionState = {
  /** Resolved status, recomputed from dates (ignores the cached column). */
  status: SubscriptionStatus;
  /** When the free trial ends. */
  trialEndsAt: Date;
  /** End of the currently paid period, if any. */
  currentPeriodEnd: Date | null;
  /** Whether the user may currently use the chat. */
  hasAccess: boolean;
  /** True while still inside the free trial window. */
  inTrial: boolean;
  /** Whole days of access remaining (trial or paid), floored at 0. */
  daysLeft: number;
};

function toDate(value: Date | string | null): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

/**
 * Single source of truth for "can this user use the chat right now?".
 *
 * Access = inside the free trial OR inside a paid period. Everything else
 * (status label, days left) is derived so the UI and the API gate agree.
 */
export function resolveSubscription(
  row: SubscriptionRow,
  now: Date = new Date()
): SubscriptionState {
  const trialStart = toDate(row.trialStartedAt) ?? now;
  const trialEndsAt = new Date(trialStart.getTime() + TRIAL_DAYS * DAY_MS);
  const currentPeriodEnd = toDate(row.currentPeriodEnd);

  const inTrial = now < trialEndsAt;
  const isPaid = currentPeriodEnd !== null && now < currentPeriodEnd;
  const hasAccess = inTrial || isPaid;

  let status: SubscriptionStatus;
  if (isPaid) {
    status = "active";
  } else if (inTrial) {
    status = "trialing";
  } else {
    status = "expired";
  }

  // Days remaining on whichever window is active.
  const activeEnd = isPaid ? (currentPeriodEnd as Date) : trialEndsAt;
  const daysLeft = hasAccess
    ? Math.max(0, Math.ceil((activeEnd.getTime() - now.getTime()) / DAY_MS))
    : 0;

  return { status, trialEndsAt, currentPeriodEnd, hasAccess, inTrial, daysLeft };
}

/**
 * Compute the new `currentPeriodEnd` after a successful payment: extend from
 * the later of "now" or the existing period end, so paying early stacks time.
 */
export function extendPeriodEnd(
  existing: Date | string | null,
  now: Date = new Date()
): Date {
  const current = toDate(existing);
  const base = current && current > now ? current : now;
  return new Date(base.getTime() + PERIOD_DAYS * DAY_MS);
}
