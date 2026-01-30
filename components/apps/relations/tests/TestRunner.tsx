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
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<RunResult | null>(null);

  // тест солигдоход reset
  useEffect(() => {
    setIdx(0);
    setAnswers({});
    setResult(null);
  }, [test.id]);

  const q = test.questions[idx];

  const maxPerQ = useMemo(() => {
    return test.questions.map((qq) => Math.max(...qq.options.map((o) => o.value)));
  }, [test.questions]);

  const maxScore = useMemo(() => maxPerQ.reduce((a, b) => a + b, 0), [maxPerQ]);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  const progressPct = useMemo(() => {
    if (!total) return 0;
    return clamp(answeredCount / total, 0, 1);
  }, [answeredCount, total]);

  const isLast = idx === total - 1;
  const canAnswer = !!q;

  function choose(value: number) {
    if (!q) return;

    setAnswers((prev) => {
      const next = { ...prev, [q.id]: value };
      return next;
    });

    // ✅ сонгомогц автоматаар дараагийн асуулт
    if (idx < total - 1) {
      setIdx((i) => i + 1);
    }
  }

  function computeResult(): RunResult {
    const score = test.questions.reduce((sum, qq) => sum + (answers[qq.id] ?? 0), 0);
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
    // хамгаалалт: бүгдийг бөглөөгүй бол дүгнэлт гаргахгүй
    if (answeredCount < total) return;
    setResult(computeResult());
  }

  function closeResult() {
    setResult(null);
    // хүсвэл буцаад эхнээс:
    setIdx(0);
    setAnswers({});
  }

  return (
    <div className={styles.wrap} style={{ ["--brand" as any]: BRAND }}>
      {/* PROGRESS */}
      <div className={styles.progressRow}>
        <div className={styles.progressText}>
          {Math.min(answeredCount + (idx > answeredCount ? 0 : 0), total)}/{total} • {Math.round(progressPct * 100)}%
        </div>
        <div className={styles.progress}>
          <div className={styles.progressBar} style={{ width: `${progressPct * 100}%` }} />
        </div>
      </div>

      {/* QUESTION */}
      {canAnswer ? (
        <div className={styles.qCard}>
          <div className={styles.qHead}>
            <div className={styles.qDot} />
            <div className={styles.qText}>{q.text}</div>
          </div>

          <div className={styles.options}>
            {q.options.map((o) => (
              <button
                key={o.label}
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

      {/* FINISH BUTTON (зөвхөн сүүлийн асуулт дээр) */}
      {isLast ? (
        <button className={styles.finishBtn} onClick={finish} disabled={answeredCount < total}>
          Хариу
        </button>
      ) : null}

      {/* RESULT MODAL */}
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
