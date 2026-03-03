// components/health/healthTypes.ts
export type HealthProfilePayload = {
  startDate?: string; // yyyy-mm-dd
  gender?: "male" | "female" | "";
  age?: number | null;
  heightCm?: number | null;
  weightKg?: number | null;

  // lifestyle
  careLevel?: "high" | "medium" | "low" | "onlyWhenSick" | "";
  dietType?: "mixed" | "meat" | "veggie" | "vegan" | "unknown" | "";
  mealsPerDay?: "1" | "2" | "3" | "4+" | "";

  exerciseFreq?: "none" | "rare" | "monthly" | "weekly1" | "weekly2_3" | "daily";
  walkingLevel?: "none" | "low" | "medium" | "high" | "";

  alcoholFreq?: "none" | "rare" | "monthly" | "weekly1" | "weekly2_3" | "daily";
  smokingLevel?: "none" | "sometimes" | "1_5" | "6_10" | "11_20" | "20plus" | "";

  meTime?: "0" | "0_1" | "1_2" | "2_3" | "";
  sleepHours?: "4less" | "4_6" | "6_8" | "8_10" | "10plus" | "";
  sleepTime?: "before22" | "22_23" | "23_24" | "24_1" | "after1" | "";
};

export type HealthTargets = {
  bmi: number | null;
  bmiText: string;
  idealWeightKg: number | null;

  targetCalories: number | null;
  targetProteinG: number | null;
  targetCarbsG: number | null;
  targetFatG: number | null;

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

export type DailyItems = {
  waterLiters?: number | null;
  steps?: number | null;
  sleepHours?: number | null;
  mood?: number | null; // 1-10
};

export type DailyLogRow = {
  date: string; // yyyy-mm-dd
  items: DailyItems | null;
  totals: any | null;
};
