// components/health/calc.ts
import type { HealthProfilePayload, HealthTargets } from "./healthTypes";

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export function calcBMI(heightCm?: number | null, weightKg?: number | null) {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiLabel(bmi: number | null) {
  if (bmi === null) return "BMI тооцоход өндөр/жин дутуу байна.";
  if (bmi < 18.5) return `BMI ${round1(bmi)} · Жингийн дутагдалтай`;
  if (bmi < 25) return `BMI ${round1(bmi)} · Хэвийн`;
  if (bmi < 30) return `BMI ${round1(bmi)} · Илүүдэл жинтэй`;
  return `BMI ${round1(bmi)} · Таргалалттай`;
}

export function idealWeightKg(heightCm?: number | null) {
  if (!heightCm || heightCm <= 0) return null;
  const m = heightCm / 100;
  return round1(22 * m * m); // target BMI ~ 22
}

export function computeTargets(payload: HealthProfilePayload): HealthTargets {
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
summaryParts.push(bmiLabel(bmi));

const w = payload.weightKg ?? null;

if (ideal !== null && w !== null) {
  const diff = round1(w - ideal);
  if (Math.abs(diff) < 2) summaryParts.push("Жингээ тогтвортой барихад анхааръя.");
  else if (diff > 0) summaryParts.push(`Аюулгүйгээр аажмаар бууруулах зорилт: ~${diff}кг.`);
  else summaryParts.push(`Эрүүл аргаар нэмэх/булчин хөгжүүлэх зорилт: ~${Math.abs(diff)}кг.`);
}
  if (waterL !== null) summaryParts.push(`Өдөрт ус: ~${waterL} л.`);
  summaryParts.push(`Өдөрт алхалт: ~${steps} алхам.`);

  return {
    bmi: bmi ? round1(bmi) : null,
    bmiText: bmiLabel(bmi),
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
