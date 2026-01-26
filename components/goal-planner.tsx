"use client";

import { useState } from "react";

type Item = {
  id: string;
  text: string;
  freq: "daily" | "weekly" | "monthly";
  minutes: number;
};

export function GoalPlanner({
  onShowResult,
}: {
  onShowResult: (title: string, markdown: string) => void;
}) {
  const [dailyMinutes, setDailyMinutes] = useState(120);
  const [goalText, setGoalText] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  const add = () => {
    const t = goalText.trim();
    if (!t) return;
    setItems((p) => [
      { id: Math.random().toString(36).slice(2), text: t, freq: "daily", minutes: 30 },
      ...p,
    ]);
    setGoalText("");
  };

  const remove = (id: string) => setItems((p) => p.filter((x) => x.id !== id));

  const organize = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/goal/organize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyMinutesBudget: dailyMinutes, goals: items }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "API error");

      onShowResult("🧩 Зорилго цэгцэлсэн үр дүн", data.markdown);
    } catch (e: any) {
      alert(e?.message ?? "Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="text-sm font-semibold">🧩 Зорилго бичиж цэгцлэх</div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="text-xs text-muted-foreground">Өдөрт боломжит минут</div>
        <input
          type="number"
          value={dailyMinutes}
          min={0}
          max={1440}
          onChange={(e) => setDailyMinutes(Number(e.target.value || 0))}
          className="w-full md:w-40 rounded-md border px-3 py-2"
        />
      </div>

      <textarea
        value={goalText}
        onChange={(e) => setGoalText(e.target.value)}
        placeholder="Зорилгоо энд бич..."
        className="w-full min-h-[90px] rounded-xl border bg-transparent p-3 text-[15px] leading-7 outline-none"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={add}
          className="rounded-md px-4 py-2 text-white"
          style={{ backgroundColor: "#1F6FB2" }}
        >
          Нэмэх
        </button>

        <button
          type="button"
          onClick={organize}
          disabled={loading || items.length === 0}
          className="rounded-md border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
        >
          {loading ? "Цэгцэлж байна..." : "🧠 Oyunsanaa цэгцлэх"}
        </button>
      </div>

      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className="flex items-start justify-between gap-2 rounded-lg border p-3">
            <div className="min-w-0">
              <div className="font-medium truncate">{it.text}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {it.freq} • {it.minutes} мин
              </div>
            </div>
            <button
              type="button"
              className="rounded-md border px-3 py-1 text-sm"
              onClick={() => remove(it.id)}
            >
              Устгах
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-sm text-muted-foreground">Одоогоор нэмсэн зорилго алга.</div>
        )}
      </div>
    </div>
  );
}
