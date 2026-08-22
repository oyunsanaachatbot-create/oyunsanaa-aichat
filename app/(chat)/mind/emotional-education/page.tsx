import { BookOpen, ChevronDown, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";
import { AppCard, AppShell, PageHero } from "@/components/mind/app-shell";
import { EDUCATION_CATEGORIES } from "@/lib/content/education-categories";
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

        <details className="group mb-4 rounded-xl border border-blue-100 bg-blue-50/50 p-3 sm:p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-[#1F6FB2] text-sm">
            Дэлгэрэнгүй
            <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-3 space-y-3 border-blue-100 border-t pt-3 text-slate-600 text-sm leading-relaxed">
            <p>
              Хүн бүхэн өөрийн гэсэн ертөнцтэй. Тэр ертөнцийг бодол, мэдрэмж,
              зан чанар, хүсэл, хэрэгцээ, харилцаа, эрүүл мэнд, ажил, санхүү,
              орчин болон туршлага бүрдүүлдэг.
            </p>
            <p>
              Өөрийн ертөнцөө танин мэдэх нь энэ бүхнийг илүү гүнзгий ойлгож,
              өөртөө таарсан сонголт хийх, өөрийгөө хайрлаж хамгаалах, амьдралаа
              өөрийнхөөрөө бүтээх боломжийг нэмэгдүүлнэ.
            </p>
            <p>
              Доорх 8 сэдвээс сонгоход тухайн сэдэвтэй холбоотой хөтөлбөр,
              сургалт, тест, судалгаа болон нийтлэлийг нэг дор санал болгоно.
            </p>
          </div>
        </details>

        <div className="space-y-2.5">
          {EDUCATION_CATEGORIES.map((category) => (
            <Link
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-blue-200 hover:bg-blue-50/30"
              href={`/mind/emotional-education/${category.code}`}
              key={category.code}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue-50 font-bold text-[#1F6FB2] text-xs">
                {category.code}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-slate-900 text-sm">
                  {category.name}
                </span>
                <span className="mt-0.5 block text-slate-500 text-xs">
                  {category.question}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>

        <h2 className="mt-6 mb-3 font-bold text-base text-slate-900 sm:text-lg">
          Сэтгэлийн боловсролын агуулгууд
        </h2>
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
