import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  completeProgramRun,
  getActiveProgramRunBySlug,
  getAssignedRun,
  getOrCreateProgramRun,
  getProgramIdentityBySlug,
  getProgramPurchase,
  getPublishedProgramBySlug,
  getPublishedProgramByVersionId,
  saveProgramRun,
} from "@/lib/db/queries";
import type { ProgramResponses } from "@/lib/programs/definition";
import { recordContentUsage } from "@/lib/taxonomy/recommendations";
import { canAccessOrganizationProgram, getAssignedOrganizationProgramIds, resolveOrganizationEntitlements } from "@/lib/organizations/access";
import { attachAssessmentRun, getOrCreateAssignedRun, getOwnedAssessmentAssignment } from "@/lib/organizations/assessment-assignment";

const responseValueSchema = z.union([
  z.string().max(10_000),
  z.number().finite(),
  z.array(z.string().max(120)).max(100),
  z.boolean(),
]);

const saveSchema = z.object({
  mode: z.enum(["DRAFT", "COMPLETE"]),
  runId: z.string().uuid(),
  currentSectionId: z.string().min(1).max(64),
  responses: z.record(z.string().max(200), responseValueSchema),
  assignmentRecipientId: z.string().uuid().optional(),
});

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

async function bodyAsJson(request: Request) {
  const body = await request.text();
  if (body.length > 1_000_000) return null;
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id;

  const { slug } = await params;
  const assignmentRecipientId = new URL(request.url).searchParams.get("organizationAssignment");
  if (assignmentRecipientId && !z.string().uuid().safeParse(assignmentRecipientId).success) return NextResponse.json({ error: "invalid_assignment" }, { status: 400 });
  const organizationAccess = assignmentRecipientId && userId ? await resolveOrganizationEntitlements(userId) : null;
  const assignment = assignmentRecipientId && organizationAccess ? await getOwnedAssessmentAssignment(assignmentRecipientId, organizationAccess) : null;
  if (assignmentRecipientId && !assignment) return NextResponse.json({ error: "assignment_not_found" }, { status: 404 });
  const publishedProgram = assignment ? await getPublishedProgramByVersionId(assignment.assignment.programVersionId) : await getPublishedProgramBySlug(slug);
  if (!publishedProgram) return NextResponse.json({ error: "program_not_found" }, { status: 404 });
  if (publishedProgram.slug !== slug) return NextResponse.json({ error: "assignment_program_mismatch" }, { status: 404 });
  if (publishedProgram.renderer !== "BUILDER") return NextResponse.json({ error: "legacy_program" }, { status: 409 });
  const orgAccess = organizationAccess ?? (publishedProgram.audience === "ORGANIZATION" && userId ? await resolveOrganizationEntitlements(userId) : null);
  if (publishedProgram.audience === "ORGANIZATION" && !assignment && !canAccessOrganizationProgram(orgAccess, publishedProgram.organizationRoles, publishedProgram.organizationDurationMonths)) return NextResponse.json({ error: "organization_access_required" }, { status: 403 });
  const assignedPrograms = !assignment && orgAccess ? await getAssignedOrganizationProgramIds(orgAccess.organization.id, orgAccess.contract.id, orgAccess.membership.id) : null;
  if (!assignment && assignedPrograms && !assignedPrograms.has(publishedProgram.id)) return NextResponse.json({ error: "organization_program_not_assigned" }, { status: 403 });
  if (!userId && publishedProgram.audience === "INDIVIDUAL" && publishedProgram.price <= 0) {
    return NextResponse.json({ run: { id: randomUUID(), currentSectionId: publishedProgram.definition.sections[0]?.id ?? "", responses: {}, status: "IN_PROGRESS" }, definition: publishedProgram.definition, version: publishedProgram.version }, { headers: { "Cache-Control": "private, no-store" } });
  }
  if (!userId) return unauthorized();
  if (publishedProgram.audience === "INDIVIDUAL" && publishedProgram.price > 0) {
    const purchase = await getProgramPurchase(publishedProgram.id, userId);
    if (purchase?.status !== "PAID") return NextResponse.json({ error: "program_purchase_required" }, { status: 403 });
  }
  const active = !assignment ? await getActiveProgramRunBySlug({ slug, userId, organizationContractId: orgAccess?.contract.id }) : null;
  if (assignment?.assignment.programRunId && orgAccess) {
    const existing = await getAssignedRun(assignment.assignment.programRunId, userId, orgAccess.contract.id);
    if (existing) return NextResponse.json(existing, { headers: { "Cache-Control": "private, no-store" } });
  }
  if (assignment && assignmentRecipientId && orgAccess) {
    try {
      const runId = await getOrCreateAssignedRun(assignmentRecipientId, userId, orgAccess, publishedProgram);
      const assignedRun = runId ? await getAssignedRun(runId, userId, orgAccess.contract.id) : null;
      return assignedRun ? NextResponse.json(assignedRun, { headers: { "Cache-Control": "private, no-store" } }) : NextResponse.json({ error: "assignment_run_conflict" }, { status: 409 });
    } catch {
      return NextResponse.json({ error: "run_load_failed" }, { status: 500 });
    }
  }
  if (active) {
    await recordContentUsage({
      sourceId: active.run.programId,
      state: "STARTED",
      userId,
    }).catch(() => {
      // Usage tracking must never block loading a program.
    });
    return NextResponse.json(active, {
      headers: { "Cache-Control": "private, no-store" },
    });
  }
  try {
    const data = await getOrCreateProgramRun({ publishedProgram, userId, organizationId: orgAccess?.organization.id, organizationContractId: orgAccess?.contract.id });
    await recordContentUsage({
      sourceId: publishedProgram.id,
      state: "STARTED",
      userId,
    }).catch(() => {
      // Usage tracking must never block loading a program.
    });
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ error: "run_load_failed" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id;

  const parsed = saveSchema.safeParse(await bodyAsJson(request));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_run" }, { status: 400 });
  }

  const { slug } = await params;
  const program = await getProgramIdentityBySlug(slug);
  if (!program || program.renderer !== "BUILDER" || program.status !== "PUBLISHED") {
    return NextResponse.json({ error: "program_not_found" }, { status: 404 });
  }
  const { currentSectionId, mode, responses, runId, assignmentRecipientId } = parsed.data;
  const organizationAccess = program.audience === "ORGANIZATION" && userId ? await resolveOrganizationEntitlements(userId) : null;
  const assignment = assignmentRecipientId && organizationAccess ? await getOwnedAssessmentAssignment(assignmentRecipientId, organizationAccess) : null;
  if (assignmentRecipientId && (!assignment || assignment.assignment.programRunId !== runId)) return NextResponse.json({ error: "assignment_not_found" }, { status: 404 });
  if (program.audience === "ORGANIZATION" && !assignment && !canAccessOrganizationProgram(organizationAccess, program.organizationRoles, program.organizationDurationMonths)) return NextResponse.json({ error: "organization_access_required" }, { status: 403 });
  const assignedPrograms = !assignment && organizationAccess ? await getAssignedOrganizationProgramIds(organizationAccess.organization.id, organizationAccess.contract.id, organizationAccess.membership.id) : null;
  if (!assignment && assignedPrograms && !assignedPrograms.has(program.id)) return NextResponse.json({ error: "organization_program_not_assigned" }, { status: 403 });
  if (!userId && program.audience === "INDIVIDUAL" && program.price <= 0) {
    return NextResponse.json({ run: { id: runId, currentSectionId, responses, status: mode === "COMPLETE" ? "COMPLETED" : "IN_PROGRESS" } });
  }
  if (!userId) return unauthorized();
  if (program.audience === "INDIVIDUAL" && program.price > 0) {
    const purchase = await getProgramPurchase(program.id, userId);
    if (purchase?.status !== "PAID") return NextResponse.json({ error: "program_purchase_required" }, { status: 403 });
  }

  try {
    if (mode === "DRAFT") {
      const saved = await saveProgramRun({
        currentSectionId,
        id: runId,
        programId: program.id,
        responses: responses as ProgramResponses,
        userId,
        organizationContractId: organizationAccess?.contract.id,
      });
      if (!saved) {
        return NextResponse.json({ error: "run_not_found" }, { status: 404 });
      }
      return NextResponse.json({ run: saved.run });
    }

    const completed = await completeProgramRun({
      id: runId,
      programId: program.id,
      responses: responses as ProgramResponses,
      userId,
      organizationContractId: organizationAccess?.contract.id,
    });
    if (!completed) {
      return NextResponse.json({ error: "run_not_found" }, { status: 404 });
    }
    if (completed.status === "MISSING") {
      return NextResponse.json(
        { error: "required_answers_missing", missing: completed.missing },
        { status: 400 }
      );
    }
    if (assignment && assignmentRecipientId && organizationAccess) await attachAssessmentRun(assignmentRecipientId, completed.run.id, userId, organizationAccess);
    await recordContentUsage({
      completed: true,
      sourceId: program.id,
      state: "COMPLETED",
      userId,
    }).catch(() => {
      // Completion remains valid if analytics storage is unavailable.
    });
    return NextResponse.json({ run: completed.run, result: completed.result });
  } catch {
    return NextResponse.json({ error: "run_save_failed" }, { status: 500 });
  }
}
