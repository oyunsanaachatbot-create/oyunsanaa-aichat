"use client";

import { Brain, ChevronRight, ClipboardCheck, History } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import LatestResults from "@/components/apps/relations/tests/LatestResults";
import { AppCard, AppShell } from "@/components/mind/app-shell";
import TestRunner from "./_components/TestRunner";
import { TESTS } from "@/lib/apps/relations/tests/definitions";
import type { LatestTestResult } from "@/lib/apps/relations/tests/localStore";
import { resolveTestDefinition } from "@/lib/apps/relations/tests/types";
import type { TestDefinition } from "@/lib/apps/relations/tests/types";
import { useLocale, useT } from "@/lib/i18n/provider";

export default function RelationsTestsPage() {
  const copy = useT();
  const locale = useLocale();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [resultsRefreshKey, setResultsRefreshKey] = useState(0);
  const [readResult, setReadResult] = useState<LatestTestResult | null>(null);
  const runnerRef = useRef<HTMLDivElement | null>(null);

  const localizedTests = useMemo(
    () => TESTS.map((test) => resolveTestDefinition(test, locale)),
    [locale]
  );

  const selected = useMemo<TestDefinition | undefined>(
    () => localizedTests.find((test) => test.slug === selectedSlug),
    [localizedTests, selectedSlug]
  );

  useEffect(() => {
    if (!(selectedSlug && runnerRef.current)) return;
    const frame = window.requestAnimationFrame(() => {
      runnerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedSlug]);

  const selectTest = (slug: string) => {
    setSelectedSlug(slug);
  };

  return (
    <AppShell
      backHref="/"
      subtitle={copy.apps.relationsTests.subtitle}
      title={copy.apps.relationsTests.title}
      width="5xl"
    >
      <div className="space-y-5 font-sans">
        <section className="rounded-[20px] border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#1F6FB2] text-white shadow-sm">
              <Brain className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900 text-xl">
                {copy.apps.relationsTests.introTitle}
              </h2>
              <p className="mt-1 text-slate-600 text-sm leading-relaxed">
                {copy.apps.relationsTests.introDescription.replace(
                  "{count}",
                  String(localizedTests.length + 1)
                )}
              </p>
            </div>
          </div>
        </section>

        <AppCard>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-lg text-slate-900">
                {copy.apps.relationsTests.listTitle}
              </h2>
              <p className="mt-0.5 text-slate-500 text-sm">
                {copy.apps.relationsTests.listHint}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 font-semibold text-[#1F6FB2] text-xs">
              {copy.apps.relationsTests.countLabel.replace(
                "{count}",
                String(localizedTests.length + 1)
              )}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              className="group hover:-translate-y-0.5 flex min-h-32 items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-left transition hover:border-blue-300 hover:shadow-md"
              href="/mind/balance/result"
            >
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#1F6FB2] shadow-sm">
                <ClipboardCheck className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-slate-900">
                  {copy.apps.relationsTests.primaryTitle}
                </span>
                <span className="mt-1 block text-slate-600 text-sm leading-relaxed">
                  {copy.apps.relationsTests.primaryDescription}
                </span>
                <span className="mt-2 block font-semibold text-[#1F6FB2] text-xs">
                  {copy.apps.relationsTests.primaryBadge}
                </span>
              </span>
              <ChevronRight className="mt-1 size-5 shrink-0 text-blue-400 transition group-hover:translate-x-0.5" />
            </Link>

            {localizedTests.map((test) => {
              const active = selectedSlug === test.slug;
              return (
                <button
                  className={`group hover:-translate-y-0.5 flex min-h-32 items-start gap-3 rounded-2xl border p-4 text-left transition hover:shadow-md ${
                    active
                      ? "border-[#1F6FB2] bg-blue-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-blue-200"
                  }`}
                  key={test.id}
                  onClick={() => selectTest(test.slug)}
                  type="button"
                >
                  <span
                    className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl ${
                      active
                        ? "bg-[#1F6FB2] text-white"
                        : "bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-[#1F6FB2]"
                    }`}
                  >
                    <Brain className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-slate-900">
                      {test.title}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-slate-600 text-sm leading-relaxed">
                      {test.description ||
                        copy.apps.relationsTests.questionCount.replace(
                          "{count}",
                          String(test.questions.length)
                        )}
                    </span>
                    <span className="mt-2 block font-semibold text-slate-500 text-xs">
                      {test.subtitle ||
                        copy.apps.relationsTests.questionCount.replace(
                          "{count}",
                          String(test.questions.length)
                        )}
                    </span>
                  </span>
                  <ChevronRight
                    className={`mt-1 size-5 shrink-0 transition group-hover:translate-x-0.5 ${
                      active ? "text-[#1F6FB2]" : "text-slate-400"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </AppCard>

        {selected ? (
          <div className="scroll-mt-4" ref={runnerRef}>
            <AppCard>
              <div className="mb-2 flex items-start justify-between gap-3 border-slate-200 border-b pb-4">
                <div className="min-w-0">
                  <p className="font-semibold text-[#1F6FB2] text-xs uppercase tracking-wide">
                    {copy.apps.relationsTests.selectedLabel}
                  </p>
                  <h2 className="mt-1 break-words font-bold text-slate-900 text-xl">
                    {selected.title}
                  </h2>
                  <p className="mt-1 text-slate-600 text-sm leading-relaxed">
                    {selected.description ||
                      copy.apps.relationsTests.questionCount.replace(
                        "{count}",
                        String(selected.questions.length)
                      )}
                  </p>
                </div>
                <button
                  className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-600 text-xs hover:bg-slate-50"
                  onClick={() => setSelectedSlug(null)}
                  type="button"
                >
                  {copy.apps.relationsTests.close}
                </button>
              </div>

              <TestRunner
                key={selected.slug}
                onClose={() => setSelectedSlug(null)}
                onCompleted={() =>
                  setResultsRefreshKey((current) => current + 1)
                }
                test={selected}
              />
            </AppCard>
          </div>
        ) : null}

        <section>
          <div className="mb-3 flex items-center gap-2">
            <History className="size-5 text-[#1F6FB2]" />
            <h2 className="font-bold text-lg text-slate-900">
              {copy.apps.relationsTests.previousResultsTitle}
            </h2>
          </div>
          <LatestResults
            onReadResult={setReadResult}
            onSelectTest={selectTest}
            refreshKey={resultsRefreshKey}
          />
        </section>
      </div>

      {readResult ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 font-sans"
          role="dialog"
        >
          <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-[#1F6FB2] text-xs uppercase tracking-wide">
                  {copy.apps.relationsTests.result}
                </p>
                <h2 className="mt-1 break-words font-bold text-lg">
                  {readResult.title ||
                    copy.apps.relationsTests.fallbackResultTitle}
                </h2>
              </div>
              <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 font-extrabold text-[#1F6FB2] text-lg">
                {readResult.pct}%
              </span>
            </div>
            <p className="mt-4 font-semibold text-slate-800">
              {readResult.bandTitle ||
                copy.apps.relationsTests.fallbackResultTitle}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-slate-600 text-sm leading-relaxed">
              {readResult.summary ||
                copy.apps.relationsTests.missingResultSummary}
            </p>
            <button
              className="mt-5 w-full rounded-2xl bg-[#1F6FB2] px-4 py-3 font-semibold text-sm text-white hover:bg-[#185b95]"
              onClick={() => setReadResult(null)}
              type="button"
            >
              {copy.apps.relationsTests.close}
            </button>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
