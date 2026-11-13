"use client";

import { FormEvent, ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Sex = "male" | "female";

interface AssessmentResult {
  weightText: string;
  foodText: string;
  movementText: string;
  sleepText: string;
  waterText: string;
  habitText: string;
  overallText: string;
  overweightKg: number | null;
  daysToGoal: number | null;
}

function calcAssessment(
  heightCm: number | null,
  weightKg: number | null,
  mealsPerDay: number | null,
  exerciseLevel: string,
  walkLevel: string,
  sleepHours: number | null,
  waterLiters: number | null,
  habits: string[]
): AssessmentResult {
  // ----- ЖИН / BMI -----
  let overweightKg: number | null = null;
  let daysToGoal: number | null = null;
  let weightText = "Жингийн мэдээлэл дутуу байна.";

  if (heightCm && weightKg && heightCm > 0 && weightKg > 0) {
    const h = heightCm / 100;
    const bmi = weightKg / (h * h);
    const normalMin = 18.5 * h * h;
    const normalMax = 24.9 * h * h;
    const target = (normalMin + normalMax) / 2;
    const diff = Math.round(weightKg - target);
    overweightKg = diff;

    if (Math.abs(diff) <= 2) {
      weightText =
        `Таны BMI хэвийн бүсэд ойрхон байна. Биеийн жин одоогийн байдлаар тогтвортой ` +
        `хадгалж болох түвшинд байна. Хөдөлгөөн, хооллолт, нойр, усны хэрэглээгээ одоогийнх шигээ ` +
        `эсвэл арай сайжруулбал илүү сайн.`;
    } else if (diff > 2) {
      const days = Math.max(40, Math.min(120, diff * 4));
      daysToGoal = days;
      weightText =
        `Таны жингийн үзүүлэлтээр тооцоход ойролцоогоор **${diff} кг орчим илүүдэл жин** байна. ` +
        `Энэ нь биеийн ачаалал, зүрх судас, үе мөч, нойр, хоол боловсруулалтанд нөлөөлөх эрсдэлтэй. ` +
        `Хэвийн жиндээ ойртоход ойролцоогоор **${days} хоног** тогтвортой, аажим хөтөлбөрөөр ажиллах шаардлагатай.`;
    } else {
      const kg = Math.abs(diff);
      const days = Math.max(40, Math.min(120, kg * 4));
      daysToGoal = days;
      weightText =
        `Таны BMI-аар тооцоход ойролцоогоор **${kg} кг орчим жингийн дутагдал** байна. ` +
        `Биеийн дархлаа, дааврын тэнцвэр, сэтгэлзүйн байдалд сөргөөр нөлөөлөх эрсдэлтэй. ` +
        `Алгуурхан жингээ нөхөхөд **${days} хоног** орчим тогтвортой хөтөлбөр хэрэгтэй.`;
    }
  }

  // ----- ХООЛЛОЛТ -----
  let foodScore = 0;

  if (mealsPerDay) {
    if (mealsPerDay === 3 || mealsPerDay === 4) foodScore += 2;
    else if (mealsPerDay === 2) foodScore += 1;
    else foodScore -= 1;
  }
  if ((habits.includes("overeating") || habits.includes("sweets")) && foodScore > 0) {
    foodScore -= 1;
  }

  let foodText = "";
  if (foodScore >= 2) {
    foodText =
      `Таны хооллолтын хуваарь ерөнхийдөө боломжийн харагдаж байна. Өдөрт тогтмол хооллож, ` +
      `хоолны цагийг алгасах нь бага байгаагаас харахад хоолны дэглэмээ зөв тал руу чиглүүлж чаджээ. ` +
      `Цаашид боловсруулсан хүнс, хэт их сахар, амттаны хэрэглээг бууруулж, ногоо, уураг, ` +
      `эрүүл өөх тосоо нэмэгдүүлэх нь жингийн өөрчлөлтөд сайнаар нөлөөлнө.`;
  } else if (foodScore >= 1) {
    foodText =
      `Таны хооллолтын хэв маяг **дунд зэрэг** түвшинд байна. ` +
      `Өдөрт хооллох тоо тун муу биш ч зарим үед хоол алгасах, ` +
      `гүйцэт тэжээл авахаас илүү хурдан, түргэн хоолуудад хандах хандлага ажиглагдаж болох юм. ` +
      `Эрүүл өдрийн үндсэн 3 хоол, 1–2 удаагийн хөнгөн зуушийн тогтмол хуваарь баримталбал ` +
      `жингийн тэнцвэр, энерги илүү жигд болно.`;
  } else {
    foodText =
      `Таны хооллолтын хэв маяг тогтворгүй байж болзошгүй. Өдөрт хооллох тоо бага, ` +
      `эсвэл нэг дор их хэмжээгээр идэх хандлага ажиглагдаж байна. ` +
      `Ийм хэв маяг нь цусан дахь сахарын огцом хэлбэлзэл, жингийн их хэлбэлзэл, ` +
      `сэтгэлзүйн ядаргаанд хүргэх магадлалтай. Хооллох цаг, хэмжээ, бүтэцдээ илүү анхаарч, ` +
      `алгуур өөрчлөлт оруулах шаардлагатай.`;
  }

  // ----- ХӨДӨЛГӨӨН -----
  let movementScore = 0;
  if (exerciseLevel === "daily") movementScore += 3;
  else if (exerciseLevel === "3-4") movementScore += 2;
  else if (exerciseLevel === "1-2") movementScore += 1;
  else if (exerciseLevel === "rare") movementScore += 0;
  else movementScore -= 1;

  if (walkLevel === "high") movementScore += 2;
  else if (walkLevel === "medium") movementScore += 1;
  else if (walkLevel === "low") movementScore -= 1;

  let movementText = "";
  if (movementScore >= 4) {
    movementText =
      `Таны хөдөлгөөний идэвхжил **сайн түвшинд** байна. Долоо хоногт хэд хэдэн удаагийн дасгал, ` +
      `өдөр тутмын алхалт сайн байгаагаас шалтгаалан бодисын солилцоо, ` +
      `зүрх судас, сэтгэлзүйн тэнцвэрт эерэг нөлөө үзүүлж байна. Энэ хэмнэлийг хадгалж, ` +
      `суниалт, булчингийн хүчний дасгалыг бага багаар нэмбэл илүү сайжирна.`;
  } else if (movementScore >= 2) {
    movementText =
      `Таны хөдөлгөөний түвшин **дунд зэрэг** байна. Тогтмол бус ч гэлээ тодорхой хэмжээнд дасгал, ` +
      `алхалт хийдэг нь эерэг тал. Цаашид долоо хоногт 3–4 удаа 30–40 минутын идэвхтэй ` +
      `хөдөлгөөн (алгаан дасгал, хурдан алхалт, йог, аэробик гэх мэт) хийх нь жин, нойр, ` +
      `стрессийн түвшинг мэдэгдэхүйц сайжруулна.`;
  } else {
    movementText =
      `Таны хөдөлгөөний идэвхжил бага түвшинд байна. Өдөр тутмын алхалт, биеийн хөдөлгөөн ` +
      `хязгаарлагдмал байгаа нь бодисын солилцоог удаашруулж, жингийн өөрчлөлт, ` +
      `нуруу, үе мөчний ачаалал нэмэгдэх эрсдэлтэй. Өдөрт дор хаяж 20–30 минут хурдан алхах, ` +
      `нэг бүрчлэн суниалт, сунгалтын дасгал нэмэх нь маш чухал.`;
  }

  // ----- НОЙР / АМРАЛТ -----
  let sleepScore = 0;
  if (sleepHours) {
    if (sleepHours >= 7 && sleepHours <= 9) sleepScore += 2;
    else if (sleepHours >= 6 && sleepHours < 7) sleepScore += 1;
    else sleepScore -= 1;
  }

  let sleepText = "";
  if (sleepScore >= 2) {
    sleepText =
      `Таны унтах цаг **ерөнхийдөө хангалттай** байна. Шөнөдөө авдаг нойрны хэмжээ бие махбодын сэргээн ` +
      `сэргээх үйл ажиллагаанд сайн нөлөөтэй. Унтах цагийг тогтмол байлгаж, ` +
      `оройн цагаар дэлгэцийн хэрэглээг багасгах нь нойрны чанарыг улам сайжруулна.`;
  } else if (sleepScore >= 1) {
    sleepText =
      `Таны нойр **дунд зэрэг** түвшинд байна. Өдөрт авах нойрныхоо хэмжээг арай бага талаас авч байгаа нь ` +
      `анхаарал төвлөрөл, сэтгэлзүйн тогтвортой байдалд нөлөөлж болзошгүй. ` +
      `Хэрэв боломжтой бол унтах цагийг 30–60 минутаар уртасгаж үзэх нь зохимжтой.`;
  } else {
    sleepText =
      `Таны нойр хангалтгүй эсвэл тогтворгүй байж болзошгүй. Хэт бага нойр нь жин нэмэгдэх, ` +
      `хоолны дуршил ихсэх, стрессийн даавар өсөхөд шууд нөлөөлдөг. ` +
      `Шөнөдөө 7–8 цагийн чанартай нойр авах зорилго тавьж, орой унтах цагийг тогтмолжуулах хэрэгтэй.`;
  }

  // ----- УС -----
  let waterScore = 0;
  if (waterLiters) {
    if (waterLiters >= 1.5 && waterLiters <= 2.5) waterScore += 2;
    else if (waterLiters >= 1) waterScore += 1;
    else waterScore -= 1;
  }

  let waterText = "";
  if (waterScore >= 2) {
    waterText =
      `Өдөрт ууж буй усны хэмжээ **хангалттай түвшинд** байна. Энэ нь бодисын солилцоо, ` +
      `гэнэтийн хоолны дуршлыг бууруулах, арьс, үе мөчний эрүүл мэндэд эерэг нөлөөтэй. ` +
      `Цаашид сахартай, хийжүүлсэн ундааг аль болох усаар солих нь илүү ашигтай.`;
  } else if (waterScore >= 1) {
    waterText =
      `Таны усны хэрэглээ **дунд зэрэг** байна. Өдөрт уудаг усны хэмжээг арай нэмэгдүүлбэл (ойролцоогоор 1.5–2 литр) ` +
      `нойр, хоол боловсруулалт, ерөнхий эрч хүч нэмэгдэх боломжтой.`;
  } else {
    waterText =
      `Өдөрт ууж буй усны хэмжээ бага байж болзошгүй. Ус дутуу авах нь толгой өвдөх, ` +
      `ядарч сульдах, хоол боловсруулалт удаашрах, арьс хуурайших зэрэгт нөлөөлдөг. ` +
      `Өдөрт бага багаар, тогтмол ус уух зуршилдаа анхаарах нь чухал.`;
  }

  // ----- ЗУРШИЛ -----
  let habitScore = 0;
  if (habits.includes("alcohol")) habitScore -= 1;
  if (habits.includes("smoking")) habitScore -= 2;
  if (habits.includes("screen")) habitScore -= 1;
  if (habits.includes("lazy")) habitScore -= 1;
  if (habits.includes("overeating")) habitScore -= 1;
  if (habits.includes("workaholic")) habitScore -= 1;
  if (habits.includes("badSleep")) habitScore -= 1;
  if (habits.includes("soda")) habitScore -= 1;
  if (habits.includes("sweets")) habitScore -= 1;

  let habitText = "";
  if (habitScore <= -4) {
    habitText =
      `Сонгосон зуршлуудаас харахад өдөр тутмын амьдралд тань эрүүл мэндэд сөрөг ` +
      `хэд хэдэн хүчин зүйл зэрэгцэн нөлөөлж байна. Согтууруулах ундаа, тамхи, ` +
      `дэлгэцийн хэрэглээ, амттан, хийжүүлсэн ундаа, нойрны дэглэм зэрэг олон ` +
      `зуршлыг нэг дор өөрчлөх гэж яарах бус, алхам алхмаар, давтамжийг нь эхлээд ` +
      `багасгах зарчмаар ажиллах нь илүү амжилттай байдаг.`;
  } else if (habitScore <= -1) {
    habitText =
      `Танд тодорхой хэмжээний эрсдэл дагуулсан зуршлууд байна. Эдгээр нь одоогоор ` +
      `бие махбодод шууд ноцтой асуудал үүсгээгүй байж болох ч жингийн хэлбэлзэл, ` +
      `нойрны чанар, сэтгэлзүйн тогтвортой байдалд нөлөөлөх эрсдэлтэй. ` +
      `Давтамжийг нь аажмаар бууруулах, орлуулах эерэг зуршлууд (алхалт, ус уух,` +
      `ногоо жимс нэмэх, богино амралт авах гэх мэт) нэмэх нь чухал.`;
  } else {
    habitText =
      `Эрсдэлтэй зуршил харьцангуй бага байна. Одоогийн хэв маягаа хадгалж, ` +
      `стрессээ эрүүл аргаар тайлах (спорт, алхалт, унших, бүтээлч хобби гэх мэт) ` +
      `боломжуудаа нэмэгдүүлбэл урт хугацаанд эрүүл мэндийг хамгаалахад тусална.`;
  }

  // ----- ЕРӨНХИЙ ДҮГНЭЛТ -----
  let overallText = "";
  if (overweightKg === null) {
    overallText =
      `Оруулсан зарим мэдээлэл дутуу тул жин, биеийн байдлыг бүрэн тооцоолж чадсангүй. ` +
      `Гэсэн хэдий ч хооллолт, хөдөлгөөн, нойр, ус, зуршлын мэдээллээс харахад тодорхой өөрчлөлт хийх ` +
      `боломж байна. Танд тохирсон хөтөлбөрийг эхлүүлэхдээ зорилгоо илүү тодорхой болгож, ` +
      `алхам алхмаар урагшлах нь хамгийн тогтвортой үр дүнг өгнө.`;
  } else if (Math.abs(overweightKg) <= 2 && movementScore >= 2 && sleepScore >= 1) {
    overallText =
      `Дээрх үзүүлэлтүүдийг нэгтгэж харахад таны ерөнхий эрүүл мэндийн тэнцвэр **дунд түвшнээс дээш** байна. ` +
      `Жин, хөдөлгөөн, нойр, усны хэрэглээ харьцангуй сайн байгаа тул одоо байгаа хэв маягаа хадгалж, ` +
      `нарийн жижиг сайжруулалтад анхаарвал хангалттай. **“Танд тохирсон хөтөлбөрт тавтай морил.”** ` +
      `дараагийн хуудсанд бид таны зорьсон хоногийн турш өдөр бүр хийх энгийн даалгаврыг санал болгоно.`;
  } else {
    const kgText =
      overweightKg > 0
        ? `ойролцоогоор ${overweightKg} кг илүүдэл жинтэй `
        : `ойролцоогоор ${Math.abs(overweightKg)} кг жингийн дутагдалтай `;
    const dayText =
      daysToGoal !== null
        ? `хэвийн түвшинд хүрэхэд ${daysToGoal} хоног орчим тогтвортой ажиллах шаардлагатай. `
        : "";
    overallText =
      `Дээрх үзүүлэлтүүдээс харахад та ${kgText}байна. Энэ нь хооллолт, хөдөлгөөн, нойр, усны ` +
      `хэв маягтай хамт эрүүл мэндийн ерөнхий тэнцвэрт нөлөөлж байна. ${dayText}` +
      `Хөтөлбөрийн дараагийн шатанд бид таныг ачаалал даах чадварт тохирсон өдөр бүрийн ` +
      `жижиг даалгавруудтай холбож, алгуур боловч тогтвортой өөрчлөлт хийхэд тусална. ` +
      `**“Танд тохирсон хөтөлбөрт тавтай морил.”**`;
  }

  return {
    weightText,
    foodText,
    movementText,
    sleepText,
    waterText,
    habitText,
    overallText,
    overweightKg,
    daysToGoal,
  };
}

export default function HealthQuestionnairePage() {
  const router = useRouter();

  // Асуулгын төлөвүүд
  const [startDate, setStartDate] = useState("");
  const [sex, setSex] = useState<Sex>("female");
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [healthCare, setHealthCare] = useState("");

  const [dietType, setDietType] = useState("");
  const [mealsPerDay, setMealsPerDay] = useState("");

  const [exerciseLevel, setExerciseLevel] = useState("");
  const [walkLevel, setWalkLevel] = useState("");

  const [habits, setHabits] = useState<string[]>([]);
  const [alcohol, setAlcohol] = useState("");
  const [smoking, setSmoking] = useState("");

  const [restHours, setRestHours] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [sleepTime, setSleepTime] = useState("");

  const [waterLiters, setWaterLiters] = useState("");

  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const handleHabitChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    setHabits((prev) =>
      checked ? [...prev, value] : prev.filter((h) => h !== value)
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const habitTags = [...habits];

    if (alcohol !== "none" && alcohol !== "") habitTags.push("alcohol");
    if (smoking !== "none" && smoking !== "") habitTags.push("smoking");
    if (habitTags.includes("lateSleep")) habitTags.push("badSleep");

    const assessment = calcAssessment(
      Number(heightCm) || null,
      Number(weightKg) || null,
      Number(mealsPerDay) || null,
      exerciseLevel,
      walkLevel,
      Number(sleepHours) || null,
      Number(waterLiters) || null,
      habitTags
    );

    setResult(assessment);
    setShowResult(true);
  };

  const resetForm = () => {
    setShowResult(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {!showResult && (
        <form onSubmit={handleSubmit} className="space-y-8">
          <h1 className="text-2xl font-semibold mb-2">
            ✅ Эрүүл мэндийн үнэлгээний асуулга
          </h1>

          {/* 1. Эхлэх өдөр, хүйс */}
          <section className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                1. Хөтөлбөр эхлэх өдөр
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            <div>
              <span className="block text-sm font-medium mb-1">2. Хүйс</span>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="sex"
                    value="male"
                    checked={sex === "male"}
                    onChange={() => setSex("male")}
                  />
                  Эр
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="sex"
                    value="female"
                    checked={sex === "female"}
                    onChange={() => setSex("female")}
                  />
                  Эм
                </label>
              </div>
            </div>
          </section>

          {/* Хувийн үндсэн мэдээлэл */}
          <section className="space-y-4">
            <h2 className="font-semibold">Хувийн үндсэн мэдээлэл</h2>

            <div>
              <label className="block text-sm mb-1">
                3. Та хэдэн настай вэ?
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">
                4. Таны өндөр хэд вэ? (см-ээр)
              </label>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">
                5. Та хэдэн кг жинтэй вэ?
              </label>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">
                6. Та эрүүл мэнддээ хэр анхаардаг вэ?
              </label>
              <select
                value={healthCare}
                onChange={(e) => setHealthCare(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="">Сонгоно уу</option>
                <option value="high">Бүх талаар анхаардаг</option>
                <option value="medium">Дунд зэрэг анхаардаг</option>
                <option value="rare">Ховор</option>
                <option value="onlySick">Өвдөхөөрөө л үзүүлдэг</option>
              </select>
            </div>
          </section>

          {/* Хооллолтын мэдээлэл */}
          <section className="space-y-4">
            <h2 className="font-semibold">Хооллолтын мэдээлэл</h2>

            <div>
              <label className="block text-sm mb-1">
                7. Та ямар хоолтон бэ?
              </label>
              <select
                value={dietType}
                onChange={(e) => setDietType(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="">Сонгоно уу</option>
                <option value="mixed">Холимог хоолтон</option>
                <option value="meat">Махан хоол давамгай</option>
                <option value="veggie">Ногоо, цагаан хоол давамгай</option>
                <option value="vegan">Веган</option>
                <option value="unknown">Тодорхойгүй</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">
                8. Өдөрт хэдэн удаа хооллодог вэ?
              </label>
              <select
                value={mealsPerDay}
                onChange={(e) => setMealsPerDay(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="">Сонгоно уу</option>
                <option value="1">1 удаа</option>
                <option value="2">2 удаа</option>
                <option value="3">3 удаа</option>
                <option value="4">4+ удаа</option>
              </select>
            </div>
          </section>

          {/* Хөдөлгөөний түвшин */}
          <section className="space-y-4">
            <h2 className="font-semibold">Хөдөлгөөний түвшин</h2>

            <div>
              <label className="block text-sm mb-1">
                9. Та дасгал хийдэг үү?
              </label>
              <select
                value={exerciseLevel}
                onChange={(e) => setExerciseLevel(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="">Сонгоно уу</option>
                <option value="daily">Өдөр бүр</option>
                <option value="3-4">Долоо хоногт 3–4 удаа</option>
                <option value="1-2">Долоо хоногт 1–2 удаа</option>
                <option value="rare">Ховор</option>
                <option value="never">Огт хийдэггүй</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">
                10. Өдөрт дундажаар хэр их алхдаг вэ?
              </label>
              <select
                value={walkLevel}
                onChange={(e) => setWalkLevel(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="">Сонгоно уу</option>
                <option value="none">Бараг алхдаггүй</option>
                <option value="low">Бага зэрэг</option>
                <option value="medium">Дунд зэрэг</option>
                <option value="high">Сайн алхдаг</option>
              </select>
            </div>
          </section>

          {/* Зуршил */}
          <section className="space-y-4">
            <h2 className="font-semibold">Зуршлын үнэлгээ</h2>

            <div>
              <span className="block text-sm mb-1">
                11. Та өөрт байгаа гэж бодсон зуршлуудаас сонгоно уу?
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value="alcohol"
                    onChange={handleHabitChange}
                  />
                  Согтууруулах ундаа хэрэглэдэг
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value="smoking"
                    onChange={handleHabitChange}
                  />
                  Тамхи татдаг
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value="screen"
                    onChange={handleHabitChange}
                  />
                  Утас, зурагт, тоглоом хэтрүүлдэг
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value="lazy"
                    onChange={handleHabitChange}
                  />
                  Залхуурал
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value="overeating"
                    onChange={handleHabitChange}
                  />
                  Хэтрүүлж иддэг
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value="workaholic"
                    onChange={handleHabitChange}
                  />
                  Хэт их ажилладаг
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value="badSleep"
                    onChange={handleHabitChange}
                  />
                  Нойр муутай явдаг
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value="soda"
                    onChange={handleHabitChange}
                  />
                  Газтай ундаа байнга уудаг
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    value="sweets"
                    onChange={handleHabitChange}
                  />
                  Амттан хэтрүүлж иддэг
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">
                12. Согтууруулах ундааны хэрэглээ хэр вэ?
              </label>
              <select
                value={alcohol}
                onChange={(e) => setAlcohol(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="">Сонгоно уу</option>
                <option value="none">Огт хэрэглэдэггүй</option>
                <option value="month">Сард 1–2 удаа</option>
                <option value="week1">Долоо хоногт 1 удаа</option>
                <option value="week2-3">Долоо хоногт 2–3 удаа</option>
                <option value="daily">Бараг өдөр бүр</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">
                13. Тамхины хэрэглээ хэр вэ?
              </label>
              <select
                value={smoking}
                onChange={(e) => setSmoking(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="">Сонгоно уу</option>
                <option value="none">Огт татдаггүй</option>
                <option value="rare">Хааяа нэг сордог</option>
                <option value="1-5">Өдөрт 1–5 ширхэг</option>
                <option value="6-10">Өдөрт 6–10 ширхэг</option>
                <option value="11-20">Өдөрт 11–20 ширхэг</option>
                <option value="20+">Өдөрт 20-иос дээш</option>
              </select>
            </div>
          </section>

          {/* Нойр ба амралт, ус */}
          <section className="space-y-4">
            <h2 className="font-semibold">Нойр ба амралт</h2>

            <div>
              <label className="block text-sm mb-1">
                14. Та өдөрт хэр хугацаанд яг өөртөө анхаараад тайван амарч чаддаг вэ?
              </label>
              <select
                value={restHours}
                onChange={(e) => setRestHours(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="">Сонгоно уу</option>
                <option value="0.5-1">30 мин–1 цаг</option>
                <option value="1-2">1–2 цаг</option>
                <option value="2-3">2–3 цаг</option>
                <option value="none">Амардаггүй</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">
                15. Та шөнөдөө хэдэн цаг унтдаг вэ?
              </label>
              <select
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="">Сонгоно уу</option>
                <option value="4-6">4–6 цаг</option>
                <option value="6-8">6–8 цаг</option>
                <option value="8-10">8–10 цаг</option>
                <option value="10+">10-с дээш</option>
                <option value="<4">4-с бага</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">
                16. Та хэдэн цагт унтдаг вэ?
              </label>
              <select
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="">Сонгоно уу</option>
                <option value="21-22">21:00 – 22:00</option>
                <option value="22-23">22:00 – 23:00</option>
                <option value="23-24">23:00 – 00:00</option>
                <option value="0-1">00:00 – 01:00</option>
                <option value="1+">01:00-с хойш</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">
                17. Өдөрт уудаг ус (литр)
              </label>
              <input
                type="number"
                step="0.1"
                value={waterLiters}
                onChange={(e) => setWaterLiters(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
          </section>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 rounded-md bg-blue-600 text-white text-sm font-medium"
            >
              Тооцоолох
            </button>
          </div>
        </form>
      )}

      {/* ДҮГНЭЛТ ГАРАХ ХЭСЭГ */}
      {showResult && result && (
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold mb-2">Эрүүл мэндийн дүгнэлт</h1>

          <section className="space-y-2">
            <h2 className="font-semibold">1) Жин / биеийн байдал</h2>
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {result.weightText}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold">2) Хооллолт</h2>
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {result.foodText}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold">3) Хөдөлгөөн</h2>
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {result.movementText}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold">4) Нойр</h2>
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {result.sleepText}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold">5) Ус</h2>
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {result.waterText}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold">6) Зуршил</h2>
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {result.habitText}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-semibold">7) Ерөнхий дүгнэлт</h2>
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {result.overallText}
            </p>
          </section>

          <div className="pt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-md border text-sm"
            >
              Буцах (асуулга руу)
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="px-4 py-2 rounded-md border text-sm"
            >
              Чат руу орох
            </button>
            <button
              type="button"
              onClick={() => router.push("/mind/health-demo/summary")}
              className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm"
            >
              Үргэлжлүүлэх (хөтөлбөр рүү)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
