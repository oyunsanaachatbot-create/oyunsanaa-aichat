"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MessageCircle, Trash2, ChevronDown, ChevronUp } from "lucide-react";

import { BRAND, BALANCE_LAST_KEY, BALANCE_HISTORY_KEY } from "../test/constants";
import {
  levelFrom100,
  domainNarrative,
  tinyStepSuggestion,
  type BalanceResult,
  type BalanceDomain,
} from "../test/score";


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

function safeJSONParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readHistory(): HistoryRun[] {
  try {
    const parsed = safeJSONParse<HistoryRun[]>(localStorage.getItem(BALANCE_HISTORY_KEY));
    if (!parsed || !Array.isArray(parsed)) return [];
    // sanitize
    return parsed
      .filter((x) => x && typeof x.at === "number")
      .slice(0, 60);
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

/** Small deterministic “randomness” so text won’t feel repetitive, but also not fake. */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(seed: number, items: T[]): T {
  const r = mulberry32(seed)();
  return items[Math.floor(r * items.length)] ?? items[0];
}

function clamp100(v: number) {
  return Math.max(0, Math.min(100, v));
}

function Sparkline({ values }: { values: number[] }) {
  const n = values.length;

  if (n < 2) {
    return (
      <div className="text-xs text-slate-500">
        Явц харахын тулд дор хаяж 2 удаа тест бөглөнө.
      </div>
    );
  }

  // Responsive SVG sparkline (0..100)
  const w = 560;
  const h = 90;
  const padX = 10;
  const padY = 10;

  const xs = values.map((_, i) => padX + (i * (w - padX * 2)) / (n - 1));
  const ys = values.map((v) => {
    const vv = clamp100(v);
    return padY + (1 - vv / 100) * (h - padY * 2);
  });

  const lineD = xs
    .map((x, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${ys[i].toFixed(2)}`)
    .join(" ");

  const areaD = `${lineD} L ${xs[n - 1].toFixed(2)} ${(h - padY).toFixed(2)} L ${xs[0].toFixed(2)} ${(h - padY).toFixed(2)} Z`;

  const lastX = xs[n - 1];
  const lastY = ys[n - 1];

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="block w-full h-[92px]" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BRAND.hex} stopOpacity="0.22" />
            <stop offset="100%" stopColor={BRAND.hex} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* baseline grid */}
        {[25, 50, 75].map((t) => {
          const y = padY + (1 - t / 100) * (h - padY * 2);
          return (
            <line
              key={t}
              x1={padX}
              x2={w - padX}
              y1={y}
              y2={y}
              stroke="currentColor"
              opacity="0.08"
            />
          );
        })}

        {/* area fill */}
        <path d={areaD} fill="url(#sparkFill)" />

        {/* main line */}
        <path
          d={lineD}
          fill="none"
          stroke={BRAND.hex}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* dots */}
        {xs.map((x, i) => (
          <circle
            key={i}
            cx={x}
            cy={ys[i]}
            r="2.3"
            fill={BRAND.hex}
            opacity={i === n - 1 ? 1 : 0.45}
          />
        ))}

        {/* last point highlight */}
        <circle cx={lastX} cy={lastY} r="5.2" fill={BRAND.hex} opacity="0.18" />
        <circle cx={lastX} cy={lastY} r="3.2" fill={BRAND.hex} />
      </svg>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
        <span>0</span>
        <span>100</span>
      </div>
    </div>
  );
}

// App suggestions (daily use). You can edit text later freely.
type AppSuggestion = { title: string; href: string; note: string };

function appsForDomain(domain: string): AppSuggestion[] {
  // domain keys come from your scoring; keep map flexible
  const d = (domain || "").toLowerCase();

  // You can fine-tune mapping once you confirm exact domain names.
  if (d.includes("emotion") || d.includes("setgel") || d.includes("mood")) {
    return [
      {
        title: "Өдрийн сэтгэл санааны тест (check)",
        href: "/mind/emotion/control/daily-check",
        note: "Өдөр бүр 30 сек — “өнөөдөр би юу мэдэрч байна?” гэж хэмжээд тэмдэглэ.",
      },
      {
        title: "Стресс ажиглах тэмдэглэл",
        href: "/mind/emotion/control/progress",
        note: "Стрессийн давтамж, шалтгаанаа ажиглаад тайвшрах арга сонгоход тусална.",
      },
    ];
  }

  if (d.includes("self") || d.includes("өөрийгөө")) {
    return [
      {
        title: "Миний ертөнц — тэмдэглэл апп",
        href: "/mind/ebooks",
        note: "Өдөрт 3 мөр: “Одоо надад юу хэрэгтэй вэ?” гэдгээ бич. Тогтмол байдал их үр дүнтэй.",
      },
    ];
  }

  if (d.includes("relation") || d.includes("харилцаа")) {
    return [
      {
        title: "Харилцааны өөрийн хэв маяг",
        href: "/mind/relations/foundation",
        note: "Хэв маягаа мэдэхэд л зөрчил 50% багасдаг — богино дасгалуудаар эхэл.",
      },
      {
        title: "Хил хязгаарын дасгал",
        href: "/mind/relations/report",
        note: "“Үгүй” гэж хэлэх жижиг хэлбэрүүдийг өдөр тутамдаа дасгалжуулна.",
      },
    ];
  }

  if (d.includes("purpose") || d.includes("зорилго")) {
    return [
      {
        title: "Зорилго төлөвлөгөө апп",
        href: "/mind/purpose/planning",
        note: "7 хоногийн 1 жижиг зорилго → өдөр бүр 10 мин. Даралт багатай ахиц гарна.",
      },
      {
        title: "7 хоногийн жижиг алхам",
        href: "/mind/purpose/weekly-steps",
        note: "“Зөвхөн энэ долоо хоногт” гэсэн хэмжээнд жижиг алхам сонгоод тогтвортой болго.",
      },
    ];
  }

  if (d.includes("care") || d.includes("өөрийгөө хайрлах") || d.includes("health")) {
    return [
      {
        title: "Эрүүл мэнд апп",
        href: "/mind/self-care/stress",
        note: "Нойр/амралт/хөдөлгөөн зэрэг сууриа тогтоовол сэтгэл санаа хурдан тогтворжино.",
      },
      {
        title: "Хооллолтын ажиглалт",
        href: "/mind/self-care/nutrition",
        note: "Өдөрт 1 удаа л тэмдэглэ — эрч хүч, ядрал дээр маш хурдан нөлөөлдөг.",
      },
    ];
  }

  if (d.includes("life") || d.includes("тогтвортой") || d.includes("stable")) {
    return [
      {
        title: "Санхүү апп",
        href: "/mind/life/finance-app",
        note: "Санхүүгийн стресс ихэвчлэн ‘тодорхойгүй’-ээс болдог. Орлого/зарлагаа 1 удаа харахад л тайвширна.",
      },
    ];
  }

  // default
  return [
    {
      title: "Тест дахин бөглөх",
      href: "/mind/balance/test",
      note: "Дахин бөглөөд чиглэл бүрийн өөрчлөлтөө хараарай — жижиг ахиц хамгийн бодит урам өгдөг.",
    },
  ];
}

export default function BalanceResultPage() {
  const [history, setHistory] = useState<HistoryRun[]>([]);
  const [openDetails, setOpenDetails] = useState(true);
  const [openApps, setOpenApps] = useState(true);

  const data = useMemo(() => {
    const raw = safeJSONParse<Stored>(sessionStorage.getItem(BALANCE_LAST_KEY));
    return raw ?? null;
  }, []);

  useEffect(() => {
    const h = readHistory();
    setHistory(h);

    if (!data || !data.result) return;

    const r: any = data.result;

    const run: HistoryRun = {
      at: data.at,
      totalScore100: clamp100(Number(r.totalScore100 ?? 0)),
      domainScores: Array.isArray(r.domainScores)
        ? r.domainScores.map((d: any) => ({
            domain: String(d.domain ?? ""),
            label: String(d.label ?? ""),
            score100: clamp100(Number(d.score100 ?? 0)),
          }))
        : [],
    };

    // prevent duplicates
    const exists = h.some((x) => x.at === run.at);
    if (!exists) {
      const next = [run, ...h].slice(0, 60);
      writeHistory(next);
      setHistory(next);
    }
  }, [data]);

  if (!data || !data.result) {
    return (
      <div className="min-h-screen bg-white text-slate-900 grid place-items-center p-6">
        <div className="max-w-md text-center space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
          <h1 className="text-lg font-semibold">Тестийн дүгнэлт</h1>
          <p className="text-sm text-slate-700">
            Одоогоор дүгнэлт байхгүй байна. Эхлээд тест бөглөвөл энд автоматаар гарч ирнэ.
          </p>
          <Link className="underline" href="/mind/balance/test">
            Тест бөглөх
          </Link>
        </div>
      </div>
    );
  }

  const result: any = data.result;
  const totalScore100 = clamp100(Number(result.totalScore100 ?? 0));
  const totalCount = Number(result.totalCount ?? 0);
  const answeredCount = Number(result.answeredCount ?? 0);

  const domainScores: any[] = Array.isArray(result.domainScores) ? result.domainScores : [];
  const sorted = [...domainScores].sort((a, b) => Number(a.score100 ?? 0) - Number(b.score100 ?? 0));
  const weakest2 = sorted.slice(0, 2);
  const strongest1 = sorted[sorted.length - 1];

  const totalText = levelFrom100(totalScore100);

  // make narrative less repetitive, but still truthful (based on scores)
  const seed = Math.floor((data.at ?? Date.now()) / 60000) + totalScore100 * 7 + answeredCount * 13;
  const opener = pick(seed, [
    "Энэ дүгнэлт бол ‘оноо’ биш — өнөөдрийн тэнцвэрийн зураглал.",
    "Чи өөрийгөө ажиглаж эхэлсэн нь хамгийн зөв эхлэл.",
    "Энд гарч байгаа нь ‘сайн/муу хүн’ гэсэн шүүлт биш — анхаарах цэгүүд.",
  ]);

  const midLine = pick(seed + 1, [
    "Хамгийн бага оноотой хэсгээс эхэлбэл хамгийн хурдан өөрчлөлт мэдрэгддэг.",
    "Нэг том өөрчлөлт биш — өдөр бүрийн жижиг давталт хамгийн хүчтэй.",
    "Системээ 1% сайжруулбал сэтгэл санаа дагаад тогтворжино.",
  ]);

  const actionLine = pick(seed + 2, [
    "Өнөөдөр зөвхөн 5 минут л зарцуулъя.",
    "Өнөөдөр жижигхэн нэг алхам сонгоё.",
    "Өнөөдөр өөртөө хамгийн бага ачаалалтай алхмаар эхэлье.",
  ]);

  const sparkValues = [...history].reverse().map((x) => clamp100(x.totalScore100));

  const onDeleteOne = (at: number) => {
    const next = history.filter((x) => x.at !== at);
    writeHistory(next);
    setHistory(next);
  };

  const onDeleteAll = () => {
    writeHistory([]);
    setHistory([]);
  };

  // app suggestions based on weakest domains
  const suggestedApps: AppSuggestion[] = [
    ...appsForDomain(String(weakest2[0]?.domain ?? "")),
    ...appsForDomain(String(weakest2[1]?.domain ?? "")),
  ].slice(0, 4);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* brand blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute -top-40 left-[-10%] h-[520px] w-[520px] rounded-full blur-3xl"
          style={{ background: `rgba(${BRAND.rgb},0.18)` }}
        />
        <div
          className="absolute -top-20 right-[-15%] h-[460px] w-[460px] rounded-full blur-3xl"
          style={{ background: `rgba(${BRAND.rgb},0.14)` }}
        />
        <div
          className="absolute bottom-[-30%] left-[20%] h-[620px] w-[620px] rounded-full blur-3xl"
          style={{ background: `rgba(${BRAND.rgb},0.10)` }}
        />
      </div>

      <main className="px-4 py-6 md:px-6 md:py-10 flex justify-center">
        <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.10)] px-4 py-5 md:px-7 md:py-7 space-y-5">
          {/* top nav */}
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/mind/balance/test"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Тест рүү
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              <MessageCircle className="h-4 w-4" />
              Чат руу
            </Link>
          </div>

          {/* TOTAL SUMMARY */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h1 className="text-lg sm:text-2xl font-semibold text-slate-900">Дүгнэлт</h1>

            <div className="mt-2 text-sm text-slate-700">
              Нийт оноо:{" "}
              <b style={{ color: BRAND.hex }}>{totalScore100}/100</b> — <b>{totalText.level}</b>
            </div>

            <p className="mt-2 text-sm text-slate-700">{totalText.tone}</p>

            <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${totalScore100}%`, backgroundColor: BRAND.hex }}
              />
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Хариулсан: {answeredCount}/{totalCount}
            </p>

            {/* AMID SUMMARY */}
            <div className="mt-4 rounded-xl border border-slate-200 p-4" style={{ background: `rgba(${BRAND.rgb},0.06)` }}>
              <p className="text-sm text-slate-800">
                <b style={{ color: BRAND.hex }}>Өнөөдрийн зураглал:</b> {opener}
              </p>

              <p className="mt-2 text-sm text-slate-700">
                <b>Анхаарах 2 чиглэл:</b>{" "}
                <b>{weakest2[0]?.label ?? "—"}</b>
                {weakest2[1]?.label ? (
                  <>
                    {" "}
                    ба <b>{weakest2[1]?.label}</b>
                  </>
                ) : null}
                . {midLine}
              </p>

              <p className="mt-2 text-sm text-slate-700">
                <b style={{ color: BRAND.hex }}>Өнөөдрийн 1 алхам:</b> {actionLine}{" "}
                <span className="font-medium">
               tinyStepSuggestion(((something) ?? ("self" as any)) as any)

                </span>
              </p>

              {strongest1?.label ? (
                <p className="mt-2 text-xs text-slate-600">
                  Давуу тал: <b>{strongest1.label}</b> — энэ чиглэл чинь харьцангуй тогтвортой байна. Үүнийг “суурь” гэж үзээд бусдаа дэмжээрэй.
                </p>
              ) : null}
            </div>

            {/* actions */}
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href="/mind/balance/test"
                className="inline-flex items-center justify-center rounded-2xl text-white px-4 py-3 text-sm font-semibold hover:opacity-95 transition"
                style={{ backgroundColor: BRAND.hex }}
              >
                Тест дахин бөглөх
              </Link>
              <a
                href="#details"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition"
              >
                Дэлгэрэнгүй рүү
              </a>
            </div>
          </div>

          {/* APP SUGGESTIONS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <button
              type="button"
              onClick={() => setOpenApps((v) => !v)}
              className="w-full flex items-center justify-between gap-3"
            >
              <div className="font-semibold text-slate-900">
                Өдөр тутамдаа ашиглавал хамгийн хурдан нөлөөлөх аппууд
              </div>
              {openApps ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
            </button>

            {openApps && (
              <div className="mt-3 grid gap-3">
                {suggestedApps.map((a) => (
                  <div
                    key={a.href + a.title}
                    className="rounded-xl border border-slate-200 p-3"
                    style={{ background: `rgba(${BRAND.rgb},0.04)` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900">{a.title}</div>
                        <div className="mt-1 text-xs text-slate-600">{a.note}</div>
                      </div>
                      <Link
                        href={a.href}
                        className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        Нээх
                      </Link>
                    </div>
                  </div>
                ))}

                <div className="text-xs text-slate-500">
                  Тайлбар: Энэ санал нь зөвхөн таны хамгийн сул 1–2 чиглэл дээр тулгуурласан. Хүсвэл өөр чиглэлээ ч сонгож ашиглаж болно.
                </div>
              </div>
            )}
          </div>

          {/* DETAILS toggle */}
          <div id="details" className="rounded-2xl border border-slate-200 bg-white p-4">
            <button
              type="button"
              onClick={() => setOpenDetails((v) => !v)}
              className="w-full flex items-center justify-between gap-3"
            >
              <div className="font-semibold text-slate-900">Дэлгэрэнгүй (чиглэл тус бүр)</div>
              {openDetails ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
            </button>

            {openDetails && (
              <div className="mt-3 space-y-3">
                {sorted.map((d: any) => {
                  const label = String(d.label ?? "");
                  const score100 = clamp100(Number(d.score100 ?? 0));
                  const answered = Number(d.answered ?? 0);
                  const total = Number(d.total ?? 0);
                  const weakest = Array.isArray(d.weakest) ? d.weakest : [];

                  return (
                    <div key={String(d.domain ?? label)} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold text-slate-900">{label}</div>
                        <div className="text-sm text-slate-700">
                          <b style={{ color: BRAND.hex }}>{score100}/100</b>
                        </div>
                      </div>

                      <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${score100}%`, backgroundColor: BRAND.hex }}
                        />
                      </div>

                      <p className="mt-2 text-sm text-slate-700">{domainNarrative(label, score100)}</p>

                      {weakest.length > 0 && (
                        <div
                          className="mt-3 rounded-xl border border-slate-200 p-3"
                          style={{ background: `rgba(${BRAND.rgb},0.06)` }}
                        >
                          <div className="text-xs font-semibold text-slate-700 mb-2">
                            Энэ чиглэлд хамгийн их доош татсан асуултууд:
                          </div>
                          <ul className="space-y-2">
                            {weakest.map((w: any) => (
                              <li key={String(w.id ?? w.text)} className="text-xs text-slate-700">
                                • {String(w.text ?? "")} — <b>{clamp100(Number(w.score100 ?? 0))}/100</b>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <p className="mt-3 text-sm text-slate-700">
                        <b style={{ color: BRAND.hex }}>Жижиг алхам:</b>{" "}
                       tinyStepSuggestion(((something) ?? ("self" as any)) as any)

                      </p>

                      <p className="mt-2 text-xs text-slate-500">
                        (Хариулсан: {answered}/{total})
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* PROGRESS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold text-slate-900">Явц (өмнөх тестүүд)</div>
              <button
                type="button"
                onClick={onDeleteAll}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
              >
                <Trash2 className="h-4 w-4" />
                Бүгдийг устгах
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 p-3" style={{ background: `rgba(${BRAND.rgb},0.04)` }}>
              <div className="text-xs text-slate-500 mb-2">Нийт онооны өөрчлөлт (0–100)</div>
              <Sparkline values={sparkValues} />
            </div>

            <div className="space-y-2">
              {history.length === 0 ? (
                <div className="text-sm text-slate-600">
                  Одоогоор түүх алга. Дахин тест бөглөхөд энд явц харагдана.
                </div>
              ) : (
                history.map((h) => (
                  <div
                    key={h.at}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-slate-800">
                        <b style={{ color: BRAND.hex }}>{clamp100(h.totalScore100)}/100</b>{" "}
                        <span className="text-xs text-slate-500">— {new Date(h.at).toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {h.domainScores
                          .slice()
                          .sort((a, b) => a.score100 - b.score100)
                          .map((d) => `${d.label}:${clamp100(d.score100)}`)
                          .join(" • ")}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteOne(h.at)}
                      className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Устгах
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div
            className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700"
            style={{ background: `rgba(${BRAND.rgb},0.06)` }}
          >
            Хүсвэл дараагийн шатанд бид: “энэ явцыг Supabase-д хадгалж”, төхөөрөмж солиход ч түүхээ алдахгүй болгоно.
          </div>
        </div>
      </main>
    </div>
  );
}
