"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./cbt.module.css";

type TimeUnit = "Өдөрт" | "7 хоногт" | "Жилд" | "Нэг удаа";
type GoalType = "Хувийн" | "Хосын" | "Ажил" | "Гэр бүл" | "Эрүүл мэнд" | "Санхүү" | "Сурч хөгжих" | "Бусад";

type DraftGoal = {
  localId: string;
  goal_type: GoalType;
  start_date: string; // yyyy-mm-dd
  end_date: string; // yyyy-mm-dd эсвэл ""
  goal_text: string;
  description: string;

  time_unit: TimeUnit;
  time_hours: number;
  time_minutes: number;

  // optional
  freq_enabled: boolean;
  freq_count: number; // нэгж дотор хэдэн удаа?

  created_at: string; // ISO
};

type DurationBucket = "Богино хугацаа" | "Дунд хугацаа" | "Урт хугацаа";

type DoneMap = Record<string, Record<string, boolean>>;
// done[goalId][yyyy-mm-dd] = true/false

function isoDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseISO(s: string) {
  // yyyy-mm-dd -> Date (local)
  const [y, m, d] = s.split("-").map((x) => Number(x));
  return new Date(y, (m || 1) - 1, d || 1);
}

function daysBetween(aISO: string, bISO: string) {
  const a = parseISO(aISO);
  const b = parseISO(bISO);
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function bucketByDates(startISO: string, endISO: string): DurationBucket {
  if (!endISO) return "Урт хугацаа";
  const d = daysBetween(startISO, endISO);
  if (d <= 30) return "Богино хугацаа";
  if (d <= 180) return "Дунд хугацаа";
  return "Урт хугацаа";
}

function minutesToHM(totalMin: number) {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return { h, m };
}

function toDailyMinutes(g: DraftGoal) {
  const mins = (Number(g.time_hours) || 0) * 60 + (Number(g.time_minutes) || 0);

  switch (g.time_unit) {
    case "Өдөрт":
      return mins;
    case "7 хоногт":
      return Math.round(mins / 7);
    case "Жилд":
      return Math.round(mins / 365);
    case "Нэг удаа": {
      // Нэг удаа гэдгийг өдөрт тарааж тооцох: хэрвээ хугацаа өгсөн бол хугацаандаа хуваая, үгүй бол 0 (өдөр тутмын төлөвлөгөөнд нөлөөлөхгүй)
      if (!g.end_date) return 0;
      const span = Math.max(1, daysBetween(g.start_date, g.end_date));
      return Math.round(mins / span);
    }
    default:
      return mins;
  }
}

function uid() {
  return `g_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

const LS_DRAFTS = "oy_goalplanner_drafts_v1";
const LS_STAGE = "oy_goalplanner_stage_v1"; // add | review | confirm | run
const LS_DONE = "oy_goalplanner_done_v1";

type Stage = "add" | "review" | "confirm" | "run";

function safeJSONParse<T>(s: string | null, fallback: T): T {
  try {
    if (!s) return fallback;
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function monthDaysGrid(d: Date) {
  // returns array of 42 cells (6 weeks), each cell either date ISO or ""
  const first = startOfMonth(d);
  const last = endOfMonth(d);
  const firstDow = (first.getDay() + 6) % 7; // Monday=0
  const totalDays = last.getDate();

  const cells: string[] = [];
  for (let i = 0; i < firstDow; i++) cells.push("");

  for (let day = 1; day <= totalDays; day++) {
    const dt = new Date(d.getFullYear(), d.getMonth(), day);
    cells.push(isoDate(dt));
  }

  while (cells.length < 42) cells.push("");
  return cells;
}

export default function GoalPlannerPage() {
  const router = useRouter();

  const [stage, setStage] = useState<Stage>("add");
  const [drafts, setDrafts] = useState<DraftGoal[]>([]);
  const [done, setDone] = useState<DoneMap>({});
  const [month, setMonth] = useState<Date>(() => new Date());

  // form states
  const [goalType, setGoalType] = useState<GoalType>("Хувийн");
  const [startDate, setStartDate] = useState<string>(() => isoDate(new Date()));
  const [endDate, setEndDate] = useState<string>("");
  const [goalText, setGoalText] = useState<string>("");
  const [desc, setDesc] = useState<string>("");

  const [timeUnit, setTimeUnit] = useState<TimeUnit>("Өдөрт");
  const [timeHours, setTimeHours] = useState<number>(1);
  const [timeMinutes, setTimeMinutes] = useState<number>(0);

  const [freqEnabled, setFreqEnabled] = useState<boolean>(false);
  const [freqCount, setFreqCount] = useState<number>(1);

  const [loadingRemote, setLoadingRemote] = useState(false);
  const [remoteError, setRemoteError] = useState<string>("");

  // Load local
  useEffect(() => {
    const lsDrafts = safeJSONParse<DraftGoal[]>(localStorage.getItem(LS_DRAFTS), []);
    const lsStage = (localStorage.getItem(LS_STAGE) as Stage) || "add";
    const lsDone = safeJSONParse<DoneMap>(localStorage.getItem(LS_DONE), {});

    setDrafts(lsDrafts);
    setDone(lsDone);

    // Хэрвээ өмнө баталгаажуулсан/хэрэгжүүлэлттэй бол шууд "run" руу
    if (lsStage === "run") setStage("run");
    else if (lsStage === "confirm") setStage("confirm");
    else if (lsStage === "review") setStage("review");
    else setStage("add");
  }, []);

  // Persist local
  useEffect(() => {
    localStorage.setItem(LS_DRAFTS, JSON.stringify(drafts));
  }, [drafts]);

  useEffect(() => {
    localStorage.setItem(LS_STAGE, stage);
  }, [stage]);

  useEffect(() => {
    localStorage.setItem(LS_DONE, JSON.stringify(done));
  }, [done]);

  // Load from server (Supabase via API)
  useEffect(() => {
    // аль хэдийн local дээр байгааг устгахгүй — server-ээс ирвэл merge хийнэ
    (async () => {
      try {
        setLoadingRemote(true);
        setRemoteError("");
        const res = await fetch("/api/goal-planner", { method: "GET" });
        if (!res.ok) return;
        const data = await res.json();

        const items = (data?.items ?? []) as any[];

        // items-ийг DraftGoal хэлбэрт аль болох хөрвүүлнэ
        // (танай table/route өөр байж магадгүй тул хамгийн safe хувилбар)
        const mapped: DraftGoal[] = items.map((x) => {
          const g: DraftGoal = {
            localId: String(x.id ?? x.localId ?? uid()),
            goal_type: (x.goal_type ?? x.category ?? "Хувийн") as GoalType,
            start_date: String(x.start_date ?? x.startDate ?? isoDate(new Date())),
            end_date: String(x.end_date ?? x.endDate ?? ""),
            goal_text: String(x.goal_text ?? x.goal_texts ?? x.goal ?? x.title ?? ""),
            description: String(x.description ?? x.desc ?? ""),

            time_unit: (x.time_unit ?? "Өдөрт") as TimeUnit,
            time_hours: Number(x.time_hours ?? 0),
            time_minutes: Number(x.time_minutes ?? 0),

            freq_enabled: Boolean(x.freq_enabled ?? false),
            freq_count: Number(x.freq_count ?? 1),

            created_at: String(x.created_at ?? new Date().toISOString()),
          };
          return g;
        });

        // merge: localId давхцвал local-г хадгалж, байхгүйг нэмнэ
        setDrafts((prev) => {
          const map = new Map(prev.map((p) => [p.localId, p]));
          for (const m of mapped) {
            if (!map.has(m.localId)) map.set(m.localId, m);
          }
          return Array.from(map.values()).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
        });

        // Хэрвээ server дээр байсан бол “зорилго алга” гэж гарахгүй
        // (stage-г хүчлэхгүй, хэрэглэгч өөрөө явна)
      } catch (e: any) {
        setRemoteError(e?.message ?? "SERVER_ERROR");
      } finally {
        setLoadingRemote(false);
      }
    })();
  }, []);

  const dailyTotalMin = useMemo(() => {
    return drafts.reduce((sum, g) => sum + toDailyMinutes(g), 0);
  }, [drafts]);

  const dailyTotalHM = useMemo(() => minutesToHM(dailyTotalMin), [dailyTotalMin]);

  const organized = useMemo(() => {
    const buckets: Record<DurationBucket, DraftGoal[]> = {
      "Богино хугацаа": [],
      "Дунд хугацаа": [],
      "Урт хугацаа": [],
    };
    for (const g of drafts) {
      const b = bucketByDates(g.start_date, g.end_date);
      buckets[b].push(g);
    }
    return buckets;
  }, [drafts]);

  const monthGrid = useMemo(() => monthDaysGrid(month), [month]);

  const totalGoalsCount = drafts.length;

  const dayCompletionRatio = (dayISO: string) => {
    if (!dayISO || totalGoalsCount === 0) return 0;
    let doneCount = 0;
    for (const g of drafts) {
      if (done?.[g.localId]?.[dayISO]) doneCount++;
    }
    return doneCount / totalGoalsCount; // 0..1
  };

  const toggleDone = (goalId: string, dayISO: string) => {
    if (!dayISO) return;
    setDone((prev) => {
      const next = { ...prev };
      const g = { ...(next[goalId] ?? {}) };
      g[dayISO] = !g[dayISO];
      next[goalId] = g;
      return next;
    });
  };

  const saveGoal = async () => {
    const trimmed = goalText.trim();
    if (!trimmed) return;

    const g: DraftGoal = {
      localId: uid(),
      goal_type: goalType,
      start_date: startDate,
      end_date: endDate,
      goal_text: trimmed,
      description: desc.trim(),

      time_unit: timeUnit,
      time_hours: Math.max(0, Number(timeHours) || 0),
      time_minutes: Math.min(59, Math.max(0, Number(timeMinutes) || 0)),

      freq_enabled: freqEnabled,
      freq_count: Math.max(1, Number(freqCount) || 1),

      created_at: new Date().toISOString(),
    };

    // UI дээр нэмнэ
    setDrafts((prev) => [g, ...prev]);

    // server рүү хадгалах (байвал)
    try {
      await fetch("/api/goal-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // таны route.ts "goals: []" гэж хүлээж авдаг тул тэр хэлбэрээр явуулна
        body: JSON.stringify({
          title: "Зорилгын багц",
          goals: [
            {
              id: g.localId,
              goal_text: g.goal_text,
              description: g.description,
              goal_type: g.goal_type,
              start_date: g.start_date,
              end_date: g.end_date,
              time_unit: g.time_unit,
              time_hours: g.time_hours,
              time_minutes: g.time_minutes,
              freq_enabled: g.freq_enabled,
              freq_count: g.freq_count,
              created_at: g.created_at,
            },
          ],
        }),
      });
    } catch {
      // локал дээрээ байсан хэвээр, дараа нь болно
    }

    // form reset (минимал)
    setGoalText("");
    setDesc("");
  };

  const removeGoal = async (id: string) => {
    setDrafts((prev) => prev.filter((x) => x.localId !== id));
    setDone((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    // хэрвээ API дээр delete байгаа бол энд холбоно (одоохондоо алгасав)
  };

  const goReview = () => {
    if (drafts.length === 0) return;
    setStage("review");
  };

  const goConfirm = () => {
    if (drafts.length === 0) return;
    setStage("confirm");
  };

  const goRun = () => {
    if (drafts.length === 0) return;
    setStage("run");
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <button className={styles.iconBtn} onClick={() => router.back()} aria-label="Буцах">
          ←
        </button>

        <div className={styles.topCenter}>
          <div className={styles.titleRow}>
            <span className={styles.leaf}>🍀</span>
            <h1 className={styles.title}>Зорилго бичих цэгцлэх</h1>
          </div>

          <div className={styles.tabs}>
            <button
              className={`${styles.tabBtn} ${stage === "add" ? styles.tabBtnActive : ""}`}
              onClick={() => setStage("add")}
            >
              Зорилго нэмэх
            </button>
            <button
              className={`${styles.tabBtn} ${stage === "review" ? styles.tabBtnActive : ""}`}
              onClick={() => setStage("review")}
              disabled={drafts.length === 0}
              title={drafts.length === 0 ? "Эхлээд зорилго хадгал" : ""}
            >
              Цэгцлэх
            </button>
            <button
              className={`${styles.tabBtn} ${stage === "confirm" ? styles.tabBtnActive : ""}`}
              onClick={() => setStage("confirm")}
              disabled={drafts.length === 0}
            >
              Баталгаажуулах
            </button>
            <button
              className={`${styles.tabBtn} ${stage === "run" ? styles.tabBtnActive : ""}`}
              onClick={() => setStage("run")}
              disabled={drafts.length === 0}
            >
              Хэрэгжүүлэх
            </button>
          </div>
        </div>

        <button className={styles.iconBtn} onClick={() => router.push("/")} aria-label="Чат руу">
          Чат →
        </button>
      </div>

      {/* Remote hint */}
      {(loadingRemote || remoteError) && (
        <div className={styles.notice}>
          {loadingRemote ? "Supabase-ээс зорилгуудыг уншиж байна..." : `Алдаа: ${remoteError}`}
        </div>
      )}

      {/* ADD */}
      {stage === "add" && (
        <div className={styles.card}>
          <div className={styles.sectionTitle}>1) Зорилгын төрөл</div>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label}>Зорилгын төрөл</label>
              <select className={styles.select} value={goalType} onChange={(e) => setGoalType(e.target.value as GoalType)}>
                <option>Хувийн</option>
                <option>Хосын</option>
                <option>Ажил</option>
                <option>Гэр бүл</option>
                <option>Эрүүл мэнд</option>
                <option>Санхүү</option>
                <option>Сурч хөгжих</option>
                <option>Бусад</option>
              </select>
            </div>
          </div>

          <div className={styles.sectionTitle}>2) Хэрэгжүүлэх хугацаа</div>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label}>Эхлэх</label>
              <input className={styles.input} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Дуусах</label>
              <input className={styles.input} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              <div className={styles.subNote}>Хоосон байж болно (тэгвэл “Урт хугацаа” гэж автоматаар ангилна)</div>
            </div>
          </div>

          <div className={styles.sectionTitle}>3) Зорилго</div>
          <div className={styles.field}>
            <input
              className={styles.input}
              placeholder="Жишээ: Сард орлогоо 100 сая болгох"
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
            />
          </div>

          <div className={styles.sectionTitle}>4) Тайлбар (сонголтоор)</div>
          <div className={styles.field}>
            <textarea
              className={styles.textarea}
              placeholder="Яагаад энэ зорилго чухал вэ гэх мэт..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
            />
          </div>

          <div className={styles.sectionTitle}>5) Зорилгоо биелүүлэхэд та хэр их цаг зарцуулж чадах вэ?</div>

          <div className={styles.grid3}>
            <div className={styles.field}>
              <label className={styles.label}>Хэмжээ</label>
              <select className={styles.select} value={timeUnit} onChange={(e) => setTimeUnit(e.target.value as TimeUnit)}>
                <option>Өдөрт</option>
                <option>7 хоногт</option>
                <option>Жилд</option>
                <option>Нэг удаа</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Цаг</label>
              <input
                className={styles.input}
                type="number"
                min={0}
                max={24}
                value={timeHours}
                onChange={(e) => setTimeHours(Number(e.target.value))}
                list="hoursList"
              />
              <datalist id="hoursList">
                {Array.from({ length: 25 }).map((_, i) => (
                  <option key={i} value={i} />
                ))}
              </datalist>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Минут</label>
              <input
                className={styles.input}
                type="number"
                min={0}
                max={59}
                value={timeMinutes}
                onChange={(e) => setTimeMinutes(Number(e.target.value))}
                list="minutesList"
              />
              <datalist id="minutesList">
                {[0, 5, 10, 15, 20, 30, 40, 45, 50, 55].map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.checkbox}>
              <input type="checkbox" checked={freqEnabled} onChange={(e) => setFreqEnabled(e.target.checked)} />
              Давтамж (сонголтоор) — нэгж дотор хэдэн удаа?
            </label>
            {freqEnabled && (
              <input
                className={styles.inputSmall}
                type="number"
                min={1}
                max={50}
                value={freqCount}
                onChange={(e) => setFreqCount(Number(e.target.value))}
              />
            )}
          </div>

          {/* Хадгалах товч — зорилгоны доор */}
          <div className={styles.actionsBelow}>
            <button className={styles.primaryBtn} onClick={saveGoal}>
              Хадгалах
            </button>
          </div>

          {/* List */}
          <div className={styles.listBlock}>
            <div className={styles.listTitle}>Бичсэн зорилгууд</div>

            {drafts.length === 0 ? (
              <div className={styles.empty}>Одоогоор бичсэн зорилго алга.</div>
            ) : (
              <div className={styles.list}>
                {drafts.map((g) => {
                  const dailyMin = toDailyMinutes(g);
                  const hm = minutesToHM(dailyMin);
                  const bucket = bucketByDates(g.start_date, g.end_date);
                  return (
                    <div key={g.localId} className={styles.listCard}>
                      <div className={styles.listRowTop}>
                        <div className={styles.goalText}>{g.goal_text}</div>
                        <button className={styles.linkDanger} onClick={() => removeGoal(g.localId)}>
                          Устгах
                        </button>
                      </div>

                      <div className={styles.meta}>
                        <span className={styles.metaItem}>
                          Төрөл: <b>{g.goal_type}</b>
                        </span>
                        <span className={styles.metaItem}>
                          Хугацаа: <b>{bucket}</b>
                        </span>
                        <span className={styles.metaItem}>
                          Өдөрт: <b>{hm.h} цаг {hm.m} мин</b>
                        </span>
                      </div>

                      {g.description ? <div className={styles.desc}>{g.description}</div> : null}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Цэгцлэх товч — жагсаалтын доор */}
            {drafts.length > 0 && (
              <div className={styles.actionsBelow}>
                <button className={styles.secondaryBtn} onClick={goReview}>
                  Цэгцлэх
                </button>
              </div>
            )}

            {drafts.length > 0 && (
              <div className={styles.totalBar}>
                Нийт өдөрт: <b>{dailyTotalHM.h} цаг {dailyTotalHM.m} мин</b>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REVIEW */}
      {stage === "review" && (
        <div className={styles.card}>
          <div className={styles.sectionTitle}>7) Цэгцлэх (доошоо ангилна)</div>

          <div className={styles.totalBar}>
            Нийт өдөрт: <b>{dailyTotalHM.h} цаг {dailyTotalHM.m} мин</b> (ихдвэл “Устгах” дарж цаг нь шууд багасна)
          </div>

          {(["Богино хугацаа", "Дунд хугацаа", "Урт хугацаа"] as DurationBucket[]).map((b) => (
            <div key={b} className={styles.bucket}>
              <div className={styles.bucketTitle}>{b}</div>
              {organized[b].length === 0 ? (
                <div className={styles.emptySmall}>Энд зорилго алга.</div>
              ) : (
                organized[b].map((g) => {
                  const dailyMin = toDailyMinutes(g);
                  const hm = minutesToHM(dailyMin);
                  return (
                    <div key={g.localId} className={styles.listCard}>
                      <div className={styles.listRowTop}>
                        <div className={styles.goalText}>{g.goal_text}</div>
                        <button className={styles.linkDanger} onClick={() => removeGoal(g.localId)}>
                          Устгах
                        </button>
                      </div>
                      <div className={styles.meta}>
                        <span className={styles.metaItem}>
                          Төрөл: <b>{g.goal_type}</b>
                        </span>
                        <span className={styles.metaItem}>
                          Өдөрт: <b>{hm.h} цаг {hm.m} мин</b>
                        </span>
                      </div>
                      {g.description ? <div className={styles.desc}>{g.description}</div> : null}
                    </div>
                  );
                })
              )}
            </div>
          ))}

          <div className={styles.actionsBelow}>
            <button className={styles.secondaryBtn} onClick={() => setStage("add")}>
              Буцах (нэмэх)
            </button>
            <button className={styles.primaryBtn} onClick={goConfirm}>
              Баталгаажуулах
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM */}
      {stage === "confirm" && (
        <div className={styles.card}>
          <div className={styles.sectionTitle}>8) Баталгаажуулах</div>
          <div className={styles.notice}>
            Та цэгцэлсэн зорилгуудаа баталгаажуулснаар “Хэрэгжүүлэх” хэсэг идэвхжинэ.
          </div>

          <div className={styles.totalBar}>
            Нийт өдөрт: <b>{dailyTotalHM.h} цаг {dailyTotalHM.m} мин</b>
          </div>

          <div className={styles.actionsBelow}>
            <button className={styles.secondaryBtn} onClick={() => setStage("review")}>
              Буцах (цэгцлэх)
            </button>
            <button className={styles.primaryBtn} onClick={goRun}>
              Хэрэгжүүлэх рүү
            </button>
          </div>
        </div>
      )}

      {/* RUN */}
      {stage === "run" && (
        <div className={styles.card}>
          <div className={styles.sectionTitle}>9) Хэрэгжүүлэлт</div>

          {/* Unified calendar */}
          <div className={styles.calendarBlock}>
            <div className={styles.calendarHeader}>
              <button
                className={styles.smallBtn}
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              >
                ←
              </button>
              <div className={styles.calendarTitle}>
                {month.toLocaleString("mn-MN", { year: "numeric", month: "long" })}
              </div>
              <button
                className={styles.smallBtn}
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              >
                →
              </button>
            </div>

            <div className={styles.weekHeader}>
              {["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"].map((w) => (
                <div key={w} className={styles.weekCell}>
                  {w}
                </div>
              ))}
            </div>

            <div className={styles.monthGrid}>
              {monthGrid.map((dayISO, idx) => {
                if (!dayISO) return <div key={idx} className={styles.dayCellEmpty} />;
                const ratio = dayCompletionRatio(dayISO);
                const cls =
                  ratio === 0 ? styles.dayCell :
                  ratio < 0.5 ? `${styles.dayCell} ${styles.dayLow}` :
                  ratio < 1 ? `${styles.dayCell} ${styles.dayMid}` :
                  `${styles.dayCell} ${styles.dayFull}`;

                return (
                  <div key={idx} className={cls} title={dayISO}>
                    <div className={styles.dayNum}>{Number(dayISO.slice(-2))}</div>
                    {totalGoalsCount > 0 && (
                      <div className={styles.dayPct}>{Math.round(ratio * 100)}%</div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className={styles.totalBar}>
              Нийт өдөрт: <b>{dailyTotalHM.h} цаг {dailyTotalHM.m} мин</b>
            </div>
          </div>

          {/* Per-goal calendars */}
          <div className={styles.bucket}>
            <div className={styles.bucketTitle}>Зорилгууд</div>
            {drafts.length === 0 ? (
              <div className={styles.emptySmall}>Зорилго алга.</div>
            ) : (
              drafts.map((g) => {
                const dailyMin = toDailyMinutes(g);
                const hm = minutesToHM(dailyMin);
                const bucket = bucketByDates(g.start_date, g.end_date);
                const openKey = `open_${g.localId}`;
                const isOpen = Boolean((done as any)[openKey]); // simple toggle store

                const toggleOpen = () => {
                  setDone((prev) => {
                    const next: any = { ...prev };
                    next[openKey] = !next[openKey];
                    return next;
                  });
                };

                return (
                  <div key={g.localId} className={styles.listCard}>
                    <div className={styles.listRowTop}>
                      <div className={styles.goalText}>{g.goal_text}</div>
                      <div className={styles.rowBtns}>
                        <button className={styles.smallBtn} onClick={toggleOpen} title="Календар">
                          📅
                        </button>
                        <button className={styles.linkDanger} onClick={() => removeGoal(g.localId)}>
                          Устгах
                        </button>
                      </div>
                    </div>

                    <div className={styles.meta}>
                      <span className={styles.metaItem}>
                        Төрөл: <b>{g.goal_type}</b>
                      </span>
                      <span className={styles.metaItem}>
                        Хугацаа: <b>{bucket}</b>
                      </span>
                      <span className={styles.metaItem}>
                        Өдөрт: <b>{hm.h} цаг {hm.m} мин</b>
                      </span>
                    </div>

                    {isOpen && (
                      <div className={styles.miniCalendar}>
                        <div className={styles.weekHeader}>
                          {["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"].map((w) => (
                            <div key={w} className={styles.weekCell}>
                              {w}
                            </div>
                          ))}
                        </div>
                        <div className={styles.monthGrid}>
                          {monthGrid.map((dayISO, idx) => {
                            if (!dayISO) return <div key={idx} className={styles.dayCellEmpty} />;
                            const isDone = Boolean(done?.[g.localId]?.[dayISO]);
                            return (
                              <button
                                key={idx}
                                className={`${styles.dayBtn} ${isDone ? styles.dayBtnDone : ""}`}
                                onClick={() => toggleDone(g.localId, dayISO)}
                                title={dayISO}
                              >
                                {Number(dayISO.slice(-2))}
                              </button>
                            );
                          })}
                        </div>
                        <div className={styles.subNote}>Өдөр дээр дарвал “хийсэн” гэж өнгө өөр болно.</div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className={styles.actionsBelow}>
            <button className={styles.secondaryBtn} onClick={() => setStage("add")}>
              Буцах (нэмэх)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
