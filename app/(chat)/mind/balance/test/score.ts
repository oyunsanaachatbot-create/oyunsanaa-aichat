// app/(chat)/mind/balance/test/score.ts
import { BALANCE_SCALE, DOMAIN_LABELS, type BalanceDomain } from "./constants";
import { BALANCE_QUESTIONS, type BalanceQuestion } from "./questions";

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

  // For richer narrative
  lowestDomains: { domain: BalanceDomain; score100: number; label: string }[];
  highestDomains: { domain: BalanceDomain; score100: number; label: string }[];
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function maxValueForQuestion(q: BalanceQuestion) {
  // options override байвал хамгийн их value-г авна
  const opts = q.options ?? BALANCE_SCALE;
  return Math.max(...opts.map((o) => o.value));
}

function normalizedTo100(raw: number, max: number) {
  if (max <= 0) return 0;
  return Math.round((raw / max) * 100);
}

function applyReverse(value: number, maxValue: number, reverse?: boolean) {
  if (!reverse) return value;
  return maxValue - value;
}

function pickLabelFromValue(q: BalanceQuestion, value: number) {
  const opts = q.options ?? BALANCE_SCALE;
  return opts.find((o) => o.value === value)?.label ?? String(value);
}

export function calcScores(answers: AnswersMap): BalanceResult {
  const totalCount = BALANCE_QUESTIONS.length;
  const answeredCount = BALANCE_QUESTIONS.filter((q) => typeof answers[q.id] === "number").length;

  const byDomain: Record<BalanceDomain, BalanceQuestion[]> = {
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

    const perQ: { q: BalanceQuestion; picked?: number; scored?: number; maxValue: number }[] = [];

    for (const q of questions) {
      const maxValue = maxValueForQuestion(q);
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

    // weakest 3 (answered ones)
    const weakest = perQ
      .filter((x) => typeof x.picked === "number" && typeof x.scored === "number")
      .map((x) => {
        const qScore100 = normalizedTo100(x.scored!, x.maxValue);
        return {
          id: x.q.id,
          text: x.q.text,
          pickedValue: x.picked!,
          score100: qScore100,
        };
      })
      .sort((a, b) => a.score100 - b.score100)
      .slice(0, 3);

    return {
      domain,
      label: DOMAIN_LABELS[domain],
      score100,
      raw,
      max,
      answered,
      total,
      weakest,
    };
  });

  // Total = бүх домайны raw/max нийлбэр
  const totalRaw = domainScores.reduce((s, d) => s + d.raw, 0);
  const totalMax = domainScores.reduce((s, d) => s + d.max, 0);
  const totalScore100 = normalizedTo100(totalRaw, totalMax);

  const sorted = [...domainScores].sort((a, b) => a.score100 - b.score100);
  const lowestDomains = sorted.slice(0, 2).map((d) => ({ domain: d.domain, score100: d.score100, label: d.label }));
  const highestDomains = sorted.slice(-2).reverse().map((d) => ({ domain: d.domain, score100: d.score100, label: d.label }));

  return {
    totalScore100,
    answeredCount,
    totalCount,
    domainScores,
    lowestDomains,
    highestDomains,
  };
}

// Дүгнэлтийн тайлбарын level
export function levelFrom100(score100: number) {
  const s = clamp(score100, 0, 100);
  if (s >= 80) return { level: "Маш сайн", tone: "Таны тэнцвэр ихэвчлэн тогтвортой байна. Одоо байгаа хэв маягаа хадгалах жижиг дадлууд хамгийн сайн хамгаалалт." };
  if (s >= 60) return { level: "Сайн", tone: "Ерөнхий тэнцвэр боломжийн. Гэхдээ 1–2 чиглэл дээр бага зэрэг анхаарах юм бол илүү амар тайван болно." };
  if (s >= 40) return { level: "Дунд", tone: "Тэнцвэр хэлбэлзэж байж магадгүй. Нэг жижиг алхам сонгоод 7 хоног тогтмол хийвэл мэдэгдэхүйц сайжирна." };
  return { level: "Анхаарах хэрэгтэй", tone: "Одоогоор ачаалал/дэмжлэгийн дутагдал мэдрэгдэж байж магадгүй. Өөрийгөө буруутгахгүйгээр хамгийн жижиг алхмаас эхэл." };
}

export function domainNarrative(domainLabel: string, score100: number) {
  if (score100 >= 80) return `${domainLabel} чиглэлд таны суурь зуршил, орчин, ур чадвар харьцангуй тогтвортой байна. Үүнийг хадгалах жижиг тогтмол дадал л хэрэгтэй.`;
  if (score100 >= 60) return `${domainLabel} боломжийн түвшинд байна. Зарим үед хэлбэлздэг хэсгийг тодруулж, нэг жижиг дадлыг тогтмолжуулахад л хангалттай.`;
  if (score100 >= 40) return `${domainLabel} дээр ачаалал/төөрөгдөл мэдрэгдэж магадгүй. Өдөрт 5–10 минутын нэг дадал сонгоод туршвал хамгийн хурдан нөлөө өгдөг.`;
  return `${domainLabel} чиглэл дээр ойрын үед дэмжлэг/систем дутаж байгаа шинжтэй. Энд “их зүйл” биш, хамгийн жижиг нэг өөрчлөлт л эхлэл болно.`;
}

export function tinyStepSuggestion(domain: BalanceDomain) {
  switch (domain) {
    case "emotion":
      return "Өнөөдөр 3 минут: амьсгал (4-4-6) + “Одоо би юу мэдэрч байна?” гэж 1 өгүүлбэрээр тэмдэглэ.";
    case "self":
      return "Өнөөдөр 5 минут: “Надад яг одоо хамгийн хэрэгтэй зүйл юу вэ?” гэж 1 хариулт бич.";
    case "relations":
      return "Өнөөдөр 1 жижиг алхам: нэг хүнд “Сайн байна уу, чи ямар байна?” гэж чин сэтгэлээсээ мессеж бич.";
    case "purpose":
      return "Өнөөдөр 5 минут: энэ 7 хоногт хийх 1 жижиг зорилго сонго (маш жижиг!).";
    case "selfCare":
      return "Өнөөдөр 10 минут: алхалт эсвэл ус уух/хоолны цагийг нэг удаа тогтворжуул.";
    case "life":
      return "Өнөөдөр 1 жижиг дүрэм: унтах цаг/ажлын цагийн нэг жижиг хязгаарыг тогтоо.";
    default:
      return "Өнөөдөр нэг жижиг алхам сонгоод 7 хоног туршаарай.";
  }
}

export function answerSummaryLine(q: BalanceQuestion, pickedValue: number) {
  const maxV = maxValueForQuestion(q);
  const scored = applyReverse(pickedValue, maxV, q.reverse);
  const score100 = normalizedTo100(scored, maxV);
  const label = pickLabelFromValue(q, pickedValue);
  return { label, score100 };
}
