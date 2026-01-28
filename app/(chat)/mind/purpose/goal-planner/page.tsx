"use client";

import { useMemo, useState } from "react";
import styles from "./cbt.module.css";

type GoalType = "Хувийн" | "Ажил" | "Гэр бүл" | "Эрүүл мэнд" | "Санхүү" | "Сурч хөгжих" | "Бусад";
type TimeUnit = "Өдөрт" | "7 хоногт" | "Сард" | "Жилд";

type DraftGoal = {
  id: string;
  goal_type: GoalType;
  start_date: string; // yyyy-mm-dd
  end_date: string;   // yyyy-mm-dd
  goal_text: string;
  description: string;

  time_unit: TimeUnit;
  time_hours: number;
  time_minutes: number;
};

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

function clampInt(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function minutesToHM(totalMinutes: number) {
  const m = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h <= 0) return `${mm} мин`;
  if (mm === 0) return `${h} цаг`;
  return `${h} цаг ${mm} мин`;
}

// Draft дээрх (unit) хугацааг өдөр/7хоног/сар болгон ойролцоолох
function normalizeToDayWeekMonth(goal: DraftGoal) {
  const totalMin = goal.time_hours * 60 + goal.time_minutes;

  let perDay = 0;
  if (goal.time_unit === "Өдөрт") perDay = totalMin;
  if (goal.time_unit === "7 хоногт") perDay = totalMin / 7;
  if (goal.time_unit === "Сард") perDay = totalMin / 30;
  if (goal.time_unit === "Жилд") perDay = totalMin / 365;

  const day = perDay;
  const week = perDay * 7;
  const month = perDay * 30;

  return { day, week, month };
}

export default function GoalPlannerPage() {
  // ====== FORM STATE ======
  const [goalType, setGoalType] = useState<GoalType>("Хувийн");
  const [startDate, setStartDate] = useState<string>(todayISO());
  const [endDate, setEndDate] = useState<string>(todayISO());
  const [goalText, setGoalText] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  // “Хэр их цаг гаргаж чадах вэ?” (заавал 1 удаа минут гэж асуухгүй — нийт цаг/мин л асууна)
  const [timeUnit, setTimeUnit] = useState<TimeUnit>("Өдөрт");
  const [timeHours, setTimeHours] = useState<number>(0);
  const [timeMinutes, setTimeMinutes] = useState<number>(30);

  // ====== LIST STATE ======
  const [drafts, setDrafts] = useState<DraftGoal[]>([]);

  // ====== ORGANIZE VIEW ======
  const [showOrganize, setShowOrganize] = useState(false);

  const totals = useMemo(() => {
    let day = 0, week = 0, month = 0;
    for (const g of drafts) {
      const n = normalizeToDayWeekMonth(g);
      day += n.day;
      week += n.week;
      month += n.month;
    }
    return { day, week, month };
  }, [drafts]);

  function addDraft() {
    const text = goalText.trim();
    if (!text) return;

    const g: DraftGoal = {
      id: uid(),
      goal_type: goalType,
      start_date: startDate,
      end_date: endDate,
      goal_text: text,
      description: description.trim(),
      time_unit: timeUnit,
      time_hours: clampInt(timeHours, 0, 24),
      time_minutes: clampInt(timeMinutes, 0, 59),
    };

    // ✅ “Дараагийн зорилго” = хадгалаад доороо ШУУД нэмэгдэнэ + form дахин шинэ болно
    setDrafts((p) => [g, ...p]);
    setGoalText("");
    setDescription("");
    setTimeHours(0);
    setTimeMinutes(30);
    setTimeUnit("Өдөрт");
    setShowOrganize(false);
  }

  function removeDraft(id: string) {
    setDrafts((p) => p.filter((x) => x.id !== id));
  }

  function groupLabelByDuration(g: DraftGoal) {
    // хугацаагаар ангилах (simple)
    const s = new Date(g.start_date).getTime();
    const e = new Date(g.end_date).getTime();
    if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) return "Тодорхойгүй";
    const days = Math.round((e - s) / (1000 * 60 * 60 * 24));
    if (days <= 30) return "Богино хугацаа";
    if (days <= 180) return "Дунд хугацаа";
    return "Урт хугацаа";
  }

  // нэмэлт санал: ангилал
  function extraBucketSuggestion() {
    // зөвхөн UI дээр тайлбар маягаар харуулах (заавал биш)
    return "Нэмэлтээр: (1) Эрчим/хэцүү (амархан–хэцүү) (2) Байршил (гэр/ажил/гадаа) (3) Хамаарал (ганцаараа/хүмүүстэй) гэж ангилбал хэрэглэгчид амар байдаг.";
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.titleRow}>
        <div aria-hidden>🧩</div>
        <h1 className={styles.title}>Зорилго бичих</h1>
      </div>

      <div className={styles.card}>
        <div className={styles.stack}>
          {/* 1) Зорилгын төрөл */}
          <div>
            <label className={styles.label}>Зорилгын төрөл</label>
            <select
              className={styles.select}
              value={goalType}
              onChange={(e) => setGoalType(e.target.value as GoalType)}
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

          {/* 3) Хугацаа */}
          <div className={styles.row2}>
            <div>
              <label className={styles.label}>Эхлэх өдөр</label>
              <input
                className={styles.input}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className={styles.label}>Дуусах өдөр</label>
              <input
                className={styles.input}
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* 4) Зорилго бичих */}
          <div>
            <label className={styles.label}>Зорилго (товч, тодорхой)</label>
            <input
              className={styles.input}
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              placeholder='Жишээ: Сард орлогоо 100 сая болгох'
            />
          </div>

          {/* 5) Тайлбар */}
          <div>
            <label className={styles.label}>Тайлбар (сонголтоор)</label>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Хэрэгцээтэй бол 1–2 өгүүлбэрээр"
            />
          </div>

          {/* 6) Нийт цаг (unit дээр) */}
          <div className={styles.row2}>
            <div>
              <label className={styles.label}>Хугацааны нэгж</label>
              <select
                className={styles.select}
                value={timeUnit}
                onChange={(e) => setTimeUnit(e.target.value as TimeUnit)}
              >
                <option value="Өдөрт">Өдөрт</option>
                <option value="7 хоногт">7 хоногт</option>
                <option value="Сард">Сард</option>
                <option value="Жилд">Жилд</option>
              </select>
            </div>
            <div className={styles.row2}>
              <div>
                <label className={styles.label}>Цаг</label>
                <input
                  className={styles.input}
                  inputMode="numeric"
                  value={String(timeHours)}
                  onChange={(e) => setTimeHours(clampInt(Number(e.target.value), 0, 24))}
                />
              </div>
              <div>
                <label className={styles.label}>Мин</label>
                <input
                  className={styles.input}
                  inputMode="numeric"
                  value={String(timeMinutes)}
                  onChange={(e) => setTimeMinutes(clampInt(Number(e.target.value), 0, 59))}
                />
              </div>
            </div>
          </div>

          <div className={styles.btnRow}>
            <button className={styles.btnPrimary} onClick={addDraft}>
              Дараагийн зорилго
            </button>

            <button
              className={styles.btnGhost}
              onClick={() => setShowOrganize(true)}
              disabled={drafts.length === 0}
              title={drafts.length === 0 ? "Эхлээд зорилго нэм" : "Цэгцлэх"}
            >
              Цэгцлэх
            </button>
          </div>
        </div>
      </div>

      <div className={styles.hr} />

      {/* Доороо шууд гарна */}
      <div className={styles.card}>
        <div className={styles.stack}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontWeight: 650 }}>Бичсэн зорилгууд</div>
            <div className={styles.muted}>{drafts.length} ширхэг</div>
          </div>

          <div className={styles.list}>
            {drafts.length === 0 ? (
              <div className={styles.muted}>Одоогоор зорилго алга. Дээрээс “Дараагийн зорилго” дар.</div>
            ) : (
              drafts.map((g) => (
                <div key={g.id} className={styles.item}>
                  <div className={styles.itemTop}>
                    <h3 className={styles.itemTitle}>{g.goal_text}</h3>
                    <button className={styles.danger} onClick={() => removeDraft(g.id)}>
                      Устгах
                    </button>
                  </div>

                  <div className={styles.muted}>
                    {g.goal_type} • {g.start_date} → {g.end_date}
                  </div>

                  {g.description ? <div className={styles.muted}>{g.description}</div> : null}

                  <div className={styles.muted}>
                    {g.time_unit}: {minutesToHM(g.time_hours * 60 + g.time_minutes)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* “Зорилго цэгцлэх” доод талд тогтмол */}
          <div className={styles.btnRow}>
            <button
              className={styles.btnPrimary}
              onClick={() => setShowOrganize(true)}
              disabled={drafts.length === 0}
            >
              Зорилго цэгцлэх
            </button>
          </div>
        </div>
      </div>

      {/* Цэгцлэх хэсэг */}
      {showOrganize ? (
        <>
          <div className={styles.hr} />
          <div className={styles.card}>
            <div className={styles.stack}>
              <div style={{ fontWeight: 650 }}>Цэгцэлсэн харагдац</div>
              <div className={styles.muted}>
                Хугацаагаар: Богино / Дунд / Урт. {extraBucketSuggestion()}
              </div>

              <div className={styles.item}>
                <div style={{ fontWeight: 650 }}>Нийт цагийн тооцоо (ойролцоолол)</div>
                <div className={styles.muted}>Өдөрт: {minutesToHM(totals.day)}</div>
                <div className={styles.muted}>7 хоногт: {minutesToHM(totals.week)}</div>
                <div className={styles.muted}>Сард: {minutesToHM(totals.month)}</div>
              </div>

              <div className={styles.list}>
                {drafts.map((g) => (
                  <div key={g.id} className={styles.item}>
                    <div className={styles.itemTop}>
                      <h3 className={styles.itemTitle}>{g.goal_text}</h3>
                      <div className={styles.muted}>{groupLabelByDuration(g)}</div>
                    </div>
                    <div className={styles.muted}>
                      {g.goal_type} • {g.start_date} → {g.end_date}
                    </div>
                    <div className={styles.muted}>
                      {g.time_unit}: {minutesToHM(g.time_hours * 60 + g.time_minutes)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Хэрэгжүүлэлт одоохондоо дараагийн алхам: UI-г нь дараагийн commit дээр тусад нь хийнэ */}
              <div className={styles.btnRow}>
                <button className={styles.btnGhost} onClick={() => setShowOrganize(false)}>
                  Буцах
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
