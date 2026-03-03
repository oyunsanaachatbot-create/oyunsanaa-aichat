// components/health/calc.ts
import type { HealthProfile, HealthTargets } from "./healthTypes";

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export function calculateTargets(profile: HealthProfile): HealthTargets {
  const h = profile.heightCm ?? null;
  const w = profile.weightKg ?? null;

  let bmi: number | null = null;
  let bmiLabel = "BMI тооцоход өндөр/жин дутуу байна.";

  if (h && w && h > 0 && w > 0) {
    const m = h / 100;
    bmi = w / (m * m);

    if (bmi < 18.5) bmiLabel = `BMI ${round1(bmi)} · Жингийн дутагдалтай`;
    else if (bmi < 25) bmiLabel = `BMI ${round1(bmi)} · Хэвийн`;
    else if (bmi < 30) bmiLabel = `BMI ${round1(bmi)} · Илүүдэл жинтэй`;
    else bmiLabel = `BMI ${round1(bmi)} · Таргалалттай`;
  }

  let idealWeightKg: number | null = null;
  if (h && h > 0) {
    const m = h / 100;
    idealWeightKg = round1(22 * m * m); // target BMI ~ 22
  }

  const waterLitersPerDay = w ? round1(w * 0.03) : null; // 30ml/kg

  // зөвлөмжийн summary (товч, UI дээр уншихад эвтэй)
  const parts: string[] = [];
  if (bmi !== null) parts.push(bmiLabel);
  if (idealWeightKg !== null && w !== null) {
    const diff = round1(w - idealWeightKg);
    if (Math.abs(diff) < 2) parts.push("Жингээ тогтвортой барихад анхааръя.");
    else if (diff > 0) parts.push(`Аюулгүйгээр аажмаар бууруулах зорилт: ~${diff}кг.`);
    else parts.push(`Эрүүл аргаар нэмэх/булчин хөгжүүлэх зорилт: ~${Math.abs(diff)}кг.`);
  }
  if (waterLitersPerDay !== null) parts.push(`Өдөрт ус: ~${waterLitersPerDay} л (доод тал нь).`);

  return {
    bmi: bmi ? round1(bmi) : null,
    bmiLabel,
    idealWeightKg,
    waterLitersPerDay,
    summary: parts.join(" "),
  };
}
