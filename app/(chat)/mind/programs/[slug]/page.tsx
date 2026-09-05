import { notFound, redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { AppShell } from "@/components/mind/app-shell";
import { ProgramRunner } from "@/components/mind/programs/program-runner";
import { ProgramPurchaseCard } from "@/components/mind/programs/program-purchase-card";
import {
  getProgramPurchase,
  getPublishedProgramBySlug,
} from "@/lib/db/queries";
import { canAccessOrganizationProgram, resolveOrganizationEntitlements } from "@/lib/organizations/access";

export const dynamic = "force-dynamic";

const LEGACY_PROGRAM_ROUTES: Record<string, string> = {
  "life-balance-v1": "/mind/who-am-i/balance-test",
};

function listHref(contentType: "PROGRAM" | "TRAINING" | "EMOTIONAL_EDUCATION") {
  if (contentType === "TRAINING") return "/mind/training";
  if (contentType === "EMOTIONAL_EDUCATION") return "/mind/emotional-education";
  return "/mind/programs/active";
}

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const program = await getPublishedProgramBySlug(slug);
  if (!program) notFound();

  if (program.audience === "ORGANIZATION") {
    if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(`/mind/programs/${slug}`)}`);
    const access = await resolveOrganizationEntitlements(session.user.id);
    if (!canAccessOrganizationProgram(access, program.organizationRoles)) notFound();
  }

  if (program.renderer === "LEGACY") {
    const href = program.legacyKey
      ? LEGACY_PROGRAM_ROUTES[program.legacyKey]
      : null;
    if (!href) notFound();
    redirect(href);
  }

  if (program.audience === "INDIVIDUAL" && program.price > 0 && !session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent(`/mind/programs/${slug}`)}`);
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
      <ProgramRunner slug={slug} />
    </AppShell>
  );
}
