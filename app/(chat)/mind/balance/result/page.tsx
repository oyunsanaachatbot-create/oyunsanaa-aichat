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
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as HistoryRun[];
  } catch {
    return [];
  }
}

function writeHistory(items: HistoryRun[]) {
  try {
    localStorage.setItem(BALANCE_HISTORY_KEY, JSON.stringify(items));
  } catch {
    // ignore
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
    // ✅ safe load last run
    try {
      const raw = sessionStorage.getItem(BALANCE_LAST_KEY);
      const parsed = safeJsonParse<Stored>(raw);

      if (!parsed || !parsed.result || typeof parsed.at !== "number") {
        sessionStorage.removeItem(BALANCE_LAST_KEY);
        setData(null);
        return;
      }

      setData(parsed);
    } catch {
      setData(null);
    }
  }, []);

  // save to history once (prevent duplicate)
  useEffect(() => {
    const h = readHistory();
    setHistory(h);

    if (!data) return;

    // ✅ domainScores байхгүй/эвдэрсэн бол history-д хүчээр хийхгүй
    const ds = (data.result as any)?.domainScores;
    if (!Array.isArray(ds)) return;

    const run: HistoryRun = {
      at: data.at,
      totalScore100: data.result.totalScore100,
      domainScores: ds.map((d: any) => ({
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
          <Link className="underline" href="/mind/balance/test">Тест рүү очих</Link>
        </div>
      </div>
    );
  }

  const { result } = data;

  // ✅ HARD GUARD: эндээс цааш slice() унахгүй
  if (!result || !Array.isArray((result as any).domainScores)) {
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
        <div className="absolute -top-40 left-[-10%] h-[520px] w-[520px] rounded-full bl
