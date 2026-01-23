// app/(chat)/mind/balance/result/page.tsx
"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, MessageCircle, RotateCcw } from "lucide-react";

import { BRAND } from "../test/constants";
import { interpret } from "../test/score";

type Stored = {
  answers: Record<string, any>;
  result: {
    domainScores: { label: string; percent: number; avg: number; answered: number; total: number }[];
    totalPercent: number;
    totalAvg: number;
    answeredCount: number;
    totalCount: number;
  };
  at: number;
};

// ✅ history key (түр) — дараа нь Supabase руу шилжүүлнэ
const HISTORY_KEY = "balance:history"; // Stored[]
const LAST_KEY = "balance:lastResult"; // Stored

export default function BalanceResultPage() {
  const data = useMemo(() => {
    // 1) эхлээд sessionStorage (чиний одоогийнх)
    const raw = sessionStorage.getItem(LAST_KEY);
    if (raw) return JSON.parse(raw) as Stored;

    // 2) байхгүй бол localStorage history-оос хамгийн сүүлийнхийг авна
    const hraw = localStorage.getItem(HISTORY_KEY);
    if (hraw) {
      const arr = JSON.parse(hraw) as Stored[];
      if (Array.isArray(arr) && arr.length > 0) return arr[0];
    }

    return null;
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen grid place-items-center text-slate-50 p-6" style={{ backgroundColor: BRAND.hex }}>
        <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl p-6 text-center space-y-4">
          <p className="text-sm text-white/90">
            Дүгнэлт олдсонгүй. Та эхлээд тестээ бөглөөрэй.
          </p>
          <Link className="inline-flex justify-center rounded-2xl bg-white text-slate-900 px-4 py-3 text-sm font-semibold" href="/mind/balance/test">
            Тест рүү очих
          </Link>
        </div>
      </div>
    );
  }

  const { result } = data;
  const totalText = interpret(result.totalPercent);

  return (
    <div
      className="min-h-screen text-slate-50"
      style={{
        // ✅ хар руу унагаахгүй зөөлөн brand background
        background:
          "radial-gradient(1200px 600px at 50% -10%, rgba(255,255,255,0.18), rgba(255,255,255,0) 60%), #1F6FB2",
      }}
    >
      <main className="px-4 py-6 md:px-6 md:py-10 flex justify-center">
        <div className="w-full max-w-3xl rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_24px_80px_rgba(15,23,42,0.35)] px-4 py-5 md:px-7 md:py-7 space-y-5">
          {/* top buttons */}
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/mind/balance"
              className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-3.5 py-2 text-xs sm:text-sm text-white hover:bg-white/25 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Буцах
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-3.5 py-2 text-xs sm:text-sm text-white hover:bg-white/25 transition"
            >
              <MessageCircle className="h-4 w-4" />
              Чат руу
            </Link>
          </div>

          {/* total card */}
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
            <h1 className="text-lg sm:text-2xl font-semibold">Үр дүн</h1>

            <p className="mt-2 text-sm text-white/90">
              Нийт дүн: <b>{Math.round(result.totalPercent)}%</b> — <b>{totalText.level}</b>
            </p>

            <p className="mt-2 text-sm text-white/85">{totalText.tone}</p>

            <div className="mt-3 h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.round(result.totalPercent)}%`, backgroundColor: BRAND.hex }}
              />
            </div>

            <p className="mt-2 text-xs text-white/70">
              Хариулсан: {result.answeredCount}/{result.totalCount}
            </p>
          </div>

          {/* domains */}
          <div className="space-y-3">
            {result.domainScores
              .slice()
              .sort((a, b) => a.percent - b.percent)
              .map((d) => {
                const t = interpret(d.percent);
                return (
                  <div key={d.label} className="rounded-2xl border border-white/15 bg-white/10 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold">{d.label}</div>
                      <div className="text-sm text-white/90">
                        <b>{Math.round(d.percent)}%</b>
                      </div>
                    </div>

                    <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.round(d.percent)}%`, backgroundColor: BRAND.hex }}
                      />
                    </div>

                    <p className="mt-2 text-sm text-white/90">
                      <b>{t.level}:</b> {t.tone}
                    </p>

                    <p className="mt-2 text-sm text-white/90">
                      Зөвлөмж:{" "}
                      {d.percent < 60
                        ? "Энэ хэсгээс нэг жижиг дадал сонгоод 7 хоног туршаарай."
                        : "Одоогийн хэв маягаа хадгалаарай — жижиг тогтмол дадал хамгийн сайн хамгаалалт болно."}
                    </p>

                    <p className="mt-2 text-xs text-white/70">(Хариулсан: {d.answered}/{d.total})</p>
                  </div>
                );
              })}
          </div>

          {/* bottom buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/mind/balance/test"
              className="inline-flex items-center justify-center rounded-2xl bg-white text-slate-900 px-4 py-3 text-sm font-semibold hover:bg-white/90 transition"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Дахин тест хийх
            </Link>

            <Link
              href="/mind/balance/summary"
              className="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-white/90 hover:bg-white/15 transition"
            >
              Тестийн тайлбар
            </Link>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-white/85 leading-relaxed">
            Дараагийн алхам: Энэ үр дүнг таны “Явц” хэсэгт автоматаар бүртгэгддэг болгоно. Мөн чиглэл бүр дээр
            тохирох app-уудыг холбоостойгоор санал болгоно.
          </div>
        </div>
      </main>
    </div>
  );
}
