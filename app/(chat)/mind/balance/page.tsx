"use client";

import Link from "next/link";
import Image from "next/image";

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
          <div className="relative h-[220px] sm:h-[280px] w-full">
            <Image
              src="/images/oyunsanaa.jpg" // ✅ энд өөрийнхөө зургийн замыг тавина
              alt="Oyunsanaa"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-transparent" />
          </div>

          {/* Контент */}
          <div className="px-4 py-6 md:px-8 md:py-8 space-y-5">
            {/* Мэндчилгээ */}
            <div className="space-y-2">
              <div className="text-lg sm:text-2xl font-semibold text-[#D5E2F7] drop-shadow-[0_0_16px_rgba(213,226,247,0.35)]">
                Сайн байна уу, Оюунсанаа байна 😊
              </div>
              <p className="text-sm sm:text-base text-white/85 leading-relaxed">
                Энэ хэсэгт бид <span className="font-semibold">“Сэтгэлийн тэнцвэр”</span> гэж юуг хэлдэг,
                өнөөдрийн таны байдал 6 чиглэл дээр хэр тогтвортой байгааг
                <span className="font-semibold"> богино тестээр</span> шалгана.
              </p>
              <p className="text-sm sm:text-base text-white/85 leading-relaxed">
                Та хүссэн үедээ хэдэн ч удаа хийж болно. Хариу нь шууд <span className="font-semibold">Дүгнэлт</span> дээр
                илүү ойлгомжтойгоор гарна.
              </p>
            </div>

            {/* Эхлэх товч (ганц) */}
            <Link
              href="/mind/balance/test"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-white/35 bg-white/20 px-4 py-3 text-sm sm:text-base font-semibold text-white shadow-lg hover:bg-white/28 transition"
            >
              Эхлэх
            </Link>

            <p className="text-xs text-white/65">
              * Тест рүү орохгүйгээр шууд дүгнэлтээ дараа нь харж болно.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
