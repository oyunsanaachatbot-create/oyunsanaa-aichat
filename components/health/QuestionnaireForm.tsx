"use client";

import { useMemo, useState } from "react";
import { useT } from "@/lib/i18n/provider";

// Хуучин form-ын type-ийг яг хэвээр нь авч үлдье (string-үүдээр ажилладаг)
type Gender = "male" | "female" | "";
type AttentionLevel = "high" | "medium" | "low" | "onlyWhenSick" | "";
type DietType = "mixed" | "meat" | "veg" | "vegan" | "unknown" | "";
type Frequency = "never" | "rare" | "sometimes" | "often" | "daily" | "";
type MealsPerDay = "1" | "2" | "3" | "4plus" | "";
type Walking = "none" | "low" | "medium" | "high" | "";
type Smoking = "no" | "rare" | "1-5" | "6-10" | "11-20" | "20plus" | "";
type RestTime = "30-60" | "60-120" | "120-180" | "none" | "";
type SleepHours = "4-6" | "6-8" | "8-10" | "10plus" | "less4" | "";
type SleepTime = "21-22" | "22-23" | "23-24" | "24-1" | "1plus" | "";

type HealthForm = {
  startDate: string;
  gender: Gender;
  age: string;
  height: string; // cm
  weight: string; // kg
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
  lifestyleText: string;
  sleepText: string;
  habitsText: string;
};

const todayYmd = () => new Date().toISOString().slice(0, 10);

export default function QuestionnaireForm(props: { onSaved?: () => void }) {
  const t = useT();
  const h = t.apps.health;
  const [form, setForm] = useState<HealthForm>({
    startDate: todayYmd(),
    gender: "",
    age: "",
    height: "",
    weight: "",
    attention: "",
    dietType: "",
    mealsPerDay: "",
    exercise: "",
    walking: "",
    alcohol: "",
    smoking: "",
    restTime: "",
    sleepHours: "",
    sleepTime: "",
  });

  const [result, setResult] = useState<HealthResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const handleChange = (field: keyof HealthForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value as any }));
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
    if (form.dietType === "mixed" && form.mealsPerDay === "3") {
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

    return { bmi, bmiText, lifestyleText, sleepText, habitsText, summary };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, h]);

  const makeResult = () => {
    setResult({
      summary: computed.summary,
      bmiText: computed.bmiText,
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
    <div className="bg-white text-slate-900 rounded-2xl p-5 shadow max-w-3xl mx-auto space-y-4">
      <h2 className="text-xl font-semibold">{h.formTitle}</h2>
      <p className="text-sm text-slate-600">{h.formIntro}</p>

      {err && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{err}</div>}
      {ok && <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{ok}</div>}

      {/* 1) үндсэн мэдээлэл */}
      <section className="space-y-3">
        <div className="text-sm font-semibold text-slate-800">{h.section1Title}</div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">{h.startDate}</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label={h.age} value={form.age} onChange={(v) => handleChange("age", v)} placeholder={h.agePlaceholder} />
          <Field label={h.heightCm} value={form.height} onChange={(v) => handleChange("height", v)} placeholder={h.heightPlaceholder} />
          <Field label={h.weightKg} value={form.weight} onChange={(v) => handleChange("weight", v)} placeholder={h.weightPlaceholder} />
        </div>
      </section>

      {/* 2) анхаарал */}
      <section className="space-y-2">
        <div className="text-sm font-semibold text-slate-800">{h.section2Title}</div>
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
        <div className="text-sm font-semibold text-slate-800">{h.section3Title}</div>

        <div className="space-y-1">
          <div className="text-sm font-medium">{h.dietTypeLabel}</div>
          <div className="flex flex-col gap-1 text-sm">
            {[
              { id: "mixed", label: h.dietType.mixed },
              { id: "meat", label: h.dietType.meat },
              { id: "veg", label: h.dietType.veg },
              { id: "vegan", label: h.dietType.vegan },
              { id: "unknown", label: h.dietType.unknown },
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
        <div className="text-sm font-semibold text-slate-800">{h.section4Title}</div>

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
        <div className="text-sm font-semibold text-slate-800">{h.section5Title}</div>

        <div className="space-y-1">
          <div className="text-sm font-medium">{h.sleepHoursLabel}</div>
          <select className="w-full rounded-lg border px-3 py-2 text-sm" value={form.sleepHours} onChange={(e) => handleChange("sleepHours", e.target.value)}>
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
          <select className="w-full rounded-lg border px-3 py-2 text-sm" value={form.sleepTime} onChange={(e) => handleChange("sleepTime", e.target.value)}>
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
          <select className="w-full rounded-lg border px-3 py-2 text-sm" value={form.alcohol} onChange={(e) => handleChange("alcohol", e.target.value)}>
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
          <select className="w-full rounded-lg border px-3 py-2 text-sm" value={form.smoking} onChange={(e) => handleChange("smoking", e.target.value)}>
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

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={makeResult}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          {h.makeResult}
        </button>

        <button
          type="button"
          onClick={async () => {
            // Дүнгүй хадгалуулахгүй гэж хүсвэл эхлээд makeResult хийгээд хадгална
            if (!result) makeResult();
            await saveToSupabase();
          }}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {saving ? h.saving : h.save}
        </button>
      </div>

      {result && (
        <div className="mt-2 space-y-3 border-t border-slate-200 pt-3">
          <h3 className="text-sm font-semibold">{h.resultTitle}</h3>
          <p className="text-sm text-slate-700">{result.summary}</p>

          <div className="space-y-1 text-sm">
            <div className="font-medium">{h.resultWeight}</div>
            <p>{result.bmiText}</p>
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
    </div>
  );
}

function Field(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{props.label}</label>
      <input
        type="number"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
      />
    </div>
  );
}
