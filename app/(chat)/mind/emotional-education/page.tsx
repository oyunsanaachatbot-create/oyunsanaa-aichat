import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { AppCard, AppShell } from "@/components/mind/app-shell";
import { EDUCATION_CATEGORIES } from "@/lib/content/education-categories";

export const dynamic = "force-dynamic";

export default function EmotionalEducationPage() {
  return (
    <AppShell backHref="/" title="Сэтгэлийн боловсрол" width="4xl">
      <AppCard>
        <h2 className="mb-5 font-semibold text-lg text-slate-900">Өөрт ойр сэдвээ сонгоно уу</h2>

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
              Доорх {EDUCATION_CATEGORIES.length} сэдвээс сонгоход тухайн
              сэдэвтэй холбоотой хөтөлбөр, сургалт, тест, судалгаа болон
              нийтлэлийг нэг дор санал болгоно.
            </p>
          </div>
        </details>

        <div className="min-w-0">
          <div aria-hidden="true" className="grid grid-cols-[1.5rem_minmax(0,1fr)_minmax(6rem,0.55fr)] gap-3 border-slate-200 border-b pb-3 font-semibold text-slate-700 text-xs sm:grid-cols-[2rem_minmax(0,1fr)_minmax(8rem,0.55fr)] sm:gap-5">
            <span>№</span><span>Асуулт</span><span>Үндсэн чиглэл</span>
          </div>
          {EDUCATION_CATEGORIES.map((category) => (
            <Link
              className="grid grid-cols-[1.5rem_minmax(0,1fr)_minmax(6rem,0.55fr)] items-start gap-3 border-slate-100 border-b py-4 text-sm transition-colors hover:bg-blue-50/50 focus-visible:outline-blue-600 sm:grid-cols-[2rem_minmax(0,1fr)_minmax(8rem,0.55fr)] sm:gap-5"
              href={`/mind/emotional-education/${category.code}`}
              key={category.code}
            >
              <span className="text-slate-600">{category.number}</span>
              <span className="min-w-0 break-words font-semibold leading-6 text-slate-900">{category.question}</span>
              <span className="min-w-0 break-words leading-6 text-slate-600">{category.name}</span>
            </Link>
          ))}
        </div>
      </AppCard>
    </AppShell>
  );
}
