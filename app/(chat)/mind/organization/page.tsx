import { and, desc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { AppShell } from "@/components/mind/app-shell";
import { ensureUserIdByEmail, getPublishedOrganizationPrograms, db } from "@/lib/db/queries";
import { organizationAppreciation, organizationDayProgress, organizationMembership, organizationUpdate, program, programRun, programVersion, user } from "@/lib/db/schema";
import { getAssignedOrganizationProgramIds, resolveOrganizationEntitlements } from "@/lib/organizations/access";
import { EmployeeOrganizationWorkspace, type PersonalProgramResult } from "./employee-organization-workspace";

export const dynamic = "force-dynamic";
const TRAILING_SLASH = /\/$/;

function todayInUlaanbaatar() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ulaanbaatar", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function currentDay(startDate: string | undefined, today: string) {
  if (!startDate) return 1;
  return Math.max(1, Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000) + 1);
}

export default async function OrganizationPage() {
  const session = await auth();
  if (!session?.user?.email || session.user.type === "guest") redirect("/login?callbackUrl=/mind/organization");
  const userId = await ensureUserIdByEmail(session.user.email);
  const access = await resolveOrganizationEntitlements(userId);
  if (!access) redirect("/");
  const [eligiblePrograms, assignedProgramIds] = await Promise.all([
    getPublishedOrganizationPrograms(access.membership.organizationRole, access.contract.durationMonths),
    getAssignedOrganizationProgramIds(access.organization.id, access.contract.id, access.membership.id),
  ]);
  const programs = assignedProgramIds ? eligiblePrograms.filter((item) => assignedProgramIds.has(item.id)) : eligiblePrograms;
  const today = todayInUlaanbaatar();
  const dayCards = programs.flatMap((item) => {
    const config = item.definition.organization;
    const dayNumber = currentDay(config?.startDate, today);
    const day = config?.days.find((candidate) => candidate.dayNumber === dayNumber);
    return day ? [{ id: item.id, slug: item.slug, title: item.definition.title, dayNumber, blocks: day.blocks }] : [];
  });
  const initialProgramIds = new Set(programs.flatMap((item) => item.definition.organization?.initialAssessmentProgramIds ?? []));
  const finalProgramIds = new Set(programs.flatMap((item) => item.definition.organization?.finalAssessmentProgramIds ?? []));
  const dailyProgramIds = new Set(dayCards.map((item) => item.id));
  const initialPrograms = programs.filter((item) => initialProgramIds.has(item.id)).map((item) => ({ id: item.id, slug: item.slug, title: item.definition.title }));
  const finalPrograms = programs.filter((item) => finalProgramIds.has(item.id)).map((item) => ({ id: item.id, slug: item.slug, title: item.definition.title }));
  const optionalPrograms = programs.filter((item) => !dailyProgramIds.has(item.id) && !initialProgramIds.has(item.id) && !finalProgramIds.has(item.id)).map((item) => ({ id: item.id, slug: item.slug, title: item.definition.title }));
  const [progressRows, appreciations, updates, completedRuns, teamMembers] = await Promise.all([
    dayCards.length ? db.select({ programId: organizationDayProgress.programId, dayNumber: organizationDayProgress.dayNumber, responses: organizationDayProgress.responses, status: organizationDayProgress.status }).from(organizationDayProgress).where(and(eq(organizationDayProgress.userId, userId), eq(organizationDayProgress.contractId, access.contract.id), inArray(organizationDayProgress.programId, dayCards.map((item) => item.id)))) : Promise.resolve([]),
    db.select({ id: organizationAppreciation.id, body: organizationAppreciation.body, createdAt: organizationAppreciation.createdAt, senderName: user.name }).from(organizationAppreciation).innerJoin(organizationMembership, eq(organizationMembership.id, organizationAppreciation.senderMembershipId)).innerJoin(user, eq(user.id, organizationMembership.userId)).where(and(eq(organizationAppreciation.recipientMembershipId, access.membership.id), eq(organizationAppreciation.organizationId, access.organization.id))).orderBy(desc(organizationAppreciation.createdAt)).limit(100),
    db.select({ id: organizationUpdate.id, body: organizationUpdate.body, createdAt: organizationUpdate.createdAt }).from(organizationUpdate).where(and(eq(organizationUpdate.organizationId, access.organization.id), eq(organizationUpdate.type, "EMPLOYEE_COMMUNICATION"))).orderBy(desc(organizationUpdate.createdAt)).limit(30),
    db.select({ title: programVersion.definition, result: programRun.result, completedAt: programRun.completedAt }).from(programRun).innerJoin(program, eq(program.id, programRun.programId)).innerJoin(programVersion, eq(programVersion.id, programRun.programVersionId)).where(and(eq(programRun.userId, userId), eq(programRun.organizationContractId, access.contract.id), eq(programRun.status, "COMPLETED"))).orderBy(desc(programRun.completedAt)).limit(100),
    db.select({ id: organizationMembership.id, name: user.name }).from(organizationMembership).innerJoin(user, eq(user.id, organizationMembership.userId)).where(and(eq(organizationMembership.organizationId, access.organization.id), eq(organizationMembership.status, "ACTIVE"))),
  ]);
  const cards = dayCards.map((item) => {
    const saved = progressRows.find((row) => row.programId === item.id && row.dayNumber === item.dayNumber);
    return { ...item, responses: (saved?.responses ?? {}) as Record<string, string | number | string[]>, completed: saved?.status === "COMPLETED" };
  });
  const personalResults: PersonalProgramResult[] = completedRuns.map((item) => {
    const definition = item.title as { title?: string };
    const result = item.result as { percent?: number; band?: { title?: string } };
    return { title: definition.title ?? "Хөтөлбөр", percent: typeof result.percent === "number" ? result.percent : null, bandTitle: result.band?.title ?? null, completedAt: item.completedAt?.toISOString() ?? null };
  });
  const marketingUrl = (process.env.MARKETING_URL ?? "https://oyunsanaa.com").replace(TRAILING_SLASH, "");
  return <AppShell backHref="/" title="Байгууллага" width="5xl"><EmployeeOrganizationWorkspace
    organizationName={access.organization.name}
    role={access.membership.organizationRole}
    sessionCredits={{ available: Number(access.sessionStats.available), reserved: Number(access.sessionStats.reserved), used: Number(access.sessionStats.used) }}
    chatGrant={access.chatGrant ? { endsAt: access.chatGrant.endsAt.toISOString() } : null}
    bookingHref={`${marketingUrl}/book?funding=organization`}
    initialPrograms={initialPrograms}
    dailyPrograms={cards}
    optionalPrograms={optionalPrograms}
    finalPrograms={finalPrograms}
    appreciations={appreciations.map((item) => ({ id: item.id, body: item.body, createdAt: item.createdAt.toISOString(), senderName: item.senderName ?? "Хамт олон" }))}
    updates={updates.map((item) => ({ id: item.id, body: item.body, createdAt: item.createdAt.toISOString() }))}
    personalResults={personalResults}
    teamMembers={teamMembers.filter((member) => member.id !== access.membership.id).map((member) => ({ id: member.id, name: member.name ?? "Хамт олон" }))}
  /></AppShell>;
}
