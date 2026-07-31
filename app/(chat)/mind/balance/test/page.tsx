"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, MessageCircle, BarChart3 } from "lucide-react";

import { AppShell } from "@/components/mind/app-shell";
import { BALANCE_SCALE_VALUES, BRAND, BALANCE_LAST_KEY, BALANCE_HISTORY_KEY } from "./constants";
import { BALANCE_QUESTIONS } from "./questions";
import type { AnswersMap } from "./score";
import { calcScores, answerSummaryLine } from "./score";
import { useT } from "@/lib/i18n/provider";

type HistoryRun = {
  at: number;
  totalScore100: number;
  domainScores: { domain: string; label: string; score100: number }[];
};

function safeReadHistory(): HistoryRun[] {
  try {
    const raw = localStorage.getItem(BALANCE_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // sanitize
    return parsed.filter((x) => x && typeof x.at === "number").slice(0, 60) as HistoryRun[];
  } catch {
    return [];
  }
}

function safeWriteHistory(items: HistoryRun[]) {
  try {
    localStorage.setItem(BALANCE_HISTORY_KEY, JSON.stringify(items));
  } catch {
    // ignore (quota/blocked)
  }
}

export default function BalanceTestPage() {
  const t = useT();
  const b = t.apps.balance;

  // Тестийн танилцуулгын хуудсыг алгасаж, асуултуудыг шууд харуулна.
  const [started, setStarted] = useState(true);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [hint, setHint] = useState<string | null>(null);

  // question refs for scroll
  const qRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const answeredCount = useMemo(
    () => BALANCE_QUESTIONS.filter((q) => typeof answers[q.id] === "number").length,
    [answers]
  );

  const totalCount = BALANCE_QUESTIONS.length;
  const progress = Math.round((answeredCount / totalCount) * 100);
  const isComplete = answeredCount === totalCount;

  const scaleOptions = useMemo(
    () => b.scaleLabels.map((label, i) => ({ label, value: BALANCE_SCALE_VALUES[i] })),
    [b]
  );

  const onPick = (qid: string, value: number) => {
    setHint(null);
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const goFirstUnanswered = () => {
    const first = BALANCE_QUESTIONS.find((q) => typeof answers[q.id] !== "number");
    if (!first) return;
    const el = qRefs.current[first.id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-[#1F6FB2]/60");
      window.setTimeout(() => {
        el.classList.remove("ring-2", "ring-[#1F6FB2]/60");
      }, 1200);
    }
  };

  const onGoResult = async () => {
    if (!isComplete) {
      setHint(b.test.hint.replace("{answered}", String(answeredCount)).replace("{total}", String(totalCount)));
      goFirstUnanswered();
      return;
    }

    const result = calcScores(answers, b);
    const at = Date.now();

    // 1) sessionStorage — result page уншина
    try {
      sessionStorage.setItem(BALANCE_LAST_KEY, JSON.stringify({ answers, result, at }));
    } catch {}

    // 2) localStorage history
    try {
      const h = safeReadHistory();
      const run: HistoryRun = {
        at,
        totalScore100: result.totalScore100,
        domainScores: Array.isArray(result.domainScores)
          ? result.domainScores.map((d: any) => ({
              domain: d.domain,
              label: d.label,
              score100: d.score100,
            }))
          : [],
      };
      const exists = h.some((x) => x.at === run.at);
      if (!exists) {
        const next = [run, ...h].slice(0, 60);
        safeWriteHistory(next);
      }
    } catch {}

    // 3) 🔥 Supabase хадгалалт (server route)
    try {
      const res = await fetch("/api/balance/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testSlug: "mind-balance",
          answers,
          result,
          totalScore100: result.totalScore100,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.warn("Save test_run failed:", res.status, data);
      }
    } catch (e) {
      console.warn("Save test_run error:", e);
    }

    window.location.href = "/mind/balance/result";
  };

  return (
    <AppShell
      backHref="/mind/balance/result"
      subtitle={b.menuHint}
      title={b.test.title}
      width="4xl"
    >
      <div className="space-y-4">
          {/* header */}
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border"
                style={{
                  background: `rgba(${BRAND.rgb},0.10)`,
                  borderColor: `rgba(${BRAND.rgb},0.25)`,
                }}
              >
                <BarChart3 className="h-4 w-4" style={{ color: BRAND.hex }} />
              </span>
              <h1 className="text-lg sm:text-2xl font-semibold text-slate-900">{b.test.title}</h1>
            </div>

            {started && (
              <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                <span>
                  {b.test.progress.replace("{answered}", String(answeredCount)).replace("{total}", String(totalCount))}
                </span>
                <span>{progress}%</span>
              </div>
            )}

            {started && (
              <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${progress}%`, backgroundColor: BRAND.hex }}
                />
              </div>
            )}
          </div>

          {/* START SCREEN */}
          {!started ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-full flex justify-center">
                    <div className="relative w-[240px] sm:w-[280px] aspect-[3/4] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      <Image
                        src="/images/oyunsanaa.png"
                        alt="Оюунсанаа"
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>
                  </div>

                  <div
                    className="w-full rounded-2xl border border-slate-200 p-4"
                    style={{ background: `rgba(${BRAND.rgb},0.08)` }}
                  >
                    <p
                      className="text-slate-800 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: b.test.introHtml }}
                    />

                    <p className="mt-3 text-xs text-slate-600">{b.test.disclaimer}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStarted(true)}
                    className="w-full rounded-2xl text-white font-semibold py-3 hover:opacity-95 transition"
                    style={{ backgroundColor: BRAND.hex }}
                  >
                    {b.test.startBtn}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* TEST QUESTIONS */
            <div className="space-y-4">
              {BALANCE_QUESTIONS.map((q, idx) => {
                const picked = answers[q.id];
                const opts = scaleOptions;

                return (
                  <div
                    key={q.id}
                    ref={(el) => {
                      qRefs.current[q.id] = el;
                    }}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="text-sm sm:text-base font-semibold text-slate-900">
                      {idx + 1}. {b.questions[q.id as keyof typeof b.questions]}
                    </div>

                    <div className="mt-3 grid gap-2">
                      {opts.map((opt) => {
                        const active = picked === opt.value;
                        return (
                          <label
                            key={opt.value}
                            className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 cursor-pointer transition
                              ${active ? "bg-slate-50 border-slate-300" : "bg-white border-slate-200 hover:bg-slate-50"}
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name={q.id}
                                checked={active}
                                onChange={() => onPick(q.id, opt.value)}
                              />
                              <span className="text-sm text-slate-800">{opt.label}</span>
                            </div>

                            {typeof picked === "number" && active && (
                              <span className="text-xs text-slate-500">
                                {answerSummaryLine(q, picked, b).score100}/100
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* FOOTER */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                {hint && (
                  <div className="text-sm text-slate-700">
                    <b style={{ color: BRAND.hex }}>{b.test.hintLabel}</b> {hint}
                  </div>
                )}

                <button
                  type="button"
                  onClick={onGoResult}
                  className="w-full rounded-2xl text-white font-semibold py-3 disabled:opacity-50"
                  style={{ backgroundColor: BRAND.hex }}
                  disabled={answeredCount === 0}
                >
                  {b.test.resultBtn}
                </button>

                <div className="text-xs text-slate-500">
                  {b.test.hint.replace("{answered}", String(answeredCount)).replace("{total}", String(totalCount))}
                </div>
              </div>
            </div>
          )}
      </div>
    </AppShell>
  );
}
