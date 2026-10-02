import "server-only";
import { and, asc, eq, inArray, lt } from "drizzle-orm";
import { db } from "@/lib/db/queries";
import {
  organizationActivityEvent,
  organizationAssessmentAssignment,
  organizationBlockRecipient,
  organizationBlockResponse,
  organizationMembership,
  organizationProgramBlock,
  organizationProgramEnrollment,
  organizationProgramInstance,
  program,
  programVersion,
  user,
} from "@/lib/db/schema";
import type { ContentPayload } from "./program-contract";

export function todayInUlaanbaatar(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ulaanbaatar", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function programDay(startDate: string, today: string) {
  return Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000) + 1;
}

export type OrganizationAccess = {
  organization: { id: string };
  contract: { id: string };
  membership: { id: string; employeeLevel: string; userId: string };
};

type EmployeeBlock = {
  id: string;
  recipientId: string;
  type: string;
  required: boolean;
  sortOrder: number;
  payload: ContentPayload;
  response: { value: unknown; status: string } | null;
  assessment: { slug: string; versionId: string; role: string } | null;
  gratitudeTarget: { id: string; name: string | null } | null;
};

type EmployeeDay = { instanceId: string; name: string; dayNumber: number; durationDays: number; blocks: EmployeeBlock[] };

export async function materializeDayRecipients(instanceId: string, dayNumber: number, organizationId: string) {
  const blocks = await db.select().from(organizationProgramBlock).where(and(
    eq(organizationProgramBlock.instanceId, instanceId), eq(organizationProgramBlock.dayNumber, dayNumber), inArray(organizationProgramBlock.publishState, ["PUBLISHED", "SUPERSEDED"])
  )).orderBy(asc(organizationProgramBlock.sortOrder));
  if (!blocks.length) return blocks;
  const members = await db.select({ id: organizationMembership.id, userId: organizationMembership.userId, employeeLevel: organizationMembership.employeeLevel, joinedAt: organizationMembership.joinedAt })
    .from(organizationMembership).where(and(eq(organizationMembership.organizationId, organizationId), eq(organizationMembership.status, "ACTIVE")));
  const spotlight = [...members].sort((left, right) => left.joinedAt.getTime() - right.joinedAt.getTime() || left.id.localeCompare(right.id))[(dayNumber - 1) % members.length];
  const [instance] = await db.select({ assignedMembershipId: organizationProgramInstance.assignedMembershipId, enrollmentMode: organizationProgramInstance.enrollmentMode }).from(organizationProgramInstance).where(eq(organizationProgramInstance.id, instanceId)).limit(1);
  if (instance?.enrollmentMode === "ALL" && members.length) await db.insert(organizationProgramEnrollment).values(members.filter((member) => !instance.assignedMembershipId || instance.assignedMembershipId === member.id).map((member) => ({ instanceId, membershipId: member.id }))).onConflictDoNothing();
  const enrolled = await db.select({ membershipId: organizationProgramEnrollment.membershipId }).from(organizationProgramEnrollment).where(and(eq(organizationProgramEnrollment.instanceId, instanceId), eq(organizationProgramEnrollment.status, "ACTIVE")));
  const enrolledIds = new Set(enrolled.map((row) => row.membershipId));
  for (const block of blocks) {
    if (block.publishState !== "PUBLISHED") continue;
    const completedEarlier = block.revision > 1 ? await db.select({ membershipId: organizationBlockRecipient.membershipId })
      .from(organizationBlockRecipient)
      .innerJoin(organizationProgramBlock, eq(organizationProgramBlock.id, organizationBlockRecipient.blockId))
      .innerJoin(organizationBlockResponse, eq(organizationBlockResponse.recipientId, organizationBlockRecipient.id))
      .where(and(eq(organizationProgramBlock.instanceId, instanceId), eq(organizationProgramBlock.slotId, block.slotId), eq(organizationProgramBlock.dayNumber, block.dayNumber), lt(organizationProgramBlock.revision, block.revision))) : [];
    const startedEarlier = block.revision > 1 ? await db.select({ membershipId: organizationBlockRecipient.membershipId })
      .from(organizationBlockRecipient)
      .innerJoin(organizationProgramBlock, eq(organizationProgramBlock.id, organizationBlockRecipient.blockId))
      .innerJoin(organizationAssessmentAssignment, eq(organizationAssessmentAssignment.recipientId, organizationBlockRecipient.id))
      .where(and(eq(organizationProgramBlock.instanceId, instanceId), eq(organizationProgramBlock.slotId, block.slotId), eq(organizationProgramBlock.dayNumber, block.dayNumber), lt(organizationProgramBlock.revision, block.revision), inArray(organizationAssessmentAssignment.status, ["STARTED", "COMPLETED"]))) : [];
    const completedIds = new Set([...completedEarlier, ...startedEarlier].map((row) => row.membershipId));
    const eligible = members.filter((member) => !completedIds.has(member.id) && enrolledIds.has(member.id) && (!instance?.assignedMembershipId || instance.assignedMembershipId === member.id) && block.audience.includes(member.employeeLevel) && (block.type !== "GRATITUDE" || member.id !== spotlight?.id));
    if (eligible.length) await db.insert(organizationBlockRecipient).values(eligible.map((member) => ({ blockId: block.id, membershipId: member.id, userId: member.userId }))).onConflictDoNothing();
  }
  return blocks;
}

export async function getGratitudeTarget(organizationId: string, dayNumber: number) {
  const members = await db.select({ id: organizationMembership.id, name: user.name }).from(organizationMembership)
    .innerJoin(user, eq(user.id, organizationMembership.userId))
    .where(and(eq(organizationMembership.organizationId, organizationId), eq(organizationMembership.status, "ACTIVE")))
    .orderBy(asc(organizationMembership.joinedAt), asc(organizationMembership.id));
  return members.length ? members[(dayNumber - 1) % members.length] : null;
}

export async function loadOrganizationToday(access: OrganizationAccess) {
  const today = todayInUlaanbaatar();
  const instances = await db.select().from(organizationProgramInstance).where(and(
    eq(organizationProgramInstance.organizationId, access.organization.id),
    eq(organizationProgramInstance.contractId, access.contract.id),
    eq(organizationProgramInstance.status, "ACTIVE")
  )).orderBy(asc(organizationProgramInstance.startDate));
  const cards: EmployeeDay[] = [];
  for (const instance of instances) {
    if (instance.assignedMembershipId && instance.assignedMembershipId !== access.membership.id) continue;
    const dayNumber = programDay(instance.startDate, today);
    if (dayNumber < 1 || dayNumber > instance.durationDays) continue;
    const blocks = await materializeDayRecipients(instance.id, dayNumber, instance.organizationId);
    const [enrollment] = await db.select({ id: organizationProgramEnrollment.id }).from(organizationProgramEnrollment).where(and(eq(organizationProgramEnrollment.instanceId, instance.id), eq(organizationProgramEnrollment.membershipId, access.membership.id), eq(organizationProgramEnrollment.status, "ACTIVE"))).limit(1);
    if (!enrollment) continue;
    if (!blocks.length) { cards.push({ instanceId: instance.id, name: instance.name, dayNumber, durationDays: instance.durationDays, blocks: [] }); continue; }
    const gratitudeTarget = blocks.some((block) => block.type === "GRATITUDE") ? await getGratitudeTarget(instance.organizationId, dayNumber) : null;
    const recipients = await db.select({ recipient: organizationBlockRecipient, response: organizationBlockResponse, assignment: organizationAssessmentAssignment })
      .from(organizationBlockRecipient)
      .leftJoin(organizationBlockResponse, eq(organizationBlockResponse.recipientId, organizationBlockRecipient.id))
      .leftJoin(organizationAssessmentAssignment, eq(organizationAssessmentAssignment.recipientId, organizationBlockRecipient.id))
      .where(and(eq(organizationBlockRecipient.membershipId, access.membership.id), inArray(organizationBlockRecipient.blockId, blocks.map((block) => block.id))));
    const byBlock = new Map(recipients.map((row) => [row.recipient.blockId, row]));
    const chosen = new Map<string, typeof blocks[number]>();
    const isEngaged = (blockId: string) => {
      const row = byBlock.get(blockId);
      return !!row?.response || row?.assignment?.status === "STARTED" || row?.assignment?.status === "COMPLETED";
    };
    for (const block of blocks) {
      const row = byBlock.get(block.id);
      if (!row) continue;
      const previous = chosen.get(block.slotId);
      if ((isEngaged(block.id) && (!previous || !isEngaged(previous.id) || block.revision > previous.revision))
        || (!previous && block.publishState === "PUBLISHED")
        || (previous && !isEngaged(previous.id) && block.publishState === "PUBLISHED")) chosen.set(block.slotId, block);
    }
    const visible: EmployeeBlock[] = [];
    for (const block of [...chosen.values()].sort((left, right) => left.sortOrder - right.sortOrder)) {
      const row = byBlock.get(block.id);
      if (!row) continue;
      const payload = block.payloadSnapshot as ContentPayload;
      let assessment: { slug: string; versionId: string; role: string } | null = null;
      const runtimeVersionId = block.type === "ASSESSMENT" ? payload.assessmentProgramVersionId : block.type === "PROGRAM" ? payload.linkedProgramVersionId : null;
      if (runtimeVersionId) {
        const [version] = await db.select({ id: programVersion.id, slug: program.slug, status: programVersion.status }).from(programVersion).innerJoin(program, eq(program.id, programVersion.programId)).where(eq(programVersion.id, runtimeVersionId)).limit(1);
        if (version) {
          await db.insert(organizationAssessmentAssignment).values({ recipientId: row.recipient.id, programVersionId: version.id, role: payload.assessmentRole ?? "REGULAR" }).onConflictDoNothing();
          assessment = { slug: version.slug, versionId: version.id, role: payload.assessmentRole ?? "REGULAR" };
        }
      }
      await db.insert(organizationActivityEvent).values({ instanceId: instance.id, blockId: block.id, recipientId: row.recipient.id, userId: access.membership.userId, dayNumber, type: "CONTENT_VIEWED", idempotencyKey: `view:${row.recipient.id}` }).onConflictDoNothing();
      visible.push({ id: block.id, recipientId: row.recipient.id, type: block.type, required: block.required, sortOrder: block.sortOrder, payload, response: row.response ? { value: row.response.value, status: row.response.status } : null, assessment, gratitudeTarget: block.type === "GRATITUDE" ? gratitudeTarget : null });
    }
    cards.push({ instanceId: instance.id, name: instance.name, dayNumber, durationDays: instance.durationDays, blocks: visible });
  }
  return cards;
}

export async function loadOwnProgramHistory(access: OrganizationAccess) {
  const instances = await db.select().from(organizationProgramInstance).where(and(eq(organizationProgramInstance.organizationId, access.organization.id), eq(organizationProgramInstance.contractId, access.contract.id)));
  if (!instances.length) return [];
  const blocks = await db.select({ block: organizationProgramBlock, instance: organizationProgramInstance, recipient: organizationBlockRecipient, response: organizationBlockResponse, assessment: organizationAssessmentAssignment })
    .from(organizationBlockRecipient)
    .innerJoin(organizationProgramBlock, eq(organizationProgramBlock.id, organizationBlockRecipient.blockId))
    .innerJoin(organizationProgramInstance, eq(organizationProgramInstance.id, organizationProgramBlock.instanceId))
    .leftJoin(organizationBlockResponse, eq(organizationBlockResponse.recipientId, organizationBlockRecipient.id))
    .leftJoin(organizationAssessmentAssignment, eq(organizationAssessmentAssignment.recipientId, organizationBlockRecipient.id))
    .where(and(eq(organizationBlockRecipient.membershipId, access.membership.id), inArray(organizationProgramBlock.instanceId, instances.map((item) => item.id))))
    .orderBy(asc(organizationProgramBlock.dayNumber), asc(organizationProgramBlock.sortOrder));
  const today = todayInUlaanbaatar();
  const visibleBlocks = blocks.filter((row) => programDay(row.instance.startDate, today) >= row.block.dayNumber);
  const versionIds = [...new Set(visibleBlocks.map((row) => {
    const payload = row.block.payloadSnapshot as ContentPayload;
    return row.block.type === "ASSESSMENT" ? payload.assessmentProgramVersionId : row.block.type === "PROGRAM" ? payload.linkedProgramVersionId : null;
  }).filter((id): id is string => !!id))];
  const versions = versionIds.length ? await db.select({ id: programVersion.id, slug: program.slug }).from(programVersion).innerJoin(program, eq(program.id, programVersion.programId)).where(inArray(programVersion.id, versionIds)) : [];
  const slugByVersion = new Map(versions.map((version) => [version.id, version.slug]));
  return visibleBlocks.map((row) => {
    const payload = row.block.payloadSnapshot as ContentPayload;
    const versionId = row.block.type === "ASSESSMENT" ? payload.assessmentProgramVersionId : row.block.type === "PROGRAM" ? payload.linkedProgramVersionId : null;
    const answer = row.block.type === "PERSONAL_QUESTION" && typeof row.response?.value === "string" ? payload.answerDirections?.find((item) => item.label === row.response?.value) : null;
    return { instanceId: row.instance.id, instanceName: row.instance.name, dayNumber: row.block.dayNumber, slotId: row.block.slotId, revision: row.block.revision, publishState: row.block.publishState, type: row.block.type, title: payload.title, status: row.response?.status ?? (row.assessment?.status === "STARTED" ? "IN_PROGRESS" : "AVAILABLE"), value: ["REFLECTION", "PERSONAL_QUESTION", "CHECK_IN"].includes(row.block.type) ? row.response?.value ?? null : null, resultDirection: answer?.directionId ?? null, runtimeSlug: versionId && row.assessment?.programRunId ? slugByVersion.get(versionId) ?? null : null, recipientId: row.recipient.id };
  });
}

export async function loadOwnInstanceSchedule(access: OrganizationAccess) {
  const instances = await db.select().from(organizationProgramInstance).where(and(eq(organizationProgramInstance.organizationId, access.organization.id), eq(organizationProgramInstance.contractId, access.contract.id), inArray(organizationProgramInstance.status, ["ACTIVE", "COMPLETED"]))).orderBy(asc(organizationProgramInstance.startDate));
  if (!instances.length) return [];
  const enrolled = await db.select({ instanceId: organizationProgramEnrollment.instanceId, status: organizationProgramEnrollment.status }).from(organizationProgramEnrollment).where(and(inArray(organizationProgramEnrollment.instanceId, instances.map((item) => item.id)), eq(organizationProgramEnrollment.membershipId, access.membership.id)));
  const byId = new Map(enrolled.map((item) => [item.instanceId, item.status]));
  return instances.filter((item) => (!item.assignedMembershipId || item.assignedMembershipId === access.membership.id) && (byId.get(item.id) === "ACTIVE" || (item.enrollmentMode === "ALL" && !byId.has(item.id)))).map((item) => ({ id: item.id, name: item.name, startDate: item.startDate, durationDays: item.durationDays, status: item.status }));
}
