import { auth } from "@/app/(auth)/auth";
import {
  ensureUserIdByEmail,
  extendUserSubscription,
  logPaymentTransaction,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import { logger, serializeError } from "@/lib/logger";
import { isQpayConfigured } from "@/lib/qpay/client";

/**
 * TEMPORARY dev/manual activation.
 *
 * Extends the signed-in user's subscription by one period without going
 * through QPay. This stands in for the real checkout while QPay is disabled.
 * Self-disables the moment QPay env vars are set (see isQpayConfigured), so
 * it can never be used to skip payment once real checkout is live — remove
 * this route entirely once QPay has been live for a while.
 */
export async function POST() {
  if (isQpayConfigured()) {
    return new ChatSDKError(
      "bad_request:subscription",
      "Manual activation is disabled once QPay is configured."
    ).toResponse();
  }

  const session = await auth();
  if (!session?.user?.email) {
    return new ChatSDKError("unauthorized:auth").toResponse();
  }

  const userId = await ensureUserIdByEmail(session.user.email);

  try {
    const newEnd = await extendUserSubscription(userId);
    await logPaymentTransaction({
      event: "payment_confirmed",
      source: "activate",
      userId,
      message: `manual activation (no QPay), extended to ${newEnd.toISOString()}`,
    });
    logger.info("subscription_manual_activation", {
      userId,
      email: session.user.email,
      currentPeriodEnd: newEnd.toISOString(),
    });
    return Response.json({
      ok: true,
      currentPeriodEnd: newEnd.toISOString(),
    });
  } catch (error) {
    await logger.error("subscription_activate_failed", {
      userId,
      error: serializeError(error),
    });
    return new ChatSDKError(
      "bad_request:subscription",
      "Failed to activate subscription."
    ).toResponse();
  }
}
