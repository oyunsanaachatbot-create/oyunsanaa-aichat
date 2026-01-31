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

const BRAND = "#1F6FB2";

export default function TestRunner({ test, onClose }: Props) {
  const total = test.questions?.length ?? 0;

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<(TestOptionValue | null)[]>(
    Array.from({ length: total }, () => null)
  );
  const [showResult, setShowResult] = useState(false);

  const current = total > 0 ? test.questions[idx] : null;

  const doneCount = useMemo(
    () => answers.filter((a) => a !== null).length,
    [answers]
  );
  const allDone = total > 0 ? doneCount === total : false;
  const progressPct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const result: ResultView = useMemo(() => {
    const filled = answers.filter((a): a is TestOptionValue => a !== null);
    const sum = filled.reduce<number>((acc, v) => acc + Number(v), 0);
    const max = filled.length * 4;
    const pct01 = max > 0 ? sum / max : 0;
    const pct100 = Math.round(pct01 * 100);

    const sorted = [...(test.bands ?? [])].sort((a, b) => a.minPct - b.minPct);
    let picked: TestBand | null = null;
    for (const b of sorted) if (pct01 >= b.minPct) picked = b;

    return { pct01, pct100, band: picked };
  }, [answers, test.bands]);

  function pick(value: TestOptionValue) {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });

    // автоматаар дараагийн асуулт руу
    if (idx < total - 1) setIdx((v) => Math.min(v + 1, total - 1));
  }

  function openResult() {
    if (!allDone) return;
    setShowResult(true);
  }

  function closeResult() {
    setShowResult(false);
    // энд reset хийхгүй — дараагийн тестээ сонгоод үргэлжлүүлэхэд амар
    // хэрвээ “хаахад эхнээс нь болго” гэж хүсвэл доорхийг uncomment хийнэ:
    // setIdx(0);
    // setAnswers(Array.from({ length: total }, () => null));
    onClose?.();
  }

  if (!current || total === 0) return null;

  return (
    <div
      className="mt-4 rounded-[22px] p-[1px] shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
      style={{
        background:
          "linear-gradient(180deg, rgba(31,111,178,0.55), rgba(6,25,45,0.55))",
      }}
    >
      <div className="rounded-[22px] bg-gradient-to-b from-[#061a2e] via-[#07223a] to-[#041221] px-4 py-4 text-white">
        {/* ✅ давхар гарчигнуудыг больсон: зөвхөн жижиг meta */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-xs text-white/70">
            {idx + 1}/{total} • {progressPct}%
          </div>
          <div className="truncate text-xs text-white/60">{test.title}</div>
        </div>

        <div className="mb-4 h-2 w-full rounded-full bg-white/10">
          <div
            className="h-2 rounded-full"
            style={{
              width: `${progressPct}%`,
              background: `linear-gradient(90deg, ${BRAND}, rgba(31,111,178,0.55))`,
              boxShadow: "0 0 18px rgba(31,111,178,0.55)",
            }}
          />
        </div>

        <div className="rounded-[18px] border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="text-[18px] font-extrabold leading-snug">
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
                    "flex items-center gap-3 rounded-[16px] border px-4 py-3 text-left",
                    "transition active:scale-[0.99]",
                    active
                      ? "border-white/25 bg-white/10"
                      : "border-white/10 bg-white/[0.06] hover:bg-white/[0.10]",
                  ].join(" ")}
                >
                  <span
                    className="h-5 w-5 rounded-full border"
                    style={{
                      borderColor: active ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.18)",
                      background: active
                        ? `radial-gradient(circle at 40% 40%, rgba(31,111,178,0.9), rgba(31,111,178,0.25))`
                        : "transparent",
                      boxShadow: active ? "0 0 16px rgba(31,111,178,0.45)" : "none",
                    }}
                    aria-hidden
                  />
                  <span className="text-white/90">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* ✅ Доор зөвхөн “Хариу” — бүх асуулт дууссаны дараа л гарна */}
          {allDone ? (
            <div className="mt-5">
              <button
                type="button"
                onClick={openResult}
                className="h-12 w-full rounded-[14px] font-semibold text-white"
                style={{
                  background: `linear-gradient(180deg, rgba(31,111,178,0.95), rgba(31,111,178,0.65))`,
                  boxShadow: "0 14px 40px rgba(31,111,178,0.25)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                Хариу
              </button>
            </div>
          ) : null}
        </div>

        {/* ✅ Result modal */}
        {showResult ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-md rounded-[20px] border border-white/12 bg-gradient-to-b from-[#061a2e] to-[#041221] p-5 text-white shadow-2xl">
              <div className="text-sm font-semibold text-white/70">Дүгнэлт</div>

              <div className="mt-1 text-4xl font-extrabold">
                {result.pct100}%
              </div>

              <div className="mt-3 text-lg font-bold">
                {result.band?.title ?? "Дүгнэлт"}
              </div>

              <div className="mt-2 text-sm leading-relaxed text-white/75">
                {result.band?.summary ?? "Тайлбар бэлдээгүй байна."}
              </div>

              {result.band?.tips?.length ? (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-white/75">
                  {result.band.tips.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              ) : null}

              <button
                type="button"
                onClick={closeResult}
                className="mt-5 h-12 w-full rounded-[14px] font-semibold text-white"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.14)",
                }}
              >
                Хаах
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
