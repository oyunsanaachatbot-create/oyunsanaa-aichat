import { notFound, redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { AppShell } from "@/components/mind/app-shell";
import { ProgramRunner } from "@/components/mind/programs/program-runner";
import { ProgramPurchaseCard } from "@/components/mind/programs/program-purchase-card";
import {
  getProgramPurchase,
  getPublishedProgramBySlug,
  getPublishedProgramByVersionId,
} from "@/lib/db/queries";
import { canAccessOrganizationProgram, getAssignedOrganizationProgramIds, resolveOrganizationEntitlements } from "@/lib/organizations/access";
import { getOwnedAssessmentAssignment } from "@/lib/organizations/assessment-assignment";

export const dynamic = "force-dynamic";

const LEGACY_PROGRAM_ROUTES: Record<string, string> = {
  "life-balance-v1": "/mind/who-am-i/balance-test",
};

function listHref(contentType: "PROGRAM" | "TRAINING" | "EMOTIONAL_EDUCATION" | "ORGANIZATION_PROGRAM") {
  if (contentType === "ORGANIZATION_PROGRAM") return "/mind/organization";
  if (contentType === "TRAINING") return "/mind/training";
  if (contentType === "EMOTIONAL_EDUCATION") return "/mind/emotional-education";
  return "/mind/programs/active";
}

export default async function ProgramPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ organizationAssignment?: string }>;
}) {
  const { slug } = await params;
  const { organizationAssignment } = await searchParams;
  const session = await auth();
  const access = organizationAssignment && session?.user?.id ? await resolveOrganizationEntitlements(session.user.id) : null;
  const assignment = organizationAssignment && access ? await getOwnedAssessmentAssignment(organizationAssignment, access) : null;
  if (organizationAssignment && !assignment) notFound();
  const program = assignment ? await getPublishedProgramByVersionId(assignment.assignment.programVersionId) : await getPublishedProgramBySlug(slug);
  if (!program) notFound();
  if (program.slug !== slug) notFound();

  if (program.audience === "ORGANIZATION") {
    if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(`/mind/programs/${slug}`)}`);
    const orgAccess = access ?? await resolveOrganizationEntitlements(session.user.id);
    if (!assignment && !canAccessOrganizationProgram(orgAccess, program.organizationRoles, program.organizationDurationMonths)) notFound();
    const assignments = !assignment && orgAccess ? await getAssignedOrganizationProgramIds(orgAccess.organization.id, orgAccess.contract.id, orgAccess.membership.id) : null;
    if (!assignment && assignments && !assignments.has(program.id)) notFound();
  }

  if (program.renderer === "LEGACY") {
    const href = program.legacyKey
      ? LEGACY_PROGRAM_ROUTES[program.legacyKey]
      : null;
    if (!href) notFound();
    redirect(href);
  }

  if (
    program.audience === "INDIVIDUAL" &&
    (program.price > 0 || program.definition.deliveryMode === "DAILY") &&
    !session?.user?.id
  ) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/mind/programs/${slug}`)}`);
  }
  const purchase = program.audience === "INDIVIDUAL" && program.price > 0 && session?.user?.id ? await getProgramPurchase(program.id, session.user.id) : null;
  if (program.audience === "INDIVIDUAL" && program.price > 0 && purchase?.status !== "PAID") {
    return (
      <AppShell backHref={listHref(program.definition.contentType)} subtitle={program.definition.summary} title={program.definition.title} width="4xl">
        <ProgramPurchaseCard slug={slug} price={program.price} />
      </AppShell>
    );
  }

  return (
    <AppShell
      backHref={program.audience === "ORGANIZATION" ? "/mind/organization" : listHref(program.definition.contentType)}
      subtitle={program.definition.summary}
      title={program.definition.title}
      width="4xl"
    >
      <ProgramRunner assignmentRecipientId={organizationAssignment} slug={slug} />
    </AppShell>
  );
}
