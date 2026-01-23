"use client";

import { useEffect, useMemo, useState } from "react";
import type { BalanceDomain } from "../balance/test/constants";
import { DOMAIN_LABELS, DOMAIN_DAILY_APP_SUGGESTION, scoreBand } from "../balance/test/constants";

type DomainScore = {
  domain: BalanceDomain;
  score: number;
  rawAvg: number;
  answered: number;
  total: number;
};

type BalanceStoredRow = {
  id: string;
  created_at: string;
  overall_score: number;
  domain_scores: Record<BalanceDomain, DomainScore>;
};

export default function BalanceResultPage() {
  const [rows, setRows] = useState<BalanceStoredRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/balance/results", { method: "GET" });
      const data = (await res.json()) as { rows: BalanceStoredRow[] };
      setRows(data.rows ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const latest = rows[0];

  const domainsSorted = useMemo(() => {
    if (!latest) return [];
    return (Object.keys(latest.domain_scores) as BalanceDomain[])
      .map((d) => latest.domain_scores[d])
      .sort((a, b) => b.score - a.score);
  }, [latest]);

  return (
    <div
      className="min-h-[calc(100vh-0px)] text-white"
      style={{
        background: `linear-gradient(180deg, rgba(31,111,178,1) 0%, rgba(9,16,28,1) 70%, rgba(0,0,0,1) 100%)`,
      }}
    >
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
          <div className="text-xl font-semibold">Дүгнэлт</div>
          <div className="mt-1 text-sm text-white/80">
            Таны бөглөсөн дүгнэлтүүд хадгалагдана. Шинэ бөглөх бүрд хамгийн сүүлийн дүгнэлт дээр шинэчлэгдэнэ.
          </div>
        </div>

        {loading && (
          <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-5 text-sm text-white/80 backdrop-blur">
            Ачаалж байна...
          </div>
        )}

        {!loading && !latest && (
          <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-5 text-sm text-white/80 backdrop-blur">
            Одоогоор дүгнэлт байхгүй байна. Эхлээд “Тест” дээр тестээ бөглөөрэй.
          </div>
        )}

        {!loading && latest && (
          <>
            {/* Latest */}
            <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-sm text-white/80">Хамгийн сүүлийн дүгнэлт</div>
                  <div className="text-xs text-white/60">
                    {new Date(latest.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/70">Нийт оноо</div>
                  <div className="text-3xl font-bold">{latest.overall_score}</div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {domainsSorted.map((d) => {
                  const band = scoreBand(d.score);
                  const suggestion = DOMAIN_DAILY_APP_SUGGESTION[d.domain];
                  return (
                    <div key={d.domain} className="rounded-xl border border-white/10 bg-black/10 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold">{DOMAIN_LABELS[d.domain]}</div>
                        <div className="text-lg font-bold">{d.score}</div>
                      </div>

                      <div className="mt-1 text-sm text-white/80">
                        <span className="font-semibold">{band.label}:</span> {band.note}
                      </div>

                      {/* ✅ Жишээ тайлбар — чи дараа нь текстээ засна */}
                      <div className="mt-2 text-sm text-white/80">
                        Жишээ тайлбар: Энэ чиглэл дээр танд бага зэрэг тогтмол дадал нэмэхэд хангалттай байна.
                      </div>

                      {/* ✅ Өдөр тутмын app санал */}
                      <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3">
                        <div className="text-sm font-semibold">Санал болгох өдөр тутмын app</div>
                        <div className="mt-1 text-sm text-white/80">{suggestion.title}</div>
                        <div className="text-xs text-white/60">{suggestion.hint}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* History */}
            <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
              <div className="text-base font-semibold">Өмнөх дүгнэлтийн түүх</div>
              <div className="mt-3 space-y-2">
                {rows.slice(1).length === 0 ? (
                  <div className="text-sm text-white/70">Өмнөх түүх одоогоор алга.</div>
                ) : (
                  rows.slice(1).map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/10 px-4 py-3">
                      <div className="text-sm text-white/80">{new Date(r.created_at).toLocaleString()}</div>
                      <div className="text-sm font-semibold">Нийт: {r.overall_score}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
