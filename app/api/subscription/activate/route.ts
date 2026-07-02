import { auth } from "@/app/(auth)/auth";
import {
  ensureUserIdByEmail,
  extendUserSubscription,
  logPaymentTransaction,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import { logger, serializeError } from "@/lib/logger";

/**
 * TEMPORARY dev/manual activation.
 *
 * Extends the signed-in user's subscription by one period without going
 * through QPay. This stands in for the real checkout while QPay is disabled —
 * remove (or guard behind an admin check) once QPay payments are live.
 */
export async function POST() {
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
