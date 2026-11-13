import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { db, ensureUserIdByEmail } from "@/lib/db/queries";
import { organizationActivityEvent, organizationAssessmentAssignment, organizationBlockRecipient, organizationBlockResponse, organizationProgramBlock, organizationProgramEnrollment, organizationProgramInstance } from "@/lib/db/schema";
import { resolveOrganizationEntitlements } from "@/lib/organizations/access";
import { programDay, todayInUlaanbaatar } from "@/lib/organizations/instance-runtime";
import { validateEmployeeValue } from "@/lib/organizations/response-validation";
import type { ContentPayload, OrganizationContentType } from "@/lib/organizations/program-contract";

const saveSchema = z.object({ mode: z.enum(["DRAFT", "SUBMIT"]), value: z.unknown() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email || session.user.type === "guest") return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const userId = await ensureUserIdByEmail(session.user.email);
  const access = await resolveOrganizationEntitlements(userId);
  if (!access) return NextResponse.json({ error: "ORGANIZATION_ACCESS_REQUIRED" }, { status: 403 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "INVALID_BLOCK_ID" }, { status: 400 });
  const parsed = saveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  const [row] = await db.select({ block: organizationProgramBlock, instance: organizationProgramInstance, recipient: organizationBlockRecipient })
    .from(organizationBlockRecipient)
    .innerJoin(organizationProgramBlock, eq(organizationProgramBlock.id, organizationBlockRecipient.blockId))
    .innerJoin(organizationProgramInstance, eq(organizationProgramInstance.id, organizationProgramBlock.instanceId))
    .innerJoin(organizationProgramEnrollment, and(eq(organizationProgramEnrollment.instanceId, organizationProgramInstance.id), eq(organizationProgramEnrollment.membershipId, organizationBlockRecipient.membershipId), eq(organizationProgramEnrollment.status, "ACTIVE")))
    .where(and(eq(organizationProgramBlock.id, id), eq(organizationBlockRecipient.membershipId, access.membership.id), eq(organizationBlockRecipient.userId, userId), eq(organizationProgramInstance.organizationId, access.organization.id), eq(organizationProgramInstance.contractId, access.contract.id), eq(organizationProgramInstance.status, "ACTIVE"), inArray(organizationProgramBlock.publishState, ["PUBLISHED", "SUPERSEDED"])))
    .limit(1);
  if (!row) return NextResponse.json({ error: "BLOCK_NOT_ASSIGNED" }, { status: 404 });
  if (programDay(row.instance.startDate, todayInUlaanbaatar()) !== row.block.dayNumber) return NextResponse.json({ error: "DAY_LOCKED" }, { status: 409 });
  if (row.block.publishState === "SUPERSEDED") {
    const [draft, assessment] = await Promise.all([
      db.select({ id: organizationBlockResponse.id }).from(organizationBlockResponse).where(eq(organizationBlockResponse.recipientId, row.recipient.id)).limit(1),
      db.select({ status: organizationAssessmentAssignment.status }).from(organizationAssessmentAssignment).where(eq(organizationAssessmentAssignment.recipientId, row.recipient.id)).limit(1),
    ]);
    if (!draft[0] && !["STARTED", "COMPLETED"].includes(assessment[0]?.status ?? "")) return NextResponse.json({ error: "BLOCK_REVISED" }, { status: 409 });
  }
  if (parsed.data.mode === "SUBMIT" && !validateEmployeeValue(row.block.type as OrganizationContentType, row.block.payloadSnapshot as ContentPayload, parsed.data.value)) return NextResponse.json({ error: "INVALID_RESPONSE" }, { status: 422 });
  const serialized = JSON.stringify(parsed.data.value);
  if (!serialized || serialized.length > 20_000) return NextResponse.json({ error: "RESPONSE_TOO_LARGE" }, { status: 413 });
  const saved = await db.transaction(async (tx) => {
    const now = new Date();
    const status = parsed.data.mode === "SUBMIT" ? (row.block.type === "TASK" || row.block.type === "TRAINING" || row.block.type === "AUDIO" ? "COMPLETED" : "SUBMITTED") : "DRAFT";
    const [created] = await tx.insert(organizationBlockResponse).values({ recipientId: row.recipient.id, value: parsed.data.value, status, submittedAt: status === "DRAFT" ? null : now, updatedAt: now }).onConflictDoNothing().returning();
    let response = created;
    if (!response) {
      const [updated] = await tx.update(organizationBlockResponse).set({ value: parsed.data.value, status, submittedAt: status === "DRAFT" ? null : now, updatedAt: now }).where(and(eq(organizationBlockResponse.recipientId, row.recipient.id), eq(organizationBlockResponse.status, "DRAFT"))).returning();
      response = updated;
    }
    if (!response) {
      const [existing] = await tx.select().from(organizationBlockResponse).where(eq(organizationBlockResponse.recipientId, row.recipient.id)).limit(1);
      return { response: existing, alreadySubmitted: true };
    }
    if (status !== "DRAFT") {
      const type = row.block.type === "SUGGESTION" ? "SUGGESTION_SELECTED" : status === "COMPLETED" ? row.block.type === "TASK" ? "TASK_COMPLETED" : "CONTENT_COMPLETED" : "RESPONSE_SUBMITTED";
      await tx.insert(organizationActivityEvent).values({ instanceId: row.instance.id, blockId: row.block.id, recipientId: row.recipient.id, userId, dayNumber: row.block.dayNumber, type, idempotencyKey: `submit:${row.recipient.id}` }).onConflictDoNothing();
    }
    return { response, alreadySubmitted: false };
  });
  return NextResponse.json({ status: saved.response?.status ?? "UNKNOWN", alreadySubmitted: saved.alreadySubmitted }, { headers: { "Cache-Control": "private, no-store" } });
}
