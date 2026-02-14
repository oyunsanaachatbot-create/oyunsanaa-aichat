"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// ----------------- ТӨРЛҮҮД -----------------

// Хүнсний дэд төрөл
export type FoodSubCategory =
  | "veg"
  | "meat"
  | "grain"
  | "dairy"
  | "snack"
  | "drink"
  | "other_food"
  | "";

// Барааны төрөл
export type FinanceItem = {
  name: string;
  quantity: number | null;
  unit_price: number | null;
  total_price: number | null;
  category: "food" | "home" | "health" | "fun" | "other" | "";
  sub_category?: FoodSubCategory;
};

export type FinanceReceiptData = {
  store: string | null;
  date: string | null; // "YYYY-MM-DD" эсвэл null
  total_amount: number | null;
  items: FinanceItem[];
};

// ----------------- ТОГТМОЛУУД -----------------

// Хүнсний дэд төрлийн сонголтууд
const FOOD_SUBCATEGORY_LABELS: {
  id: Exclude<FoodSubCategory, "">;
  label: string;
}[] = [
  { id: "veg", label: "Ногоо / жимс" },
  { id: "meat", label: "Мах / махан бүтээгдэхүүн" },
  { id: "grain", label: "Гурил / будаа" },
  { id: "dairy", label: "Сүү / цагаан идээ" },
  { id: "snack", label: "Амттан / зууш" },
  { id: "drink", label: "Ундаа / кофе" },
  { id: "other_food", label: "Бусад хүнс" },
];

// Нэрээс нь дэд ангилал таах
function detectFoodSubCategory(name: string): FoodSubCategory {
  const text = name.toLowerCase();

  // Ногоо / жимс
  const vegWords = [
    "ногоо",
    "жимс",
    "салад",
    "лууван",
    "төмс",
    "байцаа",
    "огурц",
    "огурци",
    "огурчик",
  ];

  // Мах / махан бүтээгдэхүүн
  const meatWords = [
    "мах",
    "тахиа",
    "тахианы",
    "үхэр",
    "үхрийн",
    "хонины",
    "хуушуур",
    "мантуу",
  ];

  // Гурил / будаа
  const grainWords = [
    "гурил",
    "будаа",
    "талх",
    "боов",
    "боорцог",
    "гурилан",
    "гоймон",
    "лаазан гоймон",
  ];

  // Сүү / цагаан идээ
  const dairyWords = [
    "сүү",
    "тараг",
    "аарц",
    "айраг",
    "йогурт",
    "yogurt",
    "цөцгий",
    "бяслаг",
  ];

  // Амттан
  const snackWords = [
    "чипс",
    "печень",
    "жигнэмэг",
    "чоколад",
    "шоколад",
    "чоко",
    "сникерс",
    "mars",
    "snickers",
    "чанамал",
  ];

  // Ундаа
  const drinkWords = [
    "ундаа",
    "cola",
    "кола",
    "кофе",
    "latte",
    "латте",
    "цай",
    "чай",
    "ус",
    "juice",
    "жүүc",
    "жүүс",
  ];

  const hasAny = (words: string[]) => words.some((w) => text.includes(w));

  if (hasAny(vegWords)) return "veg";
  if (hasAny(meatWords)) return "meat";
  if (hasAny(grainWords)) return "grain";
  if (hasAny(dairyWords)) return "dairy";
  if (hasAny(snackWords)) return "snack";
  if (hasAny(drinkWords)) return "drink";

  return "other_food";
}

// FinanceApp-ын transactions.category-тай таарах төрөл
type DbCategoryId =
  | "food"
  | "transport"
  | "clothes"
  | "home"
  | "fun"
  | "health"
  | "other";

function mapToDbCategory(cat: FinanceItem["category"]): DbCategoryId {
  switch (cat) {
    case "food":
      return "food";
    case "home":
      return "home";
    case "health":
      return "health";
    case "fun":
      return "fun";
    case "other":
    case "":
    default:
      return "other";
  }
}

// ----------------- КОМПОНЕНТ -----------------

export default function FinanceReceiptCard({
  data,
  originalText,
}: {
  data: FinanceReceiptData;
  originalText: string;
}) {
  // Эхний items дээр нь дэд ангиллыг автоматаар бөглөе
  const [items, setItems] = useState<FinanceItem[]>(() => {
    const src = data.items ?? [];
    return src.map((it) => {
      let sub: FoodSubCategory =
        (it.sub_category as FoodSubCategory | undefined) ?? "";

      if (it.category === "food" && !sub) {
        sub = detectFoodSubCategory(it.name || "");
      }
      if (it.category !== "food") {
        sub = "";
      }

      return { ...it, sub_category: sub };
    });
  });

  const [meta, setMeta] = useState<{
    store: string;
    date: string;
    total_amount: number | null;
  }>({
    store: data.store ?? "",
    date: data.date ?? "",
    total_amount: data.total_amount ?? null,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // FINANCE_HUMAN, FINANCE_JSON tag-уудыг текстээс цэвэрлэнэ
  const cleanedOriginalText =
    (originalText || "")
      .replace(/<FINANCE_JSON>[\s\S]*?<\/FINANCE_JSON>/g, "")
      .replace(/<\/?FINANCE_HUMAN>/g, "")
      .trim();

  // Бүх мөрийн нийт үнийн нийлбэр
  const recomputeTotalAmount = (list: FinanceItem[]): number | null => {
    const sum = list.reduce((acc, it) => {
      if (typeof it.total_price === "number") {
        return acc + it.total_price;
      }
      return acc;
    }, 0);

    return sum === 0 ? null : sum;
  };

  // ---------- туслах функцүүд ----------

  const updateItemField = (
    idx: number,
    field: keyof FinanceItem,
    value: string,
  ) => {
    const copy = [...items];
    const item = { ...copy[idx] };

    switch (field) {
      case "name":
        item.name = value;
        if (item.category === "food") {
          item.sub_category = detectFoodSubCategory(value);
        }
        break;

      case "category":
        item.category = value as FinanceItem["category"];
        if (item.category !== "food") {
          item.sub_category = "";
        } else if (!item.sub_category) {
          item.sub_category = detectFoodSubCategory(item.name || "");
        }
        break;

      case "sub_category":
        item.sub_category = value as FoodSubCategory;
        break;

      case "quantity":
      case "unit_price":
      case "total_price": {
        if (value === "") {
          item[field] = null;
        } else {
          const num = Number(value.replace(/[^\d.-]/g, ""));
          item[field] = Number.isNaN(num) ? null : num;
        }

        // qty + unit_price байвал мөрийн нийт үнийг автоматаар тооцъё
        if (
          (field === "quantity" || field === "unit_price") &&
          typeof item.quantity === "number" &&
          typeof item.unit_price === "number"
        ) {
          const total = item.quantity * item.unit_price;
          item.total_price = isFinite(total) ? Math.round(total) : item.total_price;
        }
        break;
      }

      default:
        break;
    }

    copy[idx] = item;
    const newTotal = recomputeTotalAmount(copy);

    setItems(copy);
    setMeta((prev) => ({
      ...prev,
      total_amount: newTotal,
    }));
    setSaved(false);
  };

  const updateMetaField = (
    field: "store" | "date" | "total_amount",
    value: string,
  ) => {
    setMeta((prev) => {
      if (field === "total_amount") {
        if (value === "") {
          return { ...prev, total_amount: null };
        }
        const num = Number(value.replace(/[^\d.-]/g, ""));
        return {
          ...prev,
          total_amount: Number.isNaN(num) ? prev.total_amount : num,
        };
      }

      return { ...prev, [field]: value };
    });
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSaved(false);

      // 1) Нийт дүнг хүснэгтээс дахин тооцъё (аюулгүй байхын тулд)
      const totalFromItems =
        recomputeTotalAmount(items) ?? meta.total_amount ?? null;

      // 2) Одоогийн хэрэглэгч
     // 2) Одоогийн хэрэглэгч (auth байхгүй байж болно)
const { data: userInfo } = await supabase.auth.getUser();
const userId = userInfo?.user?.id ?? null;
      if (!userId) {
  throw new Error("Нэвтрээгүй байна. Дахин Login хийгээд дахин оролдоорой.");
}

      // 3) Бараа бүрийг transactions мөр болгоно
      const date =
        meta.date || new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const storeName = meta.store || "";

      const rows = items
        .filter(
          (it) =>
            typeof it.total_price === "number" && (it.total_price as number) > 0,
        )
        .map((it) => ({
          user_id: userId,
          type: "expense" as const,
          amount: it.total_price as number,
          category: mapToDbCategory(it.category),
          date,
          note: `${storeName ? storeName + " – " : ""}${it.name}`,
          source: "receipt",
          raw_text: originalText || "",
        }));

      if (rows.length === 0) {
        throw new Error("Хадгалах барааны мөр алга байна.");
      }

      const { error: insertError } = await supabase
        .from("transactions")
        .insert(rows);

      if (insertError) {
        throw insertError;
      }

      // 4) Амжилттай — нийт дүнг meta дээр sync хийнэ
      setMeta((prev) => ({
        ...prev,
        total_amount: totalFromItems,
      }));

      setSaved(true);
    } catch (e) {
      const err = e as Error;
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ---------- UI ----------

  return (
    <div className="mx-auto my-2 w-full max-w-4xl rounded-2xl border bg-white/80 p-4 shadow-sm backdrop-blur md:p-5">
      {/* Хүний унших товч тайлан (эвхэгддэг) */}
      {cleanedOriginalText && (
        <details className="mb-4 rounded-lg bg-slate-50/80 px-3 py-2 text-xs leading-relaxed">
          <summary className="cursor-pointer text-[11px] font-semibold text-slate-700">
            🧾 Баримтын товч тайлбар
          </summary>
          <div className="mt-1 whitespace-pre-wrap text-[11px] text-slate-700">
            {cleanedOriginalText}
          </div>
        </details>
      )}

      {/* Дэлгүүр, огноо, нийт дүн засах хэсэг */}
      <div className="mb-4 grid gap-3 text-xs md:grid-cols-3">
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Дэлгүүр / байгууллага</span>
          <input
            className="rounded-md border px-2 py-1 text-xs"
            value={meta.store}
            onChange={(e) => updateMetaField("store", e.target.value)}
            placeholder="E-mart, Emart Mall зэрэг"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Огноо</span>
          <input
            type="date"
            className="rounded-md border px-2 py-1 text-xs"
            value={meta.date}
            onChange={(e) => updateMetaField("date", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Нийт дүн (₮)</span>
          <input
            className="rounded-md border px-2 py-1 text-xs"
            value={meta.total_amount ?? ""}
            onChange={(e) => updateMetaField("total_amount", e.target.value)}
            placeholder="362012"
          />
          <span className="text-[10px] text-slate-500">
            Хүснэгт доторх “Нийт үнэ” болон тоо/нэгж үнийг өөрчлөхөд эндхийг
            автоматаар дахин тооцно.
          </span>
        </div>
      </div>

      {/* Барааны хүснэгт */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[11px] md:text-xs">
          <thead>
            <tr className="border-b bg-slate-50 text-[11px] font-semibold">
              <th className="px-2 py-1 text-left">Барааны нэр</th>
              <th className="px-2 py-1 text-right">Тоо</th>
              <th className="px-2 py-1 text-right">Нэгж үнэ</th>
              <th className="px-2 py-1 text-right">Нийт үнэ</th>
              <th className="px-2 py-1 text-left">Төрөл</th>
              <th className="px-2 py-1 text-left">Дэд төрөл</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, index) => (
              <tr key={index} className="border-b last:border-0">
                <td className="px-2 py-1 align-top">
                  <input
                    className="w-full border-none bg-transparent text-[11px] outline-none md:text-xs"
                    value={it.name}
                    onChange={(e) =>
                      updateItemField(index, "name", e.target.value)
                    }
                  />
                </td>
                <td className="px-2 py-1 text-right align-top">
                  <input
                    className="w-16 border-none bg-transparent text-right text-[11px] outline-none md:text-xs"
                    value={it.quantity ?? ""}
                    onChange={(e) =>
                      updateItemField(index, "quantity", e.target.value)
                    }
                  />
                </td>
                <td className="px-2 py-1 text-right align-top">
                  <input
                    className="w-20 border-none bg-transparent text-right text-[11px] outline-none md:text-xs"
                    value={it.unit_price ?? ""}
                    onChange={(e) =>
                      updateItemField(index, "unit_price", e.target.value)
                    }
                  />
                </td>
                <td className="px-2 py-1 text-right align-top">
                  <input
                    className="w-24 border-none bg-transparent text-right text-[11px] outline-none md:text-xs"
                    value={it.total_price ?? ""}
                    onChange={(e) =>
                      updateItemField(index, "total_price", e.target.value)
                    }
                  />
                </td>
                <td className="px-2 py-1 align-top">
                  <select
                    className="w-full border-none bg-transparent text-[11px] outline-none md:text-xs"
                    value={it.category ?? ""}
                    onChange={(e) =>
                      updateItemField(index, "category", e.target.value)
                    }
                  >
                    <option value="">–</option>
                    <option value="food">Хүнс</option>
                    <option value="home">Гэр ахуй</option>
                    <option value="health">Эрүүл мэнд</option>
                    <option value="fun">Зугаа, чөлөөт цаг</option>
                    <option value="other">Бусад</option>
                  </select>
                </td>
                <td className="px-2 py-1 align-top">
                  {it.category === "food" ? (
                    <select
                      className="w-full border-none bg-transparent text-[11px] outline-none md:text-xs"
                      value={it.sub_category ?? ""}
                      onChange={(e) =>
                        updateItemField(index, "sub_category", e.target.value)
                      }
                    >
                      <option value="">–</option>
                      {FOOD_SUBCATEGORY_LABELS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-[11px] text-slate-400">–</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Доод талын товчнууд */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-col gap-1">
          {error && (
            <span className="text-[11px] text-red-500">
              {error}
            </span>
          )}
          {saved && !error && (
            <span className="text-[11px] text-emerald-600">
              Санхүүгийн тайланд амжилттай хадгаллаа ✅
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-70"
        >
          {saving ? "Хадгалж байна…" : "📥 Тайланд хадгалах"}
        </button>
      </div>
    </div>
  );
}
