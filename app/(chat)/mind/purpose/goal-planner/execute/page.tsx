"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../cbt.module.css";

type EffortUnit = "Өдөрт" | "7 хоногт" | "Сард" | "Жилд" | "Нэг л удаа";

type GoalItem = {
  id?: string;
  localId: string;
  goal_type: string;
  start_date: string; // yyyy-mm-dd
  end_date: string | null;
  goal_text: string;
  description: string;
  effort_unit: EffortUnit;
  effort_hours: number;
  effort_minutes: number;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function daysBetween(aISO: string, bISO: string) {
  const a = new Date(aISO + "T00:00:00");
  const b = new Date(bISO + "T00:00:00");
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function isActiveOnDay(g: GoalItem, dayISO: string) {
  if (g.start_date && dayISO < g.start_date) return false;
  if (g.end_date && dayISO > g.end_date) return false;
  return true;
}

function formatEffort(g: GoalItem) {
  const h = g.effort_hours || 0;
  const m = g.effort_minutes || 0;
  const hm =
    h > 0 && m > 0 ? `${h}ц ${m}м` :
    h > 0 ? `${h}ц` :
    `${m}м`;
  return `${g.effort_unit} – ${hm}`;
}

function totalDays(g: GoalItem) {
  if (!g.end_date) return null; // хязгааргүй
  return Math.max(1, daysBetween(g.start_date, g.end_date) + 1);
}

function remainingDays(g: GoalItem, dayISO: string) {
  if (!g.end_date) return null;
  if (dayISO > g.end_date) return 0;
  return Math.max(0, daysBetween(dayISO, g.end_date) + 1);
}

export default function GoalExecutePage() {
  const router = useRouter();

  const [date, setDate] = useState<string>(todayISO());
  const [items, setItems] = useState<GoalItem[]>([]);
  const [doneMap, setDoneMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  async function loadGoals() {
    const res = await fetch("/api/goal-planner", { method: "GET" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "LOAD_GOALS_FAILED");

    const list = Array.isArray(data?.items) ? data.items : [];
    // ⚠️ localId / local_id аль алиныг нь дэмжинэ
    return list.map((x: any) => ({
      id: x.id,
      localId: x.localId || x.local_id || crypto.randomUUID(),
      goal_type: x.goal_type || x.category || "Хувийн",
      start_date: x.start_date || todayISO(),
      end_date: x.end_date ?? null,
      goal_text: x.goal_text || "",
      description: x.description || "",
      effort_unit: (x.effort_unit as EffortUnit) || "Өдөрт",
      effort_hours: Number(x.effort_hours ?? 0),
      effort_minutes: Number(x.effort_minutes ?? 0),
    })) as GoalItem[];
  }

  async function loadDoneMap(dayISO: string) {
    const res = await fetch(`/api/goal-progress?date=${dayISO}`, { method: "GET" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "LOAD_PROGRESS_FAILED");
    return (data?.map || {}) as Record<string, boolean>;
  }

  async function refreshAll(dayISO: string) {
    setLoading(true);
    setErr("");
    try {
      const [goals, map] = await Promise.all([loadGoals(), loadDoneMap(dayISO)]);
      setItems(goals);
      setDoneMap(map);
    } catch (e: any) {
      setErr(e?.message || "Алдаа гарлаа");
      setItems([]);
      setDoneMap({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refreshAll(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const activeGoals = useMemo(() => {
    return items.filter((g) => isActiveOnDay(g, date));
  }, [items, date]);

  const doneCount = useMemo(() => {
    return activeGoals.filter((g) => !!doneMap[g.localId]).length;
  }, [activeGoals, doneMap]);

  const percent = useMemo(() => {
    const total = activeGoals.length;
    if (!total) return 0;
    return Math.round((doneCount / total) * 100);
  }, [doneCount, activeGoals.length]);

  async function toggleDone(localId: string, next: boolean) {
    // optimistic
    setDoneMap((prev) => ({ ...prev, [localId]: next }));
    try {
      const res = await fetch("/api/goal-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, localId, done: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "SAVE_PROGRESS_FAILED");
    } catch (e: any) {
      // rollback
      setDoneMap((prev) => ({ ...prev, [localId]: !next }));
      setErr(e?.message || "Хадгалах үед алдаа гарлаа");
    }
  }

  return (
    <div className={styles.cbtBody}>
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.back} onClick={() => router.back()} aria-label="Буцах">
            ←
          </button>

          <div className={styles.headMid}>
            <div className={styles.headTitle}>Хэрэгжүүлэлт</div>
            <div className={styles.headSub}>Өдөр бүр хийснээ тэмдэглээд %-аа харна</div>
          </div>

          <a className={styles.chatBtn} href="/chat">
            <span className={styles.chatIcon}>💬</span>
            Чат
          </a>
        </div>

        <div className={styles.card}>
          {err ? (
            <div className={styles.muted} style={{ color: "#fecaca", fontWeight: 900 }}>
              {err}
            </div>
          ) : null}

          <div className={styles.field}>
            <div className={styles.label}>Өдөр сонгох</div>
            <div className={styles.row2}>
              <input
                className={styles.input}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <button className={styles.ghostBtn} onClick={() => setDate(todayISO())}>
                Өнөөдөр
              </button>
            </div>
          </div>

          <div className={styles.sectionTitle}>Өнөөдрийн гүйцэтгэл</div>
          <div className={styles.summaryBox}>
            <div className={styles.summaryLine}>
              Нийт зорилго: <b>{activeGoals.length}</b>
            </div>
            <div className={styles.summaryLine}>
              Хийсэн: <b>{doneCount}</b>
            </div>
            <div className={styles.summaryLine}>
              Гүйцэтгэл: <b>{percent}%</b>
            </div>
            <div className={styles.muted}>
              (Энэ өдөр идэвхтэй байгаа зорилгуудыг 100% гэж үзээд тооцно.)
            </div>
          </div>

          <div className={styles.sectionTitle}>Өнөөдөр хийх зүйлс</div>

          <div className={styles.list}>
            {loading ? <div className={styles.muted}>Ачаалж байна…</div> : null}

            {!loading && activeGoals.length === 0 ? (
              <div className={styles.muted}>
                Энэ өдөр хэрэгжүүлэх зорилго алга. (Эхлэх/дуусах огноогоо шалгаарай)
              </div>
            ) : null}

            {activeGoals.map((g) => {
              const isDone = !!doneMap[g.localId];
              const total = totalDays(g);
              const remain = remainingDays(g, date);

              return (
                <div key={g.localId} className={styles.listCard}>
                  <div className={styles.itemLeft}>
                    <div className={styles.itemTitle}>
                      {isDone ? "✅ " : "⬜ "} {g.goal_text}
                    </div>

                    <div className={styles.itemMeta}>
                      <span className={`${styles.pill} ${styles.pillMuted}`}>Нийт {totalDays} өдөр</span>

{/* ✅ Урамтай гол тоо */}
<span className={`${styles.pill} ${styles.pillDone}`}>Хийсэн {done} өдөр</span>

{/* ✅ Үлдсэн өдөр — жижиг/сонголт (доор тайлбар) */}
<span className={`${styles.pill} ${styles.pillMuted}`}>Үлдсэн {remaining} өдөр</span>

<span className={`${styles.pill} ${styles.pillMuted}`}>{pct}%</span>

                    </div>

                    {g.description ? (
                      <div className={styles.muted} style={{ marginTop: 4 }}>
                        {g.description}
                      </div>
                    ) : null}
                  </div>

                  <button
                    className={isDone ? styles.mainBtn : styles.ghostBtn}
                    onClick={() => toggleDone(g.localId, !isDone)}
                  >
                    {isDone ? "Хийгдсэн" : "Хийлээ"}
                  </button>
                </div>
              );
            })}
          </div>

          <div className={styles.actions}>
            <button className={styles.ghostBtn} onClick={() => router.push("/mind/purpose/goal-planner")}>
              Зорилго руу буцах
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
