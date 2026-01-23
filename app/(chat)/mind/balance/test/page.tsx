"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  MessageSquareText,
  Play,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

import { BRAND, BALANCE_SCALE } from "./constants";
import { BALANCE_QUESTIONS } from "./questions";
import { computeBalanceResult } from "./score";
import type { AnswersMap } from "./score";

export default function Page() {
  const router = useRouter();
  const questions = useMemo(() => BALANCE_QUESTIONS, []);

  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [showResult, setShowResult] = useState(false);

  const allAnswered =
    questions.length > 0 && questions.every((q) => answers[q.id] !== undefined);

  const result = useMemo(() => {
    if (!showResult) return null;
    return computeBalanceResult(questions, answers);
  }, [showResult, questions, answers]);

  return (
    <div className="min-h-[100dvh] bg-white">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 border-b" style={{ backgroundColor: BRAND }}>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-sm font-medium text-white hover:bg-white/25"
          >
            <ChevronLeft className="h-4 w-4" />
            Буцах
          </button>

          <div className="text-center">
            <div className="text-sm font-semibold text-white">
              Сэтгэлийн тэнцвэрээ шалгах тест
            </div>
            <div className="text-xs text-white/80">
              Хариулт: Тийм → Ихэвчлэн → Дунд → Заримдаа → Үгүй
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-sm font-medium text-white hover:bg-white/25"
          >
            <MessageSquareText className="h-4 w-4" />
            Чат руу
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 py-6">
        {!started ? (
          <div className="rounded-2xl border p-5">
            <div className="text-lg font-semibold">Тест эхлүүлэх</div>
            <div className="mt-2 text-sm text-muted-foreground">
              Асуулт бүрт хамгийн ойр хариултаа сонгоорой. Бүгдийг бөглөсний дараа “Дүн харах” идэвхжинэ.
            </div>

            <button
              type="button"
              onClick={() => {
                setStarted(true);
                setShowResult(false);
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: BRAND }}
            >
              <Play className="h-4 w-4" />
              Эхлэх
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="rounded-2xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-base font-semibold">
                      {idx + 1}. {q.text}
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                      {q.category}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {BALANCE_SCALE.map((opt) => {
                      const checked = answers[q.id] === opt.value;
                      return (
                        <label
                          key={`${q.id}-${opt.value}`}
                          className="flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3"
                          style={
                            checked
                              ? { borderColor: BRAND, backgroundColor: "rgba(31,111,178,0.08)" }
                              : undefined
                          }
                        >
                          <input
                            type="radio"
                            name={q.id}
                            checked={checked}
                            onChange={() => {
                              setAnswers((prev) => ({ ...prev, [q.id]: opt.value }));
                              setShowResult(false);
                            }}
                            className="h-4 w-4"
                          />
                          <span className="text-sm font-medium">{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Result (shows under questions) */}
            {result ? (
              <div className="mt-6 rounded-2xl border p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold">Дүгнэлт</div>
                    <div className="mt-1 text-sm text-muted-foreground">{result.message}</div>
                  </div>
                  <div
                    className="rounded-2xl px-4 py-3 text-center text-white"
                    style={{ backgroundColor: BRAND }}
                  >
                    <div className="text-xs opacity-90">Нийт</div>
                    <div className="text-2xl font-bold">{result.percent}%</div>
                    <div className="text-xs opacity-90">{result.level}</div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {Object.entries(result.byCategory).map(([cat, v]) => (
                    <div key={cat} className="rounded-2xl bg-muted/40 p-4">
                      <div className="text-sm font-semibold">{cat}</div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {v.score}/{v.max}
                        </span>
                        <span className="font-semibold">{v.percent}%</span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${v.percent}%`, backgroundColor: BRAND }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 space-y-3">
                  {result.tips.map((t) => (
                    <div key={t.title} className="rounded-2xl border p-4">
                      <div className="text-sm font-semibold">{t.title}</div>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        {t.items.map((it) => (
                          <li key={it}>{it}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAnswers({});
                      setShowResult(false);
                      setStarted(false);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Дахин эхлэх
                  </button>

                  <Link
                    href="/mind/balance"
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
                    style={{ backgroundColor: BRAND }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Миний үр дүн рүү
                  </Link>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 z-40 border-t bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="text-xs text-muted-foreground">
            {!started
              ? "Эхлэх дарвал тест гарна."
              : allAnswered
              ? "Бэлэн боллоо ✅ “Дүн харах” дарна уу."
              : "Асуултуудаа бөглөсний дараа “Дүн харах” идэвхжинэ."}
          </div>

          <div className="flex items-center gap-2">
            {!started ? (
              <button
                type="button"
                onClick={() => setStarted(true)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: BRAND }}
              >
                Эхлэх
              </button>
            ) : (
              <button
                type="button"
                disabled={!allAnswered}
                onClick={() => setShowResult(true)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: BRAND }}
              >
                Дүн харах
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
