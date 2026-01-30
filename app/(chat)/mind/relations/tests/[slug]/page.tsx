"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import styles from "../tests.module.css";

import { getTestBySlug } from "@/lib/apps/relations/tests/definitions";
import TestRunner from "@/components/apps/relations/tests/TestRunner";

export default function RelationsTestSlugPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const test = slug ? getTestBySlug(slug) : undefined;

  return (
    <div className={styles.cbtBody}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link className={styles.chatBtn} href="/mind/relations/tests">Буцах</Link>
          <Link className={styles.chatBtn} href="/chat">
            <span className={styles.chatIcon}>💬</span> Чат руу
          </Link>
        </header>

        {test ? (
          <TestRunner
  test={test}
  onClose={() => {
    // 1) хамгийн энгийн: буцах
    window.history.back();
  }}
/>

        ) : (
          <div className={styles.card}>
            <h1 className={styles.h1}>Тест олдсонгүй</h1>
            <p className={styles.muted}>slug буруу байна.</p>
          </div>
        )}
      </div>
    </div>
  );
}
