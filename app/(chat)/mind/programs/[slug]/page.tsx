import { notFound, redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { AppShell } from "@/components/mind/app-shell";
import { ProgramRunner } from "@/components/mind/programs/program-runner";
import {
  getActiveProgramRunBySlug,
  getPublishedProgramBySlug,
} from "@/lib/db/queries";

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
  if (!session?.user?.id) redirect("/login");
  const active = await getActiveProgramRunBySlug({
    slug,
    userId: session.user.id,
  });
  if (active) {
    return (
      <AppShell
        backHref={listHref(active.definition.contentType)}
        subtitle={active.definition.summary}
        title={active.definition.title}
        width="4xl"
      >
        <ProgramRunner slug={slug} />
      </AppShell>
    );
  }
  const program = await getPublishedProgramBySlug(slug);
  if (!program) notFound();

  if (program.renderer === "LEGACY") {
    const href = program.legacyKey
      ? LEGACY_PROGRAM_ROUTES[program.legacyKey]
      : null;
    if (!href) notFound();
    redirect(href);
  }

  return (
    <AppShell
      backHref={listHref(program.definition.contentType)}
      subtitle={program.definition.summary}
      title={program.definition.title}
      width="4xl"
    >
      <ProgramRunner slug={slug} />
    </AppShell>
  );
}
