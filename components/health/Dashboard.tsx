// components/health/Dashboard.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type {
  DailyItems,
  HealthProfilePayload,
  HealthTargets,
  MealItem,
} from "./healthTypes";
import { computeTargets, programDays } from "./calc";
import HealthSummary from "./HealthSummary";
import QuestionnaireForm from "./QuestionnaireForm";
import { useLocale, useT } from "@/lib/i18n/provider";

const todayYmd = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
type Tab = "food" | "water" | "sleep" | "move" | "summary";

export default function Dashboard() {
  useT();
  const locale = useLocale();
  const [payload, setPayload] = useState<HealthProfilePayload | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const day = todayYmd();
  const [tab, setTab] = useState<Tab>("food");

  const [meals, setMeals] = useState<MealItem[]>([]);
  const [waterL, setWaterL] = useState(0);
  const [sleepH, setSleepH] = useState<number | null>(null);
  const [restMin, setRestMin] = useState<number | null>(null);
  const [moveLevel, setMoveLevel] = useState<"good" | "medium" | "low" | null>(
    null
  );
  const [steps, setSteps] = useState<number | null>(null);
  const [burnedKcal, setBurnedKcal] = useState<number | null>(null);
  const [badHabitsScore, setBadHabitsScore] = useState<number | null>(null);

  const targets = useMemo(
    () => (payload ? computeTargets(payload, locale) : null),
    [payload, locale]
  );
  const totalDays = useMemo(
    () => (payload ? programDays(payload) : 90),
    [payload]
  );

  const programDay = useMemo(() => {
    if (!payload?.startDate) return 1;
    const diff = Math.floor(
      (new Date(day).getTime() - new Date(payload.startDate).getTime()) /
        86_400_000
    );
    return Math.max(1, Math.min(diff + 1, totalDays));
  }, [payload, day, totalDays]);

  function applyLog(items: DailyItems | null) {
    if (!items) {
      setMeals([]);
      setWaterL(0);
      setSleepH(null);
      setRestMin(null);
      setMoveLevel(null);
      setSteps(null);
      setBurnedKcal(null);
      setBadHabitsScore(null);
      return;
    }
    setMeals(items.meals ?? []);
    setWaterL(items.waterLiters ?? 0);
    setSleepH(items.sleepHours ?? null);
    setRestMin(items.restMinutes ?? null);
    setMoveLevel(items.movementLevel ?? null);
    setSteps(items.steps ?? null);
    setBurnedKcal(items.burnedKcal ?? null);
    setBadHabitsScore(items.badHabitsScore ?? null);
  }

  async function loadAll() {
    setLoading(true);
    setErr(null);
    try {
      const [pr, dr] = await Promise.all([
        fetch("/api/health/profile").then((r) => r.json()),
        fetch(`/api/health/daily?day=${day}`).then((r) => r.json()),
      ]);
      setPayload(pr.profile?.payload ?? null);
      applyLog(dr.log?.items ?? null);
    } catch (e: any) {
      setErr(e?.message ?? "Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadAll is stable on mount
  useEffect(() => {
    loadAll().catch(console.error);
  }, []);

  async function save() {
    setSaved(false);
    const items: DailyItems = {
      meals,
      waterLiters: waterL,
      sleepHours: sleepH,
      restMinutes: restMin,
      movementLevel: moveLevel,
      steps,
      burnedKcal,
      badHabitsScore,
    };
    const res = await fetch("/api/health/daily", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, items }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setErr("Хадгалах алдаа");
    }
  }

  if (loading)
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        Уншиж байна...
      </div>
    );
  if (err) return <div className="py-4 text-destructive text-sm">{err}</div>;

  if (!payload || showForm)
    return (
      <QuestionnaireForm
        initial={(payload as any)?.legacy}
        onSaved={() => {
          setShowForm(false);
          loadAll().catch(console.error);
        }}
      />
    );

  const progress = Math.round((programDay / totalDays) * 100);

  const TABS: { id: Tab; label: string }[] = [
    { id: "food", label: "🍽 Хоол" },
    { id: "water", label: "💧 Ус" },
    { id: "sleep", label: "😴 Нойр" },
    { id: "move", label: "🏃 Хөдөлгөөн" },
    { id: "summary", label: "📊 Дүгнэлт" },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Program header */}
      <div className="space-y-3 rounded-2xl border bg-card p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-muted-foreground text-xs">
              Эрүүл мэндийн хөтөлбөр
            </div>
            <div className="font-semibold text-base">
              {programDay}-р өдөр / {totalDays} өдөр
            </div>
          </div>
          {targets?.bmiText && (
            <div className="text-right text-muted-foreground text-xs">
              {targets.bmiText}
            </div>
          )}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        {targets && (
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-muted/50 py-1.5">
              <div className="font-semibold">
                {targets.targetCalories ?? "-"}
              </div>
              <div className="text-muted-foreground">kcal</div>
            </div>
            <div className="rounded-lg bg-muted/50 py-1.5">
              <div className="font-semibold">
                {targets.targetWaterL ?? "-"} л
              </div>
              <div className="text-muted-foreground">ус</div>
            </div>
            <div className="rounded-lg bg-muted/50 py-1.5">
              <div className="font-semibold">{targets.targetSteps ?? "-"}</div>
              <div className="text-muted-foreground">алхам</div>
            </div>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex overflow-hidden rounded-xl border bg-muted/30 text-xs">
        {TABS.map(({ id, label }) => (
          <button
            className={`flex-1 py-2.5 text-center transition-colors ${
              tab === id
                ? "bg-background font-semibold shadow-sm"
                : "text-muted-foreground"
            }`}
            key={id}
            onClick={() => setTab(id)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-2xl border bg-card p-4">
        {tab === "food" && (
          <FoodTab meals={meals} setMeals={setMeals} targets={targets} />
        )}
        {tab === "water" && (
          <WaterTab
            setWaterL={setWaterL}
            targetL={targets?.targetWaterL ?? null}
            waterL={waterL}
          />
        )}
        {tab === "sleep" && (
          <SleepTab
            restMin={restMin}
            setRestMin={setRestMin}
            setSleepH={setSleepH}
            sleepH={sleepH}
          />
        )}
        {tab === "move" && (
          <MoveTab
            badHabitsScore={badHabitsScore}
            burnedKcal={burnedKcal}
            level={moveLevel}
            setBadHabitsScore={setBadHabitsScore}
            setBurnedKcal={setBurnedKcal}
            setLevel={setMoveLevel}
            setSteps={setSteps}
            steps={steps}
            targetSteps={targets?.targetSteps ?? null}
          />
        )}
        {tab === "summary" && <HealthSummary targets={targets} />}
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          className="flex-1 rounded-xl bg-primary py-2.5 font-medium text-primary-foreground text-sm transition-opacity active:opacity-80"
          onClick={save}
          type="button"
        >
          Хадгалах
        </button>
        {saved && (
          <span className="text-green-600 text-sm dark:text-green-400">
            ✓ Хадгаллаа
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-2 text-sm">
        <Link
          className="flex-1 rounded-xl border py-2.5 text-center text-muted-foreground transition-colors hover:bg-muted/50"
          href="/mind/therapy"
        >
          💬 Сэтгэл зүйчтэй чатлах
        </Link>
        <button
          className="rounded-xl border px-4 py-2.5 text-muted-foreground transition-colors hover:bg-muted/50"
          onClick={() => setShowForm(true)}
          title="Мэдээлэл засах"
          type="button"
        >
          ✏️
        </button>
      </div>
    </div>
  );
}

// ── Food tab ──────────────────────────────────────────────────────────────────

type MealDraft = {
  calories: string;
  proteinG: string;
  goodCarbsG: string;
  badCarbsG: string;
  fatG: string;
  fiberG: string;
  sugarG: string;
  nutritionScore: string;
};

const EMPTY_DRAFT: MealDraft = {
  calories: "",
  proteinG: "",
  goodCarbsG: "",
  badCarbsG: "",
  fatG: "",
  fiberG: "",
  sugarG: "",
  nutritionScore: "",
};

function sumMeals(meals: MealItem[]) {
  return meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories ?? 0),
      proteinG: acc.proteinG + (m.proteinG ?? 0),
      goodCarbsG: acc.goodCarbsG + (m.goodCarbsG ?? 0),
      badCarbsG: acc.badCarbsG + (m.badCarbsG ?? 0),
      fatG: acc.fatG + (m.fatG ?? 0),
      fiberG: acc.fiberG + (m.fiberG ?? 0),
      sugarG: acc.sugarG + (m.sugarG ?? 0),
    }),
    {
      calories: 0,
      proteinG: 0,
      goodCarbsG: 0,
      badCarbsG: 0,
      fatG: 0,
      fiberG: 0,
      sugarG: 0,
    }
  );
}

function avgNutritionScore(meals: MealItem[]) {
  const withScore = meals.filter((m) => m.nutritionScore != null);
  if (withScore.length === 0) return null;
  const total = withScore.reduce((s, m) => s + (m.nutritionScore ?? 0), 0);
  return Math.round(total / withScore.length);
}

function NutrientBar({
  label,
  value,
  target,
  unit,
}: {
  label: string;
  value: number;
  target: number | null;
  unit: string;
}) {
  if (target == null) return null;
  const pct = Math.min(100, Math.round((value / target) * 100));
  const over = value > target;
  return (
    <div>
      <div className="mb-1 flex justify-between text-muted-foreground text-xs">
        <span>{label}</span>
        <span className={over ? "text-destructive" : undefined}>
          {value} / {target} {unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${over ? "bg-destructive" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function FoodTab({
  meals,
  setMeals,
  targets,
}: {
  meals: MealItem[];
  setMeals: (m: MealItem[]) => void;
  targets: HealthTargets | null;
}) {
  const [title, setTitle] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [draft, setDraft] = useState<MealDraft>(EMPTY_DRAFT);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [filledByAI, setFilledByAI] = useState(false);

  function pickImage(file: File | null) {
    setImageFile(file);
    setFilledByAI(false);
    setImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  const totals = sumMeals(meals);
  const score = avgNutritionScore(meals);

  function updateDraft<K extends keyof MealDraft>(key: K, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setFilledByAI(false);
  }

  async function analyzeWithAI() {
    if (!imageFile && !title.trim()) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const formData = new FormData();
      if (imageFile) formData.append("image", imageFile);
      formData.append("name", title);

      const res = await fetch("/api/health/meal-analyze", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || data?.error || "Алдаа гарлаа");
      }
      setDraft({
        calories: String(data.calories ?? ""),
        proteinG: String(data.proteinG ?? ""),
        goodCarbsG: String(data.goodCarbsG ?? ""),
        badCarbsG: String(data.badCarbsG ?? ""),
        fatG: String(data.fatG ?? ""),
        fiberG: String(data.fiberG ?? ""),
        sugarG: String(data.sugarG ?? ""),
        nutritionScore: String(data.nutritionScore ?? ""),
      });
      setFilledByAI(true);
    } catch (e: any) {
      setAnalyzeError(e?.message ?? "AI-аас хариу авахад алдаа гарлаа.");
    } finally {
      setAnalyzing(false);
    }
  }

  function addMeal() {
    if (!title.trim()) return;
    const n = (v: string) => (v.trim() === "" ? null : Number(v));
    setMeals([
      ...meals,
      {
        id: `m-${Date.now()}`,
        title: title.trim(),
        calories: n(draft.calories),
        proteinG: n(draft.proteinG),
        goodCarbsG: n(draft.goodCarbsG),
        badCarbsG: n(draft.badCarbsG),
        carbsG:
          n(draft.goodCarbsG) != null || n(draft.badCarbsG) != null
            ? (n(draft.goodCarbsG) ?? 0) + (n(draft.badCarbsG) ?? 0)
            : null,
        fatG: n(draft.fatG),
        fiberG: n(draft.fiberG),
        sugarG: n(draft.sugarG),
        nutritionScore: n(draft.nutritionScore),
      },
    ]);
    setTitle("");
    pickImage(null);
    setDraft(EMPTY_DRAFT);
    setFilledByAI(false);
  }

  return (
    <div className="space-y-5">
      {/* Entry form */}
      <div className="space-y-3 rounded-xl border p-3">
        <div>
          <label
            className="mb-1 block text-muted-foreground text-xs"
            htmlFor="meal-title"
          >
            Хоол / ундааны нэр
          </label>
          <input
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            id="meal-title"
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Жишээ нь: Хуушуур 5 ш, 1 аяга кола..."
            value={title}
          />
        </div>

        <div>
          <label
            className="mb-1 block text-muted-foreground text-xs"
            htmlFor="meal-image"
          >
            Хоолны зураг (сонголтоор) — оруулбал AI зурган дээрх хоолыг танин,
            калори/шим тэжээлийг доор автоматаар бөглөнө
          </label>

          {imagePreviewUrl ? (
            <div className="flex items-center gap-3">
              {/* biome-ignore lint/performance/noImgElement: local object URL preview, not a remote image */}
              <img
                alt="Сонгосон хоолны зураг"
                className="h-16 w-16 rounded-lg border object-cover"
                src={imagePreviewUrl}
              />
              <div className="flex flex-col gap-1 text-xs">
                <span className="max-w-[160px] truncate text-muted-foreground">
                  {imageFile?.name}
                </span>
                <button
                  className="w-fit text-muted-foreground hover:text-destructive"
                  onClick={() => pickImage(null)}
                  type="button"
                >
                  Зураг хасах ✕
                </button>
              </div>
            </div>
          ) : (
            <input
              accept="image/*"
              id="meal-image"
              onChange={(e) => pickImage(e.target.files?.[0] ?? null)}
              type="file"
            />
          )}
        </div>

        {analyzeError && (
          <div className="text-destructive text-xs">{analyzeError}</div>
        )}

        <button
          className="w-full rounded-lg bg-primary py-2 font-medium text-primary-foreground text-sm disabled:opacity-60"
          disabled={analyzing || (!imageFile && !title.trim())}
          onClick={analyzeWithAI}
          type="button"
        >
          {analyzing ? "Задалж байна…" : "AI-аар задлуулах"}
        </button>
        {!imageFile && !title.trim() && (
          <div className="text-muted-foreground text-xs">
            AI-аар задлуулахын тулд дээр зураг сонгох эсвэл хоолны нэрийг бичнэ
            үү.
          </div>
        )}
        {filledByAI && (
          <div className="text-emerald-600 text-xs dark:text-emerald-400">
            ✨ Доорх утгуудыг AI тооцоолсон — шаардлагатай бол гараар засаж
            болно.
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <LabeledInput
            label="Калори (ккал)"
            onChange={(v) => updateDraft("calories", v)}
            value={draft.calories}
          />
          <LabeledInput
            label="Уураг (гр)"
            onChange={(v) => updateDraft("proteinG", v)}
            value={draft.proteinG}
          />
          <LabeledInput
            label="Сайн нүүрс ус (гр)"
            onChange={(v) => updateDraft("goodCarbsG", v)}
            value={draft.goodCarbsG}
          />
          <LabeledInput
            label="Муу нүүрс ус (гр)"
            onChange={(v) => updateDraft("badCarbsG", v)}
            value={draft.badCarbsG}
          />
          <LabeledInput
            label="Өөх тос (гр)"
            onChange={(v) => updateDraft("fatG", v)}
            value={draft.fatG}
          />
          <LabeledInput
            label="Эслэг (гр)"
            onChange={(v) => updateDraft("fiberG", v)}
            value={draft.fiberG}
          />
          <LabeledInput
            label="Сахар (гр)"
            onChange={(v) => updateDraft("sugarG", v)}
            value={draft.sugarG}
          />
          <LabeledInput
            label="Шим тэжээлийн индекс (0-100)"
            onChange={(v) => updateDraft("nutritionScore", v)}
            value={draft.nutritionScore}
          />
        </div>

        <button
          className="w-full rounded-lg bg-primary py-2 font-medium text-primary-foreground text-sm disabled:opacity-60"
          disabled={!title.trim()}
          onClick={addMeal}
          type="button"
        >
          Хоол нэмэх
        </button>
      </div>

      {/* Today's meals */}
      <div className="space-y-1">
        {meals.length === 0 && (
          <div className="py-4 text-center text-muted-foreground text-sm">
            Хоол нэмэгдээгүй байна
          </div>
        )}
        {meals.map((m) => (
          <div
            className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"
            key={m.id ?? m.title}
          >
            <span className="truncate">{m.title}</span>
            <div className="flex items-center gap-3">
              {m.calories != null && (
                <span className="text-muted-foreground text-xs">
                  {m.calories} kcal
                </span>
              )}
              {m.nutritionScore != null && (
                <span className="text-muted-foreground text-xs">
                  {m.nutritionScore}/100
                </span>
              )}
              <button
                className="text-muted-foreground text-xs hover:text-destructive"
                onClick={() => setMeals(meals.filter((x) => x !== m))}
                type="button"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Nutrient progress vs targets */}
      {targets && (
        <div className="space-y-3 rounded-xl border p-3">
          <NutrientBar
            label="Калори"
            target={targets.targetCalories}
            unit="ккал"
            value={totals.calories}
          />
          <NutrientBar
            label="Уураг"
            target={targets.targetProteinG}
            unit="гр"
            value={totals.proteinG}
          />
          <NutrientBar
            label="Сайн нүүрс ус"
            target={targets.targetGoodCarbsG}
            unit="гр"
            value={totals.goodCarbsG}
          />
          <NutrientBar
            label="Муу нүүрс ус"
            target={targets.targetBadCarbsG}
            unit="гр"
            value={totals.badCarbsG}
          />
          <NutrientBar
            label="Өөх тос"
            target={targets.targetFatG}
            unit="гр"
            value={totals.fatG}
          />
          <NutrientBar
            label="Эслэг"
            target={targets.targetFiberG}
            unit="гр"
            value={totals.fiberG}
          />
          <NutrientBar
            label="Сахар"
            target={targets.targetSugarG}
            unit="гр"
            value={totals.sugarG}
          />
          {score != null && (
            <NutrientBar
              label="Шим тэжээл"
              target={targets.targetNutritionScore}
              unit="оноо"
              value={score}
            />
          )}
        </div>
      )}
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = `meal-field-${label.replace(/[^a-zA-Zа-яА-ЯёЁ0-9]+/g, "-")}`;
  return (
    <div>
      <label className="mb-1 block text-muted-foreground text-xs" htmlFor={id}>
        {label}
      </label>
      <input
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
        id={id}
        onChange={(e) => onChange(e.target.value)}
        type="number"
        value={value}
      />
    </div>
  );
}

// ── Water tab ─────────────────────────────────────────────────────────────────

function WaterTab({
  waterL,
  setWaterL,
  targetL,
}: {
  waterL: number;
  setWaterL: (v: number) => void;
  targetL: number | null;
}) {
  const pct = targetL ? Math.min(100, Math.round((waterL / targetL) * 100)) : 0;
  const add = (ml: number) => setWaterL(Math.round(waterL * 1000 + ml) / 1000);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="font-bold text-4xl">{waterL.toFixed(1)}</div>
        <div className="text-muted-foreground text-sm">
          литр{targetL ? ` / ${targetL} л зорилт` : ""}
        </div>
      </div>

      {targetL != null && (
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-sky-400 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        {[200, 300, 500, 1000].map((ml) => (
          <button
            className="rounded-xl border py-2.5 font-medium text-sm transition-colors hover:bg-muted/50"
            key={ml}
            onClick={() => add(ml)}
            type="button"
          >
            +{ml}мл
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
          min={0}
          onChange={(e) => setWaterL(Math.max(0, Number(e.target.value) || 0))}
          placeholder="Нийт литр"
          step={0.1}
          type="number"
          value={waterL || ""}
        />
        <button
          className="px-3 py-2 text-muted-foreground text-xs hover:text-destructive"
          onClick={() => setWaterL(0)}
          type="button"
        >
          Цэвэрлэх
        </button>
      </div>
    </div>
  );
}

// ── Sleep tab ─────────────────────────────────────────────────────────────────

function SleepTab({
  sleepH,
  setSleepH,
  restMin,
  setRestMin,
}: {
  sleepH: number | null;
  setSleepH: (v: number | null) => void;
  restMin: number | null;
  setRestMin: (v: number | null) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="font-medium text-sm" htmlFor="sleep-range">
          Нойр (цаг)
        </label>
        <div className="flex items-center gap-3">
          <input
            className="flex-1"
            id="sleep-range"
            max={12}
            min={0}
            onChange={(e) => setSleepH(Number(e.target.value))}
            step={0.5}
            type="range"
            value={sleepH ?? 0}
          />
          <span className="w-10 text-right font-medium text-sm">
            {sleepH ?? 0}ц
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[5, 6, 7, 7.5, 8, 9].map((h) => (
            <button
              className={`rounded-lg border px-3 py-1 text-sm transition-colors ${
                sleepH === h
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "hover:bg-muted/50"
              }`}
              key={h}
              onClick={() => setSleepH(h)}
              type="button"
            >
              {h}ц
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="font-medium text-sm">Амралт / медитаци (минут)</div>
        <div className="flex flex-wrap gap-2">
          {[0, 10, 15, 20, 30, 45, 60].map((m) => (
            <button
              className={`rounded-lg border px-3 py-1 text-sm transition-colors ${
                restMin === m
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "hover:bg-muted/50"
              }`}
              key={m}
              onClick={() => setRestMin(m)}
              type="button"
            >
              {m === 0 ? "0" : `${m}мин`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Movement tab ──────────────────────────────────────────────────────────────

const MOVE_LEVELS: { value: "good" | "medium" | "low"; label: string }[] = [
  { value: "good", label: "✅ Сайн" },
  { value: "medium", label: "🟡 Дунд" },
  { value: "low", label: "🔴 Бага" },
];

function MoveTab({
  level,
  setLevel,
  steps,
  setSteps,
  targetSteps,
  burnedKcal,
  setBurnedKcal,
  badHabitsScore,
  setBadHabitsScore,
}: {
  level: "good" | "medium" | "low" | null;
  setLevel: (v: "good" | "medium" | "low" | null) => void;
  steps: number | null;
  setSteps: (v: number | null) => void;
  targetSteps: number | null;
  burnedKcal: number | null;
  setBurnedKcal: (v: number | null) => void;
  badHabitsScore: number | null;
  setBadHabitsScore: (v: number | null) => void;
}) {
  const pct =
    targetSteps && steps != null
      ? Math.min(100, Math.round((steps / targetSteps) * 100))
      : 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="font-medium text-sm">Өнөөдрийн хөдөлгөөн</div>
        <div className="grid grid-cols-3 gap-2">
          {MOVE_LEVELS.map(({ value, label }) => (
            <button
              className={`rounded-xl border py-3 font-medium text-sm transition-colors ${
                level === value
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "hover:bg-muted/50"
              }`}
              key={value}
              onClick={() => setLevel(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="font-medium text-sm" htmlFor="steps-input">
          Алхалт{targetSteps ? ` (зорилт: ${targetSteps})` : ""}
        </label>
        <input
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
          id="steps-input"
          min={0}
          onChange={(e) =>
            setSteps(e.target.value ? Number(e.target.value) : null)
          }
          placeholder="Алхамын тоо"
          step={100}
          type="number"
          value={steps ?? ""}
        />
        {targetSteps != null && steps != null && (
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-green-400 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="font-medium text-sm" htmlFor="burned-kcal-input">
          Хөдөлгөөнөөр шатаасан калори
        </label>
        <input
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
          id="burned-kcal-input"
          min={0}
          onChange={(e) =>
            setBurnedKcal(e.target.value ? Number(e.target.value) : null)
          }
          placeholder="Жишээ нь: 250"
          step={10}
          type="number"
          value={burnedKcal ?? ""}
        />
      </div>

      <div className="space-y-2">
        <label className="font-medium text-sm" htmlFor="bad-habits-range">
          Муу зуршлын түвшин (0 – байхгүй, 100 – маш их)
        </label>
        <div className="flex items-center gap-3">
          <input
            className="flex-1"
            id="bad-habits-range"
            max={100}
            min={0}
            onChange={(e) => setBadHabitsScore(Number(e.target.value))}
            type="range"
            value={badHabitsScore ?? 0}
          />
          <span className="w-10 text-right font-medium text-sm">
            {badHabitsScore ?? 0}
          </span>
        </div>
        <div className="text-muted-foreground text-xs">
          {(badHabitsScore ?? 0) <= 20
            ? "Ойролцоогоор нөлөөгүй"
            : (badHabitsScore ?? 0) <= 60
              ? "Анхааралтай хянах шаардлагатай"
              : "Эрүүл мэндэд сөрөг нөлөө өгч болзошгүй"}
        </div>
      </div>
    </div>
  );
}
