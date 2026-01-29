"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import styles from "../tests.module.css";
import { getTestById } from "@/lib/apps/relations/tests/testsRegistry";
import TestRunner from "@/components/apps/relations/tests/TestRunner";

export default function TestIdPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const test = useMemo(() => getTestById(id), [id]);

  if (!test) {
    return (
      <div className={styles.cbtBody}>
        <div className={styles.container}>
          <div className={styles.card}>
            <h1 className={styles.q}>Тест олдсонгүй</h1>
            <p className={styles.desc}>ID буруу байна: <b>{id}</b></p>
            <Link className={styles.row} href="/mind/relations/tests">
              ← Тестүүд рүү буцах
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <TestRunner test={test} />;
}
