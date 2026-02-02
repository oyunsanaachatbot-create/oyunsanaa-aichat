"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "../tests.module.css";

import type {
  TestDefinition,
  TestOptionValue,
  TestBand,
} from "@/lib/apps/relations/tests/types";

// Хэрвээ энэ file path өөр байвал зөв зам руу нь тохируул
// import { saveLatestLocal } from "@/lib/apps/relations/tests/latest";

type Props = {
  test: TestDefinition;
  onClose?: () => void; // эхлэл рүү буцаахад ашиглана
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

  // ✅ таймер давхардахгүй
  const nextTimerRef = useRef<number | null>(null);

  // ✅ back event-д хамгийн шинэ idx хэрэгтэй
  const idxRef = useRef(0);
  useEffect(() => {
    idxRef.current = idx;
  }, [idx]);

  // ✅ showResult-ийг event handler дотор зөв уншихын тулд ref
  const showResultRef = useRef(false);
  useEffect(() => {
    showResultRef.current = showResult;
  }, [showResult]);

  // ✅ TEST СОЛИГДОХОД БҮРЭН RESET
  useEffect(() => {
    if (nextTimerRef.current) {
      window.clearTimeout(nextTimerRef.current);
      nextTimerRef.current = null;
    }
    setShowResult(false);
    setIdx(0);
    setAnswers(Array.from({ length: test.questions.length }, () => null));
  }, [test]);

  // ✅ TopBar "Буцах" event
  useEffect(() => {
    function onBack(e: Event) {
      e.preventDefault();

      if (nextTimerRef.current) {
        window.clearTimeout(nextTimerRef.current);
        nextTimerRef.current = null;
      }

      // ✅ 1) Result modal нээлттэй байвал эхлээд хаана
      if (showResultRef.current) {
        setShowResult(false);
        return;
      }

      const cur = idxRef.current;

      // ✅ 2) Дундаас буцах: зөвхөн idx-- (answers-г устгахгүй)
      if (cur > 0) {
        setIdx(cur - 1);
        return;
      }

      // ✅ 3) Эхний асуулт дээр: эхлэл рүү
      setShowResult(false);
      setIdx(0);
      setAnswers(Array.from({ length: test.questions.length }, () => null));
      onClose?.();
    }

    window.addEventListener("relations-tests-back", onBack as EventListener);
    return () => {
      window.removeEventListener(
        "relations-tests-back",
        onBack as EventListener
      );
    };
  }, [onClose, test]);

  const current = test.questions[idx];
  const isLast = idx === total - 1;

  const doneCount = useMemo(
    () => answers.filter((a) => a !== null).length,
    [answers]
  );

  // ✅ progress = answers дээр тулгуурлана
  const progressPct = useMemo(() => {
    if (total <= 0) return 0;
    return Math.round((doneCount / total) * 100);
  }, [doneCount, total]);

  // ✅ 3/4/5 сонголттой байсан ч зөв maxPerQ олно
  const maxPerQ = useMemo(() => {
    let m = 0;
    for (const q of test.questions) {
      for (const o of q.options) {
        const n = Number(o.value);
        if (Number.isFinite(n) && n > m) m = n;
      }
    }
    return m > 0 ? m : 4;
  }, [test]);

  const result: ResultView = useMemo(() => {
    const filled = answers.filter((a): a is TestOptionValue => a !== null);
    const sum = filled.reduce<number>((acc, v) => acc + Number(v), 0);
    const max = filled.length * maxPerQ;

    const pct01 = max > 0 ? sum / max : 0;
    const pct100 = Math.round(pct01 * 100);

    const sorted = [...(test.bands ?? [])].sort((a, b) => a.minPct - b.minPct);
    let picked: TestBand | null = null;
    for (const b of sorted) if (pct01 >= b.minPct) picked = b;

    return { pct01, pct100, band: picked };
  }, [answers, test, maxPerQ]);

  function pick(value: TestOptionValue) {
    const curIdx = idx;

    // ✅ 1) эхлээд тэмдэглэнэ
    setAnswers((prev) => {
      const next = [...prev];
      next[curIdx] = value;
      return next;
    });

    // ✅ 2) таймер давхардахгүй
    if (nextTimerRef.current) {
      window.clearTimeout(nextTimerRef.current);
      nextTimerRef.current = null;
    }

    // ✅ 3) сүүлийн асуулт биш бол автоматаар next
    if (curIdx < total - 1) {
      nextTimerRef.current = window.setTimeout(() => {
        setShowResult(false);
        setIdx((v) => Math.min(v + 1, total - 1));
        nextTimerRef.current = null;
      }, 140);
    }
  }

  const lastAnswered = isLast && answers[idx] !== null;
  const allDone = doneCount === total;

  function openResult() {
    // ✅ хамгийн зөв нөхцөл: бүх асуулт бөглөгдсөн үед л
    if (!allDone) return;
    setShowResult(true);
  }

  function closeResult() {
    // ✅ энд latest/localstore хадгалалт хийж болно
    // saveLatestLocal(test, result.pct100, result.band?.title ?? "", result.band?.summary ?? "");

    // дууссаны дараа эхлэл рүү буцаана
    setShowResult(false);
    setIdx(0);
    setAnswers(Array.from({ length: test.questions.length }, () => null));
    onClose?.();
  }

  if (!current || total === 0) return null;

  // ✅ showResult үед асуултын card-аа бүрэн нууж, зөвхөн modal харуулна
  if (showResult) {
    return (
      <div className={styles.runner}>
        <div className={styles.progressRow}>
          <div className={styles.progressMeta}>
            {/* ✅ 10/10 мөртлөө 90% гэдгийг бүр мөсөн тасална */}
            {doneCount}/{total} • {progressPct}%
          </div>

          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

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
      </div>
    );
  }

  // ✅ ЭНЭ доороос “асуултын UI”
  return (
    <div className={styles.runner}>
      <div className={styles.progressRow}>
        <div className={styles.progressMeta}>
          {/* ✅ 10/10 мөртлөө 90% гэдгийг бүр мөсөн тасална */}
          {doneCount}/{total} • {progressPct}%
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
                className={`${styles.choice} ${
                  active ? styles.choiceActive : ""
                }`}
                onClick={() => pick(opt.value)}
              >
                <span className={styles.radio} aria-hidden />
                <span className={styles.choiceLabel}>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* ✅ ЗӨВХӨН СҮҮЛЧИЙН АСУУЛТ ДЭЭР 1 “Дүгнэлт” товч */}
        {isLast ? (
          <div className={styles.bottomBar}>
            <button
              type="button"
              className={styles.answerBtn}
              onClick={openResult}
              disabled={!lastAnswered || !allDone}
            >
              Дүгнэлт
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
