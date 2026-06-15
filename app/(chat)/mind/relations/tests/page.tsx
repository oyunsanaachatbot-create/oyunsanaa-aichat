"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./tests.module.css";

import { AppCard, AppShell } from "@/components/mind/app-shell";
import TestRunner from "./_components/TestRunner";
import { TESTS } from "@/lib/apps/relations/tests/definitions";
import type { TestDefinition } from "@/lib/apps/relations/tests/types";

export default function RelationsTestsPage() {
  const [selectedSlug, setSelectedSlug] = useState<string>(() => TESTS[0]?.slug ?? "");
  const runnerRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo<TestDefinition | undefined>(
    () => TESTS.find((t) => t.slug === selectedSlug),
    [selectedSlug],
  );

  useEffect(() => {
    if (!runnerRef.current) return;
    runnerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedSlug]);

  return (
    <AppShell
      title="Харилцааны тестүүд"
      subtitle="Энэхүү тестүүд сар бүр шинэчлэгдэж байх тул та хүссэн үедээ сонгоод бөглөөрэй."
      width="4xl"
    >
      <div className="space-y-4">
        <AppCard>
          <div className={styles.selectRow}>
            <div className={styles.label}>Тест</div>
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
              <div className={styles.previewMeta}>
                {selected.subtitle
                  ? selected.subtitle
                  : `Асуулт: ${selected.questions.length} • Хариулт: 1–5`}
              </div>
              <div className={styles.previewDesc}>{selected.description}</div>
            </div>
          ) : null}
        </AppCard>

        <div ref={runnerRef} className={styles.runnerWrap}>
          {selected ? (
            <TestRunner
              test={selected}
              onClose={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          ) : (
            <div className={styles.empty}>Тест олдсонгүй.</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
