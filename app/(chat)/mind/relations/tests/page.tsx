"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "./tests.module.css";

import { TESTS, getTestById } from "@/lib/apps/relations/tests/definitions";
import TestRunner from "@/components/apps/relations/tests/TestRunner";

export default function RelationsTestsPage() {
  // default тест (эхлээд эхний тестээ авна)
  const defaultId = TESTS[0]?.id ?? "personality-basic";
  const [selectedId, setSelectedId] = useState<string>(defaultId);

  const selectedTest = useMemo(() => getTestById(selectedId), [selectedId]);

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

          {/* ✅ Тест сонгох хэсэг — тусдаа хүрээтэй болгоно */}
          <div className={styles.pickerCard}>
            <div className={styles.pickerLabel}>Тест сонгох</div>

            <select
              className={styles.pickerSelect}
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {TESTS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>

            {/* optional: жижиг тайлбар (debug биш) */}
            {selectedTest?.subtitle ? (
              <div className={styles.pickerSub}>{selectedTest.subtitle}</div>
            ) : null}
          </div>

          {/* ✅ Доор нь жинхэнэ тест */}
          <div className={styles.runnerWrap}>
            {selectedTest ? (
              <TestRunner test={selectedTest} />
            ) : (
              <div className={styles.muted}>Тест олдсонгүй.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
