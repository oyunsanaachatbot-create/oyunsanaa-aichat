"use client";

import { useEffect, useMemo, useState } from "react";

type Period = "day" | "week" | "month" | "year";

type DraftGoal = {
  localId: string;

  // 1) төрөл (UI-д)
  goalType: string;

  // 4) зорилго
  goal_text: string;

  // 5) тайлбар (UI-д)
  note: string;

  // 2) priority = чухал
  priority: number; // 1-5

  // 3) хугацаа (UI-д)
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD (Supabase -> target_date)

  // 6) цагийн боломж (UI-д)
  period: Period;
  times: number; // хэдэн удаа
  minutesEach: number; // нэг удаад минут
};

type GoalItem = {
  id: string;
  session_id: string;
  user_id: string;
  goal_text: string;
  category: string | null;
  priority: number;
  target_date: string | null;
  status: "draft" | "confirmed" | "archived" | string;
  created_at: string;
  updated_at: string;
};

const BRAND = "#1F6FB2";

const GOAL_TYPES = [
  "Хувийн",
  "Ажил/Карьер",
  "Гэр бүл",
  "Санхүү",
  "Эрүүл мэнд",
  "Сурч хөгжих",
  "Харилцаа",
  "Бусад",
];

const PERIODS: { value: Period; label: string }[] = [
  { value: "day", label: "Өдөрт" },
  { value: "week", label: "7 хоногт" },
  { value: "month", label: "Сард" },
  { value: "year", label: "Жилд" },
];

function uid() {
  // Next build дээр Math.random-оос болж асуудал үүсгэхээс сэргийлнэ
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return String(Date.now());
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatHours(mins: number) {
  const h = mins / 60;
  if (h < 1) return `${mins} мин`;
  return `${h.toFixed(h % 1 === 0 ? 0 : 1)} цаг`;
}

export default function GoalPlannerPage() {
  const [title, setTitle] = useState("Зорилгын багц");
  const [items, setItems] = useState<GoalItem[]>([]);
  const [queue, setQueue] = useState<DraftGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<"edit" | "review">("edit");

  const [draft, setDraft] = useState<DraftGoal>({
    localId: uid(),
    goalType: "Хувийн",
    goal_text: "",
    note: "",
    priority: 3,
    start_date: "",
    end_date: "",
    period: "week",
    times: 3,
    minutesEach: 30,
  });

  const canAdd = useMemo(() => draft.goal_text.trim().length > 0, [draft.goal_text]);

  const draftTotalMinutes = useMemo(() => {
    const t = clamp(draft.times, 1, 99);
    const m = clamp(draft.minutesEach, 5, 600);
    return t * m;
  }, [draft.times, draft.minutesEach]);

  const queueTotals = useMemo(() => {
    const totals: Record<Period, number> = { day: 0, week: 0, month: 0, year: 0 };
    for (const g of queue) totals[g.period] += clamp(g.times, 1, 99) * clamp(g.minutesEach, 5, 600);
    return totals;
  }, [queue]);

  async function loadItems() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/goal-planner", { method: "GET" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "LOAD_FAILED");
      setItems(data.items ?? []);
    } catch (e: any) {
      setError(e.message ?? "LOAD_FAILED");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  function addToQueue() {
    if (!canAdd) return;

    setQueue((q) => [
      {
        ...draft,
        goal_text: draft.goal_text.trim(),
        localId: uid(),
        priority: clamp(draft.priority, 1, 5),
        times: clamp(draft.times, 1, 99),
        minutesEach: clamp(draft.minutesEach, 5, 600),
      },
      ...q,
    ]);

    // дараагийн зорилго руу цэвэрлэж шилжинэ (гол утгууд үлдэнэ)
    setDraft((d) => ({
      ...d,
      localId: uid(),
      goal_text: "",
      note: "",
      start_date: "",
      end_date: "",
    }));
  }

  function removeFromQueue(localId: string) {
    setQueue((q) => q.filter((x) => x.localId !== localId));
  }

  async function saveAll() {
    if (queue.length === 0) return;
    setSaving(true);
    setError(null);

    try {
      // Supabase/API-г эвдэхгүй: одоо байгаа schema руугаа л явуулна
      const payload = {
        title,
        goals: queue.map((g) => ({
          goal_text: g.goal_text,
          category: g.goalType, // түрдээ goalType-оо category талбарт хадгалж болно (хүсвэл дараа салгана)
          priority: g.priority,
          target_date: g.end_date ? g.end_date : null, // дуусах өдөр = target_date
        })),
      };

      const res = await fetch("/api/goal-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "SAVE_FAILED");

      const inserted: GoalItem[] = data.items ?? [];
      setItems((prev) => [...inserted, ...prev]);
      setQueue([]);
      setMode("edit");
    } catch (e: any) {
      setError(e.message ?? "SAVE_FAILED");
    } finally {
      setSaving(false);
    }
  }

  // ---------- UI helpers ----------
  const shell: React.CSSProperties = {
    padding: 16,
    maxWidth: 980,
    margin: "0 auto",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    color: "#0f172a",
  };

  const headerCard: React.CSSProperties = {
    borderRadius: 16,
    padding: 16,
    border: "1px solid #e5e7eb",
    background: `linear-gradient(135deg, ${BRAND} 0%, #1d4ed8 100%)`,
    color: "white",
    marginBottom: 14,
  };

  const card: React.CSSProperties = {
    borderRadius: 16,
    padding: 16,
    border: "1px solid #e5e7eb",
    background: "white",
    boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
    marginBottom: 14,
  };

  const label: React.CSSProperties = { fontSize: 13, fontWeight: 800, marginBottom: 6 };
  const hint: React.CSSProperties = { fontSize: 12, opacity: 0.8, marginTop: 6 };
  const input: React.CSSProperties = {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    outline: "none",
    background: "white",
  };

  const select: React.CSSProperties = { ...input, appearance: "auto" };

  const btnPrimary: React.CSSProperties = {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.18)",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
    backdropFilter: "blur(6px)",
  };

  const btn: React.CSSProperties = {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "white",
    fontWeight: 900,
    cursor: "pointer",
  };

  const btnDanger: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    fontWeight: 900,
    cursor: "pointer",
  };

  return (
    <div style={shell}>
      {/* Header */}
      <div style={headerCard}>
        <div style={{ fontSize: 22, fontWeight: 1000, letterSpacing: -0.3 }}>🧩 Зорилго бичиж цэгцлэх</div>
        <div style={{ marginTop: 6, opacity: 0.95, lineHeight: 1.4 }}>
          {mode === "edit" ? (
            <>
              Зорилгоо бөглөөд <b>“Дараагийн зорилго”</b> дар → бүгдийг бичиж дуусаад <b>“Зорилго цэгцлэх”</b> дээр
              баталгаажуулна.
            </>
          ) : (
            <>
              Доорх жагсаалтаас зорилгуудаа шалгаад илүүдвэл устга → дараа нь <b>“Хадгалах”</b> дар.
            </>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginTop: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontWeight: 900 }}>Багцын нэр</div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ ...input, maxWidth: 420 }} />
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              Нэг дор цэгцлэх зорилгуудын “сэдэв/төслийн нэр”. Жишээ: <b>2026 Эрүүл мэнд</b>, <b>Гэр бүл</b>,{" "}
              <b>Ажил</b>.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => setMode("edit")}
              style={{ ...btnPrimary, opacity: mode === "edit" ? 1 : 0.7 }}
            >
              1) Бөглөх
            </button>
            <button
              onClick={() => setMode("review")}
              style={{ ...btnPrimary, opacity: mode === "review" ? 1 : 0.7 }}
              disabled={queue.length === 0}
              title={queue.length === 0 ? "Эхлээд дор хаяж 1 зорилго нэмээрэй" : ""}
            >
              2) Зорилго цэгцлэх ({queue.length})
            </button>
            <button onClick={loadItems} style={btnPrimary} disabled={loading}>
              {loading ? "Ачаалж байна..." : "Дахин ачаалах"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ ...card, borderColor: "#fecaca", background: "#fff1f2" }}>
          <b>Алдаа:</b> {error}
        </div>
      )}

      {/* EDIT MODE */}
      {mode === "edit" && (
        <>
          <div style={card}>
            <div style={{ fontSize: 16, fontWeight: 1000, marginBottom: 12 }}>1–6. Зорилго бөглөх</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
              {/* 1) Goal type */}
              <div>
                <div style={label}>1) Зорилгын төрөл</div>
                <select
                  value={draft.goalType}
                  onChange={(e) => setDraft((d) => ({ ...d, goalType: e.target.value }))}
                  style={select}
                >
                  {GOAL_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <div style={hint}>Хувийн / ажил / гэр бүл гэх мэтээр ангилна.</div>
              </div>

              {/* 2) Priority */}
              <div>
                <div style={label}>2) Энэ зорилго хэр чухал вэ?</div>
                <select
                  value={draft.priority}
                  onChange={(e) => setDraft((d) => ({ ...d, priority: Number(e.target.value) }))}
                  style={select}
                >
                  <option value={1}>1 — бага</option>
                  <option value={2}>2</option>
                  <option value={3}>3 — дундаж</option>
                  <option value={4}>4</option>
                  <option value={5}>5 — маш чухал</option>
                </select>
                <div style={hint}>Энэ нь эрэмбэ (priority) болно.</div>
              </div>

              {/* 3) Dates (mobile friendly) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={label}>3) Эхлэх өдөр</div>
                  <input
                    type="date"
                    value={draft.start_date}
                    onChange={(e) => setDraft((d) => ({ ...d, start_date: e.target.value }))}
                    style={input}
                  />
                </div>
                <div>
                  <div style={label}>Дуусах өдөр</div>
                  <input
                    type="date"
                    value={draft.end_date}
                    onChange={(e) => setDraft((d) => ({ ...d, end_date: e.target.value }))}
                    style={input}
                  />
                  <div style={hint}>Одоохондоо Supabase дээр “дуусах өдөр” хадгална.</div>
                </div>
              </div>

              {/* 4) Goal text */}
              <div>
                <div style={label}>4) Зорилго (товч, тодорхой)</div>
                <input
                  value={draft.goal_text}
                  onChange={(e) => setDraft((d) => ({ ...d, goal_text: e.target.value }))}
                  placeholder="Жишээ: 7 хоногт 3 удаа 30 минут алхана"
                  style={input}
                />
              </div>

              {/* 5) Note */}
              <div>
                <div style={label}>5) Тайлбар (сонголтоор)</div>
                <input
                  value={draft.note}
                  onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
                  placeholder="Жишээ: Өглөө ажилдаа явахын өмнө"
                  style={input}
                />
                <div style={hint}>Энэ тайлбар одоохондоо зөвхөн UI дээр харагдана.</div>
              </div>

              {/* 6) Time budget */}
              <div style={{ borderTop: "1px dashed #e5e7eb", paddingTop: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 1000, marginBottom: 10 }}>6) Цагийн боломж</div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div>
                    <div style={label}>Давтамж</div>
                    <select
                      value={draft.period}
                      onChange={(e) => setDraft((d) => ({ ...d, period: e.target.value as Period }))}
                      style={select}
                    >
                      {PERIODS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div style={label}>Хэдэн удаа?</div>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={draft.times}
                      onChange={(e) => setDraft((d) => ({ ...d, times: Number(e.target.value) }))}
                      style={input}
                      min={1}
                      max={99}
                    />
                  </div>

                  <div>
                    <div style={label}>Нэг удаад (мин)</div>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={draft.minutesEach}
                      onChange={(e) => setDraft((d) => ({ ...d, minutesEach: Number(e.target.value) }))}
                      style={input}
                      min={5}
                      max={600}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>
                  Нийт: <b>{formatHours(draftTotalMinutes)}</b> / {PERIODS.find((p) => p.value === draft.period)?.label}
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
                <button
                  onClick={addToQueue}
                  disabled={!canAdd}
                  style={{
                    ...btn,
                    background: canAdd ? BRAND : "white",
                    color: canAdd ? "white" : "#94a3b8",
                    borderColor: canAdd ? BRAND : "#e5e7eb",
                  }}
                >
                  + Дараагийн зорилго
                </button>

                <button
                  onClick={() => setMode("review")}
                  disabled={queue.length === 0}
                  style={{
                    ...btn,
                    background: queue.length ? "#0f172a" : "white",
                    color: queue.length ? "white" : "#94a3b8",
                    borderColor: queue.length ? "#0f172a" : "#e5e7eb",
                  }}
                >
                  Зорилго цэгцлэх ({queue.length})
                </button>
              </div>
            </div>
          </div>

          {/* Queue mini list */}
          {queue.length > 0 && (
            <div style={card}>
              <div style={{ fontSize: 14, fontWeight: 1000, marginBottom: 10 }}>Түр хадгалсан зорилгууд</div>

              <div style={{ display: "grid", gap: 10 }}>
                {queue.map((g) => (
                  <div
                    key={g.localId}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 14,
                      padding: 12,
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    <div style={{ fontWeight: 1000 }}>{g.goal_text}</div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      {g.goalType} · чухал {g.priority} · {g.start_date || "эхлэхгүй"} → {g.end_date || "дуусахгүй"} ·{" "}
                      {PERIODS.find((p) => p.value === g.period)?.label} {g.times} × {g.minutesEach}мин
                    </div>
                    {g.note ? (
                      <div style={{ fontSize: 12, opacity: 0.75 }}>
                        Тайлбар: <i>{g.note}</i>
                      </div>
                    ) : null}
                    <div>
                      <button onClick={() => removeFromQueue(g.localId)} style={btnDanger}>
                        Устгах
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* REVIEW MODE */}
      {mode === "review" && (
        <div style={card}>
          <div style={{ fontSize: 16, fontWeight: 1000, marginBottom: 8 }}>Зорилго цэгцлэх</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 12 }}>
            Эндээс илүүдлээ устгаад, нийт цагийн зураглалаа хараад дараа нь хадгална.
          </div>

          {/* totals */}
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              padding: 12,
              marginBottom: 12,
              background: "#f8fafc",
            }}
          >
            <div style={{ fontWeight: 1000, marginBottom: 6 }}>Нийт цагийн зураглал</div>
            <div style={{ fontSize: 13, display: "grid", gap: 4 }}>
              <div>Өдөрт: <b>{formatHours(queueTotals.day)}</b></div>
              <div>7 хоногт: <b>{formatHours(queueTotals.week)}</b></div>
              <div>Сард: <b>{formatHours(queueTotals.month)}</b></div>
              <div>Жилд: <b>{formatHours(queueTotals.year)}</b></div>
            </div>
          </div>

          {/* list */}
          <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
            {queue.length === 0 ? (
              <div style={{ opacity: 0.75 }}>Одоогоор цэгцлэх зорилго алга.</div>
            ) : (
              queue.map((g) => (
                <div
                  key={g.localId}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: 12,
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <div style={{ fontWeight: 1000 }}>{g.goal_text}</div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>
                    <b>{g.goalType}</b> · чухал {g.priority} · {g.start_date || "—"} → {g.end_date || "—"} ·{" "}
                    {PERIODS.find((p) => p.value === g.period)?.label} {g.times} × {g.minutesEach}мин (нийт{" "}
                    {formatHours(clamp(g.times, 1, 99) * clamp(g.minutesEach, 5, 600))})
                  </div>
                  {g.note ? <div style={{ fontSize: 12, opacity: 0.75 }}>Тайлбар: {g.note}</div> : null}
                  <div>
                    <button onClick={() => removeFromQueue(g.localId)} style={btnDanger}>
                      Устгах
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => setMode("edit")} style={btn}>
              Буцаад засах
            </button>

            <button
              onClick={saveAll}
              disabled={queue.length === 0 || saving}
              style={{
                ...btn,
                background: queue.length ? BRAND : "white",
                color: queue.length ? "white" : "#94a3b8",
                borderColor: queue.length ? BRAND : "#e5e7eb",
              }}
            >
              {saving ? "Хадгалж байна..." : "Хадгалах"}
            </button>
          </div>
        </div>
      )}

      {/* saved items (existing) */}
      <div style={card}>
        <div style={{ fontWeight: 1000, marginBottom: 8 }}>Supabase дээр хадгалагдсан (одоогийн мэдээлэл)</div>
        <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 10 }}>
          Энэ хэсгийг одоохондоо өөрчлөхгүй — Supabase хэвийн ажиллаж байгааг шалгахад хэрэгтэй.
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <thead>
              <tr>
                {["Зорилго", "Төрөл/Category", "Чухал", "Дуусах өдөр", "Status"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      borderBottom: "1px solid #e5e7eb",
                      padding: "10px 8px",
                      fontSize: 12,
                      opacity: 0.85,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 12, opacity: 0.7 }}>
                    Одоогоор хадгалсан зорилго алга.
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it.id}>
                    <td style={{ borderBottom: "1px solid #f1f5f9", padding: "10px 8px" }}>{it.goal_text}</td>
                    <td style={{ borderBottom: "1px solid #f1f5f9", padding: "10px 8px" }}>{it.category ?? "—"}</td>
                    <td style={{ borderBottom: "1px solid #f1f5f9", padding: "10px 8px" }}>{it.priority}</td>
                    <td style={{ borderBottom: "1px solid #f1f5f9", padding: "10px 8px" }}>{it.target_date ?? "—"}</td>
                    <td style={{ borderBottom: "1px solid #f1f5f9", padding: "10px 8px" }}>{it.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
