"use client";

import { useMemo, useState } from "react";
import styles from "./tests.module.css";
import { TESTS } from "@/lib/apps/relations/tests/definitions";
import TestRunner from "@/components/apps/relations/tests/TestRunner";

export default function RelationsTestsPage() {
  const [slug, setSlug] = useState(TESTS[0]?.slug ?? "");
  const selected = useMemo(() => TESTS.find((t) => t.slug === slug) ?? TESTS[0], [slug]);

  if (!selected) return null;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* TOP CARD: сонголт байнга харагдана */}
        <div className={styles.cardTop}>
          <div className={styles.h1}>Харилцааны тестүүд</div>
          <div className={styles.h2}>Тест сонгоод шууд бөглөнө.</div>

          <div className={styles.selectRow}>
            <div className={styles.label}>Тест сонгох</div>
            <select className={styles.select} value={slug} onChange={(e) => setSlug(e.target.value)}>
              {TESTS.map((t) => (
                <option key={t.id} value={t.slug}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.meta}>
            <div className={styles.metaTitle}>{selected.title}</div>
            <div className={styles.metaLine}>
              Асуулт: <b>{selected.questions.length}</b> • Хариулт: <b>1–4</b>
            </div>
            {selected.description ? <div className={styles.metaDesc}>{selected.description}</div> : null}
          </div>
        </div>

        {/* RUNNER CARD: доор тест үргэлжилж харагдана */}
        <div className={styles.cardRun}>
       <TestRunner
  key={selected.id}
  test={selected}
  onClose={() => {
    // жагсаалт руу буцаах / тест хаах логикоо энд
    setSelected(null); // хэрвээ selected state байгаа бол
  }}
/>
        </div>
      </div>
    </div>
  );
}
