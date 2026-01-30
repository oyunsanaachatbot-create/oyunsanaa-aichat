"use client";

import { useMemo, useState } from "react";
import styles from "./testsPage.module.css";

// ✅ эндээс TESTS массиваа авч ирнэ
import { TESTS } from "@/lib/apps/relations/tests/definitions";
import TestRunner from "@/components/apps/relations/tests/TestRunner";

export default function RelationsTestsPage() {
  const all = TESTS;

  // ✅ default: эхний тест сонгогдсон байж болно
  const [slug, setSlug] = useState<string>(all[0]?.slug ?? "");

  const selected = useMemo(() => all.find((t) => t.slug === slug) ?? all[0], [all, slug]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.cardTop}>
          <div className={styles.title}>Харилцааны тестүүд</div>
          <div className={styles.sub}>Тест сонгоод шууд бөглөнө.</div>

          <div className={styles.selectRow}>
            <label className={styles.label}>Тест сонгох</label>

            <div className={styles.selectWrap}>
              <select
                className={styles.select}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              >
                {all.map((t) => (
                  <option key={t.id} value={t.slug}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            {selected ? (
              <div className={styles.meta}>
                <div className={styles.metaLine}>
                  <b>{selected.title}</b>
                </div>
                <div className={styles.metaLine}>
                  Асуулт: <b>{selected.questions.length}</b> • Хариулт: <b>1–4</b>
                </div>
                {selected.description ? (
                  <div className={styles.metaDesc}>{selected.description}</div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* ✅ Сонгосон тест доор “шууд” эхэлнэ */}
        {selected ? (
          <div className={styles.runnerArea}>
            <TestRunner test={selected} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
