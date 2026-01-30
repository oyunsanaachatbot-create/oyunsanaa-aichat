"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "../tests.module.css";

import TopBar from "../_components/TopBar";
import TestRunner from "@/components/apps/relations/tests/TestRunner";
import { TESTS } from "@/lib/apps/relations/tests/definitions";

export default function RelationsTestSlugPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const test = useMemo(() => TESTS.find((t) => t.slug === slug), [slug]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <TopBar />

        <div className={styles.runnerWrap}>
          {test ? (
            <TestRunner test={test} onClose={() => router.push("/mind/relations/tests")} />
          ) : (
            <div className={styles.empty}>Тест олдсонгүй.</div>
          )}
        </div>
      </div>
    </div>
  );
}
