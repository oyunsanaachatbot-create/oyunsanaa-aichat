"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./tests.module.css";

import { TESTS } from "@/lib/apps/relations/tests/definitions";

export default function RelationsTestsPage() {
  const [selectedSlug, setSelectedSlug] = useState<string>(TESTS[0]?.slug ?? "");

  const selected = useMemo(
    () => TESTS.find((t) => t.slug === selectedSlug),
    [selectedSlug]
  );

  return (
    <div className={styles.cbtBody}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link className={styles.chatBtn} href="/mind/relations">Буцах</Link>
          <Link className={styles.chatBtn} href="/chat">
            <span className={styles.chatIcon}>💬</span> Чат руу
          </Link>
        </header>

        <div className={styles.card}>
          <div className={styles.topTitle}>Харилцааны тестүүд</div>

          <div className={styles.field}>
            <div className={styles.label}>Тест сонгох</div>

            <select
              className={styles.select}
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
            >
              {TESTS.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.title}
                </option>
              ))}
            </select>

            {selected ? (
              <div className={styles.muted}>
                {selected.subtitle ? <div>{selected.subtitle}</div> : null}
                {selected.description ? <div>{selected.description}</div> : null}
              </div>
            ) : null}
          </div>

          {/* ✅ Төвд “Эхлэх” */}
          <div className={styles.actionsCenter}>
            <Link className={styles.mainBtn} href={`/mind/relations/tests/${selectedSlug}`}>
              Эхлэх
            </Link>
          </div>

          {/* ✅ Дүгнэлт энд шууд гаргахгүй (чи хүссэн) */}
          <div className={styles.smallHint}>
            Дүгнэлт нь тест дууссаны дараа гарна. (Дараа нь хүсвэл “өмнөх дүгнэлтүүдийг энд харуулах” болгож нэмнэ.)
          </div>
        </div>
      </div>
    </div>
  );
}
