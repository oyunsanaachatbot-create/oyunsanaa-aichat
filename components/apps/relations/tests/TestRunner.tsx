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

export type TestDefinition = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  questions: Question[];
  bands?: Band[];
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
const LS_KEY = "relations_tests_last_results_v1"; // map[testId] = RunResult

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function pickBand(bands: Band[] | undefined, pct: number) {
  if (!bands?.length) return undefined;
  const sorted = [...bands].sort((a, b) => b.minPct - a.minPct);
  return sorted.find((b) => pct >= b.minPct) ?? sorted[sorted.length - 1];
}

function loadAll(): Record<string, RunResult> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveOne(r: RunResult) {
  const all = loadAll();
  all[r.testId] = r;
  localStorage.setItem(LS_KEY, JSON.stringify(all));
}

function deleteOne(testId: string) {
  const all = loadAll();
  delete all[testId];
  localStorage.setItem(LS_KEY, JSON.stringify(all));
}

export default function TestRunner({
  test,
  onClose,
}: {
  test: TestDefinition;
  onClose: () => void;
}) {
  const total = test.questions.length;

  const maxScore = useMemo(() => {
    const perQ = test.questions.map((qq) =>
      Math.max(...qq.options.map((o) => o.value))
    );
    return perQ.reduce((a, b) => a + b, 0);
  }, [test.questions]);

  // ✅ Шууд асуултаар эхэлнэ
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<RunResult | null>(null);
  const [last, setLast] = useState<RunResult | null>(null);

  // test солигдоход reset
  useEffect(() => {
    const all = loadAll();
    setLast(all[test.id] ?? null);
    setIdx(0);
    setAnswers({});
    setResult(null);
  }, [test.id]);

  const answeredCount = Object.keys(answers).length;
  const progress = total ? clamp(answeredCount / total, 0, 1) : 0;

  const q = test.questions[idx];

  function choose(value: number) {
    if (!q) return;

    setAnswers((prev) => {
      const next = { ...prev, [q.id]: value };

      // ✅ Дармагц шууд дараагийн асуулт руу
      // Гэхдээ хамгийн сүүлчийн асуулт дээр auto-next хийхгүй
      if (idx < total - 1) {
        // жижиг delay: хэрэглэгч "дарсан" мэдрэмж авна
        setTimeout(() => setIdx((i) => Math.min(i + 1, total - 1)), 0);
      }
      return next;
    });
  }

  function compute(): RunResult {
    const score = test.questions.reduce(
      (sum, qq) => sum + (answers[qq.id] ?? 0),
      0
    );
    const pct = maxScore > 0 ? score / maxScore : 0;
    const band = pickBand(test.bands, pct);

    return {
      testId: test.id,
      testTitle: test.title,
      pct,
      score,
      maxScore,
      band,
      answered: answeredCount,
      total,
      createdAt: new Date().toISOString(),
      answers,
    };
  }

  function submit() {
    if (answeredCount < total) return;
    const r = compute();
    saveOne(r);
    setLast(r);
    setResult(r);
  }

  function removeLast() {
    deleteOne(test.id);
    setLast(null);
  }

  // ✅ ДҮГНЭЛТ (overlay маягийн card)
  if (result) {
    return (
      <div className={styles.wrap} style={{ ["--brand" as any]: BRAND }}>
        <div className={styles.resultCard}>
          <div className={styles.resultTop}>
            <div className={styles.resultTitle}>Дүгнэлт</div>
            <button className={styles.closeBtn} onClick={onClose}>
              Хаах
            </button>
          </div>

          <div className={styles.resultSub}>{test.title}</div>

          <div className={styles.scoreLine}>
            <div className={styles.bigPct}>{Math.round(result.pct * 100)}%</div>
            <div className={styles.muted}>
              Оноо: {result.score}/{result.maxScore}
            </div>
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

          <div className={styles.resultActions}>
            <button
              className={styles.ghostBtn}
              onClick={() => {
                setIdx(0);
                setAnswers({});
                setResult(null);
              }}
            >
              Дахин өгөх
            </button>
            <button className={styles.mainBtn} onClick={onClose}>
              Дуусгах
            </button>
          </div>

          {last ? (
            <div className={styles.lastBox}>
              <div className={styles.lastHead}>
                Сүүлд хадгалсан дүн
                <button className={styles.trashBtn} onClick={removeLast}>
                  Устгах
                </button>
              </div>
              <div className={styles.muted}>
                {new Date(last.createdAt).toLocaleString()} •{" "}
                {Math.round(last.pct * 100)}%
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // ✅ АСУУЛТУУД
  return (
    <div className={styles.wrap} style={{ ["--brand" as any]: BRAND }}>
      <div className={styles.card}>
        <div className={styles.head}>
          <div className={styles.headLeft}>
            <div className={styles.headTitle}>{test.title}</div>
            <div className={styles.headMeta}>
              {idx + 1}/{total} • {Math.round(progress * 100)}%
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            Хаах
          </button>
        </div>

        <div className={styles.progress}>
          <div
            className={styles.progressBar}
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {q ? (
          <div className={styles.qBox}>
            <div className={styles.qText}>
              <span className={styles.bullet} />
              {q.text}
            </div>

            <div className={styles.options}>
              {q.options.map((o) => {
                const active = answers[q.id] === o.value;
                return (
                  <button
                    key={`${q.id}:${o.value}`}
                    type="button"
                    className={`${styles.optBtn} ${
                      active ? styles.optActive : ""
                    }`}
                    onClick={() => choose(o.value)}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className={styles.footer}>
          <button
            className={styles.mainBtn}
            onClick={submit}
            disabled={answeredCount < total}
            title={answeredCount < total ? "Бүх асуултад хариулна уу" : ""}
          >
            Хариу
          </button>

          {last ? (
            <div className={styles.lastInline}>
              <span className={styles.muted}>
                Сүүлд: {Math.round(last.pct * 100)}% •{" "}
                {new Date(last.createdAt).toLocaleDateString()}
              </span>
              <button className={styles.linkBtn} onClick={removeLast}>
                Устгах
              </button>
            </div>
          ) : (
            <div className={styles.muted}>Сүүлд хадгалсан дүн алга</div>
          )}
        </div>
      </div>
    </div>
  );
}
