// app/(chat)/mind/balance/test/score.ts

import { BALANCE_QUESTIONS } from "./questions";
import { DOMAIN_LABELS, type BalanceDomain } from "./constants";

export type AnswersMap = Record<string, number>;

type DomainScore = {
  domain: BalanceDomain;
  label: string;
  percent: number; // 0-100
  avg: number; // 0-4
  answered: number;
  total: number;
};

export function calcScores(answers: AnswersMap) {
  const byDomain: Record<BalanceDomain, { sum: number; answered: number; total: number }> = {
    emotion: { sum: 0, answered: 0, total: 0 },
    self: { sum: 0, answered: 0, total: 0 },
    relations: { sum: 0, answered: 0, total: 0 },
    purpose: { sum: 0, answered: 0, total: 0 },
    selfCare: { sum: 0, answered: 0, total: 0 },
    life: { sum: 0, answered: 0, total: 0 },
  };

  for (const q of BALANCE_QUESTIONS) {
    byDomain[q.domain].total += 1;
    const v = answers[q.id];
    if (typeof v === "number") {
      byDomain[q.domain].answered += 1;
      byDomain[q.domain].sum += v;
    }
  }

  const domainScores: DomainScore[] = (Object.keys(byDomain) as BalanceDomain[]).map((domain) => {
    const d = byDomain[domain];
    const avg = d.answered > 0 ? d.sum / d.answered : 0;
    const percent = (avg / 4) * 100;
    return {
      domain,
      label: DOMAIN_LABELS[domain],
      avg,
      percent,
      answered: d.answered,
      total: d.total,
    };
  });

  const answeredCount = domainScores.reduce((a, d) => a + d.answered, 0);
  const totalCount = domainScores.reduce((a, d) => a + d.total, 0);

  const totalAvg =
    answeredCount > 0 ? domainScores.reduce((a, d) => a + d.avg * d.answered, 0) / answeredCount : 0;

  const totalPercent = (totalAvg / 4) * 100;

  return {
    domainScores: domainScores.map((d) => ({
      label: d.label,
      percent: d.percent,
      avg: d.avg,
      answered: d.answered,
      total: d.total,
    })),
    totalPercent,
    totalAvg,
    answeredCount,
    totalCount,
  };
}

export function interpret(percent: number) {
  const p = Math.max(0, Math.min(100, percent));

  if (p >= 80) {
    return {
      level: "Сайн",
      tone: "Ерөнхийдөө тогтвортой байна. Одоогийн жижиг, тогтмол дадлуудаа хадгалаарай.",
    };
  }
  if (p >= 60) {
    return {
      level: "Дунд зэрэг",
      tone: "Суурь нь боломжийн. Нэг жижиг зуршлыг тогтмол болговол хурдан сайжирна.",
    };
  }
  if (p >= 40) {
    return {
      level: "Анхаарах хэрэгтэй",
      tone: "Сүүлийн үед ачаалал/дэмжлэг дутагдсан байж магадгүй. Нэг чиглэлээс жижиг алхам сонгоорой.",
    };
  }
  return {
    level: "Тусламж хэрэгтэй",
    tone: "Ойрын өдрүүдэд өөртөө анхаарах шаардлагатай байна. Амралт, дэмжлэг, тогтмол жижиг алхмыг эхлүүлээрэй.",
  };
}
