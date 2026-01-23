"use client";

import Link from "next/link";
import { MessageCircle, Sparkles } from "lucide-react";

export default function BalanceIntroPage() {
  return (
    <div
      className="min-h-screen text-slate-50 overflow-x-hidden"
      style={{
        background:
          "radial-gradient(1200px 700px at 20% 0%, rgba(var(--brandRgb),0.55) 0%, rgba(2,8,22,1) 55%)",
      }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-48 left-[-15%] w-[520px] h-[520px] rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(var(--brandRgb),0.35)" }}
        />
        <div className="absolute bottom-[-35%] right-[-10%] w-[640px] h-[640px] rounded-full bg-slate-950/70 blur-3xl" />
      </div>

      <main className="relative z-10 px-4 py-8 md:px-6 md:py-12 flex justify-center">
        <div className="w-full max-w-3xl rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_24px_80px_rgba(15,23,42,0.9)] px-4 py-6 md:px-8 md:py-8 space-y-6">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-100/90">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 border border-white/30 shadow">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="truncate">Сэтгэлийн тэнцвэр</span>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/15 px-3.5 py-2 text-[11px] sm:text-xs font-medium text-slate-50 shadow-md backdrop-blur hover:bg-white/25 transition whitespace-nowrap"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Чат руу буцах</span>
              <span className="sm:hidden">Чат</span>
            </Link>
          </div>

          {/* Title */}
          <section className="space-y-3">
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-semibold leading-snug text-[#D5E2F7] drop-shadow-[0_0_16px_rgba(213,226,247,0.55)]">
              Сэтгэлийн тэнцвэрээ шалгах тест
            </h1>

            <p className="text-sm sm:text-base text-slate-100/90 leading-relaxed">
              “Сэтгэлийн тэнцвэр” гэдэг нь таны өдөр тутмын 6 үндсэн чиглэл
              (сэтгэл санаа, өөрийгөө ойлгох, харилцаа, зорилго/утга учир,
              өөрийгөө хайрлах, тогтвортой байдал)-д хэр тайван, тогтвортой
              байгааг харахад тусалдаг богино үнэлгээ юм.
            </p>

            <p className="text-sm sm:text-base text-slate-100/90 leading-relaxed">
              Та яг одоогийн байдлаа шалгаад, хаана нь илүү анхаарах хэрэгтэйгээ
              ойлгоорой.
            </p>
          </section>

          {/* Single button */}
          <div className="pt-2">
            <Link
              href="/mind/balance/test"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-white/35 bg-white/20 px-4 py-3 text-sm sm:text-base font-semibold text-white shadow-lg hover:bg-white/28 transition"
            >
              Тест эхлэх
            </Link>
          </div>

          <p className="text-xs text-slate-100/70">
            Та хүссэн үедээ энэ тестийг дахин хийж болно.
          </p>
        </div>
      </main>
    </div>
  );
}
