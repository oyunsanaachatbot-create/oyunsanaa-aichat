import type { BalanceDomain } from "./constants";
import { BALANCE_QUESTIONS, type BalanceQuestion } from "./questions";

export type BalanceAnswerValue = 1 | 2 | 3 | 4 | 5;

export type BalanceAnswers = Record<string, BalanceAnswerValue>; // questionId -> value

export type DomainScore = {
  domain: BalanceDomain;
  score: number; // 0..100
  rawAvg: number; // 1..5
  answered: number;
  total: number;
};

export type BalanceResult = {
  createdAt: string;
  overallScore: number; // 0..100
  domains: Record<BalanceDomain, DomainScore>;
};

function normalizeTo100(avg1to5: number) {
  // 1..5 -> 0..100
  // 1 => 0, 3 => 50, 5 => 100
  return Math.round(((avg1to5 - 1) / 4) * 100);
}

function applyReverse(q: BalanceQuestion, v: BalanceAnswerValue): BalanceAnswerValue {
  if (!q.reverse) return v;
  // 1<->5, 2<->4, 3 stays
  return (6 - v) as BalanceAnswerValue;
}

export function computeBalanceResult(answers: BalanceAnswers): BalanceResult {
  const byDomain = new Map<BalanceDomain, BalanceQuestion[]>();
  for (const q of BALANCE_QUESTIONS) {
    const arr = byDomain.get(q.domain) ?? [];
    arr.push(q);
    byDomain.set(q.domain, arr);
  }

  const domains = {} as Record<BalanceDomain, DomainScore>;
  let overallSum = 0;
  let overallCount = 0;

  for (const [domain, qs] of byDomain.entries()) {
    let sum = 0;
    let count = 0;

    for (const q of qs) {
      const v = answers[q.id];
      if (!v) continue;
      sum += applyReverse(q, v);
      count += 1;
    }

    const avg = count > 0 ? sum / count : 0;
    const score100 = count > 0 ? normalizeTo100(avg) : 0;

    domains[domain] = {
      domain,
      score: score100,
      rawAvg: count > 0 ? Math.round(avg * 100) / 100 : 0,
      answered: count,
      total: qs.length,
    };

    if (count > 0) {
      overallSum += avg;
      overallCount += 1;
    }
  }

  const overallAvg = overallCount > 0 ? overallSum / overallCount : 0;
  const overallScore = overallCount > 0 ? normalizeTo100(overallAvg) : 0;

  return {
    createdAt: new Date().toISOString(),
    overallScore,
    domains,
  };
}
