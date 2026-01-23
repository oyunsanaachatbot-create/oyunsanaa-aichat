"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MessageCircle } from "lucide-react";

type DomainKey = "emotion" | "self" | "relations" | "purpose" | "selfCare" | "life";

type StoredResult = {
  // 0-4 дундаж
  domainAvg: Record<DomainKey, number>;
  // 0-100 хувь
  domainPercent: Record<DomainKey, number>;
  // нийт
  totalAvg: number;
  totalPercent: number;
  answeredCount: number;
  totalCount: number;
  createdAt: string; // ISO
};

const DOMAIN_LABEL: Record<DomainKey, string> = {
  emotion: "Сэтгэл санаа",
  self: "Өөрийгөө ойлгох",
  relations: "Харилцаа",
  purpose: "Зорилго, утга учир",
  selfCare: "Өөрийгөө хайрлах",
  life: "Тогтвортой байдал",
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function levelText(avg0to4: number) {
  // 0..4
  if (avg0to4 >= 3.5) return { title: "Маш сайн", tone: "Сайн тогтвортой байна." };
  if (avg0to4 >= 2.8) return { title: "Сайн", tone: "Ерөнхийдөө боломжийн байна." };
  if (avg0to4 >= 2.0) return { title: "Дунд", tone: "Савлагаатай үе байж магадгүй." };
  if (avg0to4 >= 1.2) return { title: "Анхаарах", tone: "Ядрал/дарамт нөлөөлж байж болно." };
  return { title: "Түр завсар хэрэгтэй", tone: "Одоо дэмжлэг, амралт чухал." };
}

export default function BalanceResultPage() {
  const [stored, setStored] = useState<StoredResult | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("balance:lastResult");
      if (raw) setStored(JSON.parse(raw));
    } catch {
      setStored(null);
    } finally {
      setReady(true);
    }
  }, []);

  const orderedDomains = useMemo<DomainKey[]>(
    () => ["emotion", "self", "relations", "purpose", "selfCare", "life"],
    []
  );

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1F6FB2] text-white">
        Уншиж байна...
      </div>
    );
  }

  if (!stored) {
    return (
      <div className="min-h-screen bg-[#1F6FB2] text-white">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/mind/balance/test"
              className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-3 py-2 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Тест рүү буцах
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-3 py-2 text-sm"
            >
              <MessageCircle className="h-4 w-4" />
              Чат руу
            </Link>
          </div>

          <div className="mt-6 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl p-5">
            <h1 className="text-2xl font-semibold">Дүгнэлт (6 чиглэлээр)</h1>
            <p className="mt-2 text-white/90">
              Одоогоор тестийн үр дүн олдсонгүй. Ихэнхдээ тестийг бөглөсний дараа “Дүн гаргах”
              дээр дараагүй үед ингэж гардаг.
            </p>

            <div className="mt-4 flex gap-2 flex-wrap">
              <Link
                href="/mind/balance/test"
                className="rounded-xl bg-white text-slate-900 px-4 py-2 text-sm font-medium"
              >
                Тест бөглөх
              </Link>
              <Link
                href="/"
                className="rounded-xl bg-white/15 border border-white/25 px-4 py-2 text-sm font-medium"
              >
                Чат руу буцах
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1F6FB2] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-[-20%] w-[420px] h-[420px] rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -top-40 right-[-10%] w-[360px] h-[360px] rounded-full bg-black/20 blur-3xl" />
        <div className="absolute bottom-[-30%] right-[-10%] w-[520px] h-[520px] rounded-full bg-black/25 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 py-6">
        {/* Top actions */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/mind/balance/test"
            className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-3 py-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Буцах
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-3 py-2 text-sm"
          >
            <MessageCircle className="h-4 w-4" />
            Чат руу
          </Link>
        </div>

        {/* Card */}
        <div className="mt-6 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_24px_80px_rgba(15,23,42,0.35)] p-5 sm:p-7">
          <h1 className="text-2xl sm:text-3xl font-semibold">Дүгнэлт (6 чиглэлээр)</h1>

          <p className="mt-2 text-white/90 text-sm sm:text-base">
            Энэ үр дүн нь онош биш. Харин “аль талдаа илүү анхаарах вэ?” гэдгийг тодруулах туслах зураглал юм.
            Хүссэн үедээ дахин тест өгч болно — таны түүх болон явцад хадгалагдана.
          </p>

          {/* Total */}
          <div className="mt-5 rounded-2xl border border-white/20 bg-black/15 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-white/85">
                Нийт оноо: <span className="font-semibold text-white">{Math.round(stored.totalPercent)}%</span>
              </div>
              <div className="text-xs text-white/75">
                {stored.answeredCount}/{stored.totalCount} асуулт
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full bg-white/80"
                style={{ width: `${clamp(stored.totalPercent, 0, 100)}%` }}
              />
            </div>
          </div>

          {/* Domains */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {orderedDomains.map((k) => {
              const avg = stored.domainAvg[k] ?? 0;
              const pct = stored.domainPercent[k] ?? 0;
              const lv = levelText(avg);

              return (
                <div key={k} className="rounded-2xl border border-white/20 bg-black/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold">{DOMAIN_LABEL[k]}</div>
                      <div className="mt-1 text-sm text-white/85">
                        {lv.title} — {lv.tone}
                      </div>
                    </div>
                    <div className="text-sm font-semibold">{Math.round(pct)}%</div>
                  </div>

                  <div className="mt-3 h-2 rounded-full bg-white/15 overflow-hidden">
                    <div className="h-full bg-white/80" style={{ width: `${clamp(pct, 0, 100)}%` }} />
                  </div>

                  {/* App suggestion placeholder */}
                  <div className="mt-3 text-xs text-white/80">
                    Зөвлөмж: энэ чиглэл дээр өдөр бүр жижиг дадал тогтоохын тулд холбогдох апп-аа ашиглаарай.
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/mind/balance/test"
              className="rounded-xl bg-white text-slate-900 px-4 py-2 text-sm font-medium"
            >
              Тестийг дахин бөглөх
            </Link>
            <Link
              href="/"
              className="rounded-xl bg-white/15 border border-white/25 px-4 py-2 text-sm font-medium"
            >
              Чат руу буцах
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
