"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import styles from "@/components/apps/relations/tests/tests.module.css";
import Link from "next/link";
import { getTestBySlug } from "@/lib/apps/relations/tests/testsRegistry";
import TestRunner from "@/components/apps/relations/tests/TestRunner";

export default function TestSlugPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || "";

  const test = useMemo(() => getTestBySlug(slug), [slug]);

  if (!test) {
    return (
      <div className={styles.cbtBody}>
        <div className={styles.container}>
          <div className={styles.header}>
            <button className={styles.back} onClick={() => history.back()} aria-label="Буцах">←</button>
            <div className={styles.headMid}>
              <div className={styles.headTitle}>Тест олдсонгүй</div>
              <div className={styles.headSub}>Slug: {slug}</div>
            </div>
            <Link className={styles.chatBtn} href="/chat">💬 Чат руу</Link>
          </div>

          <div className={styles.card}>
            <p className={styles.desc}>Тестийн нэр буруу байна. Нүүр хуудас руу буцаад сонгоорой.</p>
            <div style={{ marginTop: 12 }}>
              <Link className={styles.row} href="/mind/relations/tests">
                <div className={styles.rowTitle}>← Тестүүд рүү буцах</div>
                <div className={styles.arrow}>→</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <TestRunner test={test} />;
}
