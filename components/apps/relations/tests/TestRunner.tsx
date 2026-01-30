"use client";

import { useMemo, useState } from "react";
import styles from "@/app/(chat)/mind/relations/tests/tests.module.css";
import type { TestDefinition } from "@/lib/apps/relations/tests/types";

type Props = {
  test: TestDefinition;
  onClose?: () => void;
};

export default function TestRunner({ test, onClose }: Props) {
  const total = test.questions.length;

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<null | {
    scorePct: number;
    title: string;
    body: string;
  }>(null);

  const q = test.questions[idx];

  const progressPct = useMemo(() => {
    if (!total) return 0;
    return Math.round(((idx + 1) / total) * 100);
  }, [idx, total]);

  function pick(value: number) {
    const nextAnswers = [...answers];
    nextAnswers[idx] = value;
    setAnswers(nextAnswers);

    const nextIdx = idx + 1;
    if (nextIdx < total) {
      setIdx(nextIdx);
      return;
    }

    // --- дууслаа: score бодно ---
    const sum = nextAnswers.reduce((a, b) => a + (b ?? 0), 0);
    const max = total * 4;
    const pct = max ? Math.round((sum / max) * 100) : 0;

    const r =
      test.results?.find((x) => pct >= x.min && pct <= x.max) ?? {
        title: "Дүгнэлт",
        body: "Тайлбар бэлдээгүй байна.",
      };

    setResult({
      scorePct: pct,
      title: r.title,
      body: r.body,
    });
  }

  function closeResult() {
    setResult(null);
    setIdx(0);
    setAnswers([]);
    onClose?.();
  }

  if (!q) return null;

  return (
    <div className={styles.wrap}>
      {/* header */}
      <div className={styles.head}>
        <div className={styles.headTitle}>{test.title}</div>
        <div className={styles.headMeta}>
          {idx + 1}/{total} · {progressPct}%
        </div>
      </div>

      {/* progress */}
      <div className={styles.progressTrack}>
        <div
          className={styles.progressFill}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* question */}
      <div className={styles.qCard}>
        <div className={styles.qText}>{q.text}</div>

        <div className={styles.choices}>
          {q.choices.map((c) => {
            const active = answers[idx] === c.value;
            return (
              <button
                key={c.value}
                type="button"
                className={`${styles.choice} ${
                  active ? styles.choiceActive : ""
                }`}
                onClick={() => pick(c.value)}
              >
                <span className={styles.radio} />
                <span className={styles.choiceLabel}>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* result modal */}
      {result && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalTitle}>Дүн</div>
            <div className={styles.modalScore}>{result.scorePct}%</div>
            <div className={styles.modalBoxTitle}>{result.title}</div>
            <div className={styles.modalBody}>{result.body}</div>

            <button
              className={styles.modalClose}
              type="button"
              onClick={closeResult}
            >
              Хаах
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
