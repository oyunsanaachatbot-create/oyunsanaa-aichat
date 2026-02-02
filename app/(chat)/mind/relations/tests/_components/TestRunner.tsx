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
  pct01: number;   // 0..1
  pct100: number;  // 0..100
  band: TestBand | null;
};

export default function TestRunner({ test, onClose }: Props) {
  const total = test.questions.length;

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<(TestOptionValue | null)[]>(
    Array.from({ length: total }, () => null)
  );
  const [showResult, setShowResult] = useState(false);

  // refs (TopBar back event-д хамгийн шинэ утга хэрэгтэй)
  const idxRef = useRef(idx);
  const totalRef = useRef(total);
  const onCloseRef = useRef(onClose);

  useEffect(() => { idxRef.current = idx; }, [idx]);
  useEffect(() => { totalRef.current = total; }, [total]);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  const current = test.questions[idx];
  const isLast = idx >= total - 1;

  const doneCount = useMemo(
    () => answers.filter((a) => a !== null).length,
    [answers]
  );

  const progressPct = useMemo(() => {
    if (total <= 0) return 0;
    return Math.round((doneCount / total) * 100);
  }, [doneCount, total]);

  // ✅ score-г боломжийн байдлаар тооцъё:
  // option value 1..4 эсвэл 1..5 байсан ч ажиллана.
  const maxPerQ = useMemo(() => {
    // бүх асуултын option value-уудын хамгийн ихийг олно
    // (зарим тест 3/4/5 сонголттой байж болно)
    let m = 0;
    for (const q of test.questions) {
      for (const o of q.options) {
        const n = Number(o.value);
        if (Number.isFinite(n) && n > m) m = n;
      }
    }
    return m > 0 ? m : 4; // fallback
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
    setShowResult(false);
    setIdx(0);
    setAnswers(Array.from({ length: totalRef.current }, () => null));
    onCloseRef.current?.();
  }

  // ✅ TopBar "Буцах" event
  useEffect(() => {
    function onBack(e: Event) {
      e.preventDefault();

      const curIdx = idxRef.current;

      // асуулт дундаа бол өмнөх асуулт руу
      if (curIdx > 0) {
        setShowResult(false);
        setIdx(curIdx - 1);
        return;
      }

      // эхний асуулт дээр бол “эхлэл” болгоно
      resetToStart();
    }

    window.addEventListener("relations-tests-back", onBack as EventListener);
    return () =>
      window.removeEventListener("relations-tests-back", onBack as EventListener);
  }, []);

  function goPrevInline() {
    setShowResult(false);
    setIdx((v) => Math.max(0, v - 1));
  }

  function pick(value: TestOptionValue) {
    const curIdx = idx; // ✅ тухайн дарсан мөчийн idx

    // 1) эхлээд тэмдэглэнэ -> дугуй будагдана
    setAnswers((prev) => {
      const next = [...prev];
      next[curIdx] = value;
      return next;
    });

    // 2) дараагийн асуулт руу шилжинэ (сүүлчийн дээр шилжихгүй!)
    if (curIdx < total - 1) {
      window.setTimeout(() => {
        setShowResult(false);
        setIdx(curIdx + 1);
      }, 140);
    }
  }

  function openResult() {
    // ✅ зөвхөн сүүлчийн асуулт дээр + хариулт сонгосон үед
    if (!isLast) return;
    if (answers[idx] === null) return;
    setShowResult(true);
  }

  function closeResult() {
    resetToStart();
  }

  if (!current || total === 0) return null;

  const lastAnswered = isLast && answers[idx] !== null;

  return (
    <div className={styles.runner}>
      <div className={styles.progressRow}>
        {/* ✅ хүсвэл inline prev товч үлдээж болно (TopBar буцахаас гадна) */}
        <div className={styles.progressMeta}>
          {Math.min(idx + 1, total)}/{total} • {progressPct}%
        </div>

        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* хүсвэл доорх мөрийг устгаж болно. UI-д зүгээр тус болдог. */}
        {/* <button type="button" className={styles.prevBtn} onClick={goPrevInline} disabled={idx === 0}>
          Өмнөх
        </button> */}
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

        {/* ✅ ЗӨВХӨН СҮҮЛЧИЙН АСУУЛТ ДЭЭР “ДҮГНЭЛТ” ТОВЧ */}
        {isLast ? (
          <div className={styles.bottomBar}>
            <button
              type="button"
              className={styles.answerBtn}
              onClick={openResult}
              disabled={!lastAnswered}
              title={!lastAnswered ? "Сүүлийн асуултад хариултаа сонгоод дараа нь Дүгнэлт дарна." : ""}
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

            <button
              className={styles.modalClose}
              type="button"
              onClick={closeResult}
            >
              Хаах
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
