"use client";

import { useEffect, useMemo, useState } from "react";

type Frequency = "daily" | "weekly" | "monthly" | "yearly" | "custom";
type Term = "short" | "mid" | "long" | "habit";

type DraftGoal = {
  localId: string;
  goal_text: string;
  note: string; // UI-д л, одоохондоо DB-д хадгалахгүй
  goal_type: string; // UI-д л
  priority: number; // 1-5
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD or ""
  frequency: Frequency; // UI-д л
  times_per_period: number; // UI-д л
  minutes_per_session: number; // UI-д л
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
  "Хувийн зорилго",
  "Гэр бүл",
  "Ажил/карьер",
  "Эрүүл мэнд",
  "Санхүү",
  "Суралцах/ур чадвар",
  "Харилцаа",
  "Зуршил",
  "Бусад",
];

function safeUUID() {
  // ✅ build/prerender дээр Math.random ашиглахгүй
  if (typeof window === "undefined") return "tmp";
  // crypto.randomUUID нь modern browser дээр OK
  // fallback хэрэгтэй бол Date.now + counter хийж болно
  return window.crypto?.randomUUID?.() ?? `tmp-${Date.now()}`;
}

function daysBetween(a: string, b: string) {
  if (!a || !b) return null;
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  const diff = Math.floor((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
  return Number.isFinite(diff) ? diff : null;
}

function classifyTerm(start: string, end: string): Term {
  if (!start || !end) return "habit"; // дуусахгүй/сонгоогүй бол зуршил гэж үзье
  const d = daysBetween(start, end);
  if (d === null) return "habit";
  if (d <= 30) return "short";
  if (d <= 180) return "mid";
  return "long";
}

function termLabel(t: Term) {
  if (t === "short") return "Богино хугацаа (0–30 өдөр)";
  if (t === "mid") return "Дунд хугацаа (31–180 өдөр)";
  if (t === "long") return "Урт хугацаа (181+ өдөр)";
  return "Зуршил / Дуусахгүй";
}

function calcHoursPerWeek(freq: Frequency, times: number, minutes: number) {
  const per = (times || 0) * (minutes || 0);
  const minPerWeek =
    freq === "daily"
      ? per * 7
      : freq === "weekly"
      ? per
      : freq === "monthly"
      ? per / 4
      : freq === "yearly"
      ? per / 52
      : per; // custom -> weekly гэж үзье (дараа нь нарийвчилж болно)
  return Math.round((minPerWeek / 60) * 10) / 10;
}

export default function GoalPlannerPage() {
  const [title, setTitle] = useState("Зорилгын багц");

  const [draft, setDraft] = useState<DraftGoal>({
    localId: "tmp",
    goal_text: "",
    note: "",
    goal_type: GOAL_TYPES[0],
    priority: 3,
    start_date: "",
    end_date: "",
    frequency: "weekly",
    times_per_period: 3,
    minutes_per_session: 30,
  });

  // localId-г client дээр л үүсгэнэ
  useEffect(() => {
    setDraft((d) => ({ ...d, localId: safeUUID() }));
  }, []);

  const [queue, setQueue] = useState<DraftGoal[]>([]);
  const [items, setItems] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAdd = useMemo(() => draft.goal_text.trim().length > 0, [draft.goal_text]);
  const hasQueue = queue.length > 0;

  const term = useMemo(() => classifyTerm(draft.start_date, draft.end_date), [draft.start_date, draft.end_date]);
  const hoursPerWeek = useMemo(
    () => calcHoursPerWeek(draft.frequency, draft.times_per_period, draft.minutes_per_session),
    [draft.frequency, draft.times_per_period, draft.minutes_per_session]
  );

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
    const trimmed = draft.goal_text.trim();

    setQueue((q) => [
      {
        ...draft,
        localId: safeUUID(),
        goal_text: trimmed,
      },
      ...q,
    ]);

    // дараагийн зорилго руу цэвэрлэх
    setDraft((d) => ({
      ...d,
      localId: safeUUID(),
      goal_text: "",
      note: "",
      // бусад тохиргоог хэвээр үлдээе (хэрэглэгчид амар)
    }));
  }

  function removeFromQueue(localId: string) {
    setQueue((q) => q.filter((x) => x.localId !== localId));
  }

  async function saveAll() {
    if (!hasQueue) return;
    setSaving(true);
    setError(null);

    try {
      // ⚠️ ОДООХОНДОО DB-д зөвхөн одоогийн API-ийн 4 талбар л явуулна:
      // goal_text, category, priority, target_date
      // (start/end/frequency/time зэрэг нь дараагийн алхамд schema өргөтгөөд хадгална)
      const payload = {
        title,
        goals: queue.map((g) => ({
          goal_text: g.goal_text,
          category: g.goal_type, // одоохондоо category талбарт goal_type-оо хадгалж байна
          priority: g.priority,
          target_date: g.end_date ? g.end_date : null, // одоохондоо target_date = end_date
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
    } catch (e: any) {
      setError(e.message ?? "SAVE_FAILED");
    } finally {
      setSaving(false);
    }
  }

  async function updateItem(id: string, updates: Partial<GoalItem>) {
    setError(null);
    try {
      const res = await fetch("/api/goal-planner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, updates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "UPDATE_FAILED");

      const updated: GoalItem = data.item;
      setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch (e: any) {
      setError(e.message ?? "UPDATE_FAILED");
    }
  }

  async function deleteItem(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/goal-planner?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "DELETE_FAILED");
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      setError(e.message ?? "DELETE_FAILED");
    }
  }

  return (
    <div style={{ padding: 18, maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: 0.3, color: "#64748b", marginBottom: 6 }}>Apps</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: BRAND }}>🧩</span> Зорилго бичиж цэгцлэх
          </h1>
          <div style={{ marginTop: 6, color: "#475569", fontSize: 13 }}>
            Зорилгоо бичээд <b>Дараагийн зорилго</b> дарна → дараа нь <b>Зорилго цэгцлэх</b> дарж нийт цагаа хараад баталгаажуулна.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button
            onClick={loadItems}
            disabled={loading}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 800,
              background: "#fff",
            }}
          >
            {loading ? "Уншиж байна..." : "Дахин ачаалах"}
          </button>

          <button
            onClick={saveAll}
            disabled={!hasQueue || saving}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: `1px solid ${hasQueue && !saving ? BRAND : "#e5e7eb"}`,
              cursor: !hasQueue || saving ? "not-allowed" : "pointer",
              fontWeight: 900,
              background: hasQueue && !saving ? BRAND : "#f8fafc",
              color: hasQueue && !saving ? "#fff" : "#334155",
              boxShadow: hasQueue && !saving ? "0 10px 30px rgba(31,111,178,0.18)" : "none",
            }}
          >
            {saving ? "Хадгалж байна..." : `Зорилго цэгцлэх (${queue.length})`}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 12, padding: 10, border: "1px solid #f0b4b4", borderRadius: 12, background: "#fff5f5" }}>
          Алдаа: {error}
        </div>
      )}

      {/* Card: Input */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 14,
          background: "#fff",
          boxShadow: "0 12px 40px rgba(2,6,23,0.06)",
          marginBottom: 14,
        }}
      >
        {/* Bag title */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>Багцын нэр</div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Жишээ: 2026 оны зорилгууд"
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              minWidth: 260,
              outlineColor: BRAND,
            }}
          />
          <div style={{ fontSize: 12, color: "#64748b" }}>
            “Багц” гэдэг нь нэг дор бичсэн зорилгуудын нэр (ж: “Энэ сарын зорилго”).
          </div>
        </div>

        {/* Main goal text */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 6, color: "#0f172a" }}>Зорилго (товч, тодорхой)</div>
          <input
            value={draft.goal_text}
            onChange={(e) => setDraft((d) => ({ ...d, goal_text: e.target.value }))}
            placeholder="Жишээ: 7 хоногт 3 удаа 30 минут алхана"
            style={{
              width: "100%",
              padding: "12px 12px",
              borderRadius: 14,
              border: "1px solid #e5e7eb",
              outlineColor: BRAND,
              fontSize: 14,
            }}
          />
        </div>

        {/* Secondary note (optional) */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6, color: "#0f172a" }}>Тайлбар (сонголтоор)</div>
          <input
            value={draft.note}
            onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
            placeholder="Жишээ: Өглөө ажилдаа явахын өмнө"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 14,
              border: "1px solid #e5e7eb",
              outlineColor: BRAND,
              fontSize: 13,
            }}
          />
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
            Одоохондоо энэ “тайлбар” нь зөвхөн UI дээр харагдана (дараагийн алхамд DB-д хадгалалт нэмнэ).
          </div>
        </div>

        {/* Settings grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 170px 170px 170px",
            gap: 10,
            alignItems: "end",
          }}
        >
          {/* Goal type */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 6, color: "#0f172a" }}>Зорилгын төрөл</div>
            <select
              value={draft.goal_type}
              onChange={(e) => setDraft((d) => ({ ...d, goal_type: e.target.value }))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb", outlineColor: BRAND }}
            >
              {GOAL_TYPES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>Хувийн/ажил/гэр бүл гэх мэт.</div>
          </div>

          {/* Priority */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 6, color: "#0f172a" }}>Чухал байдал</div>
            <select
              value={draft.priority}
              onChange={(e) => setDraft((d) => ({ ...d, priority: Number(e.target.value) }))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb", outlineColor: BRAND }}
            >
              <option value={1}>1 — бага</option>
              <option value={2}>2</option>
              <option value={3}>3 — дунд</option>
              <option value={4}>4</option>
              <option value={5}>5 — маш чухал</option>
            </select>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>Priority = таны хувьд хэр чухал вэ.</div>
          </div>

          {/* Start date */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 6, color: "#0f172a" }}>Эхлэх өдөр</div>
            <input
              type="date"
              value={draft.start_date}
              onChange={(e) => setDraft((d) => ({ ...d, start_date: e.target.value }))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb", outlineColor: BRAND }}
            />
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>Хэзээнээс эхлэх вэ?</div>
          </div>

          {/* End date */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 6, color: "#0f172a" }}>Дуусах өдөр</div>
            <input
              type="date"
              value={draft.end_date}
              onChange={(e) => setDraft((d) => ({ ...d, end_date: e.target.value }))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb", outlineColor: BRAND }}
            />
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>Хэзээ хүртэл вэ? (хоосон бол зуршил)</div>
          </div>
        </div>

        {/* Time planning row */}
        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "170px 170px 1fr", gap: 10, alignItems: "end" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 6, color: "#0f172a" }}>Давтамж</div>
            <select
              value={draft.frequency}
              onChange={(e) => setDraft((d) => ({ ...d, frequency: e.target.value as Frequency }))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb", outlineColor: BRAND }}
            >
              <option value="daily">Өдөр бүр</option>
              <option value="weekly">7 хоногт</option>
              <option value="monthly">Сард</option>
              <option value="yearly">Жилд</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 6, color: "#0f172a" }}>Хэдэн удаа?</div>
            <input
              type="number"
              min={1}
              value={draft.times_per_period}
              onChange={(e) => setDraft((d) => ({ ...d, times_per_period: Number(e.target.value || 0) }))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb", outlineColor: BRAND }}
            />
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 6, color: "#0f172a" }}>Нэг удаад хэдэн минут?</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <input
                type="number"
                min={5}
                step={5}
                value={draft.minutes_per_session}
                onChange={(e) => setDraft((d) => ({ ...d, minutes_per_session: Number(e.target.value || 0) }))}
                style={{ width: 160, padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb", outlineColor: BRAND }}
              />
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  background: "#f8fafc",
                  color: "#0f172a",
                  fontWeight: 800,
                }}
              >
                ⏱️ Ойролцоогоор: <span style={{ color: BRAND }}>{hoursPerWeek} цаг/7 хоног</span>
              </div>

              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: `1px solid rgba(31,111,178,0.25)`,
                  background: "rgba(31,111,178,0.06)",
                  color: "#0f172a",
                  fontWeight: 800,
                }}
              >
                🧭 {termLabel(term)}
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <button
            onClick={addToQueue}
            disabled={!canAdd}
            style={{
              padding: "11px 14px",
              borderRadius: 14,
              border: `1px solid ${canAdd ? BRAND : "#e5e7eb"}`,
              cursor: canAdd ? "pointer" : "not-allowed",
              fontWeight: 900,
              background: canAdd ? "rgba(31,111,178,0.08)" : "#fff",
              color: "#0f172a",
            }}
          >
            + Дараагийн зорилго
          </button>

          <div style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center" }}>
            “Дараагийн зорилго” дарвал энэ зорилго түр жагсаалт руу орно.
          </div>
        </div>

        {/* Queue preview */}
        {queue.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 900, marginBottom: 8, color: "#0f172a" }}>Түр жагсаалт</div>
            <div style={{ display: "grid", gap: 8 }}>
              {queue.map((g) => {
                const t = classifyTerm(g.start_date, g.end_date);
                const hpw = calcHoursPerWeek(g.frequency, g.times_per_period, g.minutes_per_session);
                return (
                  <div
                    key={g.localId}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      border: "1px solid #e5e7eb",
                      borderRadius: 14,
                      padding: 12,
                      background: "#fff",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {g.goal_text}
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                        {g.goal_type} · чухал {g.priority} · {t === "habit" ? "дуусахгүй" : `${g.start_date || "?"} → ${g.end_date || "?"}`} · ~ {hpw}ц/7хон
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromQueue(g.localId)}
                      style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "9px 12px", fontWeight: 900, background: "#fff" }}
                    >
                      Устгах
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Saved items table (хуучин хэвээр) */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 14, background: "#fff" }}>
        <div style={{ fontWeight: 900, marginBottom: 10, color: "#0f172a" }}>Хадгалсан зорилгууд</div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr>
                {["Зорилго", "Ангилал", "Чухал", "Дуусах өдөр", "Status", "Үйлдэл"].map((h) => (
                  <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: "10px 8px", color: "#0f172a" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 12, opacity: 0.7 }}>
                    Одоогоор зорилго алга.
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it.id}>
                    <td style={{ borderBottom: "1px solid #f1f5f9", padding: "10px 8px" }}>
                      <input
                        defaultValue={it.goal_text}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v !== it.goal_text) updateItem(it.id, { goal_text: v });
                        }}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 12, border: "1px solid #e5e7eb", outlineColor: BRAND }}
                      />
                    </td>

                    <td style={{ borderBottom: "1px solid #f1f5f9", padding: "10px 8px" }}>
                      <input
                        value={it.category ?? ""}
                        onChange={(e) => updateItem(it.id, { category: e.target.value || null })}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 12, border: "1px solid #e5e7eb", outlineColor: BRAND }}
                        placeholder="Жишээ: Хувийн зорилго"
                      />
                    </td>

                    <td style={{ borderBottom: "1px solid #f1f5f9", padding: "10px 8px" }}>
                      <select
                        value={it.priority}
                        onChange={(e) => updateItem(it.id, { priority: Number(e.target.value) })}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 12, border: "1px solid #e5e7eb", outlineColor: BRAND }}
                      >
                        {[1, 2, 3, 4, 5].map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td style={{ borderBottom: "1px solid #f1f5f9", padding: "10px 8px" }}>
                      <input
                        type="date"
                        value={it.target_date ?? ""}
                        onChange={(e) => updateItem(it.id, { target_date: e.target.value || null })}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 12, border: "1px solid #e5e7eb", outlineColor: BRAND }}
                      />
                    </td>

                    <td style={{ borderBottom: "1px solid #f1f5f9", padding: "10px 8px" }}>
                      <select
                        value={it.status}
                        onChange={(e) => updateItem(it.id, { status: e.target.value })}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 12, border: "1px solid #e5e7eb", outlineColor: BRAND }}
                      >
                        <option value="draft">Түр бичсэн</option>
                        <option value="confirmed">Баталгаажсан</option>
                        <option value="archived">Архив</option>
                      </select>
                    </td>

                    <td style={{ borderBottom: "1px solid #f1f5f9", padding: "10px 8px" }}>
                      <button
                        onClick={() => deleteItem(it.id)}
                        style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "8px 10px", fontWeight: 900, background: "#fff" }}
                      >
                        Устгах
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
          Дараагийн алхам: “Зорилго цэгцлэх” дарсны дараа урт/дунд/богино + нийт цагийн тайлан гаргадаг review дэлгэцийг нэмнэ.
        </div>
      </div>
    </div>
  );
}
