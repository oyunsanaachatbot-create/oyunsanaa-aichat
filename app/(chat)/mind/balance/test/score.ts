 import type { BalanceDomain, BalanceValue } from "./constants";
import { BALANCE_QUESTIONS } from "./questions";

export type AnswersMap = Record<string, BalanceValue>;

type DomainScore = {
  domain: BalanceDomain;
  answered: number;
  totalQuestions: number;
  sum: number;      // 0..4*count
  avg: number;      // 0..4
  percent: number;  // 0..100
};

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

export function scoreByDomain(answers: AnswersMap) {
  const domains: BalanceDomain[] = ["emotion", "self", "relations", "purpose", "selfCare", "life"];

  const domainScores: DomainScore[] = domains.map((domain) => {
    const qs = BALANCE_QUESTIONS.filter((q) => q.domain === domain);
    const values = qs
      .map((q) => answers[q.id])
      .filter((v) => typeof v === "number") as BalanceValue[];

const sum = values.reduce<number>((a, b) => a + b, 0);

    const answered = values.length;
    const totalQuestions = qs.length;

    const avg = answered ? sum / answered : 0;
    const percent = answered ? (avg / 4) * 100 : 0;

    return { domain, answered, totalQuestions, sum, avg, percent };
  });

  const allVals = BALANCE_QUESTIONS
    .map((q) => answers[q.id])
    .filter((v) => typeof v === "number") as BalanceValue[];

 const totalAvg =
  allVals.length ? allVals.reduce<number>((a, b) => a + b, 0) / allVals.length : 0;

  const totalPercent = clamp((totalAvg / 4) * 100, 0, 100);

  return { domainScores, totalAvg, totalPercent, answeredCount: allVals.length, totalCount: BALANCE_QUESTIONS.length };
}

export function levelFromAvg(avg0to4: number) {
  if (avg0to4 >= 3.4) return "Сайн (тогтвортой)";
  if (avg0to4 >= 2.6) return "Дунджаас дээш";
  if (avg0to4 >= 1.8) return "Дунд зэрэг";
  if (avg0to4 >= 1.0) return "Сайжруулах хэрэгтэй";
  return "Анхаарах шаардлагатай";
}
