"use client";

import Link from "next/link";
import { ArrowLeft, MessageCircle, Sparkles } from "lucide-react";
import { BRAND } from "../test/constants";

export default function BalanceSummaryPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* brand tint blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute -top-40 left-[-10%] h-[520px] w-[520px] rounded-full blur-3xl"
          style={{ background: `rgba(${BRAND.rgb},0.18)` }}
        />
        <div
          className="absolute -top-20 right-[-15%] h-[460px] w-[460px] rounded-full blur-3xl"
          style={{ background: `rgba(${BRAND.rgb},0.14)` }}
        />
      </div>

      <main className="px-4 py-6 md:px-6 md:py-10 flex justify-center">
        <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white/85 backdrop-blur-2xl shadow-[0_24px_80px_rgba(15,23,42,0.10)] px-4 py-5 md:px-7 md:py-7 space-y-5">
          {/* top buttons */}
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/mind"  // ✅ 404-оос зайлсхийх түр буцах зам
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Буцах
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition"
            >
              <MessageCircle className="h-4 w-4" />
              Чат руу
            </Link>
          </div>

          {/* header */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border"
                style={{
                  borderColor: `rgba(${BRAND.rgb},0.30)`,
                  background: `rgba(${BRAND.rgb},0.10)`,
                }}
              >
                <Sparkles className="h-4 w-4" style={{ color: BRAND.hex }} />
              </span>

              <h1 className="text-lg sm:text-2xl font-semibold">
                Сэтгэлийн тэнцвэрээ шалгах тест
              </h1>
            </div>

            <p className="mt-2 text-sm text-slate-700 leading-relaxed">
              Энэ тест нь таны амьдралын 6 чиглэлийн “өнөөдрийн тэнцвэр”-ийг ерөнхийд нь харуулна.
              Оноо бага гарлаа гээд “муу хүн” гэсэн үг биш — харин аль хэсэгт илүү анхаарах вэ гэдгийг
              олж харахад тусална.
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Тэмдэглэл: Би эмч биш. Оношийг орлохгүй. Шаардлагатай бол мэргэжлийн тусламж аваарай.
            </p>
          </div>

          {/* actions */}
          <div className="grid gap-3">
            {/* ✅ ганц гол товч: Test руу */}
            <Link
              href="/mind/balance/test"
              className="w-full rounded-2xl py-3 text-center font-semibold text-white transition hover:opacity-95"
              style={{ backgroundColor: BRAND.hex }}
            >
              Тест эхлүүлэх
            </Link>

            {/* ✅ optional: сүүлчийн дүн байвал result руу */}
            <Link
              href="/mind/balance/result"
              className="w-full rounded-2xl py-3 text-center font-semibold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 transition"
            >
              Сүүлчийн дүнгээ харах
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
