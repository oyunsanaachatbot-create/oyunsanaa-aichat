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
import type { Dictionary } from "@/lib/i18n/dictionaries/mn";

type DashT = Dictionary["apps"]["healthDashboard"];

const todayYmd = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
type Tab = "food" | "water" | "sleep" | "move" | "summary";

function tpl(str: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(`{${k}}`, String(v)),
    str
  );
}

export default function Dashboard() {
  const t = useT().apps.healthDashboard;
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
      setErr(e?.message ?? t.fetchError);
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
      setErr(t.saveError);
    }
  }

  if (loading)
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        {t.loading}
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
    { id: "food", label: `🍽 ${t.tabs.food}` },
    { id: "water", label: `💧 ${t.tabs.water}` },
    { id: "sleep", label: `😴 ${t.tabs.sleep}` },
    { id: "move", label: `🏃 ${t.tabs.move}` },
    { id: "summary", label: `📊 ${t.tabs.summary}` },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Program header */}
      <div className="space-y-3 rounded-2xl border bg-card p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-muted-foreground text-xs">
              {t.programHeader}
            </div>
            <div className="font-semibold text-base">
              {tpl(t.dayProgress, { day: programDay, total: totalDays })}
            </div>
          </div>
          {targets?.bmiText && (
            <div className="text-muted-foreground text-xs sm:text-right">
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
              <div className="text-muted-foreground">{t.units.kcal}</div>
            </div>
            <div className="rounded-lg bg-muted/50 py-1.5">
              <div className="font-semibold">
                {targets.targetWaterL ?? "-"} {t.units.liter}
              </div>
              <div className="text-muted-foreground">{t.tabs.water}</div>
            </div>
            <div className="rounded-lg bg-muted/50 py-1.5">
              <div className="font-semibold">{targets.targetSteps ?? "-"}</div>
              <div className="text-muted-foreground">{t.units.steps}</div>
            </div>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-muted/30 text-xs sm:grid-cols-5">
        {TABS.map(({ id, label }) => (
          <button
            className={`min-w-0 px-2 py-2.5 text-center leading-tight transition-colors ${
              id === "summary" ? "col-span-2 sm:col-span-1" : ""
            } ${
              tab === id
                ? "bg-background font-semibold shadow-sm"
                : "text-muted-foreground"
            }`}
            key={id}
            onClick={() => setTab(id)}
            type="button"
          >
            <span className="block break-words">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-2xl border bg-card p-4">
        {tab === "food" && (
          <FoodTab meals={meals} setMeals={setMeals} t={t} targets={targets} />
        )}
        {tab === "water" && (
          <WaterTab
            mlShort={t.units.mlShort}
            setWaterL={setWaterL}
            t={t.water}
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
            t={t.sleep}
            unitHour={t.units.hourShort}
            unitMinute={t.units.minuteShort}
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
            t={t.move}
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
          {t.save}
        </button>
        {saved && (
          <span className="text-green-600 text-sm dark:text-green-400">
            {t.saved}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-2 text-sm">
        <Link
          className="flex-1 rounded-xl border py-2.5 text-center text-muted-foreground transition-colors hover:bg-muted/50"
          href="/mind/therapy"
        >
          💬 {t.chatWithPsychologist}
        </Link>
        <button
          className="rounded-xl border px-4 py-2.5 text-muted-foreground transition-colors hover:bg-muted/50"
          onClick={() => setShowForm(true)}
          title={t.editProfile}
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
  overColor = "danger",
}: {
  label: string;
  value: number;
  target: number | null;
  unit: string;
  overColor?: "danger" | "warning";
}) {
  if (target == null) return null;
  const pct = Math.min(100, Math.round((value / target) * 100));
  const over = value > target;
  const overClass =
    overColor === "warning" ? "text-amber-600" : "text-destructive";
  const overBarClass =
    overColor === "warning" ? "bg-amber-400" : "bg-destructive";
  return (
    <div>
      <div className="mb-1 flex justify-between text-muted-foreground text-xs">
        <span>{label}</span>
        <span className={over ? overClass : undefined}>
          {value} / {target} {unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${over ? overBarClass : "bg-primary"}`}
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
  t,
}: {
  meals: MealItem[];
  setMeals: (m: MealItem[]) => void;
  targets: HealthTargets | null;
  t: DashT;
}) {
  const f = t.food;
  const u = t.units;
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
        throw new Error(data?.error || f.aiError);
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
      setAnalyzeError(e?.message ?? f.aiError);
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
            {f.nameLabel}
          </label>
          <input
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            id="meal-title"
            onChange={(e) => setTitle(e.target.value)}
            placeholder={f.namePlaceholder}
            value={title}
          />
        </div>

        <div>
          <label
            className="mb-1 block text-muted-foreground text-xs"
            htmlFor="meal-image"
          >
            {f.imageLabel}
          </label>

          {imagePreviewUrl ? (
            <div className="flex items-center gap-3">
              {/* biome-ignore lint/performance/noImgElement: local object URL preview, not a remote image */}
              <img
                alt={f.imageAlt}
                className="h-16 w-16 rounded-lg border object-cover"
                height={64}
                src={imagePreviewUrl}
                width={64}
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
                  {f.removeImage}
                </button>
              </div>
            </div>
          ) : (
            <div className="min-w-0">
              <label
                className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm transition-colors hover:bg-muted/40"
                htmlFor="meal-image"
              >
                <span className="shrink-0">📷</span>
                <span className="min-w-0 truncate">{f.chooseImage}</span>
              </label>
              <input
                accept="image/*"
                className="sr-only"
                id="meal-image"
                onChange={(e) => pickImage(e.target.files?.[0] ?? null)}
                type="file"
              />
            </div>
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
          {analyzing ? f.analyzing : f.analyzeButton}
        </button>
        {!imageFile && !title.trim() && (
          <div className="text-muted-foreground text-xs">{f.analyzeHint}</div>
        )}
        {filledByAI && (
          <div className="text-emerald-600 text-xs dark:text-emerald-400">
            {f.filledByAI}
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          <LabeledInput
            label={f.fields.calories}
            onChange={(v) => updateDraft("calories", v)}
            value={draft.calories}
          />
          <LabeledInput
            label={f.fields.protein}
            onChange={(v) => updateDraft("proteinG", v)}
            value={draft.proteinG}
          />
          <LabeledInput
            label={f.fields.goodCarbs}
            onChange={(v) => updateDraft("goodCarbsG", v)}
            value={draft.goodCarbsG}
          />
          <LabeledInput
            label={f.fields.badCarbs}
            onChange={(v) => updateDraft("badCarbsG", v)}
            value={draft.badCarbsG}
          />
          <LabeledInput
            label={f.fields.fat}
            onChange={(v) => updateDraft("fatG", v)}
            value={draft.fatG}
          />
          <LabeledInput
            label={f.fields.fiber}
            onChange={(v) => updateDraft("fiberG", v)}
            value={draft.fiberG}
          />
          <LabeledInput
            label={f.fields.sugar}
            onChange={(v) => updateDraft("sugarG", v)}
            value={draft.sugarG}
          />
          <LabeledInput
            label={f.fields.nutritionScore}
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
          {f.addMeal}
        </button>
        <p className="text-muted-foreground text-xs">{f.addMealHint}</p>
      </div>

      {/* Today's meals */}
      <div className="space-y-1">
        {meals.length === 0 && (
          <div className="py-4 text-center text-muted-foreground text-sm">
            {f.noMeals}
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
                  {m.calories} {u.kcal}
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
            label={f.nutrients.calories}
            target={targets.targetCalories}
            unit={u.kcal}
            value={totals.calories}
          />
          <NutrientBar
            label={f.nutrients.protein}
            target={targets.targetProteinG}
            unit={u.gram}
            value={totals.proteinG}
          />
          <NutrientBar
            label={f.nutrients.goodCarbs}
            overColor="warning"
            target={targets.targetGoodCarbsG}
            unit={u.gram}
            value={totals.goodCarbsG}
          />
          <NutrientBar
            label={f.nutrients.badCarbs}
            target={targets.targetBadCarbsG}
            unit={u.gram}
            value={totals.badCarbsG}
          />
          <NutrientBar
            label={f.nutrients.fat}
            target={targets.targetFatG}
            unit={u.gram}
            value={totals.fatG}
          />
          <NutrientBar
            label={f.nutrients.fiber}
            overColor="warning"
            target={targets.targetFiberG}
            unit={u.gram}
            value={totals.fiberG}
          />
          <NutrientBar
            label={f.nutrients.sugar}
            target={targets.targetSugarG}
            unit={u.gram}
            value={totals.sugarG}
          />
          {score != null && (
            <NutrientBar
              label={f.nutrients.nutritionScore}
              target={targets.targetNutritionScore}
              unit={u.point}
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
  t,
  mlShort,
}: {
  waterL: number;
  setWaterL: (v: number) => void;
  targetL: number | null;
  t: DashT["water"];
  mlShort: string;
}) {
  const pct = targetL ? Math.min(100, Math.round((waterL / targetL) * 100)) : 0;
  const add = (ml: number) => setWaterL(Math.round(waterL * 1000 + ml) / 1000);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="font-bold text-4xl">{waterL.toFixed(1)}</div>
        <div className="text-muted-foreground text-sm">
          {t.liter}
          {targetL ? ` ${tpl(t.target, { target: targetL })}` : ""}
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

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[200, 300, 500, 1000].map((ml) => (
          <button
            className="rounded-xl border py-2.5 font-medium text-sm transition-colors hover:bg-muted/50"
            key={ml}
            onClick={() => add(ml)}
            type="button"
          >
            +{ml}
            {mlShort}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
          min={0}
          onChange={(e) => setWaterL(Math.max(0, Number(e.target.value) || 0))}
          placeholder={t.totalPlaceholder}
          step={0.1}
          type="number"
          value={waterL || ""}
        />
        <button
          className="px-3 py-2 text-muted-foreground text-xs hover:text-destructive"
          onClick={() => setWaterL(0)}
          type="button"
        >
          {t.clear}
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
  t,
  unitHour,
  unitMinute,
}: {
  sleepH: number | null;
  setSleepH: (v: number | null) => void;
  restMin: number | null;
  setRestMin: (v: number | null) => void;
  t: DashT["sleep"];
  unitHour: string;
  unitMinute: string;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="font-medium text-sm" htmlFor="sleep-range">
          {t.hoursLabel}
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
            {sleepH ?? 0}
            {unitHour}
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
              {h}
              {unitHour}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="font-medium text-sm">{t.restLabel}</div>
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
              {m === 0 ? "0" : `${m}${unitMinute}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Movement tab ──────────────────────────────────────────────────────────────

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
  t,
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
  t: DashT["move"];
}) {
  const pct =
    targetSteps && steps != null
      ? Math.min(100, Math.round((steps / targetSteps) * 100))
      : 0;

  const MOVE_LEVELS: { value: "good" | "medium" | "low"; label: string }[] = [
    { value: "good", label: t.levelGood },
    { value: "medium", label: t.levelMedium },
    { value: "low", label: t.levelLow },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="font-medium text-sm">{t.today}</div>
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
          {t.stepsLabel}
          {targetSteps ? ` ${tpl(t.stepsTarget, { target: targetSteps })}` : ""}
        </label>
        <input
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
          id="steps-input"
          min={0}
          onChange={(e) =>
            setSteps(e.target.value ? Number(e.target.value) : null)
          }
          placeholder={t.stepsPlaceholder}
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
          {t.burnedKcalLabel}
        </label>
        <input
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
          id="burned-kcal-input"
          min={0}
          onChange={(e) =>
            setBurnedKcal(e.target.value ? Number(e.target.value) : null)
          }
          placeholder={t.burnedKcalPlaceholder}
          step={10}
          type="number"
          value={burnedKcal ?? ""}
        />
      </div>

      <div className="space-y-2">
        <label className="font-medium text-sm" htmlFor="bad-habits-range">
          {t.badHabitsLabel}
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
            ? t.badHabitsLow
            : (badHabitsScore ?? 0) <= 60
              ? t.badHabitsMid
              : t.badHabitsHigh}
        </div>
      </div>
    </div>
  );
}
