"use client";

import { useEffect, useState } from "react";
import styles from "@/app/(chat)/mind/relations/tests/tests.module.css";
import { loadLatest, type LatestTestResult } from "@/lib/apps/relations/tests/localStore";

export default function LatestResults() {
  const [items, setItems] = useState<LatestTestResult[]>([]);

  useEffect(() => {
    setItems(loadLatest());
  }, []);

  if (items.length === 0) {
    return (
      <div className={styles.card} style={{ marginTop: 14 }}>
        <h2 className={styles.q} style={{ fontSize: 16 }}>
          Сүүлийн дүгнэлтүүд
        </h2>
        <p className={styles.desc}>Одоогоор дүгнэлт алга. Аль нэг тестийг бөглөж үзээрэй.</p>
      </div>
    );
  }

  return (
    <div className={styles.card} style={{ marginTop: 14 }}>
      <h2 className={styles.q} style={{ fontSize: 16 }}>
        Сүүлийн дүгнэлтүүд
      </h2>
      <p className={styles.desc}>Сүүлд бөглөсөн тестүүдийн товч дүгнэлт.</p>

      <div className={styles.options}>
        {items.map((x) => (
          <div key={x.testId} className={styles.option} style={{ cursor: "default" }}>
            <div className={styles.left}>
              <span className={styles.emoji}>✅</span>
              <div>
                <div className={styles.label}>{x.title}</div>
                <div style={{ fontSize: 12, opacity: 0.82, marginTop: 3 }}>
                  {x.bandTitle} • {x.pct}%
                </div>
              </div>
            </div>
            <span className={styles.tick}></span>
          </div>
        ))}
      </div>
    </div>
  );
}
