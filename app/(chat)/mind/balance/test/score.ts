import type { BalanceQuestion, BalanceCategory } from "./questions";
import type { BalanceValue } from "./constants";

export type AnswersMap = Record<string, BalanceValue>;

export type BalanceResult = {
  totalScore: number;
  totalMax: number;
  percent: number; // 0-100
  level: "Сайн" | "Дунд" | "Анхаарах";
  byCategory: Record<
    BalanceCategory,
    { score: number; max: number; percent: number }
  >;
  message: string;
  tips: Array<{ title: string; items: string[] }>;
};

const CATEGORIES: BalanceCategory[] = [
  "Сэтгэл санаа",
  "Өөрийгөө ойлгох",
  "Харилцаа",
  "Зорилго, утга учир",
  "Өөрийгөө хайрлах",
  "Тогтвортой байдал",
];

export function computeBalanceResult(
  questions: BalanceQuestion[],
  answers: AnswersMap
): BalanceResult {
  const byCategory: BalanceResult["byCategory"] = Object.fromEntries(
    CATEGORIES.map((c) => [c, { score: 0, max: 0, percent: 0 }])
  ) as any;

  let totalScore = 0;
  let totalMax = 0;

  for (const q of questions) {
    const v = answers[q.id];
    const max = 4;

    // бөглөөгүй бол 0 гэж тооцохгүй — max ч нэмэхгүй
    if (v === undefined) continue;

    totalScore += v;
    totalMax += max;

    byCategory[q.category].score += v;
    byCategory[q.category].max += max;
  }

  for (const c of CATEGORIES) {
    const s = byCategory[c].score;
    const m = byCategory[c].max;
    byCategory[c].percent = m === 0 ? 0 : Math.round((s / m) * 100);
  }

  const percent = totalMax === 0 ? 0 : Math.round((totalScore / totalMax) * 100);

  let level: BalanceResult["level"] = "Сайн";
  if (percent < 50) level = "Анхаарах";
  else if (percent < 75) level = "Дунд";

  const message =
    level === "Сайн"
      ? "Таны сэтгэлийн тэнцвэр ерөнхийдөө сайн байна. Энэ хэв маягаа хадгалах жижиг дадлуудаа үргэлжлүүлээрэй."
      : level === "Дунд"
      ? "Таны тэнцвэр боломжийн байна. Зарим хэсэгт сайжруулах боломж харагдаж байна."
      : "Одоогоор тэнцвэрийн түвшинд анхаарах дохио байна. Жижиг алхмаар, тогтмол дэмжлэг хэрэгтэй байж магадгүй.";

  const tips: BalanceResult["tips"] = [
    {
      title: "Өнөөдөр хийх 3 жижиг алхам",
      items: [
        "10 минут алхах эсвэл сунгалт хийх",
        "1 зүйлд талархал бичих",
        "Унтахын өмнө 15 минут дэлгэцгүй байх",
      ],
    },
    {
      title: "Дараагийн 7 хоногийн төлөв",
      items: [
        "Өдөр бүр 1 удаа богино амралт (2–5 минут) хийх",
        "1 харилцаанд илүү тодорхой хил хязгаар тавих",
        "1 зорилгод жижиг алхам (15–30 минут) хийх",
      ],
    },
  ];

  return { totalScore, totalMax, percent, level, byCategory, message, tips };
}
