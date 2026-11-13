"use client";

import { useEffect, useState } from "react";
import {
  APP_SHELL_TOKENS,
  AppCard,
  AppShell,
  Button,
  EmptyState,
} from "@/components/mind/app-shell";
import {
  type DailyLog,
  type DailyMeal,
  type HealthProgramData,
  emptyLog,
  loadDailyLog,
  loadHealthProgram,
  saveDailyLog,
} from "@/lib/mind/health-program";

const { INK, MUTED, LINE, BRAND, BRAND_RGB } = APP_SHELL_TOKENS;

type Tab = "food" | "water" | "sleep" | "move";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "food", label: "Хоол", icon: "🍽" },
  { id: "water", label: "Ус", icon: "💧" },
  { id: "sleep", label: "Нойр", icon: "😴" },
  { id: "move", label: "Хөдөлгөөн", icon: "🏃" },
];

const WATER_INCREMENTS = [0.2, 0.3, 0.5, 1.0];
const SLEEP_PRESETS = [5, 6, 6.5, 7, 7.5, 8, 9];

function todayStr() {
  return new Date().toLocaleDateString("sv-SE"); // yyyy-mm-dd in local TZ
}

function pct(val: number, total: number) {
  return total > 0 ? Math.min(100, Math.round((val / total) * 100)) : 0;
}

function ProgressBar({ value, max, color = BRAND }: { value: number; max: number; color?: string }) {
  const p = pct(value, max);
  return (
    <div className="h-3 w-full overflow-hidden rounded-full" style={{ background: LINE }}>
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${p}%`, background: color }}
      />
    </div>
  );
}

function chipStyle(active: boolean) {
  return {
    borderColor: active ? BRAND : LINE,
    background: active ? `rgba(${BRAND_RGB},0.08)` : "#fff",
    color: INK,
  };
}

export default function HealthProgramPage() {
  const [data, setData] = useState<HealthProgramData | null>(null);
  const [log, setLog] = useState<DailyLog | null>(null);
  const [tab, setTab] = useState<Tab>("food");
  const [mounted, setMounted] = useState(false);

  // food form
  const [foodName, setFoodName] = useState("");
  const [foodCal, setFoodCal] = useState("");

  useEffect(() => {
    const prog = loadHealthProgram();
    setData(prog);
    setLog(loadDailyLog(todayStr()));
    setMounted(true);
  }, []);

  const save = (next: DailyLog) => {
    setLog(next);
    saveDailyLog(next);
  };

  if (!mounted) { return null; }

  if (!data || !log) {
    return (
      <AppShell backHref="/mind/self-care/health/questionnaire" title="Хөтөлбөр" width="3xl">
        <AppCard>
          <EmptyState icon="📋">
            Та эрүүл мэндийн асуулгаа бөглөөгүй байна.
          </EmptyState>
          <div className="mt-4 flex justify-center">
            <Button href="/mind/self-care/health/questionnaire">Асуулга бөглөх</Button>
          </div>
        </AppCard>
      </AppShell>
    );
  }

  const { targets } = data;

  const totalCal = log.meals.reduce((s, m) => s + m.calories, 0);

  const addMeal = () => {
    const cal = Number(foodCal);
    if (!foodName.trim() || !cal) { return; }
    const meal: DailyMeal = {
      id: `${Date.now()}-${Math.floor(Math.random() * 9999)}`,
      name: foodName.trim(),
      calories: cal,
    };
    save({ ...log, meals: [...log.meals, meal] });
    setFoodName("");
    setFoodCal("");
  };

  const removeMeal = (id: string) => {
    save({ ...log, meals: log.meals.filter((m) => m.id !== id) });
  };

  const addWater = (amount: number) => {
    save({ ...log, waterL: Math.round((log.waterL + amount) * 10) / 10 });
  };

  const setSleep = (h: number) => {
    save({ ...log, sleepH: h });
  };

  const setSteps = (s: number) => {
    save({ ...log, steps: s });
  };

  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[#1F6FB2] focus:ring-2 focus:ring-[#1F6FB2]/15";

  return (
    <AppShell backHref="/mind/self-care/health/summary" title="Өдрийн хөтөлбөр" width="3xl">
      <div className="space-y-4">
        {/* Summary row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Калори", cur: `${totalCal}`, target: `${targets.dailyCalories} ккал` },
            { label: "Ус", cur: `${log.waterL}л`, target: `${targets.targetWaterL}л` },
            { label: "Нойр", cur: `${log.sleepH}ц`, target: `${targets.sleepRecommended}ц` },
            { label: "Алхалт", cur: `${log.steps.toLocaleString()}`, target: `${targets.targetSteps.toLocaleString()}` },
          ].map(({ label, cur, target }) => (
            <div
              className="flex flex-col items-center rounded-2xl border border-slate-100 p-2.5 text-center"
              key={label}
              style={{ background: "rgba(255,255,255,0.85)" }}
            >
              <div className="text-[10px] uppercase tracking-wide" style={{ color: MUTED }}>{label}</div>
              <div className="mt-1 text-base font-bold" style={{ color: INK }}>{cur}</div>
              <div className="text-[10px]" style={{ color: MUTED }}>/ {target}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {TABS.map(({ id, label, icon }) => (
            <button
              className="flex-1 rounded-xl border px-2 py-2 text-sm font-medium transition-colors"
              key={id}
              onClick={() => setTab(id)}
              style={chipStyle(tab === id)}
              type="button"
            >
              <span className="block text-base">{icon}</span>
              <span className="block text-[11px] mt-0.5">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <AppCard className="rounded-2xl border border-slate-200 bg-white p-5">
          {tab === "food" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm" style={{ color: INK }}>Калорийн бүртгэл</div>
                <div className="text-sm" style={{ color: BRAND }}>
                  {totalCal} / {targets.dailyCalories} ккал
                </div>
              </div>
              <ProgressBar
                color={totalCal > targets.dailyCalories ? "#DC2626" : BRAND}
                max={targets.dailyCalories}
                value={totalCal}
              />

              <div className="flex gap-2">
                <input
                  className={inputCls + " flex-1"}
                  onChange={(e) => setFoodName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { addMeal(); } }}
                  placeholder="Хоолны нэр"
                  style={{ color: INK }}
                  type="text"
                  value={foodName}
                />
                <input
                  className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1F6FB2]"
                  onChange={(e) => setFoodCal(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { addMeal(); } }}
                  placeholder="ккал"
                  style={{ color: INK }}
                  type="number"
                  value={foodCal}
                />
                <button
                  className="rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                  onClick={addMeal}
                  style={{ background: BRAND }}
                  type="button"
                >
                  +
                </button>
              </div>

              {log.meals.length === 0 ? (
                <p className="text-sm" style={{ color: MUTED }}>Одоогоор бүртгэлгүй байна.</p>
              ) : (
                <div className="space-y-1.5">
                  {log.meals.map((m) => (
                    <div
                      className="flex items-center justify-between rounded-xl border border-slate-100 px-3.5 py-2.5"
                      key={m.id}
                    >
                      <span className="text-sm" style={{ color: INK }}>{m.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold" style={{ color: BRAND }}>
                          {m.calories} ккал
                        </span>
                        <button
                          className="text-[11px] hover:opacity-70"
                          onClick={() => removeMeal(m.id)}
                          style={{ color: MUTED }}
                          type="button"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "water" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm" style={{ color: INK }}>Усны хэрэглээ</div>
                <div className="text-sm" style={{ color: BRAND }}>
                  {log.waterL} / {targets.targetWaterL} л
                </div>
              </div>
              <ProgressBar color="#38BDF8" max={targets.targetWaterL} value={log.waterL} />

              <div className="text-center text-5xl font-black" style={{ color: BRAND }}>
                {log.waterL}<span className="text-2xl font-semibold"> л</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {WATER_INCREMENTS.map((amt) => (
                  <button
                    className="rounded-xl border px-2 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5"
                    key={amt}
                    onClick={() => addWater(amt)}
                    style={{
                      borderColor: `rgba(${BRAND_RGB},0.3)`,
                      background: `rgba(${BRAND_RGB},0.06)`,
                      color: BRAND,
                    }}
                    type="button"
                  >
                    +{amt >= 1 ? "1л" : `${amt * 1000 | 0}мл`}
                  </button>
                ))}
              </div>

              {log.waterL > 0 && (
                <button
                  className="text-xs underline"
                  onClick={() => save({ ...log, waterL: Math.max(0, Math.round((log.waterL - 0.2) * 10) / 10) })}
                  style={{ color: MUTED }}
                  type="button"
                >
                  ← 200мл буцаах
                </button>
              )}
            </div>
          )}

          {tab === "sleep" && (
            <div className="space-y-4">
              <div className="font-semibold text-sm" style={{ color: INK }}>Нойр</div>

              <div className="text-center text-5xl font-black" style={{ color: BRAND }}>
                {log.sleepH || "—"}<span className="text-2xl font-semibold"> цаг</span>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                {SLEEP_PRESETS.map((h) => (
                  <button
                    className="rounded-xl border px-3.5 py-2 text-sm font-medium transition-all"
                    key={h}
                    onClick={() => setSleep(h)}
                    style={chipStyle(log.sleepH === h)}
                    type="button"
                  >
                    {h}ц
                  </button>
                ))}
              </div>

              <input
                className="w-full accent-[#1F6FB2]"
                max="12"
                min="0"
                onChange={(e) => setSleep(Number(e.target.value))}
                step="0.5"
                type="range"
                value={log.sleepH}
              />

              <div className="rounded-xl border border-slate-100 p-4 space-y-3">
                <div className="text-sm font-medium" style={{ color: INK }}>Амралтын минут</div>
                <div className="flex gap-2">
                  {[0, 15, 30, 45, 60].map((m) => (
                    <button
                      className="flex-1 rounded-xl border py-2 text-sm font-medium transition-all"
                      key={m}
                      onClick={() => save({ ...log, restMin: m })}
                      style={chipStyle(log.restMin === m)}
                      type="button"
                    >
                      {m === 0 ? "—" : `${m}м`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm rounded-xl border border-slate-100 px-4 py-3">
                <span style={{ color: MUTED }}>Зорилт</span>
                <span className="font-semibold" style={{ color: BRAND }}>
                  {targets.sleepRecommended} цаг
                </span>
              </div>
            </div>
          )}

          {tab === "move" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm" style={{ color: INK }}>Алхалт</div>
                <div className="text-sm" style={{ color: BRAND }}>
                  {log.steps.toLocaleString()} / {targets.targetSteps.toLocaleString()} алхам
                </div>
              </div>
              <ProgressBar color="#4ADE80" max={targets.targetSteps} value={log.steps} />

              <div className="text-center text-5xl font-black" style={{ color: BRAND }}>
                {log.steps.toLocaleString()}
                <span className="text-xl font-semibold"> алхам</span>
              </div>

              <div>
                <div className="mb-1.5 text-sm font-medium" style={{ color: INK }}>Алхам оруулах</div>
                <div className="flex gap-2">
                  <input
                    className={inputCls + " flex-1"}
                    min="0"
                    onChange={(e) => setSteps(Number(e.target.value) || 0)}
                    placeholder="Жишээ: 8000"
                    style={{ color: INK }}
                    type="number"
                    value={log.steps || ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[1000, 2000, 5000].map((n) => (
                  <button
                    className="rounded-xl border py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5"
                    key={n}
                    onClick={() => setSteps(log.steps + n)}
                    style={{
                      borderColor: `rgba(${BRAND_RGB},0.3)`,
                      background: `rgba(${BRAND_RGB},0.06)`,
                      color: BRAND,
                    }}
                    type="button"
                  >
                    +{n.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          )}
        </AppCard>

        {/* Footer */}
        <div className="flex flex-col gap-2">
          <Button className="w-full" href="/mind/self-care/health/summary" variant="ghost">
            ← Дүгнэлт харах
          </Button>
          <Button className="w-full" href="/mind/self-care/health/questionnaire" variant="ghost">
            Асуулга засах
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
