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

  lowestDomains: { domain: BalanceDomain; score100: number; label: string }[];
  highestDomains: { domain: BalanceDomain; score100: number; label: string }[];
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function maxValueForQuestion(q: BalanceQuestion) {
  const opts = q.options ?? BALANCE_SCALE;
  return Math.max(...opts.map((o) => o.value));
}

function normalizedTo100(raw: number, max: number) {
  if (max <= 0) return 0;
  return Math.round((raw / max) * 100);
}

function applyReverse(value: number, maxValue: number, reverse?: boolean) {
  if (!reverse) return value;
  // reverse: хамгийн өндөр нь сайн болох ёстой
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
export function levelFrom100(score100: number) {
  const s = clamp(score100, 0, 100);
  if (s >= 80)
    return {
      level: "Маш сайн",
      tone:
        "Ерөнхий тэнцвэр тогтвортой байна. Зарим өдөр хэлбэлзэж болох ч суурь чинь сайн ажиллаж байна.",
    };
  if (s >= 60)
    return {
      level: "Сайн",
      tone:
        "Ерөнхийдөө боломжийн. Гэхдээ 1–2 чиглэл дээр илүү мэдрэгдэж буй савлагаа байж магадгүй.",
    };
  if (s >= 40)
    return {
      level: "Дунд",
      tone:
        "Зарим талдаа боломжийн, зарим талдаа савлагаатай зураглал. Энэ түвшин олон хүнд хамгийн нийтлэг байдаг.",
    };
  return {
    level: "Анхаарах хэрэгтэй",
    tone:
      "Одоогоор олон зүйл зэрэг ачаалал авч байж магадгүй. Энэ нь “муу” гэсэн үг биш — дэмжлэг/нөөцөө дахин тэнцвэржүүлэх хэрэгтэй гэсэн дохио.",
  };
}

// ----------------------------
// 2) Domain narrative (чиглэл тус бүр)
// ----------------------------
export function domainNarrative(domainLabel: string, score100: number) {
  if (score100 >= 80)
    return `${domainLabel} чиглэлд таны суурь тогтвортой байна. Энд “хадгалж хамгаалах” л хамгийн зөв хөдөлгөөн.`;
  if (score100 >= 60)
    return `${domainLabel} боломжийн түвшинд байна. Зарим үед л савлаж магадгүй — тогтвортой байлгах жижиг хэвшил хэрэгтэй.`;
  if (score100 >= 40)
    return `${domainLabel} дээр савлагаа мэдрэгдэж байна. Энэ нь ихэвчлэн ачаалал/орчин/хүлээлттэй хамт хэлбэлздэг.`;
  return `${domainLabel} чиглэл дээр ойрын үед дэмжлэг сул байж магадгүй. “Их өөрчлөлт” биш, жижиг тогтвортой алхам л эхлэл болно.`;
}

// ----------------------------
// 3) Tiny step suggestion (богино санал)
// ----------------------------
export function tinyStepSuggestion(domain: BalanceDomain) {
  switch (domain) {
    case "emotion":
      return "Өнөөдөр 3 минут: амьсгал (4-4-6) + “Одоо би юу мэдэрч байна?” гэж 1 өгүүлбэр бич.";
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

// ----------------------------
// 4) Answer summary line (UI-д 25/100 гэх мэт)
// ----------------------------
export function answerSummaryLine(q: BalanceQuestion, pickedValue: number) {
  const maxV = maxValueForQuestion(q);
  const scored = applyReverse(pickedValue, maxV, q.reverse);
  const score100 = normalizedTo100(scored, maxV);
  const label = pickLabelFromValue(q, pickedValue);
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
  if (s < 35) return "low";
  if (s < 55) return "mid";
  if (s < 75) return "good";
  return "strong";
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
}): BalanceNarrative {
  const { totalScore100, weakestLabels, strongestLabel, seed } = opts;
  const b = band(totalScore100);

  const headline = pick(seed, [
    "Таны өнөөдрийн зураглал",
    "Одоогийн тэнцвэрийн дүр зураг",
    "Өнөөдрийн байдал ямар харагдаж байна вэ?",
    "Сэтгэлийн тэнцвэрийн тойм",
    "Таны одоогийн чиг баримжаа",
    "Өнөөдрийн ерөнхий зураг",
    "Тэнцвэрийн товч тайлан",
    "Таны одоогийн хэмнэл",
    "Одоогийн төлөвийн зураг",
    "Таны өнөөдрийн дүгнэлт",
    "Өнөөдрийн дотоод зураглал",
    "Одоогийн байдал: тойм",
  ]);

  const scoreMeaningByBand: Record<string, string[]> = {
    low: [
      "Оноо бага байна гэдэг нь “муу” гэсэн шүүлт биш. Харин сүүлийн үед дэмжлэг, тогтвортой байдал, энерги 2–3 чиглэл дээр зэрэг сулрах хандлагатайг л илтгэнэ.",
      "Энэ түвшин ихэнхдээ олон зүйл давхцсан үед гардаг. Чи сул хүн гэсэн үг биш — харин систем/орчин/дотоод нөөц зэрэг нь зэрэг ачаалал авч байгааг харуулж байна.",
      "Одоогийн оноо бол нэг өдрийн бодит зураглал. Зарим үед хүний дотоод тэнцвэр “тасархай” мэт мэдрэгддэг бөгөөд энэ нь хэвийн үзэгдэл байж болно.",
    ],
    mid: [
      "Оноо дунд түвшинд байна. Энэ нь “зарим талдаа боломжийн, зарим талдаа савлагаатай” гэсэн зураглал.",
      "Дунд оноо нь хоёр өөр ертөнц зэрэгцэж байгааг хэлдэг: нэг талдаа дажгүй ажиллаж буй зүйлс, нөгөө талдаа тогтворгүй мэдрэмж өгөх хэсгүүд.",
      "Энэ түвшин бол олон хүний хамгийн нийтлэг төлөв. Сайн талууд чинь байгаа, гэхдээ тогтвортой байдал тийм ч жигд биш байна.",
    ],
    good: [
      "Оноо сайн түвшинд байна. Ерөнхий суурь боломжийн, өдөр тутмын савлагаа ихэвчлэн удирдаж болох хэмжээнд байна.",
      "Сайн түвшин гэдэг нь тогтвортой зуршлуудын нөлөө мэдэгдэж эхэлснийг илтгэнэ. Зарим чиглэлд бага зэрэг хэлбэлзэл хэвээр байж болно.",
      "Энэ зураглалд таны ерөнхий хэмнэл боломжийн байна — дотоод нөөц тань ажиллаж байна гэсэн үг.",
    ],
    strong: [
      "Оноо өндөр байна. Ерөнхий тэнцвэр тогтвортой, дотоод нөөц болон орчны дэмжлэг харьцангуй сайн ажиллаж байна.",
      "Өндөр оноо нь “бүгд төгс” гэсэн үг биш ч таны суурь тогтвортой байгааг хэлдэг.",
      "Энэ түвшин бол тогтвортой суурь байна гэсэн дохио. Ховор сулрах цэг байж болох ч нийт зураг сайн байна.",
    ],
  };

  const meaning = pick(seed + 1, scoreMeaningByBand[b]);

  const w1 = weakestLabels[0] ?? "—";
  const w2 = weakestLabels[1] ?? "";
  const weakestLine = w2 ? `${w1} ба ${w2}` : w1;

  const focus = pick(seed + 2, [
    `Одоогийн зураглал дээр хамгийн “доош татсан” хэсгүүд бол ${weakestLine}. Энэ нь тухайн чиглэлүүд дээр тогтвортой байдал, итгэл, мэдрэмжийн хэлбэлзэл илүү мэдрэгдэж болохыг харуулна.`,
    `${weakestLine} чиглэлүүдэд оноо харьцангуй доогуур байна. Энэ нь “чадахгүй” гэсэн үг биш — харин таны амьдралын энэ үед хамгийн их мэдрэгдэж буй хэсгүүд энд төвлөрч байгааг л хэлнэ.`,
    `Хамгийн эмзэг цэгүүд ${weakestLine} тал руу илүү байна. Ихэвчлэн энэ нь орчин, ачаалал, харилцаа, дотоод хүлээлт зэрэгтэй хамт хөдөлдөг.`,
    `Онооны хэлбэлзэл хамгийн ихээр ${weakestLine} дээр мэдрэгдэж байна. Энэ нь таны өдрүүдийн мэдрэмжийг хамгийн их өөрчилдөг талууд байж магадгүй.`,
  ]);

  const strength = pick(
    seed + 3,
    strongestLabel
      ? [
          `Давуу тал: ${strongestLabel}. Энэ чиглэл чинь одоогоор “суурь” мэт ажиллаж байна — бусад хэсэг савлах үед дотоод тулгуур болж өгдөг.`,
          `Харьцангуй тогтвортой харагдсан хэсэг: ${strongestLabel}. Энэ нь таны системд ажиллаж байгаа зүйлс байна гэсэн дохио.`,
          `Сайн ажиллаж буй чиглэл: ${strongestLabel}. Ийм “баттай” хэсэг байхад бусад талууд аажмаар тэнцвэржинэ.`,
        ]
      : [
          "Давуу талын чиглэл тодорхой ялгарахгүй байна. Энэ нь ихэвчлэн бүх чиглэл ойролцоо хэлбэлзэж байгаатай холбоотой байж болно.",
        ]
  );

  const summary = pick(seed + 4, [
    `Нийт оноо ${totalScore100}/100. Энэ бол өнөөдрийн бодит зураглал — таны дотоод тэнцвэр ямар хэмнэлтэй байгааг л харуулж байна.`,
    `Таны оноо ${totalScore100}/100. Энэ нь “шүүлт” биш, харин одоогийн төлөвийн хэмжүүр.`,
    `Өнөөдрийн зураглал: ${totalScore100}/100. Зарим чиглэл тогтвортой, зарим нь илүү мэдрэгдэж байна.`,
    `Оноо ${totalScore100}/100 байна. Энэ нь таны өнөөдрийн дотоод хэмнэл ямар байгааг харуулна.`,
  ]);

  return { headline, summary, meaning, focus, strength };
}
