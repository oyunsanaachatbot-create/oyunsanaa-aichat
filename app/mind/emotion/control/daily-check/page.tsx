"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./cbt.module.css";

const STORAGE_KEY = "oy_daily_check_entries_v1";

type Choice = { id: string; label: string; emoji?: string };
type Step =
  | { id: string; type: "single"; title: string; desc?: string; choices: Choice[] }
  | { id: string; type: "multi"; title: string; desc?: string; maxPick: number; choices: Choice[] };

type Entry = {
  dateISO: string; // YYYY-MM-DD
  answers: Record<string, string[]>;
  createdAt: number;
};

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function loadEntries(): Entry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const v = JSON.parse(raw || "[]");
    return Array.isArray(v) ? (v as Entry[]) : [];
  } catch {
    return [];
  }
}

function saveEntry(entry: Entry) {
  const list = loadEntries().filter((e) => e.dateISO !== entry.dateISO);
  list.push(entry);
  list.sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// ✅ 10 асуулт — БҮГД 5+ хариулт
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
    desc: "Жижиг алхам байхад хангалттай.",
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
      { id: "c1", emoji: "🔵", label: "Цэнхэр (тайван/гуниг)" },
      { id: "c2", emoji: "🟢", label: "Ногоон (амар/тэнцвэр)" },
      { id: "c3", emoji: "🟡", label: "Шар (эрч/найдвар)" },
      { id: "c4", emoji: "🔴", label: "Улаан (хүчтэй/уур)" },
      { id: "c5", emoji: "⚪️", label: "Цагаан (тод/шинэ)" },
      { id: "c6", emoji: "⚫️", label: "Хар (хүнд/ядарсан)" },
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
    desc: "Чиний сэтгэл санаа ямар ч байсан — чи өөрийгөө олж чадна.",
    choices: [
      { id: "a1", emoji: "🫶", label: "Өөрийгөө буруутгахгүй" },
      { id: "a2", emoji: "🚶‍♀️", label: "Жижиг алхам хийнэ" },
      { id: "a3", emoji: "💧", label: "Биеэ сонсоно" },
      { id: "a4", emoji: "🌙", label: "Амрах эрхтэй" },
      { id: "a5", emoji: "🔥", label: "Босож чадна" },
    ],
  },
];

export default function DailyCheckPage() {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [saved, setSaved] = useState(false);

  const step = STEPS[idx];
  const total = STEPS.length;
  const progressText = `${idx}/${total} · ${Math.round((idx / total) * 100)}%`;

  const canGoNext = useMemo(() => {
    const v = answers[step.id] || [];
    return v.length > 0;
  }, [answers, step.id]);

  const isLast = idx === total - 1;

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
    setSaved(false);
    setIdx((n) => Math.max(0, n - 1));
  }

  function goNext() {
    if (!canGoNext) return;
    setSaved(false);
    setIdx((n) => Math.min(total - 1, n + 1));
  }

  function finish() {
    if (!canGoNext) return;
    saveEntry({ dateISO: todayISO(), answers, createdAt: Date.now() });
    setSaved(true);
  }

  // ✅ single дээр дармагц автоматаар дараагийн асуулт руу шилжинэ
  useEffect(() => {
    if (step.type !== "single") return;
    const v = answers[step.id] || [];
    if (v.length === 1 && idx < total - 1) {
      const t = setTimeout(() => goNext(), 180);
      return () => clearTimeout(t);
    }
  }, [answers, step.id, step.type, idx, total]);

  return (
    <main className={styles.cbtBody}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/mind/emotion/control/daily-check" className={styles.back} aria-label="Буцах">
            ←
          </Link>

          <div className={styles.headMid}>
            <div className={styles.headTitle}>Өдрийн шалгалт</div>
            <div className={styles.headSub}>{progressText}</div>
          </div>

          <Link href="/" className={styles.chatBtn}>
            <span className={styles.chatIcon}>💬</span> Чат
          </Link>
        </header>

        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${Math.round(((idx + 0.25) / total) * 100)}%` }}
          />
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
            <button
              className={styles.arrow}
              onClick={goPrev}
              disabled={idx === 0}
              aria-label="Өмнөх"
            >
              ←
            </button>

            {!isLast ? (
              <button
                className={styles.arrow}
                onClick={goNext}
                disabled={!canGoNext}
                aria-label="Дараах"
              >
                →
              </button>
            ) : (
              <button className={styles.done} onClick={finish} disabled={!canGoNext}>
                Боллоо
              </button>
            )}
          </div>

          <div className={styles.hint}>
            * Сонгоход автоматаар дараагийн асуулт руу шилжинэ.
          </div>

          {saved ? (
            <div className={styles.saved}>
              ✓ Өнөөдрийн шалгалт хадгалагдлаа ·{" "}
              <Link className={styles.link} href="/mind/emotion/control/daily-check/report">
                Явцаа харах
              </Link>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
