"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { BALANCE_QUESTIONS } from "../test/questions";
import { computeScores, type AnswersMap } from "../test/score";
import { DOMAIN_APP_LINK, DOMAIN_LABEL, type BalanceDomain } from "../test/constants";

const STORAGE_KEY = "oyunsanaa_balance_answers_v1";
const HISTORY_KEY = "oyunsanaa_balance_history_v1";

function levelText(percent: number) {
  if (percent >= 80) return { title: "Маш сайн", desc: "Одоогоор энэ чиглэл тогтвортой, тайван байна." };
  if (percent >= 60) return { title: "Дунд сайн", desc: "Ерөнхийдөө боломжийн ч сүүлийн үед ачаалал нэмэгдсэн байж магадгүй." };
  if (percent >= 40) return { title: "Анхаарах хэрэгтэй", desc: "Энэ чиглэлд тогтмол жижиг дадал нэмэх нь тустай." };
  if (percent >= 20) return { title: "Эрсдэлтэй", desc: "Ойрын үед стресс/ядрал их байж магадгүй. Дэмжлэг, амралтыг нэмээрэй." };
  return { title: "Одоогоор тайван биш", desc: "Энэ чиглэл таныг хамгийн их ядрааж байна. Маш жижиг алхмаас эхэлье." };
}

function saveHistory(payload: any) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.unshift(payload);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(0, 50)));
  } catch {}
}

export default function BalanceResultPage() {
  const answers: AnswersMap = useMemo(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);

  const stats = useMemo(() => computeScores(BALANCE_QUESTIONS, answers), [answers]);

  // save once (best effort)
  useMemo(() => {
    saveHistory({
      at: new Date().toISOString(),
      totalPercent: stats.totalPercent,
      domainScores: Object.fromEntries(
        (Object.keys(stats.domainScores) as BalanceDomain[]).map((d) => [d, stats.domainScores[d].percent])
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const domains: BalanceDomain[] = ["emotion", "self", "relations", "purpose", "selfCare", "life"];

  return (
    <div
      className="min-h-screen text-slate-50 overflow-x-hidden"
      style={{
        background:
          "radial-gradient(1200px 700px at 20% 0%, rgba(var(--brandRgb),0.55) 0%, rgba(2,8,22,1) 55%)",
      }}
    >
      <main className="px-4 py-6 md:px-6 md:py-10 flex justify-center">
        <div className="w-full max-w-4xl rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_24px_80px_rgba(15,23,42,0.9)] p-4 md:p-6 space-y-5">
          {/* Top */}
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/mind/balance/test"
              className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-4 py-2 text-sm text-white/95 hover:bg-white/25 transition"
            >
              ← Тест рүү
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-4 py-2 text-sm text-white/95 hover:bg-white/25 transition"
            >
              <MessageCircle className="h-4 w-4" />
              Чат руу
            </Link>
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-4 md:px-5 md:py-5 space-y-2">
            <h1 className="text-lg sm:text-2xl font-semibold text-[#D5E2F7]">
              Дүгнэлт (6 чиглэлээр)
            </h1>

            <p className="text-sm text-white/80 leading-relaxed">
              Та тест рүү орохгүйгээр шууд эндээс дүгнэлтээ харж болно.
              Энэ тестийг хэдэн ч удаа хийж өөрийгөө шалгаж болно — гарсан үр дүн “Явц” хэсэгт бүртгэгдэнэ.
            </p>

            <div className="pt-2">
              <div className="text-sm text-white/90">
                Нийт оноо: <span className="font-semibold">{Math.round(stats.totalPercent)}%</span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${Math.round(stats.totalPercent)}%`,
                    backgroundColor: `rgba(var(--brandRgb),0.95)`,
                  }}
                />
              </div>
              <div className="mt-2 text-xs text-white/70">
                Хариулсан: {stats.answeredCount}/{stats.totalCount}
              </div>
            </div>
          </div>

          {/* 6 domains */}
          <div className="grid gap-4">
            {domains.map((d) => {
              const s = stats.domainScores[d];
              const lvl = levelText(s.percent);
              const app = DOMAIN_APP_LINK[d];

              return (
                <div key={d} className="rounded-2xl border border-white/15 bg-white/8 p-4 md:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base sm:text-lg font-semibold text-white/95">
                        {DOMAIN_LABEL[d]}
                      </div>
                      <div className="text-sm text-white/80">
                        {lvl.title} — {lvl.desc}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-bold text-white">{Math.round(s.percent)}%</div>
                      <div className="text-xs text-white/60">({s.answered} асуулт)</div>
                    </div>
                  </div>

                  <div className="h-2 w-full rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.round(s.percent)}%`,
                        backgroundColor: `rgba(var(--brandRgb),0.9)`,
                      }}
                    />
                  </div>

                  {/* App recommendation */}
                  <div className="rounded-xl border border-white/15 bg-white/5 p-3">
                    <div className="text-sm font-semibold text-white/90">Зөвлөмж</div>
                    <p className="mt-1 text-sm text-white/80 leading-relaxed">{app.blurb}</p>
                    <Link
                      href={app.href}
                      className="mt-2 inline-flex text-sm font-semibold underline underline-offset-4 text-white/90 hover:text-white"
                    >
                      {app.title} апп руу орох →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href="/mind/balance/test"
              className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/28 transition"
            >
              Тест дахин бөглөх
            </Link>

            <Link
              href="/mind/balance"
              className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/12 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20 transition"
            >
              Танилцуулга руу
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
