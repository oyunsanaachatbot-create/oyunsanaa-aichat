import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { ensureUserIdByEmail, db } from "@/lib/db/queries";
import { organizationActivityEvent, organizationAppreciation, organizationBlockRecipient, organizationBlockResponse, organizationMembership, organizationProgramBlock, organizationProgramEnrollment, organizationProgramInstance, user } from "@/lib/db/schema";
import { resolveOrganizationEntitlements } from "@/lib/organizations/access";
import { getGratitudeTarget, programDay, todayInUlaanbaatar } from "@/lib/organizations/instance-runtime";

const schema = z.object({ recipientMembershipId: z.string().uuid(), body: z.string().trim().min(1).max(1000), blockRecipientId: z.string().uuid().optional() });

function jsonError(error: string, status: number) { return NextResponse.json({ error }, { status, headers: { "Cache-Control": "private, no-store" } }); }

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || session.user.type === "guest") return jsonError("UNAUTHORIZED", 401);
  const userId = await ensureUserIdByEmail(session.user.email);
  const access = await resolveOrganizationEntitlements(userId);
  if (!access) return jsonError("ORGANIZATION_ACCESS_REQUIRED", 403);
  const messages = await db.select({ id: organizationAppreciation.id, body: organizationAppreciation.body, createdAt: organizationAppreciation.createdAt, senderName: user.name })
    .from(organizationAppreciation)
    .innerJoin(organizationMembership, eq(organizationMembership.id, organizationAppreciation.senderMembershipId))
    .innerJoin(user, eq(user.id, organizationMembership.userId))
    .where(and(eq(organizationAppreciation.recipientMembershipId, access.membership.id), eq(organizationAppreciation.organizationId, access.organization.id)))
    .orderBy(desc(organizationAppreciation.createdAt)).limit(100);
  return NextResponse.json({ messages }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email || session.user.type === "guest") return jsonError("UNAUTHORIZED", 401);
  const userId = await ensureUserIdByEmail(session.user.email);
  const access = await resolveOrganizationEntitlements(userId);
  if (!access) return jsonError("ORGANIZATION_ACCESS_REQUIRED", 403);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("INVALID_APPRECIATION", 400);
  if (parsed.data.recipientMembershipId === access.membership.id) return jsonError("CANNOT_SEND_TO_SELF", 400);
  const [recipient] = await db.select({ id: organizationMembership.id }).from(organizationMembership).where(and(
    eq(organizationMembership.id, parsed.data.recipientMembershipId),
    eq(organizationMembership.organizationId, access.organization.id),
    eq(organizationMembership.status, "ACTIVE")
  )).limit(1);
  if (!recipient) return jsonError("RECIPIENT_NOT_FOUND", 404);
  if (parsed.data.blockRecipientId) {
    const [assignment] = await db.select({ recipient: organizationBlockRecipient, block: organizationProgramBlock, instance: organizationProgramInstance })
      .from(organizationBlockRecipient)
      .innerJoin(organizationProgramBlock, eq(organizationProgramBlock.id, organizationBlockRecipient.blockId))
      .innerJoin(organizationProgramInstance, eq(organizationProgramInstance.id, organizationProgramBlock.instanceId))
      .innerJoin(organizationProgramEnrollment, and(eq(organizationProgramEnrollment.instanceId, organizationProgramInstance.id), eq(organizationProgramEnrollment.membershipId, organizationBlockRecipient.membershipId), eq(organizationProgramEnrollment.status, "ACTIVE")))
      .where(and(eq(organizationBlockRecipient.id, parsed.data.blockRecipientId), eq(organizationBlockRecipient.membershipId, access.membership.id), eq(organizationProgramInstance.organizationId, access.organization.id), eq(organizationProgramInstance.contractId, access.contract.id), eq(organizationProgramInstance.status, "ACTIVE"), eq(organizationProgramBlock.type, "GRATITUDE"))).limit(1);
    if (!assignment || assignment.block.publishState !== "PUBLISHED" || programDay(assignment.instance.startDate, todayInUlaanbaatar()) !== assignment.block.dayNumber) return jsonError("BLOCK_NOT_ASSIGNED", 404);
    const spotlight = await getGratitudeTarget(access.organization.id, assignment.block.dayNumber);
    if (!spotlight || spotlight.id !== parsed.data.recipientMembershipId) return jsonError("GRATITUDE_TARGET_MISMATCH", 422);
    const result = await db.transaction(async (tx) => {
      const [event] = await tx.insert(organizationActivityEvent).values({ instanceId: assignment.instance.id, blockId: assignment.block.id, recipientId: assignment.recipient.id, userId, dayNumber: assignment.block.dayNumber, type: "GRATITUDE_SENT", idempotencyKey: `gratitude:${assignment.recipient.id}` }).onConflictDoNothing().returning({ id: organizationActivityEvent.id });
      if (!event) return { alreadySubmitted: true };
      const [createdMessage] = await tx.insert(organizationAppreciation).values({ organizationId: access.organization.id, senderMembershipId: access.membership.id, recipientMembershipId: recipient.id, body: parsed.data.body }).returning({ id: organizationAppreciation.id });
      await tx.insert(organizationBlockResponse).values({ recipientId: assignment.recipient.id, value: true, status: "SUBMITTED", submittedAt: new Date() }).onConflictDoNothing();
      return { id: createdMessage.id, alreadySubmitted: false };
    });
    return NextResponse.json({ ok: true, ...result }, { status: result.alreadySubmitted ? 200 : 201, headers: { "Cache-Control": "private, no-store" } });
  }
  const [message] = await db.insert(organizationAppreciation).values({ organizationId: access.organization.id, senderMembershipId: access.membership.id, recipientMembershipId: recipient.id, body: parsed.data.body }).returning({ id: organizationAppreciation.id });
  return NextResponse.json({ ok: true, id: message.id }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}
