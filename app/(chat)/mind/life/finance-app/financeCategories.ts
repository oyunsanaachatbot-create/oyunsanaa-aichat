import type { CategoryId, SubOpt, TransactionType } from "./financeTypes";

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  food: "Хоол, хүнс",
  transport: "Тээвэр",
  clothes: "Хувцас",
  home: "Гэр, хэрэглээ",
  fun: "Зугаа, чөлөөт цаг",
  health: "Эрүүл мэнд",
  other: "Бусад",
  income: "Орлого",
  debt: "Өр / Зээл",
  saving: "Хадгаламж",
};

// ✅ subCategory options by category
export const SUBCATEGORY_OPTIONS: Record<CategoryId, SubOpt[]> = {
  // expense subs
  food: [
    { id: "food_meat", label: "Мах" },
    { id: "food_veg", label: "Ногоо/жимс" },
    { id: "food_drink", label: "Ундаа/кофе" },
    { id: "food_other", label: "Бусад" },
  ],
  transport: [
    { id: "transport_taxi", label: "Такси" },
    { id: "transport_fuel", label: "Шатахуун" },
    { id: "transport_other", label: "Бусад" },
  ],
  clothes: [
    { id: "clothes_outer", label: "Гадуур" },
    { id: "clothes_shoes", label: "Гутал" },
    { id: "clothes_other", label: "Бусад" },
  ],
  home: [
    { id: "home_cleaning", label: "Цэвэрлэгээ" },
    { id: "home_repair", label: "Засвар" },
    { id: "home_other", label: "Бусад" },
  ],
  fun: [
    { id: "fun_cafe", label: "Кафе/ресторан" },
    { id: "fun_trip", label: "Аялал" },
    { id: "fun_other", label: "Бусад" },
  ],
  health: [
    { id: "health_medicine", label: "Эм" },
    { id: "health_clinic", label: "Эмч/эмнэлэг" },
    { id: "health_other", label: "Бусад" },
  ],
  other: [{ id: "other_other", label: "Бусад" }],

  // income subs
  income: [
    { id: "income_salary", label: "Цалин" },
    { id: "income_bonus", label: "Бонус" },
    { id: "income_business", label: "Бизнес" },
    { id: "income_other", label: "Бусад" },
  ],

  // ✅ debt subs = action (DB sub_category)
  debt: [
    { id: "debt_borrow", label: "Зээл авсан" },
    { id: "debt_repay", label: "Зээл төлсөн" },
  ],

  // ✅ saving subs = action (DB sub_category)
  saving: [
    { id: "saving_deposit", label: "Хадгаламж хийсэн" },
    { id: "saving_withdraw", label: "Хадгаламжаас авсан" },
  ],
};

export function categoriesForType(type: TransactionType): CategoryId[] {
  if (type === "income") return ["income"];
  if (type === "debt") return ["debt"];
  if (type === "saving") return ["saving"];
  return ["food", "transport", "clothes", "home", "fun", "health", "other"];
}

// ✅ loan type list (UI-д л ашиглана, DB-д note дээр prefix болгоно)
export const LOAN_TYPE_OPTIONS: SubOpt[] = [
  { id: "loan_salary", label: "Цалингийн зээл" },
  { id: "loan_mortgage", label: "Ипотек" },
  { id: "loan_leasing", label: "Лизинг" },
  { id: "loan_app", label: "Апп зээл" },
  { id: "loan_personal", label: "Хувь хүн" },
  { id: "loan_other", label: "Бусад" },
];

// ✅ saving goal list (UI-д л ашиглана, DB-д note дээр prefix болгоно)
export const SAVING_GOAL_OPTIONS: SubOpt[] = [
  { id: "saving_emergency", label: "Эрсдэлд хадгалах мөнгө" },
  { id: "saving_trip", label: "Аялал" },
  { id: "saving_family", label: "Гэр бүл" },
  { id: "saving_home", label: "Гэр / байр" },
  { id: "saving_kids", label: "Хүүхэд" },
  { id: "saving_other", label: "Бусад" },
];

export function subLabel(id?: string | null): string {
  if (!id) return "";
  for (const cat of Object.keys(SUBCATEGORY_OPTIONS) as CategoryId[]) {
    const opt = (SUBCATEGORY_OPTIONS[cat] || []).find((s) => s.id === id);
    if (opt) return opt.label;
  }
  const all = [...LOAN_TYPE_OPTIONS, ...SAVING_GOAL_OPTIONS].find((x) => x.id === id);
  return all?.label ?? id;
}
