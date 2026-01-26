"use client";

import { useMemo, useState } from "react";

type Category =
  | "self"
  | "relationships"
  | "career_money"
  | "health"
  | "meaning"
  | "joy";

type RelatedTo = "me" | "partner_one" | "family" | "work_team";

type TimeHorizon = "1_4w" | "1_3m" | "3_12m" | "1_10y";

type DailyBudget = "30m" | "1h" | "2h" | "3h_plus";

type GoalDraft = {
  id: string;
  category: Category;
  relatedTo: RelatedTo;
  timeHorizon: TimeHorizon;
  dailyBudget: DailyBudget; // зорилго тус бүр дээр optional байж болно, гэхдээ MVP дээр нэгтгээд ашиглаж болно
  title: string;
  note: string;
  createdAt: number;
};

const BRAND = "#1F6FB2";

const categoryOptions: { value: Category; label: string }[] = [
  { value: "self", label: "Өөрөө" },
  { value: "relationships", label: "Харилцаа" },
  { value: "career_money", label: "Ажил/Мөнгө" },
  { value: "health", label: "Эрүүл мэнд" },
  { value: "meaning", label: "Утга учир" },
  { value: "joy", label: "Аз жаргал" },
];

const relatedOptions: { value: RelatedTo; label: string }[] = [
  { value: "me", label: "Зөвхөн би" },
  { value: "partner_one", label: "Нэг хүн (хос/найз)" },
  { value: "family", label: "Гэр бүл" },
  { value: "work_team", label: "Ажил/баг" },
];

const horizonOptions: { value: TimeHorizon; label: string }[] = [
  { value: "1_4w", label: "Ойрын 1–4 долоо хоног" },
  { value: "1_3m", label: "1–3 сар" },
  { value: "3_12m", label: "3–12 сар" },
  { value: "1_10y", label: "1–10 жил" },
];

const budgetOptions: { value: DailyBudget; label: string }[] = [
  { value: "30m", label: "30 мин" },
  { value: "1h", label: "1 цаг" },
  { value: "2h", label: "2 цаг" },
  { value: "3h_plus", label: "3 цаг+" },
];

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function budgetToMinutes(b: DailyBudget) {
  switch (b) {
    case "30m":
      return 30;
    case "1h":
      return 60;
    case "2h":
      return 120;
    case "3h_plus":
      return 180;
  }
}

export default function PurposeGoalPage() {
  // ✅ Дээд “сонголтын блок” (чиний хүссэнээр бичихээс өмнө сонгоно)
  const [category, setCategory] = useState<Category>("meaning");
  const [relatedTo, setRelatedTo] = useState<RelatedTo>("me");
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>("3_12m");
  const [dailyBudget, setDailyBudget] = useState<DailyBudget>("2h");

  // ✅ Доод “зорилго бичих” хэсэг
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");

  // ✅ Доод “file list”
  const [goals, setGoals] = useState<GoalDraft[]>([]);

  const totalWeeklyMinutes = useMemo(() => budgetToMinutes(dailyBudget) * 7, [dailyBudget]);
  const totalMonthlyMinutes = useMemo(() => budgetToMinutes(dailyBudget) * 30, [dailyBudget]);

  const canAdd = title.trim().length > 0;

  function addGoal() {
    if (!canAdd) return;
    const g: GoalDraft = {
      id: uid(),
      category,
      relatedTo,
      timeHorizon,
      dailyBudget,
      title: title.trim(),
      note: note.trim(),
      createdAt: Date.now(),
    };
    setGoals((prev) => [g, ...prev]);
    setTitle("");
    setNote("");
  }

  function removeGoal(id: string) {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  function updateGoal(id: string, patch: Partial<GoalDraft>) {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }

  async function onCalculate() {
    // MVP дээр эхлээд UI/404-оо бүрэн болгож байна.
    // Дараагийн алхамд эндээс Supabase + Oyunsanaa руу явуулж “цэгцэлсэн хүснэгт” гаргана.
    alert(
      `Одоогоор ${goals.length} зорилго бүртгэлээ.\nДараагийн алхам: “Цэгцлэх” хүснэгт + хасах/батлах.`
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">🧩 Зорилго цэгцлэх</h1>
        <p className="text-sm text-gray-600">
          Эхлээд сонголтоо хийгээд зорилгоо бич. Доор “file” болж нэмэгдэнэ.
        </p>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Left: Input builder */}
        <div className="lg:col-span-3 space-y-4">
          {/* Selection block */}
          <div className="rounded-xl border bg-white p-4 space-y-3">
            <div className="font-medium">Сонголтын блок</div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <div className="text-sm text-gray-700">Юуны тухай зорилго вэ?</div>
                <select
                  className="w-full rounded-lg border p-2"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                >
                  {categoryOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <div className="text-sm text-gray-700">Хэнтэй холбоотой вэ?</div>
                <select
                  className="w-full rounded-lg border p-2"
                  value={relatedTo}
                  onChange={(e) => setRelatedTo(e.target.value as RelatedTo)}
                >
                  {relatedOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <div className="text-sm text-gray-700">Хугацааны хүрээ</div>
                <select
                  className="w-full rounded-lg border p-2"
                  value={timeHorizon}
                  onChange={(e) => setTimeHorizon(e.target.value as TimeHorizon)}
                >
                  {horizonOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <div className="text-sm text-gray-700">Өдөрт хэдэн цаг гаргаж чадна?</div>
                <select
                  className="w-full rounded-lg border p-2"
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(e.target.value as DailyBudget)}
                >
                  {budgetOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="text-xs text-gray-500">
              Энэ сонголтууд зорилгыг чинь цэгцлэхэд тусална.
            </div>
          </div>

          {/* Writing block */}
          <div className="rounded-xl border bg-white p-4 space-y-3">
            <div className="font-medium">Зорилго бичих</div>

            <label className="space-y-1 block">
              <div className="text-sm text-gray-700">Зорилго (1 өгүүлбэрээр)</div>
              <input
                className="w-full rounded-lg border p-2"
                placeholder="Ж: 30 кг хасах / Англи хэлээ сайжруулах / Бизнес эхлүүлэх…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>

            <label className="space-y-1 block">
              <div className="text-sm text-gray-700">Тайлбар (заавал биш)</div>
              <textarea
                className="w-full rounded-lg border p-2 min-h-[88px]"
                placeholder="Яагаад энэ чухал вэ? юуг өөрчлөмөөр байна?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>

            <div className="flex items-center gap-2">
              <button
                onClick={addGoal}
                disabled={!canAdd}
                className="rounded-lg px-4 py-2 text-white disabled:opacity-50"
                style={{ backgroundColor: BRAND }}
              >
                Хадгалах (file үүсгэх)
              </button>
              <div className="text-xs text-gray-500">
                Хадгалмагц доор жагсаалт үүсээд бичих хэсэг цэвэрлэгдэнэ.
              </div>
            </div>
          </div>

          {/* Files list */}
          <div className="rounded-xl border bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">Миний зорилгууд (files)</div>
              <div className="text-xs text-gray-500">Нийт: {goals.length}</div>
            </div>

            {goals.length === 0 ? (
              <div className="text-sm text-gray-500">
                Одоогоор файл байхгүй. Дээрээс зорилгоо бичээд “Хадгалах” дар.
              </div>
            ) : (
              <div className="space-y-3">
                {goals.map((g) => (
                  <div key={g.id} className="rounded-xl border p-3 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <input
                          className="w-full font-medium rounded-lg border p-2"
                          value={g.title}
                          onChange={(e) => updateGoal(g.id, { title: e.target.value })}
                        />
                        {g.note !== "" && (
                          <textarea
                            className="mt-2 w-full rounded-lg border p-2 text-sm"
                            value={g.note}
                            onChange={(e) => updateGoal(g.id, { note: e.target.value })}
                          />
                        )}
                      </div>

                      <button
                        onClick={() => removeGoal(g.id)}
                        className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                        title="Устгах"
                      >
                        🗑
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <select
                        className="w-full rounded-lg border p-2 text-sm"
                        value={g.category}
                        onChange={(e) => updateGoal(g.id, { category: e.target.value as Category })}
                      >
                        {categoryOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>

                      <select
                        className="w-full rounded-lg border p-2 text-sm"
                        value={g.relatedTo}
                        onChange={(e) => updateGoal(g.id, { relatedTo: e.target.value as RelatedTo })}
                      >
                        {relatedOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>

                      <select
                        className="w-full rounded-lg border p-2 text-sm"
                        value={g.timeHorizon}
                        onChange={(e) => updateGoal(g.id, { timeHorizon: e.target.value as TimeHorizon })}
                      >
                        {horizonOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>

                      <select
                        className="w-full rounded-lg border p-2 text-sm"
                        value={g.dailyBudget}
                        onChange={(e) => updateGoal(g.id, { dailyBudget: e.target.value as DailyBudget })}
                      >
                        {budgetOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Calculate button */}
            <div className="pt-2">
              <button
                onClick={onCalculate}
                disabled={goals.length === 0}
                className="w-full rounded-lg px-4 py-3 text-white disabled:opacity-50"
                style={{ backgroundColor: BRAND }}
              >
                🧠 Бүгдийг тооцоолж цэгцлэх
              </button>
              <div className="mt-2 text-xs text-gray-500">
                Дараагийн алхамд энэ товч Supabase + Oyunsanaa руу явж “хүснэгтээр цэгцэлсэн” дэлгэц гаргана.
              </div>
            </div>
          </div>
        </div>

        {/* Right: Budget summary */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border bg-white p-4 space-y-2">
            <div className="font-medium">⏱ Миний цагны төсөв</div>
            <div className="text-sm text-gray-700">
              Өдөрт: <span className="font-semibold">{budgetOptions.find((b) => b.value === dailyBudget)?.label}</span>
            </div>
            <div className="text-sm text-gray-700">
              7 хоногт: <span className="font-semibold">{Math.round(totalWeeklyMinutes / 60 * 10) / 10} цаг</span>
            </div>
            <div className="text-sm text-gray-700">
              1 сард: <span className="font-semibold">{Math.round(totalMonthlyMinutes / 60)} цаг</span>
            </div>
            <div className="text-xs text-gray-500">
              (Энэ бол ойролцооны тооцоо — зорилгуудыг бодитоор “цэгцлэх” үед илүү нарийсна.)
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 space-y-2">
            <div className="font-medium">Яаж ажиллах вэ?</div>
            <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
              <li>Сонголтоо хий</li>
              <li>Зорилго бичээд хадгал → “file” болж нэмэгдэнэ</li>
              <li>“Бүгдийг тооцоолж цэгцлэх” → хүснэгтээр гарна</li>
              <li>Хасах/үлдээх → Батлах → Өдөр бүр тэмдэглэх</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
