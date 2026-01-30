"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
type OrganizeGroup = "Богино хугацаа" | "Дунд хугацаа" | "Урт хугацаа";

type GoalItem = {
  id?: string;
  localId: string;

  goal_type: GoalType;
  start_date: string; // yyyy-mm-dd
  end_date: string | null;

  goal_text: string;
  description: string;

  effort_unit: EffortUnit;
  effort_count: number; // ✅ давтамж: нэг unit-д хэдэн удаа
  effort_hours: number; // 0..24 (UI дээр 0..24 хэвээр)
  effort_minutes: number; // 0..59

  completed_days?: number | null; // хийсэн өдрийн тоо (хуучин логик хэвээр)
};

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
  if (!endISO) return "Урт хугацаа";
  const d = Math.max(0, daysBetween(startISO, endISO));
  if (d <= 90) return "Богино хугацаа";
  if (d <= 365) return "Дунд хугацаа";
  return "Урт хугацаа";
}

function formatDateRange(startISO: string, endISO: string | null) {
  if (!endISO) return `${startISO} → (тодорхойгүй)`;
  return `${startISO} → ${endISO}`;
}

function minsPerSession(g: GoalItem) {
  const h = Number(g.effort_hours || 0);
  const m = Number(g.effort_minutes || 0);
  return h * 60 + m;
}

function sessionsPerUnit(g: GoalItem) {
  const c = Number(g.effort_count ?? 1);
  return Math.max(1, Math.min(30, isFinite(c) ? c : 1));
}

function formatHMFromMins(mins: number) {
  const m = Math.max(0, Math.round(mins));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h > 0 && r > 0) return `${h} цаг ${r} мин`;
  if (h > 0) return `${h} цаг`;
  return `${r} мин`;
}

function formatEffort(g: GoalItem) {
  // ✅ unit доторх нийт (давтамж * нэг удаагийн минут)
  const per = minsPerSession(g);
  const count = sessionsPerUnit(g);
  const totalInUnit = per * count;

  // ✅ "Өдөрт 3 удаа – 1ц 30м" гэх мэт
  const countText = `${count} удаа`;
  return `${g.effort_unit} · ${countText} – ${formatHMFromMins(totalInUnit)}`;
}

/**
 * Хугацааны хүрээнээс "хэдэн unit байна" гэж тооцох
 * - Өдөрт: өдөр тоо
 * - 7 хоногт: 7 хоногийн блок тоо
 * - Сард: сар тоо (ойролцоогоор 30 хоног = 1 сар)
 * - Жилд: жил тоо (365 хоног = 1 жил)
 * - Нэг л удаа: 1
 */
function unitCountInRange(g: GoalItem) {
  if (!g.end_date) {
    // end_date байхгүй бол default 1 жил гэж бодохоо болино.
    // ✅ "тодорхойгүй" үед aggregate хийхгүй — баталгаажуулалт дээр тусад нь харуулахад л үлдээнэ.
    return null as null | number;
  }
  const days = Math.max(0, daysBetween(g.start_date, g.end_date)) + 1;
  if (g.effort_unit === "Өдөрт") return days;
  if (g.effort_unit === "7 хоногт") return Math.max(1, Math.ceil(days / 7));
  if (g.effort_unit === "Сард") return Math.max(1, Math.ceil(days / 30));
  if (g.effort_unit === "Жилд") return Math.max(1, Math.ceil(days / 365));
  return 1; // Нэг л удаа
}

/** нийт "хийх удаа" */
function calcTotalSessions(g: GoalItem) {
  const units = unitCountInRange(g);
  if (units === null) return null;
  if (g.effort_unit === "Нэг л удаа") return 1;
  return units * sessionsPerUnit(g);
}

/** нийт минут */
function calcTotalMinutes(g: GoalItem) {
  const sessions = calcTotalSessions(g);
  if (sessions === null) return null;
  return sessions * minsPerSession(g);
}

/** Баталгаажуулалт дээр "Нийт X өдөр" гэж үзүүлж байсан чинь одоо утга нь өөр болсон:
 *  - Өдөрт бол: өдөр тоо (хуучин)
 *  - бусад unit дээр: нийт "хийх удаа" (sessions)
 */
function calcProgressTotal(g: GoalItem) {
  const totalSessions = calcTotalSessions(g);
  if (totalSessions === null) return null;
  if (g.effort_unit === "Өдөрт") {
    // өдөр бүр нэг удаа л хийсэн гэж тэмдэглэдэг хуучин логиктой тул
    // total нь өдөр тоо хэвээр
    const days = g.end_date ? Math.max(0, daysBetween(g.start_date, g.end_date)) + 1 : null;
    return days ?? null;
  }
  // бусад дээр: нийт удаа
  return totalSessions;
}

function safeErr(msg: string) {
  const m = (msg || "").toLowerCase();
  if (m.includes("unexpected token") || m.includes("expected json") || m.includes("json")) {
    return "Серверийн хариу буруу байна. /api/goal-planner хэсгээ шалгана уу.";
  }
  return msg || "Алдаа гарлаа";
}

const DONE_LOCK_KEY = "goal_planner_done_lock_v1";
type DoneLockMap = Record<string, string>; // localId -> yyyy-mm-dd

function readDoneLock(): DoneLockMap {
  try {
    const raw = localStorage.getItem(DONE_LOCK_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return {};
    return obj as DoneLockMap;
  } catch {
    return {};
  }
}

function writeDoneLock(map: DoneLockMap) {
  try {
    localStorage.setItem(DONE_LOCK_KEY, JSON.stringify(map));
  } catch {}
}

export default function GoalPlannerPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"edit" | "organized" | "execute">("edit");
  const [items, setItems] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  const [showCompleted, setShowCompleted] = useState(false);

  // ---- form ----
  const [goalType, setGoalType] = useState<GoalType>("Хувийн");
  const [startDate, setStartDate] = useState<string>(todayISO());
  const [endDate, setEndDate] = useState<string>("");

  const [goalText, setGoalText] = useState("");
  const [desc, setDesc] = useState("");

  const [effUnit, setEffUnit] = useState<EffortUnit>("Өдөрт");
  const [effCount, setEffCount] = useState<number>(1); // ✅ NEW
  const [effHours, setEffHours] = useState<number>(0);
  const [effMinutes, setEffMinutes] = useState<number>(0);

  const didInitModeRef = useRef(false);

  const [doneLock, setDoneLock] = useState<DoneLockMap>({});

  function hasDoneToday(localId: string) {
    const today = todayISO();
    return doneLock?.[localId] === today;
  }

  function setDoneToday(localId: string) {
    const today = todayISO();
    const next = { ...(doneLock || {}), [localId]: today };
    setDoneLock(next);
    writeDoneLock(next);
  }

  async function loadGoals() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/goal-planner", { method: "GET" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "LOAD_FAILED");

      const list: any[] = Array.isArray(data?.items) ? data.items : [];
      const mapped: GoalItem[] = list.map((x) => ({
        id: x.id,
        localId: x.local_id || x.localId || crypto.randomUUID(),

        goal_type: (x.goal_type || x.category || "Хувийн") as GoalType,
        start_date: x.start_date || todayISO(),
        end_date: x.end_date ?? null,

        goal_text: x.goal_text || "",
        description: x.description || "",

        effort_unit: (x.effort_unit || "Өдөрт") as EffortUnit,
        effort_count: Number(x.effort_count ?? 1), // ✅ NEW (хуучин өгөгдөлд 1)
        effort_hours: Number(x.effort_hours ?? 0),
        effort_minutes: Number(x.effort_minutes ?? 0),

        completed_days: x.completed_days === null || x.completed_days === undefined ? 0 : Number(x.completed_days),
      }));

      setItems(mapped);
    } catch (e: any) {
      setErr(safeErr(e?.message || "Алдаа гарлаа"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setDoneLock(readDoneLock());
    loadGoals();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (didInitModeRef.current) return;
    didInitModeRef.current = true;

    if (items.length > 0) setMode("execute");
    else setMode("edit");
  }, [loading, items.length]);

  function resetFormKeepDates() {
    setGoalText("");
    setDesc("");
    setEffUnit("Өдөрт");
    setEffCount(1);
    setEffHours(0);
    setEffMinutes(0);
  }

  async function onSave() {
    setErr("");
    const text = goalText.trim();
    if (!text) {
      setErr("Зорилгоо товч бичнэ.");
      return;
    }

    const hours = Math.max(0, Math.min(24, Number(effHours) || 0));
    const minutes = Math.max(0, Math.min(59, Number(effMinutes) || 0));
    const count = Math.max(1, Math.min(30, Number(effCount) || 1));

    const payload = {
      local_id: crypto.randomUUID(),
      goal_text: text,
      goal_type: goalType,
      start_date: startDate,
      end_date: endDate ? endDate : null,
      description: desc.trim(),
      effort_unit: effUnit,
      effort_count: count, // ✅ NEW
      effort_hours: hours,
      effort_minutes: minutes,
    };

    try {
      const res = await fetch("/api/goal-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Зорилгууд", goals: [payload] }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "SAVE_FAILED");

      await loadGoals();
      setMode("edit");
      resetFormKeepDates();
    } catch (e: any) {
      setErr(safeErr(e?.message || "Хадгалах үед алдаа гарлаа"));
    }
  }

  async function onDelete(localId: string) {
    setErr("");
    try {
      const res = await fetch("/api/goal-planner", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ local_id: localId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "DELETE_FAILED");
      await loadGoals();
    } catch (e: any) {
      setErr(safeErr(e?.message || "Устгах үед алдаа гарлаа"));
    }
  }

  // 1 дар = 1 өдөр + өдөрт 1 удаа lock (хуучин хэвээр)
  async function markDoneToday(localId: string) {
    if (hasDoneToday(localId)) return;

    setErr("");
    try {
      const res = await fetch("/api/goal-planner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ local_id: localId, op: "inc_done" }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "PATCH_FAILED");

      setDoneToday(localId);
      await loadGoals();
    } catch (e: any) {
      setErr(safeErr(e?.message || "Хийсэн тэмдэглэх үед алдаа гарлаа"));
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

  // ✅ Баталгаажуулалтын summary-г "үнэндээ нийт хэдэн минут" болгож харуулах
  const totals = useMemo(() => {
    const units: EffortUnit[] = ["Өдөрт", "7 хоногт", "Сард", "Жилд", "Нэг л удаа"];
    const map: Record<EffortUnit, number> = {
      "Өдөрт": 0,
      "7 хоногт": 0,
      "Сард": 0,
      "Жилд": 0,
      "Нэг л удаа": 0,
    };
    for (const g of items) {
      const perUnitMins = minsPerSession(g) * sessionsPerUnit(g);
      map[g.effort_unit] += perUnitMins;
    }
    return units.map((u) => ({ unit: u, text: formatHMFromMins(map[u]) }));
  }, [items]);

  const completedItems = useMemo(() => {
    return items.filter((g) => {
      const total = calcProgressTotal(g);
      if (total === null) return false;
      const done = Math.max(0, Number(g.completed_days || 0));
      return done >= total;
    });
  }, [items]);

  const activeItems = useMemo(() => {
    return items.filter((g) => {
      const total = calcProgressTotal(g);
      if (total === null) return true; // end_date тодорхойгүй бол идэвхтэйд орно
      const done = Math.max(0, Number(g.completed_days || 0));
      return done < total;
    });
  }, [items]);

  const execGroups = useMemo(() => {
    const groups: Record<OrganizeGroup, GoalItem[]> = {
      "Богино хугацаа": [],
      "Дунд хугацаа": [],
      "Урт хугацаа": [],
    };
    for (const g of activeItems) {
      const k = classifyGoal(g.start_date, g.end_date);
      groups[k].push(g);
    }
    return groups;
  }, [activeItems]);

  const hourOptions = Array.from({ length: 25 }, (_, i) => i);
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i);
  const countOptions = Array.from({ length: 10 }, (_, i) => i + 1); // 1..10 (хүсвэл өсгөж болно)

  const canOrganize = items.length > 0 && !loading;

  return (
    <div className={styles.cbtBody}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.back} onClick={() => router.back()} aria-label="Буцах">
            ←
          </button>

          <div className={styles.headMid}>
            <div className={styles.headTitle}>Зорилго</div>
            <div className={styles.headSub}>
              {mode === "edit" ? "Бичээд хадгал → Доор жагсана" : mode === "organized" ? "Цэгцэлсэн жагсаалт" : "Хэрэгжүүлэлт"}
            </div>
          </div>

          <a className={styles.chatBtn} href="/chat">
            <span className={styles.chatIcon}>💬</span>
            Чат
          </a>
        </div>

        <div className={styles.card}>
          {err ? <div className={styles.errorBox}>{err}</div> : null}

          {/* ===================== EDIT ===================== */}
          {mode === "edit" ? (
            <>
              <div className={styles.form}>
                <div className={styles.field}>
                  <div className={styles.label}>Зорилгын төрөл</div>
                  <select className={styles.select} value={goalType} onChange={(e) => setGoalType(e.target.value as GoalType)}>
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

                <div className={styles.field}>
                  <div className={styles.label}>Хэрэгжүүлэх хугацаа</div>
                  <div className={styles.row2}>
                    <input className={styles.input} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    <input className={styles.input} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>

                <div className={styles.field}>
                  <div className={styles.label}>Зорилго</div>
                  <input
                    className={styles.input}
                    value={goalText}
                    onChange={(e) => setGoalText(e.target.value)}
                    placeholder="Жишээ: Сард орлогоо 100 сая болгох"
                  />
                </div>

                <div className={styles.field}>
                  <div className={styles.label}>Тайлбар</div>
                  <textarea
                    className={styles.textarea}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Нэмэлт бичих хэрэгтэй бол бичнэ"
                  />
                </div>

                <div className={styles.field}>
                  <div className={styles.label}>Зорилго хэрэгжүүлэхэд гаргах цаг</div>

                  {/* ✅ 1 мөрөнд багтаах: unit + count + hours (+ minutes доор) */}
                  <div className={styles.row3}>
                    <select className={styles.select} value={effUnit} onChange={(e) => setEffUnit(e.target.value as EffortUnit)}>
                      <option value="Өдөрт">Өдөрт</option>
                      <option value="7 хоногт">7 хоногт</option>
                      <option value="Сард">Сард</option>
                      <option value="Жилд">Жилд</option>
                      <option value="Нэг л удаа">Нэг л удаа</option>
                    </select>

                    <select
                      className={styles.select}
                      value={effCount}
                      onChange={(e) => setEffCount(Number(e.target.value))}
                      aria-label="Давтамж"
                      disabled={effUnit === "Нэг л удаа"}
                      title={effUnit === "Нэг л удаа" ? "Нэг л удаа дээр давтамж хэрэггүй" : ""}
                    >
                      {(effUnit === "Нэг л удаа" ? [1] : countOptions).map((c) => (
                        <option key={c} value={c}>
                          {c} удаа
                        </option>
                      ))}
                    </select>

                    <select className={styles.select} value={effHours} onChange={(e) => setEffHours(Number(e.target.value))} aria-label="Цаг">
                      {hourOptions.map((h) => (
                        <option key={h} value={h}>
                          {h} цаг
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* ✅ минутыг тусад нь ганц мөр болгоё (2 эгнээ болж бухимдуулахгүйгээр зөвхөн минут л доор) */}
                  <div style={{ marginTop: 10 }}>
                    <select
                      className={styles.select}
                      style={{ width: "100%" }}
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

                <div className={styles.actions}>
                  <button className={styles.mainBtn} type="button" onClick={onSave} disabled={loading}>
                    Хадгалах
                  </button>
                </div>
              </div>

              <div className={styles.list}>
                {items.map((g) => (
                  <div key={g.localId} className={styles.listCard}>
                    <div className={styles.itemLeft}>
                      <div className={styles.itemTitle}>{g.goal_text}</div>

                      <div className={styles.itemMeta}>
                        <span className={styles.pill}>{g.goal_type}</span>
                        <span className={styles.pill}>{formatDateRange(g.start_date, g.end_date)}</span>
                        <span className={styles.pill}>{formatEffort(g)}</span>
                      </div>
                    </div>

                    <button className={styles.delBtn} type="button" onClick={() => onDelete(g.localId)}>
                      Устгах
                    </button>
                  </div>
                ))}

                {!loading && items.length === 0 ? <div className={styles.muted}>Одоогоор зорилго алга.</div> : null}

                {canOrganize ? (
                  <div className={styles.actions}>
                    <button className={styles.ghostBtn} type="button" onClick={() => setMode("organized")}>
                      Зорилго цэгцлэх
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}

          {/* ===================== ORGANIZED ===================== */}
          {mode === "organized" ? (
            <>
              <div className={styles.sectionTitle}>Таны зорилгууд цэгцэрлээ</div>

              <div className={styles.summaryBox}>
                {totals.map((t) => (
                  <div key={t.unit} className={styles.summaryLine}>
                    <span className={styles.sumKey}>{t.unit}:</span>
                    <span className={styles.sumVal}>{t.text}</span>
                  </div>
                ))}
              </div>

              <div className={styles.muted} style={{ marginTop: 10 }}>
                Доорх жагсаалтаа шалгаад <b>“Баталгаажуулах”</b> товч дарна.
              </div>

              {(["Богино хугацаа", "Дунд хугацаа", "Урт хугацаа"] as OrganizeGroup[]).map((k) => (
                <div key={k} style={{ marginTop: 14 }}>
                  <div className={styles.sectionTitle}>{k}</div>

                  <div className={styles.list}>
                    {organized[k].length === 0 ? (
                      <div className={styles.muted}>Энд зорилго алга.</div>
                    ) : (
                      organized[k].map((g) => {
                        const totalSessions = calcTotalSessions(g);
                        const totalMins = calcTotalMinutes(g);

                        return (
                          <div key={g.localId} className={styles.listCard}>
                            <div className={styles.itemLeft}>
                              <div className={styles.itemTitle}>{g.goal_text}</div>

                              <div className={styles.itemMeta}>
                                <span className={styles.pill}>{g.goal_type}</span>
                                <span className={styles.pill}>{formatDateRange(g.start_date, g.end_date)}</span>
                                <span className={styles.pill}>{formatEffort(g)}</span>

                                {totalSessions !== null ? (
                                  <span className={styles.pill}>Нийт {totalSessions} удаа</span>
                                ) : (
                                  <span className={styles.pill}>Нийт (тодорхойгүй)</span>
                                )}

                                {totalMins !== null ? (
                                  <span className={styles.pill}>Нийт {formatHMFromMins(totalMins)}</span>
                                ) : null}
                              </div>

                              {g.description ? (
                                <div className={styles.muted} style={{ marginTop: 6 }}>
                                  {g.description}
                                </div>
                              ) : null}
                            </div>

                            <button className={styles.delBtn} type="button" onClick={() => onDelete(g.localId)}>
                              Устгах
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}

              <div className={styles.actions} style={{ marginTop: 14 }}>
                <button className={styles.mainBtn} type="button" onClick={() => setMode("execute")} disabled={!items.length}>
                  Баталгаажуулах
                </button>
                <button className={styles.ghostBtn} type="button" onClick={() => setMode("edit")}>
                  Буцах
                </button>
              </div>
            </>
          ) : null}

          {/* ===================== EXECUTE ===================== */}
          {mode === "execute" ? (
            <>
              <div className={styles.execTopRow}>
                <div className={styles.execStat}>
                  Нийт зорилго: <b>{activeItems.length}</b>
                </div>

                <button type="button" className={styles.execToggle} onClick={() => setShowCompleted((v) => !v)}>
                  Биелсэн зорилго: <span className={styles.execCount}>{completedItems.length}</span>{" "}
                  <span className={styles.execHint}>({showCompleted ? "хаах" : "харах"})</span>
                </button>
              </div>

              {showCompleted ? (
                <div className={styles.completedBox}>
                  {completedItems.length === 0 ? (
                    <div className={styles.muted}>Одоогоор биелсэн зорилго алга.</div>
                  ) : (
                    <div className={styles.list}>
                      {completedItems.map((g) => (
                        <div key={g.localId} className={styles.listCard}>
                          <div className={styles.itemLeft}>
                            <div className={styles.itemTitle}>{g.goal_text}</div>

                            <div className={styles.itemMeta}>
                              <span className={styles.pill}>{g.goal_type}</span>
                              <span className={styles.pill}>{formatDateRange(g.start_date, g.end_date)}</span>
                              <span className={styles.pill}>{formatEffort(g)}</span>
                              <span className={`${styles.pill} ${styles.pillDone}`}>Биелсэн</span>
                            </div>

                            {g.description ? (
                              <div className={styles.muted} style={{ marginTop: 6 }}>
                                {g.description}
                              </div>
                            ) : null}
                          </div>

                          <button className={styles.delBtn} type="button" onClick={() => onDelete(g.localId)}>
                            Устгах
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              {activeItems.length === 0 ? (
                <div className={styles.successBox}>🎉 Баяр хүргэе! Та бүх зорилгоо амжилттай биелүүллээ.</div>
              ) : null}

              {(["Богино хугацаа", "Дунд хугацаа", "Урт хугацаа"] as OrganizeGroup[]).map((k) => (
                <div key={k} style={{ marginTop: 14 }}>
                  <div className={styles.sectionTitle}>{k}</div>

                  <div className={styles.list}>
                    {execGroups[k].length === 0 ? (
                      <div className={styles.muted}>Энд зорилго алга.</div>
                    ) : (
                      execGroups[k].map((g) => {
                        const total = calcProgressTotal(g);
                        const done = Math.max(0, Number(g.completed_days || 0));
                        const remaining = total === null ? null : Math.max(0, total - done);
                        const didToday = hasDoneToday(g.localId);

                        return (
                          <div key={g.localId} className={styles.listCard}>
                            <div className={styles.itemLeft}>
                              <div className={styles.itemTitle}>{g.goal_text}</div>

                              <div className={styles.itemMeta}>
                                <span className={styles.pill}>{g.goal_type}</span>
                                <span className={styles.pill}>{formatDateRange(g.start_date, g.end_date)}</span>
                                <span className={styles.pill}>{formatEffort(g)}</span>

                                {remaining !== null ? (
                                  <span className={`${styles.pill} ${styles.pillMuted}`}>Үлдсэн {remaining}</span>
                                ) : (
                                  <span className={`${styles.pill} ${styles.pillMuted}`}>Үлдсэн (тодорхойгүй)</span>
                                )}

                                <span className={`${styles.pill} ${styles.pillDone}`}>Хийсэн {done}</span>
                              </div>

                              {g.description ? (
                                <div className={styles.muted} style={{ marginTop: 6 }}>
                                  {g.description}
                                </div>
                              ) : null}
                            </div>

                            <button
                              type="button"
                              className={`${styles.doneBtn} ${didToday ? styles.doneBtnDone : ""}`}
                              onClick={() => markDoneToday(g.localId)}
                              disabled={loading || didToday}
                              aria-disabled={loading || didToday}
                            >
                              {didToday ? "Өнөөдөр хийсэн" : "Хийсэн"}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}

              <div className={styles.actions} style={{ marginTop: 14 }}>
                <button className={styles.ghostBtn} type="button" onClick={() => setMode("organized")}>
                  Цэгцлэх рүү буцах
                </button>
                <button className={styles.mainBtn} type="button" onClick={() => setMode("edit")}>
                  Шинэ зорилго бичих
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
