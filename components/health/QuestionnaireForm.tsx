// components/health/QuestionnaireForm.tsx
"use client";

import { useMemo, useState } from "react";
import type { HealthProfilePayload } from "./healthTypes";
import { computeTargets } from "./calc";

const todayYmd = () => new Date().toISOString().slice(0, 10);

export default function QuestionnaireForm(props: {
  initial?: HealthProfilePayload | null;
  onSaved?: () => void;
}) {
  const [form, setForm] = useState<HealthProfilePayload>({
    startDate: props.initial?.startDate ?? todayYmd(),
    gender: props.initial?.gender ?? "",
    age: props.initial?.age ?? null,
    heightCm: props.initial?.heightCm ?? null,
    weightKg: props.initial?.weightKg ?? null,
    walkingLevel: props.initial?.walkingLevel ?? "",
    exerciseFreq: props.initial?.exerciseFreq ?? "none",
    sleepHours: props.initial?.sleepHours ?? "",
  });

  const targets = useMemo(() => computeTargets(form), [form]);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const setField = (k: keyof HealthProfilePayload, v: any) =>
    setForm((p) => ({ ...p, [k]: v }));

  async function save() {
    setSaving(true);
    setErr(null);
    setOk(null);
    try {
      const res = await fetch("/api/health/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Save failed");
      setOk("Хадгаллаа ✅");
      props.onSaved?.();
    } catch (e: any) {
      setErr(e?.message || "Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white text-slate-900 rounded-2xl p-4 shadow max-w-2xl mx-auto space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Эрүүл мэндийн асуумж</h2>
        <p className="text-sm text-slate-600">Хуучин төслийн логик дээр суурилсан бодит хувилбар.</p>
      </div>

      {err && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{err}</div>}
      {ok && <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{ok}</div>}

      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Эхлэх өдөр</label>
          <input className="w-full rounded-lg border px-3 py-2 text-sm" type="date"
            value={form.startDate ?? ""}
            onChange={(e) => setField("startDate", e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Хүйс</label>
          <div className="flex gap-3 text-sm">
            <label className="inline-flex items-center gap-2">
              <input type="radio" checked={form.gender === "male"} onChange={() => setField("gender", "male")} />
              Эр
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" checked={form.gender === "female"} onChange={() => setField("gender", "female")} />
              Эм
            </label>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <FieldNum label="Нас" value={form.age ?? null} onChange={(v) => setField("age", v)} />
        <FieldNum label="Өндөр (см)" value={form.heightCm ?? null} onChange={(v) => setField("heightCm", v)} />
        <FieldNum label="Жин (кг)" value={form.weightKg ?? null} onChange={(v) => setField("weightKg", v)} />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Алхалтын түвшин</label>
          <select className="w-full rounded-lg border px-3 py-2 text-sm"
            value={form.walkingLevel ?? ""}
            onChange={(e) => setField("walkingLevel", e.target.value)}
          >
            <option value="">Сонгох</option>
            <option value="low">Бага</option>
            <option value="medium">Дундаж</option>
            <option value="high">Их</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Дасгалын давтамж</label>
          <select className="w-full rounded-lg border px-3 py-2 text-sm"
            value={form.exerciseFreq ?? "none"}
            onChange={(e) => setField("exerciseFreq", e.target.value)}
          >
            <option value="none">Огт</option>
            <option value="weekly1">7 хоногт 1</option>
            <option value="weekly2_3">7 хоногт 2-3</option>
            <option value="daily">Өдөр бүр</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 p-3 space-y-1">
        <div className="text-sm font-medium">Автоматаар бодсон товч</div>
        <div className="text-sm text-slate-700">{targets.summary}</div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? "Хадгалж байна..." : "Хадгалах"}
      </button>
    </div>
  );
}

function FieldNum(props: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{props.label}</label>
      <input
        className="w-full rounded-lg border px-3 py-2 text-sm"
        type="number"
        value={props.value ?? ""}
        onChange={(e) => props.onChange(e.target.value === "" ? null : Number(e.target.value))}
      />
    </div>
  );
}
