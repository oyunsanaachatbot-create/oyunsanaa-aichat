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

type Props = {
  test: TestDefinition;
};

type RunResult = {
  testId: string;
  testTitle: string;
  pct: number; // 0..1
  score: number;
  maxScore: number;
  band?: Band;
  answered: number;
  total: number;
  createdAt: string; // ISO
  answers: Record<string, number>;
};

const BRAND = "#1F6FB2";
const LS_KEY = "relations_tests_last_results_v2"; // map[testId] = RunResult

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function pickBand(bands: Band[] | undefined, pct: number) {
  if (!bands?.length) return undefined;
  const sorted = [...bands].sort((a, b) => b.minPct - a.minPct);
  return sorted.find((b) => pct >= b.minPct) ?? sorted[sorted.length - 1];
}

function loadLastResults(): Record<string, RunResult> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveLastResult(r: RunResult) {
  const all = loadLastResults();
  all[r.testId] = r;
  localStorage.setItem(LS_KEY, JSON.stringify(all));
}

function deleteLastResult(testId: string) {
  const all = loadLastResults();
  delete all[testId];
  localStorage.setItem(LS_KEY, JSON.stringify(all));
}

export default function TestRunner({ test }: Props) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [last, setLast] = useState<RunResult | null>(null);

  const total = test.questions.length;
  const q = test.questions[idx];

  // test солигдоход: бүх state-г reset (давхар “эхлэх” асуудлыг ингэж бүрэн арилгана)
  useEffect(() => {
    setIdx(0);
    setAnswers({});
    setShowResult(false);

    const all = loadLastResults();
    setLast(all[test.id] ?? null);
  }, [test.id]);

  const maxPerQ = useMemo(() => {
    return test.questions.map((qq) => Math.max(...qq.options.map((o) => o.value)));
  }, [test.questions]);

  const maxScore = useMemo(() => maxPerQ.reduce((a, b) => a + b, 0), [maxPerQ]);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  const progressPct = useMemo(() => {
    if (!total) return 0;
    return clamp(answeredCount / total, 0, 1);
  }, [answeredCount, total]);

  const isDone = answeredCount === total;

  function choose(value: number) {
    if (!q) return;

    setAnswers((prev) => {
      const next = { ...prev, [q.id]: value };
      return next;
    });

    // ✅ Сонгомогц автоматаар дараагийн асуулт руу
    if (idx < total - 1) {
      setIdx((i) => i + 1);
    }
  }

  function computeResult(currentAnswers: Record<string, number>): RunResult {
    const score = test.questions.reduce((sum, qq) => sum + (currentAnswers[qq.id] ?? 0), 0);
    const pct = maxScore > 0 ? score / maxScore : 0;
    const band = pickBand(test.bands, pct);

    return {
      testId: test.id,
      testTitle: test.title,
      pct,
      score,
      maxScore,
      band,
      answered: Object.keys(currentAnswers).length,
      total,
      createdAt: new Date().toISOString(),
      answers: currentAnswers,
    };
  }

  function openResult() {
    // хамгаалалт
    if (!isDone) return;

    const r = computeResult(answers);
    saveLastResult(r);
    setLast(r);
    setShowResult(true);
  }

  function closeResult() {
    setShowResult(false);
  }

  function resetRun() {
    setIdx(0);
    setAnswers({});
    setShowResult(false);
  }

  function removeSaved() {
    deleteLastResult(test.id);
    setLast(null);
    setShowResult(false);
  }

  return (
    <div className={styles.wrap} style={{ ["--brand" as any]: BRAND }}>
      {/* ---------- QUESTION CARD ---------- */}
      <div className={styles.card}>
        <div className={styles.headRow}>
          <div className={styles.headTitle}>{test.title}</div>
          <div className={styles.headMeta}>
            {idx + 1}/{total}
          </div>
        </div>

        <div className={styles.progress}>
          <div className={styles.progressBar} style={{ width: `${progressPct * 100}%` }} />
        </div>

        <div className={styles.qRow}>
          <div className={styles.qCircle}>{idx + 1}</div>
          <div className={styles.qText}>{q?.text}</div>
        </div>

        <div className={styles.options}>
          {q?.options.map((o) => {
            const active = answers[q.id] === o.value;
            return (
              <button
                key={o.label}
                type="button"
                className={`${styles.optBtn} ${active ? styles.optActive : ""}`}
                onClick={() => choose(o.value)}
              >
                {o.label}
              </button>
            );
          })}
        </div>

        {/* ---------- FINISH ---------- */}
        <div className={styles.footer}>
          <button className={styles.mainBtn} disabled={!isDone} onClick={openResult}>
            Хариу
          </button>

          {last ? (
            <div className={styles.lastHint}>
              Сүүлд хадгалсан дүн: <b>{Math.round(last.pct * 100)}%</b> •{" "}
              {new Date(last.createdAt).toLocaleDateString()}
            </div>
          ) : null}
        </div>
      </div>

      {/* ---------- RESULT MODAL ---------- */}
      {showResult && last && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalHead}>
              <div>
                <div className={styles.modalTitle}>Дүгнэлт</div>
                <div className={styles.modalSub}>{test.title}</div>
              </div>

              <button className={styles.closeBtn} onClick={closeResult} aria-label="Хаах">
                ✕
              </button>
            </div>

            <div className={styles.resultBox}>
              <div className={styles.bigPct}>{Math.round(last.pct * 100)}%</div>
              <div className={styles.muted}>
                Оноо: {last.score}/{last.maxScore}
              </div>

              {last.band ? (
                <>
                  <div className={styles.bandTitle}>{last.band.title}</div>
                  <div className={styles.desc}>{last.band.summary}</div>

                  {last.band.tips?.length ? (
                    <ul className={styles.tips}>
                      {last.band.tips.slice(0, 8).map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  ) : null}
                </>
              ) : (
                <div className={styles.muted}>Band тохиргоо алга.</div>
              )}
            </div>

            <div className={styles.modalActions}>
              <button className={styles.ghostBtn} onClick={resetRun}>
                Дахин өгөх
              </button>

              <button className={styles.dangerBtn} onClick={removeSaved}>
                Устгах
              </button>

              <button className={styles.mainBtn} onClick={closeResult}>
                Хаах
              </button>
            </div>

            <div className={styles.muted} style={{ marginTop: 10 }}>
              ✅ Дүгнэлт localStorage-д хадгалагдсан. (Supabase-г одоохондоо алгаслаа)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
