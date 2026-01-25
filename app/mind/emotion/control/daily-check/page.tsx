"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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

/** ✅ Сонголтууд "САЙН → МУУ" дарааллаар */
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
      { id: "b1", emoji: "🌿", label: "Тайван·амгалан" },
      { id: "b2", emoji: "🪢", label: "Бие чангарсан (хүзүү/мөр" },
      { id: "b4", emoji: "⚡️", label: "Тайван бус · тухгүй " },
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
      { id: "e5", emoji: "🔋", label: "Маш их эрч хүчтэй " },
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
      { id: "f4", emoji: "😌", label: "Амар тайван мэдрэмж" },
      { id: "f7", emoji: "🤍", label: "Дулаан мэдрэмж" },
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
      { id: "p1", emoji: "🌱", label: "Суралцаж чаддаг" },
    ],
  },
  {
    id: "finish",
    type: "single",
    title: "Өнөөдөр өөртөө хэлэх үг юу вэ",
    desc: "Сүүлийн сонголт.",
    choices: [
      { id: "a2", emoji: "🚶‍♀️", label: "Жижиг алхам хийнэ" },
      { id: "a1", emoji: "🫶", label: "Өөрийгөө буруутгахгүй" },
      { id: "a4", emoji: "🌙", label: "Амрах эрхтэй" },
      { id: "a3", emoji: "💧", label: "Өөрийгөө сонсоно" },
      { id: "a5", emoji: "🔥", label: "Дахин үйлдэнэ, шантрахгүй" },
    ],
  },
];

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

function summaryLine(level: Level, score: number) {
  if (level === "Green") return `Өнөөдөр өөрийгөө ажигласан чинь маш сайн байна 🌿 (${score}/100)`;
  if (level === "Yellow") return `Өнөөдөр өөрийгөө ажигласан чинь үнэхээр сайн 👏 (${score}/100)`;
  if (level === "Orange") return `Өнөөдөр өөрийгөө шалгасан чинь том алхам шүү 🫶 (${score}/100)`;
  return `Өнөөдөр ч гэсэн өөрийгөө орхиогүй чинь хамгийн чухал нь ✨ (${score}/100)`;
}

function detailLine(level: Level) {
  if (level === "Green") return "Ерөнхийдөө тогтвортой, сэтгэл-биеийн тэнцвэр сайн байна.";
  if (level === "Yellow") return "Ерөнхийдөө боломжийн. Бага зэрэг хэлбэлзэл байж магадгүй.";
  if (level === "Orange") return "Ачаалал мэдрэгдсэн байж магадгүй. Өөрийгөө зөөлөн авч яваарай.";
  return "Нэлээн хүнд мэдрэмж давамгайлсан байж болох юм. Өөрийгөө буруутгах хэрэггүй.";
}

function praiseLine(dateISO: string) {
  const n = Math.floor(new Date(dateISO + "T00:00:00").getTime() / 86400000) % 4;
  const variants = [
    "Oyunsanaa: Чи өнөөдөр өөрийгөө сонсож чадсан — энэ бол хүч.",
    "Oyunsanaa: Өөрийгөө анзаарна гэдэг бол өөртөө хайртай байгаагийн тэмдэг.",
    "Oyunsanaa: Өнөөдрийнхөө байдлыг үнэнээр нь хэлсэн чинь өөрөө том алхам.",
    "Oyunsanaa: Өөрийгөө бодитоор харах нь өсөлтийн эхлэл.",
  ];
  return variants[n];
}

function shouldShowAdvice(dateISO: string, everyNDays = 2) {
  if (!everyNDays) return false;
  const d = new Date(dateISO + "T00:00:00");
  const n = Math.floor(d.getTime() / 86400000);
  return n % everyNDays === 0;
}

function adviceLine(level: Level) {
  if (level === "Green") return "Жижиг зөвлөгөө: өнөөдрийн сайн байдлаа 1 зүйлээр бататга (10 минут алхах/ус уух).";
  if (level === "Yellow") return "Жижиг зөвлөгөө: 1 амьсгалын дасгал (4–4–4) хийгээд биеэ зөөлөн сулла.";
  if (level === "Orange") return "Жижиг зөвлөгөө: өнөөдөр өөртөө “хаана ч хүрэхгүй” 10 минутын амралт өг.";
  return "Жижиг зөвлөгөө: хамгийн бага ачаалалтай 1 зүйл (ус/амьсгал/суниалт) хийгээд биеэ тайвшруул.";
}

function levelClass(level: Level) {
  if (level === "Green") return styles.lvGreen;
  if (level === "Yellow") return styles.lvYellow;
  if (level === "Orange") return styles.lvOrange;
  return styles.lvRed;
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

  const step = STEPS[idx];
  const total = STEPS.length;
  const isLast = idx === total - 1;
  const progressText = `${idx + 1}/${total} · ${Math.round(((idx + 1) / total) * 100)}%`;

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

  // ✅ single дээр дармагц автоматаар next (last дээр автоматаар явахгүй!)
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

  async function saveToSupabase() {
    setErr(null);
    if (!now) return;

    const today = dateToISO(now);

    // ✅ mood байхгүй бол сервер 500 биш UI дээр шууд хэлнэ
    const mood = answers.mood?.[0] ?? null;
    if (!mood) {
      setErr("Mood сонголт хоосон байна. 1-р асуулт руу буцаад сонгоорой.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/mind/emotion/daily-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          check_date: today,
          answers,
        }),
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? "Хадгалах үед алдаа гарлаа");

      const score = Number(j.score ?? 0);
      const level = (j.level as Level) ?? "Yellow";

      setResult({ score, level, dateISO: today });
      setPickedDate(today);

      // calendar дээр харагдуулахын тулд local trend update
      setTrend((prev) => {
        const map = new Map(prev.map((x) => [x.check_date, x] as const));
        map.set(today, { check_date: today, score, level });
        return Array.from(map.values()).sort((a, b) => a.check_date.localeCompare(b.check_date));
      });
    } catch (e: any) {
      setErr(e?.message ?? "Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  }

  async function onMainButton() {
    if (!canGoNext || saving) return;

    if (!isLast) {
      setIdx((n) => Math.min(total - 1, n + 1));
      return;
    }

    await saveToSupabase();
  }

  const showMainButton = step.type === "multi" || isLast;

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

              <div className={styles.praise}>{praiseLine(result.dateISO)}</div>

              {shouldShowAdvice(result.dateISO, 2) ? <div className={styles.advice}>{adviceLine(result.level)}</div> : null}

              <div className={styles.oyLine}>Oyunsanaa: Хүсвэл надтай ярилцаарай — би үргэлж хамт 🤍</div>
            </div>
          ) : null}

          <div className={styles.trendCard}>
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
                      <div>Да</div><div>Мя</div><div>Лх</div><div>Пү</div><div>Ба</div><div>Бя</div><div>Ня</div>
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
