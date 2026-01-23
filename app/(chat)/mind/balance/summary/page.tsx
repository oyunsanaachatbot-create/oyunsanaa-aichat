"use client";

import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { BRAND } from "../test/constants";

type DomainScore = {
  domain: string;
  score: number;
  total: number;
  lowQuestions: { text: string; score: number }[];
};

export default function BalanceSummaryPage() {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem("balance:lastResult");
  if (!raw) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-600">Одоогоор үр дүн алга байна.</p>
      </div>
    );
  }

  const data = JSON.parse(raw) as DomainScore[];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute -top-40 left-[-10%] h-[520px] w-[520px] rounded-full blur-3xl"
          style={{ background: `rgba(${BRAND.rgb},0.18)` }}
        />
        <div
          className="absolute -top-20 right-[-15%] h-[460px] w-[460px] rounded-full blur-3xl"
          style={{ background: `rgba(${BRAND.rgb},0.14)` }}
        />
      </div>

      <main className="relative z-10 px-4 py-10 flex justify-center">
        <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white/90 shadow-lg p-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/mind/balance"
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Буцах
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm"
            >
              <MessageCircle className="h-4 w-4" />
              Чат руу
            </Link>
          </div>

          <h1 className="text-2xl font-bold mb-6">Таны сэтгэлийн тэнцвэр</h1>

          {/* Domains */}
          <div className="space-y-6">
            {data.map((d, i) => {
              const percent = Math.round((d.score / d.total) * 100);

              return (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">{d.domain}</h3>
                    <span className="font-bold">{percent}/100</span>
                  </div>

                  <div className="w-full h-2 bg-slate-100 rounded">
                    <div
                      className="h-2 rounded"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: BRAND.hex,
                      }}
                    />
                  </div>

                  {d.lowQuestions?.length > 0 && (
                    <div className="mt-4 bg-slate-50 rounded-xl p-3">
                      <p className="text-sm font-semibold mb-2">
                        Энэ чиглэлд анхаарах асуултууд:
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-sm">
                        {d.lowQuestions.map((q, idx) => (
                          <li key={idx}>
                            {q.text} — {q.score}/100
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Buttons */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/mind/balance/test"
              className="rounded-2xl py-4 text-white text-center font-semibold"
              style={{ backgroundColor: BRAND.hex }}
            >
              Дахин тест бөглөх
            </Link>

            <Link
              href="/mind/balance/result"
              className="rounded-2xl py-4 border text-center font-semibold"
            >
              Явц харах
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
