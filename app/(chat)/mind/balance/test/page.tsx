"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { BALANCE_QUESTIONS } from "./questions";
import type { BalanceAnswerValue, BalanceAnswers } from "./score";
import { computeBalanceResult } from "./score";

const OPTIONS: { label: string; value: BalanceAnswerValue }[] = [
  { label: "Тийм", value: 5 },
  { label: "Ихэвчлэн", value: 4 },
  { label: "Дунд зэрэг", value: 3 },
  { label: "Заримдаа", value: 2 },
  { label: "Үгүй", value: 1 },
];

export default function BalanceTestPage() {
  const router = useRouter();

  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<BalanceAnswers>({});
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);

  const total = BALANCE_QUESTIONS.length;
  const answeredCount = useMemo(
    () => Object.keys(answers).filter((k) => !!answers[k]).length,
    [answers]
  );

  function setAnswer(qid: string, v: BalanceAnswerValue) {
    setAnswers((prev) => ({ ...prev, [qid]: v }));
  }

  async function onFinish() {
    setSubmitting(true);
    try {
      const result = computeBalanceResult(answers);

      // ✅ Supabase-д хадгалах (API route доор өгсөн)
      const res = await fetch("/api/balance/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, result }),
      });

      if (!res.ok) throw new Error("Failed to save result");

      setFinished(true);
    } finally {
      setSubmitting(false);
    }
  }

  function restart() {
    setStarted(false);
    setAnswers({});
    setFinished(false);
    setSubmitting(false);
  }

  return (
    <div
      className="min-h-[calc(100vh-0px)] text-white"
      style={{
        background: `linear-gradient(180deg, rgba(31,111,178,1) 0%, rgba(9,16,28,1) 70%, rgba(0,0,0,1) 100%)`,
      }}
    >
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        {/* Header card */}
        <div className="rounded-2xl border border-white/15 bg-white/10 p-5 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/20 bg-white/10">
              {/* ✅ Oyunsanaa зураг (public/images/oyunsanaa.png гэж үзлээ) */}
              <Image
                src="/images/oyunsanaa.png"
                alt="Oyunsanaa"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold">Сэтгэлийн тэнцвэрээ шалгах тест</div>
              <div className="text-sm text-white/80">
                Хариулт: Тийм → Ихэвчлэн → Дунд зэрэг → Заримдаа → Үгүй
              </div>
            </div>
          </div>

          {!started && (
            <div className="mt-4 space-y-3">
              <p className="text-sm leading-6 text-white/90">
                Сайн уу, би сэтгэлийн туслагч <span className="font-semibold">Oyunsanaa</span> байна.
                Энэ тестээр бид <span className="font-semibold">сэтгэлийн 6 тэнцвэр</span>-ийг богино байдлаар шалгана.
                Дараа нь таны дүн дээр үндэслээд өдөр тутмын жижиг зөвлөмж санал болгоно.
              </p>

              <button
                className="w-full rounded-xl bg-white px-4 py-3 text-base font-semibold text-black hover:bg-white/90"
                onClick={() => setStarted(true)}
              >
                Тест эхлэх
              </button>

              <button
                className="w-full rounded-xl border border-white/25 bg-transparent px-4 py-3 text-sm font-medium text-white hover:bg-white/10"
                onClick={() => router.push("/mind/balance/result")}
              >
                Тестийн тайлбар (Дүгнэлт) харах
              </button>
            </div>
          )}
        </div>

        {/* Test body */}
        {started && (
          <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-white/80">
                Явц: <span className="font-semibold text-white">{answeredCount}</span> / {total}
              </div>
              <button
                className="rounded-lg border border-white/25 px-3 py-1 text-xs text-white/90 hover:bg-white/10"
                onClick={restart}
                type="button"
              >
                Дахин эхлүүлэх
              </button>
            </div>

            <div className="space-y-5">
              {BALANCE_QUESTIONS.map((q, idx) => (
                <div key={q.id} className="rounded-xl border border-white/10 bg-black/10 p-4">
                  <div className="text-sm font-semibold">
                    {idx + 1}. {q.text}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {OPTIONS.map((opt) => {
                      const active = answers[q.id] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setAnswer(q.id, opt.value)}
                          className={[
                            "rounded-full px-3 py-1 text-sm transition",
                            active
                              ? "bg-white text-black"
                              : "border border-white/25 bg-transparent text-white hover:bg-white/10",
                          ].join(" ")}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {!finished ? (
              <div className="mt-6">
                <button
                  className="w-full rounded-xl bg-white px-4 py-3 text-base font-semibold text-black disabled:opacity-60"
                  disabled={answeredCount < total || submitting}
                  onClick={onFinish}
                >
                  {answeredCount < total ? "Бүх асуултад хариулаарай" : submitting ? "Хадгалж байна..." : "Дуусгах"}
                </button>
              </div>
            ) : (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {/* ✅ 1) Дүгнэлт */}
                <button
                  className="w-full rounded-xl bg-white px-4 py-3 text-base font-semibold text-black hover:bg-white/90"
                  onClick={() => router.push("/mind/balance/result")}
                >
                  Дүгнэлт харах
                </button>

                {/* ✅ 2) Restart */}
                <button
                  className="w-full rounded-xl border border-white/25 bg-transparent px-4 py-3 text-base font-semibold text-white hover:bg-white/10"
                  onClick={restart}
                >
                  Дахин тест хийх
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
