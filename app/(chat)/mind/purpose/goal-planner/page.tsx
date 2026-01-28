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
  duration_group: DurationGroup;

  start_date: string; // yyyy-mm-dd
  end_date: string; // yyyy-mm-dd or ""

  goal_text: string;
  description: string;

  // time budget (TOTAL per unit)
  time_unit: TimeUnit;
  time_hours: number;
  time_minutes: number;

  // optional repeats (how many times inside the selected unit)
  repeats_enabled: boolean;
  repeats_count: number;

  created_at: string;
};

type ConfirmedGoal = DraftGoal & {
  confirmed_at: string;
};

type GoalLogMap = Record<string, Record<string, boolean>>; // dateISO -> {goalId: boolean}

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
  const x = Number.isFinite(Number(n)) ? Math.floor(Number(n)) : min;
  return Math.max(min, Math.min(max, x));
}

function minutesFrom(hours: number, minutes: number) {
  return clampInt(hours, 0, 999) * 60 + clampInt(minutes, 0, 59);
}

function calcTotalsPerPeriod(goal: DraftGoal) {
  // Base: total minutes per selected unit (optionally divided by repeats, but repeats is “how many times within the unit”
  // We treat repeats as: user plans to do it N times within the unit => still the SAME total time per unit (their input is total).
  // So repeats only affects UI, not totals.
  const totalMin = minutesFrom(goal.time_hours, goal.time_minutes);

  // Convert totals to daily/weekly/monthly minutes
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

function fmtHoursMinutes(totalMinutes: number) {
  const m = Math.round(totalMinutes);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h <= 0) return `${mm} мин`;
  if (mm === 0) return `${h} цаг`;
  return `${h} цаг ${mm} мин`;
}

const LS_DRAFTS = "oy_goal_drafts_v2";
const LS_CONFIRMED = "oy_goal_confirmed_v2";
const LS_LOGS = "oy_goal_logs_v2";

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

type TabKey = "implement" | "add" | "organize";

export default function GoalPlannerPage() {
  const [drafts, setDrafts] = useState<DraftGoal[]>([]);
  const [confirmed, setConfirmed] = useState<ConfirmedGoal[]>([]);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<GoalLogMap>({});
  const [tab, setTab] = useState<TabKey>("add");

  // Form state
  const [goalType, setGoalType] = useState<GoalType>("Хувийн");
  const [durationGroup, setDurationGroup] = useState<DurationGroup>("Урт хугацаа");
  const [startDate, setStartDate] = useState<string>(todayISO());
  const [endDate, setEndDate] = useState<string>("");
  const [goalText, setGoalText] = useState<string>("");
  const [desc, setDesc] = useState<string>("");

  const [timeUnit, setTimeUnit] = useState<TimeUnit>("Өдөрт");
  const [timeHours, setTimeHours] = useState<number>(0);
  const [timeMins, setTimeMins] = useState<number>(30);

  const [repeatsEnabled, setRepeatsEnabled] = useState<boolean>(false);
  const [repeatsCount, setRepeatsCount] = useState<number>(1);

  // Load from localStorage
  useEffect(() => {
    const d = loadJson<DraftGoal[]>(LS_DRAFTS, []);
    const c = loadJson<ConfirmedGoal[]>(LS_CONFIRMED, []);
    const l = loadJson<GoalLogMap>(LS_LOGS, {});
    setDrafts(d);
    setConfirmed(c);
    setLogs(l);

    // If confirmed exists -> open implement by default
    if (c.length > 0) setTab("implement");
    else setTab("add");

    // Preselect all drafts
    const sel: Record<string, boolean> = {};
    d.forEach((x) => (sel[x.id] = true));
    setSelectedIds(sel);
  }, []);

  useEffect(() => saveJson(LS_DRAFTS, drafts), [drafts]);
  useEffect(() => saveJson(LS_CONFIRMED, confirmed), [confirmed]);
  useEffect(() => saveJson(LS_LOGS, logs), [logs]);

  const today = todayISO();

  const todayLog = logs[today] || {};
  const doneCountToday = useMemo(() => {
    if (confirmed.length === 0) return 0;
    return confirmed.reduce((acc, g) => acc + (todayLog[g.id] ? 1 : 0), 0);
  }, [confirmed, todayLog]);

  const progressPct = useMemo(() => {
    if (confirmed.length === 0) return 0;
    return Math.round((doneCountToday / confirmed.length) * 100);
  }, [doneCountToday, confirmed.length]);

  const selectedDrafts = useMemo(() => {
    return drafts.filter((d) => selectedIds[d.id]);
  }, [drafts, selectedIds]);

  const organizeSummary = useMemo(() => {
    // totals from selected drafts only
    let day = 0;
    let week = 0;
    let month = 0;
    let oneTime = 0;

    for (const g of selectedDrafts) {
      const t = calcTotalsPerPeriod(g);
      day += t.perDay;
      week += t.perWeek;
      month += t.perMonth;
      oneTime += t.oneTime;
    }

    // group lists
    const shortList: DraftGoal[] = [];
    const midList: DraftGoal[] = [];
    const longList: DraftGoal[] = [];

    for (const g of selectedDrafts) {
      if (g.duration_group === "Богино хугацаа") shortList.push(g);
      else if (g.duration_group === "Дунд хугацаа") midList.push(g);
      else longList.push(g);
    }

    return { day, week, month, oneTime, shortList, midList, longList };
  }, [selectedDrafts]);

  function resetForm() {
    setGoalType("Хувийн");
    setDurationGroup("Урт хугацаа");
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
    const newItem: DraftGoal = {
      id: uid(),
      goal_type: goalType,
      duration_group: durationGroup,
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

    setDrafts((prev) => [newItem, ...prev]);

    // auto-select it
    setSelectedIds((prev) => ({ ...prev, [newItem.id]: true }));

    // Keep on add tab and reset to allow new input
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

  function confirmSelectedToImplement() {
    if (selectedDrafts.length === 0) {
      alert("Цэгцлэх хэсэг дээр сонгосон зорилго алга.");
      return;
    }

    const now = new Date().toISOString();
    const toConfirm: ConfirmedGoal[] = selectedDrafts.map((x) => ({
      ...x,
      confirmed_at: now,
    }));

    // merge: keep existing confirmed + new ones (avoid duplicates by id)
    const existing = new Map(confirmed.map((c) => [c.id, c]));
    for (const g of toConfirm) existing.set(g.id, g);

    setConfirmed(Array.from(existing.values()));

    // optional: remove confirmed items from drafts
    const confirmedIds = new Set(toConfirm.map((x) => x.id));
    setDrafts((prev) => prev.filter((x) => !confirmedIds.has(x.id)));

    setSelectedIds((prev) => {
      const n = { ...prev };
      toConfirm.forEach((x) => delete n[x.id]);
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
    if (!confirm("Баталгаажсан зорилгыг устгавал хэрэгжүүлэлтийн тэмдэглэлтэйгээ хамт алга болно. Устгах уу?"))
      return;

    setConfirmed((prev) => prev.filter((x) => x.id !== goalId));
    setLogs((prev) => {
      const next: GoalLogMap = { ...prev };
      // remove across all dates
      for (const date of Object.keys(next)) {
        if (next[date] && goalId in next[date]) {
          const copy = { ...next[date] };
          delete copy[goalId];
          next[date] = copy;
        }
      }
      return next;
    });
  }

  const headerTitle = "🌿 Зорилго бичих цэгцлэх";

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>{headerTitle}</h1>

        <div className={styles.tabs}>
          <button
            className={`${styles.tabBtn} ${tab === "add" ? styles.tabBtnActive : ""}`}
            onClick={() => setTab("add")}
          >
            Зорилго нэмэх
          </button>
          <button
            className={`${styles.tabBtn} ${tab === "organize" ? styles.tabBtnActive : ""}`}
            onClick={() => setTab("organize")}
          >
            Цэгцлэх
          </button>
          <button
            className={`${styles.tabBtn} ${tab === "implement" ? styles.tabBtnActive : ""}`}
            onClick={() => setTab("implement")}
          >
            Хэрэгжүүлэх
          </button>
        </div>
      </div>

      {tab === "implement" && (
        <section className={styles.card}>
          <div className={styles.sectionTitle}>Өнөөдрийн хэрэгжүүлэлт</div>

          {confirmed.length === 0 ? (
            <div className={styles.muted}>
              Одоогоор баталгаажсан зорилго алга. <b>Цэгцлэх</b> дээрээс сонгоод <b>Баталгаажуулах</b> дарна уу.
            </div>
          ) : (
            <>
              <div className={styles.progressRow}>
                <div className={styles.progressBig}>{progressPct}%</div>
                <div className={styles.progressText}>
                  Өнөөдөр: {doneCountToday}/{confirmed.length} зорилго гүйцэтгэсэн
                </div>
              </div>

              <div className={styles.list}>
                {confirmed.map((g) => (
                  <div className={styles.listCard} key={g.id}>
                    <div className={styles.listTop}>
                      <label className={styles.checkRow}>
                        <input
                          type="checkbox"
                          checked={!!todayLog[g.id]}
                          onChange={(e) => toggleTodayDone(g.id, e.target.checked)}
                        />
                        <span className={styles.goalName}>{g.goal_text}</span>
                      </label>

                      <button className={styles.linkDanger} onClick={() => removeConfirmed(g.id)}>
                        Устгах
                      </button>
                    </div>

                    <div className={styles.meta}>
                      <span className={styles.badge}>{g.goal_type}</span>
                      <span className={styles.badge}>{g.duration_group}</span>
                      <span className={styles.badge}>
                        {g.time_unit}: {fmtHoursMinutes(minutesFrom(g.time_hours, g.time_minutes))}
                        {g.repeats_enabled ? ` / ${g.repeats_count} удаа` : ""}
                      </span>
                    </div>

                    {g.description ? <div className={styles.desc}>{g.description}</div> : null}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {tab === "add" && (
        <section className={styles.card}>
          <div className={styles.sectionTitle}>Зорилго нэмэх</div>

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
              <select
                className={styles.input}
                value={durationGroup}
                onChange={(e) => setDurationGroup(e.target.value as DurationGroup)}
              >
                <option>Богино хугацаа</option>
                <option>Дунд хугацаа</option>
                <option>Урт хугацаа</option>
              </select>
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
              placeholder="Жишээ: Яагаад энэ зорилго чухал вэ, ямар нөхцөлтэй вэ гэх мэт"
              rows={3}
            />
          </div>

          <div className={styles.organizeCard}>
            <div className={styles.sectionTitleSmall}>Цагийн төлөвлөгөө</div>

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

            <div className={styles.inlineRow}>
              <label className={styles.checkRow}>
                <input type="checkbox" checked={repeatsEnabled} onChange={(e) => setRepeatsEnabled(e.target.checked)} />
                <span>Давтамж (сонголтоор) — нэгж дотор хэдэн удаа?</span>
              </label>

              {repeatsEnabled ? (
                <div className={styles.repeatBox}>
                  <span className={styles.muted}>Хэдэн удаа:</span>
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

            <div className={styles.muted}>
              Ойролцоогоор:{" "}
              <b>
                {timeUnit} {fmtHoursMinutes(minutesFrom(timeHours, timeMins))}
                {repeatsEnabled ? ` / ${repeatsCount} удаа` : ""}
              </b>
            </div>
          </div>

          <div className={styles.btnRow}>
            <button className={styles.primaryBtn} onClick={saveDraft}>
              Хадгалах
            </button>
            <button className={styles.secondaryBtn} onClick={() => setTab("organize")}>
              Цэгцлэх рүү
            </button>
          </div>

          <div className={styles.sectionDivider} />

          <div className={styles.sectionTitle}>Бичсэн зорилгууд</div>
          {drafts.length === 0 ? (
            <div className={styles.muted}>Одоогоор бичсэн зорилго алга.</div>
          ) : (
            <div className={styles.list}>
              {drafts.map((g) => {
                const t = calcTotalsPerPeriod(g);
                return (
                  <div className={styles.listCard} key={g.id}>
                    <div className={styles.listTop}>
                      <div className={styles.goalName}>{g.goal_text}</div>
                      <button className={styles.linkDanger} onClick={() => removeDraft(g.id)}>
                        Устгах
                      </button>
                    </div>

                    <div className={styles.meta}>
                      <span className={styles.badge}>{g.goal_type}</span>
                      <span className={styles.badge}>{g.duration_group}</span>
                      <span className={styles.badge}>
                        {g.time_unit}: {fmtHoursMinutes(t.totalMin)}
                        {g.repeats_enabled ? ` / ${g.repeats_count} удаа` : ""}
                      </span>
                    </div>

                    {g.description ? <div className={styles.desc}>{g.description}</div> : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {tab === "organize" && (
        <section className={styles.card}>
          <div className={styles.sectionTitle}>Цэгцлэх</div>

          {drafts.length === 0 ? (
            <div className={styles.muted}>
              Цэгцлэх зорилго алга. <b>Зорилго нэмэх</b> дээрээс “Хадгалах” дарж нэмнэ үү.
            </div>
          ) : (
            <>
              <div className={styles.muted}>
                Эндээс баталгаажуулах зорилгуудаа сонгоод, нийт ачааллаа харж байгаад <b>Баталгаажуулах</b> дарна.
              </div>

              <div className={styles.list}>
                {drafts.map((g) => {
                  const checked = !!selectedIds[g.id];
                  const t = calcTotalsPerPeriod(g);

                  return (
                    <div className={styles.listCard} key={g.id}>
                      <div className={styles.listTop}>
                        <label className={styles.checkRow}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => setSelectedIds((p) => ({ ...p, [g.id]: e.target.checked }))}
                          />
                          <span className={styles.goalName}>{g.goal_text}</span>
                        </label>

                        <button className={styles.linkDanger} onClick={() => removeDraft(g.id)}>
                          Устгах
                        </button>
                      </div>

                      <div className={styles.meta}>
                        <span className={styles.badge}>{g.goal_type}</span>
                        <span className={styles.badge}>{g.duration_group}</span>
                        <span className={styles.badge}>
                          {g.time_unit}: {fmtHoursMinutes(t.totalMin)}
                          {g.repeats_enabled ? ` / ${g.repeats_count} удаа` : ""}
                        </span>
                      </div>

                      <div className={styles.miniTotals}>
                        {g.time_unit === "Нэг удаа" ? (
                          <span className={styles.muted}>Нэг удаагийн ажил: {fmtHoursMinutes(t.oneTime)}</span>
                        ) : (
                          <>
                            <span>Өдөрт: <b>{fmtHoursMinutes(t.perDay)}</b></span>
                            <span>7 хоногт: <b>{fmtHoursMinutes(t.perWeek)}</b></span>
                            <span>Сард: <b>{fmtHoursMinutes(t.perMonth)}</b></span>
                          </>
                        )}
                      </div>

                      {g.description ? <div className={styles.desc}>{g.description}</div> : null}
                    </div>
                  );
                })}
              </div>

              <div className={styles.organizeCard}>
                <div className={styles.sectionTitleSmall}>Цэгцэлсэн дүн (сонгосон зорилгууд)</div>

                <div className={styles.summaryGrid}>
                  <div className={styles.summaryBox}>
                    <div className={styles.summaryLabel}>Өдөрт нийт</div>
                    <div className={styles.summaryValue}>{fmtHoursMinutes(organizeSummary.day)}</div>
                  </div>
                  <div className={styles.summaryBox}>
                    <div className={styles.summaryLabel}>7 хоногт нийт</div>
                    <div className={styles.summaryValue}>{fmtHoursMinutes(organizeSummary.week)}</div>
                  </div>
                  <div className={styles.summaryBox}>
                    <div className={styles.summaryLabel}>Сард нийт</div>
                    <div className={styles.summaryValue}>{fmtHoursMinutes(organizeSummary.month)}</div>
                  </div>
                  <div className={styles.summaryBox}>
                    <div className={styles.summaryLabel}>Нэг удаагийн (тусдаа)</div>
                    <div className={styles.summaryValue}>{fmtHoursMinutes(organizeSummary.oneTime)}</div>
                  </div>
                </div>

                <div className={styles.groupBlock}>
                  <div className={styles.groupTitle}>Богино хугацаа</div>
                  {organizeSummary.shortList.length === 0 ? (
                    <div className={styles.muted}>Сонгосон зорилго алга.</div>
                  ) : (
                    <ul className={styles.ul}>
                      {organizeSummary.shortList.map((g) => (
                        <li key={g.id}>
                          <b>{g.goal_text}</b> — {g.goal_type}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className={styles.groupBlock}>
                  <div className={styles.groupTitle}>Дунд хугацаа</div>
                  {organizeSummary.midList.length === 0 ? (
                    <div className={styles.muted}>Сонгосон зорилго алга.</div>
                  ) : (
                    <ul className={styles.ul}>
                      {organizeSummary.midList.map((g) => (
                        <li key={g.id}>
                          <b>{g.goal_text}</b> — {g.goal_type}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className={styles.groupBlock}>
                  <div className={styles.groupTitle}>Урт хугацаа</div>
                  {organizeSummary.longList.length === 0 ? (
                    <div className={styles.muted}>Сонгосон зорилго алга.</div>
                  ) : (
                    <ul className={styles.ul}>
                      {organizeSummary.longList.map((g) => (
                        <li key={g.id}>
                          <b>{g.goal_text}</b> — {g.goal_type}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className={styles.btnRow}>
                  <button className={styles.primaryBtn} onClick={confirmSelectedToImplement}>
                    Баталгаажуулах (Хэрэгжүүлэх рүү)
                  </button>
                  <button className={styles.secondaryBtn} onClick={() => setTab("add")}>
                    Буцах (нэмэх)
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
