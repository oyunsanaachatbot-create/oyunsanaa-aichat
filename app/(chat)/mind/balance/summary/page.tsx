"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { BRAND } from "../test/constants";

type DomainScore = {
  domain: string;
  score: number; // 0-100
  total: number; // ихэвчлэн 100
  lowQuestions?: { text: string; score: number }[];
};

export default function BalanceSummaryPage() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<DomainScore[] | null>(null);

  useEffect(() => {
    setMounted(true);

    try {
      // Чи өөрөө хаана хадгалж байгаагаасаа хамаараад key-г тааруулна:
      // - sessionStorage: "balance:lastResult"
      // - localStorage:   "balance:lastResult"
      const raw =
        localStorage.getItem("balance:lastResult") ??
        sessionStorage.getItem("balance:lastResult");

      if (!raw) {
        setData(null);
        return;
      }

      const parsed = JSON.parse(raw);

      // parsed чинь array байх ёстой (DomainScore[])
      if (Array.isArray(parsed)) {
        setData(parsed as DomainScore[]);
        return;
      }

      // Хэрвээ parsed чинь { result: { domainScores: ... } } хэлбэртэй байвал
      // (өмнөх кодоор ингэж хадгалсан байж магадгүй) хамгаалж хөрвүүлнэ
      if (parsed?.result?.domainScores && Array.isArray(parsed.result.domainScores)) {
        const converted: DomainScore[] = parsed.result.domainScores.map((d: any) => ({
          domain: d.label ?? d.domain ?? "Тодорхойгүй",
          score: Math.round(d.percent ?? 0),
          total: 100,
          lowQuestions: [],
        }));
        setData(converted);
        return;
      }

      setData(null);
    } catch (e) {
      console.error("Summary parse error:", e);
      setData(null);
    }
  }, []);

  // ✅ Hydration mismatch-ээс хамгаалах
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-500">Ачааллаж байна…</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="min-h-screen bg-white text-slate-900">
        <main className="px-4 py-10 flex justify-center">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6">
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

            <h1 className="text-2xl font-bold">Дүгнэлт</h1>
            <p className="mt-2 text-slate-600">
              Одоогоор үр дүн алга байна. Эхлээд тестээ бөглөнө үү.
            </p>

            <div className="mt-6">
              <Link
                href="/mind/balance/test"
                className="inline-flex items-center justify-center w-full rounded-2xl py-4 text-white font-semibold"
                style={{ backgroundColor: BRAND.hex }}
              >
                Тест бөглөх
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute -top-40 left-[-10%] h-[520px] w-[520px] rounded-full blur-3xl"
          style={{ background: `rgba(${BRAND.rgb},0.14)` }}
        />
        <div
          className="absolute -top-20 right-[-15%] h-[460px] w-[460px] rounded-full blur-3xl"
          style={{ background: `rgba(${BRAND.rgb},0.10)` }}
        />
      </div>

      <main className="relative z-10 px-4 py-10 flex justify-center">
        <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white/95 shadow-lg p-6">
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

          <h1 className="text-2xl font-bold mb-6">Дүгнэлт</h1>

          {/* Domains */}
          <div className="space-y-6">
            {data.map((d, idx) => {
              const total = d.total || 100;
              const safeScore = Math.max(0, Math.min(d.score ?? 0, total));
              const percent = Math.round((safeScore / total) * 100);

              return (
                <div
                  key={`${d.domain}-${idx}`}
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

                  {!!d.lowQuestions?.length && (
                    <div className="mt-4 bg-slate-50 rounded-xl p-3">
                      <p className="text-sm font-semibold mb-2">
                        Энэ чиглэлд хамгийн их доош татсан асуултууд:
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-sm">
                        {d.lowQuestions.map((q, i) => (
                          <li key={`${idx}-${i}`}>
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
              Үр дүн рүү очих
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
