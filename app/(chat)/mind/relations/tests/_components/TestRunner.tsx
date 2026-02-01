"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  pct01: number;
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

  // жижиг delay хийж active “дугуй” харагдуулаад дараа нь next рүү шилжинэ
  const nextTimerRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (nextTimerRef.current) window.clearTimeout(nextTimerRef.current);
    };
  }, []);

  const current = test.questions[idx];
  const isLast = idx >= total - 1;

  const doneCount = useMemo(
    () => answers.filter((a) => a !== null).length,
    [answers]
  );
  const allDone = total > 0 && doneCount === total;

  // ✅ PROGRESS: idx-ээс тооцно (буцахад багасна)
  // idx=0 => 0%, idx=1 => 10% (10 асуулттай үед)
  const progressPct = useMemo(() => {
    if (total <= 0) return 0;
    const pct = Math.round((idx / total) * 100);
    return Math.max(0, Math.min(100, pct));
  }, [idx, total]);

  const result: ResultView = useMemo(() => {
    const filled = answers.filter((a): a is TestOptionValue => a !== null);
    const sum = filled.reduce<number>((acc, v) => acc + Number(v), 0);
    const max = filled.length * 4;
    const pct01 = max > 0 ? sum / max : 0;
    const pct100 = Math.round(pct01 * 100);

    const sorted = [...(test.bands ?? [])].sort((a, b) => a.minPct - b.minPct);
    let picked: TestBand | null = null;
    for (const b of sorted) if (pct01 >= b.minPct) picked = b;

    return { pct01, pct100, band: picked };
  }, [answers, test.bands]);

  function pick(value: TestOptionValue) {
    if (nextTimerRef.current) window.clearTimeout(nextTimerRef.current);

    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });

    if (!isLast) {
      nextTimerRef.current = window.setTimeout(() => {
        setIdx((v) => Math.min(v + 1, total - 1));
      }, 140);
    }
  }

  // ✅ Өмнөх: route-той огт холбоогүй
  function goPrev() {
    if (nextTimerRef.current) window.clearTimeout(nextTimerRef.current);
    setIdx((v) => Math.max(0, v - 1));
  }

  function openResult() {
    // зөвхөн сүүлчийн асуулт дээр + бүгд бөглөгдсөн үед
    if (!isLast) return;
    if (!allDone) return;
    setShowResult(true);
  }

  function reset() {
    if (nextTimerRef.current) window.clearTimeout(nextTimerRef.current);
    setShowResult(false);
    setIdx(0);
    setAnswers(Array.from({ length: total }, () => null));
  }

  function closeResult() {
    reset();      // ✅ Хаахад эхнээсээ эхэлнэ
    onClose?.();  // дээрээс scrollTop хийх мэт
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

        {/* ✅ зөвхөн хамгийн сүүлд */}
        {isLast ? (
          <div className={styles.bottomBar}>
            <button
              type="button"
              className={styles.answerBtn}
              onClick={openResult}
              disabled={!allDone}
              title={allDone ? "" : "Бүх асуултад хариулаад дуусгаарай"}
            >
              Хариу
            </button>
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
