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
  // minPct өндөрөөс нь эрэмбэлээд сонгоно
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

export default function TestRunner({ test }: Props) {
  // mode: intro -> run -> result
  const [mode, setMode] = useState<"intro" | "run" | "result">("intro");
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [last, setLast] = useState<RunResult | null>(null);

  const total = test.questions.length;
  const q = test.questions[idx];

  // load last result for this test
  useEffect(() => {
    const all = loadLastResults();
    setLast(all[test.id] ?? null);
    setMode("intro");
    setIdx(0);
    setAnswers({});
  }, [test.id]);

  const maxPerQ = useMemo(() => {
    // option value-уудын хамгийн ихийг авч maxScore бодно
    // (ихэнхдээ 0..4 байдаг)
    return test.questions.map((qq) => Math.max(...qq.options.map((o) => o.value)));
  }, [test.questions]);

  const maxScore = useMemo(() => {
    return maxPerQ.reduce((a, b) => a + b, 0);
  }, [maxPerQ]);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  const progressPct = useMemo(() => {
    if (!total) return 0;
    return clamp(answeredCount / total, 0, 1);
  }, [answeredCount, total]);

  function start() {
    setMode("run");
    setIdx(0);
    setAnswers({});
  }

  function choose(value: number) {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
  }

  function next() {
    if (idx < total - 1) setIdx((i) => i + 1);
  }

  function back() {
    if (idx > 0) setIdx((i) => i - 1);
    else setMode("intro");
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
      answered: answeredCount,
      total,
      createdAt: new Date().toISOString(),
      answers,
    };
  }

  function finish() {
    // хамгаалалт: бүх асуулт хариулаагүй бол дуусгахгүй
    if (answeredCount < total) return;

    const r = computeResult();
    saveLastResult(r);
    setLast(r);
    setMode("result");

    // ✳️ Хэрвээ чи дараа нь Supabase-д хадгалах API нэмбэл энд fetch хийж болно:
    // fetch("/api/relations/tests/save", { method:"POST", headers:{...}, body: JSON.stringify(r) })
  }

  const selected = q ? answers[q.id] : undefined;
  const canNext = selected !== undefined;
  const isLast = idx === total - 1;
  const canFinish = answeredCount === total;

  return (
    <div className={styles.wrap} style={{ ["--brand" as any]: BRAND }}>
      {/* -------- INTRO -------- */}
      {mode === "intro" && (
        <div className={styles.card}>
          <div className={styles.top}>
            <div className={styles.title}>{test.title}</div>
            {test.subtitle ? <div className={styles.sub}>{test.subtitle}</div> : null}
          </div>

          {test.description ? <div className={styles.desc}>{test.description}</div> : null}

          {/* ✅ “Тест сонгоогүй үед ч дүгнэлт харагддаг” — энэ нь intro дээр Last result card */}
          {last ? (
            <div className={styles.lastBox}>
              <div className={styles.lastHead}>Сүүлд авсан дүн</div>
              <div className={styles.lastLine}>
                Дүн: <b>{Math.round(last.pct * 100)}%</b> ({last.score}/{last.maxScore})
              </div>
              {last.band ? (
                <>
                  <div className={styles.lastBand}>{last.band.title}</div>
                  <div className={styles.muted}>{last.band.summary}</div>
                </>
              ) : (
                <div className={styles.muted}>Дүгнэлтийн band тохируулаагүй байна.</div>
              )}
              <div className={styles.muted} style={{ marginTop: 6 }}>
                Огноо: {new Date(last.createdAt).toLocaleString()}
              </div>
            </div>
          ) : (
            <div className={styles.muted}>Сүүлд хадгалсан дүн алга. Доороос эхлүүлнэ үү.</div>
          )}

          <div className={styles.actions}>
            <button className={styles.mainBtn} onClick={start}>
              Тест эхлэх
            </button>
          </div>
        </div>
      )}

      {/* -------- RUN -------- */}
      {mode === "run" && q && (
        <div className={styles.card}>
          <div className={styles.runHead}>
            <button className={styles.backBtn} onClick={back} aria-label="Буцах">
              ←
            </button>

            <div className={styles.runMid}>
              <div className={styles.runTitle}>{test.title}</div>
              <div className={styles.runSub}>
                {idx + 1}/{total} • Дүүргэлт: {Math.round(progressPct * 100)}%
              </div>

              <div className={styles.progress}>
                <div className={styles.progressBar} style={{ width: `${progressPct * 100}%` }} />
              </div>
            </div>
          </div>

          <div className={styles.qBox}>
            <div className={styles.qText}>{q.text}</div>

            {/* ✅ option-уудыг “товч” болгоно — наалдахгүй */}
            <div className={styles.options}>
              {q.options.map((o) => {
                const active = selected === o.value;
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
          </div>

          <div className={styles.nav}>
            <button className={styles.ghostBtn} onClick={back}>
              Буцах
            </button>

            {!isLast ? (
              <button className={styles.mainBtn} onClick={next} disabled={!canNext}>
                Дараах
              </button>
            ) : (
              <button className={styles.mainBtn} onClick={finish} disabled={!canFinish}>
                Дуусгах
              </button>
            )}
          </div>
        </div>
      )}

      {/* -------- RESULT -------- */}
      {mode === "result" && last && (
        <div className={styles.card}>
          <div className={styles.title}>Дүгнэлт</div>
          <div className={styles.sub}>{test.title}</div>

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
                    {last.band.tips.slice(0, 5).map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <div className={styles.muted}>Band тохиргоо алга.</div>
            )}
          </div>

          <div className={styles.nav}>
            <button className={styles.ghostBtn} onClick={() => setMode("intro")}>
              Буцах
            </button>
            <button className={styles.mainBtn} onClick={start}>
              Дахин өгөх
            </button>
          </div>

          <div className={styles.muted} style={{ marginTop: 10 }}>
            ✅ Дүгнэлт хадгалагдлаа (localStorage). Дараа нь Supabase-д хадгалдаг болгоё.
          </div>
        </div>
      )}
    </div>
  );
}
