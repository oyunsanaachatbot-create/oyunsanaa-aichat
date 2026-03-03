// components/health/Dashboard.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { DailyLog, HealthProfile, Meal } from "./healthTypes";
import { calculateTargets } from "./calc";
import QuestionnaireForm from "./QuestionnaireForm";

const todayYmd = () => new Date().toISOString().slice(0, 10);

export default function Dashboard() {
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [day, setDay] = useState(todayYmd());
  const [daily, setDaily] = useState<DailyLog>({ day, waterLiters: null, steps: null, sleepHours: null, mood: null });
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const targets = useMemo(() => (profile ? calculateTargets(profile) : null), [profile]);

  async function loadProfile() {
    setErr(null);
    const res = await fetch("/api/health/profile");
    const j = await res.json();
    if (!res.ok) throw new Error(j?.error || "Profile load failed");
    if (!j.profile) return null;

    const p: HealthProfile = {
      startDate: j.profile.start_date ?? "",
      sex: j.profile.sex ?? "",
      age: j.profile.age ?? null,
      heightCm: j.profile.height_cm ?? null,
      weightKg: j.profile.weight_kg ?? null,
      careLevel: j.profile.care_level ?? "",
      dietType: j.profile.diet_type ?? "",
      mealsPerDay: j.profile.meals_per_day ?? "",
      exerciseFreq: j.profile.exercise_freq ?? "none",
      walkingLevel: j.profile.walking_level ?? "",
      alcoholFreq: j.profile.alcohol_freq ?? "none",
      smokingLevel: j.profile.smoking_level ?? "none",
      meTime: j.profile.me_time ?? "",
      sleepHours: j.profile.sleep_hours ?? "",
      sleepTime: j.profile.sleep_time ?? "",
    };
    return p;
  }

  async function loadDaily(d: string) {
    const res = await fetch(`/api/health/daily?day=${encodeURIComponent(d)}`);
    const j = await res.json();
    if (!res.ok) throw new Error(j?.error || "Daily load failed");

    setDaily({
      day: d,
      waterLiters: j.log?.water_liters ?? null,
      steps: j.log?.steps ?? null,
      sleepHours: j.log?.sleep_hours ?? null,
      mood: j.log?.mood ?? null,
    });

    setMeals(
      (j.meals ?? []).map((m: any) => ({
        id: m.id,
        day: m.day,
        mealType: m.meal_type,
        title: m.title,
        calories: m.calories,
        proteinG: m.protein_g,
        carbsG: m.carbs_g,
        fatG: m.fat_g,
      }))
    );
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const p = await loadProfile();
        setProfile(p);
        if (p) await loadDaily(day);
      } catch (e: any) {
        setErr(e?.message || "Алдаа гарлаа");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveDaily() {
    setErr(null);
    const res = await fetch("/api/health/daily", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(daily),
    });
    const j = await res.json();
    if (!res.ok) setErr(j?.error || "Daily save failed");
  }

  async function addMeal(meal: Omit<Meal, "day">) {
    setErr(null);
    const res = await fetch("/api/health/daily/add-meal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...meal, day }),
    });
    const j = await res.json();
    if (!res.ok) return setErr(j?.error || "Meal add failed");
    await loadDaily(day);
  }

  if (loading) return <div className="text-sm text-slate-600">Loading...</div>;
  if (err) return <div className="text-sm text-rose-700">{err}</div>;

  if (!profile) {
    return (
      <QuestionnaireForm
        onSaved={async () => {
          const p = await loadProfile();
          setProfile(p);
          if (p) await loadDaily(day);
        }}
      />
    );
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow p-4">
        <div className="text-lg font-semibold text-slate-900">Эрүүл мэнд · Dashboard</div>
        <div className="text-sm text-slate-700 mt-1">{targets?.summary}</div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-900">Өдрийн бүртгэл</div>
          <input
            type="date"
            className="rounded-lg border px-3 py-2 text-sm"
            value={day}
            onChange={async (e) => {
              const d = e.target.value;
              setDay(d);
              await loadDaily(d);
            }}
          />
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          <FieldNum label="Ус (л)" value={daily.waterLiters} onChange={(v) => setDaily((p) => ({ ...p, waterLiters: v }))} />
          <FieldNum label="Алхалт (алхам)" value={daily.steps} onChange={(v) => setDaily((p) => ({ ...p, steps: v }))} />
          <FieldNum label="Нойр (цаг)" value={daily.sleepHours} onChange={(v) => setDaily((p) => ({ ...p, sleepHours: v }))} />
          <FieldNum label="Mood (1-10)" value={daily.mood} onChange={(v) => setDaily((p) => ({ ...p, mood: v }))} />
        </div>

        <button onClick={saveDaily} className="rounded-lg bg-sky-600 text-white px-4 py-2 text-sm font-medium">
          Өдрийн бүртгэл хадгалах
        </button>
      </div>

      <MealBox onAdd={addMeal} />
      <MealsList meals={meals} />
    </div>
  );
}

function FieldNum(props: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-800">{props.label}</label>
      <input
        className="w-full rounded-lg border px-3 py-2 text-sm"
        type="number"
        value={props.value ?? ""}
        onChange={(e) => props.onChange(e.target.value === "" ? null : Number(e.target.value))}
      />
    </div>
  );
}

function MealBox(props: { onAdd: (m: any) => void }) {
  const [title, setTitle] = useState("");
  const [mealType, setMealType] = useState<Meal["mealType"]>("breakfast");

  return (
    <div className="bg-white rounded-2xl shadow p-4 space-y-3">
      <div className="text-sm font-semibold text-slate-900">Хоол нэмэх</div>
      <div className="grid md:grid-cols-3 gap-3">
        <select className="rounded-lg border px-3 py-2 text-sm" value={mealType} onChange={(e) => setMealType(e.target.value as any)}>
          <option value="breakfast">Өглөө</option>
          <option value="lunch">Өдөр</option>
          <option value="dinner">Орой</option>
          <option value="snack">Зууш</option>
        </select>
        <input className="md:col-span-2 rounded-lg border px-3 py-2 text-sm" placeholder="Ж: Будаатай хуурга" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <button
        onClick={() => {
          if (!title.trim()) return;
          props.onAdd({ mealType, title: title.trim() });
          setTitle("");
        }}
        className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium"
      >
        Нэмэх
      </button>
    </div>
  );
}

function MealsList(props: { meals: Meal[] }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="text-sm font-semibold text-slate-900 mb-2">Өдрийн хоол</div>
      {props.meals.length === 0 ? (
        <div className="text-sm text-slate-600">Одоогоор хоол бүртгээгүй.</div>
      ) : (
        <div className="space-y-2">
          {props.meals.map((m) => (
            <div key={m.id} className="rounded-xl border px-3 py-2 text-sm flex items-center justify-between">
              <div>
                <div className="font-medium">{m.title}</div>
                <div className="text-slate-600">{m.mealType}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
