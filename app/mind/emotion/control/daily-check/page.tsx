"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import styles from "./cbt.module.css";

type Choice = { id: string; label: string; emoji?: string };
type Step =
  | { id: string; type: "single"; title: string; desc?: string; choices: Choice[] }
  | { id: string; type: "multi"; title: string; desc?: string; maxPick: number; choices: Choice[] };

type Level = "Green" | "Yellow" | "Orange" | "Red";

type TrendItem = { check_date: string; score: number; level: Level };
type Result = { score: number; level: Level; dateISO: string; focus?: string; feelings?: string };

const STORAGE_RUNS = "oy_daily_check_runs_v1";
const STORAGE_LAST = "oy_daily_check_last_answers_v1";

function dateToISO(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const STEPS: Step[] = [
  {
    id: "mood",
    type: "single",
    title: "Өнөөдөр сэтгэл санаа чинь ямар байна вэ?",
    desc: "Дотроосоо хамгийн ойр мэдрэмжээ сонго.",
    choices: [
      { id: "m5", emoji: "😄", label: "Баяртай" },
      { id: "m4", emoji: "🙂", label: "Сайн" },
      { id: "m3", emoji: "😐", label: "Хэвийн" },
      { id: "m2", emoji: "😟", label: "Санаа зовсон" },
      { id: "m1", emoji: "😢", label: "Гунигтай" },
    ],
  },
  {
    id: "thought",
    type: "single",
    title: "Өнөөдөр толгойд чинь хамгийн их эргэлдсэн зүйл?",
    desc: "Зөв/буруу байхгүй — ажиглалт.",
    choices: [
      { id: "t5", emoji: "🌱", label: "Ирээдүй · амьдрал" },
      { id: "t2", emoji: "💼", label: "Ажил · сургууль" },
      { id: "t4", emoji: "🏠", label: "Гэр бүл · гэр" },
      { id: "t1", emoji: "👤", label: "Хүмүүс · харилцаа" },
      { id: "t3", emoji: "💰", label: "Мөнгө · санхүү" },
    ],
  },
  {
    id: "impact",
    type: "single",
    title: "Тэр бодол сэтгэл санаанд чинь хэрхэн нөлөөлсөн бэ?",
    desc: "Эерэг ч байж болно, сөрөг ч байж болно.",
    choices: [
      { id: "i1", emoji: "⬆️", label: "Маш эерэг нөлөөлсөн" },
      { id: "i2", emoji: "↗️", label: "Бага зэрэг эерэг нөлөөлсөн" },
      { id: "i3", emoji: "➖", label: "Нөлөөгүй" },
      { id: "i4", emoji: "↘️", label: "Бага зэрэг сөрөг нөлөөлсөн" },
      { id: "i5", emoji: "⬇️", label: "Маш сөрөг нөлөөлсөн" },
    ],
  },
  {
    id: "body",
    type: "single",
    title: "Биед чинь одоо юу мэдрэгдэж байна?",
    desc: "Биеийн дохио — сэтгэлийн хэл.",
    choices: [
      { id: "b1", emoji: "🌿", label: "Тайван · сул" },
      { id: "b2", emoji: "🪢", label: "Чангаралт (хүзүү/мөр)" },
      { id: "b4", emoji: "⚡️", label: "Тайван бус · тэсвэргүй" },
      { id: "b3", emoji: "🪨", label: "Хүнд · дарамт" },
      { id: "b5", emoji: "🪫", label: "Ядарсан · сульдсан" },
    ],
  },
  {
    id: "energy",
    type: "single",
    title: "Эрч хүч чинь одоо ямар байна?",
    desc: "Өөрийгөө буруутгахгүйгээр үнэнээр нь сонго.",
    choices: [
      { id: "e5", emoji: "🔋", label: "Маш эрчтэй" },
      { id: "e4", emoji: "🔵", label: "Эрчтэй" },
      { id: "e3", emoji: "⚪️", label: "Хэвийн" },
      { id: "e2", emoji: "▫️", label: "Ядарсан" },
      { id: "e1", emoji: "🪫", label: "Маш ядарсан" },
    ],
  },
  {
    id: "feelings",
    type: "multi",
    title: "Одоо ямар мэдрэмжүүд давамгайлж байна вэ?",
    desc: "Дээд тал нь 3-г сонго.",
    maxPick: 3,
    choices: [
      { id: "f5", emoji: "🌤️", label: "Найдвар" },
      { id: "f4", emoji: "😌", label: "Амар тайван" },
      { id: "f7", emoji: "🤍", label: "Дулаан" },
      { id: "f8", emoji: "🥺", label: "Эмзэг" },
      { id: "f6", emoji: "🫥", label: "Хоосон" },
      { id: "f3", emoji: "😠", label: "Уур" },
      { id: "f2", emoji: "😟", label: "Түгшүүр" },
      { id: "f1", emoji: "😢", label: "Гуниг" },
    ],
  },
  {
    id: "need",
    type: "single",
    title: "Одоо чамд хамгийн хэрэгтэй зүйл юу вэ?",
    desc: "Жижиг алхам байхад хангалттай.",
    choices: [
      { id: "n4", emoji: "🗣️", label: "Хүнтэй холбогдох" },
      { id: "n3", emoji: "🚶‍♀️", label: "Хөдөлгөөн" },
      { id: "n2", emoji: "🌿", label: "Тайвшрах" },
      { id: "n1", emoji: "🛌", label: "Амрах" },
      { id: "n5", emoji: "🌙", label: "Ганцаараа байх" },
    ],
  },
  {
    id: "color",
    type: "single",
    title: "Өнөөдрийн мэдрэмжээ ямар өнгөөр дүрслэх вэ?",
    desc: "Өнгө нь мэдрэмжийг нэрлэхэд тусалдаг.",
    choices: [
      { id: "c5", emoji: "⚪️", label: "Цагаан (тод/шинэ)" },
      { id: "c3", emoji: "🟡", label: "Шар (эрч/найдвар)" },
      { id: "c2", emoji: "🟢", label: "Ногоон (амар/тэнцвэр)" },
      { id: "c1", emoji: "🔵", label: "Цэнхэр (тайван/гуниг)" },
      { id: "c4", emoji: "🔴", label: "Улаан (хүчтэй/уур)" },
      { id: "c6", emoji: "⚫️", label: "Хар (хүнд/ядарсан)" },
    ],
  },
  {
    id: "identity",
    type: "multi",
    title: "Өөрийгөө ямар хүн гэж бодож байна вэ?",
    desc: "Дээд тал нь 3-г сонго.",
    maxPick: 3,
    choices: [
      { id: "p7", emoji: "🌤️", label: "Итгэлтэй байж чаддаг" },
      { id: "p2", emoji: "🧠", label: "Ухаантай" },
      { id: "p3", emoji: "🤍", label: "Хүлээцтэй" },
      { id: "p6", emoji: "💪", label: "Даван туулдаг" },
      { id: "p5", emoji: "🔥", label: "Босож чаддаг" },
      { id: "p4", emoji: "🪨", label: "Тэвчээртэй" },
      { id: "p1", emoji: "🌱", label: "Хөгжиж байгаа" },
    ],
  },
  {
    id: "finish",
    type: "single",
    title: "Өнөөдөртөө нэг өгүүлбэр амлалт сонгоё",
    desc: "Сүүлийн сонголт.",
    choices: [
      { id: "a2", emoji: "🚶‍♀️", label: "Жижиг алхам хийнэ" },
      { id: "a1", emoji: "🫶", label: "Өөрийгөө буруутгахгүй" },
      { id: "a4", emoji: "🌙", label: "Амрах эрхтэй" },
      { id: "a3", emoji: "💧", label: "Биеэ сонсоно" },
      { id: "a5", emoji: "🔥", label: "Босож чадна" },
    ],
  },
];

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function levelFromScore(score: number): Level {
  if (score >= 75) return "Green";
  if (score >= 55) return "Yellow";
  if (score >= 35) return "Orange";
  return "Red";
}

function cuteSummary(level: Level, score: number) {
  if (level === "Green") return `Өнөөдөр чинь нэлээн тэнцвэртэй өдөр байна аа 🌿 (${score}/100)`;
  if (level === "Yellow") return `Өнөөдөр боломжийн байна 🌤️ (${score}/100)`;
  if (level === "Orange") return `Өнөөдөр жаахан ачаалалтай өдөр байна 😮‍💨 (${score}/100)`;
  return `Өнөөдөр чинь нэлээн хүнд санагдаж байж магадгүй… 🫂 (${score}/100)`;
}

function praiseLine(level: Level, dateISO: string) {
  const byLevel: Record<Level, string[]> = {
    Green: ["Өнөөдөр өөрийгөө сайн авч явжээ 👏", "Тогтвортой байж чадсан нь хүч шүү 🌿", "Өөрийгөө анзаарсан чинь хамгийн зөв зүйл 🫶"],
    Yellow: ["Савлагаатай байсан ч чи өөрийгөө авч явж чадлаа 👏", "Өнөөдөр боломжийн. Бага багаар улам тод болно 🌤️", "Өөрийгөө ажигласан нь аль хэдийн зөв алхам 🧠"],
    Orange: ["Ачаалалтай өдөр байсан ч чи бууж өгсөнгүй 🤍", "Хүнд мэдрэмжийг нэрлэж чадсан нь өөрөө тайвшрал 🫂", "Өнөөдөрийг давсан нь өөрөө амжилт шүү 🌙"],
    Red: ["Өнөөдөр үнэхээр хүнд байсан байж магадгүй. Гэхдээ чи ганцаараа биш 🫂", "Өөртөө зөөлөн хандах цаг нь энэ 🤍", "Чи энд байна — энэ чинь өөрөө хүч ✨"],
  };

  let h = 0;
  for (let i = 0; i < dateISO.length; i++) h = (h * 31 + dateISO.charCodeAt(i)) >>> 0;
  const arr = byLevel[level];
  return arr[h % arr.length];
}

function smallAdvice(level: Level) {
  if (level === "Green") return "Жижиг зөвлөгөө: өнөөдрийн сайн мэдрэмжийг бататгая — 10 минут алх, эсвэл ус уугаад тэмдэглэ 🌿";
  if (level === "Yellow") return "Жижиг зөвлөгөө: 3 удаа гүн амьсгаа аваад, “одоо би юуг хянаж чадна?” гэж асуугаарай 🌤️";
  if (level === "Orange") return "Жижиг зөвлөгөө: 10 минут утсаа холдуулж, мөр/хүзүүгээ сулла — ганц жижиг алхам хангалттай 🫂";
  return "Жижиг зөвлөгөө: өнөөдөр өөрийгөө дарамтлахгүй. Амрах/хүнтэй ярилцах/тусламж хүсэх нь зөв 🫶";
}

function buildMonthGrid(d: Date) {
  const year = d.getFullYear();
  const month = d.getMonth();

  const first = new Date(year, month, 1);
  const firstDow = (first.getDay() + 6) % 7; // Monday=0
  const start = new Date(year, month, 1 - firstDow);

  const days: Array<{ date: Date; iso: string; inMonth: boolean }> = [];
  for (let i = 0; i < 42; i++) {
    const cur = new Date(start);
    cur.setDate(start.getDate() + i);
    days.push({ date: cur, iso: dateToISO(cur), inMonth: cur.getMonth() === month });
  }
  return { year, month, days };
}

function computeScore(answers: Record<string, string[]>) {
  const points: Record<string, Record<string, number>> = {
    mood: { m5: 5, m4: 4, m3: 3, m2: 2, m1: 1 },
    impact: { i1: 5, i2: 4, i3: 3, i4: 2, i5: 1 },
    body: { b1: 5, b2: 4, b4: 3, b3: 2, b5: 1 },
    energy: { e5: 5, e4: 4, e3: 3, e2: 2, e1: 1 },
    finish: { a2: 5, a1: 4, a4: 4, a3: 4, a5: 5 },
    feelings: { f5: 5, f4: 4, f7: 4, f8: 3, f6: 2, f3: 2, f2: 1, f1: 1 },
    identity: { p7: 5, p2: 4, p3: 4, p6: 4, p5: 4, p4: 3, p1: 4 },
    color: { c5: 5, c3: 4, c2: 4, c1: 3, c4: 2, c6: 1 },
    need: { n4: 4, n3: 4, n2: 4, n1: 5, n5: 3 },
  };

  const keys = ["mood", "impact", "body", "energy", "finish", "color", "need"];
  let sum = 0;
  let max = 0;

  for (const k of keys) {
    const sel = answers[k]?.[0];
    if (!sel) continue;
    sum += points[k]?.[sel] ?? 0;
    max += 5;
  }

  const f = answers["feelings"] ?? [];
  for (const id of f.slice(0, 3)) {
    sum += points.feelings[id] ?? 0;
    max += 5;
  }

  const p = answers["identity"] ?? [];
  for (const id of p.slice(0, 3)) {
    sum += points.identity[id] ?? 0;
    max += 5;
  }

  if (max <= 0) return 0;
  return Math.round((sum / max) * 100);
}
export default function DailyCheckPage() {
  const router = useRouter();

  // ✅ build дээр new Date() render дотор бүү үүсгэ — энд state болгож авна
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
  }, []);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ✅ Өнөөдрийн дүгнэлт + явц
  const [result, setResult] = useState<Result | null>(null);
  const [trend, setTrend] = useState<TrendItem[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [pickedDate, setPickedDate] = useState<string | null>(null);

  const step = STEPS[idx];
  const total = STEPS.length;
  const isLast = idx === total - 1;

  const progressText = `${idx + 1}/${total} · ${Math.round(((idx + 1) / total) * 100)}%`;

  const canGoNext = useMemo(() => {
    const v = answers[step.id] || [];
    return v.length > 0;
  }, [answers, step.id]);

  // choice id -> label
  const choiceLabel = useMemo(() => {
    const map = new Map<string, string>();
    for (const st of STEPS) for (const c of st.choices) map.set(c.id, c.label);
    return (id: string) => map.get(id) ?? id;
  }, []);

  const focusText = useMemo(() => {
    const id = answers["thought"]?.[0];
    return id ? choiceLabel(id) : "";
  }, [answers, choiceLabel]);

  const feelingsText = useMemo(() => {
    const ids = answers["feelings"] ?? [];
    return ids.length ? ids.map(choiceLabel).join(", ") : "";
  }, [answers, choiceLabel]);

  function selectSingle(stepId: string, choiceId: string) {
    setAnswers((p) => ({ ...p, [stepId]: [choiceId] }));
  }

  function toggleMulti(stepId: string, choiceId: string, maxPick: number) {
    setAnswers((p) => {
      const prev = p[stepId] || [];
      const has = prev.includes(choiceId);
      let next = has ? prev.filter((x) => x !== choiceId) : [...prev, choiceId];
      if (!has && next.length > maxPick) next = next.slice(next.length - maxPick);
      return { ...p, [stepId]: next };
    });
  }

  function goPrev() {
    setErr(null);
    setIdx((n) => Math.max(0, n - 1));
  }

  function goNext() {
    if (!canGoNext) return;
    setErr(null);
    setIdx((n) => Math.min(total - 1, n + 1));
  }

  // ✅ Дээд зүүн “←” бол тест доторхи өмнөх асуулт руу буцаах
  function backOneQuestion() {
    if (idx > 0) goPrev();
    else router.push("/"); // эхний асуулт дээр бол чат руу
  }

  // ✅ Дээд баруун “Чат” бол шууд чат руу
  function goChat() {
    router.push("/");
  }

  function levelClass(level: Level) {
    if (level === "Green") return styles.lvGreen;
    if (level === "Yellow") return styles.lvYellow;
    if (level === "Orange") return styles.lvOrange;
    return styles.lvRed;
  }

  function loadTrendFromLocal(dateISO: string): TrendItem[] {
    const runs = safeParse<TrendItem[]>(typeof window !== "undefined" ? localStorage.getItem(STORAGE_RUNS) : null, []);
    // өнөөдрийнх байвал шинэчилж тавина
    const map = new Map(runs.map((r) => [r.check_date, r] as const));
    if (result) map.set(result.dateISO, { check_date: result.dateISO, score: result.score, level: result.level });
    const out = Array.from(map.values()).sort((a, b) => a.check_date.localeCompare(b.check_date));
    return out;
  }

  function saveRunToLocal(item: TrendItem) {
    const runs = safeParse<TrendItem[]>(localStorage.getItem(STORAGE_RUNS), []);
    const map = new Map(runs.map((r) => [r.check_date, r] as const));
    map.set(item.check_date, item);
    const out = Array.from(map.values()).sort((a, b) => a.check_date.localeCompare(b.check_date));
    localStorage.setItem(STORAGE_RUNS, JSON.stringify(out));
  }

  async function refreshTrend() {
    // ✅ Supabase марть гэсэн учраас одоогоор LOCAL-оос уншина
    try {
      if (!now) return;
      const today = dateToISO(now);
      const out = loadTrendFromLocal(today);
      setTrend(out);
    } finally {
      setTrendLoading(false);
    }
  }

  useEffect(() => {
    if (!now) return;
    setTrendLoading(true);
    refreshTrend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  async function finish() {
    if (!canGoNext) return;
    setSaving(true);
    setErr(null);

    try {
      if (!now) throw new Error("Огноо ачаалж байна… дахин оролдоорой");
      const today = dateToISO(now);

      // ✅ score-г эндээс тооцоолоод хадгална (local)
      const score = computeScore(answers);
      const level = levelFromScore(score);

      const res: Result = {
        score,
        level,
        dateISO: today,
        focus: focusText,
        feelings: feelingsText,
      };

      setResult(res);
      setPickedDate(today);

      // ✅ local save
      saveRunToLocal({ check_date: today, score, level });
      localStorage.setItem(STORAGE_LAST, JSON.stringify({ check_date: today, answers }));

      await refreshTrend();
    } catch (e: any) {
      setErr(e?.message ?? "Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  }

  // ✅ single дээр сонгоход автоматаар next
  useEffect(() => {
    if (step.type !== "single") return;
    const v = answers[step.id] || [];
    if (v.length === 1 && idx < total - 1) {
      const t = setTimeout(() => goNext(), 140);
      return () => clearTimeout(t);
    }
  }, [answers, step.id, step.type, idx, total]); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ Календарь map
  const byDate = useMemo(() => new Map(trend.map((t) => [t.check_date, t] as const)), [trend]);

  const pickedItem = useMemo(() => {
    if (!pickedDate) return null;
    return byDate.get(pickedDate) ?? null;
  }, [pickedDate, byDate]);

  return (
    <main className={styles.cbtBody}>
      <div className={styles.container}>
        <header className={styles.header}>
          <button type="button" onClick={backOneQuestion} className={styles.back} aria-label="Буцах">
            ←
          </button>

          <div className={styles.headMid}>
            <div className={styles.headTitle}>Өдрийн шалгалт</div>
            <div className={styles.headSub}>{progressText}</div>
          </div>

          <button type="button" className={styles.chatBtn} onClick={goChat}>
            <span className={styles.chatIcon}>💬</span> Чат
          </button>
        </header>

        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${Math.round(((idx + 1) / total) * 100)}%` }} />
        </div>

        <section className={styles.card}>
          <div className={styles.cardTop}>
            <h1 className={styles.q}>{step.title}</h1>
            {step.desc ? <p className={styles.desc}>{step.desc}</p> : null}
          </div>

          <div className={styles.options}>
            {step.choices.map((c) => {
              const selected = (answers[step.id] || []).includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`${styles.option} ${selected ? styles.on : ""}`}
                  onClick={() => {
                    if (step.type === "single") selectSingle(step.id, c.id);
                    else toggleMulti(step.id, c.id, step.maxPick);
                  }}
                >
                  <div className={styles.left}>
                    <span className={styles.emoji}>{c.emoji || ""}</span>
                    <span className={styles.label}>{c.label}</span>
                  </div>
                  <span className={styles.tick}>{selected ? "✓" : ""}</span>
                </button>
              );
            })}
          </div>

          {/* ✅ 2 сум биш: “Өмнөх” + “Үргэлжлүүлэх” */}
          <div className={styles.nav}>
            <button className={styles.prevBtn} onClick={goPrev} disabled={idx === 0 || saving}>
              Өмнөх
            </button>

            {!isLast ? (
              <button className={styles.nextBtn} onClick={goNext} disabled={!canGoNext || saving}>
                Үргэлжлүүлэх
              </button>
            ) : (
              <button className={styles.done} onClick={finish} disabled={!canGoNext || saving}>
                {saving ? "Хадгалж байна..." : "Дүгнэлт гаргах"}
              </button>
            )}
          </div>

          <div className={styles.hint}>* Сонгоход автоматаар дараагийн асуулт руу шилжинэ.</div>
          {err ? <div className={styles.error}>⚠ {err}</div> : null}

          {/* ✅ ӨНӨӨДРИЙН ДҮГНЭЛТ + Praise + Advice */}
          {result ? (
            <div className={styles.resultCard}>
              <div className={styles.resultTitle}>Өнөөдрийн дүгнэлт</div>

              <div className={styles.resultLine}>{cuteSummary(result.level, result.score)}</div>

              <div className={styles.praise}>{praiseLine(result.level, result.dateISO)}</div>
              <div className={styles.advice}>{smallAdvice(result.level)}</div>

              {(result.focus || result.feelings) ? (
                <div className={styles.resultMeta}>
                  {result.focus ? (
                    <div>
                      Гол сэдэв: <b>{result.focus}</b>
                    </div>
                  ) : null}
                  {result.feelings ? (
                    <div>
                      Давамгай мэдрэмж: <b>{result.feelings}</b>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className={styles.oyLine}>Oyunsanaa: Хүсвэл надтай ярилцаарай — би үргэлж хамт 🤍</div>
            </div>
          ) : null}

          {/* ✅ КАЛЕНДАРЬ — мобайлд багтах “стандарт” */}
          <div className={`${styles.trendCard} ${styles.trendSpacing}`}>
            <div className={styles.trendHead}>
              <div className={styles.trendTitle}>Явц (Календарь)</div>
              <div className={styles.trendSub}>{trendLoading ? "Уншиж байна…" : "Энэ сарын зураг"}</div>
            </div>

            {!now ? (
              <div className={styles.detailHint}>Календарь ачаалж байна…</div>
            ) : (
              (() => {
                const { year, month, days } = buildMonthGrid(now);
                const monthName = new Date(year, month, 1).toLocaleString("mn-MN", { month: "long" });
                const today = dateToISO(now);

                return (
                  <>
                    <div className={styles.monthRow}>
                      <div className={styles.monthLabel}>
                        {monthName} {year}
                      </div>
                      <div className={styles.legend}>
                        <span className={`${styles.dot} ${styles.lvGreen}`} /> Сайн
                        <span className={`${styles.dot} ${styles.lvYellow}`} /> Дунд
                        <span className={`${styles.dot} ${styles.lvOrange}`} /> Ачаалалтай
                        <span className={`${styles.dot} ${styles.lvRed}`} /> Хүнд
                      </div>
                    </div>

                    <div className={styles.dow}>
                      <div>Да</div>
                      <div>Мя</div>
                      <div>Лх</div>
                      <div>Пү</div>
                      <div>Ба</div>
                      <div>Бя</div>
                      <div>Ня</div>
                    </div>

                    <div className={styles.gridWrap}>
                      <div className={styles.grid}>
                        {days.map(({ date, iso, inMonth }) => {
                          const item = byDate.get(iso);
                          const isToday = iso === today;
                          const isPicked = iso === pickedDate;

                          return (
                            <button
                              key={iso}
                              type="button"
                              className={[
                                styles.cell,
                                inMonth ? "" : styles.outMonth,
                                item ? levelClass(item.level) : styles.emptyCell,
                                isToday ? styles.today : "",
                                isPicked ? styles.picked : "",
                              ].join(" ")}
                              onClick={() => setPickedDate(iso)}
                              aria-label={iso}
                            >
                              <div className={styles.dayNum}>{date.getDate()}</div>
                              {item ? <div className={styles.score}>{item.score}</div> : <div className={styles.scoreGhost}>—</div>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className={styles.detail}>
                      <div className={styles.detailTitle}>{pickedDate ? pickedDate : "Өдрөө сонгоорой"}</div>

                      {pickedDate && pickedItem ? (
                        <div className={styles.detailBody}>
                          <div className={styles.detailLine}>
                            <span className={`${styles.badge} ${levelClass(pickedItem.level)}`}>{pickedItem.level}</span>
                            <span className={styles.detailScore}>{pickedItem.score}/100</span>
                          </div>

                          <div className={styles.detailHint}>
                            {pickedItem.level === "Green" && "Тогтвортой, боломжийн сайн өдөр."}
                            {pickedItem.level === "Yellow" && "Дундаж, бага зэрэг хэлбэлзэлтэй."}
                            {pickedItem.level === "Orange" && "Ачаалалтай, стресс өндөр байх магадлалтай."}
                            {pickedItem.level === "Red" && "Нэлээн хүнд өдөр байж магадгүй."}
                          </div>
                        </div>
                      ) : pickedDate ? (
                        <div className={styles.detailHint}>Энэ өдөр өгөгдөл алга байна.</div>
                      ) : (
                        <div className={styles.detailHint}>Календарь дээр нэг өдрөө дарж үзээрэй.</div>
                      )}
                    </div>
                  </>
                );
              })()
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
