"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MessageCircle, Trash2 } from "lucide-react";

import { BRAND, BALANCE_LAST_KEY, BALANCE_HISTORY_KEY } from "../test/constants";
import { levelFrom100, domainNarrative, tinyStepSuggestion, type BalanceResult } from "../test/score";

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
    const raw = localStorage.getItem(BALANCE_HISTORY_KEY);
    const parsed = safeJsonParse<unknown>(raw);
    return Array.isArray(parsed) ? (parsed as HistoryRun[]) : [];
  } catch {
    return [];
  }
}

function writeHistory(items: HistoryRun[]) {
  try {
    localStorage.setItem(BALANCE_HISTORY_KEY, JSON.stringify(items));
  } catch {}
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

  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${ys[i].toFixed(2)}`).join(" ");

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

  useEffect(() => {
    // 1) sessionStorage last
    try {
      const parsed = safeJsonParse<Stored>(sessionStorage.getItem(BALANCE_LAST_KEY));
      if (parsed && parsed.result && typeof parsed.at === "number") {
        setData(parsed);
      } else {
        setData(null);
      }
    } catch {
      setData(null);
    }

    // 2) history
    setHistory(readHistory());
  }, []);

  // fallback: sessionStorage байхгүй үед history-оос “сүүлчийн дүн”-г сэргээж харуулна
  const fallbackLastFromHistory = useMemo(() => {
    if (data) return null;
    const h = readHistory();
    if (h.length === 0) return null;
    const latest = h[0];
    return latest;
  }, [data]);

  if (!data) {
    if (fallbackLastFromHistory) {
      // ✅ sessionStorage байхгүй байсан ч график/явц харагдана.
      // “жинхэнэ domain details” байхгүй тул зөвхөн нийт оноо + явц үзүүлнэ.
      const totalText = levelFrom100(fallbackLastFromHistory.totalScore100);
      const sparkValues = [...history].reverse().map((x) => x.totalScore100);

      return (
        <div className="min-h-screen bg-white text-slate-900">
          <main className="px-4 py-6 md:px-6 md:py-10 flex justify-center">
            <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white px-4 py-5 md:px-7 md:py-7 space-y-5">
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

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h1 className="text-lg sm:text-2xl font-semibold text-slate-900">Дүгнэлт</h1>
                <div className="mt-2 text-sm text-slate-700">
                  Нийт оноо: <b style={{ color: BRAND.hex }}>{fallbackLastFromHistory.totalScore100}/100</b> —{" "}
                  <b>{totalText.level}</b>
                </div>
                <p className="mt-2 text-sm text-slate-700">{totalText.tone}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="font-semibold text-slate-900">Явц (өмнөх тестүүд)</div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-xs text-slate-500 mb-2">Нийт онооны өөрчлөлт (0–100)</div>
                  <Sparkline values={sparkValues} />
                </div>
              </div>

              <div className="text-xs text-slate-500">
                Тайлбар: Энэ дэлгэц refresh/шилжилтээр sessionStorage цэвэрлэгдсэн үед “сүүлчийн түүх”-ээс сэргээж үзүүлж байна.
                Дэлгэрэнгүй домэйн тайлбар харах бол тестээ дахин бөглөөд шууд “Дүгнэлт” рүү орно уу.
              </div>
            </div>
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-white text-slate-900 grid place-items-center p-6">
        <div className="max-w-md text-center space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-slate-800">Дүгнэлт олдсонгүй. Эхлээд тестээ бөглөнө үү.</p>
          <Link className="underline" href="/mind/balance/test">Тест рүү очих</Link>
        </div>
      </div>
    );
  }

  const { result } = data;

  // ✅ crash хамгаалалт: domainScores байхгүй бол унагахгүй
  const domainScoresAny = (result as any)?.domainScores;
  if (!Array.isArray(domainScoresAny)) {
    try { sessionStorage.removeItem(BALANCE_LAST_KEY); } catch {}
    return (
      <div className="min-h-screen bg-white text-slate-900 grid place-items-center p-6">
        <div className="max-w-md text-center space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-slate-800">
            Дүгнэлтийн өгөгдөл эвдэрсэн байна. Дахин тест бөглөж шинэ дүгнэлт үүсгэнэ үү.
          </p>
          <Link className="underline" href="/mind/balance/test">Тест рүү очих</Link>
        </div>
      </div>
    );
  }

  // save to history once (duplicate-гүй)
  useEffect(() => {
    const h = readHistory();
    setHistory(h);

    const run: HistoryRun = {
      at: data.at,
      totalScore100: result.totalScore100,
      domainScores: domainScoresAny.map((d: any) => ({
        domain: d.domain,
        label: d.label,
        score100: d.score100,
      })),
    };

    if (!h.some((x) => x.at === run.at)) {
      const next = [run, ...h].slice(0, 60);
      writeHistory(next);
      setHistory(next);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <main className="px-4 py-6 md:px-6 md:py-10 flex justify-center">
        <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white px-4 py-5 md:px-7 md:py-7 space-y-5">
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
          </div>

          <div className="space-y-3">
            {domainScoresAny
              .slice()
              .sort((a: any, b: any) => a.score100 - b.score100)
              .map((d: any) => (
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

                  {(d as any).weakest?.length > 0 && (
                    <div className="mt-3 rounded-xl border border-slate-200 p-3">
                      <div className="text-xs font-semibold text-slate-700 mb-2">
                        Энэ чиглэлд хамгийн их доош татсан асуултууд:
                      </div>
                      <ul className="space-y-2">
                        {(d as any).weakest?.map((w: any) => (
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

                  <p className="mt-2 text-xs text-slate-500">(Хариулсан: {d.answered}/{d.total})</p>
                </div>
              ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
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
                  <div key={h.at} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                    <div className="min-w-0">
                      <div className="text-sm text-slate-800">
                        <b style={{ color: BRAND.hex }}>{h.totalScore100}/100</b>{" "}
                        <span className="text-xs text-slate-500">— {new Date(h.at).toLocaleString()}</span>
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

        </div>
      </main>
    </div>
  );
}
