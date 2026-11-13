"use client";

import {
  Brain,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  History,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [query, setQuery] = useState("");
  const [originFilter, setOriginFilter] = useState<
    "all" | "localized" | "international"
  >("all");
  const runnerRef = useRef<HTMLDivElement | null>(null);

  const localizedTests = useMemo(
    () => TESTS.map((test) => resolveTestDefinition(test, locale)),
    [locale]
  );

  const filteredTests = useMemo(() => {
    const normalized = query.trim().normalize("NFC").toLocaleLowerCase("mn-MN");
    return localizedTests.filter((test) => {
      if (originFilter !== "all" && test.origin !== originFilter) return false;
      if (!normalized) return true;
      return `${test.title} ${test.subtitle ?? ""} ${test.description ?? ""}`
        .normalize("NFC")
        .toLocaleLowerCase("mn-MN")
        .includes(normalized);
    });
  }, [localizedTests, originFilter, query]);

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

  const normalizedQuery = query
    .trim()
    .normalize("NFC")
    .toLocaleLowerCase("mn-MN");
  const primarySearchText =
    `${copy.apps.relationsTests.primaryTitle} ${copy.apps.relationsTests.primaryDescription}`
      .normalize("NFC")
      .toLocaleLowerCase("mn-MN");
  const showPrimary =
    originFilter === "all" &&
    (!normalizedQuery || primarySearchText.includes(normalizedQuery));

  return (
    <AppShell
      backHref="/"
      subtitle={copy.apps.relationsTests.subtitle}
      title={copy.apps.relationsTests.title}
      width="5xl"
    >
      <div className="space-y-5 font-sans">
        <section className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-3 sm:rounded-[20px] sm:p-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#1F6FB2] text-white shadow-sm sm:size-11 sm:rounded-2xl">
              <Brain className="size-4 sm:size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="font-bold text-lg text-slate-900 sm:text-xl">
                Өөрийгөө танин мэдэх тестүүд
              </h2>
              <p className="mt-1 text-slate-600 text-sm leading-relaxed">
                Үр дүн нь өөрийгөө ажиглаж ойлгоход зориулсан бөгөөд мэргэжлийн
                сэтгэлзүйн онош, дүгнэлт биш.
              </p>
            </div>
          </div>
          <details className="group mt-3 border-blue-100 border-t pt-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-[#1F6FB2] text-sm">
              Дэлгэрэнгүй - Тест гэж юу вэ?
              <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-3 space-y-3 text-slate-600 text-sm leading-relaxed">
              <p>
                Тест нь тодорхой шинж, хандлага, чадвар эсвэл тухайн үеийн
                байдлыг асуултын тусламжтай үнэлж, өөрийгөө илүү сайн ойлгоход
                ашигладаг нэг арга юм. Тест бүрийн зорилго, судалгааны үндэслэл,
                найдвартай байдал болон ашиглах эрх өөр байдаг.
              </p>
              <p>
                <b className="text-slate-800">Монголд нутагшуулсан тест</b> нь
                Монгол хэл, соёлын орчинд тохируулж validation буюу
                баталгаажуулалтын судалгаа хийсэн тест байна. Олон улсын тестийн
                эх сурвалж, лиценз болон Монголд судлагдсан эсэхийг тусад нь
                харуулна.
              </p>
              <p>
                Үр дүн таныг нэг үг, төрөл эсвэл оноогоор бүрэн тодорхойлохгүй.
                Харин зан чанар, хандлага, хэв маяг болон тухайн үеийн байдлаа
                өөр өнцгөөс ажиглах мэдээлэл болно.
              </p>
            </div>
          </details>
        </section>

        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Тест хайх</h2>
            <p className="mt-0.5 text-slate-500 text-xs leading-relaxed">
              Сэдэв эсвэл тестийн нэрээр ашиглах эрх нь тодорхой каталогоос
              хайна. Тохирох тест байхгүй бол шинэ стандарт тест зохиохгүй.
            </p>
          </div>
          <label className="relative block">
            <span className="sr-only">Хайх тестийн сэдэв</span>
            <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-slate-400" />
            <input
              className="h-11 w-full rounded-xl border border-slate-200 pr-3 pl-9 text-base outline-none focus:border-[#1F6FB2] focus:ring-2 focus:ring-blue-100 sm:text-sm"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Хайх тестийн сэдвээ бичнэ үү"
              type="search"
              value={query}
            />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              ["all", "Бүгд"],
              ["localized", "Монголд нутагшуулсан"],
              ["international", "Олон улсын"],
            ].map(([value, label]) => (
              <button
                className={`shrink-0 rounded-full border px-3 py-1.5 font-semibold text-xs transition ${
                  originFilter === value
                    ? "border-[#1F6FB2] bg-[#1F6FB2] text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-200"
                }`}
                key={value}
                onClick={() =>
                  setOriginFilter(
                    value as "all" | "localized" | "international"
                  )
                }
                type="button"
              >
                {label}
              </button>
            ))}
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
                String(filteredTests.length + (showPrimary ? 1 : 0))
              )}
            </span>
          </div>

          {filteredTests.length === 0 && !showPrimary ? (
            <div className="rounded-xl border border-slate-200 border-dashed px-4 py-8 text-center text-slate-500 text-sm">
              {query.trim()
                ? "Таны хайсан сэдэвт тохирох, ашиглах эрх нь тодорхой тест одоогоор олдсонгүй."
                : "Энэ ангилалд баталгаажсан тест одоогоор алга байна."}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {showPrimary && (
                <Link
                  className="group flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-left transition hover:border-blue-300 hover:shadow-md sm:p-4"
                  href="/mind/balance/result"
                >
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#1F6FB2] shadow-sm sm:size-10 sm:rounded-xl">
                    <ClipboardCheck className="size-4 sm:size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-slate-900 text-sm">
                      {copy.apps.relationsTests.primaryTitle}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-slate-600 text-xs leading-relaxed sm:text-sm">
                      {copy.apps.relationsTests.primaryDescription}
                    </span>
                    <span className="mt-2 block font-semibold text-[#1F6FB2] text-[11px]">
                      Өөрийгөө ажиглах асуулга · Эх сурвалж: Оюунсанаа
                    </span>
                  </span>
                  <ChevronRight className="mt-1 size-4 shrink-0 text-blue-400 transition group-hover:translate-x-0.5" />
                </Link>
              )}

              {filteredTests.map((test) => {
                const active = selectedSlug === test.slug;
                const originLabel =
                  test.origin === "localized"
                    ? "Монголд нутагшуулсан"
                    : test.origin === "international"
                      ? "Олон улсын"
                      : "Өөрийгөө ажиглах асуулга";
                return (
                  <button
                    className={`group flex items-start gap-3 rounded-xl border p-3 text-left transition hover:shadow-md sm:p-4 ${
                      active
                        ? "border-[#1F6FB2] bg-blue-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-blue-200"
                    }`}
                    key={test.id}
                    onClick={() => selectTest(test.slug)}
                    type="button"
                  >
                    <span
                      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg sm:size-10 sm:rounded-xl ${
                        active
                          ? "bg-[#1F6FB2] text-white"
                          : "bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-[#1F6FB2]"
                      }`}
                    >
                      <Brain className="size-4 sm:size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-slate-900 text-sm">
                        {test.title}
                      </span>
                      <span className="mt-1 line-clamp-2 block text-slate-600 text-xs leading-relaxed sm:text-sm">
                        {test.description ||
                          copy.apps.relationsTests.questionCount.replace(
                            "{count}",
                            String(test.questions.length)
                          )}
                      </span>
                      <span className="mt-2 block font-semibold text-[11px] text-slate-500">
                        {originLabel} · Эх сурвалж:{" "}
                        {test.source?.name ?? "Тодорхойгүй"}
                        {test.source?.usageRights
                          ? ` · ${test.source.usageRights}`
                          : ""}
                      </span>
                    </span>
                    <ChevronRight
                      className={`mt-1 size-4 shrink-0 transition group-hover:translate-x-0.5 ${
                        active ? "text-[#1F6FB2]" : "text-slate-400"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          )}
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

      {readResult && typeof document !== "undefined"
        ? createPortal(
            <div
              aria-modal="true"
              className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 font-sans"
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
            </div>,
            document.body
          )
        : null}
    </AppShell>
  );
}
