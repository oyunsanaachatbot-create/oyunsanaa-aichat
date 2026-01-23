// app/(chat)/mind/balance/result/page.tsx
"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, MessageCircle } from "lucide-react";

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

export default function BalanceResultPage() {
  const data = useMemo(() => {
    const raw = sessionStorage.getItem("balance:lastResult");
    return raw ? (JSON.parse(raw) as Stored) : null;
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-950 text-slate-50 p-6">
        <div className="max-w-md text-center space-y-3">
          <p>Дүн олдсонгүй. Эхлээд тестээ өгнө үү.</p>
          <Link className="underline" href="/mind/balance/test">Тест рүү очих</Link>
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
        background: `radial-gradient(1200px 600px at 50% -10%, rgba(${BRAND.rgb},0.55), rgba(2,8,22,1) 55%)`,
      }}
    >
      <main className="px-4 py-6 md:px-6 md:py-10 flex justify-center">
        <div className="w-full max-w-3xl rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_24px_80px_rgba(15,23,42,0.9)] px-4 py-5 md:px-7 md:py-7 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/mind/balance/test"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs hover:bg-white/15 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Тест рүү буцах
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs hover:bg-white/15 transition"
            >
              <MessageCircle className="h-4 w-4" />
              Чат руу
            </Link>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
            <h1 className="text-lg sm:text-2xl font-semibold">Дүгнэлт</h1>
            <p className="mt-2 text-sm text-slate-100/90">
              Нийт дүн: <b>{Math.round(result.totalPercent)}%</b> — <b>{totalText.level}</b>
            </p>
            <p className="mt-2 text-sm text-slate-100/90">{totalText.tone}</p>

            <div className="mt-3 h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.round(result.totalPercent)}%`, backgroundColor: BRAND.hex }}
              />
            </div>

            <p className="mt-2 text-xs text-slate-100/70">
              Хариулсан: {result.answeredCount}/{result.totalCount}
            </p>
          </div>

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
                      <div className="text-sm text-slate-100/90">
                        <b>{Math.round(d.percent)}%</b>
                      </div>
                    </div>

                    <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.round(d.percent)}%`, backgroundColor: BRAND.hex }}
                      />
                    </div>

                    <p className="mt-2 text-sm text-slate-100/90">
                      <b>{t.level}:</b> {t.tone}
                    </p>

                    <p className="mt-2 text-sm text-slate-100/90">
                      Зөвлөмж: {d.percent < 60
                        ? "Энэ хэсгээс нэг жижиг дадал сонгоод 7 хоног туршаарай."
                        : "Одоогийн хэв маягаа хадгалаарай — жижиг тогтмол дадал хамгийн сайн хамгаалалт болно."}
                    </p>

                    <p className="mt-2 text-xs text-slate-100/70">
                      (Хариулсан: {d.answered}/{d.total})
                    </p>
                  </div>
                );
              })}
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-slate-100/90 leading-relaxed">
            Дараагийн алхам: Энэ дүнг таны “Явц” хэсэгт автоматаар бүртгэгддэг болгоно (суурь нь бэлэн болсон).
            Тэгээд чиглэл бүр дээр тохирох app-уудаар сайжруулах зөвлөмжийг холбоостой гаргана.
          </div>
        </div>
      </main>
    </div>
  );
}
