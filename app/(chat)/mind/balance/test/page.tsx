// app/(chat)/mind/balance/test/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";

import { BRAND, BALANCE_SCALE } from "./constants";
import { BALANCE_QUESTIONS } from "./questions";
import type { AnswersMap } from "./score";
import { calcScores } from "./score";

export default function BalanceTestPage() {
  const searchParams = useSearchParams();

  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<AnswersMap>({});

  // ✅ Menu дээрээс Test-ээ дахин дарахад intro руу буцаах зориулалттай.
  // Sidebar href-ээ /mind/balance/test?step=intro гэж өгөхөд энэ ажиллана.
  useEffect(() => {
    const step = searchParams.get("step");
    if (step === "intro") {
      setStarted(false);
      setAnswers({});
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchParams]);

  const totalCount = BALANCE_QUESTIONS.length;

  const answeredCount = useMemo(() => {
    return BALANCE_QUESTIONS.reduce((acc, q) => acc + (typeof answers[q.id] === "number" ? 1 : 0), 0);
  }, [answers]);

  const allAnswered = answeredCount === totalCount;

  const onPick = (qid: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [qid]: value as any }));
  };

  const onSubmit = () => {
    if (!allAnswered) return;
    const result = calcScores(answers);

    // Түр хадгалалт (дараагийн алхамд Supabase руу бичнэ)
    sessionStorage.setItem(
      "balance:lastResult",
      JSON.stringify({ answers, result, at: Date.now() })
    );

    window.location.href = "/mind/balance/result";
  };

  return (
    <div
      className="min-h-screen text-slate-50"
      style={{
        background: `
          radial-gradient(900px 520px at 50% -12%, rgba(31,111,178,0.18), rgba(31,111,178,0.00) 60%),
          linear-gradient(180deg, #071a2b 0%, #061627 50%, #050f1f 100%)
        `,
      }}
    >
      <main className="px-4 py-6 md:px-6 md:py-10 flex justify-center">
        <div className="w-full max-w-3xl rounded-3xl border border-white/15 bg-white/10 backdrop-blur-2xl shadow-[0_24px_80px_rgba(15,23,42,0.9)] px-4 py-5 md:px-7 md:py-7 space-y-5">
          {/* top buttons */}
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/mind/balance"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-2 text-xs sm:text-sm text-slate-50 hover:bg-white/15 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Буцах
            </Link>

            <Link
              href="/"
              prefetch={false}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-2 text-xs sm:text-sm text-slate-50 hover:bg-white/15 transition"
            >
              <MessageCircle className="h-4 w-4" />
              Чат руу
            </Link>
          </div>

          {!started ? (
            <>
              {/* ✅ Intro (зураг + текст) */}
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img
                    src="/images/oyunsanaa.png"
                    alt="Oyunsanaa"
                    className="w-[260px] sm:w-[320px] rounded-3xl shadow-[0_18px_60px_rgba(0,0,0,0.45)] border border-white/10"
                  />
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 sm:p-5 text-sm sm:text-[15px] leading-relaxed text-slate-100/90 space-y-3">
                  <p>
                    Сайн байна уу. Сэтгэлийн туслагч <b>Оюунсанаа</b> байна. Би бол таны зүрх сэтгэл,
                    оюун санааг амар тайван байхад туслахаар зориулагдан бүтээгдсэн AI дүр юм.
                  </p>

                  <p>
                    Сэтгэлийн боловсрол эзэмших нь амар тайван амьдралын суурь болдог.{" "}
                    <b>
                      сэтгэл санаа, өөрийгөө ойлгох, харилцаа, зорилго, өөртөө анхаарах, тогтвортой амьдрал
                    </b>{" "}
                    гэсэн 6 хүчин зүйлийн тэнцвэрийг алдахгүй амьдрах нь сэтгэлийн боловсрол юм.
                  </p>

                  <p>Таны сэтгэлийн тэнцвэр хэр байгааг богино тестээр шалгацгаая.</p>

                  <p className="text-xs text-slate-100/70 pt-1">
                    Тэмдэглэл: Би эмч биш. Эмчилгээ, онош тавихгүй. Хэрэв танд яаралтай тусламж хэрэгтэй
                    санагдвал мэргэжлийн эмч, зөвлөгчид хандаарай.
                  </p>
                </div>
              </div>

              {/* ✅ ганц товч */}
              <button
                type="button"
                onClick={() => {
                  setStarted(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="w-full rounded-2xl bg-white text-slate-900 font-semibold py-3 hover:opacity-95 transition"
              >
                Тест эхлэх
              </button>
            </>
          ) : (
            <>
              {/* ✅ Test асуултууд */}
              <div className="space-y-4">
                {BALANCE_QUESTIONS.map((q, idx) => {
                  const picked = answers[q.id];

                  return (
                    <div key={q.id} className="rounded-2xl border border-white/15 bg-white/10 p-4">
                      <div className="text-sm sm:text-base font-medium text-slate-50">
                        {idx + 1}. {q.text}
                      </div>

                      <div className="mt-3 grid gap-2">
                        {(q as any).options
                          ? (q as any).options.map((opt: any) => (
                              <label
                                key={opt.value}
                                className={`flex items-center gap-3 rounded-xl border px-3 py-3 cursor-pointer transition
                                  ${
                                    picked === opt.value
                                      ? "bg-white/15 border-white/35"
                                      : "bg-white/5 border-white/15 hover:bg-white/10"
                                  }
                                `}
                              >
                                <input
                                  type="radio"
                                  name={q.id}
                                  checked={picked === opt.value}
                                  onChange={() => onPick(q.id, opt.value)}
                                />
                                <span className="text-sm text-slate-50">{opt.label}</span>
                              </label>
                            ))
                          : BALANCE_SCALE.map((opt) => (
                              <label
                                key={opt.value}
                                className={`flex items-center gap-3 rounded-xl border px-3 py-3 cursor-pointer transition
                                  ${
                                    picked === opt.value
                                      ? "bg-white/15 border-white/35"
                                      : "bg-white/5 border-white/15 hover:bg-white/10"
                                  }
                                `}
                              >
                                <input
                                  type="radio"
                                  name={q.id}
                                  checked={picked === opt.value}
                                  onChange={() => onPick(q.id, opt.value)}
                                />
                                <span className="text-sm text-slate-50">{opt.label}</span>
                              </label>
                            ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ✅ Доод хэсэг: ганц товч (Дүгнэлт) */}
              <div className="pt-1 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={!allAnswered}
                    onClick={onSubmit}
                    className="ml-auto rounded-2xl px-6 py-3 font-semibold transition
                      disabled:opacity-50 disabled:cursor-not-allowed
                      bg-white text-slate-900 hover:opacity-95
                    "
                    style={{ boxShadow: allAnswered ? `0 16px 40px rgba(${BRAND.rgb},0.18)` : undefined }}
                  >
                    Дүгнэлт
                  </button>
                </div>

                {!allAnswered && (
                  <p className="text-xs text-slate-100/70">
                    Дүгнэлт гаргахын тулд бүх асуултад хариулна уу. ({answeredCount}/{totalCount})
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
