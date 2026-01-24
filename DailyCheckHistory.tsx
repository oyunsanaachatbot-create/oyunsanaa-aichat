"use client";

import { useEffect, useMemo, useState } from "react";

type Item = {
  check_date: string;
  score: number;
  level: string;
  mood: number;
  energy: number;
  stress: number;
  anxiety: number;
  sleep_quality: number;
  note?: string | null;
};

export default function DailyCheckHistory() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/mind/emotion/daily-check?days=30");
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? "Failed to load");
      setItems(j.items ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const fn = () => load();
    window.addEventListener("daily-check:saved", fn);
    return () => window.removeEventListener("daily-check:saved", fn);
  }, []);

  const avg = useMemo(() => {
    if (!items.length) return null;
    const s = items.reduce((a, b) => a + (b.score ?? 0), 0);
    return Math.round(s / items.length);
  }, [items]);

  return (
    <div className="rounded-2xl border bg-white/5 backdrop-blur p-5 md:p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-lg font-semibold">Сүүлийн 30 хоног</div>
          <div className="text-sm opacity-75">Явцын бүртгэл</div>
        </div>
        <div className="text-right">
          <div className="text-xs opacity-70">Дундаж</div>
          <div className="text-xl font-semibold">{avg ?? "—"}</div>
        </div>
      </div>

      {loading ? <div className="text-sm opacity-80">Ачаалж байна...</div> : null}
      {err ? <div className="text-sm opacity-80">Алдаа: {err}</div> : null}

      {!loading && !err && items.length === 0 ? (
        <div className="text-sm opacity-80">Одоогоор бүртгэл алга. Өнөөдрөөс эхлүүлээрэй.</div>
      ) : null}

      <div className="space-y-2">
        {items
          .slice()
          .reverse()
          .map((it) => (
            <div
              key={it.check_date}
              className="rounded-xl border bg-black/10 p-3 flex items-center justify-between gap-3"
            >
              <div>
                <div className="text-sm font-medium">{it.check_date}</div>
                <div className="text-xs opacity-70">
                  mood {it.mood}/5 · energy {it.energy}/5 · stress {it.stress}/5 · anxiety {it.anxiety}/5 · sleep{" "}
                  {it.sleep_quality}/5
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">{it.score}</div>
                <div className="text-xs opacity-70">{it.level}</div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
