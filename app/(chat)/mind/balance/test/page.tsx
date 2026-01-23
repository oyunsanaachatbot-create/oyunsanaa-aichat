// app/(chat)/mind/balance/test/page.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MessageCircle, ArrowLeft, BarChart3 } from "lucide-react";

import { BALANCE_SCALE, BRAND } from "./constants";
import { BALANCE_QUESTIONS } from "./questions";
import type { AnswersMap } from "./score";
import { calcScores } from "./score";

export default function BalanceTestPage() {
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<AnswersMap>({});

  const answeredCount = useMemo(
    () => BALANCE_QUESTIONS.filter((q) => typeof answers[q.id] === "number").length,
    [answers]
  );

  const total = BALANCE_QUESTIONS.length;
  const progress = Math.round((answeredCount / total) * 100);
  const isComplete = answeredCount === total;

  const onPick = (qid: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [qid]: value as any }));
  };

  const onReset = () => {
    setAnswers({});
    setStarted(false);
    sessionStorage.removeItem("balance:lastResult");
  };

  const onFinish = () => {
    if (!isComplete) return;

    const result = calcScores(answers);
    sessionStorage.setItem(
      "balance:lastResult",
      JSON.stringify({ answers, result, at: Date.now() })
    );

    // ✅ Test дуусмагц шууд ДҮГНЭЛТ рүү
    window.location.href = "/mind/balance/summary";
  };

  return (
    <div
      className="min-h-screen text-slate-50"
      style={{
        background: `radial-gradient(1200px 600px at 50% -10%, rgba(${BRAND.rgb},0.55), rgba(2,8,22,1) 55%)`,
      }}
    >
      <main className="px-4 py-6 md:px-6 md:py-10 flex justify-center">
        <div className="w-full max-w-3xl rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_24px_80px_rgba(15,23,42,0.9)] px-4 py-5 md:px-7 md:py-7 space-y-5">
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

          {/* header */}
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

            {started && (
              <>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-100/80">
                  <span>Явц: {answeredCount}/{total}</span>
                  <span>{progress}%</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: BRAND.hex }} />
                </div>
              </>
            )}
          </div>

          {!started ? (
            <button
              type="button"
              onClick={() => setStarted(true)}
              className="w-full rounded-2xl bg-white text-slate-900 font-semibold py-3 hover:opacity-95 transition"
            >
              Тест эхлэх
            </button>
          ) : (
            <>
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
              </div>

              {/* ✅ ЗӨВХӨН ЭНД 2 ТОВЧ */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <Link
                  href="/mind/balance/summary"
                  className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm hover:bg-white/15 transition"
                >
                  Дүгнэлт
                </Link>

                <button
                  type="button"
                  onClick={isComplete ? onFinish : onReset}
                  className="rounded-2xl bg-white text-slate-900 font-semibold px-6 py-3"
                >
                  {isComplete ? "Тест дуусгах" : "Тест эхлүүлэх"}
                </button>
              </div>

              {!isComplete && (
                <p className="text-xs text-slate-100/70">
                  Дүгнэлт гаргахын тулд бүх асуултад хариулна уу.
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
