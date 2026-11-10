import { z } from "zod";

export const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return (
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  });

const nonnegative = z.number().finite().nonnegative();
const optionalMetric = nonnegative.nullish();
const optionalText = z.string().nullish();

export const financeTransactionsSchema = z.object({
  rows: z
    .array(
      z.object({
        type: z.enum(["income", "expense", "debt", "saving"]),
        amount: z.number().finite().positive(),
        category: z.enum([
          "food",
          "transport",
          "clothes",
          "home",
          "fun",
          "health",
          "other",
          "income",
          "debt_borrow",
          "debt_repay",
          "saving_add",
          "saving_withdraw",
        ]),
        date: calendarDateSchema,
        source: z.enum(["text", "voice", "image", "receipt"]).default("text"),
        sub_category: optionalText,
        note: optionalText,
        raw_text: optionalText,
        store: optionalText,
        item: optionalText,
      })
    )
    .min(1),
});

const dailyMetrics = {
  waterLiters: optionalMetric,
  steps: nonnegative.int().nullish(),
  sleepHours: nonnegative.max(24).nullish(),
  mood: nonnegative.max(10).nullish(),
};

export const healthDailySchema = z.object({
  day: calendarDateSchema,
  ...dailyMetrics,
  items: z
    .object({
      ...dailyMetrics,
      restMinutes: nonnegative.max(1440).nullish(),
      movementLevel: z.enum(["good", "medium", "low"]).nullish(),
      burnedKcal: optionalMetric,
      badHabitsScore: nonnegative.max(100).nullish(),
      drinks: z
        .object({
          water: nonnegative,
          coffee: nonnegative,
          tea: nonnegative,
          milk: nonnegative,
          other: nonnegative,
        })
        .nullish(),
      meals: z
        .array(
          z.object({
            id: z.string().optional(),
            title: z.string(),
            calories: optionalMetric,
            proteinG: optionalMetric,
            carbsG: optionalMetric,
            fatG: optionalMetric,
            goodCarbsG: optionalMetric,
            badCarbsG: optionalMetric,
            fiberG: optionalMetric,
            sugarG: optionalMetric,
            nutritionScore: nonnegative.max(100).nullish(),
          })
        )
        .nullish(),
    })
    .nullish(),
  totals: z.record(optionalMetric).nullish(),
});

export const goalLogSchema = z.object({
  goal_id: z.string().uuid(),
  date: calendarDateSchema.optional(),
  minutes: nonnegative.int().max(1440).default(0),
});
