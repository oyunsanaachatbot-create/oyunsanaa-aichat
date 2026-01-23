// app/(chat)/mind/balance/test/score.ts
import type { BalanceValue, BalanceDomain } from "./constants";
import { DOMAIN_LABEL } from "./constants";
import { BALANCE_QUESTIONS } from "./questions";

export type AnswersMap = Record<string, BalanceValue | undefined>;

export type DomainScore = {
  domain: BalanceDomain;
  label: string;
  avg: number;        // 0..4
  percent: number;    // 0..100
  answered: number;
  total: number;
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function calcScores(answers: AnswersMap) {
  const byDomain: Record<BalanceDomain, BalanceValue[]> = {
    emotion: [],
    self: [],
    relations: [],
    purpose: [],
    selfCare: [],
    life: [],
  };

  for (const q of BALANCE_QUESTIONS) {
    const v = answers[q.id];
    if (typeof v === "number") byDomain[q.domain].push(v);
  }

  const domainScores: DomainScore[] = (Object.keys(byDomain) as BalanceDomain[]).map((domain) => {
    const vals = byDomain[domain];
    const total = BALANCE_QUESTIONS.filter((q) => q.domain === domain).length;
    const answered = vals.length;

    const avg =
      answered === 0 ? 0 : vals.reduce<number>((a, b) => a + b, 0) / answered;

    const percent = clamp((avg / 4) * 100, 0, 100);

    return {
      domain,
      label: DOMAIN_LABEL[domain],
      avg,
      percent,
      answered,
      total,
    };
  });

  const allVals = Object.values(byDomain).flat();
  const totalAvg =
    allVals.length === 0 ? 0 : allVals.reduce<number>((a, b) => a + b, 0) / allVals.length;
  const totalPercent = clamp((totalAvg / 4) * 100, 0, 100);

  return {
    domainScores,
    totalAvg,
    totalPercent,
    answeredCount: allVals.length,
    totalCount: BALANCE_QUESTIONS.length,
  };
}

export function interpret(percent: number) {
  if (percent >= 80) return { level: "Тогтвортой", tone: "Сайн тогтвортой байна." };
  if (percent >= 60) return { level: "Хэвийн", tone: "Ерөнхийдөө боломжийн, бага зэрэг анхаарах зүйл байна." };
  if (percent >= 40) return { level: "Савлагаатай", tone: "Сүүлийн үед тогтворгүй/савлагаатай байж магадгүй." };
  if (percent >= 20) return { level: "Ядралтай", tone: "Ачаалал өндөр, дэмжлэг/амралт хэрэгтэй үе байж магадгүй." };
  return { level: "Тайван биш", tone: "Одоо үеийн байдал тайван биш байна. Яаралтай жижиг алхам хэрэгтэй." };
}
