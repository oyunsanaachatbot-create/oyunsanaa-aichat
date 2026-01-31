"use client";

import React, { useMemo, useState } from "react";
import type { TestDefinition, TestOptionValue, TestQuestion } from "@/lib/apps/relations/tests/types";

type Props = {
  test: TestDefinition;
  onClose?: () => void;
};

type ResultView = {
  pct01: number;   // 0..1
  pct100: number;  // 0..100
  title: string;
  summary: string;
  tips: string[];
};

function clamp01(n: number) {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function pickBand(test: TestDefinition, pct01: number) {
  const bands = [...(test.bands ?? [])].sort((a, b) => a.minPct - b.minPct);
  let chosen = bands[0];
  for (const b of bands) {
    if (pct01 >= b.minPct) chosen = b;
  }
  return chosen ?? { minPct: 0, title: "Дүгнэлт", summary: "Тайлбар бэлдээгүй байна.", tips: [] };
}

export default function TestRunner({ test, onClose }: Props) {
  const total = test?.questions?.length ?? 0;

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<TestOptionValue[]>([]);
  const [selected, setSelected] = useState<TestOptionValue | null>(null);
  const [showResult, setShowResult] = useState(false);

  const q: TestQuestion | null = total > 0 ? test.questions[idx] : null;

  const progressPct = useMemo(() => {
    if (total <= 0) return 0;
    return Math.round((Math.min(idx, total) / total) * 100);
  }, [idx, total]);

  const result: ResultView = useMemo(() => {
    const sum = answers.reduce<number>((a, b) => a + b, 0);
    const max = total * 4;
    const pct01 = clamp01(max > 0 ? sum / max : 0);
    const pct100 = Math.round(pct01 * 100);

    const band = pickBand(test, pct01);
    return {
      pct01,
      pct100,
      title: band.title,
      summary: band.summary,
      tips: band.tips ?? [],
    };
  }, [answers, total, test]);

  function resetToStart() {
    setIdx(0);
    setAnswers([]);
    setSelected(null);
    setShowResult(false);
  }

  function pick(value: TestOptionValue) {
    // сонголтоо тэмдэглээд, доор "Хариу" товч идэвхжинэ
    setSelected(value);
  }

  function next() {
    if (selected == null || !q) return;

    const nextAnswers = [...answers];
    nextAnswers[idx] = selected;
    setAnswers(nextAnswers);
    setSelected(null);

    const nextIdx = idx + 1;
    if (nextIdx < total) {
      setIdx(nextIdx);
      return;
    }

    // дууссан
    setShowResult(true);
  }

  function closeResult() {
    // “Хаах” дархад энэ тестийн эхлэл рүү буцна
    resetToStart();
    onClose?.();
  }

  if (!q) return null;

  const options = q.options ?? [];

  // --- INLINE styles (CSS эвдэрсэн ч UI задарч унахгүй) ---
  const S = {
    card: {
      maxWidth: 900,
      margin: "16px auto",
      padding: "16px",
      borderRadius: 18,
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.10)",
      backdropFilter: "blur(10px)",
    } as React.CSSProperties,
    head: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 } as React.CSSProperties,
    title: { fontSize: 18, fontWeight: 800, color: "rgba(255,255,255,0.92)" } as React.CSSProperties,
    meta: { fontSize: 13, color: "rgba(255,255,255,0.70)" } as React.CSSProperties,
    track: {
      height: 8,
      borderRadius: 999,
      background: "rgba(255,255,255,0.10)",
      overflow: "hidden",
      marginTop: 10,
    } as React.CSSProperties,
    fill: {
      height: "100%",
      width: `${progressPct}%`,
      background: "rgba(31,111,178,0.95)", // brand #1F6FB2
    } as React.CSSProperties,
    qText: { marginTop: 14, fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.92)" } as React.CSSProperties,
    choices: { display: "grid", gap: 10, marginTop: 12 } as React.CSSProperties,
    btn: (active: boolean) =>
      ({
        width: "100%",
        textAlign: "left",
        padding: "14px 14px",
        borderRadius: 14,
        border: active ? "1px solid rgba(31,111,178,0.9)" : "1px solid rgba(255,255,255,0.14)",
        background: active ? "rgba(31,111,178,0.25)" : "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.92)",
        fontSize: 16,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
      }) as React.CSSProperties,
    radio: (active: boolean) =>
      ({
        width: 18,
        height: 18,
        borderRadius: 999,
        border: active ? "6px solid rgba(31,111,178,0.95)" : "2px solid rgba(255,255,255,0.55)",
        boxSizing: "border-box",
        flex: "0 0 auto",
      }) as React.CSSProperties,
    footer: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 } as React.CSSProperties,
    nextBtn: (enabled: boolean) =>
      ({
        padding: "12px 16px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.14)",
        background: enabled ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.15)",
        color: enabled ? "#0b1b2a" : "rgba(255,255,255,0.60)",
        fontWeight: 800,
        cursor: enabled ? "pointer" : "not-allowed",
        minWidth: 120,
      }) as React.CSSProperties,

    modalBackdrop: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      zIndex: 50,
    } as React.CSSProperties,
    modal: {
      width: "min(560px, 100%)",
      borderRadius: 18,
      background: "rgba(10,35,55,0.92)",
      border: "1px solid rgba(255,255,255,0.14)",
      backdropFilter: "blur(12px)",
      padding: 16,
    } as React.CSSProperties,
    modalTitle: { fontSize: 14, letterSpacing: 0.2, color: "rgba(255,255,255,0.70)" } as React.CSSProperties,
    modalScore: { fontSize: 52, fontWeight: 900, marginTop: 6, color: "rgba(255,255,255,0.92)" } as React.CSSProperties,
    modalBoxTitle: { fontSize: 18, fontWeight: 900, marginTop: 6, color: "rgba(255,255,255,0.92)" } as React.CSSProperties,
    modalBody: { marginTop: 8, color: "rgba(255,255,255,0.78)", lineHeight: 1.45, fontSize: 14 } as React.CSSProperties,
    tips: { marginTop: 10, display: "grid", gap: 6 } as React.CSSProperties,
    tip: {
      padding: "10px 12px",
      borderRadius: 14,
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.12)",
      color: "rgba(255,255,255,0.86)",
      fontSize: 14,
    } as React.CSSProperties,
    modalClose: {
      width: "100%",
      marginTop: 12,
      padding: "12px 14px",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.14)",
      background: "rgba(255,255,255,0.92)",
      color: "#0b1b2a",
      fontWeight: 900,
      cursor: "pointer",
    } as React.CSSProperties,
  };

  return (
    <>
      <div style={S.card}>
        <div style={S.head}>
          <div style={S.title}>{test.title}</div>
          <div style={S.meta}>
            {Math.min(idx + 1, total)}/{total} • {progressPct}%
          </div>
        </div>

        <div style={S.track}>
          <div style={S.fill} />
        </div>

        <div style={S.qText}>{q.text}</div>

        <div style={S.choices}>
          {options.map((c) => {
            const active = selected === c.value;
            return (
              <button
                key={c.value}
                type="button"
                style={S.btn(active)}
                onClick={() => pick(c.value)}
              >
                <span style={S.radio(active)} aria-hidden />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>

        <div style={S.footer}>
          <button type="button" style={S.nextBtn(selected != null)} onClick={next} disabled={selected == null}>
            {idx + 1 < total ? "Хариу" : "Дүгнэлт"}
          </button>
        </div>
      </div>

      {showResult ? (
        <div style={S.modalBackdrop} role="dialog" aria-modal="true">
          <div style={S.modal}>
            <div style={S.modalTitle}>Дүгнэлт</div>
            <div style={S.modalScore}>{result.pct100}%</div>
            <div style={S.modalBoxTitle}>{result.title}</div>
            <div style={S.modalBody}>{result.summary}</div>

            {result.tips?.length ? (
              <div style={S.tips}>
                {result.tips.slice(0, 6).map((t, i) => (
                  <div key={i} style={S.tip}>
                    • {t}
                  </div>
                ))}
              </div>
            ) : null}

            <button type="button" style={S.modalClose} onClick={closeResult}>
              Хаах
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
