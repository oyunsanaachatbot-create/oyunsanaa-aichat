"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "../tests.module.css";

import type {
  TestDefinition,
  TestOptionValue,
  TestBand,
} from "@/lib/apps/relations/tests/types";

type Props = {
  test: TestDefinition;
  onClose?: () => void; // эхлэл болгоход ашиглана
};

type ResultView = {
  pct01: number;
  pct100: number;
  band: TestBand | null;
};

export default function TestRunner({ test, onClose }: Props) {
  const total = test?.questions?.length ?? 0;

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<(TestOptionValue | null)[]>(
    Array.from({ length: total }, () => null)
  );
  const [showResult, setShowResult] = useState(false);

  // ✅ дараагийн асуулт руу шилжих таймер давхардахгүй
  const nextTimerRef = useRef<number | null>(null);

  // Back event-д хамгийн шинэ idx хэрэгтэй
  const idxRef = useRef(idx);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    idxRef.current = idx;
  }, [idx]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // ✅ Тест солигдоход state-г бүрэн reset хийнэ (4/4 дээр 75% гэх алдааг зогсооно)
  useEffect(() => {
    if (nextTimerRef.current) {
      window.clearTimeout(nextTimerRef.current);
      nextTimerRef.current = null;
    }

    setShowResult(false);
    setIdx(0);
    setAnswers(Array.from({ length: test.questions.length }, () => null));
  }, [test]);

  const current = total > 0 ? test.questions[idx] : null;
  const isLast = total > 0 && idx === total - 1;

  // ✅ Progress: яг бөглөсөн хариултын тоогоор
  const doneCount = useMemo(() => {
    return answers.filter((a) => a !== null).length;
  }, [answers]);

  const progressPct = useMemo(() => {
    if (total <= 0) return 0;
    return Math.round((doneCount / total) * 100);
  }, [doneCount, total]);

  // ✅ option value 1..3/4/5 ямар ч байсан maxPerQ олж бодно
  const maxPerQ = useMemo(() => {
    let m = 0;
    for (const q of test.questions) {
      for (const o of q.options) {
        const n = Number(o.value);
        if (Number.isFinite(n) && n > m) m = n;
      }
    }
    return m > 0 ? m : 4;
  }, [test.questions]);

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
  }, [answers, test.bands, maxPerQ]);

  function resetToStart() {
    if (nextTimerRef.current) {
      window.clearTimeout(nextTimerRef.current);
      nextTimerRef.current = null;
    }

    setShowResult(false);
    setIdx(0);
    setAnswers(Array.from({ length: test.questions.length }, () => null));
    onCloseRef.current?.();
  }

  // ✅ TopBar "Буцах" event (асуулт дундаа бол 1 алхам буцна, эхэнд бол эхлэл рүү)
  useEffect(() => {
    function onBack(e: Event) {
      e.preventDefault();

      if (nextTimerRef.current) {
        window.clearTimeout(nextTimerRef.current);
        nextTimerRef.current = null;
      }

      const curIdx = idxRef.current;

      if (curIdx > 0) {
        setShowResult(false);
        setIdx(curIdx - 1);
        return;
      }

      resetToStart();
    }

    window.addEventListener("relations-tests-back", onBack as EventListener);
    return () => {
      window.removeEventListener("relations-tests-back", onBack as EventListener);
    };
  }, []);

  function pick(value: TestOptionValue) {
    if (total <= 0) return;

    const curIdx = idx; // тухайн мөчийн idx

    // 1) тэмдэглэнэ
    setAnswers((prev) => {
      const next = [...prev];
      next[curIdx] = value;
      return next;
    });

    // 2) сүүлийн асуулт биш бол дараагийнх руу (давхар таймер үүсгэхгүй)
    if (curIdx < total - 1) {
      if (nextTimerRef.current) window.clearTimeout(nextTimerRef.current);

      nextTimerRef.current = window.setTimeout(() => {
        setShowResult(false);
        // ✅ зөвхөн +1 хийнэ (алгасахгүй)
        setIdx((v) => Math.min(v + 1, total - 1));
        nextTimerRef.current = null;
      }, 140);
    }
  }

  const lastAnswered = isLast && answers[idx] !== null;

  function openResult() {
    if (!lastAnswered) return;
    setShowResult(true);
  }

  function closeResult() {
    resetToStart();
  }

  if (!current || total === 0) return null;

  return (
    <div className={styles.runner}>
      <div className={styles.progressRow}>
        <div className={styles.progressMeta}>
          {Math.min(idx + 1, total)}/{total} • {progressPct}%
        </div>

        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className={styles.qCard}>
        <div className={styles.qText}>{current.text}</div>

        <div className={styles.choices}>
          {current.options.map((opt, i) => {
            const active = answers[idx] === opt.value;
            return (
              <button
                key={`${idx}-${String(opt.value)}-${i}`}
                type="button"
                className={`${styles.choice} ${active ? styles.choiceActive : ""}`}
                onClick={() => pick(opt.value)}
              >
                <span className={styles.radio} aria-hidden />
                <span className={styles.choiceLabel}>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* ✅ ЗӨВХӨН СҮҮЛЧИЙН асуулт дээр ганц “Дүгнэлт” */}
        {isLast ? (
          <div className={styles.bottomBar}>
            <button
              type="button"
              className={styles.answerBtn}
              onClick={openResult}
              disabled={!lastAnswered}
              title={
                !lastAnswered
                  ? 'Сүүлийн асуултад хариултаа сонгоод дараа нь "Дүгнэлт" дарна.'
                  : ""
              }
            >
              Дүгнэлт
            </button>
          </div>
        ) : null}
      </div>

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

            <button className={styles.modalClose} type="button" onClick={closeResult}>
              Хаах
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
