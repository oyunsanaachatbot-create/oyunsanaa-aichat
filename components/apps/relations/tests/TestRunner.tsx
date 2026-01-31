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
  pct01: number; // 0..1
  pct100: number; // 0..100
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

    // ✅ TS reduce overload асуудлыг тасална (number accumulator)
    const sum = filled.reduce<number>((acc, v) => acc + Number(v), 0);

    const max = filled.length * 4; // нэг асуулт max=4
    const pct01 = max > 0 ? sum / max : 0;
    const pct100 = Math.round(pct01 * 100);

    // ✅ band сонголт: minPct (0..1) хамгийн өндөр таарсныг авна
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

    // ✅ Сүүлчийн асуулт биш бол автоматаар дараагийн асуулт руу
    if (!isLast) setIdx((v) => Math.min(v + 1, total - 1));
  }

  function goPrev() {
    setIdx((v) => Math.max(0, v - 1));
  }

  function goNext() {
    // ✅ сонгоогүй бол дараагийнх руу явуулахгүй
    if (!currentPicked) return;
    setIdx((v) => Math.min(total - 1, v + 1));
  }

  function openResult() {
    // ✅ зөвхөн бүгд бөглөгдсөн үед
    if (!allDone) return;
    setShowResult(true);
  }

  function closeResult() {
    // ✅ хаахад эхлэл рүү буцаана
    setShowResult(false);
    setIdx(0);
    setAnswers(Array.from({ length: total }, () => null));
    onClose?.();
  }

  if (!current || total === 0) return null;

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      {/* ✅ Давхар гарчиг бичихгүй — зөвхөн явц */}
      <div className="mb-3">
        <div className="mb-2 flex items-center justify-between text-xs text-white/70">
          <div>
            {idx + 1}/{total} • {progressPct}%
          </div>
          <div className="text-white/60">{test.title}</div>
        </div>

        <div className="h-2 w-full rounded-full bg-white/10">
          <div
            className="h-2 rounded-full bg-white/35"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Асуулт */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-lg font-extrabold text-white">
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
                    ? "border-white/30 bg-white/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10",
                ].join(" ")}
              >
                <span
                  className={[
                    "h-5 w-5 rounded-full border",
                    active ? "border-white/60 bg-white/30" : "border-white/25",
                  ].join(" ")}
                  aria-hidden
                />
                <span className="text-white/90">{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Доод товчнууд */}
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={goPrev}
            disabled={idx === 0}
            className="h-11 flex-1 rounded-xl border border-white/10 bg-white/5 text-white/90 disabled:opacity-40"
          >
            Буцах
          </button>

          {!isLast ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!currentPicked}
              className="h-11 flex-1 rounded-xl border border-white/10 bg-white/10 text-white disabled:opacity-40"
              title={!currentPicked ? "Эхлээд хариултаа сонго" : ""}
            >
              Дараах
            </button>
          ) : (
            <button
              type="button"
              onClick={openResult}
              disabled={!allDone}
              className="h-11 flex-1 rounded-xl border border-white/20 bg-white/15 text-white disabled:opacity-40"
              title={!allDone ? "Бүх асуултад хариулаад дараарай" : ""}
            >
              Хариу
            </button>
          )}
        </div>
      </div>

      {/* ✅ Дүгнэлт — зөвхөн “Хариу” дарахад гарна */}
      {showResult ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b2740] p-5 text-white shadow-2xl">
            <div className="text-sm font-semibold text-white/80">Дүгнэлт</div>

            <div className="mt-1 text-4xl font-extrabold">
              {result.pct100}%
            </div>

            <div className="mt-3 text-lg font-bold">
              {result.band?.title ?? "Дүгнэлт"}
            </div>

            <div className="mt-2 text-sm leading-relaxed text-white/85">
              {result.band?.summary ?? "Тайлбар бэлдээгүй байна."}
            </div>

            {result.band?.tips?.length ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-white/85">
                {result.band.tips.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            ) : null}

            <button
              type="button"
              onClick={closeResult}
              className="mt-5 h-12 w-full rounded-xl border border-white/15 bg-white/10 font-semibold"
            >
              Хаах
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
