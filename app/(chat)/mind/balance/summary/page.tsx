"use client";

import Link from "next/link";
import { ArrowLeft, MessageCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BalanceSummaryPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen relative overflow-x-hidden text-slate-50 bg-gradient-to-b from-[#04101f] via-[#071a33] to-[#020816]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-[-20%] w-[420px] h-[420px] rounded-full bg-cyan-400/25 blur-3xl" />
        <div className="absolute -top-40 right-[-10%] w-[360px] h-[360px] rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute bottom-[-30%] right-[-10%] w-[520px] h-[520px] rounded-full bg-blue-900/70 blur-3xl" />
      </div>

      <main className="relative z-10 px-4 py-6 md:px-6 md:py-10 flex justify-center">
        <div className="w-full max-w-3xl rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_24px_80px_rgba(15,23,42,0.9)] px-4 py-5 md:px-7 md:py-7 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-3.5 py-2 text-xs sm:text-sm text-slate-50 hover:bg-white/25 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Буцах
            </button>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-3.5 py-2 text-xs sm:text-sm text-slate-50 hover:bg-white/25 transition"
            >
              <MessageCircle className="h-4 w-4" />
              Чат руу
            </Link>
          </div>

          <div className="rounded-2xl border border-white/20 bg-[#1F6FB2]/25 backdrop-blur px-4 py-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 border border-white/25">
                <Sparkles className="h-4 w-4" />
              </span>
              <h1 className="text-lg sm:text-2xl font-semibold text-white">
                Дүгнэлт (энэ тест юу хэмждэг вэ?)
              </h1>
            </div>
            <p className="mt-2 text-sm text-white/85 leading-relaxed">
              Энэ тест нь таны өнөөдрийн амьдралын <b>6 үндсэн чиглэл</b> хэр тэнцвэртэй
              байгааг өөрөө үнэлэхэд тусална. Энэ бол онош биш — харин “аль талдаа
              илүү анхаарах вэ?” гэдгийг тодруулах хялбар шалгалт юм.
            </p>
          </div>

          <div className="space-y-3 text-sm text-white/85 leading-relaxed">
            <p>
              <b>Сайн оноо</b> өндөр гарвал тухайн чиглэлд таны зуршил/орчин/ур чадвар
              харьцангуй тогтвортой байна гэсэн үг.
            </p>
            <p>
              <b>Бага оноо</b> гарвал “муу хүн” гэсэн үг огт биш — зүгээр л сүүлийн үед
              ачаалал их, эсвэл дэмжлэг/систем дутаж байгааг илтгэнэ.
            </p>
            <p>
              Хамгийн чухал нь: үр дүнгээ хараад <b>ганцхан жижиг алхам</b> сонгох.
              Жишээ нь: унтах цаг, алхалт, тэмдэглэл, хил хязгаар, санхүүгийн жижиг дүрэм,
              харилцааны 1 яриа гэх мэт.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/mind/balance/test"
              className="inline-flex items-center justify-center rounded-2xl bg-white text-slate-900 px-4 py-3 text-sm font-semibold hover:bg-white/90 transition"
            >
              Тест бөглөх
            </Link>
            <Link
              href="/mind/balance/results"
              className="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-white/90 hover:bg-white/15 transition"
            >
              Үр дүн харах
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
