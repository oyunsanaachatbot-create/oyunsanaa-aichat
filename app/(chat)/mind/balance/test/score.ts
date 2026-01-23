import type { BalanceDomain, BalanceValue } from "./constants";
import type { BalanceQuestion } from "./questions";

export type AnswersMap = Record<string, BalanceValue | undefined>;

export type DomainScore = {
  domain: BalanceDomain;
  answered: number;
  avg: number; // 0..4
  percent: number; // 0..100
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export function computeScores(qs: BalanceQuestion[], answers: AnswersMap) {
  const domains: BalanceDomain[] = ["emotion", "self", "relations", "purpose", "selfCare", "life"];

  const domainScores: Record<BalanceDomain, DomainScore> = {} as any;

  for (const d of domains) {
    const items = qs.filter((q) => q.domain === d);
    const vals: number[] = items
      .map((q) => answers[q.id])
      .filter((v): v is BalanceValue => typeof v === "number")
      .map((v) => Number(v));

    const answered = vals.length;
    const avg = answered ? vals.reduce((a, b) => a + b, 0) / answered : 0;
    const percent = clamp((avg / 4) * 100, 0, 100);

    domainScores[d] = { domain: d, answered, avg, percent };
  }

  const allVals: number[] = qs
    .map((q) => answers[q.id])
    .filter((v): v is BalanceValue => typeof v === "number")
    .map((v) => Number(v));

  const totalAvg = allVals.length ? allVals.reduce((a, b) => a + b, 0) / allVals.length : 0;
  const totalPercent = clamp((totalAvg / 4) * 100, 0, 100);

  return {
    domainScores,
    totalAvg,
    totalPercent,
    answeredCount: allVals.length,
    totalCount: qs.length,
  };
}
