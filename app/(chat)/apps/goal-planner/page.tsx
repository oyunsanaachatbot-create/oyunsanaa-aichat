"use client";

import { useEffect, useMemo, useState } from "react";

type GoalType =
  | "Хувийн"
  | "Ажил"
  | "Гэр бүл"
  | "Эрүүл мэнд"
  | "Санхүү"
  | "Сурч хөгжих"
  | "Бусад";

type Frequency = "Өдөрт" | "7 хоногт" | "Сард" | "Жилд";

type DraftGoal = {
  localId: string;
  goal_text: string;
  description: string;
  goal_type: GoalType;
  start_date: string; // UI only
  end_date: string; // saved into target_date
  frequency: Frequency; // UI only
  hours: number; // UI only
};

type GoalItem = {
  id: string;
  session_id: string;
  user_id: string;
  goal_text: string;
  category: string | null;
  priority: number | null;
  target_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function GoalPlannerPage() {
  const [queue, setQueue] = useState<DraftGoal[]>([]);
  const [items, setItems] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form
  const [goalType, setGoalType] = useState<GoalType>("Хувийн");
  const [startDate, setStartDate] = useState<string>(todayISO());
  const [endDate, setEndDate] = useState<string>("");
  const [goalText, setGoalText] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [frequency, setFrequency] = useState<Frequency>("7 хоногт");
  const [hours, setHours] = useState<number>(3);

  // REVIEW toggle (жагсаалт харагдана, зөвхөн доорхи summary/батлах хэсэг toggle)
  const [showReview, setShowReview] = useState(false);

  const canAdd = useMemo(() => goalText.trim().length > 0, [goalText]);

  async function loadItems() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/goal-planner", { method: "GET" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "LOAD_FAILED");
      setItems(data?.items ?? []);
    } catch (e: any) {
      setError(e?.message ?? "LOAD_FAILED");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  function addNextGoal() {
    if (!canAdd) return;

    const d: DraftGoal = {
      localId: uid(),
      goal_text: goalText.trim(),
      description: description.trim(),
      goal_type: goalType,
      start_date: startDate || "",
      end_date: endDate || "",
      frequency,
      hours: Number.isFinite(hours) ? Math.max(0, Math.floor(hours)) : 0,
    };

    // ШУУД доод жагсаалт руу нэмнэ
    setQueue((q) => [d, ...q]);

    // form reset
    setGoalText("");
    setDescription("");

    // жагсаалт гарч ирэхэд review автоматаар хаалттай байг (хүсвэл өөрчилж болно)
    setShowReview(false);
  }

  function removeFromQueue(localId: string) {
    setQueue((q) => q.filter((x) => x.localId !== localId));
    // хоосорвол review хаана
    setShowReview((prev) => (queue.length - 1 <= 0 ? false : prev));
  }

  function editFromQueue(d: DraftGoal) {
    setGoalType(d.goal_type);
    setStartDate(d.start_date || todayISO());
    setEndDate(d.end_date || "");
    setGoalText(d.goal_text);
    setDescription(d.description);
    setFrequency(d.frequency);
    setHours(d.hours);

    removeFromQueue(d.localId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveAll() {
    if (queue.length === 0) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        title: "Зорилго",
        goals: queue.map((q) => ({
          goal_text: q.goal_text,
          category: q.goal_type, // төрөл
          priority: 3, // UI дээр байхгүй
          target_date: q.end_date || null,
          status: "draft",
        })),
      };

      const res = await fetch("/api/goal-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "SAVE_FAILED");

      // хадгалсны дараа queue цэвэрлээд доод жагсаалтыг шинэчилнэ
      setQueue([]);
      setShowReview(false);
      await loadItems();
    } catch (e: any) {
      setError(e?.message ?? "SAVE_FAILED");
    } finally {
      setSaving(false);
    }
  }

  const totals = useMemo(() => {
    let weekly = 0;
    for (const q of queue) {
      const h = Number(q.hours) || 0;
      if (q.frequency === "Өдөрт") weekly += h * 7;
      else if (q.frequency === "7 хоногт") weekly += h;
      else if (q.frequency === "Сард") weekly += (h * 12) / 52;
      else if (q.frequency === "Жилд") weekly += h / 52;
    }
    return { weekly: Math.round(weekly * 10) / 10 };
  }, [queue]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6">
      {/* Title */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧩</span>
          <h1 className="text-xl font-semibold tracking-tight">Зорилго бичиж цэгцлэх</h1>
        </div>
      </div>

      {/* error */}
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Form card */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Зорилгын төрөл</label>
            <select
              value={goalType}
              onChange={(e) => setGoalType(e.target.value as GoalType)}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand,#1F6FB2)]"
            >
              <option>Хувийн</option>
              <option>Ажил</option>
              <option>Гэр бүл</option>
              <option>Эрүүл мэнд</option>
              <option>Санхүү</option>
              <option>Сурч хөгжих</option>
              <option>Бусад</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Эхлэх өдөр</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand,#1F6FB2)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Дуусах өдөр</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand,#1F6FB2)]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Зорилго</label>
            <input
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              placeholder="Жишээ: 7 хоногт 3 удаа 30 минут алхана"
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand,#1F6FB2)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Тайлбар</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="(сонголтоор)"
              rows={3}
              className="w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand,#1F6FB2)]"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Хугацаа</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as Frequency)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand,#1F6FB2)]"
              >
                <option>Өдөрт</option>
                <option>7 хоногт</option>
                <option>Сард</option>
                <option>Жилд</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Хэдэн цаг гаргах вэ?</label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value || "0", 10))}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand,#1F6FB2)]"
              />
            </div>
          </div>

          {/* buttons */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              onClick={addNextGoal}
              disabled={!canAdd}
              className="inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-50 sm:w-auto"
              style={{ backgroundColor: "var(--brand,#1F6FB2)" }}
            >
              + Дараагийн зорилго
            </button>

            <button
              onClick={loadItems}
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-50 sm:w-auto"
            >
              Дахин ачаалах
            </button>

            <div className="text-sm text-slate-500 sm:ml-auto">{loading ? "Ачааллаж байна…" : null}</div>
          </div>
        </div>
      </div>

      {/* ✅ Draft list ALWAYS visible (өмнөх шиг) */}
      <div className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-2 text-sm font-medium text-slate-700">
          Бичсэн зорилгууд ({queue.length})
        </div>

        {queue.length === 0 ? (
          <div className="text-sm text-slate-500">Одоогоор бичсэн зорилго алга.</div>
        ) : (
          <div className="space-y-2">
            {queue.map((q) => (
              <div key={q.localId} className="rounded-xl border p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-900">{q.goal_text}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {q.goal_type}
                      {q.end_date ? ` • ${q.end_date}` : ""}
                      {` • ${q.frequency} ${q.hours} цаг`}
                    </div>
                    {q.description ? (
                      <div className="mt-2 text-sm text-slate-700">{q.description}</div>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => editFromQueue(q)}
                      className="rounded-xl border px-3 py-2 text-xs font-medium"
                    >
                      Засах
                    </button>
                    <button
                      onClick={() => removeFromQueue(q.localId)}
                      className="rounded-xl border px-3 py-2 text-xs font-medium text-red-600"
                    >
                      Устгах
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ✅ Button under the draft list (чиний хэлснээр) */}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            onClick={() => setShowReview((v) => !v)}
            disabled={queue.length === 0}
            className="inline-flex w-full items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-50 sm:w-auto"
          >
            Зорилго цэгцлэх ({queue.length})
          </button>

          {showReview ? (
            <button
              onClick={saveAll}
              disabled={saving || queue.length === 0}
              className="inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-50 sm:w-auto"
              style={{ backgroundColor: "var(--brand,#1F6FB2)" }}
            >
              {saving ? "Хадгалж байна…" : "Хадгалаад баталгаажуулах"}
            </button>
          ) : null}

          {showReview ? (
            <div className="text-sm text-slate-600 sm:ml-auto">
              Нийт: <span className="font-semibold">{totals.weekly}</span> цаг / 7 хоногт
            </div>
          ) : null}
        </div>
      </div>

      {/* Saved items */}
      <div className="mt-6 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-2 text-sm font-medium text-slate-700">Хадгалсан зорилгууд</div>

        {items.length === 0 ? (
          <div className="text-sm text-slate-500">Одоогоор зорилго алга.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[700px] w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-3">Зорилго</th>
                  <th className="py-2 pr-3">Төрөл</th>
                  <th className="py-2 pr-3">Дуусах</th>
                  <th className="py-2 pr-3">Статус</th>
                </tr>
              </thead>
              <tbody className="text-slate-800">
                {items.map((it) => (
                  <tr key={it.id} className="border-t">
                    <td className="py-2 pr-3">{it.goal_text}</td>
                    <td className="py-2 pr-3">{it.category ?? "-"}</td>
                    <td className="py-2 pr-3">{it.target_date ?? "-"}</td>
                    <td className="py-2 pr-3">{it.status ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
