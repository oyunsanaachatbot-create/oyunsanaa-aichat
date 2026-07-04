"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

type Meal = {
  id: string;
  name: string;
  calories: number;
  protein_g: number;
  good_carbs_g: number;
  bad_carbs_g: number;
  fat_g: number;
  fibre_g: number;
  sugar_g: number;
  nutrition_score: number;
};

type Totals = {
  calories: number;
  protein_g: number;
  good_carbs_g: number;
  bad_carbs_g: number;
  fat_g: number;
  fibre_g: number;
  sugar_g: number;
};

const DAILY_TARGETS = {
  calories: 2000,
  protein_g: 90,
  good_carbs_g: 230,
  bad_carbs_g: 40,
  fat_g: 65,
  fibre_g: 25,
  sugar_g: 30,
  burned_kcal: 500,
  water_ml: 2000,
  sleep_h: 8,
  rest_min: 60,
};

function calcTotals(meals: Meal[]): Totals {
  return meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein_g: acc.protein_g + m.protein_g,
      good_carbs_g: acc.good_carbs_g + m.good_carbs_g,
      bad_carbs_g: acc.bad_carbs_g + m.bad_carbs_g,
      fat_g: acc.fat_g + m.fat_g,
      fibre_g: acc.fibre_g + m.fibre_g,
      sugar_g: acc.sugar_g + m.sugar_g,
    }),
    {
      calories: 0,
      protein_g: 0,
      good_carbs_g: 0,
      bad_carbs_g: 0,
      fat_g: 0,
      fibre_g: 0,
      sugar_g: 0,
    }
  );
}

function percent(value: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(100, (value / target) * 100);
}

function format1(n: number) {
  return Number.isFinite(n) ? n.toFixed(1) : "0.0";
}

export default function ProgramPage() {
  const router = useRouter();

  // ==== ХООЛНЫ ХЭСЭГ ====
  const [foodName, setFoodName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [currentMeal, setCurrentMeal] = useState<Meal | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loadingMeal, setLoadingMeal] = useState(false);
  const [mealError, setMealError] = useState<string | null>(null);

  // ==== ХӨДӨЛГӨӨН / НОЙР / УС / АМРАЛТ ====
  const [burnedKcal, setBurnedKcal] = useState(0); // хөдөлгөөнөөр шатаасан ккал
  const [extraBurnedKcal, setExtraBurnedKcal] = useState(0); // гараар нэмэх
  const [waterMl, setWaterMl] = useState(0);
  const [sleepHours, setSleepHours] = useState(0);
  const [restMinutes, setRestMinutes] = useState(0);
  const [badHabitsScore, setBadHabitsScore] = useState(0); // 0 сайн, 100 маш муу

  // ---- Өдрийн нийлбэрүүд ----
  const totals = useMemo(() => calcTotals(meals), [meals]);

  const totalBurned = burnedKcal + extraBurnedKcal;

  // ==== ЗУРАГ ОРМАГЦ АВТО ЗАДЛАХ ====
  useEffect(() => {
    if (!imageFile && !foodName) {
      setCurrentMeal(null);
      setMealError(null);
      return;
    }
    if (!imageFile) {
      // зөвхөн нэрээр задлах боломжтой, гэхдээ зургагүй бол алгасъя.
      return;
    }

    let cancelled = false;

    const analyze = async () => {
      setLoadingMeal(true);
      setMealError(null);

      try {
        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("name", foodName || "");

        const res = await fetch("/api/health-demo/meal", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            data?.detail || data?.error || "AI-аас хариу авахад алдаа гарлаа."
          );
        }

        const data = await res.json();

        if (cancelled) return;

        const meal: Meal = {
          id: `${Date.now()}`,
          name: foodName || "Тодорхойгүй хоол",
          calories: data.calories ?? 0,
          protein_g: data.protein_g ?? 0,
          good_carbs_g: data.good_carbs_g ?? 0,
          bad_carbs_g: data.bad_carbs_g ?? 0,
          fat_g: data.fat_g ?? 0,
          fibre_g: data.fibre_g ?? 0,
          sugar_g: data.sugar_g ?? 0,
          nutrition_score: data.nutrition_score ?? 0,
        };

        setCurrentMeal(meal);
      } catch (err: any) {
        console.error(err);
        if (!cancelled) {
          setCurrentMeal(null);
          setMealError(err?.message || "Алдаа гарлаа.");
        }
      } finally {
        if (!cancelled) setLoadingMeal(false);
      }
    };

    analyze();

    return () => {
      cancelled = true;
    };
  }, [imageFile, foodName]);

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (
    e
  ) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
  };

  const handleAddMeal = () => {
    if (!currentMeal) return;
    setMeals((prev) => [...prev, currentMeal]);
    // дараагийн хоол оруулахын тулд нэрийг цэвэрлэж болно
    setFoodName("");
    setImageFile(null);
    setCurrentMeal(null);
    setMealError(null);
  };

  const handleResetDay = () => {
    setMeals([]);
    setCurrentMeal(null);
    setFoodName("");
    setImageFile(null);
    setMealError(null);
    setBurnedKcal(0);
    setExtraBurnedKcal(0);
    setWaterMl(0);
    setSleepHours(0);
    setRestMinutes(0);
    setBadHabitsScore(0);
  };

  // ==== ТУСЛАХ КОМПОНЕНТ – БАР ====
  const renderBar = (
    label: string,
    value: number,
    target: number,
    unit: string
  ) => {
    const p = percent(value, target);
    const over = value > target;
    const barColor = over ? "bg-red-400" : "bg-emerald-400";
    const textColor = over ? "text-red-600" : "text-slate-700";

    return (
      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-600 mb-1">
          <span>{label}</span>
          <span className={textColor}>
            {format1(value)} {unit} / {target} {unit}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all`}
            style={{ width: `${p}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <h1 className="text-2xl font-semibold mb-2">
        Өдөр тутмын хоол, хөдөлгөөн, нойрын хяналт
      </h1>
      <p className="text-sm text-slate-600 mb-6 max-w-2xl">
        Өнөдөөр идсэн хоол бүхнээ зураг эсвэл нэрээр нь оруулаад, Оюунсанаа
        автоматаар задлан тооцоолж өгнө. Та &quot;Хоол нэмэх&quot; дарж байж
        өдрийн дүн рүү нэмнэ. Хөдөлгөөн, ус, нойр, амралтаа мөн эндээс хянана.
      </p>

      <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)]">
        {/* ХООЛ БҮРТГЭХ ТАЛБАР */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            Хоол / уух зүйлийг шалгах ба бүртгэх
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Хоол / ундааны нэр
              </label>
              <input
                type="text"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Жишээ нь: Хуушуур 5 ш, 1 аяга кола..."
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Зураг (сонголтоор)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Зураг сонгомогц Оюунсанаа автоматаар задлан тооцоолно. Нэр
                бичсэн байвал хамтад нь ашиглана.
              </p>
            </div>

            {loadingMeal && (
              <div className="text-xs text-sky-600">
                Зурагнаас хоол задлаж байна, түр хүлээнэ үү…
              </div>
            )}

            {mealError && (
              <div className="text-xs text-red-600">
                {mealError || "AI-аас хариу авахад алдаа гарлаа."}
              </div>
            )}

            {/* ОДОО ЗАДЛАГДСАН ХООЛ */}
            {currentMeal && (
              <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold">
                    {currentMeal.name} –{" "}
                    <span className="text-emerald-700">
                      {format1(currentMeal.calories)} ккал
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Эрүүл мэндийн оноо:{" "}
                    <span className="font-semibold text-emerald-700">
                      {format1(currentMeal.nutrition_score)} / 100
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1">
                  <div>Уураг: {format1(currentMeal.protein_g)} гр</div>
                  <div>Сайн нүүрс ус: {format1(currentMeal.good_carbs_g)} гр</div>
                  <div>Муу нүүрс ус: {format1(currentMeal.bad_carbs_g)} гр</div>
                  <div>Өөх тос: {format1(currentMeal.fat_g)} гр</div>
                  <div>Эслэг: {format1(currentMeal.fibre_g)} гр</div>
                  <div>Сахар: {format1(currentMeal.sugar_g)} гр</div>
                </div>

                <button
                  type="button"
                  onClick={handleAddMeal}
                  className="mt-3 inline-flex items-center justify-center rounded-md bg-emerald-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
                >
                  Хоол нэмэх (өдрийн дүн рүү)
                </button>
              </div>
            )}

            {/* ӨНӨӨДРИЙН ХООЛНУУДЫН ЖАГСААЛТ */}
            <div className="pt-4 border-t border-slate-200 mt-4">
              <h3 className="text-sm font-semibold mb-2">Өнөөдрийн хоолнууд</h3>
              {meals.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Одоогоор хоол бүртгэгдээгүй байна. Эхлээд зураг оруулаад
                  &quot;Хоол нэмэх&quot; дарна уу.
                </p>
              ) : (
                <div className="space-y-1 text-xs">
                  {meals.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-md bg-slate-50 px-2 py-1"
                    >
                      <span className="truncate max-w-[60%]">{m.name}</span>
                      <span className="text-slate-600">
                        {format1(m.calories)} ккал ·{" "}
                        {format1(m.nutrition_score)}/100
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {meals.length > 0 && (
                <div className="mt-3 text-[11px] text-slate-500">
                  Нийт: {format1(totals.calories)} ккал, уураг{" "}
                  {format1(totals.protein_g)} гр, сайн нүүрс ус{" "}
                  {format1(totals.good_carbs_g)} гр, муу нүүрс ус{" "}
                  {format1(totals.bad_carbs_g)} гр, өөх тос{" "}
                  {format1(totals.fat_g)} гр, эслэг {format1(totals.fibre_g)} гр,
                  сахар {format1(totals.sugar_g)} гр.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleResetDay}
              className="mt-4 inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              Өдрийг шинээр эхлүүлэх
            </button>
          </div>
        </section>

        {/* ӨНӨӨДРИЙН ЗОРИЛТ vs БОДИТ БАЙДАЛ */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">
            Өнөөдрийн зорилт ба бодит байдал
          </h2>

          <div className="space-y-4">
            {/* ХООЛ */}
            <div>
              {renderBar(
                "Калори",
                totals.calories,
                DAILY_TARGETS.calories,
                "ккал"
              )}
              {renderBar(
                "Уураг",
                totals.protein_g,
                DAILY_TARGETS.protein_g,
                "гр"
              )}
              {renderBar(
                "Сайн нүүрс ус",
                totals.good_carbs_g,
                DAILY_TARGETS.good_carbs_g,
                "гр"
              )}
              {renderBar(
                "Муу нүүрс ус",
                totals.bad_carbs_g,
                DAILY_TARGETS.bad_carbs_g,
                "гр"
              )}
              {renderBar("Өөх тос", totals.fat_g, DAILY_TARGETS.fat_g, "гр")}
              {renderBar(
                "Эслэг",
                totals.fibre_g,
                DAILY_TARGETS.fibre_g,
                "гр"
              )}
              {renderBar(
                "Сахар",
                totals.sugar_g,
                DAILY_TARGETS.sugar_g,
                "гр"
              )}
            </div>

            {/* ХӨДӨЛГӨӨН ба амьдралын хэв маяг */}
            <div className="mt-4 border-t border-slate-200 pt-4">
              <h3 className="mb-2 text-sm font-semibold">Хөдөлгөөн, нойр</h3>

              {renderBar(
                "Хөдөлгөөнөөр шатаасан калори",
                totalBurned,
                DAILY_TARGETS.burned_kcal,
                "ккал"
              )}

              <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                <div>
                  <label className="mb-1 block text-[11px] text-slate-600">
                    Утас/цаагуур хэмжигчээр шатаасан (ккал)
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                    value={burnedKcal}
                    onChange={(e) =>
                      setBurnedKcal(Number(e.target.value) || 0)
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-600">
                    Гараар нэмэх (жишээ: дасгал, фитнес)
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                    value={extraBurnedKcal}
                    onChange={(e) =>
                      setExtraBurnedKcal(Number(e.target.value) || 0)
                    }
                  />
                </div>
              </div>

              {renderBar(
                "Ус",
                waterMl,
                DAILY_TARGETS.water_ml,
                "мл/өдөр"
              )}
              <div className="mb-3 text-xs">
                <input
                  type="number"
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                  placeholder="Өнөөдөр уусан ус (мл)"
                  value={waterMl}
                  onChange={(e) => setWaterMl(Number(e.target.value) || 0)}
                />
              </div>

              {renderBar(
                "Нойр",
                sleepHours,
                DAILY_TARGETS.sleep_h,
                "цаг/шөнө"
              )}
              <div className="mb-3 text-xs">
                <input
                  type="number"
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                  placeholder="Өнөөдөр унтсан цаг"
                  value={sleepHours}
                  onChange={(e) =>
                    setSleepHours(Number(e.target.value) || 0)
                  }
                />
              </div>

              {renderBar(
                "Амралт (тайван минут/өдөр)",
                restMinutes,
                DAILY_TARGETS.rest_min,
                "мин"
              )}
              <div className="mb-3 text-xs">
                <input
                  type="number"
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                  placeholder="Зүгээр сууж амарсан, бясалгал, алхалт г.м (минут)"
                  value={restMinutes}
                  onChange={(e) =>
                    setRestMinutes(Number(e.target.value) || 0)
                  }
                />
              </div>

              {/* Муу зуршил – 0 сайн, 100 маш муу */}
              <div className="mt-2">
                <label className="block text-[11px] text-slate-600 mb-1">
                  Муу зуршлын түвшин (0 – байхгүй, 100 – маш их)
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={badHabitsScore}
                  onChange={(e) =>
                    setBadHabitsScore(Number(e.target.value) || 0)
                  }
                  className="w-full"
                />
                <div className="text-[11px] text-slate-500 mt-1">
                  Одоогоор{" "}
                  <span className="font-medium text-slate-700">
                    {badHabitsScore}
                  </span>{" "}
                  / 100 – {badHabitsScore <= 20
                    ? "ойролцоогоор нөлөөгүй"
                    : badHabitsScore <= 60
                    ? "анхааралтай хянах шаардлагатай"
                    : "эрүүл мэндэд сөрөг нөлөө өгч болзошгүй"}
                  .
                </div>
              </div>
            </div>
          </div>

          {/* Өнөөдрийн дүнг дараагийн хуудас руу илгээх */}
          <div className="mt-6 border-t border-slate-200 pt-4">
            <p className="mb-2 text-[11px] text-slate-500">
              ➜ Дараагийн хуудас руу илгээхийн өмнө ус, нойр, амралтын
              талбаруудыг бөглөсөн байх хэрэгтэй.
            </p>
            <button
              type="button"
              className="w-full rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
              onClick={() => router.push("/mind/health-demo/summary")}
            >
              Өнөөдрийн дүнг 2-р хуудсанд илгээх
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
