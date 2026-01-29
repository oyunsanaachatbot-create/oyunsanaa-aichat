"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  effort_hours: number;
  effort_minutes: number;

  // ✅ Хийсэн өдөр (1 даралт = +1 өдөр)
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

function formatEffort(g: GoalItem) {
  const h = Number(g.effort_hours || 0);
  const m = Number(g.effort_minutes || 0);
  const hm = h > 0 && m > 0 ? `${h}ц ${pad2(m)}м` : h > 0 ? `${h}ц` : `${pad2(m)}м`;
  return `${g.effort_unit} – ${hm}`;
}

function totalByUnit(goals: GoalItem[]) {
  const units: EffortUnit[] = ["Өдөрт", "7 хоногт", "Сард", "Жилд", "Нэг л удаа"];
  const map: Record<EffortUnit, number> = {
    "Өдөрт": 0,
    "7 хоногт": 0,
    "Сард": 0,
    "Жилд": 0,
    "Нэг л удаа": 0,
  };

  for (const g of goals) {
    const mins = Number(g.effort_hours || 0) * 60 + Number(g.effort_minutes || 0);
    map[g.effort_unit] += mins;
  }

  return units.map((u) => {
    const mins = map[u];
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const text = h > 0 && m > 0 ? `${h} цаг ${m} мин` : h > 0 ? `${h} цаг` : `${m} мин`;
    return { unit: u, text };
  });
}

// ✅ Нийт хэдэн өдөр (энд_date байхгүй бол 365 гэж үзнэ)
function calcTotalDays(g: GoalItem) {
  if (!g.end_date) return 365;
  const d = Math.max(0, daysBetween(g.start_date, g.end_date)) + 1;
  return Math.max(1, d);
}

// ✅ JSON parse аюулгүй (expected json гаргахгүй)
async function safeReadJson(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  const txt = await res.text().catch(() => "");
  return { error: txt || "SERVER_RESPONSE_NOT_JSON" };
}

function friendlyError(e: any) {
  const msg = String(e?.message || "");
  // “Unexpected token … JSON …” гэх мэт муухай үгийг UI дээр гаргахгүй
  if (msg.toLowerCase().includes("json") || msg.toLowerCase().includes("unexpected token")) {
    return "Серверийн хариу буруу байна. Дахин оролдоно уу.";
  }
  if (!msg) return "Алдаа гарлаа. Дахин оролдоно уу.";
  // Хэт урт мессежийг дарна
  return msg.length > 120 ? "Алдаа гарлаа. Дахин оролдоно уу." : msg;
}

export default function GoalPlannerPage() {
  const router = useRouter();
  const sp = useSearchParams();

  // ✅ Chat-оос ороход: default = execute (зорилго байвал), байхгүй бол edit
  // ✅ ?new=1 байвал үргэлж шинэ зорилго (edit) нээнэ
  const forceNew = sp?.get("new") === "1";

  // ✅ 3 үе шат
  const [mode, setMode] = useState<"edit" | "organized" | "execute">("execute");

  const [items, setItems] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  // ---- form ----
  const [goalType, setGoalType] = useState<GoalType>("Хувийн");
  const [startDate, setStartDate] = useState<string>(todayISO());
  const [endDate, setEndDate] = useState<string>("");

  const [goalText, setGoalText] = useState("");
  const [desc, setDesc] = useState("");

  const [effUnit, setEffUnit] = useState<EffortUnit>("Өдөрт");
  // ✅ Цаг 0-оор эхэлнэ (заавал 1 цаг биш)
  const [effHours, setEffHours] = useState<number>(0);
  const [effMinutes, setEffMinutes] = useState<number>(0);

  async function loadGoals() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/goal-planner", { method: "GET" });
      const data = await safeReadJson(res);
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
        effort_hours: Number(x.effort_hours ?? 0),
        effort_minutes: Number(x.effort_minutes ?? 0),

        completed_days: x.completed_days === null || x.completed_days === undefined ? 0 : Number(x.completed_days),
      }));

      setItems(mapped);

      // ✅ 8) Chat -> app дархад: зорилго байвал execute, байхгүй бол edit
      if (forceNew) {
        setMode("edit");
      } else {
        setMode(mapped.length > 0 ? "execute" : "edit");
      }
    } catch (e: any) {
      setErr(friendlyError(e));
      setItems([]);
      // алдаа гарлаа ч edit рүү (шинэ зорилго бичиж болно)
      setMode("edit");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetFormKeepDates() {
    setGoalText("");
    setDesc("");
    setEffUnit("Өдөрт");
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
      effort_hours: Math.max(0, Math.min(24, Number(effHours) || 0)),
      effort_minutes: Math.max(0, Math.min(59, Number(effMinutes) || 0)),
      // ❌ frequency бүр мөсөн устсан
    };

    try {
      const res = await fetch("/api/goal-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Зорилгууд", goals: [payload] }),
      });

      const data = await safeReadJson(res);
      if (!res.ok) throw new Error(data?.error || "SAVE_FAILED");

      await loadGoals();
      resetFormKeepDates();
      // хадгалсны дараа шууд execute
      setMode("execute");
    } catch (e: any) {
      setErr(friendlyError(e));
    }
  }

  // ✅ Өнөөдөр хийсэн гэж тэмдэглэх: +1 өдөр (дээш хэтрүүлэхгүй)
  async function markDoneToday(localId: string) {
    setErr("");
    try {
      const current = items.find((x) => x.localId === localId);
      if (current) {
        const total = calcTotalDays(current);
        const done = Math.max(0, Number(current.completed_days || 0));
        if (done >= total) return; // аль хэдийн дууссан
      }

      const res = await fetch("/api/goal-planner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ local_id: localId, op: "inc_done" }),
      });

      const data = await safeReadJson(res);
      if (!res.ok) throw new Error(data?.error || "PATCH_FAILED");
      await loadGoals();
    } catch (e: any) {
      setErr(friendlyError(e));
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

  // ✅ 2) Цаг дээр 0 нэмэх: 0..24
  const hourOptions = Array.from({ length: 25 }, (_, i) => i); // 0..24
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i); // 0..59

  const canOrganize = items.length > 0 && !loading;

  // ✅ 5) Execute summary: нийт зорилго / бүрэн дууссан зорилго
  const execSummary = useMemo(() => {
    const totalGoals = items.length;
    const completedGoals = items.filter((g) => {
      const totalDays = calcTotalDays(g);
      const done = Math.max(0, Number(g.completed_days || 0));
      return done >= totalDays;
    }).length;
    return { totalGoals, completedGoals };
  }, [items]);

  return (
    <div className={styles.cbtBody}>
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.back} onClick={() => router.back()} aria-label="Буцах">
            ←
          </button>

          <div className={styles.headMid}>
            <div className={styles.headTitle}>Зорилго</div>
            <div className={styles.headSub}>
              {mode === "edit"
                ? "Бичээд хадгал → Доор жагсана"
                : mode === "organized"
                  ? "Цэгцэлсэн жагсаалт"
                  : "Хэрэгжүүлэлт"}
            </div>
          </div>

          <a className={styles.chatBtn} href="/chat">
            <span className={styles.chatIcon}>💬</span>
            Чат
          </a>
        </div>

        <div className={styles.card}>
          {/* ✅ 4) Execute дээр “expected json …” гэх муухай үг гарахгүй (friendlyError ашигласан) */}
          {err ? <div className={styles.errBox}>{err}</div> : null}

          {/* ===================== EDIT ===================== */}
          {mode === "edit" ? (
            <>
              <div className={styles.form}>
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

                {/* ❌ 1) Давтамж бүр мөсөн устсан */}

                <div className={styles.actions}>
                  <button className={styles.mainBtn} onClick={onSave} disabled={loading}>
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
                        <span className={styles.pill}>{formatEffort(g)}</span>
                        <span className={styles.pill}>Нийт {calcTotalDays(g)} өдөр</span>
                      </div>
                      {g.description ? (
                        <div className={styles.muted} style={{ marginTop: 6 }}>
                          {g.description}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}

                {!loading && items.length === 0 ? <div className={styles.muted}>Одоогоор зорилго алга.</div> : null}

                {canOrganize ? (
                  <div className={styles.actions}>
                    <button className={styles.ghostBtn} onClick={() => setMode("organized")}>
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
                    <span className={styles.summaryKey}>{t.unit}:</span>
                    <span className={styles.summaryVal}>{t.text}</span>
                  </div>
                ))}
              </div>

              <div className={styles.muted} style={{ marginTop: 10, fontWeight: 900 }}>
                Доорх жагсаалтаа шалгаад <span style={{ fontWeight: 950 }}>“Баталгаажуулах”</span> товч дарна.
              </div>

              {(["Богино хугацаа", "Дунд хугацаа", "Урт хугацаа"] as OrganizeGroup[]).map((k) => (
                <div key={k} style={{ marginTop: 14 }}>
                  <div className={styles.sectionTitle}>{k}</div>
                  <div className={styles.list}>
                    {organized[k].length === 0 ? (
                      <div className={styles.muted}>Энд зорилго алга.</div>
                    ) : (
                      organized[k].map((g) => (
                        <div key={g.localId} className={styles.listCard}>
                          <div className={styles.itemLeft}>
                            <div className={styles.itemTitle}>{g.goal_text}</div>
                            <div className={styles.itemMeta}>
                              <span className={styles.pill}>{g.goal_type}</span>
                              <span className={styles.pill}>{formatEffort(g)}</span>
                              <span className={styles.pill}>Нийт {calcTotalDays(g)} өдөр</span>
                            </div>

                            {g.description ? (
                              <div className={styles.muted} style={{ marginTop: 6 }}>
                                {g.description}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}

              <div className={styles.actions} style={{ marginTop: 14 }}>
                <button className={styles.mainBtn} onClick={() => setMode("execute")} disabled={!items.length}>
                  Баталгаажуулах
                </button>
                <button className={styles.ghostBtn} onClick={() => setMode("edit")}>
                  Буцах
                </button>
              </div>
            </>
          ) : null}

          {/* ===================== EXECUTE ===================== */}
          {mode === "execute" ? (
            <>
              <div className={styles.sectionTitle}>Хэрэгжүүлэлт</div>

              {/* ✅ 5) Нийт зорилго / Бийлсэн зорилго — нэг мөр, бага зай */}
              <div className={styles.execTopLine}>
                <span className={styles.execStatPill}>Нийт зорилго: {execSummary.totalGoals}</span>
                <span className={styles.execStatPill}>Бийлсэн зорилго: {execSummary.completedGoals}</span>
              </div>

              <div className={styles.muted} style={{ marginBottom: 10 }}>
                Эндээс өдөр бүр “Хийсэн” гэж тэмдэглэнэ. (1 товч = 1 өдөр)
              </div>

              <div className={styles.list}>
                {items.map((g) => {
                  const totalDays = calcTotalDays(g);
                  const done = Math.max(0, Number(g.completed_days || 0));
                  const clampedDone = Math.min(totalDays, done);
                  const remaining = Math.max(0, totalDays - clampedDone);

                  const finished = clampedDone >= totalDays;

                  return (
                    <div key={g.localId} className={styles.listCard}>
                      <div className={styles.itemLeft}>
                        <div className={styles.itemTitle}>{g.goal_text}</div>

                        <div className={styles.itemMeta}>
                          <span className={styles.pill}>{g.goal_type}</span>
                          <span className={styles.pill}>{formatEffort(g)}</span>
                          <span className={styles.pill}>Нийт {totalDays} өдөр</span>
                          <span className={styles.pill}>Хийсэн {clampedDone} өдөр</span>
                          <span className={styles.pill}>Үлдсэн {remaining} өдөр</span>
                        </div>

                        {finished ? (
                          <div className={styles.doneBadge}>
                            🎉 Танид баяр хүргэе! Та энэ зорилгыг амжилттай биелүүллээ.
                          </div>
                        ) : null}
                      </div>

                      {/* ✅ 3) Execute дээр Устгах байхгүй — зөвхөн “Хийсэн” */}
                      <div className={styles.execRight}>
                        <button
                          className={styles.doneBtn}
                          onClick={() => markDoneToday(g.localId)}
                          disabled={finished}
                          aria-disabled={finished}
                        >
                          Хийсэн
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ✅ 7) Доор 2 товч: цэгцлэх рүү буцах + шинэ зорилго нэмэх */}
              <div className={styles.actions} style={{ marginTop: 14 }}>
                <button className={styles.ghostBtn} onClick={() => setMode("organized")}>
                  Цэгцлэх рүү буцах
                </button>
                <button
                  className={styles.mainBtn}
                  onClick={() => {
                    setMode("edit");
                    setErr("");
                    // edit нээгээд шууд бичихэд бэлэн
                    setGoalText("");
                    setDesc("");
                  }}
                >
                  Шинэ зорилго нэмэх
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
