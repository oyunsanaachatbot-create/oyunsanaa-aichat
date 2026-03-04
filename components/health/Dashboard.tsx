// components/health/Dashboard.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { DailyItems, HealthProfilePayload, HealthProfileRow } from "./healthTypes";
import { computeTargets } from "./calc";
import QuestionnaireForm from "./QuestionnaireForm";

const todayYmd = () => new Date().toISOString().slice(0, 10);

export default function Dashboard() {
  const [profile, setProfile] = useState<HealthProfileRow | null>(null);
  const [payload, setPayload] = useState<HealthProfilePayload | null>(null);

  const [day, setDay] = useState(todayYmd());
  const [items, setItems] = useState<DailyItems>({ waterLiters: null, steps: null, sleepHours: null, mood: null });

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const targets = useMemo(() => (payload ? computeTargets(payload) : null), [payload]);

  async function loadProfile() {
    const res = await fetch("/api/health/profile");
    const j = await res.json();
    if (!res.ok) throw new Error(j?.error || "Profile load failed");
    setProfile(j.profile ?? null);
    setPayload(j.profile?.payload ?? null);
    return j.profile ?? null;
  }

  async function loadDaily(d: string) {
    const res = await fetch(`/api/health/daily?day=${encodeURIComponent(d)}`);
    const j = await res.json();
    if (!res.ok) throw new Error(j?.error || "Daily load failed");
    setItems(j.log?.items ?? { waterLiters: null, steps: null, sleepHours: null, mood: null });
  }

  async function saveDaily() {
    setErr(null);
    const res = await fetch("/api/health/daily", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        day,
        waterLiters: items.waterLiters ?? null,
        steps: items.steps ?? null,
        sleepHours: items.sleepHours ?? null,
        mood: items.mood ?? null,
      }),
    });
    const j = await res.json();
    if (!res.ok) setErr(j?.error || "Daily save failed");
    else setItems(j.log?.items ?? items);
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const p = await loadProfile();
        if (p) await loadDaily(day);
      } catch (e: any) {
        setErr(e?.message || "Алдаа гарлаа");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="text-sm text-slate-600">Loading...</div>;
  if (err) return <div className="text-sm text-rose-700">{err}</div>;

  // Профайл байхгүй бол хуучин “асуумж” гарна
  if (!payload) {
    return (
      <QuestionnaireForm
  onSaved={() => {
    void (async () => {
      const p = await loadProfile();
      if (p) await loadDaily(day);
    })();
  }}
/>
    );
  }

  // Профайл байгаа бол dashboard
  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow p-4 space-y-2">
        <div className="text-lg font-semibold text-slate-900">Эрүүл мэнд · Dashboard</div>
        <div className="text-sm text-slate-700">{targets?.summary}</div>

        <div className="grid md:grid-cols-3 gap-2 text-sm">
          <Stat label="Калори" value={profile?.target_calories ?? targets?.targetCalories} suffix="kcal" />
          <Stat label="Ус" value={profile?.target_water_l ?? targets?.targetWaterL} suffix="L" />
          <Stat label="Алхам" value={profile?.target_steps ?? targets?.targetSteps} suffix="" />
        </div>
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
          <FieldNum label="Ус (л)" value={items.waterLiters ?? null} onChange={(v) => setItems((p) => ({ ...p, waterLiters: v }))} />
          <FieldNum label="Алхалт (алхам)" value={items.steps ?? null} onChange={(v) => setItems((p) => ({ ...p, steps: v }))} />
          <FieldNum label="Нойр (цаг)" value={items.sleepHours ?? null} onChange={(v) => setItems((p) => ({ ...p, sleepHours: v }))} />
          <FieldNum label="Mood (1-10)" value={items.mood ?? null} onChange={(v) => setItems((p) => ({ ...p, mood: v }))} />
        </div>

        <button onClick={saveDaily} className="rounded-lg bg-sky-600 text-white px-4 py-2 text-sm font-medium">
          Өдрийн бүртгэл хадгалах
        </button>
      </div>
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

function Stat(props: { label: string; value: number | null | undefined; suffix: string }) {
  return (
    <div className="rounded-xl border px-3 py-2">
      <div className="text-slate-600">{props.label}</div>
      <div className="font-semibold text-slate-900">
        {props.value ?? "-"} {props.value != null ? props.suffix : ""}
      </div>
    </div>
  );
}
