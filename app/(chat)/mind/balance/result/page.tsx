"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MessageCircle, Trash2 } from "lucide-react";

import { BRAND, BALANCE_LAST_KEY, BALANCE_HISTORY_KEY } from "../test/constants";
import {
  levelFrom100,
  domainNarrative,
  tinyStepSuggestion,
  type BalanceResult,
} from "../test/score";

type Stored = {
  answers: Record<string, number>;
  result: BalanceResult;
  at: number;
};

type HistoryRun = {
  at: number;
  totalScore100: number;
  domainScores: { domain: string; label: string; score100: number }[];
};

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readHistory(): HistoryRun[] {
  try {
    if (typeof window === "undefined") return [];
    const parsed = safeJsonParse<unknown>(localStorage.getItem(BALANCE_HISTORY_KEY));
    if (!Array.isArray(parsed)) return [];
    return parsed as HistoryRun[];
  } catch {
    return [];
  }
}

function writeHistory(items: HistoryRun[]) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(BALANCE_HISTORY_KEY, JSON.stringify(items));
  } catch {
    // Storage blocked / quota / privacy mode үед crash болгохгүй
  }
}

function Sparkline({ values }: { values: number[] }) {
  const w = 260;
  const h = 60;
  const pad = 6;
  const n = values.length;

  if (n < 2) {
    return (
      <div className="text-xs text-slate-500">
        Явц харахын тулд дор хаяж 2 удаа тест бөглөнө.
      </div>
    );
  }

  const xs = values.map((_, i) => pad + (i * (w - pad * 2)) / (n - 1));
  const ys = values.map((v) => {
    const vv = Math.max(0, Math.min(100, v));
    return pad + (1 - vv / 100) * (h - pad * 2);
  });

  const d = xs
    .map((x, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${ys[i].toFixed(2)}`)
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      <path d={d} fill="none" stroke={BRAND.hex} strokeWidth="3" strokeLinecap="round" />
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy={ys[i]} r="3.5" fill={BRAND.hex} />
      ))}
    </svg>
  );
}

export default function BalanceResultPage() {
  const [history, setHistory] = useState<HistoryRun[]>([]);
  const [data, setData] = useState<Stored | null>(null);

  // load last run safely (NO JSON.parse in render)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(BALANCE_LAST_KEY);
      const parsed = safeJsonParse<Stored>(raw);

      if (!parsed || !parsed.result || typeof parsed.at !== "number") {
        // эвдэрсэн/хуучин формат байвал цэвэрлээд fallback
        sessionStorage.removeItem(BALANCE_LAST_KEY);
        setData(null);
        return;
      }

      setData(parsed);
    } catch {
      // sessionStorage blocked гэх мэт үед crash болгохгүй
      setData(null);
    }
  }, []);

  // save to history once
  useEffect(() => {
    const h = readHistory();
    setHistory(h);

    if (!data) return;

    const run: HistoryRun = {
      at: data.at,
      totalScore100: data.result.totalScore100,
      domainScores: data.result.domainScores.map((d) => ({
        domain: d.domain,
        label: d.label,
        score100: d.score100,
      })),
    };

    const exists = h.some((x) => x.at === run.at);
    if (!exists) {
      const next = [run, ...h].slice(0, 60);
      writeHistory(next);
      setHistory(next);
    }
  }, [data]);

  if (!data) {
    return (
      <div className="min-h-screen bg-white text-slate-900 grid place-items-center p-6">
        <div className="max-w-md text-center space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-slate-800">Дүгнэлт олдсонгүй. Эхлээд тестээ бөглөнө үү.</p>
          <Link className="underline" href="/mind/balance/test">
            Тест рүү очих
          </Link>
        </div>
      </div>
    );
  }

  const { result } = data;
  const totalText = levelFrom100(result.totalScore100);

  const onDeleteOne = (at: number) => {
    const next = history.filter((x) => x.at !== at);
    writeHistory(next);
    setHistory(next);
  };

  const onDeleteAll = () => {
    writeHistory([]);
    setHistory([]);
  };

  const sparkValues = [...history].reverse().map((x) => x.totalScore100);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* brand blobs */}
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
          {/* top nav */}
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/mind/balance/test"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Тест рүү
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              <MessageCircle className="h-4 w-4" />
              Чат руу
            </Link>
          </div>

          {/* TOTAL SUMMARY */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h1 className="text-lg sm:text-2xl font-semibold text-slate-900">Дүгнэлт</h1>

            <div className="mt-2 text-sm text-slate-700">
              Нийт оноо: <b style={{ color: BRAND.hex }}>{result.totalScore100}/100</b> —{" "}
              <b>{totalText.level}</b>
            </div>

            <p className="mt-2 text-sm text-slate-700">{totalText.tone}</p>

            <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${result.totalScore100}%`, backgroundColor: BRAND.hex }}
              />
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Хариулсан: {result.answeredCount}/{result.totalCount}
            </p>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href="/mind/balance/test"
                className="inline-flex items-center justify-center rounded-2xl text-white px-4 py-3 text-sm font-semibold hover:opacity-95 transition"
                style={{ backgroundColor: BRAND.hex }}
              >
                Тест дахин бөглөх
              </Link>
              <a
                href="#progress"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition"
              >
                Явц харах
              </a>
            </div>
          </div>

          {/* DOMAIN CARDS */}
          <div className="space-y-3">
            {result.domainScores
              .slice()
              .sort((a, b) => a.score100 - b.score100)
              .map((d) => (
                <div key={d.domain} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-slate-900">{d.label}</div>
                    <div className="text-sm text-slate-700">
                      <b style={{ color: BRAND.hex }}>{d.score100}/100</b>
                    </div>
                  </div>

                  <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${d.score100}%`, backgroundColor: BRAND.hex }}
                    />
                  </div>

                  <p className="mt-2 text-sm text-slate-700">
                    {domainNarrative(d.label, d.score100)}
                  </p>

                  {d.weakest.length > 0 && (
                    <div
                      className="mt-3 rounded-xl border border-slate-200 p-3"
                      style={{ background: `rgba(${BRAND.rgb},0.06)` }}
                    >
                      <div className="text-xs font-semibold text-slate-700 mb-2">
                        Энэ чиглэлд хамгийн их доош татсан асуултууд:
                      </div>
                      <ul className="space-y-2">
                        {d.weakest.map((w) => (
                          <li key={w.id} className="text-xs text-slate-700">
                            • {w.text} — <b>{w.score100}/100</b>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="mt-3 text-sm text-slate-700">
                    <b style={{ color: BRAND.hex }}>Жижиг алхам:</b> {tinyStepSuggestion(d.domain)}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    (Хариулсан: {d.answered}/{d.total})
                  </p>
                </div>
              ))}
          </div>

          {/* PROGRESS */}
          <div id="progress" className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold text-slate-900">Явц (өмнөх тестүүд)</div>
              <button
                type="button"
                onClick={onDeleteAll}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
              >
                <Trash2 className="h-4 w-4" />
                Бүгдийг устгах
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 p-3">
              <div className="text-xs text-slate-500 mb-2">Нийт онооны өөрчлөлт (0–100)</div>
              <Sparkline values={sparkValues} />
            </div>

            <div className="space-y-2">
              {history.length === 0 ? (
                <div className="text-sm text-slate-600">
                  Одоогоор түүх алга. Дахин тест бөглөхөд энд явц харагдана.
                </div>
              ) : (
                history.map((h) => (
                  <div
                    key={h.at}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-slate-800">
                        <b style={{ color: BRAND.hex }}>{h.totalScore100}/100</b>{" "}
                        <span className="text-xs text-slate-500">
                          — {new Date(h.at).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {h.domainScores
                          .slice()
                          .sort((a, b) => a.score100 - b.score100)
                          .map((d) => `${d.label}:${d.score100}`)
                          .join(" • ")}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteOne(h.at)}
                      className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Устгах
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div
            className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700"
            style={{ background: `rgba(${BRAND.rgb},0.06)` }}
          >
            Дараагийн алхам: хүсвэл бид энэ түүхийг Supabase-д хадгалдаг болгож “төхөөрөмж солиход ч” явцаа алдахгүй
            болгоно.
          </div>
        </div>
      </main>
    </div>
  );
}
