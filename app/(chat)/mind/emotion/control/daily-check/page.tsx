// app/(chat)/mind/emotion/control/daily-check/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import styles from "./cbt.module.css";

type Choice = { id: string; label: string; emoji?: string };
type Step =
  | { id: string; type: "single"; title: string; desc?: string; choices: Choice[] }
  | { id: string; type: "multi"; title: string; desc?: string; maxPick: number; choices: Choice[] };

type Level = "Green" | "Yellow" | "Orange" | "Red";
type TrendItem = { check_date: string; score: number; level: Level };

function dateToISO(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
function addMonths(d: Date, months: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + months);
  return x;
}

type RangeKey = "7d" | "30d" | "3m" | "6m" | "12m";
const RANGE_LABEL: Record<RangeKey, string> = {
  "7d": "7 хоног",
  "30d": "1 сар",
  "3m": "3 сар",
  "6m": "6 сар",
  "12m": "12 сар",
};

/** ✅ Сонголтууд "САЙН → МУУ" дарааллаар (UI) */
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
      { id: "i1", emoji: "⬆️", label: "Маш их нөлөөлсөн" },
      { id: "i2", emoji: "↗️", label: "Нэлээд нөлөөлсөн" },
      { id: "i3", emoji: "➖", label: "Дунд зэрэг нөлөөлсөн" },
      { id: "i4", emoji: "↘️", label: "Бага зэрэг нөлөөлсөн" },
      { id: "i5", emoji: "⬇️", label: "Огт нөлөөлөөгүй" },
    ],
  },
  {
    id: "body",
    type: "single",
    title: "Биед чинь одоо юу мэдрэгдэж байна вэ?",
    desc: "Биеийн дохио — сэтгэлийн хэл.",
    choices: [
      { id: "b1", emoji: "🌿", label: "Тайван · амгалан" },
      { id: "b2", emoji: "🪢", label: "Бие чангарсан (хүзүү/мөр)" },
      { id: "b4", emoji: "⚡️", label: "Тайван бус · тухгүй" },
      { id: "b3", emoji: "🪨", label: "Хүнд · дарамт" },
      { id: "b5", emoji: "🪫", label: "Ядарсан · сульдсан" },
    ],
  },
  {
    id: "energy",
    type: "single",
    title: "Хэр эрч хүчтэй байна вэ?",
    desc: "Өөрийгөө буруутгахгүйгээр үнэнээр нь сонго.",
    choices: [
      { id: "e5", emoji: "🔋", label: "Маш их эрч хүчтэй" },
      { id: "e4", emoji: "🔵", label: "Дажгүй, сайн байна" },
      { id: "e3", emoji: "⚪️", label: "Хэвийн л байна" },
      { id: "e2", emoji: "▫️", label: "Ядарсан байна" },
      { id: "e1", emoji: "🪫", label: "Маш их ядарсан байна" },
    ],
  },
  {
    id: "feelings",
    type: "multi",
    title: "Одоо ямар мэдрэмжүүд давамгайлж байна вэ?",
    desc: "Дээд тал нь 3-г сонго.",
    maxPick: 3,
    choices: [
      { id: "f5", emoji: "🌤️", label: "Найдвар төрж байна" },
      { id: "f4", emoji: "😌", label: "Амар тайван" },
      { id: "f7", emoji: "🤍", label: "Дулаан хайрын мэдрэмж" },
      { id: "f8", emoji: "🥺", label: "Эмзэглэж байна" },
      { id: "f6", emoji: "🫥", label: "Хоосон санагдаж байна" },
      { id: "f3", emoji: "😠", label: "Уур хүрч байна" },
      { id: "f2", emoji: "😟", label: "Түгшүүр айдастай байна" },
      { id: "f1", emoji: "😢", label: "Гуниглаж байна" },
    ],
  },
  {
    id: "need",
    type: "single",
    title: "Одоо чамд хамгийн хэрэгтэй зүйл юу вэ?",
    desc: "Зөвхөн ажиглалт.",
    choices: [
      { id: "n4", emoji: "🗣️", label: "Хүнтэй холбогдох" },
      { id: "n3", emoji: "🚶‍♀️", label: "Хөдөлгөөн хийх" },
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
      { id: "c5", emoji: "⚪️", label: "Цагаан (гоё/гэгээлэг)" },
      { id: "c3", emoji: "🟡", label: "Шар (эрч хүч/найдвар)" },
      { id: "c2", emoji: "🟢", label: "Ногоон (амар тайван/тэнцвэртэй)" },
      { id: "c1", emoji: "🔵", label: "Цэнхэр (гуниг/харуусал)" },
      { id: "c4", emoji: "🔴", label: "Улаан (уур/бухимдал)" },
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
      { id: "p6", emoji: "💪", label: "Бүхнийг даван туулж чаддаг" },
      { id: "p5", emoji: "🔥", label: "Дахин босч чаддаг" },
      { id: "p4", emoji: "🪨", label: "Тэвчээртэй" },
      { id: "p1", emoji: "🌱", label: "Суралцаад урагшилдаг" },
    ],
  },
  {
    id: "finish",
    type: "single",
    title: "Өнөөдөр өөртөө хэлэх үг юу вэ?",
    desc: "Сүүлийн сонголт.",
    choices: [
      { id: "a2", emoji: "🚶‍♀️", label: "Шантарч болохгүй " },
      { id: "a1", emoji: "🫶", label: "Өөрийгөө буруутгахгүй" },
      { id: "a4", emoji: "🌙", label: "Би амрах эрхтэй" },
      { id: "a3", emoji: "💧", label: "Улам илүү хичээнэ" },
      { id: "a5", emoji: "🔥", label: "Хүлээн зөвшөөөрч байна" },
    ],
  },
];

function levelFromScore(score: number): Level {
  if (score >= 75) return "Green";
  if (score >= 55) return "Yellow";
  if (score >= 35) return "Orange";
  return "Red";
}

function pointsFor(id: string, table: Record<string, number>, fallback = 3) {
  return table[id] ?? fallback;
}

function computeScore(answers: Record<string, string[]>) {
  const mood = pointsFor(answers.mood?.[0] ?? "", { m5: 5, m4: 4, m3: 3, m2: 2, m1: 1 }, 3);
  const energy = pointsFor(answers.energy?.[0] ?? "", { e5: 5, e4: 4, e3: 3, e2: 2, e1: 1 }, 3);
  const impact = pointsFor(answers.impact?.[0] ?? "", { i1: 1, i2: 2, i3: 3, i4: 4, i5: 5 }, 3);

  const body = pointsFor(answers.body?.[0] ?? "", { b1: 5, b2: 3, b4: 2, b3: 2, b5: 1 }, 3);

  const feelingsIds = answers.feelings ?? [];
  const feelingsAvg =
    feelingsIds.length === 0
      ? 3
      : feelingsIds.reduce(
          (s, id) => s + pointsFor(id, { f5: 5, f4: 5, f7: 4, f8: 3, f6: 2, f3: 2, f2: 1, f1: 1 }, 3),
          0
        ) / feelingsIds.length;

  const identityIds = answers.identity ?? [];
  const identityAvg =
    identityIds.length === 0
      ? 3
      : identityIds.reduce((s, id) => s + pointsFor(id, { p7: 4, p2: 4, p3: 4, p6: 4, p5: 4, p4: 4, p1: 4 }, 4), 0) /
        identityIds.length;

  const finish = pointsFor(answers.finish?.[0] ?? "", { a1: 4, a2: 4, a3: 4, a4: 4, a5: 4 }, 4);

  const wMood = 2.0;
  const wImpact = 2.0;
  const wEnergy = 2.0;
  const wFeelings = 1.5;
  const wBody = 1.0;
  const wIdentity = 0.5;
  const wFinish = 0.5;

  const weighted =
    mood * wMood +
    impact * wImpact +
    energy * wEnergy +
    feelingsAvg * wFeelings +
    body * wBody +
    identityAvg * wIdentity +
    finish * wFinish;

  const wSum = wMood + wImpact + wEnergy + wFeelings + wBody + wIdentity + wFinish;
  const avg = weighted / wSum;
  const score100 = Math.round(((avg - 1) / 4) * 100);
  return Math.max(0, Math.min(100, score100));
}

function summaryLine(level: Level, score: number) {
  if (level === "Green") return `Өнөөдрийн байдал тогтвортой байна 🌿 (${score}/100)`;
  if (level === "Yellow") return `Өнөөдөр боломжийн өдөр байна 👏 (${score}/100)`;
  if (level === "Orange") return `Өнөөдөр жаахан хүндхэн санагдсан байж магадгүй 🧡 (${score}/100)`;
  return `Өнөөдөр хүнд өдөр байсан бололтой ❤️ (${score}/100)`;
}

function detailLine(level: Level) {
  if (level === "Green") return "Бие-сэтгэлийн ерөнхий тэнцвэр сайн байна. Энэ мэдрэмжээ үргэлж бататгаарай.";
  if (level === "Yellow") return "Жаахан ачаалал байсан ч чи давж гарч чадсан байна. Өөрийгөө дэмжээрэй.";
  if (level === "Orange") return "Сэтгэл санаа савлаж магадгүй. Бага зэрэг тайвшрах зүйл (амьсгал, алхалт, ус) тусална.";
  return "Дотоод ачаалал ихэссэн байна. Одоо хамгийн түрүүнд тайван орчин, жижиг амралт хэрэгтэй.";
}

function dayTone(level: Level) {
  const t: Record<Level, string> = {
    Green: "Өнөөдөр чи өөрийгөө сайн анзаарсан байна. ",
    Yellow: "Чи өнөөдөр ч бас хичээсэн — энэ чинь хангалттай. ",
    Orange: "Өөртөө жаахан зөөлөн байя — жижиг алхамууд тусална. ",
    Red: "Одоо түр амьсгаа аваад, өөрийгөө буруутгахгүй байя. ",
  };
  return t[level] || "";
}

function finishWarm(finishText: string) {
  const m: Record<string, string> = {
    "Өөрийгөө буруутгахгүй": "Тийм ээ — өөрийгөө буруутгахгүй байх чинь хамгийн зөв алхам.",
    "Би амрах эрхтэй": "Амрах нь сул дорой биш — энэ бол өөртөө өгөх хайр юм.",
    "Улам илүү хичээнэ": "Чи аль хэдийн хичээж байна. Одоо өөрийгөө илүү итгэлтэй дэмжээрэй.",
    "Шантрах болохгүй": "Шантрахгүй гэж хэлсэн чинь өөртөө өгсөн том зориг шүү.",
    "Хүлээн зөвшөөрч байна": "Өөрийгөө хүлээн зөвшөөрөх нь дотоод тайвшралын эхлэл юм шүү.",
  };
  return finishText ? m[finishText] ?? `“${finishText}” гэж хэлсэн чинь өөрөө хүч.` : "";
}

function warmClosing(level: Level, finishText: string) {
  const first = dayTone(level);
  const mid = finishWarm(finishText);
  const close = "Хүсвэл надтай ярилцаарай — чи ганцаараа биш 🤍";
  return [first, mid, close].filter(Boolean).join(" ");
}

function levelClass(level: Level) {
  if (level === "Green") return styles.lvGreen;
  if (level === "Yellow") return styles.lvYellow;
  if (level === "Orange") return styles.lvOrange;
  return styles.lvRed;
}

function buildMonthGrid(d: Date) {
  const year = d.getFullYear();
  const month = d.getMonth();

  const first = new Date(year, month, 1);
  const firstDow = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - firstDow);

  const days: Array<{ date: Date; iso: string; inMonth: boolean }> = [];
  for (let i = 0; i < 42; i++) {
    const cur = new Date(start);
    cur.setDate(start.getDate() + i);
    days.push({ date: cur, iso: dateToISO(cur), inMonth: cur.getMonth() === month });
  }
  return { year, month, days };
}

function computeRange(now: Date, key: RangeKey) {
  const end = startOfDay(now);
  if (key === "7d") return { start: addDays(end, -6), end };
  if (key === "30d") return { start: addDays(end, -29), end };
  if (key === "3m") return { start: addMonths(end, -3), end };
  if (key === "6m") return { start: addMonths(end, -6), end };
  return { start: addMonths(end, -12), end };
}

function trendArrow(items: TrendItem[]) {
  if (!items.length) return "—";
  const sorted = [...items].sort((a, b) => a.check_date.localeCompare(b.check_date));
  const n = sorted.length;
  const cut = Math.max(1, Math.floor(n / 3));
  const first = sorted.slice(0, cut);
  const last = sorted.slice(n - cut);

  const avg = (arr: TrendItem[]) => Math.round(arr.reduce((s, x) => s + x.score, 0) / Math.max(1, arr.length));
  const a = avg(first);
  const b = avg(last);

  const diff = b - a;
  if (diff >= 5) return `↑ өсөлт (+${diff})`;
  if (diff <= -5) return `↓ бууралт (${diff})`;
  return "→ тогтвортой";
}

export default function DailyCheckPage() {
  const router = useRouter();

  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [result, setResult] = useState<{ score: number; level: Level; dateISO: string } | null>(null);
  const [trend, setTrend] = useState<TrendItem[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [pickedDate, setPickedDate] = useState<string | null>(null);

  const [calDate, setCalDate] = useState<Date | null>(null);
  const [rangeKey, setRangeKey] = useState<RangeKey>("7d");

  // ✅ popup (цагаан theme)
  const [showRangeModal, setShowRangeModal] = useState(false);

  const step = STEPS[idx];
  const total = STEPS.length;
  const isLast = idx === total - 1;
  const progressText = `${idx + 1}/${total} · ${Math.round(((idx + 1) / total) * 100)}%`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const newKey = sp.get("new");
    if (!newKey) return;

    setIdx(0);
    setAnswers({});
    setSaving(false);
    setErr(null);
    setResult(null);
    setPickedDate(null);

    sp.delete("new");
    const qs = sp.toString();
    const next = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    router.replace(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!now) return;
    if (!calDate) setCalDate(new Date(now));
  }, [now, calDate]);

  const canGoNext = useMemo(() => {
    const v = answers[step.id] || [];
    return v.length > 0;
  }, [answers, step.id]);

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

  const finishText = useMemo(() => {
    const id = answers["finish"]?.[0];
    return id ? choiceLabel(id) : "";
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

  function topBack() {
    setErr(null);
    if (idx > 0) setIdx((n) => Math.max(0, n - 1));
    else router.push("/");
  }

  function goChat() {
    router.push("/");
  }

  async function refreshTrend() {
    setTrendLoading(true);
    try {
      const r = await fetch("/api/mind/emotion/daily-check", { method: "GET" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "Унших үед алдаа гарлаа");
      setTrend((j.items ?? []) as TrendItem[]);
    } catch (e: any) {
      setErr(e?.message ?? "Алдаа гарлаа");
    } finally {
      setTrendLoading(false);
    }
  }

  useEffect(() => {
    refreshTrend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (step.type !== "single") return;
    const v = answers[step.id] || [];
    if (v.length === 1 && idx < total - 1) {
      const t = setTimeout(() => setIdx((n) => Math.min(total - 1, n + 1)), 140);
      return () => clearTimeout(t);
    }
  }, [answers, step.id, step.type, idx, total]);

  const byDate = useMemo(() => new Map(trend.map((t) => [t.check_date, t] as const)), [trend]);
  const pickedItem = useMemo(() => (pickedDate ? byDate.get(pickedDate) ?? null : null), [pickedDate, byDate]);

  const rangeStats = useMemo(() => {
    if (!now) return null;

    const { start, end } = computeRange(now, rangeKey);
    const startISO = dateToISO(startOfDay(start));
    const endISO = dateToISO(startOfDay(end));

    const items = trend
      .filter((x) => x.check_date >= startISO && x.check_date <= endISO)
      .sort((a, b) => a.check_date.localeCompare(b.check_date));

    const count = items.length;
    if (!count) {
      return {
        startISO,
        endISO,
        count: 0,
        avg: 0,
        arrow: "—",
        counts: { Green: 0, Yellow: 0, Orange: 0, Red: 0 } as Record<Level, number>,
      };
    }

    const avg = Math.round(items.reduce((s, x) => s + x.score, 0) / count);
    const counts = items.reduce(
      (acc, x) => {
        acc[x.level] += 1;
        return acc;
      },
      { Green: 0, Yellow: 0, Orange: 0, Red: 0 } as Record<Level, number>
    );

    return { startISO, endISO, count, avg, arrow: trendArrow(items), counts };
  }, [trend, now, rangeKey]);

  async function saveToSupabase() {
    setErr(null);
    if (!now) return;

    const today = dateToISO(now);

    const moodChoice = answers?.mood?.[0];
    const energyChoice = answers?.energy?.[0];
    const impactChoice = answers?.impact?.[0];

    if (!moodChoice) return setErr("Mood сонголт хоосон байна. 1-р асуулт руу буцаад сонгоорой.");
    if (!energyChoice) return setErr("Energy сонголт хоосон байна. Тэр асуулт руу буцаад сонгоорой.");
    if (!impactChoice) return setErr("Impact сонголт хоосон байна. Тэр асуулт руу буцаад сонгоорой.");

    const score = computeScore(answers);
    const level = levelFromScore(score);

    setSaving(true);
    try {
      const res = await fetch("/api/mind/emotion/daily-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          check_date: today,
          answers,
          client_score: score,
          client_level: level,
        }),
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? "Хадгалах үед алдаа гарлаа");

      setResult({ score, level, dateISO: today });
      setPickedDate(today);

      setTrend((prev) => {
        const map = new Map(prev.map((x) => [x.check_date, x] as const));
        map.set(today, { check_date: today, score, level });
        return Array.from(map.values()).sort((a, b) => a.check_date.localeCompare(b.check_date));
      });

      setCalDate(new Date(now));
    } catch (e: any) {
      setErr(e?.message ?? "Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  }

  async function onMainButton() {
    if (!canGoNext || saving) return;
    if (!isLast) return setIdx((n) => Math.min(total - 1, n + 1));
    await saveToSupabase();
  }

  const showMainButton = step.type === "multi" || isLast;

  const chipStyle = (active: boolean): CSSProperties => ({
    padding: "10px 10px",
    borderRadius: 999,
    fontSize: 12,
    lineHeight: "12px",
    border: active ? "1px solid rgba(255,255,255,0.48)" : "1px solid rgba(255,255,255,0.20)",
    background: active ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.95)",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
    width: "100%",
    textAlign: "center",
  });

  // ✅ calendar cell-үүдийг томруулж, 2 мөрөөр багтаана
  const mobileCellPatch: CSSProperties = {
    minHeight: 58,
    paddingTop: 8,
    paddingBottom: 8,
  };

  // ✅ будалт (өнгө) арай тод харагдах overlay
  const tint: Record<Level, CSSProperties> = {
    Green: { boxShadow: "inset 0 0 0 9999px rgba(46, 204, 113, 0.18)" },
    Yellow: { boxShadow: "inset 0 0 0 9999px rgba(241, 196, 15, 0.18)" },
    Orange: { boxShadow: "inset 0 0 0 9999px rgba(230, 126, 34, 0.18)" },
    Red: { boxShadow: "inset 0 0 0 9999px rgba(231, 76, 60, 0.18)" },
  };

  // ✅ legend-г нэг мөрөнд, зөв текстүүдтэй
  const legendRow: CSSProperties = {
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "nowrap",
    whiteSpace: "nowrap",
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
  };
  const dot: CSSProperties = {
    width: 10,
    height: 10,
    borderRadius: 999,
    display: "inline-block",
    marginRight: 6,
  };

  return (
    <main className={styles.cbtBody}>
      <div className={styles.container}>
        <header className={styles.header}>
          <button type="button" onClick={topBack} className={styles.back} aria-label="Буцах">
            ←
          </button>

          <div className={styles.headMid}>
            <div className={styles.headTitle}>Өдрийн шалгалт</div>
            <div className={styles.headSub}>{progressText}</div>
          </div>

          <button type="button" className={styles.chatBtn} onClick={goChat}>
            💬 Чат
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

          {showMainButton ? (
            <div className={styles.navOne}>
              <button className={styles.mainBtn} onClick={onMainButton} disabled={!canGoNext || saving}>
                {isLast ? (saving ? "Тооцоолж байна..." : "Дүгнэлт гаргах") : "Үргэлжлүүлэх"}
              </button>
            </div>
          ) : (
            <div className={styles.hint}>* Сонгоход автоматаар дараагийн асуулт руу шилжинэ.</div>
          )}

          {err ? <div className={styles.error}>⚠ {err}</div> : null}

          {result ? (
            <div className={styles.resultCard}>
              <div className={styles.resultTitle}>Өнөөдрийн дүгнэлт</div>
              <div className={styles.resultLine}>{summaryLine(result.level, result.score)}</div>
              <div className={styles.resultDetail}>{detailLine(result.level)}</div>
              {(focusText || feelingsText) ? (
                <div className={styles.resultMeta}>
                  {focusText ? (
                    <div>
                      Гол сэдэв: <b>{focusText}</b>
                    </div>
                  ) : null}
                  {feelingsText ? (
                    <div>
                      Давамгай мэдрэмж: <b>{feelingsText}</b>
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className={styles.oyLine}>{warmClosing(result.level, finishText)}</div>
            </div>
          ) : null}

          <div className={styles.trendCard}>
            <div className={styles.trendHead}>
              <div className={styles.trendTitle}>Явц (Календарь)</div>
              <div className={styles.trendSub}>{trendLoading ? "Уншиж байна…" : "Өдөр / 7 хоног / сар / жил"}</div>
            </div>

            {/* ✅ 5 товч 1 мөрөөр (mobile OK) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                gap: 8,
                padding: "8px 2px 8px 2px",
              }}
            >
              {(["7d", "30d", "3m", "6m", "12m"] as RangeKey[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  style={chipStyle(rangeKey === k)}
                  onClick={() => {
                    setRangeKey(k);
                    setShowRangeModal(true);
                  }}
                >
                  {RANGE_LABEL[k]}
                </button>
              ))}
            </div>

            {/* ✅ divider (чиний хүссэн хөндлөн зураас) */}
            <div style={{ height: 1, background: "rgba(255,255,255,0.14)", margin: "6px 0 12px 0" }} />

            {/* ✅ popup (цагаан theme) */}
            {showRangeModal && rangeStats ? (
              <div
                onClick={() => setShowRangeModal(false)}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.35)",
                  zIndex: 60,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 14,
                }}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: "min(720px, 96vw)",
                    borderRadius: 18,
                    border: "1px solid rgba(0,0,0,0.10)",
                    background: "rgba(255,255,255,0.96)",
                    color: "#0f172a",
                    boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
                    padding: 14,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <div style={{ fontWeight: 900, fontSize: 16 }}>{RANGE_LABEL[rangeKey]} дүгнэлт</div>
                    <button
                      type="button"
                      onClick={() => setShowRangeModal(false)}
                      style={{
                        borderRadius: 10,
                        padding: "8px 10px",
                        border: "1px solid rgba(0,0,0,0.12)",
                        background: "rgba(0,0,0,0.04)",
                        color: "#0f172a",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      Хаах ✕
                    </button>
                  </div>

                  <div style={{ marginTop: 10, fontSize: 13, color: "rgba(15,23,42,0.75)" }}>
                    Хугацаа: <b>{rangeStats.startISO}</b> → <b>{rangeStats.endISO}</b>{" "}
                    <span style={{ marginLeft: 8 }}>{rangeStats.arrow}</span>
                  </div>

                  {rangeStats.count === 0 ? (
                    <div style={{ marginTop: 12, color: "rgba(15,23,42,0.72)" }}>
                      Энэ хугацаанд мэдээлэл алга байна. Өдөр бөглөөд эхэлмэгц дүгнэлт гарна.
                    </div>
                  ) : (
                    <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div
                        style={{
                          border: "1px solid rgba(0,0,0,0.10)",
                          borderRadius: 14,
                          padding: 12,
                          background: "rgba(15,23,42,0.03)",
                        }}
                      >
                        <div style={{ fontSize: 12, color: "rgba(15,23,42,0.65)" }}>Дундаж оноо</div>
                        <div style={{ fontSize: 26, fontWeight: 900, lineHeight: "30px" }}>{rangeStats.avg}/100</div>
                        <div style={{ marginTop: 6, fontSize: 12, color: "rgba(15,23,42,0.65)" }}>
                          Нийт: <b>{rangeStats.count}</b> өдөр
                        </div>
                      </div>

                      <div
                        style={{
                          border: "1px solid rgba(0,0,0,0.10)",
                          borderRadius: 14,
                          padding: 12,
                          background: "rgba(15,23,42,0.03)",
                        }}
                      >
                        <div style={{ fontSize: 12, color: "rgba(15,23,42,0.65)", marginBottom: 8 }}>Түвшин (тоо)</div>
                        <div style={{ fontSize: 13, display: "flex", flexWrap: "wrap", gap: 10, color: "#0f172a" }}>
                          <span>Сайн <b>{rangeStats.counts.Green}</b></span>
                          <span>Дунд <b>{rangeStats.counts.Yellow}</b></span>
                          <span>Хэцүү <b>{rangeStats.counts.Orange}</b></span>
                          <span>Хүнд <b>{rangeStats.counts.Red}</b></span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 10, fontSize: 12, color: "rgba(15,23,42,0.6)" }}>
                    * Арын хэсэг дээр дарвал хаагдана.
                  </div>
                </div>
              </div>
            ) : null}

            {!now || !calDate ? (
              <div className={styles.detailHint}>Календарь ачаалж байна…</div>
            ) : (
              (() => {
                const { year, month, days } = buildMonthGrid(calDate);
                const monthName = new Date(year, month, 1).toLocaleString("mn-MN", { month: "long" });
                const today = dateToISO(now);

                return (
                  <>
                    <div className={styles.monthRow}>
                      <div className={styles.monthLabel} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <button
                          type="button"
                          onClick={() => setCalDate((d) => (d ? addMonths(d, -1) : d))}
                          style={{ padding: "10px 12px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.9)" }}
                          aria-label="Өмнөх сар"
                        >
                          ←
                        </button>

                        <div style={{ minWidth: 160, textAlign: "center", fontWeight: 800 }}>
                          {monthName} {year}
                        </div>

                        <button
                          type="button"
                          onClick={() => setCalDate((d) => (d ? addMonths(d, 1) : d))}
                          style={{ padding: "10px 12px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.9)" }}
                          aria-label="Дараагийн сар"
                        >
                          →
                        </button>
                      </div>

                      {/* ✅ legend нэг мөр + зөв текст */}
                      <div style={legendRow}>
                        <span>
                          <span style={{ ...dot, background: "rgba(46, 204, 113, 0.85)" }} />
                          Сайн
                        </span>
                        <span>
                          <span style={{ ...dot, background: "rgba(241, 196, 15, 0.85)" }} />
                          Дунд
                        </span>
                        <span>
                          <span style={{ ...dot, background: "rgba(230, 126, 34, 0.85)" }} />
                          Хэцүү
                        </span>
                        <span>
                          <span style={{ ...dot, background: "rgba(231, 76, 60, 0.85)" }} />
                          Хүнд
                        </span>
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

                          const cls =
                            item?.level === "Green"
                              ? styles.lvGreen
                              : item?.level === "Yellow"
                              ? styles.lvYellow
                              : item?.level === "Orange"
                              ? styles.lvOrange
                              : item?.level === "Red"
                              ? styles.lvRed
                              : "";

                          return (
                            <button
                              key={iso}
                              type="button"
                              className={[
                                styles.cell,
                                inMonth ? "" : styles.outMonth,
                                item ? cls : styles.emptyCell,
                                isToday ? styles.today : "",
                                isPicked ? styles.picked : "",
                              ].join(" ")}
                              style={{
                                ...mobileCellPatch,
                                ...(item ? tint[item.level] : null),
                              }}
                              onClick={() => setPickedDate(iso)}
                              aria-label={iso}
                            >
                              {/* ✅ өдөр + оноо 2 мөрөөр */}
                              <div style={{ fontSize: 14, fontWeight: 900, lineHeight: "16px", color: "rgba(255,255,255,0.92)" }}>
                                {date.getDate()}
                              </div>
                              <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, lineHeight: "14px", color: "rgba(255,255,255,0.85)" }}>
                                {item ? item.score : "—"}
                              </div>
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
                          <div className={styles.detailHint}>{detailLine(pickedItem.level)}</div>
                        </div>
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
