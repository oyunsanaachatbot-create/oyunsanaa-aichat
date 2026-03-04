"use client";

import { useMemo, useState } from "react";

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

    let bmiText = "Биеийн жингийн мэдээлэл дутуу байна.";
    if (bmi !== null) {
      let level = "";
      if (bmi < 18.5) level = "жингийн дутагдалтай";
      else if (bmi < 25) level = "хэвийн жинтэй";
      else if (bmi < 30) level = "илүүдэл жинтэй";
      else level = "таргалалттай";

      bmiText = `Таны BMI ойролцоогоор ${bmi.toFixed(1).replace(".", ",")} байна. Энэ нь ${level} түвшинд байна.`;
    }

    // Хөдөлгөөн, хоол, нойр, зуршлын “хуучин” логик
    const lifestyleParts: string[] = [];

    // Хөдөлгөөн
    if (form.exercise === "daily" || form.walking === "high") {
      lifestyleParts.push("Та хөдөлгөөний түвшнээ сайн барьж байна. Ийм хэв маягаа хадгалбал сайн.");
    } else if (form.exercise === "never" || form.walking === "none") {
      lifestyleParts.push("Хөдөлгөөн бага байна. Долоо хоногт дор хаяж 3 өдөр, өдрөөр 20–30 минут алхах эсвэл дасгал хийхийг санал болгож байна.");
    } else {
      lifestyleParts.push("Таны хөдөлгөөн дунд түвшинд байна. Өдөр тутмын алхалт болон амьсгал бага зэрэг өөрчлөгдөх дасгал нэмбэл бүр илүү сайжирна.");
    }

    // Хооллолт
    if (form.dietType === "mixed" && form.mealsPerDay === "3") {
      lifestyleParts.push("Хооллолтын давтамж таны хувьд боломжийн харагдаж байна. Одоо чанарт нь илүү анхаарах нь чухал.");
    } else if (form.mealsPerDay === "1" || form.mealsPerDay === "2") {
      lifestyleParts.push("Өдөрт хооллох удаа бага байна. Цусан дахь сахарын хэлбэлзэл, ходоод гэдэсний ачааллыг бууруулахын тулд 3–4 удаагийн тогтвортой хооллолт хэрэгтэй.");
    } else if (form.mealsPerDay === "4plus") {
      lifestyleParts.push("Өдөрт олон удаагийн хооллолт хийдэг тул порцын хэмжээ болон амттан, түргэн хоолын хэрэглээндээ анхаараарай.");
    }

    const lifestyleText = lifestyleParts.join(" ");

    // Нойр
    let sleepText = "";
    if (form.sleepHours === "6-8" && (form.sleepTime === "21-22" || form.sleepTime === "22-23")) {
      sleepText = "Таны нойрны цаг болон унтах цаг нийтэд нь эрүүл хэв маягийн түвшинд байна. Энэ нь сэтгэл зүй, жин, дархлаанд эерэг нөлөөтэй.";
    } else if (form.sleepHours === "4-6" || form.sleepTime === "23-24" || form.sleepTime === "24-1") {
      sleepText = "Нойр харьцангуй дутмаг эсвэл оройтож байна. Шөнө 23:00 цагаас өмнө унтаж, 7–8 цагийн гүн нойрыг зорилт болгох нь зүйтэй.";
    } else if (form.sleepHours === "less4" || form.sleepTime === "1plus") {
      sleepText = "Нойр эрүүл мэндэд ноцтойгоор нөлөөлөх түвшинд алдагдсан байж болзошгүй. Аль болох эрт унтаж хэвших, орой утас, дэлгэцийн хэрэглээг багасгах хэрэгтэй.";
    } else {
      sleepText = "Таны нойрны хэв маяг тодорхой хэмжээнд боломжийн байж болох ч тогтвортой 7–8 цагийн унтлагыг зорилго болговол сайн.";
    }

    // Зуршлууд
    const badHabits: string[] = [];
    if (form.alcohol === "often" || form.alcohol === "daily") badHabits.push("согтууруулах ундаа тогтмол хэрэглэдэг");
    if (["1-5", "6-10", "11-20", "20plus"].includes(form.smoking)) badHabits.push("тамхи татдаг");

    let habitsText = "";
    if (badHabits.length === 0) {
      habitsText = "Илэрхий хүчтэй сөрөг зуршил харагдахгүй байна. Энэ нь эрүүл мэндийн хувьд том давуу тал юм.";
    } else {
      habitsText =
        "Танд дараах эрүүл мэндэд сөрөг зуршлууд ажиглагдаж байна: " +
        badHabits.join(", ") +
        ". Эдгээрээс аажмаар багасгах, солих төлөвлөгөө гаргах нь тэнцвэрээ хадгалахад тусална.";
    }

    const summary =
      "Одоогийн байдлаар таны эрүүл мэндийн тэнцвэрийг биеийн жин, нойр, хөдөлгөөн, зуршлын түвшнээр ерөнхийд нь харууллаа. Энэ нь албан ёсны эмчийн онош биш бөгөөд таны өдөр тутмын хэв маягаа ойлгож, өөрт тохирсон хөтөлбөрт бэлтгэхэд туслах зорилготой.";

    return { bmi, bmiText, lifestyleText, sleepText, habitsText, summary };
  }, [form]);

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
      if (!res.ok) throw new Error(j?.error || "Хадгалах үед алдаа гарлаа");

      setOk("Хадгаллаа ✅");
      props.onSaved?.();
    } catch (e: any) {
      setErr(e?.message || "Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white text-slate-900 rounded-2xl p-5 shadow max-w-3xl mx-auto space-y-4">
      <h2 className="text-xl font-semibold">Миний амьдралын тэнцвэр · Эрүүл мэндийн үнэлгээ</h2>
      <p className="text-sm text-slate-600">
        Та доорх асуултуудыг үнэнээр нь бөглөх тусам Оюунсанаа таны эрүүл мэндийн одоогийн тэнцвэрийг илүү нарийвчлан дүгнэнэ.
      </p>

      {err && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{err}</div>}
      {ok && <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{ok}</div>}

      {/* 1) үндсэн мэдээлэл */}
      <section className="space-y-3">
        <div className="text-sm font-semibold text-slate-800">1. Үндсэн мэдээлэл</div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Эхлэх өдөр</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium">Хүйс</div>
            <div className="flex flex-col gap-1 text-sm">
              <label className="inline-flex items-center gap-2">
                <input type="radio" checked={form.gender === "male"} onChange={() => handleChange("gender", "male")} />
                <span>Эр</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="radio" checked={form.gender === "female"} onChange={() => handleChange("gender", "female")} />
                <span>Эм</span>
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Нас" value={form.age} onChange={(v) => handleChange("age", v)} placeholder="Ж: 32" />
          <Field label="Өндөр (см)" value={form.height} onChange={(v) => handleChange("height", v)} placeholder="Ж: 165" />
          <Field label="Жин (кг)" value={form.weight} onChange={(v) => handleChange("weight", v)} placeholder="Ж: 62" />
        </div>
      </section>

      {/* 2) анхаарал */}
      <section className="space-y-2">
        <div className="text-sm font-semibold text-slate-800">2. Эрүүл мэнддээ хэр анхаардаг вэ?</div>
        <div className="flex flex-col gap-1 text-sm">
          {[
            { id: "high", label: "Бүх талаар анхаардаг" },
            { id: "medium", label: "Дунд зэрэг анхаардаг" },
            { id: "low", label: "Ховор" },
            { id: "onlyWhenSick", label: "Өвдөхөөрөө л үзүүлдэг" },
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
        <div className="text-sm font-semibold text-slate-800">3. Хооллолт</div>

        <div className="space-y-1">
          <div className="text-sm font-medium">Та ямар хоолтон бэ?</div>
          <div className="flex flex-col gap-1 text-sm">
            {[
              { id: "mixed", label: "Холимог хоолтон" },
              { id: "meat", label: "Махан хоол давамгай" },
              { id: "veg", label: "Ногоо, цагаан хоол давамгай" },
              { id: "vegan", label: "Веган" },
              { id: "unknown", label: "Тодорхой бус" },
            ].map((opt) => (
              <label key={opt.id} className="inline-flex items-center gap-2">
                <input type="radio" checked={form.dietType === opt.id} onChange={() => handleChange("dietType", opt.id)} />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium">Өдөрт хэдэн удаа хооллодог вэ?</div>
          <div className="flex flex-col gap-1 text-sm">
            {[
              { id: "1", label: "1 удаа" },
              { id: "2", label: "2 удаа" },
              { id: "3", label: "3 удаа" },
              { id: "4plus", label: "4+ удаа" },
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
        <div className="text-sm font-semibold text-slate-800">4. Хөдөлгөөн</div>

        <div className="space-y-1">
          <div className="text-sm font-medium">Та дасгал хийдэг үү?</div>
          <div className="flex flex-col gap-1 text-sm">
            {[
              { id: "daily", label: "Өдөр бүр" },
              { id: "often", label: "Долоо хоногт 3–4 удаа" },
              { id: "sometimes", label: "Долоо хоногт 1–2 удаа" },
              { id: "rare", label: "Ховор" },
              { id: "never", label: "Огт хийдэггүй" },
            ].map((opt) => (
              <label key={opt.id} className="inline-flex items-center gap-2">
                <input type="radio" checked={form.exercise === opt.id} onChange={() => handleChange("exercise", opt.id)} />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium">Өдөрт дундажаар хэр их алхдаг вэ?</div>
          <div className="flex flex-col gap-1 text-sm">
            {[
              { id: "none", label: "Бараг алхдаггүй" },
              { id: "low", label: "Бага зэрэг" },
              { id: "medium", label: "Дунд зэрэг" },
              { id: "high", label: "Сайн алхдаг" },
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
        <div className="text-sm font-semibold text-slate-800">5. Нойр ба зуршил</div>

        <div className="space-y-1">
          <div className="text-sm font-medium">Нойрны нийт цаг</div>
          <select className="w-full rounded-lg border px-3 py-2 text-sm" value={form.sleepHours} onChange={(e) => handleChange("sleepHours", e.target.value)}>
            <option value="">Сонгох</option>
            <option value="less4">4-өөс бага</option>
            <option value="4-6">4–6</option>
            <option value="6-8">6–8</option>
            <option value="8-10">8–10</option>
            <option value="10plus">10+</option>
          </select>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium">Ерөнхий унтах цаг</div>
          <select className="w-full rounded-lg border px-3 py-2 text-sm" value={form.sleepTime} onChange={(e) => handleChange("sleepTime", e.target.value)}>
            <option value="">Сонгох</option>
            <option value="21-22">21–22</option>
            <option value="22-23">22–23</option>
            <option value="23-24">23–24</option>
            <option value="24-1">24–1</option>
            <option value="1plus">1 цагаас хойш</option>
          </select>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium">Архи</div>
          <select className="w-full rounded-lg border px-3 py-2 text-sm" value={form.alcohol} onChange={(e) => handleChange("alcohol", e.target.value)}>
            <option value="">Сонгох</option>
            <option value="never">Огт</option>
            <option value="rare">Ховор</option>
            <option value="sometimes">Заримдаа</option>
            <option value="often">Ойр ойр</option>
            <option value="daily">Өдөр бүр</option>
          </select>
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium">Тамхи</div>
          <select className="w-full rounded-lg border px-3 py-2 text-sm" value={form.smoking} onChange={(e) => handleChange("smoking", e.target.value)}>
            <option value="">Сонгох</option>
            <option value="no">Үгүй</option>
            <option value="rare">Ховор</option>
            <option value="1-5">1–5</option>
            <option value="6-10">6–10</option>
            <option value="11-20">11–20</option>
            <option value="20plus">20+</option>
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
          Дүн гаргах
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
          {saving ? "Хадгалж байна..." : "Хадгалах"}
        </button>
      </div>

      {result && (
        <div className="mt-2 space-y-3 border-t border-slate-200 pt-3">
          <h3 className="text-sm font-semibold">Одоогийн эрүүл мэндийн тэнцвэрийн тойм</h3>
          <p className="text-sm text-slate-700">{result.summary}</p>

          <div className="space-y-1 text-sm">
            <div className="font-medium">Биеийн жин:</div>
            <p>{result.bmiText}</p>
          </div>

          <div className="space-y-1 text-sm">
            <div className="font-medium">Хөдөлгөөн ба хооллолт:</div>
            <p>{result.lifestyleText}</p>
          </div>

          <div className="space-y-1 text-sm">
            <div className="font-medium">Нойр ба амралт:</div>
            <p>{result.sleepText}</p>
          </div>

          <div className="space-y-1 text-sm">
            <div className="font-medium">Зуршлууд:</div>
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
