"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./cbt.module.css"; // одоо байгаа css-ээ ашиглана

type GoalType =
  | "Хувийн"
  | "Хосын" 
  | "Ажил"
  | "Гэр бүл"
  | "Эрүүл мэнд"
  | "Санхүү"
  | "Сурч хөгжих"
  | "Бусад";

type TimeUnit = "Өдөрт" | "7 хоногт" | "Сард";

type DraftGoal = {
  localId: string;
  goal_type: GoalType;
  start_date: string; // yyyy-mm-dd
  end_date: string; // yyyy-mm-dd (хоосон байж болно)
  goal_text: string;
  description: string;

  // ✅ шинэ логик: нийт цаг (unit дээр)
  time_unit: TimeUnit;
  time_hours: number;
  time_minutes: number;
};

type GoalItem = {
  id: string;
  session_id: string;
  user_id: string;
  goal_text: string;
  category: string | null;
  target_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

// ---------- helpers ----------
function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function clampInt(n: any, min: number, max: number) {
  const x = Number.isFinite(Number(n)) ? Math.floor(Number(n)) : 0;
  return Math.min(max, Math.max(min, x));
}

function toMinutes(hours: number, mins: number) {
  return clampInt(hours, 0, 9999) * 60 + clampInt(mins, 0, 59);
}

// Нийт минутыг 3 хэмжээс рүү хувиргах (ойролцоогоор)
function minutesToBreakdownPerUnit(totalMin: number, unit: TimeUnit) {
  // totalMin = тухайн unit дээр зарцуулах минут
  // харуулахдаа өдөр/7хоног/сар бүгдээр нь гаргана
  const perDay =
    unit === "Өдөрт" ? totalMin : unit === "7 хоногт" ? Math.round(totalMin / 7) : Math.round(totalMin / 30);
  const perWeek =
    unit === "Өдөрт" ? totalMin * 7 : unit === "7 хоногт" ? totalMin : Math.round((totalMin / 30) * 7);
  const perMonth =
    unit === "Өдөрт" ? totalMin * 30 : unit === "7 хоногт" ? Math.round((totalMin / 7) * 30) : totalMin;

  return { perDay, perWeek, perMonth };
}

function fmtHM(min: number) {
  const h = Math.floor(min / 60);
  const m = Math.abs(min % 60);
  if (h <= 0) return `${m} мин`;
  if (m === 0) return `${h} цаг`;
  return `${h} цаг ${m} мин`;
}

function daysBetween(startISO: string, endISO: string) {
  if (!startISO || !endISO) return null;
  const a = new Date(startISO + "T00:00:00");
  const b = new Date(endISO + "T00:00:00");
  const diff = Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  return Number.isFinite(diff) ? diff : null;
}

function classifyByDuration(startISO: string, endISO: string) {
  // end_date хоосон бол "Урт хугацааны (тодорхойгүй)" гэж үзье
  if (!endISO) return "Урт хугацаа";
  const d = daysBetween(startISO, endISO);
  if (d === null) return "Урт хугацаа";
  if (d <= 30) return "Богино хугацаа";
  if (d <= 180) return "Дунд хугацаа";
  return "Урт хугацаа";
}

// ---------- page ----------
type Mode = "add" | "organize" | "do";

export default function GoalPlannerPage() {
  const [mode, setMode] = useState<Mode>("add");

  // "session_id" — танайд өөр логик байвал тааруулж болно (одоо UI-д хангалттай)
  const [sessionId] = useState<string>(() => {
    if (typeof window === "undefined") return "web";
    const key = "goal_planner_session_id_v1";
    const got = window.localStorage.getItem(key);
    if (got) return got;
    const s = uid();
    window.localStorage.setItem(key, s);
    return s;
  });

  const [draft, setDraft] = useState<DraftGoal>(() => ({
    localId: uid(),
    goal_type: "Хувийн",
    start_date: todayISO(),
    end_date: "", // хүсвэл хоосон байж болно
    goal_text: "",
    description: "",
    time_unit: "Өдөрт",
    time_hours: 0,
    time_minutes: 30,
  }));

  const [items, setItems] = useState<Array<DraftGoal & { savedId?: string }>>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  // --- optional: эхлэхэд localstorage-с сэргээх (Supabase-г эвдэхгүй, UI л)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("goal_planner_drafts_v1");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setItems(parsed);
        const sel: Record<string, boolean> = {};
        parsed.forEach((x: any) => (sel[x.localId] = true)); // default: бүгд сонгогдсон
        setSelected(sel);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("goal_planner_drafts_v1", JSON.stringify(items));
  }, [items]);

  const selectedItems = useMemo(() => items.filter((x) => selected[x.localId]), [items, selected]);

  // нийт цагийн тооцоо (сонгосон зорилгууд)
  const totals = useMemo(() => {
    let day = 0,
      week = 0,
      month = 0;

    for (const g of selectedItems) {
      const totalMin = toMinutes(g.time_hours, g.time_minutes);
      const b = minutesToBreakdownPerUnit(totalMin, g.time_unit);
      day += b.perDay;
      week += b.perWeek;
      month += b.perMonth;
    }
    return { day, week, month };
  }, [selectedItems]);

  const organized = useMemo(() => {
    const groups: Record<string, typeof selectedItems> = {
      "Богино хугацаа": [],
      "Дунд хугацаа": [],
      "Урт хугацаа": [],
    };
    for (const g of selectedItems) {
      const k = classifyByDuration(g.start_date, g.end_date);
      groups[k] = groups[k] ?? [];
      groups[k].push(g);
    }
    return groups;
  }, [selectedItems]);

  function resetDraft() {
    setDraft((p) => ({
      ...p,
      localId: uid(),
      goal_text: "",
      description: "",
      // бусдыг нь хадгалж үлдээе (хүн дараалан ижил төрөл/хугацаа сонгож бичих магадлалтай)
    }));
  }

  function addGoalToList() {
    const text = (draft.goal_text || "").trim();
    if (!text) return;

    const newItem: DraftGoal & { savedId?: string } = { ...draft, goal_text: text };
    setItems((prev) => [newItem, ...prev]);
    setSelected((prev) => ({ ...prev, [newItem.localId]: true }));

    // ✅ хамгийн чухал: дармагц доор нэмэгдээд form шинэ болгоно
    resetDraft();
  }

  function removeItem(localId: string) {
    setItems((prev) => prev.filter((x) => x.localId !== localId));
    setSelected((prev) => {
      const n = { ...prev };
      delete n[localId];
      return n;
    });
  }

  // -------- UI --------
  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>🧩 Зорилго бичиж цэгцлэх</h1>

        <div className={styles.tabs}>
          <button
            className={`${styles.tabBtn} ${mode === "add" ? styles.tabBtnActive : ""}`}
            onClick={() => setMode("add")}
            type="button"
          >
            Зорилго нэмэх
          </button>
          <button
            className={`${styles.tabBtn} ${mode === "organize" ? styles.tabBtnActive : ""}`}
            onClick={() => setMode("organize")}
            type="button"
          >
            Цэгцлэх
          </button>
          <button
            className={`${styles.tabBtn} ${mode === "do" ? styles.tabBtnActive : ""}`}
            onClick={() => setMode("do")}
            type="button"
          >
            Хэрэгжүүлэх
          </button>
        </div>
      </div>

      {/* ---------------- ADD MODE ---------------- */}
      {mode === "add" && (
        <div className={styles.card}>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label}>Зорилгын төрөл</label>
              <select
                className={styles.input}
                value={draft.goal_type}
                onChange={(e) => setDraft((p) => ({ ...p, goal_type: e.target.value as GoalType }))}
              >
                <option value="Хувийн">Хувийн</option>
                <option value="Ажил">Ажил</option>
                <option value="Гэр бүл">Гэр бүл</option>
                <option value="Эрүүл мэнд">Эрүүл мэнд</option>
                <option value="Санхүү">Санхүү</option>
                <option value="Сурч хөгжих">Сурч хөгжих</option>
                <option value="Бусад">Бусад</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Зорилго хэрэгжих хугацаа</label>
              <div className={styles.row2}>
                <div className={styles.subField}>
                  <span className={styles.subLabel}>Эхлэх</span>
                  <input
                    className={styles.input}
                    type="date"
                    value={draft.start_date}
                    onChange={(e) => setDraft((p) => ({ ...p, start_date: e.target.value }))}
                  />
                </div>
                <div className={styles.subField}>
                  <span className={styles.subLabel}>Дуусах (заавал биш)</span>
                  <input
                    className={styles.input}
                    type="date"
                    value={draft.end_date}
                    onChange={(e) => setDraft((p) => ({ ...p, end_date: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Зорилго</label>
            <input
              className={styles.input}
              placeholder="Жишээ: Сард орлогоо 100 сая болгох"
              value={draft.goal_text}
              onChange={(e) => setDraft((p) => ({ ...p, goal_text: e.target.value }))}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Тайлбар (сонголтоор)</label>
            <textarea
              className={styles.textarea}
              placeholder="Жишээ: Яагаад энэ зорилго чухал вэ, ямар нөхцөлтэй вэ гэх мэт"
              value={draft.description}
              onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
              rows={3}
            />
          </div>

          {/* ✅ ЦАГИЙН ШИНЭ ЛОГИК */}
          <div className={styles.field}>
            <label className={styles.label}>Чи энэ зорилгод нийт хэдэн цаг гаргаж чадах вэ?</label>

            <div className={styles.grid3}>
              <div className={styles.subField}>
                <span className={styles.subLabel}>Хэмжээс</span>
                <select
                  className={styles.input}
                  value={draft.time_unit}
                  onChange={(e) => setDraft((p) => ({ ...p, time_unit: e.target.value as TimeUnit }))}
                >
                  <option value="Өдөрт">Өдөрт</option>
                  <option value="7 хоногт">7 хоногт</option>
                  <option value="Сард">Сард</option>
                </select>
              </div>

              <div className={styles.subField}>
                <span className={styles.subLabel}>Цаг</span>
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  value={draft.time_hours}
                  onChange={(e) => setDraft((p) => ({ ...p, time_hours: clampInt(e.target.value, 0, 9999) }))}
                />
              </div>

              <div className={styles.subField}>
                <span className={styles.subLabel}>Минут</span>
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  max={59}
                  value={draft.time_minutes}
                  onChange={(e) => setDraft((p) => ({ ...p, time_minutes: clampInt(e.target.value, 0, 59) }))}
                />
              </div>
            </div>

            <div className={styles.miniLine}>
              {(() => {
                const totalMin = toMinutes(draft.time_hours, draft.time_minutes);
                const b = minutesToBreakdownPerUnit(totalMin, draft.time_unit);
                return (
                  <span>
                    Ойролцоогоор: <b>Өдөрт {fmtHM(b.perDay)}</b> · <b>7 хоногт {fmtHM(b.perWeek)}</b> ·{" "}
                    <b>Сард {fmtHM(b.perMonth)}</b>
                  </span>
                );
              })()}
            </div>
          </div>

          <div className={styles.actionsRow}>
            <button className={styles.primaryBtn} onClick={addGoalToList} type="button">
              ➕ Дараагийн зорилго
            </button>
          </div>
        </div>
      )}

      {/* ---------------- LIST (always show) ---------------- */}
      <div className={styles.listCard}>
        <div className={styles.listHeader}>
          <h2 className={styles.listTitle}>Бичсэн зорилгууд</h2>
          <button className={styles.secondaryBtn} type="button" onClick={() => setMode("organize")}>
            Цэгцлэх
          </button>
        </div>

        {items.length === 0 ? (
          <div className={styles.empty}>Одоогоор зорилго алга.</div>
        ) : (
          <div className={styles.list}>
            {items.map((g) => {
              const totalMin = toMinutes(g.time_hours, g.time_minutes);
              const b = minutesToBreakdownPerUnit(totalMin, g.time_unit);
              const durationLabel = classifyByDuration(g.start_date, g.end_date);

              return (
                <div key={g.localId} className={styles.item}>
                  <div className={styles.itemTop}>
                    <label className={styles.check}>
                      <input
                        type="checkbox"
                        checked={!!selected[g.localId]}
                        onChange={(e) => setSelected((p) => ({ ...p, [g.localId]: e.target.checked }))}
                      />
                      <span className={styles.itemTitle}>{g.goal_text}</span>
                    </label>

                    <button className={styles.dangerLink} type="button" onClick={() => removeItem(g.localId)}>
                      Устгах
                    </button>
                  </div>

                  <div className={styles.metaLine}>
                    <span>Төрөл: <b>{g.goal_type}</b></span>
                    <span>Хугацаа: <b>{durationLabel}</b></span>
                    <span>
                      Цаг: <b>Өдөрт {fmtHM(b.perDay)}</b> · <b>7 хоногт {fmtHM(b.perWeek)}</b> · <b>Сард {fmtHM(b.perMonth)}</b>
                    </span>
                  </div>

                  {g.description?.trim() ? <div className={styles.desc}>{g.description}</div> : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---------------- ORGANIZE MODE ---------------- */}
      {mode === "organize" && (
        <div className={styles.organizeCard}>
          <div className={styles.organizeTop}>
            <h2 className={styles.listTitle}>Цэгцэлсэн дүн</h2>
            <div className={styles.totalBox}>
              <div><span>Өдөрт</span><b>{fmtHM(totals.day)}</b></div>
              <div><span>7 хоногт</span><b>{fmtHM(totals.week)}</b></div>
              <div><span>Сард</span><b>{fmtHM(totals.month)}</b></div>
            </div>
          </div>

          <div className={styles.organizeGrid}>
            {(["Богино хугацаа", "Дунд хугацаа", "Урт хугацаа"] as const).map((k) => (
              <div key={k} className={styles.bucket}>
                <div className={styles.bucketTitle}>{k}</div>
                {organized[k]?.length ? (
                  organized[k].map((g) => {
                    const totalMin = toMinutes(g.time_hours, g.time_minutes);
                    const b = minutesToBreakdownPerUnit(totalMin, g.time_unit);
                    return (
                      <div key={g.localId} className={styles.bucketItem}>
                        <div className={styles.bucketItemTitle}>{g.goal_text}</div>
                        <div className={styles.bucketItemMeta}>
                          <span><b>{g.goal_type}</b></span>
                          <span>Өдөрт {fmtHM(b.perDay)}</span>
                          <span>7 хоногт {fmtHM(b.perWeek)}</span>
                          <span>Сард {fmtHM(b.perMonth)}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className={styles.emptySmall}>Сонгосон зорилго алга.</div>
                )}
              </div>
            ))}
          </div>

          <div className={styles.actionsRow}>
            <button className={styles.primaryBtn} type="button" onClick={() => setMode("do")}>
              ✅ Баталгаажуулах (Хэрэгжүүлэх рүү)
            </button>
            <button className={styles.secondaryBtn} type="button" onClick={() => setMode("add")}>
              Буцах (нэмэх)
            </button>
          </div>
        </div>
      )}

      {/* ---------------- DO MODE ---------------- */}
      {mode === "do" && (
        <div className={styles.card}>
          <h2 className={styles.listTitle}>Хэрэгжүүлэлт</h2>
          <div className={styles.empty}>
            Энэ хэсгийг дараагийн алхамд таны хүссэнээр:
            <br />– зорилго бүр calendar/check-тэй
            <br />– өнөөдрийн хийсэн эсэхийг чеклэх
            <br />– нийт 100% progress самбар
            <br />болгож Supabase goal_logs-той холбож өгнө.
            <br /><br />
            Одоохондоо “Цэгцлэх” дээр цаг/ангилал нь 100% зөв гарч байгаа эсэхээ шалгаарай.
          </div>

          <div className={styles.actionsRow}>
            <button className={styles.secondaryBtn} type="button" onClick={() => setMode("organize")}>
              Буцах (цэгцлэх)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
