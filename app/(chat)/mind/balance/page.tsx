"use client";

import Link from "next/link";
import Image from "next/image";
import { MessageCircle } from "lucide-react";

export default function BalanceIntroPage() {
  return (
    <div
      className="min-h-screen text-slate-50 overflow-x-hidden"
      style={{
        background:
          "radial-gradient(1200px 700px at 20% 0%, rgba(var(--brandRgb),0.55) 0%, rgba(2,8,22,1) 55%)",
      }}
    >
      <main className="relative z-10 px-4 py-8 md:px-6 md:py-12 flex justify-center">
        <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_24px_80px_rgba(15,23,42,0.9)]">
          {/* Oyunsanaa зураг (баннер) */}
          <div className="relative h-[240px] sm:h-[300px] w-full">
            <Image
              src="/images/oyunsanaa.png"
              alt="Oyunsanaa"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>

          {/* Контент */}
          <div className="px-4 py-6 md:px-8 md:py-8 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs sm:text-sm text-white/85">
                Миний сэтгэлзүй · Сэтгэлийн тэнцвэр
              </div>

              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-3.5 py-2 text-[11px] sm:text-xs font-medium text-white hover:bg-white/25 transition"
              >
                <MessageCircle className="h-4 w-4" />
                Чат руу
              </Link>
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-3xl font-semibold text-[#D5E2F7] drop-shadow-[0_0_16px_rgba(213,226,247,0.35)]">
                Сайн байна уу, Оюунсанаа байна 😊
              </h1>

              <p className="text-sm sm:text-base text-white/85 leading-relaxed">
                <span className="font-semibold">Сэтгэлийн тэнцвэр</span> гэдэг нь таны амьдралын 6
                чиглэл дээр (сэтгэл санаа, өөрийгөө ойлгох, харилцаа, зорилго/утга учир,
                өөрийгөө хайрлах, тогтвортой байдал) өнөөдөр хэр тогтвортой байгааг
                харахад тусалдаг богино үнэлгээ юм.
              </p>

              <p className="text-sm sm:text-base text-white/85 leading-relaxed">
                Та өөрийнхөө тэнцвэрийг шалгаад, аль хэсгээ өдөр бүр бага багаар сайжруулах вэ гэдгээ
                ойлгоорой.
              </p>
            </div>

            {/* 1 товч */}
            <Link
              href="/mind/balance/test"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-white/35 bg-white/20 px-4 py-3 text-sm sm:text-base font-semibold text-white shadow-lg hover:bg-white/28 transition"
            >
              Тест эхлэх
            </Link>

            <p className="text-xs text-white/65">
              * Хүссэн үедээ хэдэн ч удаа энэ тестийг дахин хийж болно.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
