import { auth } from "@/app/(auth)/auth";
import { ensureUserIdByEmail, getUserSubscription } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import { resolveSubscription } from "@/lib/subscription/access";
import { PRICE_MNT } from "@/lib/subscription/config";
import { isQpayConfigured } from "@/lib/qpay/client";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return new ChatSDKError("unauthorized:auth").toResponse();
  }

  const userId = await ensureUserIdByEmail(session.user.email);
  const sub = await getUserSubscription(userId);
  const state = resolveSubscription(
    sub ?? {
      trialStartedAt: new Date(),
      subscriptionStatus: "trialing",
      currentPeriodEnd: null,
    }
  );

  return Response.json({
    status: state.status,
    hasAccess: state.hasAccess,
    inTrial: state.inTrial,
    daysLeft: state.daysLeft,
    trialEndsAt: state.trialEndsAt.toISOString(),
    currentPeriodEnd: state.currentPeriodEnd?.toISOString() ?? null,
    priceMnt: PRICE_MNT,
    qpayConfigured: isQpayConfigured(),
  });
}
