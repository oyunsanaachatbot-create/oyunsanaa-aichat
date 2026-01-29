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
  effort_hours: number;   // 0..24
  effort_minutes: number; // 0..59

  completed_days?: number | null; // ✅ хэрэгжүүлэлт: хийсэн өдрийн тоо
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

  const hm =
    h > 0 && m > 0 ? `${h}ц ${m}м` : h > 0 ? `${h}ц` : `${m}м`;

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
    const mins = (Number(g.effort_hours || 0) * 60) + Number(g.effort_minutes || 0);
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

// ✅ Нийт хэдэн өдөр хэрэгжүүлэх вэ (огноо гаргахгүй, тоо л)
function calcTotalDays(g: GoalItem) {
  if (!g.end_date) return 365;
  const d = Math.max(0, daysBetween(g.start_date, g.end_date)) + 1;
  return Math.max(1, d);
}

// ✅ серверээс ирсэн алдааны “expected json” зэрэг дотоод үгийг хүмүүст харуулахгүй
function safeErr(msg: string) {
  const m = (msg || "").toLowerCase();
  if (m.includes("unexpected token") || m.includes("expected json") || m.includes("json")) {
    return "Серверийн хариу буруу байна. /api/goal-planner хэсгээ шалгана уу.";
  }
  return msg || "Алдаа гарлаа";
}

export default function GoalPlannerPage() {
  const router = useRouter();

  // ✅ 3 үе шат
  const [mode, setMode] = useState<"edit" | "organized" | "execute">("edit");

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
  const [effHours, setEffHours] = useState<number>(0);   // ✅ 0 цаг сонгож болно
  const [effMinutes, setEffMinutes] = useState<number>(0);

  // ✅ зөвхөн эхний удаа (app ороход) л execute/edit автоматаар сонгоно
  const didInitModeRef = useRef(false);

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
    loadGoals();
  }, []);

  // ✅ зөвхөн эхний load дуусахад л auto-mode сонгоно
 useEffect(() => {
  if (loading) return;
  if (didInitModeRef.current) return;

  didInitModeRef.current = true;
  setMode(items.length > 0 ? "execute" : "edit");
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [loading]);

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

      // ✅ ХАДГАЛАХ дараа: edit дээр үлдэж, доор жагсаалт нэмэгдэнэ
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

  // ✅ “Хийсэн” (1 дар = 1 өдөр)
 async function markDoneToday(localId: string) {
  setErr("");

  // ✅ UI дээр шууд мэдрэгдэх жижиг “optimistic” нэмэлт
  setItems((prev) =>
    prev.map((g) =>
      g.localId === localId
        ? { ...g, completed_days: Math.max(0, Number(g.completed_days || 0)) + 1 }
        : g
    )
  );

  try {
    const res = await fetch("/api/goal-planner", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ local_id: localId, op: "inc_done" }),
    });

    // ✅ JSON биш ирвэл энд унахгүй
    const text = await res.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      // json биш бол data хоосон хэвээр
    }

    if (!res.ok) {
      // ✅ алдаа гарвал optimistic-оо буцааж сэргээнэ
      await loadGoals();
      throw new Error(data?.error || "PATCH_FAILED");
    }

    // ✅ сервер "already: true" гэж ирвэл: нэмэхгүй, буцааж refresh хийгээд мессеж гаргана
    if (data?.already) {
      await loadGoals();
      setErr("Та өнөөдөр энэ зорилгыг аль хэдийн “Хийсэн” гэж тэмдэглэсэн байна.");
      return;
    }

    // ✅ амжилттай бол яг серверээс refresh (тоонууд зөрөхөөс хамгаална)
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

  const totals = useMemo(() => totalByUnit(items), [items]);

  // ✅ хэрэгжүүлэлт дээр “биелсэн” зорилгыг автоматаар нуух
  const activeItems = useMemo(() => {
    return items.filter((g) => {
      const total = calcTotalDays(g);
      const done = Math.max(0, Number(g.completed_days || 0));
      return done < total; // ✅ дууссан бол хэрэгжүүлэлтээс алга
    });
  }, [items]);

  const completedCount = items.length - activeItems.length;

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

  const hourOptions = Array.from({ length: 25 }, (_, i) => i); // ✅ 0..24
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i); // 0..59

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
          {err ? (
            <div className={styles.errorBox}>
              {err}
            </div>
          ) : null}

          {/* ===================== EDIT ===================== */}
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

                {/* Save */}
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
                        <span className={styles.pill}>{formatEffort(g)}</span>
                      </div>
                    </div>

                    <button className={styles.delBtn} type="button" onClick={() => onDelete(g.localId)}>
                      Устгах
                    </button>
                  </div>
                ))}

                {!loading && items.length === 0 ? (
                  <div className={styles.muted}>Одоогоор зорилго алга.</div>
                ) : null}

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

                          {/* ✅ Цэгцлэх дээр устгах товч БАЙНА */}
                          <button className={styles.delBtn} type="button" onClick={() => onDelete(g.localId)}>
                            Устгах
                          </button>
                        </div>
                      ))
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
              {/* ✅ button биш, зөвхөн текст + тоо */}
              <div className={styles.execTopRow}>
                <div className={styles.execStat}>
                  Нийт зорилго: <b>{activeItems.length}</b>
                </div>
                <div className={styles.execStat}>
                  Биелсэн: <b>{completedCount}</b>
                </div>
              </div>

              {activeItems.length === 0 ? (
                <div className={styles.successBox}>
                  🎉 Баяр хүргэе! Та бүх зорилгоо амжилттай биелүүллээ.
                </div>
              ) : null}

              {/* ✅ Хэрэгжүүлэлт: Богино/Дунд/Урт ангиллаар харагдана */}
              {(["Богино хугацаа", "Дунд хугацаа", "Урт хугацаа"] as OrganizeGroup[]).map((k) => (
                <div key={k} style={{ marginTop: 14 }}>
                  <div className={styles.sectionTitle}>{k}</div>
                  <div className={styles.list}>
                    {execGroups[k].length === 0 ? (
                      <div className={styles.muted}>Энд зорилго алга.</div>
                    ) : (
                      execGroups[k].map((g) => {
                        const totalDays = calcTotalDays(g);
                        const done = Math.max(0, Number(g.completed_days || 0));
                        const remaining = Math.max(0, totalDays - done);

                        return (
                          <div key={g.localId} className={styles.listCard}>
                            <div className={styles.itemLeft}>
                              <div className={styles.itemTitle}>{g.goal_text}</div>
                              <div className={styles.itemMeta}>
                                <span className={styles.pill}>{g.goal_type}</span>
                                <span className={styles.pill}>{formatEffort(g)}</span>
                                <span className={styles.pill}>Нийт {totalDays} өдөр</span>
                                <span className={styles.pill}>Үлдсэн {remaining} өдөр</span>
                              </div>
                            </div>

                            {/* ✅ execute дээр “Устгах” байхгүй, зөвхөн “Хийсэн” */}
                            <button
                              type="button"
                              className={styles.doneBtn}
                              onClick={() => markDoneToday(g.localId)}
                              disabled={loading}
                            >
                              Хийсэн
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
