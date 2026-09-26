import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { ensureUserIdByEmail, getPublishedOrganizationPrograms } from "@/lib/db/queries";
import { db } from "@/lib/db/queries";
import { organizationDayProgress } from "@/lib/db/schema";
import { getAssignedOrganizationProgramIds, resolveOrganizationEntitlements } from "@/lib/organizations/access";
import { organizationDayBlockSchema } from "@/lib/programs/definition";

const responseSchema = z.union([z.string().max(8000), z.number().finite(), z.array(z.string().max(500)).max(20), z.boolean()]);
const saveSchema = z.object({ programId: z.string().uuid(), dayNumber: z.number().int().min(1).max(366), responses: z.record(z.string().max(64), responseSchema), complete: z.boolean() });

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "private, no-store" } });
}

function mongolianToday() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ulaanbaatar", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function dayIsOpen(startDate: string | undefined, dayNumber: number) {
  if (!startDate) return dayNumber === 1;
  const today = mongolianToday();
  if (today < startDate) return false;
  const daysSinceStart = Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000) + 1;
  return dayNumber === Math.max(1, daysSinceStart);
}

function validateResponses(blocks: z.infer<typeof organizationDayBlockSchema>[], responses: Record<string, unknown>, complete: boolean) {
  const responseBlocks = blocks.filter((block) => block.responseType !== "NONE");
  const allowed = new Set(responseBlocks.map((block) => block.id));
  if (Object.keys(responses).some((id) => !allowed.has(id))) return false;
  for (const block of responseBlocks) {
    const value = responses[block.id];
    if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
      if (complete && block.required) return false;
      continue;
    }
    if (block.responseType === "SCALE" && (typeof value !== "number" || value < 1 || value > 5)) return false;
    if (block.responseType === "TEXT" && typeof value !== "string") return false;
    if (block.responseType === "SINGLE_CHOICE" && (typeof value !== "string" || !block.options.includes(value))) return false;
    if (block.responseType === "MULTIPLE_CHOICE" && (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !block.options.includes(item)))) return false;
  }
  return true;
}

async function getAuthorizedProgram(programId: string, dayNumber: number, membershipRole: string, durationMonths: number, assignedIds: Set<string> | null) {
  if (assignedIds && !assignedIds.has(programId)) return null;
  const programs = await getPublishedOrganizationPrograms(membershipRole, durationMonths);
  const found = programs.find((program) => program.id === programId);
  const day = found?.definition.organization?.days.find((item) => item.dayNumber === dayNumber);
  if (!found || !day || !dayIsOpen(found.definition.organization?.startDate, dayNumber)) return null;
  return { program: found, day };
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email || session.user.type === "guest") return jsonError("UNAUTHORIZED", 401);
  const userId = await ensureUserIdByEmail(session.user.email);
  const access = await resolveOrganizationEntitlements(userId);
  if (!access) return jsonError("ORGANIZATION_ACCESS_REQUIRED", 403);
  const parsed = saveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("INVALID_DAILY_RESPONSE", 400);
  const { programId, dayNumber, responses, complete } = parsed.data;
  const assignedIds = await getAssignedOrganizationProgramIds(access.organization.id, access.contract.id, access.membership.id);
  const authorized = await getAuthorizedProgram(programId, dayNumber, access.membership.organizationRole, access.contract.durationMonths, assignedIds);
  if (!authorized || !validateResponses(authorized.day.blocks, responses, complete)) return jsonError("INVALID_DAILY_RESPONSE", 400);
  const [existing] = await db.select().from(organizationDayProgress).where(and(
    eq(organizationDayProgress.contractId, access.contract.id),
    eq(organizationDayProgress.userId, userId),
    eq(organizationDayProgress.programId, programId),
    eq(organizationDayProgress.dayNumber, dayNumber)
  )).limit(1);
  if (existing?.status === "COMPLETED") return jsonError("DAY_ALREADY_COMPLETED", 409);
  const now = new Date();
  const values = { organizationId: access.organization.id, contractId: access.contract.id, userId, membershipId: access.membership.id, programId, dayNumber, responses, status: complete ? "COMPLETED" as const : "IN_PROGRESS" as const, completedAt: complete ? now : null, updatedAt: now };
  const [saved] = await db.insert(organizationDayProgress).values(values).onConflictDoUpdate({
    target: [organizationDayProgress.contractId, organizationDayProgress.userId, organizationDayProgress.programId, organizationDayProgress.dayNumber],
    set: { responses, status: values.status, completedAt: values.completedAt, updatedAt: now },
  }).returning({ id: organizationDayProgress.id, status: organizationDayProgress.status, completedAt: organizationDayProgress.completedAt });
  return NextResponse.json({ progress: saved }, { headers: { "Cache-Control": "private, no-store" } });
}
