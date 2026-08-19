import { BookOpen, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";
import { AppCard, AppShell, PageHero } from "@/components/mind/app-shell";
import { getPublishedPrograms } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function EmotionalEducationPage() {
  const lessons = await getPublishedPrograms("EMOTIONAL_EDUCATION");

  return (
    <AppShell backHref="/" title="Сэтгэлийн боловсрол" width="4xl">
      <AppCard>
        <PageHero
          description="Сэтгэл хөдлөлөө таньж, ойлгож, өдөр тутамдаа зөв удирдахад туслах агуулгууд"
          icon="🧠"
        />
        {lessons.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 border-dashed px-4 py-10 text-center text-slate-500 text-sm">
            Одоогоор нийтлэгдсэн агуулга алга байна.
          </div>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson) => (
              <Link
                className="group flex items-center gap-2.5 rounded-xl border p-3 transition-colors hover:bg-slate-50 sm:gap-3 sm:rounded-2xl sm:p-4"
                href={`/mind/programs/${lesson.slug}`}
                key={lesson.id}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-lg sm:size-11 sm:rounded-xl sm:text-xl">
                  {lesson.definition.icon || <BookOpen className="size-5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-sm">
                    {lesson.definition.title}
                  </span>
                  <span className="mt-1 block text-slate-500 text-xs leading-relaxed">
                    {lesson.definition.summary}
                  </span>
                  {lesson.definition.estimatedMinutes && (
                    <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="size-3" />{" "}
                      {lesson.definition.estimatedMinutes} минут
                    </span>
                  )}
                </span>
                <ChevronRight className="size-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        )}
      </AppCard>
    </AppShell>
  );
}
