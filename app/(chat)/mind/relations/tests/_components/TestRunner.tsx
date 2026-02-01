"use client";

import { useMemo, useState } from "react";
import styles from "../tests.module.css";

import type {
  TestDefinition,
  TestOptionValue,
  TestBand,
} from "@/lib/apps/relations/tests/types";

type Props = {
  test: TestDefinition;
  onClose?: () => void;
};

type ResultView = {
  pct100: number;
  band: TestBand | null;
};

export default function TestRunner({ test, onClose }: Props) {
  const total = test.questions.length;

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<(TestOptionValue | null)[]>(
    Array.from({ length: total }, () => null)
  );
  const [showResult, setShowResult] = useState(false);

  const current = test.questions[idx];
  const isLast = idx === total - 1;

  const progressPct = useMemo(() => {
    if (total <= 0) return 0;
    return Math.round((idx / total) * 100); // ✅ буцахад багасна
  }, [idx, total]);

  const allDone = useMemo(
    () => answers.every((a) => a !== null),
    [answers]
  );

  const result: ResultView = useMemo(() => {
    const filled = answers.filter((a): a is TestOptionValue => a !== null);
    const sum = filled.reduce<number>((acc, v) => acc + Number(v), 0);
    const max = filled.length * 4;
    const pct100 = max > 0 ? Math.round((sum / max) * 100) : 0;

    const sorted = [...(test.bands ?? [])].sort((a, b) => a.minPct - b.minPct);
    let picked: TestBand | null = null;
    for (const b of sorted) if (pct100 >= Math.round(b.minPct * 100)) picked = b;

    return { pct100, band: picked };
  }, [answers, test.bands]);

  function pick(v: TestOptionValue) {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = v;
      return next;
    });
  }

  function goPrev() {
    setIdx((v) => Math.max(0, v - 1));
  }

  function goNext() {
    if (answers[idx] === null) return; // ✅ сонголтгүй бол дараах руу явуулахгүй
    setIdx((v) => Math.min(total - 1, v + 1));
  }

  function openResult() {
    if (!isLast) return;
    if (!allDone) return;
    setShowResult(true);
  }

  function closeResult() {
    setShowResult(false);
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
            {idx + 1}/{total} • {progressPct}%
          </div>

          <button
            type="button"
            className={styles.prevBtn}
            onClick={goPrev}
            disabled={idx === 0}
          >
            Өмнөх
          </button>
        </div>

        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
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

        <div className={styles.bottomBar}>
          {!isLast ? (
            <button
              type="button"
              className={styles.nextBtn}
              onClick={goNext}
              disabled={answers[idx] === null}
            >
              Дараах
            </button>
          ) : (
            <button
              type="button"
              className={styles.answerBtn}
              onClick={openResult}
              disabled={!allDone}
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
              <div className={styles.modalSummary}>
                {result.band?.summary ?? "Тайлбар бэлдээгүй байна."}
              </div>

              {result.band?.tips?.length ? (
                <ul className={styles.modalTips}>
                  {result.band.tips.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              ) : null}
            </div>

            <button className={styles.modalClose} type="button" onClick={closeResult}>
              Хаах
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
