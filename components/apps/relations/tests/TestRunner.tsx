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
  onClose?: () => void; // хаахад (эхлэл рүү буцаах гэх мэт)
};

type ResultView = {
  pct01: number; // 0..1
  pct100: number; // 0..100
  band?: TestBand;
};

export default function TestRunner({ test, onClose }: Props) {
  const total = test?.questions?.length ?? 0;

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<TestOptionValue[]>([]);
  const [showResult, setShowResult] = useState(false);

  const q = test?.questions?.[idx];

  const answeredCount = answers.filter((v) => v !== undefined).length;
  const progress01 = total > 0 ? Math.min(answeredCount / total, 1) : 0;
  const progressPct = Math.round(progress01 * 100);

  const isDone = total > 0 && answeredCount >= total;

  const result: ResultView = useMemo(() => {
    const sum = answers.reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
    const max = total * 4;
    const pct01 = max > 0 ? sum / max : 0;
    const pct100 = Math.round(pct01 * 100);

    // bands: minPct нь 0..1 (фракц) гэж types.ts дээр байна
    const sorted = [...(test?.bands ?? [])].sort((a, b) => a.minPct - b.minPct);
    let picked: TestBand | undefined = undefined;
    for (const b of sorted) {
      if (pct01 >= b.minPct) picked = b;
    }

    return { pct01, pct100, band: picked };
  }, [answers, total, test?.bands]);

  function pick(value: TestOptionValue) {
    if (!q) return;

    const next = answers.slice();
    next[idx] = value;
    setAnswers(next);

    // дараагийн асуулт руу автоматаар шилжинэ (сүүлч дээр бол дуусна)
    const nextIdx = idx + 1;
    if (nextIdx < total) {
      setIdx(nextIdx);
      return;
    }
    // дууссан — “Хариу” товч гарна (modal автоматаар нээхгүй)
  }

  function openResult() {
    if (!isDone) return;
    setShowResult(true);
  }

  function closeResult() {
    // хаахад тестийн эхлэл рүү буцаана
    setShowResult(false);
    setIdx(0);
    setAnswers([]);
    onClose?.();
  }

  if (!test || total === 0) return null;

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div className={styles.headTitle}>{test.title}</div>
        <div className={styles.headMeta}>
          {Math.min(idx + 1, total)}/{total} • {progressPct}%
        </div>
      </div>

      <div className={styles.progressTrack}>
        <div
          className={styles.progressFill}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Асуулт */}
      {q ? (
        <div className={styles.qCard}>
          <div className={styles.qText}>{q.text}</div>

          <div className={styles.choices}>
            {q.options.map((c) => {
              const active = answers[idx] === c.value;
              return (
                <button
                  key={`${q.id}-${c.value}`}
                  type="button"
                  className={`${styles.choice} ${
                    active ? styles.choiceActive : ""
                  }`}
                  onClick={() => pick(c.value)}
                >
                  <span className={styles.radio} aria-hidden />
                  <span className={styles.choiceLabel}>{c.label}</span>
                </button>
              );
            })}
          </div>

          {/* Дууссан үед “Хариу” товч */}
          {isDone ? (
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={openResult}
              >
                Хариу
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ДҮГНЭЛТ MODAL */}
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
                {result.band?.summary ?? ""}
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
