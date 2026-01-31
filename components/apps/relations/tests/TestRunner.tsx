"use client";

import { useMemo, useState } from "react";
import styles from "@/app/(chat)/mind/relations/tests/tests.module.css";
import type {
  TestDefinition,
  TestOptionValue,
  TestBand,
} from "@/lib/apps/relations/tests/types";

type Props = {
  test: TestDefinition;
  onClose?: () => void; // дуусгаад хаах үед parent-д мэдэгдэх (optional)
};

type ResultView = {
  pct01: number; // 0..1
  pct100: number; // 0..100
  band: TestBand | null;
};

export default function TestRunner({ test, onClose }: Props) {
  const total = test.questions.length;

  // Answer-ууд TestOptionValue (0..4) байх ёстой
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<(TestOptionValue | null)[]>(
    Array.from({ length: total }, () => null)
  );

  // “Хариу” товч зөвхөн сүүлчийн асуулт дээр гарна
  const isLast = idx >= total - 1;
  const current = test.questions[idx];
  const currentPicked = answers[idx] !== null;

  const progressPct = useMemo(() => {
    if (total <= 0) return 0;
    const done = answers.filter((a) => a !== null).length;
    return Math.round((done / total) * 100);
  }, [answers, total]);

  // Дүгнэлт modal
  const [showResult, setShowResult] = useState(false);

  const result: ResultView = useMemo(() => {
    const filled = answers.filter((a): a is TestOptionValue => a !== null);
    const sum = filled.reduce((acc, v) => acc + Number(v), 0);
    const max = filled.length * 4; // 1 асуулт max=4
    const pct01 = max > 0 ? sum / max : 0;
    const pct100 = Math.round(pct01 * 100);

    // band сонгох: minPct (0..1) хамгийн өндөр таарсныг авах
    const sorted = [...(test.bands ?? [])].sort((a, b) => a.minPct - b.minPct);
    let picked: TestBand | null = null;
    for (const b of sorted) {
      if (pct01 >= b.minPct) picked = b;
    }
    return { pct01, pct100, band: picked };
  }, [answers, test.bands]);

  function pick(value: TestOptionValue) {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });

    // Сүүлчийн асуулт биш бол автоматаар дараагийн асуулт руу шилжинэ
    if (!isLast) setIdx((v) => Math.min(v + 1, total - 1));
  }

  function openResult() {
    // зөвхөн бүх асуулт бөглөгдсөн үед
    const done = answers.every((a) => a !== null);
    if (!done) return;
    setShowResult(true);
  }

  function closeResult() {
    // Хаахад тестийн эхэнд очно (чи ингэж хүссэн)
    setShowResult(false);
    setIdx(0);
    setAnswers(Array.from({ length: total }, () => null));
    onClose?.();
  }

  function goPrev() {
    setIdx((v) => Math.max(0, v - 1));
  }
  function goNext() {
    setIdx((v) => Math.min(total - 1, v + 1));
  }

  if (!current || total === 0) return null;

  return (
    <div className={styles.wrap}>
      {/* ДАВХАР том гарчигнуудыг болиулна:
          энд зөвхөн явц + асуулт л байна */}
      <div className={styles.progressTrack}>
        <div
          className={styles.progressFill}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className={styles.qCard}>
        <div className={styles.headMeta}>
          {Math.min(idx + 1, total)}/{total} • {progressPct}%
        </div>

        <div className={styles.qText}>{current.text}</div>

        <div className={styles.choices}>
          {current.options.map((opt) => {
            const active = answers[idx] === opt.value;
            return (
              <button
                key={`${idx}-${opt.value}`}
                type="button"
                className={`${styles.choice} ${active ? styles.choiceActive : ""}`}
                onClick={() => pick(opt.value)}
              >
                <span className={styles.radio} aria-hidden />
                <span className={styles.choiceLabel}>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Navigation + “Хариу” */}
        <div className={styles.footerRow}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={goPrev}
            disabled={idx === 0}
          >
            Буцах
          </button>

          {!isLast ? (
            <button
              type="button"
              className={styles.navBtn}
              onClick={goNext}
              disabled={!currentPicked}
              title={!currentPicked ? "Эхлээд хариултаа сонго" : ""}
            >
              Дараах
            </button>
          ) : (
            <button
              type="button"
              className={styles.answerBtn}
              onClick={openResult}
              disabled={!answers.every((a) => a !== null)}
              title={
                answers.every((a) => a !== null)
                  ? ""
                  : "Бүх асуултад хариулаад дараарай"
              }
            >
              Хариу
            </button>
          )}
        </div>
      </div>

      {showResult ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalTitle}>Дүгнэлт</div>
            <div className={styles.modalScore}>{result.pct100}%</div>

            <div className={styles.modalBoxTitle}>
              {result.band?.title ?? "Дүгнэлт"}
            </div>
            <div className={styles.modalBody}>
              {result.band?.summary ?? "Тайлбар бэлдээгүй байна."}
              {result.band?.tips?.length ? (
                <ul className={styles.modalTips}>
                  {result.band.tips.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              ) : null}
            </div>

            <button
              className={styles.modalClose}
              type="button"
              onClick={closeResult}
            >
              Хаах
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
