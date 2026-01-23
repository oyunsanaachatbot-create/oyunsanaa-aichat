"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { BALANCE_SCALE } from "./constants";
import { BALANCE_QUESTIONS } from "./questions";
import { computeScores, type AnswersMap } from "./score";

const STORAGE_KEY = "oyunsanaa_balance_answers_v1";

export default function BalanceTestPage() {
  const [answers, setAnswers] = useState<AnswersMap>({});

  // load saved
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setAnswers(JSON.parse(raw));
    } catch {}
  }, []);

  // save
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch {}
  }, [answers]);

  const stats = useMemo(() => computeScores(BALANCE_QUESTIONS, answers), [answers]);

  const progress = stats.totalCount ? Math.round((stats.answeredCount / stats.totalCount) * 100) : 0;

  const setAnswer = (qid: string, v: number) => {
    setAnswers((prev) => ({ ...prev, [qid]: v as any }));
  };

  const reset = () => {
    setAnswers({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className="min-h-screen text-slate-50 overflow-x-hidden"
      style={{
        background:
          "radial-gradient(1200px 700px at 20% 0%, rgba(var(--brandRgb),0.55) 0%, rgba(2,8,22,1) 55%)",
      }}
    >
      <main className="px-4 py-6 md:px-6 md:py-10 flex justify-center">
        <div className="w-full max-w-4xl rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_24px_80px_rgba(15,23,42,0.9)] p-4 md:p-6 space-y-5">
          {/* Top */}
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/mind/balance"
              className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-4 py-2 text-sm text-white/95 hover:bg-white/25 transition"
            >
              ← Буцах
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-4 py-2 text-sm text-white/95 hover:bg-white/25 transition"
            >
              <MessageCircle className="h-4 w-4" />
              Чат руу
            </Link>
          </div>

          {/* Header (зөвхөн гарчиг + явц) */}
          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-4 md:px-5 md:py-5">
            <div className="flex items-end justify-between gap-3">
              <h1 className="text-lg sm:text-2xl font-semibold text-[#D5E2F7]">
                Сэтгэлийн тэнцвэрээ шалгах тест
              </h1>
              <div className="text-xs text-white/80">{progress}%</div>
            </div>

            <div className="mt-3">
              <div className="h-2 w-full rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: `rgba(var(--brandRgb),0.95)`,
                  }}
                />
              </div>
              <div className="mt-2 text-xs text-white/70">
                Явц: {stats.answeredCount}/{stats.totalCount}
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            {BALANCE_QUESTIONS.map((q, idx) => (
              <div
                key={q.id}
                className="rounded-2xl border border-white/15 bg-white/8 px-4 py-4 md:px-5 md:py-5"
              >
                <div className="text-sm sm:text-base font-medium text-white/95">
                  {idx + 1}. {q.text}
                </div>

                <div className="mt-3 grid gap-2">
                  {BALANCE_SCALE.map((opt) => {
                    const checked = answers[q.id] === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition
                          ${checked ? "border-white/60 bg-white/15" : "border-white/15 bg-white/5 hover:bg-white/10"}
                        `}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          checked={checked}
                          onChange={() => setAnswer(q.id, opt.value)}
                        />
                        <span className="text-sm sm:text-base">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom buttons (2 button зөв) */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <Link
              href="/mind/balance/result"
              className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/12 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20 transition"
            >
              Дүгнэлт харах
            </Link>

            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/28 transition"
            >
              Тест дахин бөглөх
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
