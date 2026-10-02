import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { db, ensureUserIdByEmail } from "@/lib/db/queries";
import { organizationActivityEvent, organizationAssessmentAssignment, organizationBlockRecipient, organizationBlockResponse, organizationProgramBlock, organizationProgramEnrollment, organizationProgramInstance } from "@/lib/db/schema";
import { resolveOrganizationEntitlements } from "@/lib/organizations/access";
import { materializeDayRecipients, programDay, todayInUlaanbaatar } from "@/lib/organizations/instance-runtime";

const schema = z.object({ instanceId: z.string().uuid() });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email || session.user.type === "guest") return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const userId = await ensureUserIdByEmail(session.user.email);
  const access = await resolveOrganizationEntitlements(userId);
  if (!access) return NextResponse.json({ error: "ORGANIZATION_ACCESS_REQUIRED" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  const [instance] = await db.select().from(organizationProgramInstance).where(and(eq(organizationProgramInstance.id, parsed.data.instanceId), eq(organizationProgramInstance.organizationId, access.organization.id), eq(organizationProgramInstance.contractId, access.contract.id), eq(organizationProgramInstance.status, "ACTIVE"))).limit(1);
  if (!instance) return NextResponse.json({ error: "INSTANCE_NOT_FOUND" }, { status: 404 });
  const dayNumber = programDay(instance.startDate, todayInUlaanbaatar());
  if (dayNumber < 1 || dayNumber > instance.durationDays) return NextResponse.json({ error: "DAY_LOCKED" }, { status: 409 });
  await materializeDayRecipients(instance.id, dayNumber, instance.organizationId);
  const [enrollment] = await db.select({ id: organizationProgramEnrollment.id }).from(organizationProgramEnrollment).where(and(eq(organizationProgramEnrollment.instanceId, instance.id), eq(organizationProgramEnrollment.membershipId, access.membership.id), eq(organizationProgramEnrollment.status, "ACTIVE"))).limit(1);
  if (!enrollment) return NextResponse.json({ error: "INSTANCE_NOT_ASSIGNED" }, { status: 403 });
  const rows = await db.select({ block: organizationProgramBlock, recipient: organizationBlockRecipient, response: organizationBlockResponse, assessment: organizationAssessmentAssignment })
    .from(organizationBlockRecipient)
    .innerJoin(organizationProgramBlock, eq(organizationProgramBlock.id, organizationBlockRecipient.blockId))
    .leftJoin(organizationBlockResponse, eq(organizationBlockResponse.recipientId, organizationBlockRecipient.id))
    .leftJoin(organizationAssessmentAssignment, eq(organizationAssessmentAssignment.recipientId, organizationBlockRecipient.id))
    .where(and(eq(organizationBlockRecipient.membershipId, access.membership.id), eq(organizationProgramBlock.instanceId, instance.id), eq(organizationProgramBlock.dayNumber, dayNumber), inArray(organizationProgramBlock.publishState, ["PUBLISHED", "SUPERSEDED"])));
  const chosen = new Map<string, typeof rows[number]>();
  const engaged = (row: typeof rows[number]) => !!row.response || row.assessment?.status === "STARTED" || row.assessment?.status === "COMPLETED";
  for (const row of rows) {
    const previous = chosen.get(row.block.slotId);
    if ((engaged(row) && (!previous || !engaged(previous) || row.block.revision > previous.block.revision))
      || (!previous && row.block.publishState === "PUBLISHED")
      || (previous && !engaged(previous) && row.block.publishState === "PUBLISHED")) chosen.set(row.block.slotId, row);
  }
  const selectedRows = [...chosen.values()];
  const viewed = selectedRows.length ? await db.select({ recipientId: organizationActivityEvent.recipientId }).from(organizationActivityEvent)
    .where(and(inArray(organizationActivityEvent.recipientId, selectedRows.map((row) => row.recipient.id)), eq(organizationActivityEvent.type, "CONTENT_VIEWED"))) : [];
  const viewedIds = new Set(viewed.map((item) => item.recipientId));
  const missing = selectedRows.filter(({ block, recipient, response, assessment }) => {
    if (!block.required) return false;
    if (["WORD_PACK", "REMINDER", "MANAGER_MESSAGE"].includes(block.type)) return !viewedIds.has(recipient.id);
    if (block.type === "ASSESSMENT" || (block.type === "PROGRAM" && !!(block.payloadSnapshot as { linkedProgramVersionId?: string }).linkedProgramVersionId)) return assessment?.status !== "COMPLETED";
    return response?.status !== "SUBMITTED" && response?.status !== "COMPLETED";
  }).map(({ block }) => block.id);
  if (missing.length) return NextResponse.json({ error: "REQUIRED_BLOCKS_INCOMPLETE", missing }, { status: 409 });
  await db.insert(organizationActivityEvent).values({ instanceId: instance.id, userId, dayNumber, type: "DAY_COMPLETED", idempotencyKey: `day:${instance.id}:${access.membership.id}:${dayNumber}` }).onConflictDoNothing();
  return NextResponse.json({ completed: true, dayNumber }, { headers: { "Cache-Control": "private, no-store" } });
}
