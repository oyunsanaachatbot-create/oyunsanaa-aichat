"use client";

import { useMemo, useRef, useState } from "react";
import styles from "../tests.module.css";

import type {
  TestDefinition,
  TestOptionValue,
  TestBand,
} from "@/lib/apps/relations/tests/types";

type Props = {
  test: TestDefinition;
  onClose?: () => void; // Дүгнэлт хаах үед "эхлэл" болгоход ашиглана
};

type ResultView = {
  pct01: number; // 0..1
  pct100: number; // 0..100
  band: TestBand | null;
};

export default function TestRunner({ test, onClose }: Props) {
  const total = test.questions.length;

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<(TestOptionValue | null)[]>(
    Array.from({ length: total }, () => null)
  );
  const [showResult, setShowResult] = useState(false);

  // авто-next давхардах (double click) асуудлаас хамгаална
  const lockRef = useRef(false);

  const current = test.questions[idx];
  const isLast = idx >= total - 1;

  const doneCount = useMemo(
    () => answers.filter((a) => a !== null).length,
    [answers]
  );

  const progressPct = useMemo(() => {
    if (total <= 0) return 0;
    return Math.round((doneCount / total) * 100);
  }, [doneCount, total]);

  // ✅ буцахад хувь буурна: idx биш, answers дээр суурилна
  const allDone = total > 0 && doneCount === total;

  const result: ResultView = useMemo(() => {
    const filled = answers.filter((a): a is TestOptionValue => a !== null);
    const sum = filled.reduce<number>((acc, v) => acc + Number(v), 0);

    // opt.value 1..4 гэж үзэж байна
    const max = filled.length * 4;
    const pct01 = max > 0 ? sum / max : 0;
    const pct100 = Math.round(pct01 * 100);

    const sorted = [...(test.bands ?? [])].sort((a, b) => a.minPct - b.minPct);
    let picked: TestBand | null = null;
    for (const b of sorted) if (pct01 >= b.minPct) picked = b;

    return { pct01, pct100, band: picked };
  }, [answers, test.bands]);

  function goPrev() {
    // idx буурахад progressPct автоматаар буурахгүй, зөвхөн answers буурахад буурна.
    // Энэ нь "хариулт өгсөн хэвээр" логик.
    setIdx((v) => Math.max(0, v - 1));
  }

  function pick(value: TestOptionValue) {
    if (!current) return;
    if (lockRef.current) return;

    // 1) эхлээд тэмдэглэнэ (радио будагдах боломж өгнө)
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });

    // 2) дараагийн алхам давхардахаас хамгаална
    lockRef.current = true;

    // 3) жижиг delay -> дараа нь next руу/эсвэл modal
    window.setTimeout(() => {
      try {
        // сүүлчийн асуулт дээр бол шууд дүгнэлт нээнэ
        if (idx >= total - 1) {
          if (total > 0) setShowResult(true);
          return;
        }
        setIdx((v) => Math.min(v + 1, total - 1));
      } finally {
        // дараагийн render-д дахин click зөвшөөрнө
        lockRef.current = false;
      }
    }, 160);
  }

  function closeResult() {
    setShowResult(false);

    // Тест эхлэл болгоно (reset)
    setIdx(0);
    setAnswers(Array.from({ length: total }, () => null));

    onClose?.();
  }

  if (!current || total === 0) return null;

  return (
    <div className={styles.runner}>
      <div className={styles.progressRow}>
        <div className={styles.progressMetaRow}>
          <div className={styles.progressMeta}>
            {Math.min(idx + 1, total)}/{total} • {progressPct}%
          </div>

          <button
            type="button"
            className={styles.prevBtn}
            onClick={goPrev}
            disabled={idx === 0}
            title={idx === 0 ? "Эхний асуулт" : "Өмнөх асуулт"}
          >
            Өмнөх
          </button>
        </div>

        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className={styles.qCard}>
        <div className={styles.qText}>{current.text}</div>

        <div className={styles.choices}>
          {current.options.map((opt, i) => {
            const active = answers[idx] === opt.value;

            return (
              <button
                key={`${idx}-${opt.value}-${i}`}
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

        {/* ✅ “Хариу/Дараах” товч байхгүй */}
        {/* Сүүлчийн асуулт дээр сонголт хиймэгц modal автоматаар нээгдэнэ */}
        {isLast && !allDone ? (
          <div className={styles.lastHint}>
            Сүүлчийн асуулт. Хариултаа сонгоод дуусгаарай.
          </div>
        ) : null}
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
              <div className={styles.modalSummary}>
                {result.band?.summary ?? "Тайлбар бэлдээгүй байна."}
              </div>

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
