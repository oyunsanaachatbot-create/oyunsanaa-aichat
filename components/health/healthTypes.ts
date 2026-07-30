// components/health/healthTypes.ts
export type HealthProfilePayload = {
  startDate?: string; // yyyy-mm-dd
  gender?: "male" | "female" | "";
  age?: number | null;
  heightCm?: number | null;
  weightKg?: number | null;
  waistCircumferenceCm?: number | null;

  // lifestyle
  careLevel?: "high" | "medium" | "low" | "onlyWhenSick" | "";
  dietType?: "meat" | "veggie" | "vegan" | "other" | "mixed" | "unknown" | "";
  mealsPerDay?: "1" | "2" | "3" | "4+" | "";

  exerciseFreq?:
    | "none"
    | "rare"
    | "monthly"
    | "weekly1"
    | "weekly2_3"
    | "daily";
  walkingLevel?: "none" | "low" | "medium" | "high" | "";

  alcoholFreq?: "none" | "rare" | "monthly" | "weekly1" | "weekly2_3" | "daily";
  smokingLevel?:
    | "none"
    | "sometimes"
    | "1_5"
    | "6_10"
    | "11_20"
    | "20plus"
    | "";

  meTime?: "0" | "0_1" | "1_2" | "2_3" | "";
  sleepHours?: "4less" | "4_6" | "6_8" | "8_10" | "10plus" | "";
  sleepTime?: "before22" | "22_23" | "23_24" | "24_1" | "after1" | "";

  // Full raw answers from QuestionnaireForm, kept so the form can be
  // re-opened for editing without losing previously entered values.
  legacy?: Record<string, unknown>;
};

export type HealthTargets = {
  bmi: number | null;
  bmiText: string;
  idealWeightKg: number | null;

  targetCalories: number | null;
  targetProteinG: number | null;
  targetCarbsG: number | null;
  targetFatG: number | null;

  // Macro breakdown (derived from targetCarbsG / targetCalories)
  targetGoodCarbsG: number | null;
  targetBadCarbsG: number | null;
  targetFiberG: number | null;
  targetSugarG: number | null;
  targetNutritionScore: number;

  targetWaterL: number | null;
  targetSteps: number;

  summary: string;
};

export type HealthProfileRow = {
  payload: HealthProfilePayload | null;

  // persisted targets in health_profiles table
  target_calories: number | null;
  target_protein_g: number | null;
  target_carbs_g: number | null;
  target_fat_g: number | null;
  target_water_l: number | null;
  target_steps: number | null;
};

export type DrinkLog = {
  water: number;
  coffee: number;
  tea: number;
  milk: number;
  other: number;
};

export type DailyItems = {
  waterLiters?: number | null;
  drinks?: DrinkLog | null;
  meals?: MealItem[] | null;
  steps?: number | null;
  sleepHours?: number | null;
  restMinutes?: number | null;
  movementLevel?: "good" | "medium" | "low" | null;
  mood?: number | null;

  // Хөдөлгөөнөөр шатаасан калори, муу зуршлын түвшин (0-100)
  burnedKcal?: number | null;
  badHabitsScore?: number | null;
};

export type MealItem = {
  id?: string;
  title: string;
  calories?: number | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;

  // Optional detailed macro breakdown (manual entry or AI photo analysis)
  goodCarbsG?: number | null;
  badCarbsG?: number | null;
  fiberG?: number | null;
  sugarG?: number | null;
  nutritionScore?: number | null;
};

export type DailyLogRow = {
  date: string; // yyyy-mm-dd
  items: DailyItems | null;
  totals: any | null;
};
