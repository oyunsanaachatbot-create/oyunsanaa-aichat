// components/health/healthTypes.ts
export type Sex = "male" | "female" | "";
export type Frequency = "none" | "rare" | "monthly" | "weekly1" | "weekly2_3" | "daily";
export type SleepTime = "before22" | "22_23" | "23_24" | "24_1" | "after1" | "";

export type HealthProfile = {
  startDate: string; // yyyy-mm-dd
  sex: Sex;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;

  careLevel: "high" | "medium" | "low" | "onlyWhenSick" | "";
  dietType: "mixed" | "meat" | "veggie" | "vegan" | "unknown" | "";
  mealsPerDay: "1" | "2" | "3" | "4+" | "";

  exerciseFreq: Frequency;
  walkingLevel: "none" | "low" | "medium" | "high" | "";

  alcoholFreq: Frequency;
  smokingLevel: "none" | "sometimes" | "1_5" | "6_10" | "11_20" | "20plus" | "";

  meTime: "0" | "0_1" | "1_2" | "2_3" | "";
  sleepHours: "4less" | "4_6" | "6_8" | "8_10" | "10plus" | "";
  sleepTime: SleepTime;
};

export type HealthTargets = {
  bmi: number | null;
  bmiLabel: string;
  idealWeightKg: number | null;
  waterLitersPerDay: number | null;
  summary: string;
};

export type DailyLog = {
  day: string; // yyyy-mm-dd
  waterLiters: number | null;
  steps: number | null;
  sleepHours: number | null;
  mood: number | null; // 1-10
};

export type Meal = {
  id?: string;
  day: string; // yyyy-mm-dd
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  title: string;
  calories?: number | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
};
