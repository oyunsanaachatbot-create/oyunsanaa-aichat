import assert from "node:assert/strict";
import test from "node:test";
import { PERIOD_DAYS } from "./config";
import { extendPeriodEnd, resolveSubscription } from "./access";

const DAY_MS = 24 * 60 * 60 * 1000;

test("a successful payment grants the configured 30-day period", () => {
  const paidAt = new Date("2026-08-01T00:00:00.000Z");
  const periodEnd = extendPeriodEnd(null, paidAt);

  assert.equal(PERIOD_DAYS, 30);
  assert.equal(periodEnd.getTime() - paidAt.getTime(), 30 * DAY_MS);

  const nextDay = new Date(paidAt.getTime() + DAY_MS);
  const state = resolveSubscription(
    {
      trialStartedAt: new Date("2026-07-01T00:00:00.000Z"),
      subscriptionStatus: "active",
      currentPeriodEnd: periodEnd,
    },
    nextDay
  );

  assert.equal(state.status, "active");
  assert.equal(state.hasAccess, true);
  assert.equal(state.daysLeft, 29);
});

test("paying early stacks another full period from the existing end", () => {
  const now = new Date("2026-08-10T00:00:00.000Z");
  const existingEnd = new Date("2026-08-31T00:00:00.000Z");
  const extendedEnd = extendPeriodEnd(existingEnd, now);

  assert.equal(
    extendedEnd.toISOString(),
    new Date(existingEnd.getTime() + PERIOD_DAYS * DAY_MS).toISOString()
  );
});

test("access is derived from the paid end date, not a stale cached label", () => {
  const now = new Date("2026-08-02T00:00:00.000Z");
  const state = resolveSubscription(
    {
      trialStartedAt: new Date("2026-07-01T00:00:00.000Z"),
      subscriptionStatus: "expired",
      currentPeriodEnd: new Date("2026-08-31T00:00:00.000Z"),
    },
    now
  );

  assert.equal(state.status, "active");
  assert.equal(state.hasAccess, true);
});
