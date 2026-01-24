"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, MessageCircle, BarChart3 } from "lucide-react";

import { BALANCE_SCALE, BRAND, BALANCE_LAST_KEY, BALANCE_HISTORY_KEY } from "./constants";
import { BALANCE_QUESTIONS } from "./questions";
import type { AnswersMap } from "./score";
import { calcScores, answerSummaryLine } from "./score";

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
    return parsed as HistoryRun[];
  } catch {
    return [];
  }
}

function safeWriteHistory(items: HistoryRun[]) {
  try {
    localStorage.setItem(BALANCE_HISTORY_KEY, JSON.stringify(items));
  } catch {
    // storage blocked / quota үед crash болгохгүй
  }
}

export default function BalanceTestPage() {
  const [started, setStarted] = useState(false);
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

  const onGoResult = () => {
    if (!isComplete) {
      setHint(`Дүгнэлт гаргахын тулд бүх асуултад хариулна уу. Одоо: ${answeredCount}/${totalCount}`);
      goFirstUnanswered();
      return;
    }

    const result = calcScores(answers);
    const at = Date.now();

    // ✅ 1) sessionStorage (түр) — result page last-г уншина
    try {
      sessionStorage.setItem(BALANCE_LAST_KEY, JSON.stringify({ answers, result, at }));
    } catch {
      // sessionStorage blocked үед crash болгохгүй
    }

    // ✅ 2) localStorage history — явц/график хадгална
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
    } catch {
      // ignore
    }

    // result page руу
    window.location.href = "/mind/balance/result";
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* soft brand blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute -top-40 left-[-10%] h-[520px] w-[520px] rounded-full blur-3xl"
          style={{ background: `rgba(${BRAND.rgb},0.18)` }}
        />
        <div
          className="absolute -top-20 right-[-15%] h-[460px] w-[460px] rounded-full blur-3xl"
          style={{ background: `rgba(${BRAND.rgb},0.14)` }}
        />
        <div
          className="absolute bottom-[-30%] left-[20%] h-[620px] w-[620px] rounded-full blur-3xl"
          style={{ background: `rgba(${BRAND.rgb},0.10)` }}
        />
      </div>

      <main className="px-4 py-6 md:px-6 md:py-10 flex justify-center">
        <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.10)] px-4 py-5 md:px-7 md:py-7 space-y-5">
          {/* top buttons */}
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/mind/balance"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Буцах
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              <MessageCircle className="h-4 w-4" />
              Чат руу
            </Link>
          </div>

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
              <h1 className="text-lg sm:text-2xl font-semibold text-slate-900">
                Сэтгэлийн тэнцвэрээ шалгах тест
              </h1>
            </div>

            {started && (
              <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                <span>
                  Явц: {answeredCount}/{totalCount}
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
                    <p className="text-slate-800 leading-relaxed">
                      Сайн байна уу. Сэтгэлийн туслагч <b>Оюунсанаа</b> байна. Би бол таны зүрх сэтгэл,
                      оюун санааг амар тайван байхад туслахаар зориулагдан бүтээгдсэн AI дүр юм.
                      <br />
                      <br />
                      Сэтгэлийн боловсрол эзэмших нь амар тайван амьдралын суурь болдог. Сэтгэл санаа,
                      өөрийгөө ойлгох, харилцаа, зорилго, өөртөө анхаарах, тогтвортой амьдрал гэсэн <b>6 хүчин зүйлийн</b>{" "}
                      тэнцвэрийг алдахгүй амьдрах нь сэтгэлийн боловсрол юм.
                      <br />
                      <br />
                      Таны сэтгэлийн тэнцвэр хэр байгааг богино тестээр шалгацгаая.
                    </p>

                    <p className="mt-3 text-xs text-slate-600">
                      Тэмдэглэл: Би эмч биш. Эмчилгээ, онош тавихгүй. Хэрэв танд яаралтай тусламж хэрэгтэй санагдвал
                      мэргэжлийн эмч, зөвлөгчид хандаарай.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStarted(true)}
                    className="w-full rounded-2xl text-white font-semibold py-3 hover:opacity-95 transition"
                    style={{ backgroundColor: BRAND.hex }}
                  >
                    Тест эхлэх
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* TEST QUESTIONS */
            <div className="space-y-4">
              {BALANCE_QUESTIONS.map((q, idx) => {
                const picked = answers[q.id];
                const opts = q.options ?? BALANCE_SCALE;

                return (
                  <div
                    key={q.id}
                    ref={(el) => {
                      qRefs.current[q.id] = el;
                    }}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="text-sm sm:text-base font-semibold text-slate-900">
                      {idx + 1}. {q.text}
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
                                {answerSummaryLine(q as any, picked).score100}/100
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
                    <b style={{ color: BRAND.hex }}>Сануулга:</b> {hint}
                  </div>
                )}

                <button
                  type="button"
                  onClick={onGoResult}
                  className="w-full rounded-2xl text-white font-semibold py-3 disabled:opacity-50"
                  style={{ backgroundColor: BRAND.hex }}
                  disabled={answeredCount === 0}
                >
                  Дүгнэлт
                </button>

                <div className="text-xs text-slate-500">
                  Дүгнэлт гаргахын тулд бүх асуултад хариулна уу. Одоо: {answeredCount}/{totalCount}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
