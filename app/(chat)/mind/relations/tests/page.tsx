"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./tests.module.css"

import TopBar from "./_components/TopBar";
import TestRunner from "@/components/apps/relations/tests/TestRunner";
import { TESTS } from "@/lib/apps/relations/tests/definitions";
import type { TestDefinition } from "@/lib/apps/relations/tests/types";

export default function RelationsTestsPage() {
  const router = useRouter();
  const [selectedSlug, setSelectedSlug] = useState<string>(() => TESTS[0]?.slug ?? "");
  const runnerRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo<TestDefinition | undefined>(
    () => TESTS.find((t) => t.slug === selectedSlug),
    [selectedSlug],
  );

  // Сонгомогц доорх тест рүү "мэдэгдэм" байдлаар scroll хийе
  useEffect(() => {
    if (!runnerRef.current) return;
    runnerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedSlug]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <TopBar />

        <div className={styles.cardTop}>
          <div className={styles.title}>Харилцааны тестүүд</div>
          <div className={styles.sub}>Тест сонгоод шууд бөглөнө.</div>

          <div className={styles.selectRow}>
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
          </div>

          {selected ? (
            <div className={styles.preview}>
              <div className={styles.previewTitle}>{selected.title}</div>
              <div className={styles.previewMeta}>
                Асуулт: {selected.questions.length} • Хариулт: 1–4
              </div>
              <div className={styles.previewDesc}>{selected.description}</div>
            </div>
          ) : null}
        </div>

        <div ref={runnerRef} className={styles.runnerWrap}>
          {selected ? (
            <TestRunner
              test={selected}
              onClose={() => {
                // “Хаах” (дүн хаах) дармагц тестийг эхлэлд нь reset хийнэ.
                // Reset нь TestRunner дотор хийгдэнэ, энд зөвхөн scroll/UX.
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          ) : (
            <div className={styles.empty}>Тест олдсонгүй.</div>
          )}
        </div>
      </div>
    </div>
  );
}
