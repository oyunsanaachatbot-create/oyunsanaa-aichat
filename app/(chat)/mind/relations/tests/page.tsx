"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "./tests.module.css";

import { TESTS, getTestById } from "@/lib/apps/relations/tests/definitions";
import TestRunner from "@/components/apps/relations/tests/TestRunner";

export default function RelationsTestsPage() {
  const defaultId = TESTS[0]?.id ?? "listening";
  const [selectedId, setSelectedId] = useState<string>(defaultId);

  // ✅ эхлэх товч дарсан эсэх
  const [started, setStarted] = useState(false);

  const selectedTest = useMemo(() => getTestById(selectedId), [selectedId]);

  function onPick(id: string) {
    setSelectedId(id);
    setStarted(false); // ✅ өөр тест сонговол дахин "эхлээгүй" болгоно
  }

  return (
    <div className={styles.cbtBody}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link className={styles.chatBtn} href="/mind/relations">
            Буцах
          </Link>
          <Link className={styles.chatBtn} href="/chat">
            <span className={styles.chatIcon}>💬</span> Чат руу
          </Link>
        </header>

        <div className={styles.card}>
          <div className={styles.topTitle}>Харилцааны тестүүд</div>

          {/* --- picker --- */}
          <div className={styles.pickerCard}>
            <div className={styles.pickerLabel}>Тест сонгох</div>

            <select
              className={styles.pickerSelect}
              value={selectedId}
              onChange={(e) => onPick(e.target.value)}
            >
              {TESTS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>

            {selectedTest?.subtitle ? (
              <div className={styles.pickerSub}>{selectedTest.subtitle}</div>
            ) : null}

            {/* ✅ ЭХЛЭХ товч голд */}
            {!started ? (
              <div className={styles.startWrap}>
                <button
                  className={styles.startBtn}
                  onClick={() => setStarted(true)}
                  disabled={!selectedTest}
                >
                  Эхлэх
                </button>
              </div>
            ) : null}
          </div>

          {/* --- runner --- */}
          <div className={styles.runnerWrap}>
            {started && selectedTest ? (
              <TestRunner test={selectedTest} />
            ) : (
              <div className={styles.muted}>
                {/* ✅ Дүгнэлтүүдийг эхэнд харуулахыг одоохондоо түр хойшлуулна */}
                Тест сонгоод <b>“Эхлэх”</b> дарна уу.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
