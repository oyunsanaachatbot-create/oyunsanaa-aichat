"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";


type DraftGoal = {
  localId: string;
  goal_text: string;
  category: string;
  priority: number;
  target_date: string;
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

const CATEGORIES = [
  "Амьдралын утга учир",
  "Миний амьдралын том зураг",
  "Хүсэл мөрөөдөл ба бодит байдал",
  "Зорилго яагаад урам өгдөг вэ?",
  "Өсөлт, өөрчлөлт гэж юу вэ?",
];

function uid() {
  return crypto.randomUUID();
}


export default function GoalPlannerPage() {
  const [title, setTitle] = useState("Зорилгын багц");
  const [draft, setDraft] = useState<DraftGoal>({
    localId: uid(),
    goal_text: "",
    category: CATEGORIES[0],
    priority: 3,
    target_date: "",
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
    setQueue((q) => [{ ...draft, goal_text: draft.goal_text.trim() }, ...q]);
    setDraft((d) => ({ ...d, localId: uid(), goal_text: "" }));
  }

  function removeFromQueue(localId: string) {
    setQueue((q) => q.filter((x) => x.localId !== localId));
  }

  async function saveAll() {
    if (!hasQueue) return;
    setSaving(true);
    setError(null);

    try {
      const payload = {
        title,
        goals: queue.map((g) => ({
          goal_text: g.goal_text,
          category: g.category,
          priority: g.priority,
          target_date: g.target_date ? g.target_date : null,
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
    <div style={{ padding: 16, maxWidth: 1100 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>🧩 Зорилго бичиж цэгцлэх</h1>

      {error && (
        <div style={{ marginBottom: 12, padding: 10, border: "1px solid #f0b4b4", borderRadius: 10 }}>
          Алдаа: {error}
        </div>
      )}

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
          <label style={{ fontWeight: 700 }}>Багцын нэр:</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #e5e7eb", minWidth: 240 }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 220px 140px 180px", gap: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Зорилго</div>
            <input
              value={draft.goal_text}
              onChange={(e) => setDraft((d) => ({ ...d, goal_text: e.target.value }))}
              placeholder="Жишээ: 7 хоногт 3 удаа 30 минут алхана"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb" }}
            />
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Ангилал</div>
            <select
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb" }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Priority</div>
            <select
              value={draft.priority}
              onChange={(e) => setDraft((d) => ({ ...d, priority: Number(e.target.value) }))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb" }}
            >
              {[1, 2, 3, 4, 5].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Хугацаа</div>
            <input
              type="date"
              value={draft.target_date}
              onChange={(e) => setDraft((d) => ({ ...d, target_date: e.target.value }))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <button
            onClick={addToQueue}
            disabled={!canAdd}
            style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb", fontWeight: 800 }}
          >
            + Дараагийн зорилго
          </button>

          <button
            onClick={saveAll}
            disabled={!hasQueue || saving}
            style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb", fontWeight: 800 }}
          >
            {saving ? "Хадгалж байна..." : `Нийт хадгалах (${queue.length})`}
          </button>

          <button
            onClick={loadItems}
            disabled={loading}
            style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb", fontWeight: 800 }}
          >
            {loading ? "Уншиж байна..." : "Дахин ачаалах"}
          </button>
        </div>

        {queue.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Түр жагсаалт</div>
            <div style={{ display: "grid", gap: 8 }}>
              {queue.map((g) => (
                <div
                  key={g.localId}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 10,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {g.goal_text}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                      {g.category} · priority {g.priority} · {g.target_date || "хугацаагүй"}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromQueue(g.localId)}
                    style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 10px", fontWeight: 800 }}
                  >
                    Устгах
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Хадгалсан зорилгууд</div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr>
                {["Зорилго", "Ангилал", "Priority", "Хугацаа", "Status", "Үйлдэл"].map((h) => (
                  <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb", padding: "10px 8px" }}>
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
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 10, border: "1px solid #e5e7eb" }}
                      />
                    </td>

                    <td style={{ borderBottom: "1px solid #f1f5f9", padding: "10px 8px" }}>
                      <select
                        value={it.category ?? ""}
                        onChange={(e) => updateItem(it.id, { category: e.target.value || null })}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 10, border: "1px solid #e5e7eb" }}
                      >
                        <option value="">(хоосон)</option>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td style={{ borderBottom: "1px solid #f1f5f9", padding: "10px 8px" }}>
                      <select
                        value={it.priority}
                        onChange={(e) => updateItem(it.id, { priority: Number(e.target.value) })}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 10, border: "1px solid #e5e7eb" }}
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
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 10, border: "1px solid #e5e7eb" }}
                      />
                    </td>

                    <td style={{ borderBottom: "1px solid #f1f5f9", padding: "10px 8px" }}>
                      <select
                        value={it.status}
                        onChange={(e) => updateItem(it.id, { status: e.target.value })}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 10, border: "1px solid #e5e7eb" }}
                      >
                        <option value="draft">draft</option>
                        <option value="confirmed">confirmed</option>
                        <option value="archived">archived</option>
                      </select>
                    </td>

                    <td style={{ borderBottom: "1px solid #f1f5f9", padding: "10px 8px" }}>
                      <button
                        onClick={() => deleteItem(it.id)}
                        style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 10px", fontWeight: 900 }}
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
      </div>
    </div>
  );
}
