"use client";

import { useMemo, useState } from "react";
import type { HealthQuestionnaire, Sex } from "./healthTypes";

type Mode = "guest" | "authed";

export default function QuestionnaireForm({
  mode,
  onSubmit,
}: {
  mode: Mode;
  onSubmit: (q: HealthQuestionnaire) => void | Promise<void>;
}) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [q, setQ] = useState<HealthQuestionnaire>({
    startDate: today,
    sex: "female",
    age: 28,
    heightCm: 165,
    weightKg: 65,
    sleepHours: 7,
    waterLiters: 1.8,
    exercisePerWeek: 2,
    junkScore: 5,
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function set<K extends keyof HealthQuestionnaire>(key: K, val: HealthQuestionnaire[K]) {
    setQ((p) => ({ ...p, [key]: val }));
  }

  function validate(): string | null {
    if (!q.startDate) return "Эхлэх өдрөө сонгоно уу.";
    if (!q.sex) return "Хүйсээ сонгоно уу.";
    if (!(q.age > 0 && q.age < 120)) return "Насаа зөв оруулна уу.";
    if (!(q.heightCm >= 120 && q.heightCm <= 230)) return "Өндрөө зөв оруулна уу (см).";
    if (!(q.weightKg >= 30 && q.weightKg <= 250)) return "Жингээ зөв оруулна уу (кг).";
    if (!(q.sleepHours >= 0 && q.sleepHours <= 14)) return "Нойрны цаг буруу байна.";
    if (!(q.waterLiters >= 0 && q.waterLiters <= 6)) return "Усны хэмжээ буруу байна.";
    if (!(q.exercisePerWeek >= 0 && q.exercisePerWeek <= 7)) return "Дасгалын давтамж буруу байна.";
    if (!(q.junkScore >= 0 && q.junkScore <= 10)) return "“Муу хоол” оноо 0–10 байна.";
    return null;
  }

  async function handleSubmit() {
    setErr(null);
    const v = validate();
    if (v) {
      setErr(v);
      return;
    }
    setSaving(true);
    try {
      await onSubmit(q);
    } catch (e: any) {
      setErr(e?.message ?? "Алдаа гарлаа.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6 space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
              Эрүүл мэндийн асуумж
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {mode === "guest"
                ? "Guest горимд энэ асуумж хадгалагдахгүй. Дараа дахин бөглөхөд шинээр эхэлнэ."
                : "Login хийсэн үед таны хариулт Supabase-д хадгалагдаж, өдөр тутмын тайланд суурь болно."}
            </p>
          </div>
        </div>

        {err && (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {err}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Эхлэх өдөр">
            <input
              type="date"
              value={q.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Хүйс">
            <div className="flex gap-2">
              <RadioPill
                active={q.sex === "female"}
                onClick={() => set("sex", "female")}
                label="Эм"
              />
              <RadioPill
                active={q.sex === "male"}
                onClick={() => set("sex", "male")}
                label="Эр"
              />
            </div>
          </Field>

          <Field label="Нас">
            <input
              type="number"
              value={q.age}
              onChange={(e) => set("age", Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Өндөр (см)">
            <input
              type="number"
              value={q.heightCm}
              onChange={(e) => set("heightCm", Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Жин (кг)">
            <input
              type="number"
              value={q.weightKg}
              onChange={(e) => set("weightKg", Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Нойр (цаг/шөнө)">
            <input
              type="number"
              step="0.5"
              value={q.sleepHours}
              onChange={(e) => set("sleepHours", Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Ус (литр/өдөр)">
            <input
              type="number"
              step="0.1"
              value={q.waterLiters}
              onChange={(e) => set("waterLiters", Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Дасгал (удаа/7 хоног)">
            <input
              type="number"
              value={q.exercisePerWeek}
              onChange={(e) => set("exercisePerWeek", Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Түргэн хоол/чихэр (0–10)">
            <input
              type="range"
              min={0}
              max={10}
              value={q.junkScore}
              onChange={(e) => set("junkScore", Number(e.target.value))}
              className="w-full"
            />
            <div className="mt-1 text-xs text-slate-500">
              Одоогийн оноо: <span className="font-medium text-slate-800">{q.junkScore}/10</span>
            </div>
          </Field>
        </div>

        <div className="mt-5 flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <p className="text-xs text-slate-500">
            Энэ нь эмнэлгийн онош биш. Зөвхөн өдөр тутмын дадлаа хянахад туслах зорилготой.
          </p>
          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit}
            className={[
              "rounded-full px-5 py-2 text-sm font-semibold text-white",
              saving ? "bg-slate-300" : "bg-sky-600 hover:bg-sky-700",
            ].join(" ")}
          >
            {saving ? "Тооцоолж байна..." : "Дүгнэлт гаргаад эхлэх"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-sm font-medium text-slate-800">{label}</div>
      {children}
    </div>
  );
}

function RadioPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex-1 rounded-full border px-3 py-2 text-sm transition",
        active
          ? "border-sky-600 bg-sky-50 text-sky-800"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
