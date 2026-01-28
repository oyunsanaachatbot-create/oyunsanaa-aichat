"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import styles from "../tests.module.css";
import { getTestById } from "../../../../../../lib/apps/relations/tests/testsRegistry";
import TestRunner from "../../../../../../components/apps/relations/tests/TestRunner";

export default function TestSlugPage() {
  const params = useParams<{ slug: string }>();
  const id = params?.slug ?? "";

  const test = useMemo(() => getTestById(id), [id]);

  if (!test) {
    return (
      <div className={styles.cbtBody}>
        <div className={styles.container}>
          <div className={styles.header}>
            <Link className={styles.chatBtn} href="/mind/relations/tests">
              Буцах
            </Link>
            <Link className={styles.chatBtn} href="/chat">
              💬 Чат руу
            </Link>
          </div>

          <div className={styles.card}>
            <h1 className={styles.q}>Тест олдсонгүй</h1>
            <p className={styles.desc}>
              Энэ тестийн ID буруу байна: <b>{id}</b>
            </p>
            <div style={{ marginTop: 12 }}>
              <Link className={styles.row} href="/mind/relations/tests">
                <div className={styles.rowTitle}>← Тестүүд рүү буцах</div>
                <div className={styles.arrow} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <TestRunner test={test} />;
}
