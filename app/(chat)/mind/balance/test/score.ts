// app/(chat)/mind/balance/test/score.ts
import { BALANCE_SCALE_VALUES, type BalanceDomain } from "./constants";
import { BALANCE_QUESTIONS, type BalanceQuestionMeta } from "./questions";
import type { Dictionary } from "@/lib/i18n/dictionaries/mn";

export type BalanceDict = Dictionary["apps"]["balance"];

export type AnswersMap = Record<string, number>;

export type DomainScore = {
  domain: BalanceDomain;
  label: string;

  // 0..100
  score100: number;

  // raw details
  raw: number;
  max: number;
  answered: number;
  total: number;

  // weakest questions for this domain
  weakest: { id: string; text: string; pickedValue: number; score100: number }[];
};

export type BalanceResult = {
  totalScore100: number;
  answeredCount: number;
  totalCount: number;
  domainScores: DomainScore[];

  lowestDomains: { domain: BalanceDomain; score100: number; label: string }[];
  highestDomains: { domain: BalanceDomain; score100: number; label: string }[];
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

const MAX_VALUE = Math.max(...BALANCE_SCALE_VALUES);

function normalizedTo100(raw: number, max: number) {
  if (max <= 0) return 0;
  return Math.round((raw / max) * 100);
}

function applyReverse(value: number, maxValue: number, reverse?: boolean) {
  if (!reverse) return value;
  // reverse: хамгийн өндөр нь сайн болох ёстой
  return maxValue - value;
}

function pickLabelFromValue(value: number, dict: BalanceDict) {
  const idx = BALANCE_SCALE_VALUES.indexOf(value as any);
  return idx >= 0 ? dict.scaleLabels[idx] : String(value);
}

export function calcScores(answers: AnswersMap, dict: BalanceDict): BalanceResult {
  const totalCount = BALANCE_QUESTIONS.length;
  const answeredCount = BALANCE_QUESTIONS.filter((q) => typeof answers[q.id] === "number").length;

  const byDomain: Record<BalanceDomain, BalanceQuestionMeta[]> = {
    emotion: [],
    self: [],
    relations: [],
    purpose: [],
    selfCare: [],
    life: [],
  };

  for (const q of BALANCE_QUESTIONS) byDomain[q.domain].push(q);

  const domainScores: DomainScore[] = (Object.keys(byDomain) as BalanceDomain[]).map((domain) => {
    const questions = byDomain[domain];
    const total = questions.length;

    let raw = 0;
    let max = 0;
    let answered = 0;

    const perQ: { q: BalanceQuestionMeta; picked?: number; scored?: number; maxValue: number }[] = [];

    for (const q of questions) {
      const maxValue = MAX_VALUE;
      max += maxValue;

      const picked = answers[q.id];
      if (typeof picked === "number") {
        answered += 1;
        const scored = applyReverse(picked, maxValue, q.reverse);
        raw += scored;
        perQ.push({ q, picked, scored, maxValue });
      } else {
        perQ.push({ q, maxValue });
      }
    }

    const score100 = normalizedTo100(raw, max);

    const weakest = perQ
      .filter((x) => typeof x.picked === "number" && typeof x.scored === "number")
      .map((x) => {
        const qScore100 = normalizedTo100(x.scored!, x.maxValue);
        return {
          id: x.q.id,
          text: dict.questions[x.q.id as keyof typeof dict.questions] ?? x.q.id,
          pickedValue: x.picked!,
          score100: qScore100,
        };
      })
      .sort((a, b) => a.score100 - b.score100)
      .slice(0, 3);

    return {
      domain,
      label: dict.domainLabels[domain],
      score100,
      raw,
      max,
      answered,
      total,
      weakest,
    };
  });

  const totalRaw = domainScores.reduce((s, d) => s + d.raw, 0);
  const totalMax = domainScores.reduce((s, d) => s + d.max, 0);
  const totalScore100 = normalizedTo100(totalRaw, totalMax);

  const sorted = [...domainScores].sort((a, b) => a.score100 - b.score100);
  const lowestDomains = sorted
    .slice(0, 2)
    .map((d) => ({ domain: d.domain, score100: d.score100, label: d.label }));
  const highestDomains = sorted
    .slice(-2)
    .reverse()
    .map((d) => ({ domain: d.domain, score100: d.score100, label: d.label }));

  return {
    totalScore100,
    answeredCount,
    totalCount,
    domainScores,
    lowestDomains,
    highestDomains,
  };
}

// ----------------------------
// 1) Level (богино тодорхойлолт)
// ----------------------------
export function levelFrom100(score100: number, dict: BalanceDict) {
  const s = clamp(score100, 0, 100);
  if (s >= 80) return dict.levels.excellent;
  if (s >= 60) return dict.levels.good;
  if (s >= 40) return dict.levels.mid;
  return dict.levels.attention;
}

// ----------------------------
// 2) Domain narrative (чиглэл тус бүр)
// ----------------------------
export function domainNarrative(domainLabel: string, score100: number, dict: BalanceDict) {
  const bands = dict.domainNarrativeBands;
  const template =
    score100 >= 80 ? bands.strong : score100 >= 60 ? bands.good : score100 >= 40 ? bands.mid : bands.low;
  return template.replace("{label}", domainLabel);
}

// ----------------------------
// 3) Tiny step suggestion (богино санал)
// ----------------------------
export function tinyStepSuggestion(domain: BalanceDomain, dict: BalanceDict) {
  return dict.tinyStep[domain] ?? dict.tinyStep.default;
}

// ----------------------------
// 4) Answer summary line (UI-д 25/100 гэх мэт)
// ----------------------------
export function answerSummaryLine(q: BalanceQuestionMeta, pickedValue: number, dict: BalanceDict) {
  const maxV = MAX_VALUE;
  const scored = applyReverse(pickedValue, maxV, q.reverse);
  const score100 = normalizedTo100(scored, maxV);
  const label = pickLabelFromValue(pickedValue, dict);
  return { label, score100 };
}

// =====================================================================
// ✅ Амьд, “зөвлөгөөгүй” үндсэн дүгнэлт (8–12+ хувилбар)
// =====================================================================
export type BalanceNarrative = {
  headline: string;
  summary: string;
  meaning: string;
  focus: string;
  strength: string;
};

function band(score100: number) {
  const s = clamp(score100, 0, 100);
  if (s < 35) return "low" as const;
  if (s < 55) return "mid" as const;
  if (s < 75) return "good" as const;
  return "strong" as const;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick<T>(seed: number, items: T[]): T {
  const r = mulberry32(seed)();
  return items[Math.floor(r * items.length)] ?? items[0];
}

export function buildNarrative(opts: {
  totalScore100: number;
  weakestLabels: string[];
  strongestLabel?: string;
  seed: number;
  dict: BalanceDict;
}): BalanceNarrative {
  const { totalScore100, weakestLabels, strongestLabel, seed, dict } = opts;
  const b = band(totalScore100);
  const n = dict.narrative;

  const headline = pick(seed, n.headlines);
  const meaning = pick(seed + 1, n.meaningByBand[b]);

  const w1 = weakestLabels[0] ?? "—";
  const w2 = weakestLabels[1] ?? "";
  const weakestLine = w2 ? `${w1} ${n.and} ${w2}` : w1;

  const focus = pick(seed + 2, n.focusTemplates).replace("{weakestLine}", weakestLine);

  const strength = strongestLabel
    ? pick(seed + 3, n.strengthTemplates).replace("{label}", strongestLabel)
    : n.noStrength;

  const summary = pick(seed + 4, n.summaryTemplates).replace("{score}", String(totalScore100));

  return { headline, summary, meaning, focus, strength };
}
