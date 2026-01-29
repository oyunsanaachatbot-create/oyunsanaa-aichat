"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import styles from "../tests.module.css";
import { getTestBySlug } from "@/lib/apps/relations/tests/testsRegistry";
import TestRunner from "@/components/apps/relations/tests/TestRunner";

export default function TestSlugPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";

  const test = useMemo(() => getTestBySlug(slug), [slug]);

  if (!test) {
    return (
      <div className={styles.cbtBody}>
        <div className={styles.container}>
          <div className={styles.header}>
            <Link className={styles.chatBtn} href="/mind/relations/tests">
              Буцах
            </Link>
            <Link className={styles.chatBtn} href="/chat">
              Чат руу
            </Link>
          </div>

          <div className={styles.card}>
            <div className={styles.q}>Тест олдсонгүй</div>
            <p className={styles.desc}>Тестийн ID/slug буруу байна: <b>{slug}</b></p>
          </div>
        </div>
      </div>
    );
  }

  return <TestRunner test={test} />;
}
