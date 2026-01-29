"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./cbt.module.css";

type GoalType =
  | "Хувийн"
  | "Хосын"
  | "Ажил"
  | "Гэр бүл"
  | "Эрүүл мэнд"
  | "Санхүү"
  | "Сурч хөгжих"
  | "Бусад";

type EffortUnit = "Өдөрт" | "7 хоногт" | "Сард" | "Жилд" | "Нэг л удаа";

type GoalItem = {
  id?: string;
  localId: string;
  goal_type: GoalType;
  start_date: string; // yyyy-mm-dd
  end_date: string | null; // yyyy-mm-dd | null
  goal_text: string; // товч
  description: string; // нэмэлт

  effort_unit: EffortUnit;
  effort_hours: number;   // 0-24
  effort_minutes: number; // 0-59

  // optional frequency (checkboxes)
  frequency?: number[]; // e.g. [1,3,5]
};

type OrganizeGroup = "Богино хугацаа" | "Дунд хугацаа" | "Урт хугацаа";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

function daysBetween(aISO: string, bISO: string) {
  const a = new Date(aISO + "T00:00:00");
  const b = new Date(bISO + "T00:00:00");
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function classifyGoal(startISO: string, endISO: string | null): OrganizeGroup {
  // ✅ Хэрэглэгч сонгохгүй — систем өөрөө ангилна
  // Rule (simple, stable):
  // - end байхгүй бол Урт
  // - start->end <= 90 өдөр => Богино
  // - 91..365 => Дунд
  // - >365 => Урт
  if (!endISO) return "Урт хугацаа";
  const d = Math.max(0, daysBetween(startISO, endISO));
  if (d <= 90) return "Богино хугацаа";
  if (d <= 365) return "Дунд хугацаа";
  return "Урт хугацаа";
}

function formatEffort(g: GoalItem) {
  // ✅ Хэзээ ч сар/жилээр үржүүлэхгүй
  // "Сард 3 цаг" гэвэл сарын нийт = 3 цаг л
  const h = g.effort_hours || 0;
  const m = g.effort_minutes || 0;

  const hm =
    h > 0 && m > 0 ? `${h} цаг ${m} мин` :
    h > 0 ? `${h} цаг` :
    `${m} мин`;

  return `${g.effort_unit} ${hm}`;
}

function totalByUnit(goals: GoalItem[]) {
  // ✅ 4 янзаар нийлбэр гаргана (Өдөрт / 7 хоногт / Сард / Жилд / Нэг л удаа)
  // Нийлбэрийг минут-р нийлүүлээд буцааж цаг/мин болгож харуулна.
  const units: EffortUnit[] = ["Өдөрт", "7 хоногт", "Сард", "Жилд", "Нэг л удаа"];
  const map: Record<EffortUnit, number> = {
    "Өдөрт": 0,
    "7 хоногт": 0,
    "Сард": 0,
    "Жилд": 0,
    "Нэг л удаа": 0,
  };

  for (const g of goals) {
    const mins = (g.effort_hours || 0) * 60 + (g.effort_minutes || 0);
    map[g.effort_unit] += mins;
  }

  const view = units.map((u) => {
    const mins = map[u];
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const v =
      h > 0 && m > 0 ? `${h} цаг ${m} мин` :
      h > 0 ? `${h} цаг` :
      `${m} мин`;
    return { unit: u, text: v };
  });

  return view;
}

export default function GoalPlannerPage() {
  const router = useRouter();

  // ---- UI mode ----
  const [mode, setMode] = useState<"edit" | "organized">("edit");

  // ---- list from server ----
  const [items, setItems] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ---- form ----
  const [goalType, setGoalType] = useState<GoalType>("Хувийн");
  const [startDate, setStartDate] = useState<string>(todayISO());
  const [endDate, setEndDate] = useState<string>(""); // optional
  const [goalText, setGoalText] = useState("");
  const [desc, setDesc] = useState("");

  const [effUnit, setEffUnit] = useState<EffortUnit>("Өдөрт");
  const [effHours, setEffHours] = useState<number>(1);
  const [effMinutes, setEffMinutes] = useState<number>(0);

  // optional frequency checkboxes (do not force)
  const freqOptions = [1,2,3,4,5,6,7];
  const [freqPicked, setFreqPicked] = useState<number[]>([]);

  const [err, setErr] = useState<string>("");

  async function loadGoals() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/goal-planner", { method: "GET" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "LOAD_FAILED");
      const list: GoalItem[] = Array.isArray(data?.items) ? data.items : [];
      // normalize
      setItems(
        list.map((x) => ({
          localId: x.localId || crypto.randomUUID(),
          goal_type: x.goal_type || "Хувийн",
          start_date: x.start_date || todayISO(),
          end_date: x.end_date ?? null,
          goal_text: x.goal_text || "",
          description: x.description || "",
          effort_unit: (x.effort_unit as EffortUnit) || "Өдөрт",
          effort_hours: Number(x.effort_hours ?? 0),
          effort_minutes: Number(x.effort_minutes ?? 0),
          frequency: Array.isArray(x.frequency) ? x.frequency : undefined,
          id: x.id,
        }))
      );
    } catch (e: any) {
      setErr(e?.message || "Алдаа гарлаа");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGoals();
  }, []);

  function resetFormKeepDates() {
    setGoalText("");
    setDesc("");
    setEffUnit("Өдөрт");
    setEffHours(1);
    setEffMinutes(0);
    setFreqPicked([]);
  }

  async function onSave() {
  setErr("");

  const text = goalText.trim();
  if (!text) {
    setErr("Зорилгоо товч бичнэ.");
    return;
  }

  const goal: GoalItem = {
    localId: crypto.randomUUID(),
    goal_type: goalType,
    start_date: startDate,
    end_date: endDate ? endDate : null,
    goal_text: text,
    description: desc.trim(),
    effort_unit: effUnit,
    effort_hours: Math.max(0, Math.min(24, Number(effHours) || 0)),
    effort_minutes: Math.max(0, Math.min(59, Number(effMinutes) || 0)),
    frequency: freqEnabled ? [freqValue] : undefined,
  };

  try {
    // ✅ route.ts чинь ихэвчлэн { title, goals: [...] } хэлбэртэй байсан
    const res = await fetch("/api/goal-planner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Зорилгууд",
        goals: [
          {
            localId: goal.localId,
            goal_text: goal.goal_text,
            goal_type: goal.goal_type,
            start_date: goal.start_date,
            end_date: goal.end_date,
            description: goal.description,
            effort_unit: goal.effort_unit,
            effort_hours: goal.effort_hours,
            effort_minutes: goal.effort_minutes,
            frequency: goal.frequency,
          },
        ],
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "SAVE_FAILED");

    await loadGoals();          // ✅ хадгалсны дараа заавал дахин татна
    resetFormKeepDates();       // ✅ input цэвэрлэнэ
  } catch (e: any) {
    setErr(e?.message || "Хадгалах үед алдаа гарлаа");
  }
}

  async function onDelete(localId: string) {
    setErr("");
    try {
      const res = await fetch("/api/goal-planner", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ localId }),
      });
      // DELETE-г таны route.ts дэмждэггүй байж болно. Тэгвэл front дээр л устгаад дахин хадгалах горим руу орно.
      if (!res.ok) {
        // fallback: client-only delete
        setItems((prev) => prev.filter((x) => x.localId !== localId));
        return;
      }
      await loadGoals();
    } catch {
      setItems((prev) => prev.filter((x) => x.localId !== localId));
    }
  }

  const organized = useMemo(() => {
    const groups: Record<OrganizeGroup, GoalItem[]> = {
      "Богино хугацаа": [],
      "Дунд хугацаа": [],
      "Урт хугацаа": [],
    };
    for (const g of items) {
      const k = classifyGoal(g.start_date, g.end_date);
      groups[k].push(g);
    }
    return groups;
  }, [items]);

  const totals = useMemo(() => totalByUnit(items), [items]);

  const canOrganize = items.length > 0 && !loading;

  function onOrganize() {
    // ✅ Доошоо ангилна (3 багана биш)
    setMode("organized");
  }

  function onConfirm() {
    // ✅ дараагийн шат (хэрэгжүүлэлт) руу оруулахад бэлдэнэ
    // одоохондоо энэ route байгаа гэж үзээд шилжинэ.
    router.push("/mind/purpose/goal-planner/execute");
  }

  function toggleFreq(n: number) {
    setFreqPicked((prev) => {
      if (prev.includes(n)) return prev.filter((x) => x !== n);
      return [...prev, n].sort((a, b) => a - b);
    });
  }

  const hourOptions = Array.from({ length: 24 }, (_, i) => i + 1); // 1..24
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i); // 0..59

  return (
    <div className={styles.cbtBody}>
      <div className={styles.container}>
        {/* Header: back + title + chat */}
        <div className={styles.header}>
          <button className={styles.back} onClick={() => router.back()} aria-label="Буцах">
            ←
          </button>

          <div className={styles.headMid}>
            <div className={styles.headTitle}>Зорилго</div>
            <div className={styles.headSub}>
              {mode === "edit" ? "Бичээд хадгал → Доор жагсана" : "Цэгцэлсэн жагсаалт"}
            </div>
          </div>

          <a className={styles.chatBtn} href="/chat">
            <span className={styles.chatIcon}>💬</span>
            Чат
          </a>
        </div>

        <div className={styles.card}>
          <div className={styles.titleRow}>
            <h1 className={styles.h1}>
              {mode === "edit" ? "Зорилго бичих" : "Цэгцлэх"}
            </h1>
            <div className={styles.smallNote}>
              {loading ? "Ачаалж байна…" : `${items.length} зорилго`}
            </div>
          </div>

          {err ? <div className={styles.muted} style={{ color: "#fecaca", fontWeight: 900 }}>{err}</div> : null}

          {mode === "edit" ? (
            <>
              <div className={styles.form}>
                {/* 1) Goal type */}
                <div className={styles.field}>
                  <div className={styles.label}>Зорилгын төрөл</div>
                  <select
                    className={styles.select}
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value as GoalType)}
                  >
                    <option value="Хувийн">Хувийн</option>
                    <option value="Хосын">Хосын</option>
                    <option value="Ажил">Ажил</option>
                    <option value="Гэр бүл">Гэр бүл</option>
                    <option value="Эрүүл мэнд">Эрүүл мэнд</option>
                    <option value="Санхүү">Санхүү</option>
                    <option value="Сурч хөгжих">Сурч хөгжих</option>
                    <option value="Бусад">Бусад</option>
                  </select>
                </div>

                {/* 2) Dates row */}
                <div className={styles.field}>
                  <div className={styles.label}>Хэрэгжүүлэх хугацаа</div>
                  <div className={styles.row2}>
                    <input
                      className={styles.input}
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <input
                      className={styles.input}
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* 3) Goal text */}
                <div className={styles.field}>
                  <div className={styles.label}>Зорилго</div>
                  <input
                    className={styles.input}
                    value={goalText}
                    onChange={(e) => setGoalText(e.target.value)}
                    placeholder="Жишээ: Сард орлогоо 100 сая болгох"
                  />
                </div>

                {/* 4) Description */}
                <div className={styles.field}>
                  <div className={styles.label}>Тайлбар</div>
                  <textarea
                    className={styles.textarea}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Нэмэлт бичих хэрэгтэй бол бичнэ"
                  />
                </div>

                {/* 5) Effort */}
                <div className={styles.field}>
                  <div className={styles.label}>Зорилго хэрэгжүүлэхэд гаргах цаг</div>
                  <div className={styles.row3}>
                    <select
                      className={styles.select}
                      value={effUnit}
                      onChange={(e) => setEffUnit(e.target.value as EffortUnit)}
                    >
                      <option value="Өдөрт">Өдөрт</option>
                      <option value="7 хоногт">7 хоногт</option>
                      <option value="Сард">Сард</option>
                      <option value="Жилд">Жилд</option>
                      <option value="Нэг л удаа">Нэг л удаа</option>
                    </select>

                    <select
                      className={styles.select}
                      value={effHours}
                      onChange={(e) => setEffHours(Number(e.target.value))}
                      aria-label="Цаг"
                    >
                      {hourOptions.map((h) => (
                        <option key={h} value={h}>
                          {h} цаг
                        </option>
                      ))}
                    </select>

                    <select
                      className={styles.select}
                      value={effMinutes}
                      onChange={(e) => setEffMinutes(Number(e.target.value))}
                      aria-label="Минут"
                    >
                      {minuteOptions.map((m) => (
                        <option key={m} value={m}>
                          {pad2(m)} мин
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

               {/* Давтамж (сонголтоор) */}
<div className={styles.freqWrap}>
  <label className={styles.freqTop}>
    <input
      type="checkbox"
      className={styles.freqToggle}
      checked={freqEnabled}
      onChange={(e) => setFreqEnabled(e.target.checked)}
    />
    <span className={styles.freqLabel}>Давтамж</span>
  </label>

  {freqEnabled && (
    <div className={styles.freqRow}>
      <select
        className={styles.select}
        value={freqValue}
        onChange={(e) => setFreqValue(Number(e.target.value))}
        aria-label="Давтамж"
      >
        {Array.from({ length: 7 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
    </div>
  )}
</div>


                {/* 6) Save button (урт нарийн, жагсаалтын доор биш — form-ийн төгсгөлд) */}
                <div className={styles.actions}>
                  <button className={styles.mainBtn} onClick={onSave} disabled={loading}>
                    Хадгалах
                  </button>
                </div>
              </div>

              {/* List */}
              <div className={styles.list}>
                {items.map((g) => (
                  <div key={g.localId} className={styles.listCard}>
                    <div className={styles.itemLeft}>
                      <div className={styles.itemTitle}>{g.goal_text}</div>
                      <div className={styles.itemMeta}>
                        <span className={styles.pill}>{g.goal_type}</span>
                        <span className={styles.pill}>
                          {g.start_date}{g.end_date ? ` → ${g.end_date}` : ""}
                        </span>
                        <span className={styles.pill}>{formatEffort(g)}</span>
                      </div>
                    </div>

                    <button className={styles.delBtn} onClick={() => onDelete(g.localId)}>
                      Устгах
                    </button>
                  </div>
                ))}

                {!loading && items.length === 0 ? (
                  <div className={styles.muted}>Одоогоор зорилго алга.</div>
                ) : null}

                {/* 6) + 7) Жагсаалтын доор Цэгцлэх товч */}
                {canOrganize ? (
                  <div className={styles.actions}>
                    <button className={styles.ghostBtn} onClick={onOrganize}>
                      Зорилго цэгцлэх
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              {/* Organized view */}
              <div className={styles.sectionTitle}>Нийт цаг (4 янзаар)</div>
              <div className={styles.summaryBox}>
                {totals.map((t) => (
                  <div key={t.unit} className={styles.summaryLine}>
                    {t.unit}: {t.text}
                  </div>
                ))}
                <div className={styles.muted}>
                  (Сар/жилээр үржүүлэхгүй. “Сард 3 цаг” бол сарын нийт нь 3 цаг хэвээр.)
                </div>
              </div>

              {(["Богино хугацаа","Дунд хугацаа","Урт хугацаа"] as OrganizeGroup[]).map((k) => (
                <div key={k}>
                  <div className={styles.sectionTitle}>{k}</div>
                  <div className={styles.list}>
                    {organized[k].length === 0 ? (
                      <div className={styles.muted}>Сонгосон зорилго алга.</div>
                    ) : (
                      organized[k].map((g) => (
                        <div key={g.localId} className={styles.listCard}>
                          <div className={styles.itemLeft}>
                            <div className={styles.itemTitle}>{g.goal_text}</div>
                            <div className={styles.itemMeta}>
                              <span className={styles.pill}>{g.goal_type}</span>
                              <span className={styles.pill}>
                                {g.start_date}{g.end_date ? ` → ${g.end_date}` : ""}
                              </span>
                              <span className={styles.pill}>{formatEffort(g)}</span>
                            </div>
                            {g.description ? (
                              <div className={styles.muted} style={{ marginTop: 4 }}>
                                {g.description}
                              </div>
                            ) : null}
                          </div>

                          <button className={styles.delBtn} onClick={() => onDelete(g.localId)}>
                            Устгах
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}

              {/* 8) Баталгаажуулах – заавал button */}
              <div className={styles.actions}>
                <button className={styles.mainBtn} onClick={onConfirm} disabled={!items.length}>
                  Баталгаажуулах
                </button>
                <button className={styles.ghostBtn} onClick={() => setMode("edit")}>
                  Буцах
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
