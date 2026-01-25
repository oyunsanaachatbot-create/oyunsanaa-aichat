"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import styles from "./cbt.module.css";

type Choice = { id: string; label: string; emoji?: string };
type Step =
  | { id: string; type: "single"; title: string; desc?: string; choices: Choice[] }
  | { id: string; type: "multi"; title: string; desc?: string; maxPick: number; choices: Choice[] };

type TrendItem = { check_date: string; score: number; level: string };
type Result = { score: number; level: string; dateISO: string };

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ✅ 10 алхам — 5+ сонголт
const STEPS: Step[] = [
  {
    id: "mood",
    type: "single",
    title: "Өнөөдөр сэтгэл санаа чинь ямар байсан бэ?",
    desc: "Дотроосоо хамгийн ойр мэдрэмжээ сонго.",
    choices: [
      { id: "m1", emoji: "😢", label: "Гунигтай" },
      { id: "m2", emoji: "😟", label: "Санаа зовсон" },
      { id: "m3", emoji: "😐", label: "Хэвийн" },
      { id: "m4", emoji: "🙂", label: "Сайн" },
      { id: "m5", emoji: "😄", label: "Баяртай" },
    ],
  },
  {
    id: "thought",
    type: "single",
    title: "Өнөөдөр толгойд чинь хамгийн их эргэлдсэн зүйл?",
    desc: "Зөв/буруу байхгүй — ажиглалт.",
    choices: [
      { id: "t1", emoji: "👤", label: "Хүмүүс · харилцаа" },
      { id: "t2", emoji: "💼", label: "Ажил · сургууль" },
      { id: "t3", emoji: "💰", label: "Мөнгө · санхүү" },
      { id: "t4", emoji: "🏠", label: "Гэр бүл · гэр" },
      { id: "t5", emoji: "🌱", label: "Ирээдүй · амьдрал" },
    ],
  },
  {
    id: "impact",
    type: "single",
    title: "Тэр бодол сэтгэл санаанд чинь хэрхэн нөлөөлсөн бэ?",
    desc: "Эерэг ч байж болно, сөрөг ч байж болно.",
    choices: [
      { id: "i1", emoji: "⬆️", label: "Маш эерэг" },
      { id: "i2", emoji: "↗️", label: "Бага зэрэг эерэг" },
      { id: "i3", emoji: "➖", label: "Нөлөөгүй" },
      { id: "i4", emoji: "↘️", label: "Бага зэрэг сөрөг" },
      { id: "i5", emoji: "⬇️", label: "Маш сөрөг" },
    ],
  },
  {
    id: "body",
    type: "single",
    title: "Бие чинь одоо юу мэдрэгдэж байна?",
    desc: "Биеийн дохио — сэтгэлийн хэл.",
    choices: [
      { id: "b1", emoji: "🌿", label: "Тайван · сул" },
      { id: "b2", emoji: "🪢", label: "Чангаралт (хүзүү/мөр)" },
      { id: "b3", emoji: "🪨", label: "Хүнд · даралттай" },
      { id: "b4", emoji: "⚡️", label: "Тайван бус · тэсвэргүй" },
      { id: "b5", emoji: "🪫", label: "Ядарсан · сульдсан" },
    ],
  },
  {
    id: "energy",
    type: "single",
    title: "Эрч хүч чинь одоо ямар байна?",
    desc: "Өөрийгөө буруутгахгүйгээр үнэнээр нь сонго.",
    choices: [
      { id: "e1", emoji: "🪫", label: "Маш ядарсан" },
      { id: "e2", emoji: "▫️", label: "Ядарсан" },
      { id: "e3", emoji: "⚪️", label: "Хэвийн" },
      { id: "e4", emoji: "🔵", label: "Эрчтэй" },
      { id: "e5", emoji: "🔋", label: "Маш эрчтэй" },
    ],
  },
  {
    id: "feelings",
    type: "multi",
    title: "Одоо ямар мэдрэмжүүд давамгайлж байна вэ?",
    desc: "Дээд тал нь 3-г сонго.",
    maxPick: 3,
    choices: [
      { id: "f1", emoji: "😢", label: "Гуниг" },
      { id: "f2", emoji: "😟", label: "Түгшүүр" },
      { id: "f3", emoji: "😠", label: "Уур" },
      { id: "f4", emoji: "😌", label: "Амар тайван" },
      { id: "f5", emoji: "🌤️", label: "Найдвар" },
      { id: "f6", emoji: "🫥", label: "Хоосон" },
      { id: "f7", emoji: "🤍", label: "Дулаан" },
      { id: "f8", emoji: "🥺", label: "Эмзэг" },
    ],
  },
  {
    id: "need",
    type: "single",
    title: "Одоо чамд хамгийн хэрэгтэй зүйл юу вэ?",
    desc: "Зөвхөн ажиглалт.",
    choices: [
      { id: "n1", emoji: "🛌", label: "Амрах" },
      { id: "n2", emoji: "🌿", label: "Тайвшрах" },
      { id: "n3", emoji: "🚶‍♀️", label: "Хөдөлгөөн" },
      { id: "n4", emoji: "🗣️", label: "Хүнтэй холбогдох" },
      { id: "n5", emoji: "🌙", label: "Ганцаараа байх" },
    ],
  },
  {
    id: "color",
    type: "single",
    title: "Өнөөдрийн мэдрэмжээ ямар өнгөөр дүрслэх вэ?",
    desc: "Өнгө нь мэдрэмжийг нэрлэхэд тусалдаг.",
    choices: [
      { id: "c1", emoji: "🔵", label: "Цэнхэр" },
      { id: "c2", emoji: "🟢", label: "Ногоон" },
      { id: "c3", emoji: "🟡", label: "Шар" },
      { id: "c4", emoji: "🔴", label: "Улаан" },
      { id: "c5", emoji: "⚪️", label: "Цагаан" },
      { id: "c6", emoji: "⚫️", label: "Хар" },
    ],
  },
  {
    id: "identity",
    type: "multi",
    title: "Өөрийгөө ямар хүн гэж санаж байна вэ?",
    desc: "Дээд тал нь 3-г сонго.",
    maxPick: 3,
    choices: [
      { id: "p1", emoji: "🌱", label: "Хөгжиж байгаа" },
      { id: "p2", emoji: "🧠", label: "Ухаантай" },
      { id: "p3", emoji: "🤍", label: "Хүлээцтэй" },
      { id: "p4", emoji: "🪨", label: "Тэвчээртэй" },
      { id: "p5", emoji: "🔥", label: "Босож чаддаг" },
      { id: "p6", emoji: "💪", label: "Даван туулдаг" },
      { id: "p7", emoji: "🌤️", label: "Итгэлтэй байж чаддаг" },
    ],
  },
  {
    id: "finish",
    type: "single",
    title: "Өнөөдөртөө нэг өгүүлбэр амлалт сонгоё",
    desc: "Сүүлийн сонголт.",
    choices: [
      { id: "a1", emoji: "🫶", label: "Өөрийгөө буруутгахгүй" },
      { id: "a2", emoji: "🚶‍♀️", label: "Жижиг алхам хийнэ" },
      { id: "a3", emoji: "💧", label: "Биеэ сонсоно" },
      { id: "a4", emoji: "🌙", label: "Амрах эрхтэй" },
      { id: "a5", emoji: "🔥", label: "Босож чадна" },
    ],
  },
];

function buildMonthGrid(d = new Date()) {
  const year = d.getFullYear();
  const month = d.getMonth();

  const first = new Date(year, month, 1);
  const firstDow = (first.getDay() + 6) % 7; // Monday=0
  const start = new Date(year, month, 1 - firstDow);

  const days: Array<{ date: Date; iso: string; inMonth: boolean }> = [];
  for (let i = 0; i < 42; i++) {
    const cur = new Date(start);
    cur.setDate(start.getDate() + i);
    const iso = cur.toISOString().slice(0, 10);
    days.push({ date: cur, iso, inMonth: cur.getMonth() === month });
  }
  return { year, month, days };
}

export default function DailyCheckPage() {
  const router = useRouter();

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ✅ Шинэ: өнөөдрийн дүгнэлт + календарь явц
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

  function backToChat() {
    try {
      if (typeof window !== "undefined" && window.history.length > 1) router.back();
      else router.push("/"); // ⬅️ чат route өөр бол энд солиорой
    } catch {
      router.push("/");
    }
  }

  function cuteSummary(level: string, score: number) {
    if (level === "Green") return `Өнөөдөр чинь нэлээн тэнцвэртэй өдөр байна аа 🌿 (${score}/100)`;
    if (level === "Yellow") return `Өнөөдөр боломжийн байна, бага зэрэг савлагаатай ч дажгүй ээ 🌤️ (${score}/100)`;
    if (level === "Orange") return `Өнөөдөр жаахан ачаалалтай өдөр байна 😮‍💨 (${score}/100)`;
    return `Өнөөдөр чинь нэлээн хүнд санагдаж байж магадгүй… 🫂 (${score}/100)`;
  }

  function levelClass(level: string) {
    if (level === "Green") return styles.lvGreen;
    if (level === "Yellow") return styles.lvYellow;
    if (level === "Orange") return styles.lvOrange;
    return styles.lvRed;
  }

  async function refreshTrend() {
    setTrendLoading(true);
    try {
      const r = await fetch("/api/mind/emotion/daily-check", { method: "GET" });
      const j = await r.json();
      if (r.ok) {
        const items = (j.items ?? []) as any[];
        setTrend(items.map((x) => ({ check_date: x.check_date, score: x.score, level: x.level })));
      }
    } finally {
      setTrendLoading(false);
    }
  }

  // ✅ хуудас нээгдэхэд явцыг авчирна
  useEffect(() => {
    refreshTrend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function finish() {
    if (!canGoNext) return;
    setSaving(true);
    setErr(null);

    try {
      const res = await fetch("/api/mind/emotion/daily-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          check_date: todayISO(),
          answers,
        }),
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j?.error ?? "Хадгалах үед алдаа гарлаа");

      // ✅ өнөөдрийн дүгнэлт (шууд харуулна)
      const dateISO = todayISO();
      setResult({ score: j.score, level: j.level, dateISO });
      setPickedDate(dateISO);

      // ✅ календарь явцаа шинэчилнэ
      await refreshTrend();
    } catch (e: any) {
      setErr(e?.message ?? "Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  }

  // ✅ single дээр дармагц автоматаар дараагийн асуулт руу шилжинэ
  useEffect(() => {
    if (step.type !== "single") return;
    const v = answers[step.id] || [];
    if (v.length === 1 && idx < total - 1) {
      const t = setTimeout(() => goNext(), 160);
      return () => clearTimeout(t);
    }
  }, [answers, step.id, step.type, idx, total]); // eslint-disable-line react-hooks/exhaustive-deps

  const byDate = useMemo(() => new Map(trend.map((t) => [t.check_date, t] as const)), [trend]);

  const pickedItem = useMemo(() => {
    if (!pickedDate) return null;
    return byDate.get(pickedDate) ?? null;
  }, [pickedDate, byDate]);

  return (
    <main className={styles.cbtBody}>
      <div className={styles.container}>
        <header className={styles.header}>
          <button type="button" onClick={backToChat} className={styles.back} aria-label="Буцах">
            ←
          </button>

          <div className={styles.headMid}>
            <div className={styles.headTitle}>Өдрийн шалгалт</div>
            <div className={styles.headSub}>{progressText}</div>
          </div>

          <Link href="/" className={styles.chatBtn}>
            <span className={styles.chatIcon}>💬</span> Чат
          </Link>
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

          <div className={styles.nav}>
            <button className={styles.arrow} onClick={goPrev} disabled={idx === 0 || saving} aria-label="Өмнөх">
              ←
            </button>

            {!isLast ? (
              <button className={styles.arrow} onClick={goNext} disabled={!canGoNext || saving} aria-label="Дараах">
                →
              </button>
            ) : (
              <button className={styles.done} onClick={finish} disabled={!canGoNext || saving}>
                {saving ? "Хадгалж байна..." : "Боллоо"}
              </button>
            )}
          </div>

          <div className={styles.hint}>* Сонгоход автоматаар дараагийн асуулт руу шилжинэ.</div>

          {err ? <div className={styles.error}>⚠ {err}</div> : null}

          {/* ✅ ӨНӨӨДРИЙН ДҮГНЭЛТ */}
          {result ? (
            <div className={styles.resultCard}>
              <div className={styles.resultTitle}>Өнөөдрийн дүгнэлт</div>

              <div className={styles.resultLine}>{cuteSummary(result.level, result.score)}</div>

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
            </div>
          ) : null}

          {/* ✅ КАЛЕНДАРЬ ЯВЦ — үргэлж харагдана */}
          <div className={styles.trendCard}>
            <div className={styles.trendHead}>
              <div className={styles.trendTitle}>Явц (Календарь)</div>
              <div className={styles.trendSub}>{trendLoading ? "Уншиж байна…" : "Энэ сарын зураг"}</div>
            </div>

            {(() => {
              const { year, month, days } = buildMonthGrid(new Date());
              const monthName = new Date(year, month, 1).toLocaleString("mn-MN", { month: "long" });
              const today = todayISO();

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
            })()}
          </div>
        </section>
      </div>
    </main>
  );
}
