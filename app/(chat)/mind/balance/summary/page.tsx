// app/(chat)/mind/balance/summary/page.tsx
"use client";

import Link from "next/link";
import { ArrowLeft, MessageCircle, Sparkles } from "lucide-react";
import { BRAND } from "../test/constants";

export default function BalanceSummaryPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-[-10%] h-[520px] w-[520px] rounded-full blur-3xl"
             style={{ background: `rgba(${BRAND.rgb},0.18)` }} />
        <div className="absolute -top-20 right-[-15%] h-[460px] w-[460px] rounded-full blur-3xl"
             style={{ background: `rgba(${BRAND.rgb},0.14)` }} />
      </div>

      <main className="px-4 py-6 md:px-6 md:py-10 flex justify-center">
        <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.10)] px-4 py-5 md:px-7 md:py-7 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/mind/balance"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Буцах
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              <MessageCircle className="h-4 w-4" />
              Чат руу
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border"
                style={{ background: `rgba(${BRAND.rgb},0.10)`, borderColor: `rgba(${BRAND.rgb},0.25)` }}
              >
                <Sparkles className="h-4 w-4" style={{ color: BRAND.hex }} />
              </span>
              <h1 className="text-lg sm:text-2xl font-semibold text-slate-900">
                Дүгнэлт (энэ тест юу хэмждэг вэ?)
              </h1>
            </div>

            <p className="mt-2 text-sm text-slate-700 leading-relaxed">
              Энэ тест нь таны өнөөдрийн амьдралын <b>6 үндсэн чиглэл</b> хэр тэнцвэртэй байгааг өөрөө үнэлэхэд тусална.
              Энэ бол онош биш — харин “аль талдаа илүү анхаарах вэ?” гэдгийг тодруулах хялбар шалгалт юм.
            </p>
          </div>

          <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
            <p>
              <b>Сайн оноо</b> өндөр гарвал тухайн чиглэлд таны зуршил/орчин/ур чадвар харьцангуй тогтвортой байна гэсэн үг.
            </p>
            <p>
              <b>Бага оноо</b> гарвал “муу хүн” гэсэн үг огт биш — зүгээр л сүүлийн үед ачаалал их, эсвэл дэмжлэг/систем дутаж байгааг илтгэнэ.
            </p>
            <p>
              Хамгийн чухал нь: үр дүнгээ хараад <b>ганцхан жижиг алхам</b> сонгох. Жишээ нь: унтах цаг, алхалт, тэмдэглэл, хил хязгаар, санхүүгийн жижиг дүрэм, харилцааны 1 яриа гэх мэт.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/mind/balance/test"
              className="inline-flex items-center justify-center rounded-2xl text-white px-4 py-3 text-sm font-semibold hover:opacity-95 transition"
              style={{ backgroundColor: BRAND.hex }}
            >
              Тест эхлүүлэх
            </Link>

            <Link
              href="/mind/balance/result"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              Сүүлийн дүгнэлт харах
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
