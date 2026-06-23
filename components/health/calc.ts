// components/health/calc.ts
import type { Locale } from "@/lib/i18n/config";
import type { HealthProfilePayload, HealthTargets } from "./healthTypes";

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

const CALC_STRINGS: Record<Locale, {
  bmiMissing: string;
  bmiUnder: string;
  bmiNormal: string;
  bmiOver: string;
  bmiObese: string;
  keepStable: string;
  loseGoal: (kg: number) => string;
  gainGoal: (kg: number) => string;
  waterPerDay: (l: number) => string;
  stepsPerDay: (steps: number) => string;
}> = {
  mn: {
    bmiMissing: "BMI тооцоход өндөр/жин дутуу байна.",
    bmiUnder: "Жингийн дутагдалтай",
    bmiNormal: "Хэвийн",
    bmiOver: "Илүүдэл жинтэй",
    bmiObese: "Таргалалттай",
    keepStable: "Жингээ тогтвортой барихад анхааръя.",
    loseGoal: (kg) => `Аюулгүйгээр аажмаар бууруулах зорилт: ~${kg}кг.`,
    gainGoal: (kg) => `Эрүүл аргаар нэмэх/булчин хөгжүүлэх зорилт: ~${kg}кг.`,
    waterPerDay: (l) => `Өдөрт ус: ~${l} л.`,
    stepsPerDay: (steps) => `Өдөрт алхалт: ~${steps} алхам.`,
  },
  en: {
    bmiMissing: "Height/weight is missing to calculate BMI.",
    bmiUnder: "Underweight",
    bmiNormal: "Normal",
    bmiOver: "Overweight",
    bmiObese: "Obese",
    keepStable: "Let's focus on keeping your weight stable.",
    loseGoal: (kg) => `Goal: gradually and safely lose ~${kg}kg.`,
    gainGoal: (kg) => `Goal: gain weight/build muscle in a healthy way ~${kg}kg.`,
    waterPerDay: (l) => `Water per day: ~${l} L.`,
    stepsPerDay: (steps) => `Steps per day: ~${steps} steps.`,
  },
  ja: {
    bmiMissing: "BMIを計算するには身長・体重が必要です。",
    bmiUnder: "低体重",
    bmiNormal: "標準",
    bmiOver: "過体重",
    bmiObese: "肥満",
    keepStable: "体重を安定して保つことに気をつけましょう。",
    loseGoal: (kg) => `目標：安全に徐々に減量 ~${kg}kg。`,
    gainGoal: (kg) => `目標：健康的に増量・筋肉を増やす ~${kg}kg。`,
    waterPerDay: (l) => `1日の水分: ~${l} L。`,
    stepsPerDay: (steps) => `1日の歩数: ~${steps}歩。`,
  },
  ko: {
    bmiMissing: "BMI를 계산하려면 키/체중이 필요합니다.",
    bmiUnder: "저체중",
    bmiNormal: "정상",
    bmiOver: "과체중",
    bmiObese: "비만",
    keepStable: "체중을 안정적으로 유지하는 데 신경 써봅시다.",
    loseGoal: (kg) => `목표: 안전하게 천천히 ~${kg}kg 감량.`,
    gainGoal: (kg) => `목표: 건강하게 체중을 늘리거나 근육을 키우기 ~${kg}kg.`,
    waterPerDay: (l) => `하루 수분: ~${l} L.`,
    stepsPerDay: (steps) => `하루 걸음 수: ~${steps}걸음.`,
  },
};

export function calcBMI(heightCm?: number | null, weightKg?: number | null) {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiLabel(bmi: number | null, locale: Locale = "mn") {
  const s = CALC_STRINGS[locale];
  if (bmi === null) return s.bmiMissing;
  if (bmi < 18.5) return `BMI ${round1(bmi)} · ${s.bmiUnder}`;
  if (bmi < 25) return `BMI ${round1(bmi)} · ${s.bmiNormal}`;
  if (bmi < 30) return `BMI ${round1(bmi)} · ${s.bmiOver}`;
  return `BMI ${round1(bmi)} · ${s.bmiObese}`;
}

export function idealWeightKg(heightCm?: number | null) {
  if (!heightCm || heightCm <= 0) return null;
  const m = heightCm / 100;
  return round1(22 * m * m); // target BMI ~ 22
}

export function computeTargets(payload: HealthProfilePayload, locale: Locale = "mn"): HealthTargets {
  const s = CALC_STRINGS[locale];
  const bmi = calcBMI(payload.heightCm, payload.weightKg);
  const ideal = idealWeightKg(payload.heightCm);

  // Ус: 30ml/kg
  const waterL = payload.weightKg ? round1(payload.weightKg * 0.03) : null;

  // Алхам: алхалт/дасгалын түвшнээс
  let steps = 7000;
  if (payload.walkingLevel === "low") steps = 6000;
  if (payload.walkingLevel === "medium") steps = 8000;
  if (payload.walkingLevel === "high") steps = 10000;

  // Калори + макро: энгийн “жин барих / бууруулах / нэмэх” heuristic
  // (хуучин app-ийн зорилго: ерөнхий зөвлөмж + хялбар тооцоо)
  let calories: number | null = null;
  let proteinG: number | null = null;
  let carbsG: number | null = null;
  let fatG: number | null = null;

  if (payload.weightKg && payload.heightCm && payload.age) {
    // Mifflin-St Jeor ойролцоолол
    const w = payload.weightKg;
    const h = payload.heightCm;
    const a = payload.age;
    const isMale = payload.gender === "male";
    const bmr = isMale ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;

    // activity multiplier (алхалт/дасгал)
    let mult = 1.35;
    if (payload.exerciseFreq === "weekly1" || payload.exerciseFreq === "weekly2_3") mult = 1.45;
    if (payload.exerciseFreq === "daily") mult = 1.55;

    let tdee = bmr * mult;

    // BMI-аас хамааруулж зорилт (тасархай биш, маш энгийн)
    if (bmi !== null && bmi >= 25) tdee = tdee - 300; // бууруулах
    else if (bmi !== null && bmi < 18.5) tdee = tdee + 250; // нэмэх

    calories = Math.max(1200, Math.round(tdee));

    // Protein 1.6g/kg (хөдөлгөөнтэй бол арай их)
    const p = payload.exerciseFreq === "daily" ? 1.8 : 1.6;
    proteinG = Math.round(w * p);

    // Fat ~ 0.8g/kg (доод хязгаар)
    fatG = Math.round(w * 0.8);

    // Carbs = үлдэгдэл
    // kcal: protein 4, carbs 4, fat 9
    const used = proteinG * 4 + fatG * 9;
    const remain = calories - used;
    carbsG = Math.max(50, Math.round(remain / 4));
  }

  const summaryParts: string[] = [];
summaryParts.push(bmiLabel(bmi, locale));

const w = payload.weightKg ?? null;

if (ideal !== null && w !== null) {
  const diff = round1(w - ideal);
  if (Math.abs(diff) < 2) summaryParts.push(s.keepStable);
  else if (diff > 0) summaryParts.push(s.loseGoal(diff));
  else summaryParts.push(s.gainGoal(Math.abs(diff)));
}
  if (waterL !== null) summaryParts.push(s.waterPerDay(waterL));
  summaryParts.push(s.stepsPerDay(steps));

  return {
    bmi: bmi ? round1(bmi) : null,
    bmiText: bmiLabel(bmi, locale),
    idealWeightKg: ideal,
    targetCalories: calories,
    targetProteinG: proteinG,
    targetCarbsG: carbsG,
    targetFatG: fatG,
    targetWaterL: waterL,
    targetSteps: steps,
    summary: summaryParts.join(" "),
  };
}
