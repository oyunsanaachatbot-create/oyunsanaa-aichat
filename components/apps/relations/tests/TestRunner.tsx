"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./testsRunner.module.css";

type Option = { label: string; value: number };
type Question = { id: string; text: string; options: Option[] };

type Band = {
  minPct: number; // 0..1
  title: string;
  summary: string;
  tips?: string[];
};

type TestDefinition = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  questions: Question[];
  bands?: Band[];
};

type Props = { test: TestDefinition };

type RunResult = {
  testId: string;
  testTitle: string;
  pct: number; // 0..1
  score: number;
  maxScore: number;
  band?: Band;
  createdAt: string; // ISO
};

const BRAND = "#1F6FB2";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function pickBand(bands: Band[] | undefined, pct: number) {
  if (!bands?.length) return undefined;
  const sorted = [...bands].sort((a, b) => b.minPct - a.minPct);
  return sorted.find((b) => pct >= b.minPct) ?? sorted[sorted.length - 1];
}

export default function TestRunner({ test }: Props) {
  const total = test.questions.length;

  const [idx, setIdx] = useState(0);
  // ✅ ID биш, index-ээр хадгална (id давхцсан ч ажиллана)
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [result, setResult] = useState<RunResult | null>(null);

  useEffect(() => {
    setIdx(0);
    setAnswers(Array(test.questions.length).fill(null));
    setResult(null);
  }, [test.id, test.questions.length]);

  const q = test.questions[idx];

  const maxScore = useMemo(() => {
    // асуулт бүрийн хамгийн их value-ийг нийлбэрлэнэ
    return test.questions.reduce((sum, qq) => {
      const max = Math.max(...qq.options.map((o) => o.value));
      return sum + max;
    }, 0);
  }, [test.questions]);

  const answeredCount = useMemo(
    () => answers.filter((v) => v !== null).length,
    [answers]
  );

  const progressPct = useMemo(() => {
    if (!total) return 0;
    return clamp(answeredCount / total, 0, 1);
  }, [answeredCount, total]);

  const isLast = idx === total - 1;

  // ✅ “Тийм/Байнга” дээр гарах: value өндөрөөс нь эрэмбэлнэ (4→1)
  const orderedOptions = useMemo(() => {
    if (!q) return [];
    return [...q.options].sort((a, b) => b.value - a.value);
  }, [q]);

  function choose(value: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });

    // сонгомогц дараагийн асуулт
    if (idx < total - 1) setIdx((i) => i + 1);
  }

  function computeResult(): RunResult {
    const score = answers.reduce((sum, v) => sum + (v ?? 0), 0);
    const pct = maxScore > 0 ? score / maxScore : 0;
    const band = pickBand(test.bands, pct);

    return {
      testId: test.id,
      testTitle: test.title,
      pct,
      score,
      maxScore,
      band,
      createdAt: new Date().toISOString(),
    };
  }

  function finish() {
    if (answeredCount < total) return;
    setResult(computeResult());
  }

  function closeResult() {
    setResult(null);
    setIdx(0);
    setAnswers(Array(test.questions.length).fill(null));
  }

  return (
    <div className={styles.wrap} style={{ ["--brand" as any]: BRAND }}>
      <div className={styles.progressRow}>
        <div className={styles.progressText}>
          {answeredCount}/{total} • {Math.round(progressPct * 100)}%
        </div>
        <div className={styles.progress}>
          <div className={styles.progressBar} style={{ width: `${progressPct * 100}%` }} />
        </div>
      </div>

      {q ? (
        <div className={styles.qCard}>
          <div className={styles.qHead}>
            <div className={styles.qDot} />
            <div className={styles.qText}>{q.text}</div>
          </div>

          <div className={styles.options}>
            {orderedOptions.map((o) => (
              <button
                key={`${q.id}-${o.value}-${o.label}`}
                type="button"
                className={styles.optBtn}
                onClick={() => choose(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.empty}>Энэ тест дээр асуулт алга байна.</div>
      )}

      {isLast ? (
        <button
          className={styles.finishBtn}
          onClick={finish}
          disabled={answeredCount < total}
        >
          Хариу
        </button>
      ) : null}

      {result ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalTitle}>Дүгнэлт</div>
            <div className={styles.modalSub}>{test.title}</div>

            <div className={styles.bigPct}>{Math.round(result.pct * 100)}%</div>
            <div className={styles.muted}>
              Оноо: {result.score}/{result.maxScore}
            </div>

            {result.band ? (
              <div className={styles.bandBox}>
                <div className={styles.bandTitle}>{result.band.title}</div>
                <div className={styles.bandSummary}>{result.band.summary}</div>
                {result.band.tips?.length ? (
                  <ul className={styles.tips}>
                    {result.band.tips.slice(0, 6).map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <div className={styles.muted}>Band тохиргоо алга.</div>
            )}

            <button className={styles.closeBtn} onClick={closeResult}>
              Хаах
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
