"use client";

import React, { useEffect, useMemo, useState } from "react";

type GoalItem = {
  id: string;
  session_id: string;
  user_id: string;
  goal_text: string;
  category: string | null;
  priority: number;
  target_date: string | null; // бид "дуусах өдөр"-ийг үүнд хадгална
  status: "draft" | "confirmed" | "archived" | string;
  created_at: string;
  updated_at: string;
};

type GoalType =
  | "Хувийн зорилго"
  | "Ажил/Карьер"
  | "Гэр бүл"
  | "Эрүүл мэнд"
  | "Санхүү"
  | "Суралцах/Ур чадвар"
  | "Харилцаа"
  | "Бусад";

type Cadence = "Өдөрт" | "7 хоногт" | "Сард" | "Жилд";

type DraftGoal = {
  localId: string;

  // 1) төрөл
  goal_type: GoalType;

  // 2) чухал (priority 1-5)
  importance: number;

  // 3) хугацаа
  start_date: string; // UI only
  end_date: string; // DB-д target_date болгож явуулна

  // 4) зорилго
  goal_text: string;

  // 5) тайлбар
  note: string;

  // 6) цаг / давтамж
  cadence: Cadence;
  times: number; // хэдэн удаа
  time_per: number; // нэг удаадаа хэдэн минут
};

function uid() {
  // Client component дотор ажиллана
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

const BRAND = "#1F6FB2";

const GOAL_TYPES: GoalType[] = [
  "Хувийн зорилго",
  "Ажил/Карьер",
  "Гэр бүл",
  "Эрүүл мэнд",
  "Санхүү",
  "Суралцах/Ур чадвар",
  "Харилцаа",
  "Бусад",
];

const CADENCES: Cadence[] = ["Өдөрт", "7 хоногт", "Сард", "Жилд"];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function minutesToHM(mins: number) {
  const m = Math.max(0, Math.floor(mins));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h <= 0) return `${mm} мин`;
  if (mm === 0) return `${h} ц`;
  return `${h} ц ${mm} мин`;
}

function cadenceLabel(c: Cadence) {
  if (c === "Өдөрт") return "өдөрт";
  if (c === "7 хоногт") return "7 хоногт";
  if (c === "Сард") return "сард";
  return "жилд";
}

function classifyByDuration(start: string, end: string): "Богино" | "Дунд" | "Урт" | "Тодорхойгүй" {
  if (!start || !end) return "Тодорхойгүй";
  const s = new Date(start);
  const e = new Date(end);
  const diff = e.getTime() - s.getTime();
  if (!Number.isFinite(diff) || diff < 0) return "Тодорхойгүй";
  const days = diff / (1000 * 60 * 60 * 24);

  // Энгийн ангилал:
  // Богино: <= 30 өдөр
  // Дунд: 31–180 өдөр
  // Урт: > 180 өдөр
  if (days <= 30) return "Богино";
  if (days <= 180) return "Дунд";
  return "Урт";
}

export default function GoalPlannerPage() {
  const [mode, setMode] = useState<"edit" | "review">("edit");

  // "Багцын нэр" — сонголтоор (UI)
  const [bundleTitle, setBundleTitle] = useState("Зорилгын багц");

  const [draft, setDraft] = useState<DraftGoal>({
    localId: uid(),
    goal_type: "Хувийн зорилго",
    importance: 3,
    start_date: "",
    end_date: "",
    goal_text: "",
    note: "",
    cadence: "7 хоногт",
    times: 3,
    time_per: 30,
  });

  const [queue, setQueue] = useState<DraftGoal[]>([]);
  const [items, setItems] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAdd = useMemo(() => draft.goal_text.trim().length > 0, [draft.goal_text]);
  const hasQueue = queue.length > 0;

  async function loadItems() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/goal-planner", { method: "GET" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "LOAD_FAILED");
      setItems(data.items ?? []);
    } catch (e: any) {
      setError(e?.message ?? "LOAD_FAILED");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  function resetDraft() {
    setDraft((d) => ({
      ...d,
      localId: uid(),
      goal_text: "",
      note: "",
      start_date: "",
      end_date: "",
      importance: 3,
      cadence: "7 хоногт",
      times: 3,
      time_per: 30,
      goal_type: "Хувийн зорилго",
    }));
  }

  function addToQueue() {
    if (!canAdd) return;

    // жижиг цэвэрлэлт
    const cleaned: DraftGoal = {
      ...draft,
      goal_text: draft.goal_text.trim(),
      importance: clamp(Number(draft.importance || 3), 1, 5),
      times: clamp(Number(draft.times || 1), 1, 99),
      time_per: clamp(Number(draft.time_per || 10), 5, 600),
    };

    setQueue((q) => [cleaned, ...q]);
    resetDraft();
  }

  function removeFromQueue(localId: string) {
    setQueue((q) => q.filter((x) => x.localId !== localId));
  }

  async function saveAllToDB() {
    if (!hasQueue) return;
    setSaving(true);
    setError(null);

    try {
      // DB-г эвдэхгүй: category = goal_type, priority = importance, target_date = end_date
      const payload = {
        title: bundleTitle,
        goals: queue.map((g) => ({
          goal_text: g.goal_text,
          category: g.goal_type,
          priority: g.importance,
          target_date: g.end_date ? g.end_date : null,
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
      setError(e?.message ?? "SAVE_FAILED");
    } finally {
      setSaving(false);
    }
  }

  // ====== UI styles (mobile first) ======
  const shell: React.CSSProperties = {
    padding: 16,
    maxWidth: 980,
    margin: "0 auto",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    color: "#0f172a",
    background: "white",
  };

  const card: React.CSSProperties = {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 14,
    background: "#fff",
  };

  const label: React.CSSProperties = { fontSize: 13, fontWeight: 900, marginBottom: 6 };

  const help: React.CSSProperties = { fontSize: 12, opacity: 0.72, marginTop: 6 };

  const input: React.CSSProperties = {
    width: "100%",
    padding: "11px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    outline: "none",
  };

  const select: React.CSSProperties = {
    width: "100%",
    padding: "11px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "white",
  };

  const primaryBtn: React.CSSProperties = {
    padding: "11px 14px",
    borderRadius: 12,
    border: `1px solid ${BRAND}`,
    background: BRAND,
    color: "white",
    fontWeight: 1000,
    cursor: "pointer",
  };

  const ghostBtn: React.CSSProperties = {
    padding: "11px 14px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "white",
    fontWeight: 900,
    cursor: "pointer",
  };

  const stepTitle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontWeight: 1000,
    marginBottom: 10,
  };

  // ====== Review summary ======
  const review = useMemo(() => {
    const list = [...queue].reverse(); // бичсэн дарааллаар
    const totals = list.reduce(
      (acc, g) => {
        const perCadence = g.times * g.time_per;
        acc[g.cadence] += perCadence;
        acc.all += perCadence;
        return acc;
      },
      { "Өдөрт": 0, "7 хоногт": 0, "Сард": 0, "Жилд": 0, all: 0 } as Record<Cadence | "all", number>
    );

    const groups = {
      Богино: [] as DraftGoal[],
      Дунд: [] as DraftGoal[],
      Урт: [] as DraftGoal[],
      Тодорхойгүй: [] as DraftGoal[],
    };

    for (const g of list) {
      const k = classifyByDuration(g.start_date, g.end_date);
      groups[k].push(g);
    }

    return { list, totals, groups };
  }, [queue]);

  return (
    <div style={shell}>
      {/* Title */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 1100, letterSpacing: -0.3 }}>
          🧩 Зорилго бичиж цэгцлэх
        </div>
        <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>
          1–6 алхмаар бөглөөд “Дараагийн зорилго” дарна. Бүгдийг бичсэний дараа “Зорилго цэгцлэх” дээр шалгана.
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 12, padding: 10, border: "1px solid #f0b4b4", borderRadius: 12 }}>
          Алдаа: {error}
        </div>
      )}

      {/* MODE: EDIT */}
      {mode === "edit" && (
        <div style={{ display: "grid", gap: 12 }}>
          {/* Bundle title (optional) */}
          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 1000, opacity: 0.8, marginBottom: 6 }}>Багцын нэр (сонголтоор)</div>
            <input
              value={bundleTitle}
              onChange={(e) => setBundleTitle(e.target.value)}
              placeholder="Жишээ: 2026 Эрүүл мэнд, Гэр бүл, Ажил"
              style={{ ...input, maxWidth: 520 }}
            />
            <div style={help}>Нэг дор цэгцлэх зорилгуудын “сэдэв/төсөл”-ийн нэр. Заавал биш.</div>
          </div>

          {/* 1) Goal type */}
          <div style={card}>
            <div style={stepTitle}>
              <span style={{ color: BRAND }}>1)</span> Зорилгын төрөл
            </div>
            <select
              value={draft.goal_type}
              onChange={(e) => setDraft((d) => ({ ...d, goal_type: e.target.value as GoalType }))}
              style={select}
            >
              {GOAL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <div style={help}>Жишээ: Хувийн / Ажил / Гэр бүл / Эрүүл мэнд гэх мэт.</div>
          </div>

          {/* 2) Importance */}
          <div style={card}>
            <div style={stepTitle}>
              <span style={{ color: BRAND }}>2)</span> Энэ зорилго хэр чухал вэ?
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 10, alignItems: "center" }}>
              <div>
                <div style={label}>Эрэмбэ (1–5)</div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={draft.importance}
                  onChange={(e) => setDraft((d) => ({ ...d, importance: Number(e.target.value) }))}
                  style={{ width: "100%" }}
                />
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                  1 = бага, 5 = маш чухал
                </div>
              </div>

              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 36, fontWeight: 1100, color: BRAND }}>{draft.importance}</div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>Чухлын түвшин</div>
              </div>
            </div>
          </div>

          {/* 3) Dates */}
          <div style={card}>
            <div style={stepTitle}>
              <span style={{ color: BRAND }}>3)</span> Зорилго хэрэгжих хугацаа
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={label}>Эхлэх өдөр</div>
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
              </div>
            </div>

            <div style={help}>
              Дуусах өдөр нь Supabase-д хадгалагдана. (Эхлэх өдөр UI дээр одоохондоо л харагдана.)
            </div>
          </div>

          {/* 4) Goal text */}
          <div style={card}>
            <div style={stepTitle}>
              <span style={{ color: BRAND }}>4)</span> Зорилго бичих
            </div>

            <div style={label}>Зорилго (товч, тодорхой)</div>
            <input
              value={draft.goal_text}
              onChange={(e) => setDraft((d) => ({ ...d, goal_text: e.target.value }))}
              placeholder="Жишээ: 7 хоногт 3 удаа 30 минут алхана"
              style={input}
            />
            <div style={help}>“Хэзээ/хэдэн удаа/ямар хэмжээнд” гэдгийг аль болох тодорхой бич.</div>
          </div>

          {/* 5) Note */}
          <div style={card}>
            <div style={stepTitle}>
              <span style={{ color: BRAND }}>5)</span> Тайлбар (сонголтоор)
            </div>

            <textarea
              value={draft.note}
              onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
              placeholder="Жишээ: Өглөө ажилдаа явахын өмнө / Стресс бууруулах зорилгоор"
              style={{ ...input, minHeight: 90, resize: "vertical" }}
            />
            <div style={help}>Одоохондоо энэ тайлбар зөвхөн UI дээр харагдана. (Дараа хүсвэл хадгалдаг болгоно.)</div>
          </div>

          {/* 6) Time budget */}
          <div style={card}>
            <div style={stepTitle}>
              <span style={{ color: BRAND }}>6)</span> Хэр их цаг гаргаж чадах вэ?
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                <div style={label}>Давтамж</div>
                <select
                  value={draft.cadence}
                  onChange={(e) => setDraft((d) => ({ ...d, cadence: e.target.value as Cadence }))}
                  style={select}
                >
                  {CADENCES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={label}>Хэдэн удаа?</div>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={draft.times}
                  onChange={(e) => setDraft((d) => ({ ...d, times: Number(e.target.value) }))}
                  style={input}
                />
              </div>

              <div>
                <div style={label}>Нэг удаад (мин)</div>
                <input
                  type="number"
                  min={5}
                  max={600}
                  value={draft.time_per}
                  onChange={(e) => setDraft((d) => ({ ...d, time_per: Number(e.target.value) }))}
                  style={input}
                />
              </div>
            </div>

            <div style={{ marginTop: 8, fontSize: 13 }}>
              Нийт:{" "}
              <span style={{ fontWeight: 1000, color: BRAND }}>
                {minutesToHM(draft.times * draft.time_per)} {cadenceLabel(draft.cadence)}
              </span>
            </div>
          </div>

          {/* Buttons (2 only) */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={addToQueue} disabled={!canAdd} style={{ ...primaryBtn, opacity: canAdd ? 1 : 0.5 }}>
              + Дараагийн зорилго
            </button>

            <button
              onClick={() => setMode("review")}
              disabled={!hasQueue}
              style={{ ...ghostBtn, opacity: hasQueue ? 1 : 0.5 }}
            >
              Зорилго цэгцлэх ({queue.length})
            </button>

            <button onClick={loadItems} disabled={loading} style={ghostBtn}>
              {loading ? "Уншиж байна..." : "Дахин ачаалах"}
            </button>
          </div>

          {/* Queue preview (compact) */}
          {queue.length > 0 && (
            <div style={card}>
              <div style={{ fontWeight: 1100, marginBottom: 10 }}>Бичсэн зорилгууд ({queue.length})</div>
              <div style={{ display: "grid", gap: 8 }}>
                {queue.map((g) => (
                  <div
                    key={g.localId}
                    style={{
                      border: "1px solid #eef2f7",
                      borderRadius: 14,
                      padding: 10,
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 1000, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {g.goal_text}
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
                          {g.goal_type} · чухал {g.importance} · {g.start_date || "эхлэх—"} → {g.end_date || "дуусах—"} ·{" "}
                          {minutesToHM(g.times * g.time_per)} {cadenceLabel(g.cadence)}
                        </div>
                      </div>
                      <button onClick={() => removeFromQueue(g.localId)} style={ghostBtn}>
                        Устгах
                      </button>
                    </div>

                    {g.note?.trim() && (
                      <div style={{ fontSize: 12, opacity: 0.75 }}>
                        <b>Тайлбар:</b> {g.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE: REVIEW */}
      {mode === "review" && (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={card}>
            <div style={{ fontWeight: 1100, marginBottom: 6 }}>Цэгцлэх (тойм)</div>
            <div style={{ fontSize: 13, opacity: 0.75 }}>
              Эндээс жагсаалтаа хянаад, тохирохгүйг устгаад “Баталгаажуулж хадгалах” дарна.
            </div>

            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              <div style={{ padding: 10, borderRadius: 14, border: "1px solid #eef2f7" }}>
                <div style={{ fontSize: 12, opacity: 0.75 }}>Нийт цагийн тойм</div>
                <div style={{ marginTop: 6, display: "grid", gap: 6 }}>
                  {CADENCES.map((c) => (
                    <div key={c} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 900 }}>{c}</span>
                      <span style={{ fontWeight: 1000, color: BRAND }}>{minutesToHM(review.totals[c])}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: 10, borderRadius: 14, border: "1px solid #eef2f7" }}>
                <div style={{ fontSize: 12, opacity: 0.75 }}>Хугацааны ангилал (эхлэх/дуусах өдрөөс)</div>
                <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(["Богино", "Дунд", "Урт", "Тодорхойгүй"] as const).map((k) => (
                    <span
                      key={k}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 999,
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      {k}: {review.groups[k].length}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* List */}
          <div style={card}>
            <div style={{ fontWeight: 1100, marginBottom: 10 }}>Жагсаалт</div>
            <div style={{ display: "grid", gap: 8 }}>
              {review.list.map((g) => (
                <div
                  key={g.localId}
                  style={{
                    border: "1px solid #eef2f7",
                    borderRadius: 14,
                    padding: 10,
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 1100 }}>{g.goal_text}</div>
                      <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
                        {g.goal_type} · чухал {g.importance} · {g.start_date || "эхлэх—"} → {g.end_date || "дуусах—"} ·{" "}
                        {minutesToHM(g.times * g.time_per)} {cadenceLabel(g.cadence)}
                      </div>
                      {g.note?.trim() && (
                        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                          <b>Тайлбар:</b> {g.note}
                        </div>
                      )}
                    </div>

                    <button onClick={() => removeFromQueue(g.localId)} style={ghostBtn}>
                      Устгах
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => setMode("edit")} style={ghostBtn}>
              ← Буцаад засах
            </button>

            <button onClick={saveAllToDB} disabled={!hasQueue || saving} style={{ ...primaryBtn, opacity: hasQueue ? 1 : 0.5 }}>
              {saving ? "Хадгалж байна..." : "Баталгаажуулж хадгалах"}
            </button>
          </div>
        </div>
      )}

      {/* Saved items (existing DB) */}
      <div style={{ marginTop: 16, ...card }}>
        <div style={{ fontWeight: 1100, marginBottom: 10 }}>Supabase-д хадгалсан зорилгууд</div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <thead>
              <tr>
                {["Зорилго", "Төрөл", "Чухал", "Дуусах өдөр", "Status"].map((h) => (
                  <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: "10px 8px" }}>
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
                    <td style={{ borderBottom: "1px solid #f1f5f9", padding: "10px 8px" }}>{it.category ?? "(хоосон)"}</td>
                    <td style={{ borderBottom: "1px solid #f1f5f9", padding: "10px 8px" }}>{it.priority}</td>
                    <td style={{ borderBottom: "1px solid #f1f5f9", padding: "10px 8px" }}>{it.target_date ?? "-"}</td>
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
