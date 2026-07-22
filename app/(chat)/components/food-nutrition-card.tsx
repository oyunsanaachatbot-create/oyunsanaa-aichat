"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/provider";
import { Response } from "@/components/elements/response";
import { sanitizeText } from "@/lib/utils";

export type FoodNutritionData = {
  name: string;
  portion?: string;
  calories: number;
  protein_g: number;
  good_carbs_g: number;
  bad_carbs_g: number;
  fat_g: number;
  fibre_g: number;
  sugar_g: number;
  nutrition_score: number;
};

function todayYmd() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function cleanHumanText(text: string) {
  return text
    .replace(/<FOOD_JSON>[\s\S]*?<\/FOOD_JSON>/gi, "")
    .replace(/<\/?FOOD_HUMAN>/gi, "")
    .trim();
}

export default function FoodNutritionCard({
  data,
  messageId,
  originalText,
  isReadonly,
}: {
  data: FoodNutritionData;
  messageId: string;
  originalText: string;
  isReadonly: boolean;
}) {
  const foodText = useT().apps.healthDashboard.food;
  const [status, setStatus] = useState<"idle" | "adding" | "added" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  const addMeal = async () => {
    if (status === "adding" || status === "added") return;

    setStatus("adding");
    setError(null);

    try {
      const response = await fetch("/api/health/daily/add-analyzed-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          day: todayYmd(),
          mealId: `chat:${messageId}`,
          title: data.name,
          calories: data.calories,
          proteinG: data.protein_g,
          carbsG: data.good_carbs_g + data.bad_carbs_g,
          fatG: data.fat_g,
          goodCarbsG: data.good_carbs_g,
          badCarbsG: data.bad_carbs_g,
          fiberG: data.fibre_g,
          sugarG: data.sugar_g,
          nutritionScore: data.nutrition_score,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || foodText.aiError);
      }

      setStatus("added");
    } catch (cause) {
      setStatus("error");
      setError(cause instanceof Error ? cause.message : foodText.aiError);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Response>{sanitizeText(cleanHumanText(originalText))}</Response>

      {!isReadonly && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={status === "adding" || status === "added"}
            onClick={addMeal}
            type="button"
          >
            {status === "adding"
              ? foodText.analyzing
              : status === "added"
                ? `✓ ${foodText.addMeal}`
                : foodText.addMeal}
          </button>

          {data.portion && (
            <span className="text-muted-foreground text-xs">
              {data.portion} · {formatNumber(data.calories)} ккал
            </span>
          )}

          {error && <span className="text-destructive text-xs">{error}</span>}
        </div>
      )}
    </div>
  );
}
