// components/health/Dashboard.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { DailyItems, HealthProfilePayload, MealItem } from "./healthTypes";
import { computeTargets, programDays } from "./calc";
import QuestionnaireForm from "./QuestionnaireForm";
import { useLocale, useT } from "@/lib/i18n/provider";

const todayYmd = () => new Date().toISOString().slice(0, 10);
type Tab = "food" | "water" | "sleep" | "move";

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
    if (!items) return;
    setMeals(items.meals ?? []);
    setWaterL(items.waterLiters ?? 0);
    setSleepH(items.sleepHours ?? null);
    setRestMin(items.restMinutes ?? null);
    setMoveLevel(items.movementLevel ?? null);
    setSteps(items.steps ?? null);
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
        onSaved={() => {
          setShowForm(false);
          loadAll().catch(console.error);
        }}
      />
    );

  const progress = Math.round((programDay / totalDays) * 100);
  const calTotal = meals.reduce((s, m) => s + (m.calories ?? 0), 0);

  const TABS: { id: Tab; label: string }[] = [
    { id: "food", label: "🍽 Хоол" },
    { id: "water", label: "💧 Ус" },
    { id: "sleep", label: "😴 Нойр" },
    { id: "move", label: "🏃 Хөдөлгөөн" },
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
          <FoodTab
            calTotal={calTotal}
            meals={meals}
            setMeals={setMeals}
            targetCal={targets?.targetCalories ?? null}
          />
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
            level={moveLevel}
            setLevel={setMoveLevel}
            setSteps={setSteps}
            steps={steps}
            targetSteps={targets?.targetSteps ?? null}
          />
        )}
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
          💬 Сэтгэл зүйчтэй чат
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

function FoodTab({
  meals,
  setMeals,
  targetCal,
  calTotal,
}: {
  meals: MealItem[];
  setMeals: (m: MealItem[]) => void;
  targetCal: number | null;
  calTotal: number;
}) {
  const [title, setTitle] = useState("");
  const [cal, setCal] = useState("");

  function addMeal() {
    if (!title.trim()) return;
    setMeals([
      ...meals,
      {
        id: `m-${Date.now()}`,
        title: title.trim(),
        calories: cal ? Number(cal) : null,
      },
    ]);
    setTitle("");
    setCal("");
  }

  const pct = targetCal
    ? Math.min(100, Math.round((calTotal / targetCal) * 100))
    : 0;

  return (
    <div className="space-y-4">
      {targetCal != null && (
        <div>
          <div className="mb-1 flex justify-between text-muted-foreground text-xs">
            <span>Калори</span>
            <span>
              {calTotal} / {targetCal} kcal
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

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
            <span>{m.title}</span>
            <div className="flex items-center gap-3">
              {m.calories != null && (
                <span className="text-muted-foreground text-xs">
                  {m.calories} kcal
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

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addMeal()}
          placeholder="Хоолны нэр..."
          value={title}
        />
        <input
          className="w-20 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
          onChange={(e) => setCal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addMeal()}
          placeholder="kcal"
          type="number"
          value={cal}
        />
        <button
          className="rounded-lg bg-primary px-3 py-2 font-medium text-primary-foreground text-sm"
          onClick={addMeal}
          type="button"
        >
          +
        </button>
      </div>
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
}: {
  level: "good" | "medium" | "low" | null;
  setLevel: (v: "good" | "medium" | "low" | null) => void;
  steps: number | null;
  setSteps: (v: number | null) => void;
  targetSteps: number | null;
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
    </div>
  );
}
