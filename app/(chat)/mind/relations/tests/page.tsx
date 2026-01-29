"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import styles from "./tests.module.css";

import { TESTS, getTestById } from "@/lib/apps/relations/tests/definitions";
import TestRunner from "@/components/apps/relations/tests/TestRunner";

export default function RelationsTestsPage() {
  const options = useMemo(
    () =>
      TESTS.map((t) => ({
        id: t.id,
        slug: t.slug,
        title: t.title,
        subtitle: t.subtitle,
      })),
    []
  );

  const [selectedId, setSelectedId] = useState<string>(options[0]?.id ?? "");
  const selectedTest = selectedId ? getTestById(selectedId) : undefined;

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
          <h1 className={styles.h1}>Харилцааны тестүүд</h1>

          {/* ✅ Сумтай selector */}
          <div className={styles.field}>
            <div className={styles.label}>Тест сонгох</div>

            <select
              className={styles.select}
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </select>

            {selectedTest?.subtitle ? (
              <div className={styles.muted}>{selectedTest.subtitle}</div>
            ) : null}

            {/* Хэрвээ та тусдаа хуудсаар оруулахыг хүсвэл */}
            {selectedTest?.slug ? (
              <div className={styles.muted} style={{ marginTop: 6 }}>
                Тусдаа хуудсаар нээх:{" "}
                <Link href={`/mind/relations/tests/${selectedTest.slug}`}>
                  {selectedTest.slug}
                </Link>
              </div>
            ) : null}
          </div>

          {/* ✅ Сонгосон тестийг ажиллуулна */}
          {selectedTest ? (
            <TestRunner test={selectedTest} />
          ) : (
            <div className={styles.muted}>Тест олдсонгүй.</div>
          )}
        </div>
      </div>
    </div>
  );
}
