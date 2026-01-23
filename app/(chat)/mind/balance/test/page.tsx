// app/(chat)/mind/balance/test/page.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle, ArrowLeft, BarChart3 } from "lucide-react";

import { BALANCE_SCALE, BRAND } from "./constants";
import { BALANCE_QUESTIONS } from "./questions";
import type { AnswersMap } from "./score";
import { calcScores } from "./score";

const LAST_KEY = "balance:lastResult";
const HISTORY_KEY = "balance:history";

export default function BalanceTestPage() {
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<AnswersMap>({});

  const answeredCount = useMemo(
    () => BALANCE_QUESTIONS.filter((q) => typeof answers[q.id] === "number").length,
    [answers]
  );

  const progress = Math.round((answeredCount / BALANCE_QUESTIONS.length) * 100);

  const onPick = (qid: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [qid]: value as any }));
  };

  const onSubmit = () => {
    const result = calcScores(answers);
    const payload = { answers, result, at: Date.now() };

    sessionStorage.setItem(LAST_KEY, JSON.stringify(payload));

    const prev = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    localStorage.setItem(HISTORY_KEY, JSON.stringify([payload, ...prev].slice(0, 50)));

    window.location.href = "/mind/balance/result";
  };

  return (
    <div
      className="min-h-screen text-slate-50"
      style={{
        // ✅ брэнд давамгай, хар руу “унгахгүй”
        background: `radial-gradient(1200px 600px at 50% -10%, rgba(255,255,255,0.18), rgba(255,255,255,0) 60%), ${BRAND.hex}`,
      }}
    >
      <main className="px-4 py-6 md:px-6 md:py-10 flex justify-center">
        <div className="w-full max-w-3xl rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_24px_80px_rgba(15,23,42,0.35)] px-4 py-5 md:px-7 md:py-7 space-y-5">
          {/* top buttons */}
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/mind/balance"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs text-slate-50 hover:bg-white/15 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Буцах
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs text-slate-50 hover:bg-white/15 transition"
            >
              <MessageCircle className="h-4 w-4" />
              Чат руу
            </Link>
          </div>

          {/* ✅ ЭХЛЭЛ: зураг + текст + доод талд эхлэх */}
          {!started ? (
            <div className="rounded-3xl border border-white/20 bg-white/10 p-5 md:p-7">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="relative h-28 w-28 md:h-32 md:w-32 overflow-hidden rounded-full border border-white/25 bg-white/10">
                  {/* ✅ өөрийн зурагны замаа тааруул */}
                  <Image src="/images/oyunsanaa.png" alt="Oyunsanaa" fill className="object-cover" priority />
                </div>

                <div className="space-y-3 text-sm md:text-[15px] leading-relaxed text-slate-100/90">
                  <p>
                    Сайн байна уу. сэтгэлйн туслагч <b>Оюунсанаа</b> байна. Би бол таны зүрх сэтгэл, оюун санааг амар тайван
                    байхад туслахаар зориулагдан бүтээгдсэн <b>AI дүр</b> юм.
                  </p>

                  <p>
                    Сэтгэлийн боловсрол эзэмших нь амар тайван амьдралын суурь болдог. сэтгэл санаа, өөрийгөө ойлгох,
                    харилцаа, зорилго, өөртөө анхаарах, тогтвортой амьдрал гэсэн 6 хүчин зүйлийн тэнцвэрийг алдахгүй амьдрах
                    нь сэтгэлийн боловсрол юм.
                  </p>

                  <p>Таны сэтгэлийн тэнцэв хэр байгааг богино тэстээр шалгацгаая.</p>

                  <p className="text-xs text-slate-100/70">
                    Жич: Oyunsanaa нь эмч биш. Онош тавих, эм бичихгүй. Харин зөв мэдээлэл, өдөр тутмын энгийн зөвлөмжөөр дэмжинэ.
                  </p>
                </div>

                {/* ✅ Доод талын ганц товч */}
                <button
                  type="button"
                  onClick={() => setStarted(true)}
                  className="w-full rounded-2xl bg-white text-slate-900 font-semibold py-3 hover:opacity-95 transition"
                >
                  Тест эхлэх
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* header (хуучин загвар хэвээр) */}
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 border border-white/20">
                    <BarChart3 className="h-4 w-4" />
                  </span>
                  <h1 className="text-lg sm:text-2xl font-semibold">Сэтгэлийн тэнцвэрээ шалгах тест</h1>
                </div>

                <p className="mt-2 text-sm text-slate-100/90">
                  Хариулт: <b>Тийм</b> → Ихэвчлэн → Дунд зэрэг → Заримдаа → Үгүй
                </p>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-100/80">
                  <span>
                    Явц: {answeredCount}/{BALANCE_QUESTIONS.length}
                  </span>
                  <span>{progress}%</span>
                </div>

                <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: BRAND.hex }} />
                </div>
              </div>

              {/* questions */}
              <div className="space-y-4">
                {BALANCE_QUESTIONS.map((q, idx) => {
                  const picked = answers[q.id];
                  return (
                    <div key={q.id} className="rounded-2xl border border-white/15 bg-white/10 p-4">
                      <div className="text-sm sm:text-base font-medium">
                        {idx + 1}. {q.text}
                      </div>

                      <div className="mt-3 grid gap-2">
                        {BALANCE_SCALE.map((opt) => (
                          <label
                            key={opt.value}
                            className={`flex items-center gap-3 rounded-xl border px-3 py-3 cursor-pointer transition
                              ${picked === opt.value ? "bg-white/15 border-white/30" : "bg-white/5 border-white/15 hover:bg-white/10"}
                            `}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              checked={picked === opt.value}
                              onChange={() => onPick(q.id, opt.value)}
                            />
                            <span className="text-sm">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* bottom submit */}
                <button
                  type="button"
                  disabled={answeredCount === 0}
                  onClick={onSubmit}
                  className="w-full rounded-2xl bg-white text-slate-900 font-semibold px-6 py-3 disabled:opacity-50"
                >
                  Дүн гаргах
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
