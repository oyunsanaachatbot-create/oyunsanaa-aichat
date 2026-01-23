"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, ArrowLeft, BarChart3 } from "lucide-react";
import {
  BALANCE_QUESTIONS,
  BALANCE_SCALE,
  DOMAIN_LABEL,
  type BalanceChoiceValue,
  type BalanceDomain,
} from "@/content/balance/test";

type Attempt = {
  id: string;
  createdAt: string;
  answers: Record<string, BalanceChoiceValue>;
  domainScores: Record<BalanceDomain, number>; // 0..100
  total: number; // 0..100
};

const STORAGE_KEY = "oyunsanaa_balance_attempts";

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function calcScores(answers: Record<string, BalanceChoiceValue>) {
  const byDomain: Record<BalanceDomain, { sum: number; count: number }> = {
    emotion: { sum: 0, count: 0 },
    self: { sum: 0, count: 0 },
    relations: { sum: 0, count: 0 },
    purpose: { sum: 0, count: 0 },
    selfCare: { sum: 0, count: 0 },
    life: { sum: 0, count: 0 },
  };

  for (const q of BALANCE_QUESTIONS) {
    const v = answers[q.id];
    if (v === undefined) continue;
    byDomain[q.domain].sum += v;
    byDomain[q.domain].count += 1;
  }

  const domainScores = Object.fromEntries(
    (Object.keys(byDomain) as BalanceDomain[]).map((d) => {
      const { sum, count } = byDomain[d];
      const avg = count ? sum / (count * 4) : 0; // 0..1
      return [d, Math.round(avg * 100)];
    })
  ) as Record<BalanceDomain, number>;

  const total =
    Math.round(
      (Object.values(domainScores).reduce((a, b) => a + b, 0) /
        Object.values(domainScores).length) || 0
    );

  return { domainScores, total };
}

function saveAttempt(attempt: Attempt) {
  const raw = localStorage.getItem(STORAGE_KEY);
  const arr: Attempt[] = raw ? JSON.parse(raw) : [];
  arr.unshift(attempt);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(0, 50)));
}

export default function BalanceTestPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, BalanceChoiceValue>>({});

  const totalQuestions = BALANCE_QUESTIONS.length;
  const answeredCount = Object.keys(answers).length;
  const canSubmit = answeredCount === totalQuestions;

  const progressPct = useMemo(() => {
    return Math.round((answeredCount / totalQuestions) * 100);
  }, [answeredCount, totalQuestions]);

  const onPick = (qid: string, v: BalanceChoiceValue) => {
    setAnswers((prev) => ({ ...prev, [qid]: v }));
  };

  const onSubmit = () => {
    const { domainScores, total } = calcScores(answers);

    const attempt: Attempt = {
      id: uid(),
      createdAt: new Date().toISOString(),
      answers,
      domainScores,
      total,
    };

    saveAttempt(attempt);
    router.push("/mind/balance/results");
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden text-slate-50 bg-gradient-to-b from-[#04101f] via-[#071a33] to-[#020816]">
      {/* glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-[-20%] w-[420px] h-[420px] rounded-full bg-cyan-400/25 blur-3xl" />
        <div className="absolute -top-40 right-[-10%] w-[360px] h-[360px] rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute bottom-[-30%] right-[-10%] w-[520px] h-[520px] rounded-full bg-blue-900/70 blur-3xl" />
      </div>

      <main className="relative z-10 px-4 py-6 md:px-6 md:py-10 flex justify-center">
        <div className="w-full max-w-3xl rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_24px_80px_rgba(15,23,42,0.9)] px-4 py-5 md:px-7 md:py-7 space-y-5">
          {/* Header (цэвэр, бага текст) */}
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
                <BarChart3 className="h-4 w-4" />
              </span>
              <h1 className="text-lg sm:text-2xl font-semibold text-white">
                Сэтгэлийн тэнцвэрээ шалгах тест
              </h1>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-white/85">
                <span>Явц: {answeredCount}/{totalQuestions}</span>
                <span>{progressPct}%</span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full rounded-full bg-white/70"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Questions */}
          <section className="space-y-3">
            {BALANCE_QUESTIONS.map((q, idx) => {
              const picked = answers[q.id];

              return (
                <div
                  key={q.id}
                  className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-[0_14px_40px_rgba(15,23,42,0.65)] p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm sm:text-base text-white/90">
                        <span className="font-semibold text-white">{idx + 1}.</span>{" "}
                        {q.text}
                      </p>
                      {/* ✅ domain chip-ийг авч хаяхыг хүссэн → энд харуулахгүй */}
                      {/* Хэрвээ дараа нь хэрэгтэй бол: DOMAIN_LABEL[q.domain] */}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {BALANCE_SCALE.map((c) => {
                      const active = picked === c.value;
                      return (
                        <label
                          key={c.value}
                          className={[
                            "flex items-center gap-3 rounded-2xl border px-3 py-3 cursor-pointer transition",
                            active
                              ? "border-white/60 bg-white/20"
                              : "border-white/20 bg-white/5 hover:bg-white/10",
                          ].join(" ")}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            className="h-4 w-4"
                            checked={picked === c.value}
                            onChange={() => onPick(q.id, c.value)}
                          />
                          <span className="text-sm sm:text-[15px] text-white/90">
                            {c.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </section>

          {/* Footer actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <Link
              href="/mind/balance/summary"
              className="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-white/90 hover:bg-white/15 transition"
            >
              Тестийн тайлбар (Дүгнэлт) харах
            </Link>

            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit}
              className={[
                "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition",
                canSubmit
                  ? "bg-white text-slate-900 hover:bg-white/90"
                  : "bg-white/20 text-white/60 cursor-not-allowed",
              ].join(" ")}
            >
              Дүн гаргах
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
