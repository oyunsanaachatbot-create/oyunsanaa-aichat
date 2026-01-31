"use client";

import { useMemo, useState } from "react";
import type {
  TestBand,
  TestDefinition,
  TestOptionValue,
} from "@/lib/apps/relations/tests/types";

type Props = {
  test: TestDefinition;
  onClose?: () => void;
};

type ResultView = {
  pct01: number;
  pct100: number;
  band: TestBand | null;
};

export default function TestRunner({ test, onClose }: Props) {
  const total = test.questions?.length ?? 0;

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<(TestOptionValue | null)[]>(
    Array.from({ length: total }, () => null)
  );
  const [showResult, setShowResult] = useState(false);

  const current = total > 0 ? test.questions[idx] : null;
  const isLast = total > 0 ? idx === total - 1 : false;
  const currentPicked = answers[idx] !== null;

  const doneCount = useMemo(
    () => answers.filter((a) => a !== null).length,
    [answers]
  );
  const progressPct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const allDone = total > 0 ? doneCount === total : false;

  const result: ResultView = useMemo(() => {
    const filled = answers.filter((a): a is TestOptionValue => a !== null);
    const sum = filled.reduce<number>((acc, v) => acc + Number(v), 0);

    const max = filled.length * 4;
    const pct01 = max > 0 ? sum / max : 0;
    const pct100 = Math.round(pct01 * 100);

    const sorted = [...(test.bands ?? [])].sort((a, b) => a.minPct - b.minPct);
    let picked: TestBand | null = null;
    for (const b of sorted) {
      if (pct01 >= b.minPct) picked = b;
    }
    return { pct01, pct100, band: picked };
  }, [answers, test.bands]);

  function pick(value: TestOptionValue) {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
    if (!isLast) setIdx((v) => Math.min(v + 1, total - 1));
  }

  function goPrev() {
    setIdx((v) => Math.max(0, v - 1));
  }

  function goNext() {
    if (!currentPicked) return;
    setIdx((v) => Math.min(total - 1, v + 1));
  }

  function openResult() {
    if (!allDone) return;
    setShowResult(true);
  }

  function closeResult() {
    setShowResult(false);
    setIdx(0);
    setAnswers(Array.from({ length: total }, () => null));
    onClose?.();
  }

  if (!current || total === 0) return null;

  return (
    <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
      {/* Давхар header бичихгүй — зөвхөн явц */}
      <div className="mb-3">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <div>
            {idx + 1}/{total} • {progressPct}%
          </div>
          <div className="truncate">{test.title}</div>
        </div>

        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary/60"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="text-lg font-extrabold text-foreground">
          {current.text}
        </div>

        <div className="mt-4 grid gap-3">
          {current.options.map((opt) => {
            const active = answers[idx] === opt.value;
            return (
              <button
                key={`${current.id}-${opt.value}`}
                type="button"
                onClick={() => pick(opt.value)}
                className={[
                  "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left",
                  "transition active:scale-[0.99]",
                  active
                    ? "border-primary/40 bg-primary/10"
                    : "border-border bg-muted/40 hover:bg-muted",
                ].join(" ")}
              >
                <span
                  className={[
                    "h-5 w-5 rounded-full border",
                    active ? "border-primary bg-primary/30" : "border-border",
                  ].join(" ")}
                  aria-hidden
                />
                <span className="text-foreground">{opt.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={goPrev}
            disabled={idx === 0}
            className="h-11 flex-1 rounded-xl border border-border bg-muted/40 text-foreground disabled:opacity-40"
          >
            Буцах
          </button>

          {!isLast ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!currentPicked}
              className="h-11 flex-1 rounded-xl border border-border bg-primary/15 text-foreground disabled:opacity-40"
              title={!currentPicked ? "Эхлээд хариултаа сонго" : ""}
            >
              Дараах
            </button>
          ) : (
            <button
              type="button"
              onClick={openResult}
              disabled={!allDone}
              className="h-11 flex-1 rounded-xl border border-border bg-primary/20 text-foreground disabled:opacity-40"
              title={!allDone ? "Бүх асуултад хариулаад дараарай" : ""}
            >
              Хариу
            </button>
          )}
        </div>
      </div>

      {showResult ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-5 text-foreground shadow-2xl">
            <div className="text-sm font-semibold text-muted-foreground">
              Дүгнэлт
            </div>

            <div className="mt-1 text-4xl font-extrabold">
              {result.pct100}%
            </div>

            <div className="mt-3 text-lg font-bold">
              {result.band?.title ?? "Дүгнэлт"}
            </div>

            <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {result.band?.summary ?? "Тайлбар бэлдээгүй байна."}
            </div>

            {result.band?.tips?.length ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {result.band.tips.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            ) : null}

            <button
              type="button"
              onClick={closeResult}
              className="mt-5 h-12 w-full rounded-xl border border-border bg-muted font-semibold"
            >
              Хаах
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
