// app/(chat)/mind/balance/result/page.tsx
"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, MessageCircle } from "lucide-react";

import { BRAND, type BalanceDomain } from "../test/constants";
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

const LAST_KEY = "balance:lastResult";

// ✅ ЖИШЭЭ: domain бүрт харуулах app-ууд (чи дараа нь өөрөө засна)
const DOMAIN_APPS: Record<
  BalanceDomain,
  { title: string; items: { label: string; href?: string; note: string }[] }
> = {
  emotion: {
    title: "Сэтгэл санаа — өдөр тутмын туслах",
    items: [
      { label: "Тест", note: "Сэтгэл санааны байдлаа богино хугацаанд үнэлж харах." },
      { label: "Дүгнэлт", note: "Өөрийн сүүлийн үр дүнгээ харах, өөрчлөлтөө ажиглах." },
      { label: "Явц", note: "Хугацааны явцад хэрхэн өөрчлөгдөж байгааг харах." },
    ],
  },
  self: {
    title: "Өөрийгөө ойлгох — чиглэл тодруулах",
    items: [{ label: "Өөрийгөө ойлгох", note: "Өөрийгөө таних, триггер, үнэ цэнээ тодруулах дасгалууд." }],
  },
  relations: {
    title: "Харилцаа — холбоо ба хил хязгаар",
    items: [{ label: "Харилцаа", note: "Сонсох, ойлгох, хил хязгаар тогтоох өдөр тутмын дадал." }],
  },
  purpose: {
    title: "Зорилго — утга учир ба чиглэл",
    items: [{ label: "Зорилго, утга учир", note: "Зорилгоо жижиг алхам болгох, хойшлуулахыг багасгах." }],
  },
  selfCare: {
    title: "Өөрийгөө хайрлах — зөөлөн дэмжлэг",
    items: [{ label: "Өөрийгөө хайрлах", note: "Өөртэйгөө эелдэг байх, өөрийгөө буруутгахыг багасгах." }],
  },
  life: {
    title: "Тогтвортой байдал — амьдралын хэвшил",
    items: [{ label: "Тогтвортой байдал", note: "Нойр, хөдөлгөөн, хоол, санхүү, орчны тогтвортой жижиг дүрэм." }],
  },
};

// ✅ domain label -> domain key тааруулах (label-үүд чинь Монгол хэлээр ирж байгаа тул mapping хийнэ)
const LABEL_TO_DOMAIN: Record<string, BalanceDomain> = {
  "Сэтгэл санаа": "emotion",
  "Өөрийгөө ойлгох": "self",
  "Харилцаа": "relations",
  "Зорилго, утга учир": "purpose",
  "Өөрийгөө хайрлах": "selfCare",
  "Тогтвортой байдал": "life",
};

function domainSummary(domain: BalanceDomain, percent: number) {
  // ✅ domain бүр өөр өөр өгүүлбэр
  if (domain === "emotion") {
    return percent >= 60
      ? "Сэтгэл санааны суурь боломжийн байна. Тайван байдлаа тогтвортой байлгах жижиг дадлаа хадгалаарай."
      : "Сэтгэл санаа амархан савлаж байгаа шинжтэй. Өдөр бүр нэг жижиг тайвшруулах алхам сонгоорой.";
  }
  if (domain === "self") {
    return percent >= 60
      ? "Өөрийгөө ойлгох суурь сайн байна. Триггер, үнэ цэнээ тогтмол эргэж хараарай."
      : "Өөрийгөө ойлгох талд тодорхойгүй байдал мэдрэгдэж байна. Өдөр бүр 5 минут өөртэйгөө ярилцах дадал эхлүүлээрэй.";
  }
  if (domain === "relations") {
    return percent >= 60
      ? "Харилцааны ур чадвар боломжийн байна. Ил тод, тайван ярилцах дадлаа хадгалаарай."
      : "Харилцааны ачаалал их байж магадгүй. Нэг жижиг хил хязгаарын алхам сонгоод туршаарай.";
  }
  if (domain === "purpose") {
    return percent >= 60
      ? "Зорилгын чиг баримжаа боломжийн байна. Жижиг алхам болгон хувааж тогтвортой үргэлжлүүлээрэй."
      : "Зорилгын тодорхойгүй байдал/хойшлуулах хэв маяг ажиглагдаж байна. Өнөөдөр ганц жижиг алхам сонго.";
  }
  if (domain === "selfCare") {
    return percent >= 60
      ? "Өөртөө анхаарах дадал боломжийн байна. Өөртэйгөө эелдэг байх хэвшлээ үргэлжлүүлээрэй."
      : "Өөрийгөө хайрлах талд дэмжлэг хэрэгтэй байна. Өдөр бүр 1 жижиг энэрэнгүй алхам сонгоорой.";
  }
  // life
  return percent >= 60
    ? "Тогтвортой амьдралын хэвшил боломжийн байна. Унтах/хоол/хөдөлгөөний нэг жижиг дүрмээ хадгалаарай."
    : "Амьдралын хэвшилд тогтворгүй тал ажиглагдаж байна. Нэг жижиг дүрэм (унтах цаг гэх мэт) сонгоод 7 хоног баримтлаарай.";
}

export default function BalanceResultPage() {
  const data = useMemo(() => {
    const raw = sessionStorage.getItem(LAST_KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-950 text-slate-50 p-6">
        <div className="max-w-md text-center space-y-3">
          <p>Дүн олдсонгүй. Эхлээд тестээ өгнө үү.</p>
          <Link className="underline" href="/mind/balance/test">
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
        background: `radial-gradient(1200px 600px at 50% -10%, rgba(${BRAND.rgb},0.55), rgba(2,8,22,1) 55%)`,
      }}
    >
      <main className="px-4 py-6 md:px-6 md:py-10 flex justify-center">
        <div className="w-full max-w-3xl rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_24px_80px_rgba(15,23,42,0.9)] px-4 py-5 md:px-7 md:py-7 space-y-5">
          {/* top buttons */}
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/mind/balance"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs hover:bg-white/15 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Буцах
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs hover:bg-white/15 transition"
            >
              <MessageCircle className="h-4 w-4" />
              Чат руу
            </Link>
          </div>

          {/* total */}
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

          {/* domain cards */}
          <div className="space-y-3">
            {result.domainScores
              .slice()
              .sort((a, b) => a.percent - b.percent)
              .map((d) => {
                const domain = LABEL_TO_DOMAIN[d.label] as BalanceDomain | undefined;
                const percent = Math.round(d.percent);
                const t = interpret(d.percent);

                return (
                  <div key={d.label} className="rounded-2xl border border-white/15 bg-white/10 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold">{d.label}</div>
                      <div className="text-sm text-slate-100/90">
                        <b>{percent}%</b>
                      </div>
                    </div>

                    <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: BRAND.hex }} />
                    </div>

                    <p className="mt-2 text-sm text-slate-100/90">
                      <b>{t.level}:</b> {domain ? domainSummary(domain, d.percent) : t.tone}
                    </p>

                    {/* ✅ App recommendations */}
                    {domain && (
                      <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="text-xs font-semibold text-slate-100/90">
                          Өдөр тутмын санал болгох app-ууд
                        </div>
                        <ul className="mt-2 space-y-1 text-sm text-slate-100/85">
                          {DOMAIN_APPS[domain].items.map((it, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="mt-[2px] h-1.5 w-1.5 rounded-full bg-white/60" />
                              <span>
                                <b>{it.label}:</b> {it.note}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <p className="mt-2 text-xs text-slate-100/70">
                      (Хариулсан: {d.answered}/{d.total})
                    </p>
                  </div>
                );
              })}
          </div>

          {/* ✅ bottom buttons — зөвхөн хэрэгтэй 2 */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/mind/balance/test"
              className="inline-flex items-center justify-center rounded-2xl bg-white text-slate-900 px-4 py-3 text-sm font-semibold hover:bg-white/90 transition"
            >
              Тест эхлүүлэх
            </Link>
            <Link
              href="/mind/balance/progress"
              className="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-white/90 hover:bg-white/15 transition"
            >
              Явц харах
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
