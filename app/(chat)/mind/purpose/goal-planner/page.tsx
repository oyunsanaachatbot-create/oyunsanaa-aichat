"use client";

import Link from "next/link";
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

  // optional repeats (if user wants)
  repeats_enabled: boolean;
  repeats_count: number;

  created_at: string;
};

type ConfirmedGoal = DraftGoal & {
  confirmed_at: string;
  duration_group: DurationGroup;
};

type GoalLogMap = Record<string, Record<string, boolean>>; // goalId -> dateISO -> done?

type TabKey = "add" | "organize" | "implement";

const LS_DRAFTS = "oy_goal_drafts_v3";
const LS_CONFIRMED = "oy_goal_confirmed_v3";
const LS_LOGS = "oy_goal_logs_v3";

// migrate from old keys (fixes “орж ирэх бүрт алга” асуудал)
const LEGACY_DRAFT_KEYS = [
  "oy_goal_drafts",
  "oy_goal_drafts_v1",
  "oy_goal_drafts_v2",
  "goal_drafts",
  "goal_items_draft",
];
const LEGACY_CONF_KEYS = [
  "oy_goal_confirmed",
  "oy_goal_confirmed_v1",
  "oy_goal_confirmed_v2",
  "goal_confirmed",
];
const LEGACY_LOG_KEYS = ["oy_goal_logs", "oy_goal_logs_v1", "goal_logs"];

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
  const [y, m, d] = (s || "").split("-").map((x) => Number(x));
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

// ✅ Хэрэглэгч сонгохгүй. “Цэгцлэх” дээр автоматаар ангилна.
function autoDurationGroup(startISO: string, endISO: string): DurationGroup {
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

function formatHhMm(totalMinutes: number) {
  const m = Math.max(0, Math.floor(totalMinutes));
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  if (hh <= 0) return `${mm} мин`;
  if (mm <= 0) return `${hh} цаг`;
  return `${hh} цаг ${mm} мин`;
}

function safeReadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWriteJSON(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function mergeUniqueById<T extends { id: string }>(a: T[], b: T[]) {
  const map = new Map<string, T>();
  for (const x of a) map.set(x.id, x);
  for (const x of b) map.set(x.id, x);
  return Array.from(map.values());
}

function migrateLocalStorage() {
  // if new keys already exist, still merge legacy (so nothing disappears)
  const draftsNow = safeReadJSON<DraftGoal[]>(LS_DRAFTS, []);
  const confNow = safeReadJSON<ConfirmedGoal[]>(LS_CONFIRMED, []);
  const logsNow = safeReadJSON<GoalLogMap>(LS_LOGS, {});

  let draftsLegacy: DraftGoal[] = [];
  for (const k of LEGACY_DRAFT_KEYS) {
    const arr = safeReadJSON<any[]>(k, []);
    if (Array.isArray(arr) && arr.length) draftsLegacy = draftsLegacy.concat(arr as any);
  }

  let confLegacy: any[] = [];
  for (const k of LEGACY_CONF_KEYS) {
    const arr = safeReadJSON<any[]>(k, []);
    if (Array.isArray(arr) && arr.length) confLegacy = confLegacy.concat(arr);
  }

  let logsLegacy: GoalLogMap = {};
  for (const k of LEGACY_LOG_KEYS) {
    const obj = safeReadJSON<GoalLogMap>(k, {});
    if (obj && typeof obj === "object") logsLegacy = { ...logsLegacy, ...obj };
  }

  // normalize legacy drafts a little
  const normalizedDrafts: DraftGoal[] = draftsLegacy
    .map((g: any) => ({
      id: String(g.id || uid()),
      goal_type: (g.goal_type as GoalType) || "Хувийн",
      start_date: (g.start_date as string) || todayISO(),
      end_date: (g.end_date as string) || "",
      goal_text: String(g.goal_text || g.title || "").trim(),
      description: String(g.description || g.desc || "").trim(),
      time_unit: (g.time_unit as TimeUnit) || "Өдөрт",
      time_hours: clampInt(g.time_hours ?? g.hours ?? 0, 0, 999),
      time_minutes: clampInt(g.time_minutes ?? g.minutes ?? 0, 0, 59),
      repeats_enabled: Boolean(g.repeats_enabled ?? false),
      repeats_count: clampInt(g.repeats_count ?? g.repeats ?? 1, 1, 99),
      created_at: String(g.created_at || new Date().toISOString()),
    }))
    .filter((g) => g.goal_text.length > 0);

  // normalize legacy confirmed
  const normalizedConf: ConfirmedGoal[] = confLegacy
    .map((g: any) => {
      const start = (g.start_date as string) || todayISO();
      const end = (g.end_date as string) || "";
      const dur = (g.duration_group as DurationGroup) || autoDurationGroup(start, end);
      return {
        id: String(g.id || uid()),
        goal_type: (g.goal_type as GoalType) || "Хувийн",
        start_date: start,
        end_date: end,
        goal_text: String(g.goal_text || g.title || "").trim(),
        description: String(g.description || g.desc || "").trim(),
        time_unit: (g.time_unit as TimeUnit) || "Өдөрт",
        time_hours: clampInt(g.time_hours ?? g.hours ?? 0, 0, 999),
        time_minutes: clampInt(g.time_minutes ?? g.minutes ?? 0, 0, 59),
        repeats_enabled: Boolean(g.repeats_enabled ?? false),
        repeats_count: clampInt(g.repeats_count ?? g.repeats ?? 1, 1, 99),
        created_at: String(g.created_at || new Date().toISOString()),
        confirmed_at: String(g.confirmed_at || new Date().toISOString()),
        duration_group: dur,
      } as ConfirmedGoal;
    })
    .filter((g) => g.goal_text.length > 0);

  const mergedDrafts = mergeUniqueById(draftsNow, normalizedDrafts);
  const mergedConf = mergeUniqueById(confNow, normalizedConf);
  const mergedLogs = { ...logsLegacy, ...logsNow };

  safeWriteJSON(LS_DRAFTS, mergedDrafts);
  safeWriteJSON(LS_CONFIRMED, mergedConf);
  safeWriteJSON(LS_LOGS, mergedLogs);

  return { mergedDrafts, mergedConf, mergedLogs };
}

export default function GoalPlannerPage() {
  const [tab, setTab] = useState<TabKey>("add");

  // form state
  const [goalType, setGoalType] = useState<GoalType>("Хувийн");
  const [startDate, setStartDate] = useState<string>(todayISO());
  const [endDate, setEndDate] = useState<string>("");
  const [goalText, setGoalText] = useState<string>("");
  const [desc, setDesc] = useState<string>("");

  const [timeUnit, setTimeUnit] = useState<TimeUnit>("Өдөрт");
  const [timeHours, setTimeHours] = useState<number>(0);
  const [timeMinutes, setTimeMinutes] = useState<number>(30);

  const [repeatsEnabled, setRepeatsEnabled] = useState(false);
  const [repeatsCount, setRepeatsCount] = useState<number>(1);

  // data
  const [drafts, setDrafts] = useState<DraftGoal[]>([]);
  const [confirmed, setConfirmed] = useState<ConfirmedGoal[]>([]);
  const [logs, setLogs] = useState<GoalLogMap>({});

  // selection for organize
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  // load + migrate
  useEffect(() => {
    if (typeof window === "undefined") return;
    const { mergedDrafts, mergedConf, mergedLogs } = migrateLocalStorage();

    // sort newest first
    const dSorted = [...mergedDrafts].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    const cSorted = [...mergedConf].sort((a, b) => (a.confirmed_at < b.confirmed_at ? 1 : -1));

    setDrafts(dSorted);
    setConfirmed(cSorted);
    setLogs(mergedLogs);
  }, []);

  // persist
  useEffect(() => {
    if (typeof window === "undefined") return;
    safeWriteJSON(LS_DRAFTS, drafts);
  }, [drafts]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    safeWriteJSON(LS_CONFIRMED, confirmed);
  }, [confirmed]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    safeWriteJSON(LS_LOGS, logs);
  }, [logs]);

  const totalMinutes = useMemo(() => minutesFrom(timeHours, timeMinutes), [timeHours, timeMinutes]);

  const unitPreview = useMemo(() => {
    // only show preview in ADD, not “forcing” meaning for all goals
    const m = totalMinutes;
    if (m <= 0) return "";
    const per = formatHhMm(m);
    if (timeUnit === "Нэг удаа") return `Ойролцоогоор: Нэг удаа ${per}`;
    return `Ойролцоогоор: ${timeUnit} ${per}`;
  }, [timeUnit, totalMinutes]);

  function resetForm() {
    setGoalType("Хувийн");
    setStartDate(todayISO());
    setEndDate("");
    setGoalText("");
    setDesc("");
    setTimeUnit("Өдөрт");
    setTimeHours(0);
    setTimeMinutes(30);
    setRepeatsEnabled(false);
    setRepeatsCount(1);
  }

  function handleSaveDraft() {
    const text = goalText.trim();
    if (!text) return;

    const g: DraftGoal = {
      id: uid(),
      goal_type: goalType,
      start_date: startDate || todayISO(),
      end_date: endDate || "",
      goal_text: text,
      description: desc.trim(),
      time_unit: timeUnit,
      time_hours: clampInt(timeHours, 0, 999),
      time_minutes: clampInt(timeMinutes, 0, 59),
      repeats_enabled: Boolean(repeatsEnabled),
      repeats_count: clampInt(repeatsCount, 1, 99),
      created_at: new Date().toISOString(),
    };

    setDrafts((prev) => [g, ...prev]);
    setSelectedIds((prev) => ({ ...prev, [g.id]: true })); // auto select for organize
    resetForm();
  }

  function deleteDraft(id: string) {
    setDrafts((prev) => prev.filter((x) => x.id !== id));
    setSelectedIds((prev) => {
      const p = { ...prev };
      delete p[id];
      return p;
    });
  }

  const organizeBuckets = useMemo(() => {
    const picked = drafts.filter((d) => selectedIds[d.id]);
    const withGroup = picked.map((d) => ({
      ...d,
      duration_group: autoDurationGroup(d.start_date, d.end_date),
    }));

    const short = withGroup.filter((g) => g.duration_group === "Богино хугацаа");
    const mid = withGroup.filter((g) => g.duration_group === "Дунд хугацаа");
    const long = withGroup.filter((g) => g.duration_group === "Урт хугацаа");

    const sumMinutesByUnit = (arr: typeof withGroup, unit: TimeUnit) =>
      arr
        .filter((x) => x.time_unit === unit)
        .reduce((acc, x) => acc + minutesFrom(x.time_hours, x.time_minutes) * (x.repeats_enabled ? x.repeats_count : 1), 0);

    const totals = {
      day: sumMinutesByUnit(withGroup, "Өдөрт"),
      week: sumMinutesByUnit(withGroup, "7 хоногт"),
      month: sumMinutesByUnit(withGroup, "Сард"),
      once: sumMinutesByUnit(withGroup, "Нэг удаа"),
    };

    return { picked: withGroup, short, mid, long, totals };
  }, [drafts, selectedIds]);

  function handleOrganizeAll() {
    // if nothing selected, select all drafts
    if (!drafts.length) return;
    const anySelected = drafts.some((d) => selectedIds[d.id]);
    if (anySelected) return;
    const all: Record<string, boolean> = {};
    for (const d of drafts) all[d.id] = true;
    setSelectedIds(all);
  }

  function handleConfirmSelected() {
    const picked = organizeBuckets.picked;
    if (!picked.length) return;

    const toConfirm: ConfirmedGoal[] = picked.map((d) => ({
      ...d,
      confirmed_at: new Date().toISOString(),
      duration_group: d.duration_group,
    }));

    // move drafts -> confirmed
    setConfirmed((prev) => [...toConfirm, ...prev]);
    setDrafts((prev) => prev.filter((d) => !selectedIds[d.id]));
    setSelectedIds({});
    setTab("implement");
  }

  // Implement
  const today = todayISO();

  const confirmedByDuration = useMemo(() => {
    const short = confirmed.filter((g) => g.duration_group === "Богино хугацаа");
    const mid = confirmed.filter((g) => g.duration_group === "Дунд хугацаа");
    const long = confirmed.filter((g) => g.duration_group === "Урт хугацаа");
    return { short, mid, long };
  }, [confirmed]);

  const implementSummary = useMemo(() => {
    const all = confirmed;

    const sum = (unit: TimeUnit) =>
      all
        .filter((g) => g.time_unit === unit)
        .reduce((acc, g) => acc + minutesFrom(g.time_hours, g.time_minutes) * (g.repeats_enabled ? g.repeats_count : 1), 0);

    return {
      day: sum("Өдөрт"),
      week: sum("7 хоногт"),
      month: sum("Сард"),
      once: sum("Нэг удаа"),
    };
  }, [confirmed]);

  function toggleDone(goalId: string, dateISO: string) {
    setLogs((prev) => {
      const next = { ...prev };
      const byGoal = { ...(next[goalId] || {}) };
      byGoal[dateISO] = !byGoal[dateISO];
      next[goalId] = byGoal;
      return next;
    });
  }

  function isDone(goalId: string, dateISO: string) {
    return Boolean(logs?.[goalId]?.[dateISO]);
  }

  function deleteConfirmed(goalId: string) {
    setConfirmed((prev) => prev.filter((g) => g.id !== goalId));
    setLogs((prev) => {
      const p = { ...prev };
      delete p[goalId];
      return p;
    });
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>🌿 Зорилго бичих цэгцлэх</h1>
          <div className={styles.subTitle}>Зорилго нэмэх → Цэгцлэх → Хэрэгжүүлэх</div>
        </div>

        <div className={styles.headerActions}>
          <Link className={styles.linkBtn} href="/mind/purpose/goals-motivate">
            ← Буцах
          </Link>
          <Link className={styles.primaryBtn} href="/(chat)">
            💬 Чат руу
          </Link>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tabBtn} ${tab === "add" ? styles.tabBtnActive : ""}`}
          onClick={() => setTab("add")}
          type="button"
        >
          Зорилго нэмэх
        </button>
        <button
          className={`${styles.tabBtn} ${tab === "organize" ? styles.tabBtnActive : ""}`}
          onClick={() => setTab("organize")}
          type="button"
        >
          Цэгцлэх
        </button>
        <button
          className={`${styles.tabBtn} ${tab === "implement" ? styles.tabBtnActive : ""}`}
          onClick={() => setTab("implement")}
          type="button"
        >
          Хэрэгжүүлэх
        </button>
      </div>

      {tab === "add" && (
        <div className={styles.card}>
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
              <label className={styles.label}>Зорилго хэрэгжих хугацаа</label>
              <div className={styles.grid2}>
                <div>
                  <div className={styles.subLabel}>Эхлэх</div>
                  <input className={styles.input} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <div className={styles.subLabel}>Дуусах (заавал биш)</div>
                  <input className={styles.input} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <div className={styles.hint}>
                * “Богино/Дунд/Урт” ангиллыг энд сонгохгүй. <b>Цэгцлэх</b> дээр автоматаар ангилна.
              </div>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Зорилго</label>
            <input
              className={styles.input}
              placeholder="Жишээ: Сард орлогоо 100 сая болгох"
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Тайлбар (сонголтоор)</label>
            <textarea
              className={styles.textarea}
              placeholder="Жишээ: Яагаад энэ зорилго чухал вэ, ямар нөхцөлтэй вэ гэх мэт"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>

          <div className={styles.cardInner}>
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
                  inputMode="numeric"
                  value={timeHours}
                  min={0}
                  max={999}
                  onChange={(e) => setTimeHours(clampInt(e.target.value, 0, 999))}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Минут</label>
                <input
                  className={styles.input}
                  type="number"
                  inputMode="numeric"
                  value={timeMinutes}
                  min={0}
                  max={59}
                  onChange={(e) => setTimeMinutes(clampInt(e.target.value, 0, 59))}
                />
              </div>
            </div>

            <div className={styles.row}>
              <label className={styles.checkboxRow}>
                <input type="checkbox" checked={repeatsEnabled} onChange={(e) => setRepeatsEnabled(e.target.checked)} />
                <span>Давтамж (сонголтоор) — нэгж дотор хэдэн удаа?</span>
              </label>

              {repeatsEnabled && (
                <div className={styles.inlineSmall}>
                  <span className={styles.subLabel}>Хэдэн удаа?</span>
                  <input
                    className={styles.inputSmall}
                    type="number"
                    inputMode="numeric"
                    value={repeatsCount}
                    min={1}
                    max={99}
                    onChange={(e) => setRepeatsCount(clampInt(e.target.value, 1, 99))}
                  />
                </div>
              )}
            </div>

            {unitPreview && <div className={styles.preview}>{unitPreview}</div>}
          </div>

          <div className={styles.actions}>
            <button className={styles.primaryBtn} type="button" onClick={handleSaveDraft}>
              Хадгалах
            </button>
            <button className={styles.ghostBtn} type="button" onClick={() => setTab("organize")}>
              Цэгцлэх рүү
            </button>
          </div>

          <div className={styles.listTitle}>Бичсэн зорилгууд</div>
          {drafts.length === 0 ? (
            <div className={styles.empty}>Одоогоор бичсэн зорилго алга.</div>
          ) : (
            <div className={styles.list}>
              {drafts.map((d) => {
                const mins = minutesFrom(d.time_hours, d.time_minutes) * (d.repeats_enabled ? d.repeats_count : 1);
                return (
                  <div key={d.id} className={styles.listCard}>
                    <label className={styles.pickRow}>
                      <input
                        type="checkbox"
                        checked={Boolean(selectedIds[d.id])}
                        onChange={(e) => setSelectedIds((p) => ({ ...p, [d.id]: e.target.checked }))}
                      />
                      <div className={styles.pickText}>
                        <div className={styles.itemTitle}>{d.goal_text}</div>
                        <div className={styles.meta}>
                          <span className={styles.badge}>{d.goal_type}</span>
                          <span className={styles.metaSep}>•</span>
                          <span>
                            {d.start_date}
                            {d.end_date ? ` → ${d.end_date}` : ""}
                          </span>
                          <span className={styles.metaSep}>•</span>
                          <span>
                            {d.time_unit} {formatHhMm(mins)}
                            {d.repeats_enabled ? ` (×${d.repeats_count})` : ""}
                          </span>
                        </div>
                        {d.description ? <div className={styles.desc}>{d.description}</div> : null}
                      </div>
                    </label>

                    <button className={styles.dangerLink} type="button" onClick={() => deleteDraft(d.id)}>
                      Устгах
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "organize" && (
        <div className={styles.card}>
          <div className={styles.sectionTitle}>Цэгцлэх</div>

          <div className={styles.hint}>
            ✅ Энд хэрэглэгч хугацааны ангилал сонгохгүй. <b>Эхлэх/дуусах огноогоор автоматаар</b> Богино/Дунд/Урт гэж ангилна.
          </div>

          <div className={styles.actions}>
            <button className={styles.ghostBtn} type="button" onClick={handleOrganizeAll}>
              (Хэрвээ сонгосонгүй бол) Бүгдийг сонгох
            </button>
            <button className={styles.primaryBtn} type="button" onClick={() => setTab("add")}>
              + Нэмэх рүү
            </button>
          </div>

          {organizeBuckets.picked.length === 0 ? (
            <div className={styles.empty}>Цэгцлэх зорилго сонгоогүй байна. Доорх “Бичсэн зорилгууд”-оос checkbox-оор сонго.</div>
          ) : (
            <>
              <div className={styles.organizeGrid}>
                <div className={styles.orgCol}>
                  <div className={styles.orgTitle}>Богино хугацаа</div>
                  {organizeBuckets.short.length === 0 ? (
                    <div className={styles.emptySmall}>Алга</div>
                  ) : (
                    organizeBuckets.short.map((g) => <GoalLine key={g.id} g={g} />)
                  )}
                </div>

                <div className={styles.orgCol}>
                  <div className={styles.orgTitle}>Дунд хугацаа</div>
                  {organizeBuckets.mid.length === 0 ? (
                    <div className={styles.emptySmall}>Алга</div>
                  ) : (
                    organizeBuckets.mid.map((g) => <GoalLine key={g.id} g={g} />)
                  )}
                </div>

                <div className={styles.orgCol}>
                  <div className={styles.orgTitle}>Урт хугацаа</div>
                  {organizeBuckets.long.length === 0 ? (
                    <div className={styles.emptySmall}>Алга</div>
                  ) : (
                    organizeBuckets.long.map((g) => <GoalLine key={g.id} g={g} />)
                  )}
                </div>
              </div>

              <div className={styles.summaryBox}>
                <div className={styles.sectionTitleSmall}>Нийт дүгнэлт (сонгосон дээр)</div>
                <div className={styles.summaryRow}>
                  <div>Өдөрт: <b>{formatHhMm(organizeBuckets.totals.day)}</b></div>
                  <div>7 хоногт: <b>{formatHhMm(organizeBuckets.totals.week)}</b></div>
                  <div>Сард: <b>{formatHhMm(organizeBuckets.totals.month)}</b></div>
                  <div>Нэг удаа: <b>{formatHhMm(organizeBuckets.totals.once)}</b></div>
                </div>

                <div className={styles.actions}>
                  <button className={styles.primaryBtn} type="button" onClick={handleConfirmSelected}>
                    Баталгаажуулах (Хэрэгжүүлэх рүү)
                  </button>
                  <button className={styles.ghostBtn} type="button" onClick={() => setTab("add")}>
                    Буцах (Нэмэх)
                  </button>
                </div>
              </div>
            </>
          )}

          <div className={styles.listTitle}>Бичсэн зорилгууд (сонгоод цэгцэлнэ)</div>
          {drafts.length === 0 ? (
            <div className={styles.empty}>Одоогоор бичсэн зорилго алга.</div>
          ) : (
            <div className={styles.list}>
              {drafts.map((d) => {
                const mins = minutesFrom(d.time_hours, d.time_minutes) * (d.repeats_enabled ? d.repeats_count : 1);
                return (
                  <div key={d.id} className={styles.listCard}>
                    <label className={styles.pickRow}>
                      <input
                        type="checkbox"
                        checked={Boolean(selectedIds[d.id])}
                        onChange={(e) => setSelectedIds((p) => ({ ...p, [d.id]: e.target.checked }))}
                      />
                      <div className={styles.pickText}>
                        <div className={styles.itemTitle}>{d.goal_text}</div>
                        <div className={styles.meta}>
                          <span className={styles.badge}>{d.goal_type}</span>
                          <span className={styles.metaSep}>•</span>
                          <span>
                            {d.start_date}
                            {d.end_date ? ` → ${d.end_date}` : ""}
                          </span>
                          <span className={styles.metaSep}>•</span>
                          <span>
                            {d.time_unit} {formatHhMm(mins)}
                            {d.repeats_enabled ? ` (×${d.repeats_count})` : ""}
                          </span>
                        </div>
                        {d.description ? <div className={styles.desc}>{d.description}</div> : null}
                      </div>
                    </label>

                    <button className={styles.dangerLink} type="button" onClick={() => deleteDraft(d.id)}>
                      Устгах
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "implement" && (
        <div className={styles.card}>
          <div className={styles.sectionTitle}>Хэрэгжүүлэх</div>

          {confirmed.length === 0 ? (
            <div className={styles.empty}>
              Баталгаажсан зорилго алга байна. <b>Цэгцлэх</b> таб дээр сонгоод “Баталгаажуулах” дар.
            </div>
          ) : (
            <>
              <div className={styles.summaryBox}>
                <div className={styles.sectionTitleSmall}>Нийт дүгнэлт (баталгаажсан дээр)</div>
                <div className={styles.summaryRow}>
                  <div>Өдөрт: <b>{formatHhMm(implementSummary.day)}</b></div>
                  <div>7 хоногт: <b>{formatHhMm(implementSummary.week)}</b></div>
                  <div>Сард: <b>{formatHhMm(implementSummary.month)}</b></div>
                  <div>Нэг удаа: <b>{formatHhMm(implementSummary.once)}</b></div>
                </div>
              </div>

              <div className={styles.organizeGrid}>
                <div className={styles.orgCol}>
                  <div className={styles.orgTitle}>Богино хугацаа</div>
                  {confirmedByDuration.short.length === 0 ? (
                    <div className={styles.emptySmall}>Алга</div>
                  ) : (
                    confirmedByDuration.short.map((g) => (
                      <ConfirmedCard
                        key={g.id}
                        g={g}
                        today={today}
                        done={isDone(g.id, today)}
                        onToggle={() => toggleDone(g.id, today)}
                        onDelete={() => deleteConfirmed(g.id)}
                      />
                    ))
                  )}
                </div>

                <div className={styles.orgCol}>
                  <div className={styles.orgTitle}>Дунд хугацаа</div>
                  {confirmedByDuration.mid.length === 0 ? (
                    <div className={styles.emptySmall}>Алга</div>
                  ) : (
                    confirmedByDuration.mid.map((g) => (
                      <ConfirmedCard
                        key={g.id}
                        g={g}
                        today={today}
                        done={isDone(g.id, today)}
                        onToggle={() => toggleDone(g.id, today)}
                        onDelete={() => deleteConfirmed(g.id)}
                      />
                    ))
                  )}
                </div>

                <div className={styles.orgCol}>
                  <div className={styles.orgTitle}>Урт хугацаа</div>
                  {confirmedByDuration.long.length === 0 ? (
                    <div className={styles.emptySmall}>Алга</div>
                  ) : (
                    confirmedByDuration.long.map((g) => (
                      <ConfirmedCard
                        key={g.id}
                        g={g}
                        today={today}
                        done={isDone(g.id, today)}
                        onToggle={() => toggleDone(g.id, today)}
                        onDelete={() => deleteConfirmed(g.id)}
                      />
                    ))
                  )}
                </div>
              </div>

              <div className={styles.actions}>
                <button className={styles.ghostBtn} type="button" onClick={() => setTab("organize")}>
                  ← Цэгцлэх рүү
                </button>
                <button className={styles.primaryBtn} type="button" onClick={() => setTab("add")}>
                  + Шинэ зорилго нэмэх
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function GoalLine({ g }: { g: DraftGoal & { duration_group: DurationGroup } }) {
  const mins = minutesFrom(g.time_hours, g.time_minutes) * (g.repeats_enabled ? g.repeats_count : 1);
  return (
    <div className={styles.goalLine}>
      <div className={styles.itemTitleSmall}>{g.goal_text}</div>
      <div className={styles.metaSmall}>
        <span className={styles.badge}>{g.goal_type}</span>
        <span className={styles.metaSep}>•</span>
        <span>
          {g.start_date}
          {g.end_date ? ` → ${g.end_date}` : ""}
        </span>
        <span className={styles.metaSep}>•</span>
        <span>
          {g.time_unit} {formatHhMm(mins)}
          {g.repeats_enabled ? ` (×${g.repeats_count})` : ""}
        </span>
      </div>
      {g.description ? <div className={styles.desc}>{g.description}</div> : null}
    </div>
  );
}

function ConfirmedCard({
  g,
  today,
  done,
  onToggle,
  onDelete,
}: {
  g: ConfirmedGoal;
  today: string;
  done: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const mins = minutesFrom(g.time_hours, g.time_minutes) * (g.repeats_enabled ? g.repeats_count : 1);

  return (
    <div className={styles.confirmCard}>
      <div className={styles.confirmTop}>
        <div>
          <div className={styles.itemTitleSmall}>{g.goal_text}</div>
          <div className={styles.metaSmall}>
            <span className={styles.badge}>{g.goal_type}</span>
            <span className={styles.metaSep}>•</span>
            <span>
              {g.start_date}
              {g.end_date ? ` → ${g.end_date}` : ""}
            </span>
            <span className={styles.metaSep}>•</span>
            <span>
              {g.time_unit} {formatHhMm(mins)}
              {g.repeats_enabled ? ` (×${g.repeats_count})` : ""}
            </span>
          </div>
          {g.description ? <div className={styles.desc}>{g.description}</div> : null}
        </div>

        <button className={styles.dangerLink} type="button" onClick={onDelete}>
          Устгах
        </button>
      </div>

      <div className={styles.implementRow}>
        <div className={styles.subLabel}>Өнөөдөр ({today})</div>
        <button className={done ? styles.doneBtn : styles.todoBtn} type="button" onClick={onToggle}>
          {done ? "✅ Хийсэн" : "⬜ Хийх"}
        </button>
      </div>
    </div>
  );
}
