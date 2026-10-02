import "server-only";

import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { db, type PublishedProgram } from "@/lib/db/queries";
import {
  organizationActivityEvent, organizationAssessmentAssignment,
  organizationBlockRecipient, organizationBlockResponse,
  organizationProgramBlock, organizationProgramInstance, programRun,
  organizationProgramEnrollment,
} from "@/lib/db/schema";
import { programDay, todayInUlaanbaatar, type OrganizationAccess } from "./instance-runtime";

export async function getOwnedAssessmentAssignment(recipientId: string, access: OrganizationAccess) {
  const [row] = await db.select({
    assignment: organizationAssessmentAssignment,
    recipient: organizationBlockRecipient,
    block: organizationProgramBlock,
    instance: organizationProgramInstance,
  }).from(organizationAssessmentAssignment)
    .innerJoin(organizationBlockRecipient, eq(organizationBlockRecipient.id, organizationAssessmentAssignment.recipientId))
    .innerJoin(organizationProgramBlock, eq(organizationProgramBlock.id, organizationBlockRecipient.blockId))
    .innerJoin(organizationProgramInstance, eq(organizationProgramInstance.id, organizationProgramBlock.instanceId))
    .innerJoin(organizationProgramEnrollment, and(eq(organizationProgramEnrollment.instanceId, organizationProgramInstance.id), eq(organizationProgramEnrollment.membershipId, organizationBlockRecipient.membershipId), eq(organizationProgramEnrollment.status, "ACTIVE")))
    .where(and(
      eq(organizationBlockRecipient.id, recipientId),
      eq(organizationBlockRecipient.membershipId, access.membership.id),
      eq(organizationBlockRecipient.userId, access.membership.userId),
      eq(organizationProgramInstance.organizationId, access.organization.id),
      eq(organizationProgramInstance.contractId, access.contract.id),
      inArray(organizationProgramInstance.status, ["ACTIVE", "COMPLETED"]),
      inArray(organizationProgramBlock.publishState, ["PUBLISHED", "SUPERSEDED"]),
      inArray(organizationProgramBlock.type, ["ASSESSMENT", "PROGRAM"]),
    )).limit(1);
  if (!row) return null;
  if (row.block.publishState === "SUPERSEDED" && !row.assignment.programRunId) return null;
  // An assigned run remains available for resuming after its delivery day.
  const day = programDay(row.instance.startDate, todayInUlaanbaatar());
  if (day < row.block.dayNumber) return null;
  return row;
}

export async function getOrCreateAssignedRun(recipientId: string, userId: string, access: OrganizationAccess, publishedProgram: PublishedProgram) {
  const row = await getOwnedAssessmentAssignment(recipientId, access);
  if (!row || row.assignment.programVersionId !== publishedProgram.versionId) return null;
  const firstSectionId = publishedProgram.definition.sections[0]?.id;
  if (!firstSectionId) return null;
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT id FROM public."OrganizationAssessmentAssignment" WHERE id = ${row.assignment.id} FOR UPDATE`);
    const [current] = await tx.select({ programRunId: organizationAssessmentAssignment.programRunId })
      .from(organizationAssessmentAssignment).where(eq(organizationAssessmentAssignment.id, row.assignment.id)).limit(1);
    if (!current) return null;
    if (current.programRunId) return current.programRunId;
    const [run] = await tx.insert(programRun).values({
      userId, programId: publishedProgram.id, programVersionId: publishedProgram.versionId,
      currentSectionId: firstSectionId, responses: {}, result: {},
      organizationId: access.organization.id, organizationContractId: access.contract.id,
    }).returning({ id: programRun.id });
    if (!run) return null;
    await tx.update(organizationAssessmentAssignment).set({ programRunId: run.id, status: "STARTED" }).where(eq(organizationAssessmentAssignment.id, row.assignment.id));
    await tx.insert(organizationActivityEvent).values({
      instanceId: row.instance.id, blockId: row.block.id, recipientId, userId, dayNumber: row.block.dayNumber,
      type: row.block.type === "PROGRAM" ? "PROGRAM_STARTED" : "ASSESSMENT_STARTED",
      idempotencyKey: `runtime-start:${recipientId}`,
    }).onConflictDoNothing();
    return run.id;
  });
}

export async function attachAssessmentRun(recipientId: string, runId: string, userId: string, access: OrganizationAccess) {
  const row = await getOwnedAssessmentAssignment(recipientId, access);
  if (!row) return null;
  const [run] = await db.select().from(programRun).where(and(
    eq(programRun.id, runId), eq(programRun.userId, userId),
    eq(programRun.programVersionId, row.assignment.programVersionId),
    eq(programRun.organizationContractId, access.contract.id),
  )).limit(1);
  if (!run) return null;
  if (row.assignment.programRunId && row.assignment.programRunId !== run.id) return null;
  return db.transaction(async (tx) => {
    const [attached] = await tx.update(organizationAssessmentAssignment).set({ programRunId: run.id, status: run.status === "COMPLETED" ? "COMPLETED" : "STARTED" })
      .where(and(eq(organizationAssessmentAssignment.id, row.assignment.id), eq(organizationAssessmentAssignment.programVersionId, run.programVersionId), or(isNull(organizationAssessmentAssignment.programRunId), eq(organizationAssessmentAssignment.programRunId, run.id)))).returning({ id: organizationAssessmentAssignment.id });
    if (!attached) return null;
    if (run.status === "COMPLETED") {
      await tx.insert(organizationBlockResponse).values({ recipientId, value: { completed: true }, status: "COMPLETED", submittedAt: run.completedAt ?? new Date() }).onConflictDoNothing();
    }
    await tx.insert(organizationActivityEvent).values({
      instanceId: row.instance.id, blockId: row.block.id, recipientId,
      userId, dayNumber: row.block.dayNumber,
      type: run.status === "COMPLETED" ? row.block.type === "PROGRAM" ? "PROGRAM_COMPLETED" : "ASSESSMENT_COMPLETED" : row.block.type === "PROGRAM" ? "PROGRAM_STARTED" : "ASSESSMENT_STARTED",
      idempotencyKey: `${run.status === "COMPLETED" ? "runtime-complete" : "runtime-start"}:${recipientId}`,
    }).onConflictDoNothing();
    return row;
  });
}
