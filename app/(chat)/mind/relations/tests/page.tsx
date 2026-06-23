"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./tests.module.css";

import { AppCard, AppShell } from "@/components/mind/app-shell";
import TestRunner from "./_components/TestRunner";
import { TESTS } from "@/lib/apps/relations/tests/definitions";
import { resolveTestDefinition } from "@/lib/apps/relations/tests/types";
import type { TestDefinition } from "@/lib/apps/relations/tests/types";
import { useLocale, useT } from "@/lib/i18n/provider";

export default function RelationsTestsPage() {
  const t = useT();
  const locale = useLocale();
  const [selectedSlug, setSelectedSlug] = useState<string>(() => TESTS[0]?.slug ?? "");
  const runnerRef = useRef<HTMLDivElement | null>(null);

  const localizedTests = useMemo(
    () => TESTS.map((test) => resolveTestDefinition(test, locale)),
    [locale],
  );

  const selected = useMemo<TestDefinition | undefined>(
    () => localizedTests.find((t) => t.slug === selectedSlug),
    [localizedTests, selectedSlug],
  );

  useEffect(() => {
    if (!runnerRef.current) return;
    runnerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedSlug]);

  return (
    <AppShell
      title={t.apps.relationsTests.title}
      subtitle={t.apps.relationsTests.subtitle}
      width="4xl"
    >
      <div className="space-y-4">
        <AppCard>
          <div className={styles.selectRow}>
            <div className={styles.label}>{t.apps.relationsTests.testLabel}</div>
            <select
              className={styles.select}
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
            >
              {localizedTests.map((t) => (
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
                  : `${t.apps.relationsTests.questionsPrefix} ${selected.questions.length} • ${t.apps.relationsTests.answersHint}`}
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
            <div className={styles.empty}>{t.apps.relationsTests.notFound}</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
