export type Sex = "male" | "female";

export type HealthProgramInput = {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  mealsPerDay: number;
  exercisePerWeek: number; // derived from select value
  walkLevel: "none" | "low" | "medium" | "high";
  sleepHours: number; // actual hours (parsed from range string)
  waterLiters: number;
  habits: string[];
  startDate: string; // yyyy-mm-dd
};

export type HealthProgramTargets = {
  bmi: number;
  normalMin: number;
  normalMax: number;
  excessKg: number; // positive = overweight, negative = underweight
  daysToGoal: number;
  dailyCalories: number;
  proteinPercent: number;
  fatPercent: number;
  carbPercent: number;
  targetWaterL: number;
  targetSteps: number;
  sleepRecommended: number;
};

export type HealthProgramData = {
  input: HealthProgramInput;
  targets: HealthProgramTargets;
};

const STORAGE_KEY = "oyunsanaa_health_program";
const DAILY_PREFIX = "oyunsanaa_health_day_";

export function computeHealthTargets(
  input: HealthProgramInput
): HealthProgramTargets {
  const hM = input.heightCm / 100;
  const bmi = Math.round((input.weightKg / (hM * hM)) * 10) / 10;
  const normalMin = Math.round(18.5 * hM * hM * 10) / 10;
  const normalMax = Math.round(24.9 * hM * hM * 10) / 10;

  let excessKg = 0;
  if (input.weightKg > normalMax) {
    excessKg = Math.round((input.weightKg - normalMax) * 10) / 10;
  } else if (input.weightKg < normalMin) {
    excessKg = Math.round((input.weightKg - normalMin) * 10) / 10;
  }

  const daysToGoal = Math.max(30, Math.round(Math.abs(excessKg) * 4.6));

  const base =
    input.sex === "female"
      ? 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age - 161
      : 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age + 5;

  let actFactor = 1.2;
  if (input.exercisePerWeek >= 5) { actFactor = 1.55; }
  else if (input.exercisePerWeek >= 3) { actFactor = 1.4; }
  else if (input.exercisePerWeek >= 1) { actFactor = 1.3; }

  const dailyCalories = Math.round(base * actFactor * 0.85);
  const targetWaterL =
    Math.round(Math.max(1.5, Math.min(3.5, input.weightKg * 0.03)) * 10) / 10;

  const stepsByWalk: Record<string, number> = {
    none: 5000,
    low: 6000,
    medium: 8000,
    high: 10000,
  };

  return {
    bmi,
    normalMin,
    normalMax,
    excessKg,
    daysToGoal,
    dailyCalories,
    proteinPercent: 25,
    fatPercent: 25,
    carbPercent: 50,
    targetWaterL,
    targetSteps: stepsByWalk[input.walkLevel] ?? 7000,
    sleepRecommended: 7.5,
  };
}

export function saveHealthProgram(data: HealthProgramData): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

export function loadHealthProgram(): HealthProgramData | null {
  if (typeof window === "undefined") { return null; }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HealthProgramData) : null;
  } catch {
    return null;
  }
}

export type DailyMeal = { id: string; name: string; calories: number };
export type DailyLog = {
  date: string;
  meals: DailyMeal[];
  waterL: number;
  sleepH: number;
  restMin: number;
  steps: number;
};

export function emptyLog(date: string): DailyLog {
  return { date, meals: [], waterL: 0, sleepH: 0, restMin: 0, steps: 0 };
}

export function saveDailyLog(log: DailyLog): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(DAILY_PREFIX + log.date, JSON.stringify(log));
  }
}

export function loadDailyLog(date: string): DailyLog {
  if (typeof window === "undefined") { return emptyLog(date); }
  try {
    const raw = localStorage.getItem(DAILY_PREFIX + date);
    return raw ? (JSON.parse(raw) as DailyLog) : emptyLog(date);
  } catch {
    return emptyLog(date);
  }
}
