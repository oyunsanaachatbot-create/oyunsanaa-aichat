import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { getSql } from "@/lib/db/pgClient";

export const runtime = "nodejs";

const analyzedMealSchema = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealId: z.string().min(1).max(200),
  title: z.string().trim().min(1).max(200),
  calories: z.number().finite().min(0).max(100_000),
  proteinG: z.number().finite().min(0).max(10_000),
  carbsG: z.number().finite().min(0).max(10_000),
  fatG: z.number().finite().min(0).max(10_000),
  goodCarbsG: z.number().finite().min(0).max(10_000),
  badCarbsG: z.number().finite().min(0).max(10_000),
  fiberG: z.number().finite().min(0).max(10_000),
  sugarG: z.number().finite().min(0).max(10_000),
  nutritionScore: z.number().finite().min(0).max(100),
});

type DailyItems = {
  meals?: unknown;
  [key: string]: unknown;
};

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = analyzedMealSchema.safeParse(
    await req.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Хоолны мэдээлэл буруу байна" },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const sql = getSql();
  if (!sql) {
    return NextResponse.json(
      { error: "Өгөгдлийн сан холбогдоогүй байна" },
      { status: 503 }
    );
  }

  try {
    const result = await sql.begin(async (transaction) => {
      // Lock the user/day key even when a daily row does not exist yet. This
      // keeps two quick clicks or retries from creating duplicate meals.
      await transaction`SELECT pg_advisory_xact_lock(hashtext(${`${userId}:${input.day}`}))`;

      const rows = await transaction<{ items: DailyItems | null }[]>`
        SELECT "items"
        FROM "health_daily_logs"
        WHERE "user_id" = ${userId} AND "date" = ${input.day}
        FOR UPDATE
      `;

      const existingItems = rows[0]?.items ?? {};
      const meals = Array.isArray(existingItems.meals)
        ? existingItems.meals
        : [];
      const duplicate = meals.find(
        (existingMeal) =>
          typeof existingMeal === "object" &&
          existingMeal !== null &&
          "id" in existingMeal &&
          (existingMeal as { id?: unknown }).id === input.mealId
      );

      if (duplicate) {
        return { added: false, meal: duplicate };
      }

      const meal = {
        id: input.mealId,
        title: input.title,
        calories: input.calories,
        proteinG: input.proteinG,
        carbsG: input.carbsG,
        fatG: input.fatG,
        goodCarbsG: input.goodCarbsG,
        badCarbsG: input.badCarbsG,
        fiberG: input.fiberG,
        sugarG: input.sugarG,
        nutritionScore: input.nutritionScore,
      };
      const nextItems = { ...existingItems, meals: [...meals, meal] };
      const itemsJson = JSON.stringify(nextItems);

      if (rows.length > 0) {
        await transaction`
          UPDATE "health_daily_logs"
          SET "items" = ${itemsJson}::jsonb, "updated_at" = NOW()
          WHERE "user_id" = ${userId} AND "date" = ${input.day}
        `;
      } else {
        await transaction`
          INSERT INTO "health_daily_logs" ("user_id", "date", "items", "updated_at")
          VALUES (${userId}, ${input.day}, ${itemsJson}::jsonb, NOW())
        `;
      }

      return { added: true, meal };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Add analyzed meal error:", error);
    return NextResponse.json(
      { error: "Хоолыг өнөөдрийн бүртгэлд нэмэхэд алдаа гарлаа" },
      { status: 500 }
    );
  }
}
