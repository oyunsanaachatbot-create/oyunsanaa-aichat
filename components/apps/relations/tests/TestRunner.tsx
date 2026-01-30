"use client";

import { useMemo, useState } from "react";
import styles from "./TestRunner.module.css"; // хэрвээ та tests.module.css ашигладаг бол тийш нь тааруул
import type { TestDefinition } from "@/lib/apps/relations/tests/types";

type Props = {
  test: TestDefinition;
  onClose?: () => void; // ✅ optional болгов
};

export default function TestRunner({ test, onClose }: Props) {
  const total = test.questions.length;

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<null | { scorePct: number; title: string; body: string }>(
    null,
  );

  const q = test.questions[idx];

  const progressPct = useMemo(() => {
    if (total === 0) return 0;
    return Math.round((idx / total) * 100);
  }, [idx, total]);

  function pick(value: number) {
    // ✅ хариу дармагц өнгө солигдоод, автоматаар дараагийн асуулт руу орно
    const nextAnswers = [...answers];
    nextAnswers[idx] = value;
    setAnswers(nextAnswers);

    const nextIdx = idx + 1;
    if (nextIdx < total) {
      setIdx(nextIdx);
      return;
    }

    // ✅ дууссан: энд оноо бодоод result гаргана
    // (доорх нь жишээ. Танайд score logic өөр байж болно)
    const sum = nextAnswers.reduce((a, b) => a + (b ?? 0), 0);
    const max = total * 4;
    const pct = max ? Math.round((sum / max) * 100) : 0;

    const r = test.getResult
      ? test.getResult(nextAnswers)
      : { scorePct: pct, title: "Дүгнэлт", body: "Тайлбар бэлдээгүй байна." };

    setResult(
      "scorePct" in r
        ? (r as any)
        : { scorePct: pct, title: r.title ?? "Дүгнэлт", body: r.body ?? "" },
    );
  }

  function closeResult() {
    // ✅ хаахад эхлэлд нь буцаана
    setResult(null);
    setIdx(0);
    setAnswers([]);
    onClose?.();
  }

  if (!q) return null;

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div className={styles.headTitle}>{test.title}</div>
        <div className={styles.headMeta}>
          {Math.min(idx + 1, total)}/{total} • {progressPct}%
        </div>
      </div>

      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${Math.round(((idx + 1) / total) * 100)}%` }} />
      </div>

      <div className={styles.qCard}>
        <div className={styles.qText}>{q.text}</div>

        <div className={styles.choices}>
          {/* ✅ ЭНД ямар нэг reverse() БАЙВАЛ УСТГА.
              Чиний “Тийм нь дээр, Үгүй нь доор” хүсэлт яг эндээс л эвдэрдэг. */}
          {q.choices.map((c) => {
            const active = answers[idx] === c.value;
            return (
              <button
                key={c.value}
                type="button"
                className={`${styles.choice} ${active ? styles.choiceActive : ""}`}
                onClick={() => pick(c.value)}
              >
                <span className={styles.radio} aria-hidden />
                <span className={styles.choiceLabel}>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ✅ "Хариу" товч зөвхөн дууссан үед эсвэл хүсвэл дараа хийж болно.
          Чи “автоматаар next” гэсэн болохоор энэ товчийг ер нь хэрэггүй болгож болно.
          Хэрвээ үлдээх бол: сүүлийн асуулт дээр л "Дүгнэлт" товч гарга. */}

      {result ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalTitle}>Дүгнэлт</div>

            <div className={styles.modalScore}>{result.scorePct}%</div>

            <div className={styles.modalBoxTitle}>{result.title}</div>
            <div className={styles.modalBody}>{result.body}</div>

            <button className={styles.modalClose} type="button" onClick={closeResult}>
              Хаах
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
