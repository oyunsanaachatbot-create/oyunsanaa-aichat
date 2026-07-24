"use client";

import { useEffect, useState } from "react";
import {
  loadLatest,
  type LatestTestResult,
} from "@/lib/apps/relations/tests/localStore";
import { useLocale, useT } from "@/lib/i18n/provider";

type ApiLatestTestResult = {
  test_slug?: string;
  test_title?: string;
  score_pct?: number;
  band_title?: string | null;
  band_summary?: string | null;
  created_at?: string;
};

type Props = {
  refreshKey?: number;
  onSelectTest?: (slug: string) => void;
};

const formatDate = (savedAtISO: string, locale: string) => {
  const date = new Date(savedAtISO);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const deduplicateResults = (items: LatestTestResult[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.testId)) return false;
    seen.add(item.testId);
    return true;
  });
};

export default function LatestResults({ refreshKey = 0, onSelectTest }: Props) {
  const copy = useT();
  const locale = useLocale();
  const [items, setItems] = useState<LatestTestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const localItems = loadLatest();
    const controller = new AbortController();
    let active = true;
    setItems(localItems);
    setLoading(true);

    fetch(`/api/relations/tests/results/latest?refresh=${refreshKey}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return [];
        return (await response.json()) as ApiLatestTestResult[];
      })
      .then((serverItems) => {
        const mapped = serverItems
          .filter(
            (item): item is ApiLatestTestResult & { test_slug: string } =>
              typeof item.test_slug === "string" && item.test_slug.length > 0
          )
          .map<LatestTestResult>((item) => ({
            testId: item.test_slug,
            title: item.test_title || item.test_slug,
            pct: Number.isFinite(item.score_pct) ? Number(item.score_pct) : 0,
            bandTitle:
              item.band_title || copy.apps.relationsTests.fallbackResultTitle,
            summary:
              item.band_summary ||
              copy.apps.relationsTests.missingResultSummary,
            savedAtISO: item.created_at || new Date().toISOString(),
          }));

        if (active) {
          setItems(deduplicateResults([...mapped, ...localItems]).slice(0, 8));
        }
      })
      .catch((error: unknown) => {
        if (
          active &&
          !(error instanceof DOMException && error.name === "AbortError")
        ) {
          setItems(localItems);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [
    copy.apps.relationsTests.fallbackResultTitle,
    copy.apps.relationsTests.missingResultSummary,
    refreshKey,
  ]);

  if (items.length === 0) {
    return (
      <div className="rounded-[20px] border border-slate-300 border-dashed bg-white/70 px-4 py-8 text-center">
        <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-slate-100 text-xl">
          {loading ? "…" : "✓"}
        </div>
        <h3 className="mt-3 font-bold text-slate-900">
          {loading
            ? copy.apps.relationsTests.loadingResultsTitle
            : copy.apps.relationsTests.emptyResultsTitle}
        </h3>
        <p className="mx-auto mt-1 max-w-md text-slate-500 text-sm leading-relaxed">
          {loading
            ? copy.apps.relationsTests.loadingResultsText
            : copy.apps.relationsTests.emptyResultsText}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <article
          className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm"
          key={item.testId}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="break-words font-bold text-slate-900">
                {item.title}
              </p>
              <p className="mt-1 font-semibold text-[#1F6FB2] text-sm">
                {item.bandTitle}
              </p>
            </div>
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 font-extrabold text-[#1F6FB2]">
              {item.pct}%
            </span>
          </div>

          <p className="mt-3 line-clamp-3 text-slate-600 text-sm leading-relaxed">
            {item.summary}
          </p>

          <div className="mt-4 flex items-center justify-between gap-3 border-slate-100 border-t pt-3">
            <span className="text-slate-400 text-xs">
              {formatDate(item.savedAtISO, locale)}
            </span>
            {onSelectTest ? (
              <button
                className="rounded-full bg-blue-50 px-3 py-1.5 font-semibold text-[#1F6FB2] text-xs hover:bg-blue-100"
                onClick={() => onSelectTest(item.testId)}
                type="button"
              >
                {copy.apps.relationsTests.retake}
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
