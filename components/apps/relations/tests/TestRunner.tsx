"use client";

import { useMemo, useState } from "react";
import type { TestDefinition, TestOptionValue } from "@/lib/apps/relations/tests/types";

type Answers = Record<string, TestOptionValue | undefined>;

export default function TestRunner({ test }: { test: TestDefinition }) {
  const totalQ = test.questions.length;

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const current = test.questions[idx];

  const { pct, band, isDone } = useMemo(() => {
    const vals = Object.values(answers).filter(
      (v): v is TestOptionValue => v !== undefined
    );

    const sum = vals.reduce<number>((s, v) => s + Number(v), 0);

    const maxPerQ = 4; // 0..4
    const max = totalQ * maxPerQ;
    const pct = max === 0 ? 0 : sum / max;

    const sorted = [...test.bands].sort((a, b) => b.minPct - a.minPct);
    const found = sorted.find((b) => pct >= b.minPct) ?? sorted[sorted.length - 1];

    const isDone = vals.length === totalQ;

    return { pct, band: found, isDone };
  }, [answers, test.bands, totalQ]);

  function pick(value: TestOptionValue) {
    setAnswers((prev) => ({ ...prev, [current.id]: value }));
  }

  function next() {
    setIdx((v) => Math.min(v + 1, totalQ - 1));
  }

  function back() {
    setIdx((v) => Math.max(v - 1, 0));
  }

  return (
    <div className={test?.ui?.bodyClassName ?? ""}>
      <div className={test?.ui?.containerClassName ?? ""}>
        {/* Энд чинь танай existing CSS class-ууд байвал тэдгээрийг хэрэглэ.
            Хэрвээ styles ашигладаг бол дээр нь styles импортлоод солино. */}
      </div>
    </div>
  );
}
