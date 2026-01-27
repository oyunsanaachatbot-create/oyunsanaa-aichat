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
  goal_text: string;
  description: string;
  goal_type: GoalType;
  priority: number; // 1-5
  start_date: string; // UI only
  end_date: string; // saved into target_date
  frequency: Frequency;
  times: number; // хэдэн удаа?
  minutes: number; // нэг удаад (мин)
};

type GoalItem = {
  id: string;
  user_id: string;
  goal_text: string;
  category: string | null; // goal_type энд хадгална
  priority: number | null;
  target_date: string | null; // end_date энд хадгална
  status: string; // draft | confirmed | archived ...
  created_at: string;
  updated_at: string;
};

type Tab = "add" | "organize" | "execute";

const BRAND = "#1F6FB2";

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function daysBetween(aISO: string, bISO: string) {
  if (!aISO || !bISO) return null;
  const a = new Date(aISO + "T00:00:00");
  const b = new Date(bISO + "T00:00:00");
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function durationBucket(startISO: string, endISO: string) {
  const d = daysBetween(startISO, endISO);
  if (d === null) return "Тодорхойгүй";
  if (d <= 30) return "Богино (≤ 30 хоног)";
  if (d <= 180) return "Дунд (31–180 хоног)";
  return "Урт (≥ 181 хоног)";
}

function dailyMinutes(freq: Frequency, times: number, minutes: number) {
  const total = Math.max(0, times) * Math.max(0, minutes);
  if (freq === "Өдөрт") return total;
  if (freq === "7 хоногт") return total / 7;
  if (freq === "Сард") return total / 30;
  return total / 365;
}

export default function GoalPlannerPage() {
  const [tab, setTab] = useState<Tab>("execute");

  const [draft, setDraft] = useState<DraftGoal>({
    goal_text: "",
    description: "",
    goal_type: "Хувийн",
    priority: 3,
    start_date: todayISO(),
    end_date: "",
    frequency: "7 хоногт",
    times: 3,
    minutes: 30,
  });

  const [items, setItems] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // execute logs
  const [logDate, setLogDate] = useState(todayISO());
  const [logs, setLogs] = useState<Record<string, { done: boolean; note: string }>>({});
  const [logLoading, setLogLoading] = useState(false);

  const hasAny = items.length > 0;
  const confirmed = useMemo(() => items.filter((x) => x.status === "confirmed"), [items]);
  const drafts = useMemo(() => items.filter((x) => x.status !== "confirmed"), [items]);

  // initial tab: if confirmed exists => execute else add
  useEffect(() => {
    if (confirmed.length > 0) setTab("execute");
    else setTab("add");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAny]);

  async function loadItems() {
    setLoading(true);
    try {
      const res = await fetch("/api/goal-planner", { method: "GET" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "LOAD_FAILED");
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      // keep quiet (UI дээр алдаа spam хийхгүй)
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  const canAdd = useMemo(() => draft.goal_text.trim().length > 0, [draft.goal_text]);

  async function addNextGoal() {
    if (!canAdd || saving) return;
    setSaving(true);
    try {
      const body = {
        goal_text: draft.goal_text.trim(),
        category: draft.goal_type, // goal_type-г category-д хадгална
        priority: draft.priority,
        target_date: draft.end_date || null,
        status: "draft",
        // description/start_date/frequency/times/minutes: одоохондоо UI-д.
        // Хэрвээ дараа table өргөтгөвөл эндээс хадгалж болно.
      };

      const res = await fetch("/api/goal-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "SAVE_FAILED");

      // reset only the writing fields
      setDraft((d) => ({
        ...d,
        goal_text: "",
        description: "",
      }));

      await loadItems();
    } catch (e) {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function confirmAll() {
    // draft-уудыг confirmed болгоно
    const toConfirm = items.filter((x) => x.status !== "confirmed");
    if (toConfirm.length === 0) {
      setTab("execute");
      return;
    }

    setSaving(true);
    try {
      for (const g of toConfirm) {
        await fetch("/api/goal-planner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: g.id, status: "confirmed" }),
        });
      }
      await loadItems();
      setTab("execute");
    } finally {
      setSaving(false);
    }
  }

  async function removeGoal(id: string) {
    if (!id) return;
    setSaving(true);
    try {
      await fetch("/api/goal-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "archived" }),
      });
      await loadItems();
    } finally {
      setSaving(false);
    }
  }

  // ----------------- EXECUTE logs -----------------
  async function loadLogs(dateISO: string) {
    setLogLoading(true);
    try {
      const res = await fetch(`/api/goal-logs?date=${encodeURIComponent(dateISO)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "LOG_LOAD_FAILED");

      const map: Record<string, { done: boolean; note: string }> = {};
      for (const row of data?.logs ?? []) {
        map[row.goal_id] = { done: !!row.done, note: row.note ?? "" };
      }
      setLogs(map);
    } catch (e) {
      setLogs({});
    } finally {
      setLogLoading(false);
    }
  }

  useEffect(() => {
    if (tab !== "execute") return;
    loadLogs(logDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, logDate, confirmed.length]);

  async function toggleDone(goalId: string, done: boolean) {
    const prev = logs[goalId] ?? { done: false, note: "" };
    setLogs((m) => ({ ...m, [goalId]: { ...prev, done } }));

    await fetch("/api/goal-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal_id: goalId, date: logDate, done, note: prev.note }),
    });
  }

  async function saveNote(goalId: string, note: string) {
    const prev = logs[goalId] ?? { done: false, note: "" };
    setLogs((m) => ({ ...m, [goalId]: { ...prev, note } }));

    await fetch("/api/goal-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal_id: goalId, date: logDate, done: prev.done, note }),
    });
  }

  const progress = useMemo(() => {
    const total = confirmed.length;
    if (total === 0) return { total: 0, done: 0, pct: 0 };
    let done = 0;
    for (const g of confirmed) {
      if (logs[g.id]?.done) done += 1;
    }
    return { total, done, pct: Math.round((done / total) * 100) };
  }, [confirmed, logs]);

  // ----------------- ORGANIZE summary -----------------
  const summary = useMemo(() => {
    // зөвхөн draft+confirmed бүгдээр нь ангилж харуулна (чиний хүссэнээр цэгцлэхэд бүгд гарна)
    const start = draft.start_date; // UI-ийн start_date-г goal бүрээр хадгалаагүй тул одоохондоо нэг default ашиглая.
    // (дараа нь meta/column өргөтгөвөл яг бүрээр нь тооцно)

    const buckets: Record<string, GoalItem[]> = {};
    for (const g of items) {
      const end = g.target_date ?? "";
      const b = end ? durationBucket(start, end) : "Тодорхойгүй";
      buckets[b] = buckets[b] ?? [];
      buckets[b].push(g);
    }

    // өдөрт нийт цагийг draft form дээрх frequency/times/minutes ашиглан “ойролцоогоор” харуулж байна.
    // (дараа зорилго бүр дээр хадгалбал яг бодит болно.)
    const dayMin = dailyMinutes(draft.frequency, draft.times, draft.minutes);
    const totalDailyMin = Math.round(dayMin * Math.max(1, items.length));

    return { buckets, totalDailyMin };
  }, [items, draft.frequency, draft.times, draft.minutes, draft.start_date]);

  // ----------------- UI -----------------
  return (
    <div className="w-full">
      {/* Top bar: 3 always-visible buttons */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-2">
          <button
            type="button"
            className="rounded-full border px-3 py-2 text-sm"
            onClick={() => window.history.back()}
            aria-label="Буцах"
          >
            ←
          </button>

          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => setTab("add")}
              className={`rounded-full px-4 py-2 text-sm border ${
                tab === "add" ? "text-white" : ""
              }`}
              style={tab === "add" ? { background: BRAND, borderColor: BRAND } : {}}
            >
              Нэмэх
            </button>

            <button
              type="button"
              onClick={() => setTab("organize")}
              className={`rounded-full px-4 py-2 text-sm border ${
                tab === "organize" ? "text-white" : ""
              }`}
              style={tab === "organize" ? { background: BRAND, borderColor: BRAND } : {}}
            >
              Цэгцлэх
            </button>

            <button
              type="button"
              onClick={() => setTab("execute")}
              className={`rounded-full px-4 py-2 text-sm border ${
                tab === "execute" ? "text-white" : ""
              }`}
              style={tab === "execute" ? { background: BRAND, borderColor: BRAND } : {}}
            >
              Хэрэгжүүлэх
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          🧩 <span>Зорилго бичиж цэгцлэх</span>
        </h1>

        {loading ? (
          <div className="text-sm text-gray-500">Уншиж байна…</div>
        ) : null}

        {/* TAB: ADD */}
        {tab === "add" && (
          <div className="space-y-4">
            <div className="rounded-2xl border p-4 space-y-4">
              {/* 1) goal type */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Зорилгийн төрөл</div>
                <select
                  className="w-full rounded-xl border px-3 py-3 text-base"
                  value={draft.goal_type}
                  onChange={(e) => setDraft((d) => ({ ...d, goal_type: e.target.value as GoalType }))}
                >
                  {["Хувийн", "Ажил", "Гэр бүл", "Эрүүл мэнд", "Санхүү", "Сурч хөгжих", "Бусад"].map(
                    (x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* 2) priority */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Энэ зорилго хэр чухал вэ? (1–5)</div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={draft.priority}
                    onChange={(e) => setDraft((d) => ({ ...d, priority: Number(e.target.value) }))}
                    className="w-full"
                    style={{ accentColor: BRAND }}
                  />
                  <div className="w-10 text-center font-semibold">{draft.priority}</div>
                </div>
              </div>

              {/* 3) dates */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Зорилго хэрэгжих хугацаа</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500">Эхлэх өдөр</div>
                    <input
                      type="date"
                      className="w-full rounded-xl border px-3 py-3 text-base"
                      value={draft.start_date}
                      onChange={(e) => setDraft((d) => ({ ...d, start_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500">Дуусах өдөр</div>
                    <input
                      type="date"
                      className="w-full rounded-xl border px-3 py-3 text-base"
                      value={draft.end_date}
                      onChange={(e) => setDraft((d) => ({ ...d, end_date: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* 4) goal text */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Зорилго</div>
                <input
                  className="w-full rounded-xl border px-3 py-3 text-base"
                  placeholder="Жишээ: 7 хоногт 3 удаа 30 минут алхана"
                  value={draft.goal_text}
                  onChange={(e) => setDraft((d) => ({ ...d, goal_text: e.target.value }))}
                />
              </div>

              {/* 5) description */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Тайлбар (сонголтоор)</div>
                <textarea
                  className="w-full rounded-xl border px-3 py-3 text-base min-h-[92px]"
                  placeholder="Товч тайлбар (хүсвэл)"
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                />
              </div>

              {/* 6) time budget */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Хэр их цаг гаргаж чадах вэ?</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500">Давтамж</div>
                    <select
                      className="w-full rounded-xl border px-3 py-3 text-base"
                      value={draft.frequency}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, frequency: e.target.value as Frequency }))
                      }
                    >
                      {["Өдөрт", "7 хоногт", "Сард", "Жилд"].map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-gray-500">Хэдэн удаа?</div>
                    <input
                      type="number"
                      min={1}
                      className="w-full rounded-xl border px-3 py-3 text-base"
                      value={draft.times}
                      onChange={(e) => setDraft((d) => ({ ...d, times: Number(e.target.value) }))}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-gray-500">Нэг удаад (мин)</div>
                    <input
                      type="number"
                      min={5}
                      step={5}
                      className="w-full rounded-xl border px-3 py-3 text-base"
                      value={draft.minutes}
                      onChange={(e) => setDraft((d) => ({ ...d, minutes: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="text-xs text-gray-600">
                  Өдөрт ойролцоогоор{" "}
                  <span className="font-semibold" style={{ color: BRAND }}>
                    {Math.round(dailyMinutes(draft.frequency, draft.times, draft.minutes))} мин
                  </span>{" "}
                  зарцуулна.
                </div>
              </div>

              {/* buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={addNextGoal}
                  disabled={!canAdd || saving}
                  className="rounded-xl px-4 py-3 text-white text-sm font-medium disabled:opacity-60"
                  style={{ background: BRAND }}
                >
                  Дараагийн зорилго
                </button>

                <button
                  type="button"
                  onClick={() => setTab("organize")}
                  className="rounded-xl px-4 py-3 text-sm font-medium border"
                >
                  Цэгцлэх
                </button>
              </div>
            </div>

            {/* list below (files) */}
            <div className="rounded-2xl border p-4 space-y-3">
              <div className="text-sm font-semibold">Бичсэн зорилгууд</div>

              {items.length === 0 ? (
                <div className="text-sm text-gray-500">Одоогоор зорилго алга.</div>
              ) : (
                <div className="space-y-2">
                  {items.map((g) => (
                    <div key={g.id} className="rounded-xl border p-3">
                      <div className="text-sm font-medium">{g.goal_text}</div>
                      <div className="mt-1 text-xs text-gray-600 flex flex-wrap gap-x-3 gap-y-1">
                        <span>Төрөл: {g.category ?? "-"}</span>
                        <span>Чухал: {g.priority ?? "-"}</span>
                        <span>Дуусах: {g.target_date ?? "-"}</span>
                        <span>Status: {g.status}</span>
                      </div>
                      <div className="mt-2">
                        <button
                          type="button"
                          className="text-xs text-red-600 underline"
                          onClick={() => removeGoal(g.id)}
                          disabled={saving}
                        >
                          Устгах
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setTab("organize")}
                  className="rounded-xl px-4 py-3 text-white text-sm font-medium w-full disabled:opacity-60"
                  style={{ background: BRAND }}
                  disabled={items.length === 0}
                >
                  Зорилго цэгцлэх
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: ORGANIZE */}
        {tab === "organize" && (
          <div className="space-y-4">
            <div className="rounded-2xl border p-4 space-y-2">
              <div className="text-sm font-semibold">Цагийн тооцоо</div>
              <div className="text-sm">
                Өдөрт ойролцоогоор:{" "}
                <span className="font-semibold" style={{ color: BRAND }}>
                  {Math.floor(summary.totalDailyMin / 60)}ц {summary.totalDailyMin % 60}мин
                </span>
              </div>
              <div className="text-xs text-gray-500">
                (Одоохондоо нэг загвар тооцоо. Дараа зорилго бүрийн давтамж/минутыг тус бүр хадгалбал бүр
                яг болно.)
              </div>
            </div>

            <div className="rounded-2xl border p-4 space-y-3">
              <div className="text-sm font-semibold">Зорилгууд ангилсан байдлаар</div>

              {Object.keys(summary.buckets).length === 0 ? (
                <div className="text-sm text-gray-500">Цэгцлэх зүйл алга.</div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(summary.buckets).map(([k, arr]) => (
                    <div key={k} className="rounded-xl border p-3">
                      <div className="text-sm font-semibold">{k}</div>
                      <div className="mt-2 space-y-2">
                        {arr.map((g) => (
                          <div key={g.id} className="rounded-lg border p-2">
                            <div className="text-sm">{g.goal_text}</div>
                            <div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                              <span>Төрөл: {g.category ?? "-"}</span>
                              <span>Чухал: {g.priority ?? "-"}</span>
                              <span>Дуусах: {g.target_date ?? "-"}</span>
                              <span>Status: {g.status}</span>
                            </div>
                            <div className="mt-2">
                              <button
                                type="button"
                                className="text-xs text-red-600 underline"
                                onClick={() => removeGoal(g.id)}
                                disabled={saving}
                              >
                                Устгах
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={confirmAll}
                  className="rounded-xl px-4 py-3 text-white text-sm font-medium w-full disabled:opacity-60"
                  style={{ background: BRAND }}
                  disabled={items.length === 0 || saving}
                >
                  Баталгаажуулах
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: EXECUTE */}
        {tab === "execute" && (
          <div className="space-y-4">
            {confirmed.length === 0 ? (
              <div className="rounded-2xl border p-4">
                <div className="text-sm text-gray-600">
                  Баталгаажуулсан зорилго алга. “Нэмэх” дээр зорилго бичээд “Цэгцлэх → Баталгаажуулах”
                  хийнэ.
                </div>
              </div>
            ) : (
              <>
                {/* unified board */}
                <div className="rounded-2xl border p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">Өнөөдрийн явц</div>
                    <div className="text-xs text-gray-600">
                      {progress.done}/{progress.total} зорилго
                    </div>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: BRAND }}>
                    {progress.pct}%
                  </div>
                </div>

                {/* date picker */}
                <div className="rounded-2xl border p-4">
                  <div className="text-sm font-medium mb-2">Өдөр сонгох</div>
                  <input
                    type="date"
                    className="w-full rounded-xl border px-3 py-3 text-base"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                  />
                  {logLoading ? <div className="text-xs text-gray-500 mt-2">Уншиж байна…</div> : null}
                </div>

                {/* goal list with calendar-like expand */}
                <div className="space-y-3">
                  {confirmed.map((g) => {
                    const state = logs[g.id] ?? { done: false, note: "" };
                    return (
                      <details key={g.id} className="rounded-2xl border p-4">
                        <summary className="cursor-pointer list-none">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={state.done}
                              onChange={(e) => toggleDone(g.id, e.target.checked)}
                              style={{ accentColor: BRAND }}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-semibold">{g.goal_text}</div>
                              <div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                <span>Төрөл: {g.category ?? "-"}</span>
                                <span>Чухал: {g.priority ?? "-"}</span>
                                <span>Дуусах: {g.target_date ?? "-"}</span>
                              </div>
                            </div>
                          </div>
                        </summary>

                        <div className="mt-3 space-y-2">
                          <div className="text-sm font-medium">Тэмдэглэл</div>
                          <textarea
                            className="w-full rounded-xl border px-3 py-3 text-base min-h-[92px]"
                            placeholder="Өнөөдөр яаж хэрэгжүүлэв?"
                            value={state.note}
                            onChange={(e) => saveNote(g.id, e.target.value)}
                          />
                          <button
                            type="button"
                            className="text-xs text-red-600 underline"
                            onClick={() => removeGoal(g.id)}
                            disabled={saving}
                          >
                            Устгах
                          </button>
                        </div>
                      </details>
                    );
                  })}
                </div>

                {/* quick add button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setTab("add")}
                    className="rounded-xl px-4 py-3 text-sm font-medium border w-full"
                  >
                    Шинэ зорилго нэмэх
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
