import { auth } from "@/app/(auth)/auth";
import { ensureUserIdByEmail, extendUserSubscription } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

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
    return Response.json({
      ok: true,
      currentPeriodEnd: newEnd.toISOString(),
    });
  } catch (error) {
    console.error("Failed to activate subscription:", error);
    return new ChatSDKError(
      "bad_request:subscription",
      "Failed to activate subscription."
    ).toResponse();
  }
}
