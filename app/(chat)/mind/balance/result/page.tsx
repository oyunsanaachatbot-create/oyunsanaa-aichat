"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MessageCircle, Trash2, ChevronDown, ChevronUp } from "lucide-react";

import { BRAND, BALANCE_LAST_KEY, BALANCE_HISTORY_KEY, DOMAIN_LABELS } from "../test/constants";
import { calcScores, levelFrom100, domainNarrative, tinyStepSuggestion } from "../test/score";

type Stored = {
  answers: Record<string, number>;
  result: ReturnType<typeof calcScores>;
  at: number;
};

type HistoryRun = {
  at: number;
  totalScore100: number;
  domainScores: { domain: string; label: string; score100: number }[];
};

function clamp100(v: number) {
  return Math.max(0, Math.min(100, v));
}

function safeJSON<T>(raw: string | null): T | null {
  try {
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function readHistory(): HistoryRun[] {
  const h = safeJSON<HistoryRun[]>(localStorage.getItem(BALANCE_HISTORY_KEY));
  return Array.isArray(h) ? h : [];
}

function writeHistory(h: HistoryRun[]) {
  localStorage.setItem(BALANCE_HISTORY_KEY, JSON.stringify(h));
}

export default function BalanceResultPage() {
  const [history, setHistory] = useState<HistoryRun[]>([]);
  const [openDetails, setOpenDetails] = useState(true);

  const data = useMemo(() => safeJSON<Stored>(sessionStorage.getItem(BALANCE_LAST_KEY)), []);

  useEffect(() => {
    const h = readHistory();
    setHistory(h);

    if (!data?.result) return;

    const r = data.result;
    const run: HistoryRun = {
      at: data.at,
      totalScore100: clamp100(r.totalScore100),
      domainScores: r.domainScores.map((d) => ({
        domain: d.domain,
        label: d.label,
        score100: clamp100(d.score100),
      })),
    };

    if (!h.some((x) => x.at === run.at)) {
      const next = [run, ...h].slice(0, 60);
      writeHistory(next);
      setHistory(next);
    }
  }, [data]);

  if (!data?.result) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Link href="/mind/balance/test" className="underline">
          Тест бөглөх
        </Link>
      </div>
    );
  }

  const { totalScore100, answeredCount, totalCount, domainScores } = data.result;
  const sorted = [...domainScores].sort((a, b) => a.score100 - b.score100);
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <main className="max-w-3xl mx-auto p-6 space-y-5">
        <Link href="/mind/balance/test" className="text-sm underline">
          ← Тест рүү
        </Link>

        <h1 className="text-2xl font-bold">Таны дүгнэлт</h1>
        <p>
          Нийт оноо: <b style={{ color: BRAND.hex }}>{totalScore100}/100</b> —{" "}
          {levelFrom100(totalScore100).level}
        </p>

        <p>{levelFrom100(totalScore100).tone}</p>

        <div className="space-y-2">
          {sorted.map((d) => (
            <div key={d.domain}>
              <b>{DOMAIN_LABELS[d.domain]}</b> — {d.score100}/100
              <div className="h-2 bg-slate-200 rounded">
                <div
                  className="h-2 rounded"
                  style={{ width: `${d.score100}%`, backgroundColor: BRAND.hex }}
                />
              </div>
              <p className="text-sm">{domainNarrative(d.label, d.score100)}</p>
              <p className="text-sm">
                <b>Жижиг алхам:</b> {tinyStepSuggestion(d.domain)}
              </p>
            </div>
          ))}
        </div>

        <p>
          <b>Анхаарах:</b> {weakest.label} <br />
          <b>Давуу:</b> {strongest.label}
        </p>
      </main>
    </div>
  );
}
