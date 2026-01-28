"use client";

import { useMemo, useState } from "react";
import styles from "@/app/(chat)/mind/relations/tests/tests.module.css";

import type { TestDefinition, TestOptionValue } from "@/lib/apps/relations/tests/types";
import { saveLatestLocal } from "@/lib/apps/relations/tests/localStore";

type Props = { test: TestDefinition };

export default function TestRunner({ test }: Props) {
  const total = test.questions.length;

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, TestOptionValue | undefined>>({});

  const current = test.questions[step];

  const picked = answers[current.id];

  const progressPct = Math.round(((step + 1) / total) * 100);

  const { pct, band } = useMemo(() => {
    const vals = test.questions.map((q) => answers[q.id]).filter((v): v is TestOptionValue => v !== undefined);
    if (vals.length !== total) return { pct: 0, band: null as null | { title: string; summary: string; tips: string[] } };

 const sum = vals.reduce((a, b) => a + b, 0);


    const max = total * 4;
    const pct = Math.round((sum / max) * 100);

    const sorted = [...test.bands].sort((a, b) => b.minPct - a.minPct);
    const found = sorted.find((x) => pct >= x.minPct) ?? sorted[sorted.length - 1];

    return { pct, band: { title: found.title, summary: found.summary, tips: found.tips } };
  }, [answers, test]);

  const isDone = Object.values(answers).filter((v) => v !== undefined).length === total;

  function choose(value: TestOptionValue) {
    setAnswers((prev) => ({ ...prev, [current.id]: value }));
  }

  function prev() {
    setStep((s) => Math.max(0, s - 1));
  }

  function next() {
    setStep((s) => Math.min(total - 1, s + 1));
  }

  function finish() {
    if (!band) return;
    saveLatestLocal(test, pct, band.title, band.summary);
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <h1 className={styles.q}>{test.title}</h1>
        <p className={styles.desc}>{test.description}</p>

        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
        </div>

        <p className={styles.hint}>
          {step + 1}/{total} • {progressPct}%
        </p>
      </div>

      <h2 className={styles.q} style={{ fontSize: 18 }}>
        {current.text}
      </h2>

      <div className={styles.options}>
        {current.options.map((o) => (
          <button
            key={o.label}
            type="button"
            className={`${styles.option} ${picked === o.value ? styles.on : ""}`}
            onClick={() => choose(o.value)}
          >
            <div className={styles.left}>
              <span className={styles.label}>{o.label}</span>
            </div>
            <span className={styles.tick}>{picked === o.value ? "✓" : ""}</span>
          </button>
        ))}
      </div>

      <div className={styles.nav}>
        <button className={styles.arrow} type="button" onClick={prev} disabled={step === 0}>
          ←
        </button>

        {step < total - 1 ? (
          <button className={styles.arrow} type="button" onClick={next} disabled={picked === undefined}>
            →
          </button>
        ) : (
          <button className={styles.done} type="button" onClick={finish} disabled={!isDone}>
            Дуусгах
          </button>
        )}
      </div>

      {band ? (
        <div className={styles.resultCard}>
          <div className={styles.resultTitle}>Дүгнэлт ({pct}%)</div>
          <div className={styles.resultLine}>{band.title}</div>

          <div className={styles.resultDetail}>{band.summary}</div>

          <div className={styles.resultMeta}>
            <div>
              <div className={styles.praise}>Жижиг зөвлөмж</div>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                {band.tips.map((t) => (
                  <li key={t} style={{ marginBottom: 6 }}>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.oyLine}>
              Оюунсанаа: “Хэрэв хүсвэл энэ дүгнэлтийг чат дээрээ авчраад цааш нь хамт ярилцаж болно шүү.”
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
