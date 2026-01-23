"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MessageCircle, BarChart3 } from "lucide-react";
import { DOMAIN_LABEL, type BalanceDomain } from "@/content/balance/test";

type Attempt = {
  id: string;
  createdAt: string;
  domainScores: Record<BalanceDomain, number>;
  total: number;
};

const STORAGE_KEY = "oyunsanaa_balance_attempts";

function readLatest(): Attempt | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  const arr: Attempt[] = raw ? JSON.parse(raw) : [];
  return arr?.[0] ?? null;
}

function level(score: number) {
  if (score >= 80) return { name: "Маш сайн", tone: "text-white" };
  if (score >= 60) return { name: "Сайн", tone: "text-white/90" };
  if (score >= 40) return { name: "Дунд", tone: "text-white/85" };
  if (score >= 20) return { name: "Суларсан", tone: "text-white/80" };
  return { name: "Анхаарах хэрэгтэй", tone: "text-white/80" };
}

function insight(domain: BalanceDomain, score: number) {
  const l = level(score).name;

  const common = {
    strong:
      "Одоо байгаа сайн зуршлаа хадгал. Өөрийгөө буцааж тэнцвэрт оруулдаг зүйлсээ (унтах, алхах, бичих, ярилцах) үргэлжлүүл.",
    mid:
      "Зарим үед сайн, зарим үед хэлбэлздэг. Тогтвортой болгохын тулд жижиг тогтмол дадал сонгоод (өдөрт 10 минут) барьж үз.",
    low:
      "Сүүлийн үед энэ тал дээр ачаалал өндөр байна. Эхлээд амархан 1 алхам сонго (хуваарь, дэмжлэг, хил хязгаар, амралт) — дараа нь өргөжүүл.",
  };

  const pick = (score >= 70 ? common.strong : score >= 40 ? common.mid : common.low);

  const domainLine: Record<BalanceDomain, string> = {
    emotion: "Сэтгэл санааны тогтвортой байдал, өдрийн мэдрэмжийн хэлбэлзэлтэй холбоотой.",
    self: "Өөрийгөө ойлгох нь шийдвэр, итгэл, өөртөө үнэнч байхтай холбоотой.",
    relations: "Харилцаа нь ойлголцол, хил хязгаар, зөрчлийг эрүүл шийдэх чадвартай холбоотой.",
    purpose: "Зорилго, утга учир нь чиглэл, урам, тогтвортой ахицтай холбоотой.",
    selfCare: "Өөрийгөө хайрлах нь амралт, өөртөө эелдэг хандах, сэргээх чадвартай холбоотой.",
    life: "Тогтвортой байдал нь орчин, ажил/гэрийн стресс, нөхөн сэргэх боломжтой холбоотой.",
  };

  return {
    title: `${DOMAIN_LABEL[domain]} — ${l}`,
    body: `${domainLine[domain]} ${pick}`,
  };
}

export default function BalanceResultsPage() {
  const [latest, setLatest] = useState<Attempt | null>(null);

  useEffect(() => {
    setLatest(readLatest());
  }, []);

  const orderedDomains: BalanceDomain[] = useMemo(
    () => ["emotion", "self", "relations", "purpose", "selfCare", "life"],
    []
  );

  if (!latest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-3">
          <p>Одоогоор хадгалсан үр дүн алга байна.</p>
          <Link className="underline" href="/mind/balance/test">
            Тест бөглөх
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden text-slate-50 bg-gradient-to-b from-[#04101f] via-[#071a33] to-[#020816]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-[-20%] w-[420px] h-[420px] rounded-full bg-cyan-400/25 blur-3xl" />
        <div className="absolute -top-40 right-[-10%] w-[360px] h-[360px] rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute bottom-[-30%] right-[-10%] w-[520px] h-[520px] rounded-full bg-blue-900/70 blur-3xl" />
      </div>

      <main className="relative z-10 px-4 py-6 md:px-6 md:py-10 flex justify-center">
        <div className="w-full max-w-3xl rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_24px_80px_rgba(15,23,42,0.9)] px-4 py-5 md:px-7 md:py-7 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/mind/balance/test"
              className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-3.5 py-2 text-xs sm:text-sm text-slate-50 hover:bg-white/25 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Буцах
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-3.5 py-2 text-xs sm:text-sm text-slate-50 hover:bg-white/25 transition"
            >
              <MessageCircle className="h-4 w-4" />
              Чат руу
            </Link>
          </div>

          <div className="rounded-2xl border border-white/20 bg-[#1F6FB2]/25 backdrop-blur px-4 py-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 border border-white/25">
                <BarChart3 className="h-4 w-4" />
              </span>
              <div>
                <h1 className="text-lg sm:text-2xl font-semibold text-white">
                  Тестийн үр дүн
                </h1>
                <p className="text-xs sm:text-sm text-white/85">
                  Нийт үнэлгээ: <span className="font-semibold">{latest.total}/100</span>
                </p>
              </div>
            </div>
          </div>

          <section className="space-y-3">
            {orderedDomains.map((d) => {
              const score = latest.domainScores[d] ?? 0;
              const info = insight(d, score);

              return (
                <div
                  key={d}
                  className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-[0_14px_40px_rgba(15,23,42,0.65)] p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm sm:text-base font-semibold text-white">
                      {info.title}
                    </h2>
                    <span className="text-sm text-white/90 font-semibold">
                      {score}/100
                    </span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-white/15 overflow-hidden">
                    <div className="h-full rounded-full bg-white/70" style={{ width: `${score}%` }} />
                  </div>

                  <p className="text-sm text-white/85 leading-relaxed">{info.body}</p>
                </div>
              );
            })}
          </section>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href="/mind/balance/progress"
              className="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-white/90 hover:bg-white/15 transition"
            >
              Явц харах
            </Link>
            <Link
              href="/mind/balance/summary"
              className="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-white/90 hover:bg-white/15 transition"
            >
              Дүгнэлт (тайлбар) унших
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
