"use client";

import { useRouter } from "next/navigation";

type Sex = "male" | "female";

interface ProgramInput {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  sleepHours: number;
  waterLiters: number;
  exercisePerWeek: number;
  junkScore: number;
}

interface ProgramResult {
  bmi: number;
  normalMin: number;
  normalMax: number;
  excessKg: number;
  daysToGoal: number;
  dailyCalories: number;
  proteinPercent: number;
  fatPercent: number;
  carbPercent: number;
  sleepRecommended: number;
  waterRecommended: number;
  stepsRecommended: number;
}

function calculateProgram(input: ProgramInput): ProgramResult {
  const heightM = input.heightCm / 100;

  const bmi = input.weightKg / (heightM * heightM);
  const normalMin = 18.5 * heightM * heightM;
  const normalMax = 24.9 * heightM * heightM;

  let excessKg = 0;
  if (input.weightKg > normalMax) {
    excessKg = input.weightKg - normalMax;
  } else if (input.weightKg < normalMin) {
    excessKg = input.weightKg - normalMin; // хэт турсан байж болно
  }

  // Жишээ томъёо: 1 кг = 4.6 өдөр орчим → 17 кг ≈ 78.2 ≈ 79 хоног
  const daysToGoal = Math.max(30, Math.round(Math.abs(excessKg) * 4.6));

  // Маш ойролцоогоор Mifflin-St Jeor
  const base =
    input.sex === "female"
      ? 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age - 161
      : 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age + 5;

  let activityFactor = 1.2;
  if (input.exercisePerWeek >= 5) activityFactor = 1.55;
  else if (input.exercisePerWeek >= 3) activityFactor = 1.4;
  else if (input.exercisePerWeek >= 1) activityFactor = 1.3;

  const dailyCalories = Math.round(base * activityFactor * 0.85); // аюулгүй бага зөрүүтэй

  // Макро харьцаа (жишээ): уураг 25%, өөх 25%, нүүрс ус 50%
  const proteinPercent = 25;
  const fatPercent = 25;
  const carbPercent = 50;

  // Ерөнхий зөвлөмжүүд
  const sleepRecommended = 7.5;
  const waterRecommended = Math.max(1.5, Math.min(3.5, input.weightKg * 0.03));
  const stepsRecommended = 8000;

  return {
    bmi: parseFloat(bmi.toFixed(1)),
    normalMin: parseFloat(normalMin.toFixed(1)),
    normalMax: parseFloat(normalMax.toFixed(1)),
    excessKg: parseFloat(excessKg.toFixed(1)),
    daysToGoal,
    dailyCalories,
    proteinPercent,
    fatPercent,
    carbPercent,
    sleepRecommended,
    waterRecommended: parseFloat(waterRecommended.toFixed(1)),
    stepsRecommended,
  };
}

export default function HealthSummaryPage() {
  const router = useRouter();

  // Одоохондоо жишээ өгөгдөл – дараа нь асуумжтайгаа холбоно
  const exampleInput: ProgramInput = {
    sex: "female",
    age: 32,
    heightCm: 165,
    weightKg: 82,
    sleepHours: 6,
    waterLiters: 1.2,
    exercisePerWeek: 1,
    junkScore: 6,
  };

  const program = calculateProgram(exampleInput);

  const isOverweight = program.excessKg > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-emerald-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Гарчиг + товчхон тайлбар */}
        <div className="rounded-2xl bg-white/70 p-6 shadow-sm backdrop-blur">
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2">
            Эрүүл мэндийн хөтөлбөрийн дүгнэлт
          </h1>
          <p className="text-slate-600 text-sm md:text-base">
            Та бөглөсөн асуумжийн үндсэн дээр Оюунсанаа таны биеийн байдалд
            тохирсон ерөнхий хөтөлбөрийг санал болголоо. Энэ нь{" "}
            <span className="font-medium">хоол, хөдөлгөөн, нойр, амралт</span> ба{" "}
            <span className="font-medium">муу зуршил</span>-ын тэнцвэрийг зөөлөн
            өөрчлөхөд чиглэнэ.
          </p>
        </div>

        {/* Гол дүгнэлт – жин, хоног, калор */}
        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr),minmax(0,1.4fr)]">
          <div className="rounded-2xl bg-white/80 p-6 shadow-sm backdrop-blur space-y-4">
            <h2 className="text-lg md:text-xl font-semibold text-slate-900">
              Таны жин ба зорилтот хугацаа
            </h2>

            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
              Та одоогоор{" "}
              <span className="font-semibold">
                {exampleInput.weightKg} кг
              </span>{" "}
              жинтэй бөгөөд таны өндрийг бодолцвол хэвийн жин{" "}
              <span className="font-semibold">
                {program.normalMin}–{program.normalMax} кг
              </span>{" "}
              орчим байна.
            </p>

            {isOverweight ? (
              <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                Таны жинд{" "}
                <span className="font-semibold text-rose-600">
                  {program.excessKg} кг
                </span>{" "}
                илүүдэл байна. Хамгийн аюулгүй, дарамт бага хурдтайгаар{" "}
                <span className="font-semibold text-emerald-600">
                  {program.daysToGoal} хоногт
                </span>{" "}
                хэвийн жинд хүрэх боломжтой.
              </p>
            ) : (
              <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                Таны жин одоогоор хэвийн мужид ойр байна. Хөтөлбөрийн гол зорилго
                нь жинг алдах бус,{" "}
                <span className="font-semibold">
                  эрүүл хэв маягаа тогтвортой хадгалах
                </span>{" "}
                юм.
              </p>
            )}

            <div className="mt-3 rounded-xl bg-sky-50/80 p-4 border border-sky-100">
              <p className="text-sm md:text-base text-slate-800 leading-relaxed">
                Та өдөрт дунджаар{" "}
                <span className="font-semibold text-sky-700">
                  {program.dailyCalories} ккал
                </span>{" "}
                хүртэл хоол идэх нь таны биеийн онцлогт илүү{" "}
                <span className="font-semibold">
                  зөөлөн, тогтвортой өөрчлөлт
                </span>{" "}
                хийхэд тохиромжтой.
              </p>
              <p className="mt-2 text-xs md:text-sm text-slate-600">
                Калорыг зүгээр нэг багасгах биш,{" "}
                <span className="font-medium">
                  шим тэжээл, уураг, нүүрс ус, өөх тос
                </span>
                -ыг зөв харьцаатай байлгах нь хамгийн чухал.
              </p>
            </div>
          </div>

          {/* Макро ба гол үзүүлэлтүүд */}
          <div className="rounded-2xl bg-white/80 p-6 shadow-sm backdrop-blur space-y-4">
            <h2 className="text-lg md:text-xl font-semibold text-slate-900">
              Өдөрт авах үндсэн суурь
            </h2>

            <div className="space-y-3 text-sm md:text-base">
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-slate-600">Өдөрт нийт ккал</span>
                  <span className="font-semibold text-slate-900">
                    {program.dailyCalories} ккал
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-slate-600 mb-2">
                  Таны хоол хүнсний{" "}
                  <span className="font-medium">макро хуваарилалт</span>:
                </p>
                <ul className="space-y-1.5 text-slate-700">
                  <li>
                    • Уураг:{" "}
                    <span className="font-semibold">
                      {program.proteinPercent}%
                    </span>
                  </li>
                  <li>
                    • Нүүрс ус:{" "}
                    <span className="font-semibold">
                      {program.carbPercent}%
                    </span>
                  </li>
                  <li>
                    • Өөх тос:{" "}
                    <span className="font-semibold">
                      {program.fatPercent}%
                    </span>
                  </li>
                </ul>
                <p className="mt-2 text-xs md:text-sm text-slate-500">
                  Ямар ч хоол идэж болно, гол нь{" "}
                  <span className="font-medium">
                    шим тэжээлээ тэнцвэртэй байлгах
                  </span>{" "}
                  нь чухал. Оюунсанаа таны идсэн хоолыг шим тэжээлээр нь ялгаж
                  харуулна.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Хэвийн vs Одоогийн үзүүлэлтүүд – “зураас”-ын концепц */}
        <div className="rounded-2xl bg-white/80 p-6 shadow-sm backdrop-blur">
          <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-3">
            Хэвийн ба таны одоогийн үзүүлэлт
          </h2>
          <p className="text-sm md:text-base text-slate-600 mb-4">
            Доорх зурааснууд дээр{" "}
            <span className="font-medium">хэвийн үзүүлэлт</span> ба{" "}
            <span className="font-medium">таны одоогийн байдал</span> зэрэгцэн
            харагдана. Хөтөлбөр хэрэгжүүлэх тусам “Таны өнөөгийн” зураас
            өдөр бүр өөрчлөгдөнө.
          </p>

          <div className="space-y-4">
            {/* Жин */}
            <MetricRow
              label="Жин"
              normalLabel={`${program.normalMin}–${program.normalMax} кг`}
              currentLabel={`${exampleInput.weightKg} кг`}
            />

            {/* Хоол – ккал */}
            <MetricRow
              label="Хоол (өдөрт ккал)"
              normalLabel={`${program.dailyCalories} ккал орчим`}
              currentLabel="Таны одоогийн хооллолт: жишээ байдлаар илүү савалгаа ихтэй"
            />

            {/* Хөдөлгөөн */}
            <MetricRow
              label="Хөдөлгөөн"
              normalLabel={`${program.stepsRecommended.toLocaleString()} алхам/өдөр`}
              currentLabel="Алхалт бага, долоо хоногт 1–2 удаа дасгал"
            />

            {/* Нойр */}
            <MetricRow
              label="Нойр"
              normalLabel={`${program.sleepRecommended} цаг/шөнө`}
              currentLabel={`${exampleInput.sleepHours} цаг/шөнө`}
            />

            {/* Ус */}
            <MetricRow
              label="Ус"
              normalLabel={`${program.waterRecommended} л/өдөр`}
              currentLabel={`${exampleInput.waterLiters} л/өдөр`}
            />

            {/* Муу зуршил */}
            <MetricRow
              label="Муу зуршлын түвшин"
              normalLabel="Ховор эсвэл огт байхгүй"
              currentLabel="Одоогоор нэлээд нөлөөтэй байж болзошгүй"
            />
          </div>
        </div>

        {/* Доод хэсгийн товчлуурууд */}
        <div className="flex flex-col md:flex-row gap-3 justify-between">
          <button
            type="button"
            onClick={() => router.push("/mind/health-demo/questionnaire")}
            className="w-full md:w-auto rounded-full border border-slate-200 bg-white/70 px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            Буцах (асуумж засах)
          </button>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => router.push("/chat")}
              className="flex-1 rounded-full border border-sky-200 bg-sky-50/80 px-5 py-2.5 text-sm font-medium text-sky-800 shadow-sm hover:bg-sky-100 transition"
            >
              Чатаар ярилцах
            </button>

            <button
              type="button"
              onClick={() => router.push("/mind/health-demo/program")}
              className="flex-1 rounded-full bg-emerald-500/90 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-600 transition"
            >
              Танд тохирсон хөтөлбөрийг эхлүүлэх
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricRowProps {
  label: string;
  normalLabel: string;
  currentLabel: string;
}

function MetricRow({ label, normalLabel, currentLabel }: MetricRowProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-800">{label}</span>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <div className="rounded-xl bg-slate-50/80 border border-slate-100 px-3 py-2.5">
          <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">
            Хэвийн үзүүлэлт
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-200/70 overflow-hidden mb-1.5">
            <div className="h-full w-4/5 rounded-full bg-emerald-400/80" />
          </div>
          <div className="text-xs text-slate-700">{normalLabel}</div>
        </div>

        <div className="rounded-xl bg-slate-50/80 border border-slate-100 px-3 py-2.5">
          <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">
            Таны өнөөгийн байдал
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-200/70 overflow-hidden mb-1.5">
            <div className="h-full w-3/5 rounded-full bg-sky-400/80" />
          </div>
          <div className="text-xs text-slate-700">{currentLabel}</div>
        </div>
      </div>
    </div>
  );
}
