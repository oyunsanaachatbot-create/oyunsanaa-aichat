import "server-only";
import { db, getUserSubscription } from "@/lib/db/queries";
import { sql } from "drizzle-orm";
import { resolveSubscription } from "@/lib/subscription/access";
import { resolveOrganizationEntitlements } from "@/lib/organizations/access";

/** Atomic across workers/replicas. Errors fail closed before any provider call. */
export async function consumeAnalysisBudget(userId: string) {
  const [subscription, organization] = await Promise.all([
    getUserSubscription(userId),
    resolveOrganizationEntitlements(userId),
  ]);
  if (
    (!subscription || !resolveSubscription(subscription).hasAccess) &&
    !organization?.chatGrant
  )
    return false;
  const result = await db.execute(sql`
    INSERT INTO public."AiAnalysisBudget" ("userId", day, requests)
    VALUES (${userId}::uuid, to_char(now() AT TIME ZONE 'Asia/Ulaanbaatar', 'YYYY-MM-DD'), 1)
    ON CONFLICT ("userId", day) DO UPDATE SET requests = "AiAnalysisBudget".requests + 1
      WHERE "AiAnalysisBudget".requests < 20
    RETURNING requests
  `);
  return result.length > 0;
}
