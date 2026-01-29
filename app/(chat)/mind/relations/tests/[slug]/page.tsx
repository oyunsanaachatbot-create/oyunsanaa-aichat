"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import styles from "../tests.module.css";
import { getTestBySlug } from "@/lib/apps/relations/tests/registry";
import TestRunner from "@/components/apps/relations/tests/TestRunner";

export default function TestSlugPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";

  const test = useMemo(() => getTestBySlug(slug), [slug]);

  if (!test) {
    return (
      <div className={styles.cbtBody}>
        <div className={styles.container}>
          <header className={styles.header}>
            <Link className={styles.chatBtn} href="/mind/relations/tests">Буцах</Link>
          </header>

          <div className={styles.card}>
            <h1 className={styles.q}>Тест олдсонгүй</h1>
            <p className={styles.desc}>Тестийн slug буруу байна: <b>{slug}</b></p>
          </div>
        </div>
      </div>
    );
  }

  return <TestRunner test={test} />;
}
