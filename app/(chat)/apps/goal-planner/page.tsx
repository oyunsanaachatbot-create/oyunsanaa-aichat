"use client";

import React, { useEffect, useMemo, useState } from "react";

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

  // 1
  goal_type: GoalType;

  // 2
  importance: number; // 1-5

  // 3
  start_date: string; // UI only
  end_date: string; // DB рүү target_date

  // 4
  goal_text: string;

  // 5
  note: string;

  // 6
  cadence: Cadence;
  times: number;
  time_per: number; // minutes
};

function uid() {
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
  if (days <= 30) return "Богино";
  if (days <= 180) return "Дунд";
  return "Урт";
}

export default function GoalPlannerPage() {
  const [mode, setMode] = useState<"edit" | "review">("edit");

  // “Багцын нэр” — сонголтоор
  const [bundleTitle, setBundleTitle] = useState("");

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
      // DB-г эвдэхгүй:
      // category = goal_type, priority = importance, target_date = end_date
      const payload = {
        title: bundleTitle || undefined,
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

  const review = useMemo(() => {
    const list = [...queue].reverse();
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
    <div className="gp-shell">
      <style jsx>{`
        .gp-shell {
          max-width: 860px;
          margin: 0 auto;
          padding: 12px;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial,
            "Apple Color Emoji", "Segoe UI Emoji";
          color: #0f172a;
        }

        .gp-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        .gp-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: ${BRAND};
        }
        .gp-title {
          font-size: 20px;
          font-weight: 1000;
          letter-spacing: -0.2px;
        }

        .gp-card {
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 12px;
          background: #fff;
        }

        .gp-stack {
          display: grid;
          gap: 10px;
        }

        .gp-step {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 1000;
          margin-bottom: 10px;
          font-size: 16px;
        }
        .gp-stepNum {
          color: ${BRAND};
        }

        .gp-label {
          font-size: 13px;
          font-weight: 900;
          margin-bottom: 6px;
        }

        .gp-input,
        .gp-select,
        .gp-textarea {
          width: 100%;
          padding: 11px 12px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          outline: none;
          background: #fff;
        }

        .gp-textarea {
          min-height: 92px;
          resize: vertical;
        }

        .gp-grid2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .gp-grid3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
        }

        /* Mobile дээр бүгд 1 багана */
        @media (max-width: 640px) {
          .gp-grid2,
          .gp-grid3 {
            grid-template-columns: 1fr;
          }
        }

        /* 1–5 товч (slider-гүй) */
        .gp-pills {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
        }
        @media (max-width: 360px) {
          .gp-pills {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .gp-pill {
          padding: 10px 0;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: #fff;
          font-weight: 1000;
          cursor: pointer;
        }
        .gp-pillActive {
          border-color: ${BRAND};
          background: rgba(31, 111, 178, 0.08);
          color: ${BRAND};
        }

        .gp-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        @media (max-width: 640px) {
          .gp-actions {
            grid-template-columns: 1fr;
          }
        }

        .gp-primary {
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid ${BRAND};
          background: ${BRAND};
          color: white;
          font-weight: 1000;
          cursor: pointer;
        }
        .gp-ghost {
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: white;
          font-weight: 1000;
          cursor: pointer;
        }

        .gp-muted {
          font-size: 12px;
          opacity: 0.7;
        }

        .gp-chipRow {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 8px;
        }
        .gp-chip {
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 900;
        }

        .gp-miniCard {
          border: 1px solid #eef2f7;
          border-radius: 14px;
          padding: 10px;
          display: grid;
          gap: 6px;
        }
        .gp-row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: flex-start;
        }
        .gp-strong {
          font-weight: 1000;
        }
      `}</style>

      <div className="gp-header">
        <div className="gp-dot" />
        <div className="gp-title">Зорилго бичиж цэгцлэх</div>
      </div>

      {error && <div className="gp-card">Алдаа: {error}</div>}

      {mode === "edit" && (
        <div className="gp-stack">
          {/* 0) Багцын нэр — үнэхээр хүсвэл үлдээнэ, хүсэхгүй бол доорх card-ыг бүр устгаарай */}
          <div className="gp-card">
            <div className="gp-label">Багцын нэр (сонголтоор)</div>
            <input
              className="gp-input"
              value={bundleTitle}
              onChange={(e) => setBundleTitle(e.target.value)}
              placeholder="Жишээ: 2026 зорилгууд"
            />
          </div>

          {/* 1 */}
          <div className="gp-card">
            <div className="gp-step">
              <span className="gp-stepNum">1)</span> Зорилгын төрөл
            </div>
            <select
              className="gp-select"
              value={draft.goal_type}
              onChange={(e) => setDraft((d) => ({ ...d, goal_type: e.target.value as GoalType }))}
            >
              {GOAL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* 2 */}
          <div className="gp-card">
            <div className="gp-step">
              <span className="gp-stepNum">2)</span> Энэ зорилго хэр чухал вэ?
            </div>

            <div className="gp-pills">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`gp-pill ${draft.importance === n ? "gp-pillActive" : ""}`}
                  onClick={() => setDraft((d) => ({ ...d, importance: n }))}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="gp-muted" style={{ marginTop: 8 }}>
              Сонгосон: <b style={{ color: BRAND }}>{draft.importance}</b>
            </div>
          </div>

          {/* 3 */}
          <div className="gp-card">
            <div className="gp-step">
              <span className="gp-stepNum">3)</span> Зорилго хэрэгжих хугацаа
            </div>

            <div className="gp-grid2">
              <div>
                <div className="gp-label">Эхлэх өдөр</div>
                <input
                  className="gp-input"
                  type="date"
                  value={draft.start_date}
                  onChange={(e) => setDraft((d) => ({ ...d, start_date: e.target.value }))}
                />
              </div>

              <div>
                <div className="gp-label">Дуусах өдөр</div>
                <input
                  className="gp-input"
                  type="date"
                  value={draft.end_date}
                  onChange={(e) => setDraft((d) => ({ ...d, end_date: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* 4 */}
          <div className="gp-card">
            <div className="gp-step">
              <span className="gp-stepNum">4)</span> Зорилго бичих
            </div>
            <div className="gp-label">Зорилго</div>
            <input
              className="gp-input"
              value={draft.goal_text}
              onChange={(e) => setDraft((d) => ({ ...d, goal_text: e.target.value }))}
              placeholder="Жишээ: 7 хоногт 3 удаа 30 минут алхана"
            />
          </div>

          {/* 5 */}
          <div className="gp-card">
            <div className="gp-step">
              <span className="gp-stepNum">5)</span> Тайлбар (сонголтоор)
            </div>
            <textarea
              className="gp-textarea"
              value={draft.note}
              onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
              placeholder="Хүсвэл нэмэлт тэмдэглэл..."
            />
          </div>

          {/* 6 */}
          <div className="gp-card">
            <div className="gp-step">
              <span className="gp-stepNum">6)</span> Хэр их цаг гаргаж чадах вэ?
            </div>

            <div className="gp-grid3">
              <div>
                <div className="gp-label">Давтамж</div>
                <select
                  className="gp-select"
                  value={draft.cadence}
                  onChange={(e) => setDraft((d) => ({ ...d, cadence: e.target.value as Cadence }))}
                >
                  {CADENCES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="gp-label">Хэдэн удаа?</div>
                <input
                  className="gp-input"
                  type="number"
                  min={1}
                  max={99}
                  value={draft.times}
                  onChange={(e) => setDraft((d) => ({ ...d, times: Number(e.target.value) }))}
                />
              </div>

              <div>
                <div className="gp-label">Нэг удаад (мин)</div>
                <input
                  className="gp-input"
                  type="number"
                  min={5}
                  max={600}
                  value={draft.time_per}
                  onChange={(e) => setDraft((d) => ({ ...d, time_per: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div style={{ marginTop: 10, fontWeight: 1000 }}>
              Нийт:{" "}
              <span style={{ color: BRAND }}>
                {minutesToHM(draft.times * draft.time_per)} {cadenceLabel(draft.cadence)}
              </span>
            </div>
          </div>

          {/* 2 товч */}
          <div className="gp-actions">
            <button className="gp-primary" onClick={addToQueue} disabled={!canAdd} style={{ opacity: canAdd ? 1 : 0.5 }}>
              + Дараагийн зорилго
            </button>

            <button className="gp-ghost" onClick={() => setMode("review")} disabled={!hasQueue} style={{ opacity: hasQueue ? 1 : 0.5 }}>
              Зорилго цэгцлэх ({queue.length})
            </button>
          </div>

          {/* Queue */}
          {queue.length > 0 && (
            <div className="gp-card">
              <div className="gp-strong" style={{ marginBottom: 10 }}>
                Бичсэн зорилгууд ({queue.length})
              </div>

              <div className="gp-stack">
                {queue.map((g) => (
                  <div key={g.localId} className="gp-miniCard">
                    <div className="gp-row">
                      <div style={{ minWidth: 0 }}>
                        <div className="gp-strong">{g.goal_text}</div>
                        <div className="gp-muted" style={{ marginTop: 4 }}>
                          {g.goal_type} · чухал {g.importance} · {g.start_date || "—"} → {g.end_date || "—"} ·{" "}
                          {minutesToHM(g.times * g.time_per)} {cadenceLabel(g.cadence)}
                        </div>
                      </div>

                      <button className="gp-ghost" onClick={() => removeFromQueue(g.localId)}>
                        Устгах
                      </button>
                    </div>

                    {g.note?.trim() && <div className="gp-muted">Тайлбар: {g.note}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reload (optional) */}
          <div className="gp-card">
            <button className="gp-ghost" onClick={loadItems} disabled={loading}>
              {loading ? "Уншиж байна..." : "Дахин ачаалах"}
            </button>
          </div>
        </div>
      )}

      {mode === "review" && (
        <div className="gp-stack">
          <div className="gp-card">
            <div className="gp-strong">Цэгцлэх</div>

            <div className="gp-chipRow">
              {(["Богино", "Дунд", "Урт", "Тодорхойгүй"] as const).map((k) => (
                <span className="gp-chip" key={k}>
                  {k}: {review.groups[k].length}
                </span>
              ))}
            </div>

            <div style={{ marginTop: 10 }} className="gp-miniCard">
              {CADENCES.map((c) => (
                <div key={c} className="gp-row">
                  <span className="gp-strong">{c}</span>
                  <span style={{ color: BRAND, fontWeight: 1000 }}>{minutesToHM(review.totals[c])}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="gp-card">
            <div className="gp-strong" style={{ marginBottom: 10 }}>
              Жагсаалт
            </div>

            <div className="gp-stack">
              {review.list.map((g) => (
                <div key={g.localId} className="gp-miniCard">
                  <div className="gp-row">
                    <div style={{ minWidth: 0 }}>
                      <div className="gp-strong">{g.goal_text}</div>
                      <div className="gp-muted" style={{ marginTop: 4 }}>
                        {g.goal_type} · чухал {g.importance} · {g.start_date || "—"} → {g.end_date || "—"} ·{" "}
                        {minutesToHM(g.times * g.time_per)} {cadenceLabel(g.cadence)}
                      </div>
                      {g.note?.trim() && <div className="gp-muted">Тайлбар: {g.note}</div>}
                    </div>

                    <button className="gp-ghost" onClick={() => removeFromQueue(g.localId)}>
                      Устгах
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="gp-actions" style={{ marginTop: 10 }}>
              <button className="gp-ghost" onClick={() => setMode("edit")}>
                ← Буцаад засах
              </button>
              <button className="gp-primary" onClick={saveAllToDB} disabled={!hasQueue || saving} style={{ opacity: hasQueue ? 1 : 0.6 }}>
                {saving ? "Хадгалж байна..." : "Баталгаажуулж хадгалах"}
              </button>
            </div>
          </div>

          {/* DB items — mobile дээр table биш, карт */}
          <div className="gp-card">
            <div className="gp-strong" style={{ marginBottom: 10 }}>
              Supabase-д хадгалсан зорилгууд
            </div>

            {items.length === 0 ? (
              <div className="gp-muted">Одоогоор хадгалсан зорилго алга.</div>
            ) : (
              <div className="gp-stack">
                {items.map((it) => (
                  <div key={it.id} className="gp-miniCard">
                    <div className="gp-strong">{it.goal_text}</div>
                    <div className="gp-muted" style={{ marginTop: 4 }}>
                      {it.category ?? "(төрөлгүй)"} · чухал {it.priority} · дуусах: {it.target_date ?? "—"} · {it.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
