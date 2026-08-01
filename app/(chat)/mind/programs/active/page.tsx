import { Archive, BookOpen, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";
import {
  AppCard,
  AppShell,
  Badge,
  PageHero,
  SectionHeading,
} from "@/components/mind/app-shell";
import { getPublishedPrograms } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

const LEGACY_PROGRAM_ROUTES: Record<string, string> = {
  "life-balance-v1": "/mind/who-am-i/balance-test",
};

export default async function ActiveProgramsPage() {
  const programs = await getPublishedPrograms();

  return (
    <AppShell backHref="/" title="Сургалт (Хөтөлбөр)" width="4xl">
      <AppCard>
        <PageHero
          description="Өөрийгөө ойлгож, амьдралдаа хэрэгжүүлж болох сургалт, хөтөлбөрүүд"
          eyebrow={<Badge>Сургалтын жагсаалт</Badge>}
          icon="🎓"
          title="Сургалт, хөтөлбөрүүд"
        />

        <SectionHeading className="mb-3">Сургалтын жагсаалт</SectionHeading>
        {programs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 border-dashed px-4 py-10 text-center text-slate-500 text-sm">
            Одоогоор нийтлэгдсэн хөтөлбөр алга байна.
          </div>
        ) : (
          <div className="space-y-3">
            {programs.map((program) => {
              const legacyHref = program.legacyKey
                ? LEGACY_PROGRAM_ROUTES[program.legacyKey]
                : null;
              const href =
                program.renderer === "LEGACY" && legacyHref
                  ? legacyHref
                  : `/mind/programs/${program.slug}`;
              return (
                <Link
                  className="group flex items-center gap-3 rounded-2xl border p-4 transition-colors hover:bg-slate-50"
                  href={href}
                  key={program.id}
                >
                  <span
                    aria-hidden
                    className="grid size-11 shrink-0 place-items-center rounded-xl text-xl"
                    style={{
                      background: "rgba(31,111,178,0.1)",
                      color: "#1F6FB2",
                    }}
                  >
                    {program.definition.icon || <BookOpen className="size-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-sm">
                      {program.definition.title}
                    </span>
                    <span className="mt-1 block text-slate-500 text-xs leading-relaxed">
                      {program.definition.summary}
                    </span>
                    {program.definition.estimatedMinutes && (
                      <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="size-3" />
                        {program.definition.estimatedMinutes} минут
                      </span>
                    )}
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>
        )}

        <Link
          className="mt-3 flex items-center gap-3 rounded-2xl border border-dashed p-4 transition-colors hover:bg-slate-50"
          href="/mind/programs/archive"
        >
          <span
            aria-hidden
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600"
          >
            <Archive className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-sm">Архив</span>
            <span className="mt-1 block text-slate-500 text-xs">
              Өмнө бөглөсөн сургалтын үр дүн, тэмдэглэлүүд
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-slate-400" />
        </Link>
      </AppCard>
    </AppShell>
  );
}
