import "server-only";
import { db } from "@/lib/db/queries";
import { sql } from "drizzle-orm";
export async function assignedMediaDefinitions(
  userId: string,
  programId: string
) {
  if (process.env.ORGANIZATION_FEATURE_ENABLED !== "true") return [];
  const rows =
    await db.execute(sql`SELECT v.definition FROM public."OrganizationAssessmentAssignment" a
JOIN public."OrganizationBlockRecipient" r ON r.id=a."recipientId"
JOIN public."OrganizationProgramBlock" b ON b.id=r."blockId"
JOIN public."OrganizationProgramInstance" i ON i.id=b."instanceId"
JOIN public."OrganizationProgramEnrollment" e ON e."instanceId"=i.id AND e."membershipId"=r."membershipId" AND e.status='ACTIVE'
JOIN public."OrganizationMembership" m ON m.id=r."membershipId" AND m."userId"=r."userId" AND m."organizationId"=i."organizationId" AND m.status='ACTIVE'
JOIN public."OrganizationContract" c ON c.id=i."contractId" AND c."organizationId"=i."organizationId" AND c.status='ACTIVE' AND c."startsAt"<=now() AND c."endsAt">now()
JOIN public."Organization" o ON o.id=i."organizationId" AND o.status='ACTIVE'
JOIN public."ProgramVersion" v ON v.id=a."programVersionId"
WHERE r."userId"=${userId}::uuid AND v."programId"=${programId}::uuid
AND i.status IN ('ACTIVE','COMPLETED') AND b.type IN ('PROGRAM','ASSESSMENT')
AND (i."assignedMembershipId" IS NULL OR i."assignedMembershipId"=m.id)
AND (b."publishState"='PUBLISHED' OR (b."publishState"='SUPERSEDED' AND a."programRunId" IS NOT NULL))
AND b."dayNumber" <= ((now() AT TIME ZONE 'Asia/Ulaanbaatar')::date - i."startDate"::date + 1)`);
  return rows.map((row) => row.definition as any);
}
