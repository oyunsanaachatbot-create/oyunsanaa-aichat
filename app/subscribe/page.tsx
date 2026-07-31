import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { ensureUserIdByEmail, getUserSubscription } from "@/lib/db/queries";
import { resolveSubscription } from "@/lib/subscription/access";
import { PRICE_MNT } from "@/lib/subscription/config";
import { isQpayConfigured } from "@/lib/qpay/client";
import { SubscribeView } from "./subscribe-view";

export const dynamic = "force-dynamic";

export default async function SubscribePage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/subscribe");
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

  return (
    <SubscribeView
      currentPeriodEnd={state.currentPeriodEnd?.toISOString() ?? null}
      daysLeft={state.daysLeft}
      hasAccess={state.hasAccess}
      inTrial={state.inTrial}
      priceMnt={PRICE_MNT}
      qpayConfigured={isQpayConfigured()}
      status={state.status}
      trialEndsAt={state.trialEndsAt.toISOString()}
    />
  );
}
