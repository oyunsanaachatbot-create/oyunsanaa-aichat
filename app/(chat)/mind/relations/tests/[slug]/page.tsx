"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import styles from "../tests.module.css";
import { getTestById } from "@/lib/apps/relations/tests/testsRegistry";
import TestRunner from "@/components/apps/relations/tests/TestRunner";

export default function TestSlugPage() {
  const params = useParams<{ slug: string }>();
  const id = params?.slug ?? "";

  const test = useMemo(() => getTestById(id), [id]);

  if (!test) {
    return (
      <div className={styles.cbtBody}>
        <div className={styles.container}>
          <header className={styles.header}>
            <Link className={styles.chatBtn} href="/mind/relations/tests">
              Буцах
            </Link>
            <Link className={styles.chatBtn} href="/chat">
              💬 Чат руу
            </Link>
          </header>

          <div className={styles.card}>
            <h1 className={styles.q}>Тест олдсонгүй</h1>
            <p className={styles.desc}>
              Энэ тестийн ID буруу байна: <b>{id}</b>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.cbtBody}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link className={styles.chatBtn} href="/mind/relations/tests">
            Буцах
          </Link>
          <Link className={styles.chatBtn} href="/chat">
            💬 Чат руу
          </Link>
        </header>

        <div className={styles.card}>
          <div className={styles.q}>{test.title}</div>
          {test.subtitle ? <div className={styles.desc}>{test.subtitle}</div> : null}
        </div>

        <div className={styles.card}>
          <TestRunner test={test} />
        </div>
      </div>
    </div>
  );
}
