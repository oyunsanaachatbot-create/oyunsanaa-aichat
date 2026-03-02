import { HealthQuestionnaire, MacroTargets } from "./healthTypes";

export function calculateTargets(q: HealthQuestionnaire): {
  bmi: number;
  targets: MacroTargets;
  summaryText: string;
} {
  const hM = q.heightCm / 100;
  const bmi = q.weightKg / (hM * hM);

  // Mifflin-St Jeor (ойролцоо)
  const base =
    q.sex === "female"
      ? 10 * q.weightKg + 6.25 * q.heightCm - 5 * q.age - 161
      : 10 * q.weightKg + 6.25 * q.heightCm - 5 * q.age + 5;

  let activity = 1.2;
  if (q.exercisePerWeek >= 5) activity = 1.55;
  else if (q.exercisePerWeek >= 3) activity = 1.4;
  else if (q.exercisePerWeek >= 1) activity = 1.3;

  // илүүдэл жинтэй бол 15% бууруулах, дутагдалтай бол нэмэх (зөөлөн)
  const isOver = bmi >= 25;
  const isUnder = bmi < 18.5;

  const factor = isOver ? 0.85 : isUnder ? 1.10 : 1.0;
  const calories = Math.round(base * activity * factor);

  // макро: уураг 25%, өөх 25%, нүүрс 50%
  // грамм руу: protein/carbs=4kcal per g, fat=9kcal per g
  const protein_g = Math.round((calories * 0.25) / 4);
  const carbs_g = Math.round((calories * 0.50) / 4);
  const fat_g = Math.round((calories * 0.25) / 9);

  const water_l = Math.max(1.5, Math.min(3.5, +(q.weightKg * 0.03).toFixed(1)));
  const steps = 8000;

  const summaryText =
    "Калори багасгах нь гол биш — хамгийн чухал нь шим тэжээлээ хоолноос тэнцвэртэй авах. Оюунсанаа таны өдрийн макро тэнцвэрийг ил тод харуулж, бага багаар зөв дадал суулгана.";

  return {
    bmi: +bmi.toFixed(1),
    targets: { calories, protein_g, carbs_g, fat_g, water_l, steps },
    summaryText,
  };
}
