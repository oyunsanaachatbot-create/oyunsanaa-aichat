// app/(chat)/mind/balance/test/page.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, ArrowLeft, BarChart3 } from "lucide-react";

import { BALANCE_SCALE, BRAND } from "./constants";
import { BALANCE_QUESTIONS } from "./questions";
import type { AnswersMap } from "./score";
import { calcScores } from "./score";

const CHAT_HREF = "/chat"; // TODO: танайд чат өөр route бол энд солиорой (ж: "/" эсвэл "/(chat)" биш бодит path)

export default function BalanceTestPage() {
  const router = useRouter();

  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<AnswersMap>({});

  const totalCount = BALANCE_QUESTIONS.length;

  const answeredCount = useMemo(
    () => BALANCE_QUESTIONS.filter((q) => typeof answers[q.id] === "number").length,
    [answers]
  );

  const progress = Math.round((answeredCount / totalCount) * 100);

  const firstMissingId = useMemo(() => {
    const missing = BALANCE_QUESTIONS.find((q) => typeof answers[q.id] !== "number");
    return missing?.id ?? null;
  }, [answers]);

  const allAnswered = answeredCount === totalCount;

  const onPick = (qid: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [qid]: value as any }));
  };

  const scrollToQuestion = (qid: string) => {
    const el = document.getElementById(`q-${qid}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goResult = () => {
    const result = calcScores(answers);
    sessionStorage.setItem(
      "balance:lastResult",
      JSON.stringify({ answers, result, at: Date.now() })
    );
    router.push("/mind/balance/result");
  };

  const onSummaryClick = () => {
    if (allAnswered) return goResult();
    if (firstMissingId) scrollToQuestion(firstMissingId);
  };

  const onFinish = () => {
    // “Тест дуусгах” = эхлэл рүү буцаах + reset
    setStarted(false);
    setAnswers({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className="min-h-screen text-slate-50"
      style={{
        background: `radial-gradient(1100px 700px at 50% -10%, rgba(${BRAND.rgb},0.55), rgba(2,8,22,1) 60%)`,
      }}
    >
      <main className="px-4 py-6 md:px-6 md:py-10 flex justify-center">
        <div className="w-full max-w-3xl rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_24px_80px_rgba(15,23,42,0.9)] px-4 py-5 md:px-7 md:py-7 space-y-5">
          {/* top buttons */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.push("/mind/balance")}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-2 text-xs sm:text-sm text-slate-50 hover:bg-white/15 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Буцах
            </button>

            <Link
              href={CHAT_HREF}
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-2 text-xs sm:text-sm text-slate-50 hover:bg-white/15 transition"
            >
              <MessageCircle className="h-4 w-4" />
              Чат руу
            </Link>
          </div>

          {/* header */}
          <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 border border-white/20">
                <BarChart3 className="h-4 w-4" />
              </span>
              <h1 className="text-lg sm:text-2xl font-semibold">Сэтгэлийн тэнцвэр</h1>
            </div>

            {!started ? (
              <p className="mt-2 text-sm text-slate-100/90">
                Богино тестээр таны өнөөдрийн 6 чиглэлийн тэнцвэрийг ерөнхийд нь харуулна.
              </p>
            ) : (
              <>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-100/80">
                  <span>Явц: {answeredCount}/{totalCount}</span>
                  <span>{progress}%</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${progress}%`, backgroundColor: BRAND.hex }}
                  />
                </div>
              </>
            )}
          </div>

          {/* INTRO */}
          {!started ? (
            <div className="space-y-4">
              {/* Oyunsanaa image */}
              <div className="flex justify-center">
                <img
                  src="/images/oyunsanaa.png"
                  alt="Oyunsanaa"
                  className="w-[240px] sm:w-[280px] h-auto rounded-3xl border border-white/15 shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
                />
              </div>

              {/* Intro text */}
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 sm:p-5 text-sm text-slate-100/90 leading-relaxed">
                <p>
                  Сайн байна уу. Сэтгэлийн туслагч <b>Оюунсанаа</b> байна. Би бол таны зүрх сэтгэл,
                  оюун санааг амар тайван байхад туслахаар зориулагдан бүтээгдсэн AI дүр юм.
                </p>
                <p className="mt-3">
                  Сэтгэлийн боловсрол эзэмших нь амар тайван амьдралын суурь болдог.
                  <b> Сэтгэл санаа, өөрийгөө ойлгох, харилцаа, зорилго, өөртөө анхаарах, тогтвортой амьдрал</b>
                  гэсэн 6 хүчин зүйлийн тэнцвэрийг алдахгүй амьдрах нь сэтгэлийн боловсрол юм.
                </p>
                <p className="mt-3">
                  Таны сэтгэлийн тэнцвэр хэр байгааг богино тестээр шалгацгаая.
                </p>

                <p className="mt-3 text-xs text-slate-100/70">
                  Тэмдэглэл: Би эмч биш. Эмчилгээ, онош тавихгүй. Хэрэв танд яаралтай тусламж хэрэгтэй санагдвал
                  мэргэжлийн эмч, зөвлөгчид хандаарай.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStarted(true)}
                className="w-full rounded-2xl bg-white text-slate-900 font-semibold py-3 hover:opacity-95 transition"
              >
                Тест эхлэх
              </button>
            </div>
          ) : (
            /* TEST */
            <div className="space-y-4">
              {BALANCE_QUESTIONS.map((q, idx) => {
                const picked = answers[q.id];
                const missing = typeof picked !== "number";
                return (
                  <div
                    key={q.id}
                    id={`q-${q.id}`}
                    className={`rounded-2xl border bg-white/10 p-4 scroll-mt-24
                      ${missing ? "border-white/15" : "border-white/15"}
                    `}
                  >
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

              {/* Bottom bar: 2 buttons big, one row */}
              <div className="mt-2 rounded-2xl border border-white/15 bg-white/10 p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={onSummaryClick}
                    className={`flex-1 rounded-2xl px-5 py-3 font-semibold transition
                      ${allAnswered ? "bg-white text-slate-900 hover:opacity-95" : "bg-white/10 text-white hover:bg-white/15 border border-white/20"}
                    `}
                  >
                    Дүгнэлт
                  </button>

                  <button
                    type="button"
                    onClick={onFinish}
                    className="flex-1 rounded-2xl bg-white text-slate-900 font-semibold px-5 py-3 hover:opacity-95 transition"
                  >
                    Тест дуусгах
                  </button>
                </div>

                {!allAnswered && (
                  <p className="mt-2 text-xs text-slate-100/75">
                    Дүгнэлт гаргахын тулд бүх асуултад хариулна уу. Одоо: {answeredCount}/{totalCount}.
                    “Дүгнэлт” дарвал эхний бөглөөгүй асуулт руу аваачна.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
