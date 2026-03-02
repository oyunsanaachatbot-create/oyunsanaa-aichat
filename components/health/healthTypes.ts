export type Sex = "male" | "female";

export type HealthQuestionnaire = {
  startDate: string; // yyyy-mm-dd
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;

  sleepHours: number;      // бодит цаг
  waterLiters: number;     // бодит литр
  exercisePerWeek: number; // 0-7
  stepsPerDay?: number;    // optional

  // муу зуршил / хоолны чанар
  junkScore: number; // 0-10
};

export type MacroTargets = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  water_l: number;
  steps: number;
};

export type MealBreakdown = {
  name?: string;
  calories: number;
  protein_g: number;
  good_carbs_g: number;
  bad_carbs_g: number;
  fat_g: number;
  fibre_g: number;
  sugar_g: number;
  nutrition_score: number;
};

export type DailyTotals = {
  calories: number;
  protein_g: number;
  carbs_g: number; // good+bad нийлбэрээр харуулна
  fat_g: number;
  fibre_g: number;
  sugar_g: number;
  water_l: number;
  steps: number;
  sleep_h: number;
};

export type DailyLog = {
  date: string; // yyyy-mm-dd
  totals: DailyTotals;
  meals: Array<MealBreakdown & { id: string; createdAt: string }>;
};
