"use client";

import { useMemo, useState } from "react";
import { useT } from "@/lib/i18n/provider";
import { normalWeightRangeKg, weightGoalDays, weightGoalKg } from "./calc";

// Хуучин form-ын type-ийг яг хэвээр нь авч үлдье (string-үүдээр ажилладаг)
type Gender = "male" | "female" | "";
type AttentionLevel = "high" | "medium" | "low" | "onlyWhenSick" | "";
type DietType = "meat" | "veg" | "vegan" | "other" | "mixed" | "unknown" | "";
type Frequency = "never" | "rare" | "sometimes" | "often" | "daily" | "";
type MealsPerDay = "1" | "2" | "3" | "4plus" | "";
type Walking = "none" | "low" | "medium" | "high" | "";
type Smoking = "no" | "rare" | "1-5" | "6-10" | "11-20" | "20plus" | "";
type RestTime = "30-60" | "60-120" | "120-180" | "none" | "";
type SleepHours = "4-6" | "6-8" | "8-10" | "10plus" | "less4" | "";
type SleepTime = "21-22" | "22-23" | "23-24" | "24-1" | "1plus" | "";

export type HealthForm = {
  startDate: string;
  gender: Gender;
  age: string;
  height: string; // cm
  weight: string; // kg
  waistCircumference: string; // cm
  attention: AttentionLevel;
  dietType: DietType;
  mealsPerDay: MealsPerDay;
  exercise: Frequency;
  walking: Walking;
  alcohol: Frequency;
  smoking: Smoking;
  restTime: RestTime;
  sleepHours: SleepHours;
  sleepTime: SleepTime;
};

type HealthResult = {
  summary: string;
  bmiText: string;
  waistText: string;
  normalWeightText: string;
  weightGoalText: string;
  lifestyleText: string;
  sleepText: string;
  habitsText: string;
};

const todayYmd = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function QuestionnaireForm(props: {
  onSaved?: () => void;
  initial?: Partial<HealthForm>;
}) {
  const t = useT();
  const h = t.apps.health;
  const initialDietType = props.initial?.dietType;
  const normalizedDietType: DietType =
    initialDietType === "mixed" || initialDietType === "unknown"
      ? "other"
      : initialDietType ?? "";
  const [form, setForm] = useState<HealthForm>({
    startDate: todayYmd(),
    gender: "",
    age: "",
    height: "",
    weight: "",
    waistCircumference: "",
    attention: "",
    mealsPerDay: "",
    exercise: "",
    walking: "",
    alcohol: "",
    smoking: "",
    restTime: "",
    sleepHours: "",
    sleepTime: "",
    ...props.initial,
    dietType: normalizedDietType,
  });

  const [result, setResult] = useState<HealthResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const handleChange = (field: keyof HealthForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value as any }));
    setResult(null);
    setOk(null);
    setErr(null);
  };

  const calcBMI = () => {
    const h = parseFloat((form.height || "").replace(",", "."));
    const w = parseFloat((form.weight || "").replace(",", "."));
    if (!h || !w) return null;
    const meters = h / 100;
    const bmi = w / (meters * meters);
    return bmi;
  };

  const computed = useMemo(() => {
    const bmi = calcBMI();

    let bmiText = h.bmiTextMissing;
    if (bmi !== null) {
      let level = "";
      if (bmi < 18.5) level = h.bmiLevel.under;
      else if (bmi < 25) level = h.bmiLevel.normal;
      else if (bmi < 30) level = h.bmiLevel.over;
      else level = h.bmiLevel.obese;

      bmiText = h.bmiResultText
        .replace("{bmi}", bmi.toFixed(1).replace(".", ","))
        .replace("{level}", level);
    }

    const waist = Number.parseFloat(
      (form.waistCircumference || "").replace(",", ".")
    );
    let waistText = h.waistMissing;
    if (Number.isFinite(waist) && waist > 0) {
      if (!form.gender) {
        waistText = h.waistNeedGender;
      } else {
        // IDF Asian population screening cutoffs: 90 cm for men, 80 cm for women.
        const cutoff = form.gender === "male" ? 90 : 80;
        const risk = waist >= cutoff ? h.waistElevated : h.waistNormal;
        waistText = h.waistResultText
          .replace("{waist}", waist.toFixed(1).replace(".0", ""))
          .replace("{risk}", risk);
      }
    }

    // Хөдөлгөөн, хоол, нойр, зуршлын “хуучин” логик
    const lifestyleParts: string[] = [];

    // Хөдөлгөөн
    if (form.exercise === "daily" || form.walking === "high") {
      lifestyleParts.push(h.lifestyleGood);
    } else if (form.exercise === "never" || form.walking === "none") {
      lifestyleParts.push(h.lifestyleLow);
    } else {
      lifestyleParts.push(h.lifestyleMid);
    }

    // Хооллолт
    if (form.mealsPerDay === "3") {
      lifestyleParts.push(h.mealsGood);
    } else if (form.mealsPerDay === "1" || form.mealsPerDay === "2") {
      lifestyleParts.push(h.mealsLow);
    } else if (form.mealsPerDay === "4plus") {
      lifestyleParts.push(h.mealsHigh);
    }

    const lifestyleText = lifestyleParts.join(" ");

    // Нойр
    let sleepText = "";
    if (form.sleepHours === "6-8" && (form.sleepTime === "21-22" || form.sleepTime === "22-23")) {
      sleepText = h.sleepGood;
    } else if (form.sleepHours === "4-6" || form.sleepTime === "23-24" || form.sleepTime === "24-1") {
      sleepText = h.sleepLow;
    } else if (form.sleepHours === "less4" || form.sleepTime === "1plus") {
      sleepText = h.sleepBad;
    } else {
      sleepText = h.sleepMid;
    }

    // Зуршлууд
    const badHabits: string[] = [];
    if (form.alcohol === "often" || form.alcohol === "daily") badHabits.push(h.habitAlcohol);
    if (["1-5", "6-10", "11-20", "20plus"].includes(form.smoking)) badHabits.push(h.habitSmoking);

    let habitsText = "";
    if (badHabits.length === 0) {
      habitsText = h.habitsNone;
    } else {
      habitsText = h.habitsSomePrefix + badHabits.join(", ") + h.habitsSomeSuffix;
    }

    const summary = h.summaryText;

    const height = Number.parseFloat((form.height || "").replace(",", "."));
    const weight = Number.parseFloat((form.weight || "").replace(",", "."));
    const normalRange = normalWeightRangeKg(height);
    const goalKg = weightGoalKg(height, weight);
    const normalWeightText = normalRange
      ? h.normalWeightText
          .replace("{min}", String(normalRange.min))
          .replace("{max}", String(normalRange.max))
      : h.weightGoalMissing;
    let weightGoalText = h.weightGoalMissing;
    if (goalKg === 0) {
      weightGoalText = h.weightGoalKeepText;
    } else if (goalKg !== null) {
      const goalKey = weight > (normalRange?.max ?? weight) ? "weightGoalLoseText" : "weightGoalGainText";
      weightGoalText = h[goalKey]
        .replace("{kg}", String(goalKg))
        .replace("{days}", String(weightGoalDays(goalKg)));
    }

    return {
      bmi,
      bmiText,
      waistText,
      normalWeightText,
      weightGoalText,
      lifestyleText,
      sleepText,
      habitsText,
      summary,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, h]);

  const makeResult = () => {
    setResult({
      summary: computed.summary,
      bmiText: computed.bmiText,
      waistText: computed.waistText,
      normalWeightText: computed.normalWeightText,
      weightGoalText: computed.weightGoalText,
      lifestyleText: computed.lifestyleText,
      sleepText: computed.sleepText,
      habitsText: computed.habitsText,
    });
  };

  async function saveToSupabase() {
    setSaving(true);
    setErr(null);
    setOk(null);

    try {
      // profile API чинь payload jsonb авдаг
      const payload = {
        // Хуучин form-оо 그대로 хадгална (дараа нь сайжруулахад хэрэгтэй)
        legacy: form,

        // Дараа dashboard/тооцоонд хэрэглэхээр тоон утгуудыг давхар гаргая
        gender: form.gender,
        age: form.age ? Number(form.age) : null,
        heightCm: form.height ? Number(form.height) : null,
        weightKg: form.weight ? Number(form.weight) : null,
        waistCircumferenceCm: form.waistCircumference
          ? Number(form.waistCircumference)
          : null,
        walkingLevel: form.walking,
        exerciseFreq:
          form.exercise === "daily"
            ? "daily"
            : form.exercise === "often"
            ? "weekly2_3"
            : form.exercise === "sometimes"
            ? "weekly1"
            : "none",
      };

      const res = await fetch("/api/health/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || h.errorGeneric);

      setOk(h.saved);
      props.onSaved?.();
    } catch (e: any) {
      setErr(e?.message || h.errorGeneric);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto min-w-0 max-w-3xl space-y-4 overflow-hidden rounded-[18px] border border-slate-200 bg-white p-4 text-slate-900 sm:p-5">
      <h2 className="font-bold text-base tracking-tight text-slate-900">
        {h.formTitle}
      </h2>
      <p className="break-words text-slate-500 text-sm leading-relaxed">
        {h.formIntro}
      </p>

      {err && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{err}</div>}
      {ok && <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{ok}</div>}

      {/* 1) үндсэн мэдээлэл */}
      <section className="space-y-3">
        <div className="font-bold text-base tracking-tight text-slate-900">
          {h.section1Title}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="health-start-date">
              {h.startDate}
            </label>
            <input
              id="health-start-date"
              type="date"
              value={form.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
              className="w-full min-w-0 max-w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium">{h.gender}</div>
            <div className="flex flex-col gap-1 text-sm">
              <label className="inline-flex items-center gap-2">
                <input type="radio" checked={form.gender === "male"} onChange={() => handleChange("gender", "male")} />
                <span>{h.genderMale}</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="radio" checked={form.gender === "female"} onChange={() => handleChange("gender", "female")} />
                <span>{h.genderFemale}</span>
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={h.age} value={form.age} onChange={(v) => handleChange("age", v)} placeholder={h.agePlaceholder} />
          <Field label={h.heightCm} value={form.height} onChange={(v) => handleChange("height", v)} placeholder={h.heightPlaceholder} />
          <Field label={h.weightKg} value={form.weight} onChange={(v) => handleChange("weight", v)} placeholder={h.weightPlaceholder} />
          <Field
            label={h.waistCircumference}
            value={form.waistCircumference}
            onChange={(v) => handleChange("waistCircumference", v)}
            placeholder={h.waistPlaceholder}
          />
        </div>
      </section>

      {/* 2) анхаарал */}
      <section className="space-y-2">
        <div className="font-bold text-base tracking-tight text-slate-900">
          {h.section2Title}
        </div>
        <div className="flex flex-col gap-1 text-sm">
          {[
            { id: "high", label: h.attention.high },
            { id: "medium", label: h.attention.medium },
            { id: "low", label: h.attention.low },
            { id: "onlyWhenSick", label: h.attention.onlyWhenSick },
          ].map((opt) => (
            <label key={opt.id} className="inline-flex items-center gap-2">
              <input type="radio" checked={form.attention === opt.id} onChange={() => handleChange("attention", opt.id)} />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* 3) хооллолт */}
      <section className="space-y-2">
        <div className="font-bold text-base tracking-tight text-slate-900">
          {h.section3Title}
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium">{h.dietTypeLabel}</div>
          <div className="flex flex-col gap-1 text-sm">
            {[
              { id: "meat", label: h.dietType.meat },
              { id: "veg", label: h.dietType.veg },
              { id: "vegan", label: h.dietType.vegan },
              { id: "other", label: h.dietType.other },
            ].map((opt) => (
              <label key={opt.id} className="inline-flex items-center gap-2">
                <input type="radio" checked={form.dietType === opt.id} onChange={() => handleChange("dietType", opt.id)} />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium">{h.mealsPerDayLabel}</div>
          <div className="flex flex-col gap-1 text-sm">
            {[
              { id: "1", label: h.mealsPerDay["1"] },
              { id: "2", label: h.mealsPerDay["2"] },
              { id: "3", label: h.mealsPerDay["3"] },
              { id: "4plus", label: h.mealsPerDay["4plus"] },
            ].map((opt) => (
              <label key={opt.id} className="inline-flex items-center gap-2">
                <input type="radio" checked={form.mealsPerDay === opt.id} onChange={() => handleChange("mealsPerDay", opt.id)} />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* 4) хөдөлгөөн */}
      <section className="space-y-2">
        <div className="font-bold text-base tracking-tight text-slate-900">
          {h.section4Title}
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium">{h.exerciseLabel}</div>
          <div className="flex flex-col gap-1 text-sm">
            {[
              { id: "daily", label: h.exercise.daily },
              { id: "often", label: h.exercise.often },
              { id: "sometimes", label: h.exercise.sometimes },
              { id: "rare", label: h.exercise.rare },
              { id: "never", label: h.exercise.never },
            ].map((opt) => (
              <label key={opt.id} className="inline-flex items-center gap-2">
                <input type="radio" checked={form.exercise === opt.id} onChange={() => handleChange("exercise", opt.id)} />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium">{h.walkingLabel}</div>
          <div className="flex flex-col gap-1 text-sm">
            {[
              { id: "none", label: h.walking.none },
              { id: "low", label: h.walking.low },
              { id: "medium", label: h.walking.medium },
              { id: "high", label: h.walking.high },
            ].map((opt) => (
              <label key={opt.id} className="inline-flex items-center gap-2">
                <input type="radio" checked={form.walking === opt.id} onChange={() => handleChange("walking", opt.id)} />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* 5) нойр/зуршил */}
      <section className="space-y-2">
        <div className="font-bold text-base tracking-tight text-slate-900">
          {h.section5Title}
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium">{h.sleepHoursLabel}</div>
          <select className="w-full min-w-0 rounded-[14px] border border-slate-200 px-3.5 py-2.5 text-slate-900 text-sm outline-none transition focus:border-[#1F6FB2] focus:ring-2 focus:ring-[#1F6FB2]/15" value={form.sleepHours} onChange={(e) => handleChange("sleepHours", e.target.value)}>
            <option value="">{h.selectOption}</option>
            <option value="less4">{h.sleepHoursOptions.less4}</option>
            <option value="4-6">{h.sleepHoursOptions["4-6"]}</option>
            <option value="6-8">{h.sleepHoursOptions["6-8"]}</option>
            <option value="8-10">{h.sleepHoursOptions["8-10"]}</option>
            <option value="10plus">{h.sleepHoursOptions["10plus"]}</option>
          </select>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium">{h.sleepTimeLabel}</div>
          <select className="w-full min-w-0 rounded-[14px] border border-slate-200 px-3.5 py-2.5 text-slate-900 text-sm outline-none transition focus:border-[#1F6FB2] focus:ring-2 focus:ring-[#1F6FB2]/15" value={form.sleepTime} onChange={(e) => handleChange("sleepTime", e.target.value)}>
            <option value="">{h.selectOption}</option>
            <option value="21-22">{h.sleepTimeOptions["21-22"]}</option>
            <option value="22-23">{h.sleepTimeOptions["22-23"]}</option>
            <option value="23-24">{h.sleepTimeOptions["23-24"]}</option>
            <option value="24-1">{h.sleepTimeOptions["24-1"]}</option>
            <option value="1plus">{h.sleepTimeOptions["1plus"]}</option>
          </select>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium">{h.alcoholLabel}</div>
          <select className="w-full min-w-0 rounded-[14px] border border-slate-200 px-3.5 py-2.5 text-slate-900 text-sm outline-none transition focus:border-[#1F6FB2] focus:ring-2 focus:ring-[#1F6FB2]/15" value={form.alcohol} onChange={(e) => handleChange("alcohol", e.target.value)}>
            <option value="">{h.selectOption}</option>
            <option value="never">{h.alcoholOptions.never}</option>
            <option value="rare">{h.alcoholOptions.rare}</option>
            <option value="sometimes">{h.alcoholOptions.sometimes}</option>
            <option value="often">{h.alcoholOptions.often}</option>
            <option value="daily">{h.alcoholOptions.daily}</option>
          </select>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium">{h.smokingLabel}</div>
          <select className="w-full min-w-0 rounded-[14px] border border-slate-200 px-3.5 py-2.5 text-slate-900 text-sm outline-none transition focus:border-[#1F6FB2] focus:ring-2 focus:ring-[#1F6FB2]/15" value={form.smoking} onChange={(e) => handleChange("smoking", e.target.value)}>
            <option value="">{h.selectOption}</option>
            <option value="no">{h.smokingOptions.no}</option>
            <option value="rare">{h.smokingOptions.rare}</option>
            <option value="1-5">{h.smokingOptions["1-5"]}</option>
            <option value="6-10">{h.smokingOptions["6-10"]}</option>
            <option value="11-20">{h.smokingOptions["11-20"]}</option>
            <option value="20plus">{h.smokingOptions["20plus"]}</option>
          </select>
        </div>
      </section>

      {result && (
        <div className="mt-2 space-y-3 border-t border-slate-200 pt-3">
          <h3 className="font-bold text-base tracking-tight text-slate-900">
            {h.resultTitle}
          </h3>
          <p className="text-sm text-slate-700">{result.summary}</p>

          <div className="space-y-1 text-sm">
            <div className="font-medium">{h.resultWeight}</div>
            <p>{result.bmiText}</p>
            <p>{result.waistText}</p>
            <p className="text-slate-500 text-xs leading-relaxed">
              {h.waistScreeningNote}
            </p>
            <p>{result.normalWeightText}</p>
            <p>{result.weightGoalText}</p>
          </div>

          <div className="space-y-1 text-sm">
            <div className="font-medium">{h.resultLifestyle}</div>
            <p>{result.lifestyleText}</p>
          </div>

          <div className="space-y-1 text-sm">
            <div className="font-medium">{h.resultSleep}</div>
            <p>{result.sleepText}</p>
          </div>

          <div className="space-y-1 text-sm">
            <div className="font-medium">{h.resultHabits}</div>
            <p>{result.habitsText}</p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!result ? (
        <button
          type="button"
          onClick={makeResult}
          className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          {h.makeResult}
        </button>
      ) : (
        <button
          type="button"
          onClick={saveToSupabase}
          disabled={saving}
          className="inline-flex w-full items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {saving ? h.saving : h.startProgram}
        </button>
      )}
    </div>
  );
}

function Field(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{props.label}</label>
      <input
        type="number"
        className="w-full min-w-0 rounded-[14px] border border-slate-200 px-3.5 py-2.5 text-slate-900 text-sm outline-none transition focus:border-[#1F6FB2] focus:ring-2 focus:ring-[#1F6FB2]/15"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
      />
    </div>
  );
}
