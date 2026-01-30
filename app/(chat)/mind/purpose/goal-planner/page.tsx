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

  // ✅ Давтамж (1 нэгжид хэдэн удаа хийх вэ)
  effort_repeat: number; // 1..N

  // ✅ Нэг удаад зарцуулах хугацаа
  effort_hours: number; // 0..24
  effort_minutes: number; // 0..59

  // ✅ Хийсэн тоо (өдөр биш — “удаа” гэж тооцно)
  completed_days?: number | null;
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

function toDate(iso: string) {
  return new Date(iso + "T00:00:00");
}

function daysBetween(aISO: string, bISO: string) {
  const a = toDate(aISO);
  const b = toDate(bISO);
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function monthsBetweenInclusive(startISO: string, endISO: string) {
  const s = toDate(startISO);
  const e = toDate(endISO);
  const sm = s.getFullYear() * 12 + s.getMonth();
  const em = e.getFullYear() * 12 + e.getMonth();
  return Math.max(1, em - sm + 1);
}

function yearsBetweenInclusive(startISO: string, endISO: string) {
  const s = toDate(startISO);
  const e = toDate(endISO);
  return Math.max(1, e.getFullYear() - s.getFullYear() + 1);
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

function hmTextFromMinutes(totalMins: number) {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0 && m > 0) return `${h}ц ${m}м`;
  if (h > 0) return `${h}ц`;
  return `${m}м`;
}

function sessionMinutes(g: GoalItem) {
  const h = Number(g.effort_hours || 0);
  const m = Number(g.effort_minutes || 0);
  return h * 60 + m;
}

function perUnitMinutes(g: GoalItem) {
  const repeat = Math.max(1, Number(g.effort_repeat || 1));
  return sessionMinutes(g) * repeat;
}

// ✅ “Өдөрт – 1ц 30м” (давтамж=3, нэг удаа=30м => 90м => 1ц30м)
function formatEffortCompact(g: GoalItem) {
  const mins = perUnitMinutes(g);
  return `${g.effort_unit} – ${hmTextFromMinutes(mins)}`;
}

// ✅ Нийт “удаа”-г хугацааны интервал дээр зөв бодно
function countBasePeriods(g: GoalItem) {
  if (!g.end_date) return null; // тодорхойгүй
  const start = g.start_date;
  const end = g.end_date;

  if (g.effort_unit === "Өдөрт") {
    return Math.max(1, daysBetween(start, end) + 1);
  }
  if (g.effort_unit === "7 хоногт") {
    const d = Math.max(1, daysBetween(start, end) + 1);
    return Math.max(1, Math.ceil(d / 7));
  }
  if (g.effort_unit === "Сард") {
    return monthsBetweenInclusive(start, end);
  }
  if (g.effort_unit === "Жилд") {
    return yearsBetweenInclusive(start, end);
  }
  // Нэг л удаа
  return 1;
}

function calcTotalOccurrences(g: GoalItem) {
  if (g.effort_unit === "Нэг л удаа") return 1;

  const base = countBasePeriods(g);
  if (!base) return null; // хугацаа тодорхойгүй

  const repeat = Math.max(1, Number(g.effort_repeat || 1));
  return base * repeat;
}

function calcTotalMinutesOverRange(g: GoalItem) {
  const one = sessionMinutes(g);
  if (g.effort_unit === "Нэг л удаа") return one;

  const base = countBasePeriods(g);
  if (!base) return null;

  const repeat = Math.max(1, Number(g.effort_repeat || 1));
  return base * repeat * one;
}

function safeErr(msg: string) {
  const m = (msg || "").toLowerCase();
  if (m.includes("unexpected token") || m.includes("expected json") || m.includes("json")) {
    return "Серверийн хариу буруу байна. /api/goal-planner хэсгээ шалгана уу.";
  }
  return msg || "Алдаа гарлаа";
}

/**
 * ✅ Done lock: нэг өдөрт 1 удаа биш,
 * одоо “period key” дээр давтамж дүүртэл дарж болно.
 * - Өдөрт: yyyy-mm-dd
 * - 7 хоногт: ISO week key (simple: yyyy-mm-dd of monday)
 * - Сард: yyyy-mm
 * - Жилд: yyyy
 * - Нэг л удаа: "once"
 */
const DONE_LOCK_KEY = "goal_planner_done_lock_v2";
type DoneLockMap = Record<string, { period: string; count: number }>; // localId -> {period,count}

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

function mondayOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay(); // 0 Sun ... 6 Sat
  const diff = (day === 0 ? -6 : 1) - day; // move to Monday
  x.setDate(x.getDate() + diff);
  const yyyy = x.getFullYear();
  const mm = pad2(x.getMonth() + 1);
  const dd = pad2(x.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

function periodKeyFor(unit: EffortUnit) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = pad2(now.getMonth() + 1);
  const dd = pad2(now.getDate());

  if (unit === "Өдөрт") return `${yyyy}-${mm}-${dd}`;
  if (unit === "7 хоногт") return `w:${mondayOfWeek(now)}`;
  if (unit === "Сард") return `m:${yyyy}-${mm}`;
  if (unit === "Жилд") return `y:${yyyy}`;
  return "once";
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

  // ✅ Давтамж
  const [effRepeat, setEffRepeat] = useState<number>(1);

  const [effHours, setEffHours] = useState<number>(0);
  const [effMinutes, setEffMinutes] = useState<number>(0);

  const didInitModeRef = useRef(false);

  const [doneLock, setDoneLock] = useState<DoneLockMap>({});

  function canPressDone(g: GoalItem) {
    const unit = g.effort_unit;
    const repeat = unit === "Нэг л удаа" ? 1 : Math.max(1, Number(g.effort_repeat || 1));
    const key = periodKeyFor(unit);
    const cur = doneLock?.[g.localId];

    if (!cur) return true;
    if (cur.period !== key) return true;
    return cur.count < repeat;
  }

  function markLocalDone(g: GoalItem) {
    const unit = g.effort_unit;
    const repeat = unit === "Нэг л удаа" ? 1 : Math.max(1, Number(g.effort_repeat || 1));
    const key = periodKeyFor(unit);
    const cur = doneLock?.[g.localId];

    let nextCount = 1;
    if (cur && cur.period === key) nextCount = Math.min(repeat, cur.count + 1);

    const next = { ...(doneLock || {}), [g.localId]: { period: key, count: nextCount } };
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

        // ✅ шинэ талбар (байхгүй бол 1)
        effort_repeat: Math.max(1, Number(x.effort_repeat ?? 1)),

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
    setEffRepeat(1);
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

    const payload = {
      local_id: crypto.randomUUID(),
      goal_text: text,
      goal_type: goalType,
      start_date: startDate,
      end_date: endDate ? endDate : null,
      description: desc.trim(),

      effort_unit: effUnit,

      // ✅ хадгална
      effort_repeat: effUnit === "Нэг л удаа" ? 1 : Math.max(1, Number(effRepeat) || 1),

      effort_hours: Math.max(0, Math.min(24, Number(effHours) || 0)),
      effort_minutes: Math.max(0, Math.min(59, Number(effMinutes) || 0)),
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

  // ✅ 1 дар = 1 “удаа”
  async function markDone(localId: string) {
    setErr("");
    try {
      const res = await fetch("/api/goal-planner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ local_id: localId, op: "inc_done" }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "PATCH_FAILED");

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

  // ✅ “Биелсэн” гэж үзэх шалгуур: нийт удаа тодорхой бол тэнд хүрсэн эсэх
  const completedItems = useMemo(() => {
    return items.filter((g) => {
      const totalOcc = calcTotalOccurrences(g);
      if (!totalOcc) return false; // хугацаа тодорхойгүйг автоматаар “биелсэн” болгохгүй
      const done = Math.max(0, Number(g.completed_days || 0));
      return done >= totalOcc;
    });
  }, [items]);

  const activeItems = useMemo(() => {
    return items.filter((g) => {
      const totalOcc = calcTotalOccurrences(g);
      if (!totalOcc) return true; // хугацаа тодорхойгүй бол active
      const done = Math.max(0, Number(g.completed_days || 0));
      return done < totalOcc;
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

  // ✅ Form select options
  const hourOptions = Array.from({ length: 25 }, (_, i) => i);
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

  // ✅ Давтамжийн options (UI хэт томруулахгүй — 1..10 хангалттай)
  const repeatOptions = Array.from({ length: 10 }, (_, i) => i + 1);

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
                  <textarea className={styles.textarea} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Нэмэлт бичих хэрэгтэй бол бичнэ" />
                </div>

                <div className={styles.field}>
                  <div className={styles.label}>Зорилго хэрэгжүүлэхэд гаргах цаг</div>

                  {/* ✅ 4 сонголт НЭГ ЭГНЭЭ: Нэгж / Давтамж / Цаг / Минут */}
                  <div className={styles.row4}>
                    <select className={styles.select} value={effUnit} onChange={(e) => setEffUnit(e.target.value as EffortUnit)}>
                      <option value="Өдөрт">Өдөрт</option>
                      <option value="7 хоногт">7 хоногт</option>
                      <option value="Сард">Сард</option>
                      <option value="Жилд">Жилд</option>
                      <option value="Нэг л удаа">Нэг л удаа</option>
                    </select>

                    <select
                      className={styles.select}
                      value={effRepeat}
                      onChange={(e) => setEffRepeat(Number(e.target.value))}
                      aria-label="Давтамж"
                      disabled={effUnit === "Нэг л удаа"}
                    >
                      {repeatOptions.map((r) => (
                        <option key={r} value={r}>
                          {r} удаа
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

                    <select className={styles.select} value={effMinutes} onChange={(e) => setEffMinutes(Number(e.target.value))} aria-label="Минут">
                      {minuteOptions.map((m) => (
                        <option key={m} value={m}>
                          {pad2(m)} мин
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* ✅ жижиг тусламж (UI өөрчлөхгүй, зүгээр тайлбар) */}
                  <div className={styles.muted} style={{ marginTop: 8 }}>
                    Жишээ: <b>Өдөрт</b> + <b>3 удаа</b> + <b>0 цаг</b> + <b>30 мин</b> ⇒ Өдөрт нийт <b>1ц 30м</b>
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

                      {/* ✅ Энд “Өдөрт 1 удаа …” гэж БИЧИХГҮЙ */}
                      <div className={styles.itemMeta}>
                        <span className={styles.pill}>{g.goal_type}</span>
                        <span className={styles.pill}>{formatDateRange(g.start_date, g.end_date)}</span>
                        <span className={styles.pill}>{formatEffortCompact(g)}</span>
                        {g.effort_unit !== "Нэг л удаа" && g.effort_repeat > 1 ? (
                          <span className={styles.pill}>{`Давтамж: ${g.effort_repeat} удаа`}</span>
                        ) : null}
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

              {/* ✅ Нийт summary-г өмнөх шиг хэвээр үлдээнэ (UI эвдэхгүй).
                  Харин энд “үнэн зөвөөр” харуулах бол хүсвэл дараагийн алхамд оруулна. */}

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
                        const totalOcc = calcTotalOccurrences(g);
                        const totalMins = calcTotalMinutesOverRange(g);

                        return (
                          <div key={g.localId} className={styles.listCard}>
                            <div className={styles.itemLeft}>
                              <div className={styles.itemTitle}>{g.goal_text}</div>

                              <div className={styles.itemMeta}>
                                <span className={styles.pill}>{g.goal_type}</span>
                                <span className={styles.pill}>{formatDateRange(g.start_date, g.end_date)}</span>
                                <span className={styles.pill}>{formatEffortCompact(g)}</span>

                                {/* ✅ ӨДӨР биш — УДАА */}
                                {totalOcc ? <span className={styles.pill}>Нийт {totalOcc} удаа</span> : <span className={styles.pill}>Нийт (тодорхойгүй)</span>}
                                {totalMins ? <span className={styles.pill}>Нийт {hmTextFromMinutes(totalMins)}</span> : null}
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
                              <span className={styles.pill}>{formatEffortCompact(g)}</span>
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

              {activeItems.length === 0 ? <div className={styles.successBox}>🎉 Баяр хүргэе! Та бүх зорилгоо амжилттай биелүүллээ.</div> : null}

              {(["Богино хугацаа", "Дунд хугацаа", "Урт хугацаа"] as OrganizeGroup[]).map((k) => (
                <div key={k} style={{ marginTop: 14 }}>
                  <div className={styles.sectionTitle}>{k}</div>

                  <div className={styles.list}>
                    {execGroups[k].length === 0 ? (
                      <div className={styles.muted}>Энд зорилго алга.</div>
                    ) : (
                      execGroups[k].map((g) => {
                        const totalOcc = calcTotalOccurrences(g); // null байж болно
                        const done = Math.max(0, Number(g.completed_days || 0));
                        const remaining = totalOcc ? Math.max(0, totalOcc - done) : null;

                        const okToPress = canPressDone(g);

                        return (
                          <div key={g.localId} className={styles.listCard}>
                            <div className={styles.itemLeft}>
                              <div className={styles.itemTitle}>{g.goal_text}</div>

                              <div className={styles.itemMeta}>
                                <span className={styles.pill}>{g.goal_type}</span>
                                <span className={styles.pill}>{formatDateRange(g.start_date, g.end_date)}</span>
                                <span className={styles.pill}>{formatEffortCompact(g)}</span>

                                {remaining !== null ? (
                                  <span className={`${styles.pill} ${styles.pillMuted}`}>Үлдсэн {remaining} удаа</span>
                                ) : (
                                  <span className={`${styles.pill} ${styles.pillMuted}`}>Үлдсэн (тодорхойгүй)</span>
                                )}

                                <span className={`${styles.pill} ${styles.pillDone}`}>Хийсэн {done} удаа</span>
                              </div>

                              {g.description ? (
                                <div className={styles.muted} style={{ marginTop: 6 }}>
                                  {g.description}
                                </div>
                              ) : null}
                            </div>

                            <button
                              type="button"
                              className={`${styles.doneBtn} ${!okToPress ? styles.doneBtnDone : ""}`}
                              onClick={async () => {
                                if (!okToPress) return;
                                markLocalDone(g);
                                await markDone(g.localId);
                              }}
                              disabled={loading || !okToPress}
                              aria-disabled={loading || !okToPress}
                            >
                              {okToPress ? "Хийсэн" : "Энэ мөчлөг дүүрсэн"}
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
