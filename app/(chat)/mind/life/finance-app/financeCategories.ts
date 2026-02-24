import type { CategoryId, SubOpt, TransactionType } from "./financeTypes";

/** Категори нэрс */
export const CATEGORY_LABELS: Record<CategoryId, string> = {
  food: "Хоол, хүнс",
  transport: "Тээвэр",
  clothes: "Хувцас",
  home: "Гэр, хэрэглээ",
  fun: "Зугаа, чөлөөт цаг",
  health: "Эрүүл мэнд",
  other: "Бусад",

  income: "Орлого",

  debt_borrow: "Зээл авах",
  debt_repay: "Зээл төлөх",

  saving_add: "Хадгаламж хийх",
  saving_withdraw: "Хадгаламжаас авах",
};

/** Дэд ангиллын сонголтууд (category-оор) */
export const SUBCATEGORY_OPTIONS: Partial<Record<CategoryId, SubOpt[]>> = {
  // income sub
  income: [
    { id: "income_salary", label: "Цалин" },
    { id: "income_bonus", label: "Бонус" },
    { id: "income_gift", label: "Бэлэг / тусламж" },
    { id: "income_other", label: "Бусад орлого" },
  ],

  // debt: loan type
  debt_borrow: [
    { id: "loan_mortgage", label: "Ипотек" },
    { id: "loan_leasing", label: "Лизинг" },
    { id: "loan_app", label: "Апп/ББСБ зээл" },
    { id: "loan_salary", label: "Цалингийн зээл" },
    { id: "loan_person", label: "Хувь хүн" },
    { id: "loan_other", label: "Бусад" },
  ],
  debt_repay: [
    { id: "loan_mortgage", label: "Ипотек" },
    { id: "loan_leasing", label: "Лизинг" },
    { id: "loan_app", label: "Апп/ББСБ зээл" },
    { id: "loan_salary", label: "Цалингийн зээл" },
    { id: "loan_person", label: "Хувь хүн" },
    { id: "loan_other", label: "Бусад" },
  ],

  // saving: goal type
  saving_add: [
    { id: "saving_risk", label: "Эрсдэлд хадгалах мөнгө" }, // ✅ заавал
    { id: "saving_travel", label: "Аялал" },
    { id: "saving_family", label: "Гэр бүл" },
    { id: "saving_home", label: "Орон байр/гэр" },
    { id: "saving_health", label: "Эрүүл мэнд" },
    { id: "saving_other", label: "Бусад" },
  ],
  saving_withdraw: [
    { id: "saving_risk", label: "Эрсдэлд хадгалах мөнгө" },
    { id: "saving_travel", label: "Аялал" },
    { id: "saving_family", label: "Гэр бүл" },
    { id: "saving_home", label: "Орон байр/гэр" },
    { id: "saving_health", label: "Эрүүл мэнд" },
    { id: "saving_other", label: "Бусад" },
  ],

  // expense sub (жишээ)
  food: [
    { id: "food_grocery", label: "Хүнс" },
    { id: "food_cafe", label: "Кафе/Ресторан" },
    { id: "food_other", label: "Бусад" },
  ],
  transport: [
    { id: "transport_taxi", label: "Такси" },
    { id: "transport_bus", label: "Нийтийн тээвэр" },
    { id: "transport_fuel", label: "Түлш" },
    { id: "transport_other", label: "Бусад" },
  ],
};

export function categoriesForType(type: TransactionType): CategoryId[] {
  if (type === "income") return ["income"];
  if (type === "debt") return ["debt_borrow", "debt_repay"];
  if (type === "saving") return ["saving_add", "saving_withdraw"];
  // expense
  return ["food", "transport", "clothes", "home", "fun", "health", "other"];
}

/** subCategory id -> label */
export function subLabel(id?: string | null): string {
  if (!id) return "";
  const all = Object.values(SUBCATEGORY_OPTIONS).flat().filter(Boolean) as SubOpt[];
  const hit = all.find((x) => x.id === id);
  return hit?.label ?? id;
}
