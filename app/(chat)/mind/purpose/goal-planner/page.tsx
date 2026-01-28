"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./cbt.module.css";

type GoalType = "Хувийн" | "Ажил" | "Гэр бүл" | "Эрүүл мэнд" | "Санхүү" | "Сурч хөгжих" | "Бусад";
type TimeUnit = "Өдөрт" | "7 хоногт" | "Жилд" | "Нэг удаа";

type DraftGoal = {
  localId: string;
  goal_type: GoalType;
  start_date: string; // yyyy-mm-dd
  end_date?: string | null; // yyyy-mm-dd | null
  goal_text: string;
  description: string;

  time_unit: TimeUnit;
  time_hours: number;
  time_minutes: number;
  frequency?: number | null; // optional

  // server id if saved
  id?: string;
};

type OrganizedBucket = {
  label: "Богино хугацаа" | "Дунд хугацаа" | "Урт хугацаа";
  items: DraftGoal[];
  totalMinutesPerDay: number;
};

function isoToday() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function clampInt(v: any, min: number, max: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  const i = Math.floor(n);
  return Math.max(min, Math.min(max, i));
}

// goal duration days (>=1)
function daysBetweenInclusive(startISO: string, endISO?: string | null) {
  const s = new Date(startISO + "T00:00:00");
  const e = new Date((endISO ?? startISO) + "T00:00:00");
  const diff = Math.round((e.getTime() - s.getTime()) / 86400000);
  return Math.max(1, diff + 1);
}

// auto classify by date range
function classifyByDates(startISO: string, endISO?: string | null): "Богино хугацаа" | "Дунд хугацаа" | "Урт хугацаа" {
  const days = daysBetweenInclusive(startISO, endISO);
  if (days <= 14) return "Богино хугацаа";
  if (days <= 90) return "Дунд хугацаа";
  return "Урт хугацаа";
}

// convert a goal's time plan into minutes-per-day (for summary)
function minutesPerDay(g: DraftGoal) {
  const perOcc = g.time_hours * 60 + g.time_minutes;
  const freq = g.frequency && g.frequency > 0 ? g.frequency : 1;

  switch (g.time_unit) {
    case "Өдөрт":
      return perOcc * freq;
    case "7 хоногт":
      return Math.round((perOcc * freq) / 7);
    case "Жилд":
      return Math.round((perOcc * freq) / 365);
    case "Нэг удаа": {
      const days = daysBetweenInclusive(g.start_date, g.end_date);
      return Math.round((perOcc * freq) / days);
    }
    default:
      return 0;
  }
}

const GOAL_TYPES: GoalType[] = ["Хувийн", "Ажил", "Гэр бүл", "Эрүүл мэнд", "Санхүү", "Сурч хөгжих", "Бусад"];
const TIME_UNITS: TimeUnit[] = ["Өдөрт", "7 хоногт", "Жилд", "Нэг удаа"];

export default function GoalPlannerPage() {
  const router = useRouter();

  // stages: add -> review -> confirm -> run (later)
  const [stage, setStage] = useState<"add" | "review" | "confirm">("add");

  // form state
  const [goalType, setGoalType] = useState<GoalType>("Хувийн");
  const [startDate, setStartDate] = useState<string>(isoToday());
  const [endDate, setEndDate] = useState<string>(""); // optional
  const [goalText, setGoalText] = useState("");
  const [desc, setDesc] = useState("");

  const [timeUnit, setTimeUnit] = useState<TimeUnit>("Өдөрт");
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(30);
  const [frequency, setFrequency] = useState<number>(1);

  // list (what user saved)
  const [items, setItems] = useState<DraftGoal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // top nav buttons
  function goBack() {
    router.back();
  }
  function goChat() {
    router.push("/"); // adjust if your chat home differs
  }

  // load existing goals from your existing API
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      try {
        // Try existing endpoint first (you already have app/api/goal-planner/route.ts)
        const res = await fetch("/api/goal-planner", { method: "GET" });
        if (!res.ok) throw new Error("load_failed");
        const data = await res.json();

        // Accept: { items: [...] } or { goals: [...] }
        const raw: any[] = Array.isArray(data?.items) ? data.items : Array.isArray(data?.goals) ? data.goals : [];

        const mapped: DraftGoal[] = raw.map((r) => ({
          localId: r.id ?? crypto.randomUUID(),
          id: r.id,
          goal_type: (r.goal_type ?? r.category ?? "Хувийн") as GoalType,
          start_date: (r.start_date ?? r.startDate ?? isoToday()) as string,
          end_date: (r.end_date ?? r.endDate ?? null) as string | null,
          goal_text: (r.goal_text ?? r.goalText ?? "") as string,
          description: (r.description ?? r.desc ?? "") as string,
          time_unit: (r.time_unit ?? r.timeUnit ?? "Өдөрт") as TimeUnit,
          time_hours: clampInt(r.time_hours ?? r.timeHours ?? 0, 0, 24),
          time_minutes: clampInt(r.time_minutes ?? r.timeMinutes ?? 0, 0, 59),
          frequency: r.frequency ?? null,
        }));

        if (alive) setItems(mapped);
      } catch {
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const canSave = useMemo(() => {
    if (!goalText.trim()) return false;
    if (!startDate) return false;
    // endDate optional
    return true;
  }, [goalText, startDate]);

  async function onSave() {
    if (!canSave) return;

    const newGoal: DraftGoal = {
      localId: crypto.randomUUID(),
      goal_type: goalType,
      start_date: startDate,
      end_date: endDate ? endDate : null,
      goal_text: goalText.trim(),
      description: desc.trim(),
      time_unit: timeUnit,
      time_hours: clampInt(hours, 0, 24),
      time_minutes: clampInt(minutes, 0, 59),
      frequency: frequency ? clampInt(frequency, 1, 50) : 1,
    };

    // optimistic add to list
    setSaving(true);
    try {
      // Save through your existing API
      const res = await fetch("/api/goal-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal_type: newGoal.goal_type,
          start_date: newGoal.start_date,
          end_date: newGoal.end_date,
          goal_text: newGoal.goal_text,
          description: newGoal.description,
          time_unit: newGoal.time_unit,
          time_hours: newGoal.time_hours,
          time_minutes: newGoal.time_minutes,
          frequency: newGoal.frequency,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const savedId = data?.id ?? data?.item?.id ?? null;
        const saved = { ...newGoal, id: savedId ?? undefined };
        setItems((prev) => [saved, ...prev]);
      } else {
        // if API fails, still keep local so user doesn't lose input
        setItems((prev) => [newGoal, ...prev]);
      }

      // reset form (keep type and dates if you want; here we reset text only)
      setGoalText("");
      setDesc("");
      setHours(0);
      setMinutes(30);
      setFrequency(1);

      // keep stage at add; user sees list updated below
      setStage("add");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(goal: DraftGoal) {
    // remove from UI immediately
    setItems((prev) => prev.filter((x) => x.localId !== goal.localId));

    // call your delete endpoint if exists; if not, ignore
    if (!goal.id) return;
    try {
      await fetch(`/api/goal-planner?id=${encodeURIComponent(goal.id)}`, { method: "DELETE" });
    } catch {
      // ignore
    }
  }

  const organized = useMemo(() => {
    const buckets: Record<OrganizedBucket["label"], DraftGoal[]> = {
      "Богино хугацаа": [],
      "Дунд хугацаа": [],
      "Урт хугацаа": [],
    };

    for (const g of items) {
      const label = classifyByDates(g.start_date, g.end_date);
      buckets[label].push(g);
    }

    const makeBucket = (label: OrganizedBucket["label"]): OrganizedBucket => {
      const list = buckets[label];
      const total = list.reduce((acc, it) => acc + minutesPerDay(it), 0);
      return { label, items: list, totalMinutesPerDay: total };
    };

    return [makeBucket("Богино хугацаа"), makeBucket("Дунд хугацаа"), makeBucket("Урт хугацаа")];
  }, [items]);

  const totalMinutesAllPerDay = useMemo(() => {
    return items.reduce((acc, g) => acc + minutesPerDay(g), 0);
  }, [items]);

  function formatHoursMinutes(totalMin: number) {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h <= 0) return `${m} мин`;
    if (m <= 0) return `${h} цаг`;
    return `${h} цаг ${m} мин`;
  }

  // show buttons based on list existence
  const showOrganize = items.length > 0;

  function onOrganize() {
    setStage("review");
  }

  function onConfirm() {
    setStage("confirm");
  }

  function onRun() {
    // For now: send user to chat (later you will implement execution page)
    router.push("/(chat)/mind/purpose/goal-planner"); // keep in same module if you later add /run page
  }

  return (
    <div className={styles.wrap}>
      {/* Top bar */}
      <div className={styles.headerRow}>
        <button className={styles.iconBtn} onClick={goBack} aria-label="Буцах" title="Буцах">
          ←
        </button>
        <div className={styles.title}>Зорилго</div>
        <button className={styles.iconBtn} onClick={goChat} aria-label="Чат" title="Чат">
          💬
        </button>
      </div>

      {/* ADD stage */}
      {stage === "add" && (
        <>
          <div className={styles.card}>
            {/* 1) Goal type */}
            <div className={styles.field}>
              <label className={styles.label}>Зорилгын төрөл</label>
              <select className={styles.input} value={goalType} onChange={(e) => setGoalType(e.target.value as GoalType)}>
                {GOAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* 2) date range */}
            <div className={styles.field}>
              <label className={styles.label}>Хэрэгжүүлэх хугацаа</label>
              <div className={styles.row2}>
                <div className={styles.subField}>
                  <div className={styles.subLabel}>Эхлэх</div>
                  <input className={styles.input} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className={styles.subField}>
                  <div className={styles.subLabel}>Дуусах</div>
                  <input className={styles.input} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
            </div>

            {/* 3) goal */}
            <div className={styles.field}>
              <label className={styles.label}>Зорилго</label>
              <input
                className={styles.input}
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                placeholder="Жишээ: Сард орлогоо 100 сая болгох"
              />
            </div>

            {/* 4) description */}
            <div className={styles.field}>
              <label className={styles.label}>Тайлбар (сонголтоор)</label>
              <textarea
                className={styles.textarea}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Жишээ: Яагаад энэ зорилго чухал вэ, ямар нөхцөлтэй вэ гэх мэт"
              />
            </div>

            {/* 5) time plan */}
            <div className={styles.field}>
              <label className={styles.label}>Зорилгоо биелүүлэхэд та хэр их цаг зарцуулах чадвартай вэ?</label>

              <div className={styles.row2}>
                <div className={styles.subField}>
                  <div className={styles.subLabel}>Хэмжээс</div>
                  <select className={styles.input} value={timeUnit} onChange={(e) => setTimeUnit(e.target.value as TimeUnit)}>
                    {TIME_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.subField}>
                  <div className={styles.subLabel}>Давтамж (сонголтоор)</div>
                  <input
                    className={styles.input}
                    type="number"
                    min={1}
                    max={50}
                    value={frequency}
                    onChange={(e) => setFrequency(clampInt(e.target.value, 1, 50))}
                  />
                </div>
              </div>

              <div className={styles.row2}>
                <div className={styles.subField}>
                  <div className={styles.subLabel}>Цаг</div>
                  <input
                    className={styles.input}
                    type="number"
                    min={0}
                    max={24}
                    value={hours}
                    onChange={(e) => setHours(clampInt(e.target.value, 0, 24))}
                  />
                </div>
                <div className={styles.subField}>
                  <div className={styles.subLabel}>Минут</div>
                  <input
                    className={styles.input}
                    type="number"
                    min={0}
                    max={59}
                    value={minutes}
                    onChange={(e) => setMinutes(clampInt(e.target.value, 0, 59))}
                  />
                </div>
              </div>
            </div>

            {/* 6) Save button (below form) */}
            <div className={styles.actionsBelow}>
              <button className={styles.primaryBtn} onClick={onSave} disabled={!canSave || saving}>
                {saving ? "Хадгалж байна..." : "Хадгалах"}
              </button>
            </div>
          </div>

          {/* list below */}
          <div className={styles.listCard}>
            <div className={styles.listTitle}>Бичсэн зорилгууд</div>

            {loading ? (
              <div className={styles.muted}>Уншиж байна...</div>
            ) : items.length === 0 ? (
              <div className={styles.muted}>Одоогоор бичсэн зорилго алга.</div>
            ) : (
              <div className={styles.list}>
                {items.map((g) => (
                  <div key={g.localId} className={styles.listItem}>
                    <div className={styles.listMain}>
                      <div className={styles.listName}>{g.goal_text}</div>
                      <div className={styles.listMeta}>
                        {g.goal_type} · {formatHoursMinutes(minutesPerDay(g))}/өдөр
                      </div>
                    </div>
                    <button className={styles.linkBtn} onClick={() => onDelete(g)}>
                      Устгах
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Organize button is ALWAYS under the list */}
            {showOrganize && (
              <div className={styles.actionsBelow}>
                <button className={styles.primaryBtn} onClick={onOrganize}>
                  Цэгцлэх
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* REVIEW stage */}
      {stage === "review" && (
        <>
          <div className={styles.listCard}>
            {organized.map((b) => (
              <div key={b.label} className={styles.bucket}>
                <div className={styles.bucketTitle}>
                  {b.label} · Нийт: {formatHoursMinutes(b.totalMinutesPerDay)}/өдөр
                </div>

                {b.items.length === 0 ? (
                  <div className={styles.muted}>Энд зорилго алга.</div>
                ) : (
                  <div className={styles.list}>
                    {b.items.map((g) => (
                      <div key={g.localId} className={styles.listItem}>
                        <div className={styles.listMain}>
                          <div className={styles.listName}>{g.goal_text}</div>
                          <div className={styles.listMeta}>
                            {g.goal_type} · {g.start_date}
                            {g.end_date ? ` → ${g.end_date}` : ""} · {formatHoursMinutes(minutesPerDay(g))}/өдөр
                          </div>
                        </div>
                        <button className={styles.linkBtn} onClick={() => onDelete(g)}>
                          Устгах
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* one summary line, visible */}
            <div className={styles.sumLine}>Нийт: {formatHoursMinutes(totalMinutesAllPerDay)}/өдөр</div>

            {/* Confirm button under the review list */}
            <div className={styles.actionsBelow}>
              <button className={styles.secondaryBtn} onClick={() => setStage("add")}>
                Буцах
              </button>
              <button className={styles.primaryBtn} onClick={onConfirm}>
                Баталгаажуулах
              </button>
            </div>
          </div>
        </>
      )}

      {/* CONFIRM stage */}
      {stage === "confirm" && (
        <div className={styles.listCard}>
          <div className={styles.sumLine}>Баталгаажууллаа. (Дараагийн алхам: хэрэгжүүлэх)</div>

          <div className={styles.actionsBelow}>
            <button className={styles.secondaryBtn} onClick={() => setStage("review")}>
              Буцах
            </button>
            <button className={styles.primaryBtn} onClick={onRun}>
              Хэрэгжүүлэх
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
