import { BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import {
  AppCard,
  AppShell,
  Badge,
  PageHero,
  SectionHeading,
} from "@/components/mind/app-shell";
import { BalanceExercise } from "@/components/mind/who-am-i/balance-exercise";
import { getCompletedProgramRuns } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function ProgramsArchivePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const results = await getCompletedProgramRuns(session.user.id);

  return (
    <AppShell
      backHref="/mind/programs/active"
      title="Контентын архив"
      width="4xl"
    >
      <div className="space-y-8">
        <AppCard>
          <PageHero
            description="Дуусгасан хөтөлбөр, сургалт, сэтгэлийн боловсролын үр дүнгээ дахин хараарай."
            eyebrow={<Badge>Миний түүх</Badge>}
            icon="🗂️"
            title="Дуусгасан контентууд"
          />
          {results.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 border-dashed px-4 py-10 text-center text-slate-500 text-sm">
              Шинэ хөтөлбөрийн дууссан үр дүн алга байна.
            </div>
          ) : (
            <div className="space-y-3">
              {results.map(({ definition, run, version }) => {
                const result = run.result as {
                  percent?: number;
                  band?: { title?: string };
                };
                return (
                  <Link
                    className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50"
                    href={`/mind/programs/archive/${run.id}`}
                    key={run.id}
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-xl">
                      {definition.icon || <BookOpen className="size-5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block text-sm">{definition.title}</b>
                      <span className="mt-1 block text-slate-500 text-xs">
                        {run.completedAt
                          ? new Intl.DateTimeFormat("mn-MN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(run.completedAt)
                          : "Дууссан"}
                        {typeof result.percent === "number"
                          ? ` · ${result.percent}%`
                          : ""}
                        {result.band?.title ? ` · ${result.band.title}` : ""} ·
                        v{version}
                      </span>
                    </span>
                    <ChevronRight className="size-5 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                );
              })}
            </div>
          )}
        </AppCard>

        <div className="border-slate-200 border-t pt-8">
          <SectionHeading className="mb-4">
            Амьдралын тэнцвэрийн хуучин архив
          </SectionHeading>
          <BalanceExercise initialScreen="history" />
        </div>
      </div>
    </AppShell>
  );
}
