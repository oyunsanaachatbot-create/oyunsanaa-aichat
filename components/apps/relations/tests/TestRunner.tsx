"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "@/app/(chat)/mind/relations/tests/tests.module.css";
import type { TestDefinition, TestOptionValue } from "@/lib/apps/relations/tests/types";
import { saveLatestLocal } from "@/lib/apps/relations/tests/localStore";

type Props = { test: TestDefinition };

export default function TestRunner({ test }: Props) {
  const total = test.questions.length;

  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, TestOptionValue>>({});
  const [done, setDone] = useState(false);

  const q = test.questions[i];

  const progress = useMemo(() => {
    const answered = Object.keys(answers).length;
    return Math.round((answered / total) * 100);
  }, [answers, total]);

  const result = useMemo(() => {
    if (!done) return null;
    return test.computeResult(answers);
  }, [done, answers, test]);

  function choose(v: TestOptionValue) {
    const next = { ...answers, [q.id]: v };
    setAnswers(next);

    // auto-next
    if (i < total - 1) setI(i + 1);
    else {
      const r = test.computeResult(next);
      // ✅ local хамгийн сүүлийн дүн хадгална (Supabase дараа нь)
      saveLatestLocal({
        test_slug: test.slug,
        test_title: test.title,
        result_key: r.key,
        result_title: r.title,
        summary_short: r.summaryShort,
        created_at: new Date().toISOString(),
      });
      setDone(true);
    }
  }

  return (
    <div className={styles.cbtBody}>
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.back} onClick={() => history.back()} aria-label="Буцах">
            ←
          </button>

          <div className={styles.headMid}>
            <div className={styles.headTitle}>{test.title}</div>
            <div className={styles.headSub}>{test.meta}</div>
          </div>

          <Link className={styles.chatBtn} href="/chat">
            💬 Чат руу
          </Link>
        </div>

        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${done ? 100 : progress}%` }} />
        </div>

        <div className={styles.card}>
          {!done ? (
            <>
              <h2 className={styles.q}>
                {i + 1}. {q.text}
              </h2>
              {q.desc ? <p className={styles.desc}>{q.desc}</p> : null}

              <div className={styles.options}>
                {q.options.map((opt) => {
                  const on = answers[q.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={`${styles.option} ${on ? styles.on : ""}`}
                      onClick={() => choose(opt.value)}
                    >
                      <span className={styles.label}>{opt.label}</span>
                      <span className={styles.tick}>{on ? "✓" : ""}</span>
                    </button>
                  );
                })}
              </div>

              <p className={styles.desc} style={{ marginTop: 12 }}>
                {Object.keys(answers).length}/{total} бөглөгдсөн
              </p>
            </>
          ) : (
            <>
              <div className={styles.resultCard}>
                <div className={styles.resultTitle}>Дүгнэлт</div>
                <div className={styles.resultLine}>{result?.title}</div>
                <div className={styles.resultMeta}>
                  <div>{result?.summaryShort}</div>
                  {result?.whatToTry ? <div>Дараагийн жижиг алхам: {result.whatToTry}</div> : null}
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <Link className={styles.row} href="/mind/relations/tests">
                  <div className={styles.rowTitle}>← Бусад тестүүд</div>
                  <div className={styles.arrow}>→</div>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
