"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MessageCircle, Trash2, ChevronDown, ChevronUp } from "lucide-react";

import { AppCard, AppShell, Button } from "@/components/mind/app-shell";
import { BRAND, BALANCE_LAST_KEY, BALANCE_HISTORY_KEY } from "../test/constants";
import {
  levelFrom100,
  domainNarrative,
  buildNarrative,
  type BalanceResult,
} from "../test/score";
import { useT } from "@/lib/i18n/provider";

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
    return parsed.filter((x) => x && typeof x.at === "number").slice(0, 60);
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

function clamp100(v: number) {
  return Math.max(0, Math.min(100, v));
}

function Sparkline({ values, emptyHint }: { values: number[]; emptyHint: string }) {
  const n = values.length;

  if (n < 2) {
    return (
      <div className="text-xs text-slate-500">
        {emptyHint}
      </div>
    );
  }

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

        <path d={areaD} fill="url(#sparkFill)" />

        <path
          d={lineD}
          fill="none"
          stroke={BRAND.hex}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

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

type AppSuggestion = { title: string; href: string; note: string };
type BalanceDict = ReturnType<typeof useT>["apps"]["balance"];

function appsForDomain(domain: string, b: BalanceDict): AppSuggestion[] {
  const d = (domain || "").toLowerCase();

  if (d.includes("emotion")) {
    return [
      { ...b.apps.emotion[0], href: "/mind/emotion/control/daily-check" },
      { ...b.apps.emotion[1], href: "/mind/emotion/control/progress" },
    ];
  }
  if (d.includes("self") && !d.includes("selfcare")) {
    return [{ ...b.apps.self[0], href: "/mind/ebooks" }];
  }
  if (d.includes("relations")) {
    return [
      { ...b.apps.relations[0], href: "/mind/relations/foundation" },
      { ...b.apps.relations[1], href: "/mind/relations/report" },
    ];
  }
  if (d.includes("purpose")) {
    return [
      { ...b.apps.purpose[0], href: "/mind/purpose/planning" },
      { ...b.apps.purpose[1], href: "/mind/purpose/weekly-steps" },
    ];
  }
  if (d.includes("selfcare") || d.includes("care")) {
    return [
      { ...b.apps.selfCare[0], href: "/mind/self-care/stress" },
      { ...b.apps.selfCare[1], href: "/mind/self-care/nutrition" },
    ];
  }
  if (d.includes("life")) {
    return [{ ...b.apps.life[0], href: "/mind/life/finance-app" }];
  }

  return [{ ...b.apps.default[0], href: "/mind/balance/test" }];
}

export default function BalanceResultPage() {
  const t = useT();
  const b = t.apps.balance;

  const [history, setHistory] = useState<HistoryRun[]>([]);
  const [openDetails, setOpenDetails] = useState(true);
  const [openApps, setOpenApps] = useState(true);

  // ✅ өмнө нь useMemo байсан → энэ нь refresh/route үед data-г дахин авч чаддаггүй
  const [data, setData] = useState<Stored | null>(null);

  // 1) LOCAL HISTORY унших
  useEffect(() => {
    setHistory(readHistory());
  }, []);

  // 2) RESULT-г ачаалах: эхлээд sessionStorage → байхгүй бол Supabase-с latest татна
  useEffect(() => {
    let cancelled = false;

    async function load() {
      // (A) sessionStorage (test дууссаны дараа шууд ирсэн бол энд байна)
      const cached = safeJSONParse<Stored>(sessionStorage.getItem(BALANCE_LAST_KEY));
      if (cached?.result) {
        if (!cancelled) setData(cached);
        return;
      }

      // (B) Supabase fallback: тухайн хэрэглэгчийн хамгийн сүүлийн "mind-balance"
      try {
        const res = await fetch("/api/test-runs/latest?testSlug=mind-balance", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const json = await res.json();
        const item = json?.item ?? null;

        if (!item || !item.result) return;

        const stored: Stored = {
          answers: item.answers ?? {},
          result: item.result,
          at: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
        };

        // дараа дахин хурдан харагдахад sessionStorage-д бас хадгалчихъя
        try {
          sessionStorage.setItem(BALANCE_LAST_KEY, JSON.stringify(stored));
        } catch {}

        if (!cancelled) setData(stored);

        // history-г local дээр нэмээд явц харуулна
        const r: any = stored.result;
        const run: HistoryRun = {
          at: stored.at,
          totalScore100: clamp100(Number(item.total_score100 ?? r.totalScore100 ?? 0)),
          domainScores: Array.isArray(r.domainScores)
            ? r.domainScores.map((d: any) => ({
                domain: String(d.domain ?? ""),
                label: String(d.label ?? ""),
                score100: clamp100(Number(d.score100 ?? 0)),
              }))
            : [],
        };

        const h = readHistory();
        if (!h.some((x) => x.at === run.at)) {
          const next = [run, ...h].slice(0, 60);
          writeHistory(next);
          if (!cancelled) setHistory(next);
        }
      } catch {
        // ignore
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ✅ data байхгүй бол "дүгнэлт байхгүй" (одоо бол Supabase-с татаж чадвал data гарна)
  if (!data || !data.result) {
    return (
      <AppShell title={b.result.headerSmall} backHref="/mind/balance" width="4xl">
        <AppCard>
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div
              aria-hidden
              className="grid size-12 place-items-center rounded-full text-2xl"
              style={{ background: `rgba(${BRAND.rgb},0.10)` }}
            >
              📊
            </div>
            <h1 className="font-bold text-lg" style={{ color: "#0F172A" }}>
              {b.result.noDataTitle}
            </h1>
            <p className="max-w-sm text-sm leading-relaxed" style={{ color: "rgba(15,23,42,0.6)" }}>
              {b.result.noDataText}
            </p>
            <Button href="/mind/balance/test" className="mt-1">
              {b.result.noDataLink}
            </Button>
          </div>
        </AppCard>
      </AppShell>
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

  const totalText = levelFrom100(totalScore100, b);

  const seed = Math.floor((data.at ?? Date.now()) / 60000) + totalScore100 * 7 + answeredCount * 13;
  const narrative = buildNarrative({
    totalScore100,
    weakestLabels: [String(weakest2[0]?.label ?? ""), String(weakest2[1]?.label ?? "")].filter(Boolean),
    strongestLabel: String(strongest1?.label ?? "") || undefined,
    seed,
    dict: b,
  });

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

  const suggestedApps: AppSuggestion[] = [
    ...appsForDomain(String(weakest2[0]?.domain ?? ""), b),
    ...appsForDomain(String(weakest2[1]?.domain ?? ""), b),
  ].slice(0, 4);

  return (
    <AppShell title={b.result.headerSmall} backHref="/mind/balance/test" width="4xl">
      <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-[13px] text-slate-500">{b.result.headerSmall}</div>
            <h1 className="mt-1 text-xl sm:text-3xl font-semibold text-slate-900">{narrative.headline}</h1>

            <div className="mt-3 text-sm text-slate-700">
              {b.result.totalScoreLabel} <b style={{ color: BRAND.hex }}>{totalScore100}/100</b> — <b>{totalText.level}</b>
            </div>

            <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${totalScore100}%`, backgroundColor: BRAND.hex }} />
            </div>

            <p className="mt-2 text-xs text-slate-500">{b.result.answeredLabel} {answeredCount}/{totalCount}</p>

            <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 p-4" style={{ background: `rgba(${BRAND.rgb},0.06)` }}>
              <p className="text-sm text-slate-800 leading-relaxed">{narrative.summary}</p>
              <p className="text-sm text-slate-700 leading-relaxed">{narrative.meaning}</p>
              <p className="text-sm text-slate-700 leading-relaxed">{narrative.focus}</p>
              <p className="text-sm text-slate-700 leading-relaxed">{narrative.strength}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <button type="button" onClick={() => setOpenApps((v) => !v)} className="w-full flex items-center justify-between gap-3">
              <div className="font-semibold text-slate-900">{b.result.appsTitle}</div>
              {openApps ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
            </button>

            {openApps && (
              <div className="mt-3 grid gap-3">
                {suggestedApps.map((a) => (
                  <div key={a.href + a.title} className="rounded-xl border border-slate-200 p-3" style={{ background: `rgba(${BRAND.rgb},0.04)` }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900">{a.title}</div>
                        <div className="mt-1 text-xs text-slate-600">{a.note}</div>
                      </div>
                      <Link href={a.href} className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                        {b.result.openBtn}
                      </Link>
                    </div>
                  </div>
                ))}
                <div className="text-xs text-slate-500">{b.result.appsHint}</div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <button type="button" onClick={() => setOpenDetails((v) => !v)} className="w-full flex items-center justify-between gap-3">
              <div className="font-semibold text-slate-900">{b.result.detailsTitle}</div>
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
                        <div className="text-sm text-slate-700"><b style={{ color: BRAND.hex }}>{score100}/100</b></div>
                      </div>

                      <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${score100}%`, backgroundColor: BRAND.hex }} />
                      </div>

                      <p className="mt-2 text-sm text-slate-700 leading-relaxed">{domainNarrative(label, score100, b)}</p>

                      {weakest.length > 0 && (
                        <div className="mt-3 rounded-xl border border-slate-200 p-3" style={{ background: `rgba(${BRAND.rgb},0.06)` }}>
                          <div className="text-xs font-semibold text-slate-700 mb-2">{b.result.weakestQTitle}</div>
                          <ul className="space-y-2">
                            {weakest.map((w: any) => (
                              <li key={String(w.id ?? w.text)} className="text-xs text-slate-700">
                                • {String(w.text ?? "")} — <b>{clamp100(Number(w.score100 ?? 0))}/100</b>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <p className="mt-2 text-xs text-slate-500">{b.result.answeredParens.replace("{answered}", String(answered)).replace("{total}", String(total))}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Link
            href="/mind/balance/test"
            className="inline-flex items-center justify-center rounded-2xl text-white px-4 py-3 text-sm font-semibold hover:opacity-95 transition"
            style={{ backgroundColor: BRAND.hex }}
          >
            {b.result.retakeBtn}
          </Link>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold text-slate-900">{b.result.progressTitle}</div>
              <button type="button" onClick={onDeleteAll} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                <Trash2 className="h-4 w-4" />
                {b.result.deleteAll}
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 p-3" style={{ background: `rgba(${BRAND.rgb},0.04)` }}>
              <div className="text-xs text-slate-500 mb-2">{b.result.sparklineLabel}</div>
              <Sparkline values={sparkValues} emptyHint={b.result.sparklineMin2} />
            </div>

            <div className="space-y-2">
              {history.length === 0 ? (
                <div className="text-sm text-slate-600">{b.result.noHistory}</div>
              ) : (
                history.map((h) => (
                  <div key={h.at} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                    <div className="min-w-0">
                      <div className="text-sm text-slate-800">
                        <b style={{ color: BRAND.hex }}>{clamp100(h.totalScore100)}/100</b>{" "}
                        <span className="text-xs text-slate-500">— {new Date(h.at).toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {h.domainScores.slice().sort((a, b) => a.score100 - b.score100).map((d) => `${d.label}:${clamp100(d.score100)}`).join(" • ")}
                      </div>
                    </div>

                    <button type="button" onClick={() => onDeleteOne(h.at)} className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                      <Trash2 className="h-4 w-4" />
                      {b.result.deleteOne}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700" style={{ background: `rgba(${BRAND.rgb},0.06)` }}>
            {b.result.footerNote}
          </div>
      </div>
    </AppShell>
  );
}
