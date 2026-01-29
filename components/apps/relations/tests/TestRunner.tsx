"use client";

import { useMemo, useState } from "react";
import type { TestDefinition, TestOptionValue } from "@/lib/apps/relations/tests/types";
import styles from "@/app/(chat)/mind/relations/tests/tests.module.css";

type Answers = Record<string, TestOptionValue | undefined>;

export default function TestRunner({ test }: { test: TestDefinition }) {
  const totalQ = test.questions.length;

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const current = test.questions[idx];

  const { pct, band, isDone } = useMemo(() => {
    const vals = Object.values(answers).filter((v): v is TestOptionValue => v !== undefined);
    const sum = vals.reduce((s, v) => s + Number(v), 0);

    const maxPerQ = 4; // TestOptionValue: 0..4
    const max = totalQ * maxPerQ;
    const pct = max === 0 ? 0 : sum / max;

    const sorted = [...test.bands].sort((a, b) => b.minPct - a.minPct);
    const found = sorted.find((b) => pct >= b.minPct) ?? sorted[sorted.length - 1];

    const isDone = vals.length === totalQ;

    return { pct, band: found, isDone };
  }, [answers, test.bands, totalQ]);

  function pick(value: TestOptionValue) {
    setAnswers((prev) => ({ ...prev, [current.id]: value }));
  }

  function next() {
    setIdx((v) => Math.min(v + 1, totalQ - 1));
  }

  function back() {
    setIdx((v) => Math.max(v - 1, 0));
  }

  return (
    <div className={styles.cbtBody}>
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.back} onClick={back} aria-label="Буцах">
            ←
          </button>

          <div className={styles.headMid}>
            <div className={styles.headTitle}>{test.title}</div>
            <div className={styles.headSub}>
              {test.subtitle} · {idx + 1}/{totalQ}
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.q}>{current.text}</div>

          <div className={styles.choices}>
            {current.options.map((opt) => {
              const active = answers[current.id] === opt.value;
              return (
                <button
                  key={String(opt.value)}
                  className={active ? `${styles.choice} ${styles.choiceActive}` : styles.choice}
                  onClick={() => pick(opt.value)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className={styles.footer}>
            <div className={styles.progress}>
              <div className={styles.progressLabel}>Дүүргэлт: {(pct * 100).toFixed(0)}%</div>
            </div>

            <div className={styles.actions}>
              <button className={styles.btn} onClick={back} disabled={idx === 0}>
                Буцах
              </button>
              <button
                className={styles.btnPrimary}
                onClick={next}
                disabled={idx === totalQ - 1 || answers[current.id] === undefined}
              >
                Дараах
              </button>
            </div>
          </div>
        </div>

        {isDone && (
          <div className={styles.card} style={{ marginTop: 12 }}>
            <div className={styles.q}>{band.title}</div>
            <p className={styles.desc}>{band.summary}</p>
            <ul>
              {band.tips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
