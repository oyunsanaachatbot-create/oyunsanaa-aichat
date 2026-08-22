import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { AppCard, AppShell, PageHero } from "@/components/mind/app-shell";
import { EDUCATION_CATEGORIES } from "@/lib/content/education-categories";

export const dynamic = "force-dynamic";

export default function EmotionalEducationPage() {
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
      </AppCard>
    </AppShell>
  );
}
