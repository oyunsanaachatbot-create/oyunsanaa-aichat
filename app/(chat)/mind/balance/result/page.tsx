"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { DOMAIN_LABEL, DOMAIN_APP_LINK, type BalanceDomain } from "../test/constants";
import { BALANCE_QUESTIONS } from "../test/questions";
import { computeScores, type AnswersMap } from "../test/score";

const POSSIBLE_KEYS = [
  "oyunsanaa_balance_answers_v1",
  "balance:lastResult",
  "balance_answers",
  "mind_balance_answers",
];

const HISTORY_KEY = "oyunsanaa_balance_history_v1";

function loadAnswers(): AnswersMap {
  for (const key of POSSIBLE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      // 1) Зарим нь { answers, result, at } бүтэцтэй байж магадгүй
      const parsed = JSON.parse(raw);
      if (parsed?.answers) return parsed.answers as AnswersMap;

      // 2) Шууд answers map байж магадгүй
      return parsed as AnswersMap;
    } catch {}
  }
  return {};
}

function levelFromPercent(p: number) {
  if (p >= 80) return { title: "Тогтвортой", text: "Одоогийн байдал сайн тогтвортой байна." };
  if (p >= 60) return { title: "Хэвийн", text: "Ерөнхийдөө боломжийн. Жижиг дадал нэмбэл хурдан сайжирна." };
  if (p >= 40) return { title: "Савлагаатай", text: "Сүүлийн үед тогтворгүй/савлагаатай байж магадгүй." };
  if (p >= 20) return { title: "Ядралтай", text: "Ачаалал их байна. Амралт, дэмжлэгийг нэмээрэй." };
  return { title: "Тайван биш", text: "Одоогийн байдал тайван биш байна. Маш жижиг алхмаас эхэлье." };
}

function saveHistory(payload: any) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.unshift(payload);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(0, 20)));
  } catch {}
}

function loadHistory(): any[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function BalanceResultPage() {
  const answers = useMemo(() => loadAnswers(), []);
  const stats = useMemo(() => computeScores(BALANCE_QUESTIONS, answers), [answers]);

  const domains: BalanceDomain[] = ["emotion", "self", "relations", "purpose", "selfCare", "life"];

  // history-д бүртгэнэ (best effort)
  useMemo(() => {
    saveHistory({
      at: new Date().toISOString(),
      totalPercent: Math.round((stats.totalAvg / 4) * 100),
      domain: domains.reduce((acc, d) => {
        acc[d] = Math.round(stats.domainScores[d].percent);
        return acc;
      }, {} as Record<string, number>),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const history = useMemo(() => loadHistory(), []);

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
          {/* top */}
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

          {/* header */}
          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-4 md:px-5 md:py-5 space-y-2">
            <h1 className="text-lg sm:text-2xl font-semibold text-[#D5E2F7]">
              Дүгнэлт (6 чиглэлээр)
            </h1>

            <p className="text-sm text-white/80 leading-relaxed">
              Та тест рүү орохгүйгээр шууд эндээс дүгнэлтээ харж болно.
              Энэ тестийг хэдэн ч удаа хийж өөрийгөө шалгах боломжтой.
              Үр дүн “Явц” дээр автоматаар бүртгэгдэнэ.
            </p>
          </div>

          {/* domains */}
          <div className="grid gap-4">
            {domains.map((d) => {
              const percent = Math.round(stats.domainScores[d].percent);
              const lvl = levelFromPercent(percent);
              const app = DOMAIN_APP_LINK[d];

              return (
                <div key={d} className="rounded-2xl border border-white/15 bg-white/8 p-4 md:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base sm:text-lg font-semibold text-white/95">
                        {DOMAIN_LABEL[d]}
                      </div>
                      <div className="text-sm text-white/80">
                        <b>{lvl.title}:</b> {lvl.text}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-bold text-white">{percent}%</div>
                    </div>
                  </div>

                  <div className="h-2 w-full rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: `rgba(var(--brandRgb),0.95)`,
                      }}
                    />
                  </div>

                  {/* app recommendation */}
                  <div className="rounded-xl border border-white/15 bg-white/5 p-3">
                    <div className="text-sm font-semibold text-white/90">Өдөр тутмын зөвлөмж</div>
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

          {/* history */}
          <div className="rounded-2xl border border-white/15 bg-white/8 p-4 md:p-5 space-y-3">
            <div className="text-base font-semibold text-white/95">Миний явц (сүүлийн үр дүн)</div>

            {history.length === 0 ? (
              <p className="text-sm text-white/75">
                Одоогоор бүртгэл алга. Нэг удаа тестээ өгөөд дүгнэлтээ хармагц энд хадгалагдана.
              </p>
            ) : (
              <div className="space-y-2">
                {history.slice(0, 8).map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                  >
                    <span className="text-white/80">
                      {new Date(h.at).toLocaleString()}
                    </span>
                    <span className="font-semibold text-white">{h.totalPercent}%</span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-white/60">
              * Дараагийн шатанд энэ “явц”-ыг Supabase руу хадгалдаг болгоно.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
