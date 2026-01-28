"use client";

import { useEffect, useMemo, useState } from "react";
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

type DurationGroup = "Богино хугацаа" | "Дунд хугацаа" | "Урт хугацаа";
type TimeUnit = "Өдөрт" | "7 хоногт" | "Сард" | "Нэг удаа";

type DraftGoal = {
  id: string;
  goal_type: GoalType;

  start_date: string; // yyyy-mm-dd
  end_date: string; // yyyy-mm-dd or ""

  goal_text: string;
  description: string;

  time_unit: TimeUnit;
  time_hours: number;
  time_minutes: number;

  repeats_enabled: boolean;
  repeats_count: number;

  created_at: string;
};

type ConfirmedGoal = DraftGoal & { confirmed_at: string };
type GoalLogMap = Record<string, Record<string, boolean>>;

const LS_DRAFTS = "oy_goal_drafts_v3";
const LS_CONFIRMED = "oy_goal_confirmed_v3";
const LS_LOGS = "oy_goal_logs_v3";

type TabKey = "add" | "organize" | "implement";

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

function parseISODate(s: string) {
  // s: yyyy-mm-dd
  const [y, m, d] = s.split("-").map((x) => Number(x));
  if (!y || !m || !d) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function daysBetween(aISO: string, bISO: string) {
  const a = parseISODate(aISO);
  const b = parseISODate(bISO);
  if (!a || !b) return null;
  const diff = b.getTime() - a.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function autoDurationGroup(startISO: string, endISO: string): DurationGroup {
  // ✅ хэрэглэгч сонгохгүй, автоматаар:
  // - end_date байхгүй -> Урт
  // - 0-30 хоног -> Богино
  // - 31-180 хоног -> Дунд
  // - 181+ -> Урт
  if (!endISO) return "Урт хугацаа";
  const d = daysBetween(startISO || todayISO(), endISO);
  if (d === null) return "Урт хугацаа";
  const days = Math.max(0, d);
  if (days <= 30) return "Богино хугацаа";
  if (days <= 180) return "Дунд хугацаа";
  return "Урт хугацаа";
}

function clampInt(n: any, min: number, max: number) {
  const x = Number.isFinite(Number(n)) ? Math.floor(Number(n)) : min;
  return Math.max(min, Math.min(max, x));
}

function minutesFrom(hours: number, minutes: number) {
  return clampInt(hours, 0, 999) * 60 + clampInt(minutes, 0, 59);
}

function fmtHoursMinutes(totalMinutes: number) {
  const m = Math.round(totalMinutes);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h <= 0) return `${mm} мин`;
  if (mm === 0) return `${h} цаг`;
  return `${h} цаг ${mm} мин`;
}

function calcTotalsPerPeriod(goal: DraftGoal) {
  const totalMin = minutesFrom(goal.time_hours, goal.time_minutes);

  let perDay = 0;
  let perWeek = 0;
  let perMonth = 0;
  let oneTime = 0;

  if (goal.time_unit === "Өдөрт") {
    perDay = totalMin;
    perWeek = totalMin * 7;
    perMonth = totalMin * 30;
  } else if (goal.time_unit === "7 хоногт") {
    perWeek = totalMin;
    perDay = totalMin / 7;
    perMonth = (totalMin * 30) / 7;
  } else if (goal.time_unit === "Сард") {
    perMonth = totalMin;
    perDay = totalMin / 30;
    perWeek = (totalMin / 30) * 7;
  } else {
    oneTime = totalMin;
  }

  return { perDay, perWeek, perMonth, oneTime, totalMin };
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function saveJson(key: string, value: any) {
  localStorage.setItem(key, JSON.stringify(value));
}

export default function GoalPlannerPage() {
  const [tab, setTab] = useState<TabKey>("add");

  const [drafts, setDrafts] = useState<DraftGoal[]>([]);
  const [confirmed, setConfirmed] = useState<ConfirmedGoal[]>([]);
  const [logs, setLogs] = useState<GoalLogMap>({});
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  // Form
  const [goalType, setGoalType] = useState<GoalType>("Хувийн");
  const [startDate, setStartDate] = useState<string>(todayISO());
  const [endDate, setEndDate] = useState<string>("");
  const [goalText, setGoalText] = useState<string>("");
  const [desc, setDesc] = useState<string>("");

  const [timeUnit, setTimeUnit] = useState<TimeUnit>("Өдөрт");
  const [timeHours, setTimeHours] = useState<number>(0);
  const [timeMins, setTimeMins] = useState<number>(30);

  const [repeatsEnabled, setRepeatsEnabled] = useState<boolean>(false);
  const [repeatsCount, setRepeatsCount] = useState<number>(1);

  useEffect(() => {
    const d = loadJson<DraftGoal[]>(LS_DRAFTS, []);
    const c = loadJson<ConfirmedGoal[]>(LS_CONFIRMED, []);
    const l = loadJson<GoalLogMap>(LS_LOGS, {});
    setDrafts(d);
    setConfirmed(c);
    setLogs(l);

    const sel: Record<string, boolean> = {};
    d.forEach((x) => (sel[x.id] = true));
    setSelectedIds(sel);

    if (c.length > 0) setTab("implement");
    else setTab("add");
  }, []);

  useEffect(() => saveJson(LS_DRAFTS, drafts), [drafts]);
  useEffect(() => saveJson(LS_CONFIRMED, confirmed), [confirmed]);
  useEffect(() => saveJson(LS_LOGS, logs), [logs]);

  const today = todayISO();
  const todayLog = logs[today] || {};

  const selectedDrafts = useMemo(() => drafts.filter((d) => selectedIds[d.id]), [drafts, selectedIds]);

  const organize = useMemo(() => {
    let day = 0,
      week = 0,
      month = 0,
      oneTime = 0;

    const shortList: DraftGoal[] = [];
    const midList: DraftGoal[] = [];
    const longList: DraftGoal[] = [];

    for (const g of selectedDrafts) {
      const grp = autoDurationGroup(g.start_date, g.end_date);
      if (grp === "Богино хугацаа") shortList.push(g);
      else if (grp === "Дунд хугацаа") midList.push(g);
      else longList.push(g);

      const t = calcTotalsPerPeriod(g);
      day += t.perDay;
      week += t.perWeek;
      month += t.perMonth;
      oneTime += t.oneTime;
    }

    return { day, week, month, oneTime, shortList, midList, longList };
  }, [selectedDrafts]);

  const doneCountToday = useMemo(() => {
    if (confirmed.length === 0) return 0;
    return confirmed.reduce((acc, g) => acc + (todayLog[g.id] ? 1 : 0), 0);
  }, [confirmed, todayLog]);

  const progressPct = useMemo(() => {
    if (confirmed.length === 0) return 0;
    return Math.round((doneCountToday / confirmed.length) * 100);
  }, [doneCountToday, confirmed.length]);

  function resetForm() {
    setGoalType("Хувийн");
    setStartDate(todayISO());
    setEndDate("");
    setGoalText("");
    setDesc("");
    setTimeUnit("Өдөрт");
    setTimeHours(0);
    setTimeMins(30);
    setRepeatsEnabled(false);
    setRepeatsCount(1);
  }

  function saveDraft() {
    const text = goalText.trim();
    if (!text) {
      alert("Зорилгоо бичнэ үү.");
      return;
    }
    const totalMin = minutesFrom(timeHours, timeMins);
    if (totalMin <= 0) {
      alert("Цаг/минут 0-ээс их байна.");
      return;
    }

    const now = new Date().toISOString();
    const item: DraftGoal = {
      id: uid(),
      goal_type: goalType,
      start_date: startDate || todayISO(),
      end_date: endDate || "",
      goal_text: text,
      description: desc.trim(),
      time_unit: timeUnit,
      time_hours: clampInt(timeHours, 0, 999),
      time_minutes: clampInt(timeMins, 0, 59),
      repeats_enabled: !!repeatsEnabled,
      repeats_count: clampInt(repeatsCount, 1, 999),
      created_at: now,
    };

    setDrafts((prev) => [item, ...prev]);
    setSelectedIds((prev) => ({ ...prev, [item.id]: true }));
    resetForm();
  }

  function removeDraft(id: string) {
    if (!confirm("Энэ зорилгыг устгах уу?")) return;
    setDrafts((prev) => prev.filter((x) => x.id !== id));
    setSelectedIds((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
  }

  function confirmSelected() {
    if (selectedDrafts.length === 0) {
      alert("Сонгосон зорилго алга.");
      return;
    }
    const now = new Date().toISOString();
    const existing = new Map(confirmed.map((c) => [c.id, c]));

    for (const g of selectedDrafts) {
      existing.set(g.id, { ...g, confirmed_at: now });
    }

    setConfirmed(Array.from(existing.values()));
    const ids = new Set(selectedDrafts.map((x) => x.id));
    setDrafts((prev) => prev.filter((x) => !ids.has(x.id)));

    setSelectedIds((prev) => {
      const n = { ...prev };
      ids.forEach((id) => delete n[id]);
      return n;
    });

    setTab("implement");
  }

  function toggleTodayDone(goalId: string, checked: boolean) {
    setLogs((prev) => {
      const next = { ...prev };
      const dayLog = { ...(next[today] || {}) };
      dayLog[goalId] = checked;
      next[today] = dayLog;
      return next;
    });
  }

  function removeConfirmed(goalId: string) {
    if (!confirm("Баталгаажсан зорилгыг устгах уу?")) return;
    setConfirmed((prev) => prev.filter((x) => x.id !== goalId));
    setLogs((prev) => {
      const next: GoalLogMap = { ...prev };
      for (const d of Object.keys(next)) {
        if (next[d] && goalId in next[d]) {
          const copy = { ...next[d] };
          delete copy[goalId];
          next[d] = copy;
        }
      }
      return next;
    });
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>🌿 Зорилго бичих цэгцлэх</h1>
          <div className={styles.sub}>Зорилго нэмэх • Цэгцлэх • Хэрэгжүүлэх</div>
        </div>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === "add" ? styles.tabActive : ""}`} onClick={() => setTab("add")}>
            Зорилго нэмэх
          </button>
          <button
            className={`${styles.tab} ${tab === "organize" ? styles.tabActive : ""}`}
            onClick={() => setTab("organize")}
          >
            Цэгцлэх
          </button>
          <button
            className={`${styles.tab} ${tab === "implement" ? styles.tabActive : ""}`}
            onClick={() => setTab("implement")}
          >
            Хэрэгжүүлэх
          </button>
        </div>
      </div>

      {/* ===== ADD ===== */}
      {tab === "add" && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>Зорилго нэмэх</div>

          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label}>Зорилгын төрөл</label>
              <select className={styles.input} value={goalType} onChange={(e) => setGoalType(e.target.value as GoalType)}>
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

            <div className={styles.field}>
              <label className={styles.label}>Хугацааны ангилал</label>
              <div className={styles.readonlyBox}>
                {autoDurationGroup(startDate, endDate)}{" "}
                <span className={styles.mutedSmall}>(автоматаар)</span>
              </div>
            </div>
          </div>

          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label}>Эхлэх</label>
              <input className={styles.input} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Дуусах (заавал биш)</label>
              <input className={styles.input} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Зорилго</label>
            <input
              className={styles.input}
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              placeholder="Жишээ: Сард орлогоо 100 сая болгох"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Тайлбар (сонголтоор)</label>
            <textarea
              className={styles.textarea}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Жишээ: Яагаад энэ зорилго чухал вэ…"
              rows={3}
            />
          </div>

          <div className={styles.box}>
            <div className={styles.boxTitle}>Цагийн төлөвлөгөө</div>

            <div className={styles.grid3}>
              <div className={styles.field}>
                <label className={styles.label}>Хэмнэл</label>
                <select className={styles.input} value={timeUnit} onChange={(e) => setTimeUnit(e.target.value as TimeUnit)}>
                  <option>Өдөрт</option>
                  <option>7 хоногт</option>
                  <option>Сард</option>
                  <option>Нэг удаа</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Цаг</label>
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  max={999}
                  value={timeHours}
                  onChange={(e) => setTimeHours(clampInt(e.target.value, 0, 999))}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Минут</label>
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  max={59}
                  value={timeMins}
                  onChange={(e) => setTimeMins(clampInt(e.target.value, 0, 59))}
                />
              </div>
            </div>

            <div className={styles.rowBetween}>
              <label className={styles.checkRow}>
                <input type="checkbox" checked={repeatsEnabled} onChange={(e) => setRepeatsEnabled(e.target.checked)} />
                <span>Давтамж (сонголтоор) — нэгж дотор хэдэн удаа?</span>
              </label>

              {repeatsEnabled ? (
                <div className={styles.repeat}>
                  <span className={styles.mutedSmall}>Хэдэн удаа:</span>
                  <input
                    className={styles.inputSmall}
                    type="number"
                    min={1}
                    max={999}
                    value={repeatsCount}
                    onChange={(e) => setRepeatsCount(clampInt(e.target.value, 1, 999))}
                  />
                </div>
              ) : null}
            </div>

            <div className={styles.hint}>
              Ойролцоогоор: <b>{timeUnit} {fmtHoursMinutes(minutesFrom(timeHours, timeMins))}</b>
              {repeatsEnabled ? <span> / {repeatsCount} удаа</span> : null}
            </div>
          </div>

          <div className={styles.actions}>
            <button className={styles.primary} onClick={saveDraft}>Хадгалах</button>
            <button className={styles.secondary} onClick={() => setTab("organize")}>Цэгцлэх рүү</button>
          </div>

          <div className={styles.divider} />

          <div className={styles.cardTitle}>Бичсэн зорилгууд</div>
          {drafts.length === 0 ? (
            <div className={styles.muted}>Одоогоор бичсэн зорилго алга.</div>
          ) : (
            <div className={styles.list}>
              {drafts.map((g) => {
                const grp = autoDurationGroup(g.start_date, g.end_date);
                const t = calcTotalsPerPeriod(g);
                return (
                  <div className={styles.item} key={g.id}>
                    <div className={styles.itemTop}>
                      <div className={styles.itemTitle}>{g.goal_text}</div>
                      <button className={styles.dangerLink} onClick={() => removeDraft(g.id)}>Устгах</button>
                    </div>

                    <div className={styles.badges}>
                      <span className={styles.badge}>{g.goal_type}</span>
                      <span className={styles.badge}>{grp}</span>
                      <span className={styles.badge}>
                        {g.time_unit}: {fmtHoursMinutes(t.totalMin)}{g.repeats_enabled ? ` / ${g.repeats_count} удаа` : ""}
                      </span>
                    </div>

                    {g.description ? <div className={styles.desc}>{g.description}</div> : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== ORGANIZE ===== */}
      {tab === "organize" && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>Цэгцлэх</div>

          {drafts.length === 0 ? (
            <div className={styles.muted}>Цэгцлэх зорилго алга.</div>
          ) : (
            <>
              <div className={styles.muted}>
                ✅ “Урт/Дунд/Богино” нь **автоматаар** ангилагдана. Энд зөвхөн баталгаажуулах зорилгуудаа сонгоно.
              </div>

              <div className={styles.list}>
                {drafts.map((g) => {
                  const checked = !!selectedIds[g.id];
                  const grp = autoDurationGroup(g.start_date, g.end_date);
                  const t = calcTotalsPerPeriod(g);

                  return (
                    <div className={styles.item} key={g.id}>
                      <div className={styles.itemTop}>
                        <label className={styles.checkRow}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => setSelectedIds((p) => ({ ...p, [g.id]: e.target.checked }))}
                          />
                          <span className={styles.itemTitle}>{g.goal_text}</span>
                        </label>

                        <button className={styles.dangerLink} onClick={() => removeDraft(g.id)}>Устгах</button>
                      </div>

                      <div className={styles.badges}>
                        <span className={styles.badge}>{g.goal_type}</span>
                        <span className={styles.badge}>{grp}</span>
                        <span className={styles.badge}>
                          {g.time_unit}: {fmtHoursMinutes(t.totalMin)}{g.repeats_enabled ? ` / ${g.repeats_count} удаа` : ""}
                        </span>
                      </div>

                      {g.time_unit === "Нэг удаа" ? (
                        <div className={styles.mini}>
                          Нэг удаагийн ажил: <b>{fmtHoursMinutes(t.oneTime)}</b>
                        </div>
                      ) : (
                        <div className={styles.mini}>
                          Өдөрт: <b>{fmtHoursMinutes(t.perDay)}</b> • 7 хоногт: <b>{fmtHoursMinutes(t.perWeek)}</b> • Сард:{" "}
                          <b>{fmtHoursMinutes(t.perMonth)}</b>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className={styles.box}>
                <div className={styles.boxTitle}>Нийт ачаалал (сонгосон)</div>
                <div className={styles.summary}>
                  <div><div className={styles.sumLabel}>Өдөрт</div><div className={styles.sumVal}>{fmtHoursMinutes(organize.day)}</div></div>
                  <div><div className={styles.sumLabel}>7 хоногт</div><div className={styles.sumVal}>{fmtHoursMinutes(organize.week)}</div></div>
                  <div><div className={styles.sumLabel}>Сард</div><div className={styles.sumVal}>{fmtHoursMinutes(organize.month)}</div></div>
                  <div><div className={styles.sumLabel}>Нэг удаа</div><div className={styles.sumVal}>{fmtHoursMinutes(organize.oneTime)}</div></div>
                </div>

                <div className={styles.groupGrid}>
                  <div>
                    <div className={styles.groupTitle}>Богино хугацаа</div>
                    {organize.shortList.length ? (
                      <ul className={styles.ul}>
                        {organize.shortList.map((g) => <li key={g.id}><b>{g.goal_text}</b> — {g.goal_type}</li>)}
                      </ul>
                    ) : <div className={styles.muted}>Алга.</div>}
                  </div>

                  <div>
                    <div className={styles.groupTitle}>Дунд хугацаа</div>
                    {organize.midList.length ? (
                      <ul className={styles.ul}>
                        {organize.midList.map((g) => <li key={g.id}><b>{g.goal_text}</b> — {g.goal_type}</li>)}
                      </ul>
                    ) : <div className={styles.muted}>Алга.</div>}
                  </div>

                  <div>
                    <div className={styles.groupTitle}>Урт хугацаа</div>
                    {organize.longList.length ? (
                      <ul className={styles.ul}>
                        {organize.longList.map((g) => <li key={g.id}><b>{g.goal_text}</b> — {g.goal_type}</li>)}
                      </ul>
                    ) : <div className={styles.muted}>Алга.</div>}
                  </div>
                </div>

                <div className={styles.actions}>
                  <button className={styles.primary} onClick={confirmSelected}>Баталгаажуулах (Хэрэгжүүлэх рүү)</button>
                  <button className={styles.secondary} onClick={() => setTab("add")}>Буцах</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== IMPLEMENT ===== */}
      {tab === "implement" && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>Хэрэгжүүлэх</div>

          {confirmed.length === 0 ? (
            <div className={styles.muted}>
              Баталгаажсан зорилго алга. “Цэгцлэх” дээрээс сонгоод “Баталгаажуулах” дар.
            </div>
          ) : (
            <>
              <div className={styles.progressRow}>
                <div className={styles.progressPct}>{progressPct}%</div>
                <div className={styles.progressText}>Өнөөдөр: {doneCountToday}/{confirmed.length} гүйцэтгэсэн</div>
              </div>

              <div className={styles.list}>
                {confirmed.map((g) => {
                  const grp = autoDurationGroup(g.start_date, g.end_date);
                  const t = calcTotalsPerPeriod(g);
                  return (
                    <div className={styles.item} key={g.id}>
                      <div className={styles.itemTop}>
                        <label className={styles.checkRow}>
                          <input
                            type="checkbox"
                            checked={!!todayLog[g.id]}
                            onChange={(e) => toggleTodayDone(g.id, e.target.checked)}
                          />
                          <span className={styles.itemTitle}>{g.goal_text}</span>
                        </label>

                        <button className={styles.dangerLink} onClick={() => removeConfirmed(g.id)}>Устгах</button>
                      </div>

                      <div className={styles.badges}>
                        <span className={styles.badge}>{g.goal_type}</span>
                        <span className={styles.badge}>{grp}</span>
                        <span className={styles.badge}>
                          {g.time_unit}: {fmtHoursMinutes(t.totalMin)}{g.repeats_enabled ? ` / ${g.repeats_count} удаа` : ""}
                        </span>
                      </div>

                      {g.description ? <div className={styles.desc}>{g.description}</div> : null}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
