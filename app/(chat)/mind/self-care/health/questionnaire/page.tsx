"use client";

import { useState } from "react";
import {
  APP_SHELL_TOKENS,
  AppCard,
  AppShell,
  Badge,
  Button,
  PageHero,
} from "@/components/mind/app-shell";
import {
  type HealthProgramInput,
  type Sex,
  computeHealthTargets,
  saveHealthProgram,
} from "@/lib/mind/health-program";

const { INK, MUTED, LINE, BRAND, BRAND_RGB } = APP_SHELL_TOKENS;

// Map sleep-range strings to midpoint hours
const SLEEP_MAP: Record<string, number> = {
  "<4": 3.5,
  "4-6": 5,
  "6-8": 7,
  "8-10": 9,
  "10+": 10.5,
};

// Map exercise-level strings to sessions per week
const EXERCISE_MAP: Record<string, number> = {
  daily: 6,
  "3-4": 3.5,
  "1-2": 1.5,
  rare: 0.5,
  never: 0,
};

type WalkLevel = HealthProgramInput["walkLevel"];

const WALK_OPTIONS: { id: WalkLevel; label: string }[] = [
  { id: "none", label: "Бараг алхдаггүй" },
  { id: "low", label: "Бага зэрэг" },
  { id: "medium", label: "Дунд зэрэг" },
  { id: "high", label: "Сайн алхдаг" },
];

const HABITS = [
  { id: "screen", label: "Утас/дэлгэц хэтрүүлдэг" },
  { id: "lazy", label: "Залхуурал" },
  { id: "overeating", label: "Хэтрүүлж иддэг" },
  { id: "workaholic", label: "Хэт их ажилладаг" },
  { id: "badSleep", label: "Нойр муутай" },
  { id: "soda", label: "Хийжүүлсэн ундаа уудаг" },
  { id: "sweets", label: "Амттан хэтрүүлдэг" },
];

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[#1F6FB2] focus:ring-2 focus:ring-[#1F6FB2]/15";

function SectionTitle({ children }: { children: string }) {
  return (
    <div className="font-semibold text-sm" style={{ color: INK }}>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: string }) {
  return (
    <div className="mb-1.5 text-sm font-medium" style={{ color: INK }}>
      {children}
    </div>
  );
}

export default function HealthQuestionnairePage() {
  const today = new Date().toISOString().slice(0, 10);

  const [sex, setSex] = useState<Sex>("female");
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [mealsPerDay, setMealsPerDay] = useState("");
  const [exerciseLevel, setExerciseLevel] = useState("");
  const [walkLevel, setWalkLevel] = useState<WalkLevel>("low");
  const [habits, setHabits] = useState<string[]>([]);
  const [alcohol, setAlcohol] = useState("");
  const [smoking, setSmoking] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [waterLiters, setWaterLiters] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleHabit = (id: string) =>
    setHabits((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]
    );

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const ageN = Number(age);
    const heightN = Number(heightCm);
    const weightN = Number(weightKg);

    if (!ageN || !heightN || !weightN) {
      setError("Нас, өндөр, жинг заавал оруулна уу.");
      return;
    }

    const allHabits = [...habits];
    if (alcohol && alcohol !== "none") { allHabits.push("alcohol"); }
    if (smoking && smoking !== "none") { allHabits.push("smoking"); }

    const input: HealthProgramInput = {
      sex,
      age: ageN,
      heightCm: heightN,
      weightKg: weightN,
      mealsPerDay: Number(mealsPerDay) || 3,
      exercisePerWeek: EXERCISE_MAP[exerciseLevel] ?? 0,
      walkLevel,
      sleepHours: SLEEP_MAP[sleepHours] ?? 7,
      waterLiters: Number(waterLiters) || 1.5,
      habits: allHabits,
      startDate: today,
    };

    saveHealthProgram({ input, targets: computeHealthTargets(input) });
    setDone(true);
  };

  if (done) {
    return (
      <AppShell backHref="/mind/self-care/stress" title="Тооцоологдлоо" width="2xl">
        <AppCard>
          <PageHero
            description="Оруулсан мэдээлэл дээр үндэслэн таны биеийн байдал, зорилтот калори болон усны хэмжээг тооцоолж хадгалав."
            eyebrow={<Badge>Хөтөлбөр бэлэн</Badge>}
            icon="✅"
            title="Таны хувийн хөтөлбөр тооцоологдлоо"
          />
          <Button className="w-full" href="/mind/self-care/health/summary">
            Дүгнэлт үзэх →
          </Button>
        </AppCard>
      </AppShell>
    );
  }

  const cardCls = "rounded-2xl border border-slate-200 bg-white p-5 space-y-4";

  const optStyle = (active: boolean) => ({
    borderColor: active ? BRAND : LINE,
    background: active ? `rgba(${BRAND_RGB},0.06)` : "#fff",
    color: INK,
  });

  return (
    <AppShell
      backHref="/mind/self-care/stress"
      subtitle="Өөрийгөө танин мэдэх"
      title="Эрүүл мэндийн асуулга"
      width="2xl"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{
              background: "rgba(220,38,38,0.08)",
              border: "1px solid rgba(220,38,38,0.20)",
              color: "#B91C1C",
            }}
          >
            {error}
          </div>
        )}

        {/* Үндсэн мэдээлэл */}
        <AppCard className={cardCls}>
          <SectionTitle>Үндсэн мэдээлэл</SectionTitle>

          <div>
            <FieldLabel>Хүйс</FieldLabel>
            <div className="flex flex-col gap-2">
              {(
                [
                  { id: "female" as Sex, label: "Эм" },
                  { id: "male" as Sex, label: "Эр" },
                ] as const
              ).map(({ id, label }) => (
                <label
                  className="flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm transition-colors"
                  key={id}
                  style={optStyle(sex === id)}
                >
                  <input
                    checked={sex === id}
                    className="shrink-0 accent-[#1F6FB2]"
                    name="sex"
                    onChange={() => setSex(id)}
                    type="radio"
                    value={id}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                { label: "Нас", value: age, set: setAge, placeholder: "жил" },
                { label: "Өндөр (см)", value: heightCm, set: setHeightCm, placeholder: "165" },
                { label: "Жин (кг)", value: weightKg, set: setWeightKg, placeholder: "70" },
              ] as const
            ).map(({ label, value, set, placeholder }) => (
              <div key={label}>
                <FieldLabel>{label}</FieldLabel>
                <input
                  className={inputCls}
                  onChange={(e) => set(e.target.value)}
                  placeholder={placeholder}
                  style={{ color: INK }}
                  type="number"
                  value={value}
                />
              </div>
            ))}
          </div>
        </AppCard>

        {/* Хооллолт ба хөдөлгөөн */}
        <AppCard className={cardCls}>
          <SectionTitle>Хооллолт ба хөдөлгөөн</SectionTitle>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Өдөрт хэдэн удаа хооллодог?</FieldLabel>
              <select
                className={inputCls}
                onChange={(e) => setMealsPerDay(e.target.value)}
                style={{ color: INK }}
                value={mealsPerDay}
              >
                <option value="">Сонгоно уу</option>
                <option value="1">1 удаа</option>
                <option value="2">2 удаа</option>
                <option value="3">3 удаа</option>
                <option value="4">4+ удаа</option>
              </select>
            </div>

            <div>
              <FieldLabel>Дасгал хийдэг үү?</FieldLabel>
              <select
                className={inputCls}
                onChange={(e) => setExerciseLevel(e.target.value)}
                style={{ color: INK }}
                value={exerciseLevel}
              >
                <option value="">Сонгоно уу</option>
                <option value="daily">Өдөр бүр</option>
                <option value="3-4">7 хоногт 3–4 удаа</option>
                <option value="1-2">7 хоногт 1–2 удаа</option>
                <option value="rare">Ховор</option>
                <option value="never">Огт хийдэггүй</option>
              </select>
            </div>
          </div>

          <div>
            <FieldLabel>Өдөрт дундажаар хэр их алхдаг?</FieldLabel>
            <div className="grid gap-2 sm:grid-cols-2">
              {WALK_OPTIONS.map(({ id, label }) => (
                <label
                  className="flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm transition-colors"
                  key={id}
                  style={optStyle(walkLevel === id)}
                >
                  <input
                    checked={walkLevel === id}
                    className="shrink-0 accent-[#1F6FB2]"
                    name="walkLevel"
                    onChange={() => setWalkLevel(id)}
                    type="radio"
                    value={id}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </AppCard>

        {/* Нойр ба ус */}
        <AppCard className={cardCls}>
          <SectionTitle>Нойр ба ус</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Шөнөдөө хэдэн цаг унтдаг?</FieldLabel>
              <select
                className={inputCls}
                onChange={(e) => setSleepHours(e.target.value)}
                style={{ color: INK }}
                value={sleepHours}
              >
                <option value="">Сонгоно уу</option>
                <option value="<4">4-с бага</option>
                <option value="4-6">4–6 цаг</option>
                <option value="6-8">6–8 цаг</option>
                <option value="8-10">8–10 цаг</option>
                <option value="10+">10+ цаг</option>
              </select>
            </div>
            <div>
              <FieldLabel>Өдөрт уудаг ус (литр)</FieldLabel>
              <input
                className={inputCls}
                onChange={(e) => setWaterLiters(e.target.value)}
                placeholder="жишээ: 1.5"
                step="0.1"
                style={{ color: INK }}
                type="number"
                value={waterLiters}
              />
            </div>
          </div>
        </AppCard>

        {/* Зуршил */}
        <AppCard className={cardCls}>
          <SectionTitle>Зуршил</SectionTitle>

          <div>
            <FieldLabel>Өөрт байгаа зуршлуудаа сонгоно уу</FieldLabel>
            <div className="grid gap-2 sm:grid-cols-2">
              {HABITS.map(({ id, label }) => (
                <label
                  className="flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm transition-colors"
                  key={id}
                  style={optStyle(habits.includes(id))}
                >
                  <input
                    checked={habits.includes(id)}
                    className="shrink-0 accent-[#1F6FB2]"
                    onChange={() => toggleHabit(id)}
                    type="checkbox"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Согтууруулах ундаа</FieldLabel>
              <select
                className={inputCls}
                onChange={(e) => setAlcohol(e.target.value)}
                style={{ color: INK }}
                value={alcohol}
              >
                <option value="">Сонгоно уу</option>
                <option value="none">Огт хэрэглэдэггүй</option>
                <option value="month">Сард 1–2 удаа</option>
                <option value="week1">7 хоногт 1 удаа</option>
                <option value="week2-3">7 хоногт 2–3 удаа</option>
                <option value="daily">Бараг өдөр бүр</option>
              </select>
            </div>
            <div>
              <FieldLabel>Тамхи</FieldLabel>
              <select
                className={inputCls}
                onChange={(e) => setSmoking(e.target.value)}
                style={{ color: INK }}
                value={smoking}
              >
                <option value="">Сонгоно уу</option>
                <option value="none">Огт татдаггүй</option>
                <option value="rare">Хааяа нэг</option>
                <option value="1-5">Өдөрт 1–5 ширхэг</option>
                <option value="6-10">Өдөрт 6–10 ширхэг</option>
                <option value="11+">Өдөрт 11+</option>
              </select>
            </div>
          </div>
        </AppCard>

        <Button className="w-full" type="submit">
          Тооцоолох →
        </Button>
      </form>
    </AppShell>
  );
}
