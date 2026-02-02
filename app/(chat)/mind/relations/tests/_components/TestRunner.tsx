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

  // ✅ TEST СОЛИГДОХОД БҮРЭН RESET (4/4 дээр 75% гэх bug эндээс гардаг байсан)
  useEffect(() => {
    if (nextTimerRef.current) {
      window.clearTimeout(nextTimerRef.current);
      nextTimerRef.current = null;
    }
    setShowResult(false);
    setIdx(0);
    setAnswers(Array.from({ length: test.questions.length }, () => null));
  }, [test]);

  // ✅ TopBar "Буцах" event (чи одоо ажиллаж байна гэсэн)
  useEffect(() => {
    function onBack(e: Event) {
      e.preventDefault();

      if (nextTimerRef.current) {
        window.clearTimeout(nextTimerRef.current);
        nextTimerRef.current = null;
      }

      const cur = idxRef.current;

      if (cur > 0) {
        setShowResult(false);
        setIdx(cur - 1);
        return;
      }

      // эхний асуулт дээр: эхлэл рүү (page дээрх сонголт хэсэг)
      setShowResult(false);
      setIdx(0);
      setAnswers(Array.from({ length: test.questions.length }, () => null));
      onClose?.();
    }

    window.addEventListener("relations-tests-back", onBack as EventListener);
    return () => {
      window.removeEventListener("relations-tests-back", onBack as EventListener);
    };
  }, [onClose, test]);

  const current = test.questions[idx];
  const isLast = idx === total - 1;

  const doneCount = useMemo(
    () => answers.filter((a) => a !== null).length,
    [answers]
  );

  // ✅ progress нь яг answers дээр тулгуурлана (алгасалт/хоосон даралт байхгүй болно)
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

    // ✅ 1) эхлээд тэмдэглэнэ (радио будагдана)
    setAnswers((prev) => {
      const next = [...prev];
      next[curIdx] = value;
      return next;
    });

    // ✅ 2) таймер давхардахгүй (хоосон даралт/алгасалт зогсоно)
    if (nextTimerRef.current) {
      window.clearTimeout(nextTimerRef.current);
      nextTimerRef.current = null;
    }

    // ✅ 3) сүүлийн асуулт биш бол дараагийн асуулт руу автоматаар
    if (curIdx < total - 1) {
      nextTimerRef.current = window.setTimeout(() => {
        setShowResult(false);
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
    // дууссаны дараа эхлэл рүү буцаана (чи хүссэн)
    setShowResult(false);
    setIdx(0);
    setAnswers(Array.from({ length: test.questions.length }, () => null));
    onClose?.();
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
                key={`${idx}-${opt.value}-${i}`}
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

        {/* ✅ ЗӨВХӨН СҮҮЛЧИЙН АСУУЛТ ДЭЭР 1 “Дүгнэлт” товч */}
        {isLast ? (
          <div className={styles.bottomBar}>
            <button
              type="button"
              className={styles.answerBtn}
              onClick={openResult}
              disabled={!lastAnswered}
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
